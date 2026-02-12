/**
 * Parser IA de recettes via Claude Haiku
 *
 * 3 fonctions :
 * - parseRecipeWithAI : texte brut → recette structurée
 * - parseRecipeFromImage : photo (base64) → recette via Vision
 * - parseRecipeFromHtmlWithAI : HTML brut → recette (fallback URL)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { ParsedRecipe, ParseResult } from './types'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction de recettes de cuisine.
Tu dois extraire les informations d'une recette et retourner UNIQUEMENT un objet JSON valide (sans markdown, sans backticks).

Le JSON doit avoir cette structure exacte :
{
  "title": "Nom de la recette",
  "category": "plat",
  "appliance": null,
  "ingredients_text": "Un ingrédient par ligne",
  "steps_text": "Une étape par ligne",
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "facile"
}

Règles :
- "category" doit être une de ces valeurs : apero, entree, plat, accompagnement, sauce, dessert, boisson, petit_dejeuner, gouter, pain_viennoiserie, conserve
- "appliance" doit être null ou une de ces valeurs : airfryer, robot_cuiseur, cookeo. Utilise "airfryer" si la recette mentionne un air fryer. Utilise "robot_cuiseur" si la recette mentionne Thermomix, Monsieur Cuisine, Companion, Magimix Cook Expert ou tout robot cuiseur multifonction. Utilise "cookeo" si la recette mentionne un Cookeo ou multicuiseur Moulinex.
- "difficulty" doit être : facile, moyen, ou difficile
- "prep_time" et "cook_time" sont en minutes (nombre entier ou null)
- "servings" est un nombre entier ou null
- "ingredients_text" : un ingrédient par ligne, avec quantités si disponibles
- "steps_text" : une étape par ligne, numérotées si possible
- Si une information est manquante, utilise null pour les nombres et "plat" pour la catégorie par défaut
- Retourne UNIQUEMENT le JSON, aucun texte avant ou après`

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'REMPLACEZ_PAR_VOTRE_CLE') {
    throw new Error('ANTHROPIC_API_KEY non configurée. Ajoutez votre clé dans .env.local')
  }
  return new Anthropic({ apiKey })
}

/**
 * Extraire le JSON d'une réponse Claude (gère les cas avec/sans backticks)
 */
function extractJson(text: string): Record<string, unknown> | null {
  // Essayer d'abord le texte brut
  try {
    return JSON.parse(text.trim())
  } catch {
    // Essayer d'extraire d'un bloc markdown
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim())
      } catch {
        // continuer
      }
    }
    // Essayer de trouver un objet JSON dans le texte
    const braceMatch = text.match(/\{[\s\S]*\}/)
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0])
      } catch {
        // continuer
      }
    }
    return null
  }
}

/**
 * Convertir la réponse JSON en ParsedRecipe
 */
function jsonToParsedRecipe(
  json: Record<string, unknown>,
  sourceType: 'url' | 'paste' | 'photo',
  sourceUrl?: string
): ParsedRecipe {
  return {
    title: String(json.title || '').trim(),
    category: (['apero', 'entree', 'plat', 'accompagnement', 'sauce', 'dessert', 'boisson', 'petit_dejeuner', 'gouter', 'pain_viennoiserie', 'conserve'].includes(String(json.category))
      ? String(json.category)
      : 'plat') as ParsedRecipe['category'],
    appliance: (['airfryer', 'robot_cuiseur', 'cookeo'].includes(String(json.appliance))
      ? String(json.appliance)
      : undefined) as ParsedRecipe['appliance'],
    ingredients_text: String(json.ingredients_text || ''),
    steps_text: String(json.steps_text || ''),
    prep_time: typeof json.prep_time === 'number' ? json.prep_time : undefined,
    cook_time: typeof json.cook_time === 'number' ? json.cook_time : undefined,
    servings: typeof json.servings === 'number' ? json.servings : undefined,
    difficulty: (['facile', 'moyen', 'difficile'].includes(String(json.difficulty))
      ? String(json.difficulty)
      : undefined) as ParsedRecipe['difficulty'],
    source_type: sourceType,
    source_url: sourceUrl,
  }
}

/**
 * Gestion d'erreur centralisée
 */
function handleError(err: unknown): ParseResult {
  if (err instanceof Error) {
    if (err.message.includes('ANTHROPIC_API_KEY')) {
      return { success: false, error: err.message }
    }
    if (err.message.includes('authentication') || err.message.includes('401')) {
      return { success: false, error: 'Clé API Anthropic invalide. Vérifiez ANTHROPIC_API_KEY dans .env.local' }
    }
    if (err.message.includes('rate') || err.message.includes('429')) {
      return { success: false, error: 'Trop de requêtes. Réessayez dans quelques secondes.' }
    }
    if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
      return { success: false, error: 'L\'analyse a pris trop de temps. Réessayez.' }
    }
  }
  return { success: false, error: 'Erreur lors de l\'analyse IA. Réessayez ou remplissez manuellement.' }
}

/**
 * Parser du texte brut d'une recette via Claude
 */
export async function parseRecipeWithAI(text: string): Promise<ParseResult> {
  try {
    const client = getClient()

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Extrais la recette suivante :\n\n${text}`,
      }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const json = extractJson(responseText)

    if (!json || !json.title) {
      return { success: false, error: 'L\'IA n\'a pas pu extraire la recette. Vérifiez le texte et réessayez.' }
    }

    return {
      success: true,
      recipe: jsonToParsedRecipe(json, 'paste'),
    }
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Parser une photo de recette via Claude Vision
 */
export async function parseRecipeFromImage(
  base64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<ParseResult> {
  try {
    const client = getClient()

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Extrais la recette visible sur cette image. Si le texte est manuscrit ou imprimé, lis-le attentivement.',
          },
        ],
      }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const json = extractJson(responseText)

    if (!json || !json.title) {
      return { success: false, error: 'L\'IA n\'a pas pu lire la recette sur cette image. Essayez avec une photo plus nette ou remplissez manuellement.' }
    }

    return {
      success: true,
      recipe: jsonToParsedRecipe(json, 'photo'),
    }
  } catch (err) {
    return handleError(err)
  }
}

/**
 * Parser du HTML brut quand JSON-LD échoue (fallback URL)
 */
export async function parseRecipeFromHtmlWithAI(
  html: string,
  sourceUrl: string
): Promise<ParseResult> {
  try {
    const client = getClient()

    // Nettoyer le HTML (garder seulement le texte pertinent, max ~8000 chars)
    const cleanedHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      // Décoder les entités HTML courantes (apostrophes, accents, etc.)
      .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&rsquo;|&lsquo;/g, "'")
      .replace(/&rdquo;|&ldquo;/g, '"')
      .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê').replace(/&euml;/g, 'ë')
      .replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â')
      .replace(/&ocirc;/g, 'ô').replace(/&ouml;/g, 'ö')
      .replace(/&ucirc;/g, 'û').replace(/&ugrave;/g, 'ù').replace(/&uuml;/g, 'ü')
      .replace(/&icirc;/g, 'î').replace(/&iuml;/g, 'ï')
      .replace(/&ccedil;/g, 'ç')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Extrais la recette depuis ce contenu de page web (URL: ${sourceUrl}) :\n\n${cleanedHtml}`,
      }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const json = extractJson(responseText)

    if (!json || !json.title) {
      return { success: false, error: 'L\'IA n\'a pas pu extraire la recette depuis cette page.' }
    }

    const recipe = jsonToParsedRecipe(json, 'url', sourceUrl)
    return { success: true, recipe }
  } catch (err) {
    return handleError(err)
  }
}
