/**
 * Route API pour parser une recette depuis une URL
 *
 * POST /api/parse-recipe
 * Body : { url: string }
 * Response : ParseResult
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseRecipeFromHtml } from '@/lib/parsers/url-parser'

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
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body JSON invalide' },
      { status: 400 }
    )
  }

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
    const result = parseRecipeFromHtml(html, parsedUrl.toString())

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
