/**
 * Parser de recettes depuis des vidéos YouTube
 *
 * Stratégie :
 * 1. Extraire la description de la vidéo (contient souvent la recette)
 * 2. Envoyer à l'IA pour extraction
 * 3. Si résultat incomplet (pas d'ingrédients), chercher un lien recette
 *    dans la description et parser le site web lié
 */

import type { ParseResult } from './types'
import { parseRecipeWithAI, parseRecipeFromHtmlWithAI } from './ai-parser'
import { parseRecipeFromHtml } from './url-parser'

// Cookie pour bypasser la page de consentement GDPR YouTube
const CONSENT_COOKIE =
  'SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODE1LjA3X3AxGgJmciACGgYIgJneBhAC'

/**
 * Détecter si une URL est une vidéo YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'm.youtube.com' ||
      parsed.hostname === 'youtu.be'
    )
  } catch {
    return false
  }
}

/**
 * Extraire l'ID de la vidéo depuis une URL YouTube
 */
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Format youtu.be/VIDEO_ID
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null
    }
    // Format youtube.com/watch?v=VIDEO_ID
    return parsed.searchParams.get('v')
  } catch {
    return null
  }
}

/**
 * Extraire la description et les infos de sous-titres depuis le HTML YouTube
 */
function extractVideoData(html: string): {
  title: string
  description: string
  captionUrls: { lang: string; url: string }[]
  thumbnailUrl?: string
} {
  const result = {
    title: '',
    description: '',
    captionUrls: [] as { lang: string; url: string }[],
    thumbnailUrl: undefined as string | undefined,
  }

  // Extraire le titre
  const titleMatch = html.match(/"title":"(.*?)"/)
  if (titleMatch) {
    result.title = titleMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
  }

  // Extraire la description
  const descMatch = html.match(/"shortDescription":"(.*?)(?<!\\)"/)
  if (descMatch) {
    result.description = descMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\u0026/g, '&')
  }

  // Extraire les pistes de sous-titres
  const captionsMatch = html.match(/"captionTracks":\[(.*?)\]/)
  if (captionsMatch) {
    const langs = [...captionsMatch[1].matchAll(/"languageCode":"(.*?)"/g)].map(m => m[1])
    const urls = [...captionsMatch[1].matchAll(/"baseUrl":"(.*?)"/g)].map(m =>
      m[1].replace(/\\u0026/g, '&')
    )

    for (let i = 0; i < langs.length && i < urls.length; i++) {
      result.captionUrls.push({ lang: langs[i], url: urls[i] })
    }
  }

  // Extraire la miniature
  const thumbMatch = html.match(/"thumbnail":\{"thumbnails":\[.*?\{"url":"(https:\/\/i\.ytimg\.com\/vi\/[^"]+)"/)
  if (thumbMatch) {
    result.thumbnailUrl = thumbMatch[1].replace(/\\u0026/g, '&')
  }

  return result
}

/**
 * Extraire les URLs de sites de recettes depuis la description YouTube
 * Ignore les liens YouTube, réseaux sociaux, etc.
 */
function extractRecipeLinks(description: string): string[] {
  const urlRegex = /https?:\/\/[^\s"<>)]+/g
  const allUrls = description.match(urlRegex) || []

  // Domaines à ignorer (réseaux sociaux, YouTube, raccourcisseurs non-recette)
  const ignoredDomains = [
    'youtube.com', 'youtu.be', 'bit.ly', 'goo.gl',
    'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com',
    'pinterest.com', 'amazon.com', 'amzn.to',
  ]

  return allUrls.filter(url => {
    try {
      const parsed = new URL(url)
      return !ignoredDomains.some(d => parsed.hostname.includes(d))
    } catch {
      return false
    }
  })
}

/**
 * Suivre un lien de recette et parser le site web
 */
async function fetchAndParseRecipeLink(recipeUrl: string): Promise<ParseResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(recipeUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) return { success: false, error: 'Lien inaccessible' }

    const buffer = await response.arrayBuffer()
    let html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)

    // Vérifier meta charset non-UTF-8
    const metaCharsetMatch = html.match(/<meta[^>]+charset=["']?([^"'\s;>]+)/i)
    if (metaCharsetMatch && metaCharsetMatch[1].toLowerCase() !== 'utf-8') {
      try {
        html = new TextDecoder(metaCharsetMatch[1], { fatal: false }).decode(buffer)
      } catch { /* garder UTF-8 */ }
    }

    // Essayer JSON-LD d'abord
    const jsonLdResult = parseRecipeFromHtml(html, recipeUrl)
    if (jsonLdResult.success && jsonLdResult.recipe?.ingredients_text && jsonLdResult.recipe?.steps_text) {
      return jsonLdResult
    }

    // Fallback IA
    return await parseRecipeFromHtmlWithAI(html, recipeUrl)
  } catch {
    return { success: false, error: 'Erreur lors du parsing du lien' }
  }
}

/**
 * Parser principal : extraire une recette depuis une URL YouTube
 */
export async function parseRecipeFromYouTube(url: string): Promise<ParseResult> {
  const videoId = extractVideoId(url)
  if (!videoId) {
    return { success: false, error: 'URL YouTube invalide' }
  }

  // Fetch la page YouTube avec cookie de consentement GDPR
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  let html: string
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': CONSENT_COOKIE,
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return { success: false, error: `YouTube a répondu avec une erreur (${response.status})` }
    }

    html = await response.text()
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'YouTube met trop de temps à répondre' }
    }
    return { success: false, error: 'Impossible d\'accéder à YouTube' }
  }

  // Vérifier qu'on n'est pas sur une page de consentement
  if (!html.includes('ytInitialPlayerResponse') && !html.includes('shortDescription')) {
    return {
      success: false,
      error: 'Impossible de lire la vidéo YouTube. Essayez de copier-coller la description de la vidéo dans l\'onglet "Texte".',
    }
  }

  // Extraire les données de la vidéo
  const videoData = extractVideoData(html)

  if (!videoData.title && !videoData.description) {
    return {
      success: false,
      error: 'Impossible d\'extraire les informations de cette vidéo. Essayez de copier-coller la description dans l\'onglet "Texte".',
    }
  }

  // Étape 1 : Essayer de parser la description directement avec l'IA
  let textForAI = ''
  if (videoData.description) {
    textForAI = `Titre de la vidéo : ${videoData.title}\n\nDescription de la vidéo :\n${videoData.description}`
  }

  if (textForAI.trim()) {
    const result = await parseRecipeWithAI(textForAI)

    // Si le parsing a réussi avec des ingrédients, c'est bon
    if (result.success && result.recipe?.ingredients_text) {
      result.recipe.source_type = 'url'
      result.recipe.source_url = url
      if (videoData.thumbnailUrl) {
        result.recipe.image_url = videoData.thumbnailUrl
      }
      return result
    }
  }

  // Étape 2 : La description ne contient pas la recette complète
  // Chercher un lien vers un site de recettes dans la description
  const recipeLinks = extractRecipeLinks(videoData.description)

  for (const recipeLink of recipeLinks) {
    const linkResult = await fetchAndParseRecipeLink(recipeLink)
    if (linkResult.success && linkResult.recipe?.ingredients_text) {
      // Utiliser le titre YouTube si le parsing du site n'a pas trouvé de titre
      if (!linkResult.recipe.title && videoData.title) {
        linkResult.recipe.title = videoData.title
      }
      linkResult.recipe.source_type = 'url'
      linkResult.recipe.source_url = url
      if (videoData.thumbnailUrl && !linkResult.recipe.image_url) {
        linkResult.recipe.image_url = videoData.thumbnailUrl
      }
      return linkResult
    }
  }

  // Étape 3 : Rien n'a fonctionné
  return {
    success: false,
    error: 'Impossible d\'extraire la recette de cette vidéo. La description ne contient pas assez d\'informations. Essayez de copier-coller la recette dans l\'onglet "Texte".',
  }
}
