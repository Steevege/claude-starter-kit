/**
 * Route API pour parser une recette depuis une URL, du texte ou une photo
 *
 * POST /api/parse-recipe
 * Body :
 *   - { url: string } ou { mode: 'url', url: string } : parsing URL (JSON-LD + fallback IA)
 *   - { mode: 'text', text: string } : parsing texte via IA
 *   - { mode: 'photo', image: string, mediaType: string } : parsing photo via Vision
 * Response : ParseResult
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseRecipeFromHtml } from '@/lib/parsers/url-parser'
import {
  parseRecipeWithAI,
  parseRecipeFromImage,
  parseRecipeFromHtmlWithAI,
} from '@/lib/parsers/ai-parser'

// Timeout étendu pour les appels IA (Vercel)
export const maxDuration = 30

interface RequestBody {
  mode?: 'url' | 'text' | 'photo'
  url?: string
  text?: string
  image?: string
  mediaType?: string
}

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié' },
      { status: 401 }
    )
  }

  // Lire le body
  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body JSON invalide' },
      { status: 400 }
    )
  }

  // Déterminer le mode (rétrocompatible : { url } sans mode → mode 'url')
  const mode = body.mode || (body.url ? 'url' : undefined)

  if (!mode) {
    return NextResponse.json(
      { success: false, error: 'Mode requis (url, text ou photo)' },
      { status: 400 }
    )
  }

  // === Mode TEXTE : parsing IA direct ===
  if (mode === 'text') {
    const { text } = body
    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Texte requis' },
        { status: 400 }
      )
    }
    const result = await parseRecipeWithAI(text)
    return NextResponse.json(result)
  }

  // === Mode PHOTO : parsing Vision ===
  if (mode === 'photo') {
    const { image, mediaType } = body
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image requise (base64)' },
        { status: 400 }
      )
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
    const mType = (validTypes.includes(mediaType as typeof validTypes[number])
      ? mediaType
      : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    const result = await parseRecipeFromImage(image, mType)
    return NextResponse.json(result)
  }

  // === Mode URL : JSON-LD + fallback IA ===
  const { url } = body
  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL requise' },
      { status: 400 }
    )
  }

  // Valider l'URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Protocole invalide')
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'URL invalide. Vérifiez le format (ex: https://www.marmiton.org/...)' },
      { status: 400 }
    )
  }

  // Fetch la page avec timeout
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Le site a répondu avec une erreur (${response.status}). Essayez de copier-coller le texte de la recette.` },
        { status: 422 }
      )
    }

    const html = await response.text()

    // Essayer d'abord le parsing JSON-LD déterministe
    const result = parseRecipeFromHtml(html, parsedUrl.toString())

    // Si le parsing JSON-LD a réussi avec des données complètes, retourner
    if (result.success && result.recipe &&
        result.recipe.ingredients_text && result.recipe.steps_text) {
      return NextResponse.json(result)
    }

    // Sinon, fallback IA si la clé est configurée
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'REMPLACEZ_PAR_VOTRE_CLE') {
      const aiResult = await parseRecipeFromHtmlWithAI(html, parsedUrl.toString())
      if (aiResult.success) {
        return NextResponse.json(aiResult)
      }
    }

    // Retourner le résultat partiel du parsing déterministe
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Le site met trop de temps à répondre (>10s). Essayez de copier-coller le texte de la recette.' },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Impossible d\'accéder à cette URL. Essayez de copier-coller le texte de la recette.' },
      { status: 422 }
    )
  }
}
