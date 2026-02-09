/**
 * Parser de recettes depuis des vidéos YouTube
 *
 * Stratégie :
 * 1. Extraire la description de la vidéo (contient souvent la recette)
 * 2. Extraire les sous-titres FR (ou EN en fallback)
 * 3. Combiner description + sous-titres et envoyer à l'IA
 */

import type { ParseResult } from './types'
import { parseRecipeWithAI } from './ai-parser'

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
 * Récupérer les sous-titres depuis une URL de piste
 */
async function fetchCaptions(captionUrl: string): Promise<string> {
  try {
    const response = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    })

    if (!response.ok) return ''

    const xml = await response.text()
    if (!xml) return ''

    // Extraire le texte des balises <text>
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g
    const texts = [...xml.matchAll(textRegex)]
      .map(m => m[1])
      .map(t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))

    return texts.join(' ')
  } catch {
    return ''
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

  // Récupérer les sous-titres (FR prioritaire, sinon EN, sinon premier dispo)
  let transcript = ''
  if (videoData.captionUrls.length > 0) {
    const frCaptions = videoData.captionUrls.find(c => c.lang === 'fr')
    const enCaptions = videoData.captionUrls.find(c => c.lang === 'en' || c.lang === 'en-GB')
    const captionTrack = frCaptions || enCaptions || videoData.captionUrls[0]

    transcript = await fetchCaptions(captionTrack.url)
  }

  // Combiner description + sous-titres pour l'IA
  let textForAI = ''

  if (videoData.description) {
    textForAI += `Titre de la vidéo : ${videoData.title}\n\nDescription de la vidéo :\n${videoData.description}`
  }

  if (transcript) {
    // Limiter le transcript à ~4000 chars pour pas dépasser les limites
    const trimmedTranscript = transcript.slice(0, 4000)
    textForAI += `\n\nTranscription de la vidéo :\n${trimmedTranscript}`
  }

  if (!textForAI.trim()) {
    return {
      success: false,
      error: 'Aucune description ni sous-titres trouvés pour cette vidéo. Essayez de copier-coller la recette dans l\'onglet "Texte".',
    }
  }

  // Envoyer à l'IA pour extraction
  const result = await parseRecipeWithAI(textForAI)

  // Ajouter l'URL source et la miniature
  if (result.success && result.recipe) {
    result.recipe.source_type = 'url'
    result.recipe.source_url = url
    if (videoData.thumbnailUrl) {
      result.recipe.image_url = videoData.thumbnailUrl
    }
  }

  return result
}
