/**
 * Parser de recettes depuis du texte collé
 *
 * Stratégie :
 * 1. Détecter les sections par mots-clés (Ingrédients, Préparation, etc.)
 * 2. Heuristiques : lignes courtes avec quantités = ingrédients, longues = étapes
 * 3. Si aucune section détectée, tout mettre dans les étapes et laisser l'utilisateur trier
 */

import type { ParsedRecipe, ParseResult } from './types'

// Mots-clés marquant le début de la section ingrédients
const INGREDIENT_MARKERS = [
  /^#{0,3}\s*ingr[ée]dients?\s*:?$/i,
  /^#{0,3}\s*il\s+(vous\s+)?faut\s*:?$/i,
  /^#{0,3}\s*pour\s+\d+\s+(personnes?|parts?|portions?)\s*:?$/i,
  /^#{0,3}\s*liste\s+des\s+ingr[ée]dients?\s*:?$/i,
]

// Mots-clés marquant le début de la section étapes
const STEP_MARKERS = [
  /^#{0,3}\s*pr[ée]paration\s*:?$/i,
  /^#{0,3}\s*[ée]tapes?\s*:?$/i,
  /^#{0,3}\s*instructions?\s*:?$/i,
  /^#{0,3}\s*recette\s*:?$/i,
  /^#{0,3}\s*r[ée]alisation\s*:?$/i,
  /^#{0,3}\s*proc[ée]dure\s*:?$/i,
  /^#{0,3}\s*mode\s+op[ée]ratoire\s*:?$/i,
]

// Mots-clés pour détecter le titre (première ligne significative)
const TITLE_MARKERS = [
  /^#{0,3}\s*recette\s*:?\s*/i,
  /^#{0,3}\s*titre\s*:?\s*/i,
]

// Pattern d'une ligne qui ressemble à un ingrédient
// Ex: "200 g de farine", "3 oeufs", "sel et poivre", "1/2 citron"
const INGREDIENT_PATTERN = /^[\d½¼¾⅓⅔⅛]|^\d+[.,]\d+|^une?\s|^quelques?\s|^un peu/i

// Pattern d'une ligne numérotée (étape)
const NUMBERED_STEP = /^\d+[\.\)]\s*/

/**
 * Vérifie si une ligne est un marqueur de section
 */
function matchesAny(line: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(line.trim()))
}

// Lignes de métadonnées à exclure des ingrédients/étapes
const METADATA_LINE = /^(pr[ée]p(?:aration)?|cuisson|pour\s+\d+\s+(personnes?|parts?|portions?))\s*:?\s*\d/i

/**
 * Heuristique : la ligne ressemble-t-elle à un ingrédient ?
 */
function looksLikeIngredient(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  // Exclure les lignes de métadonnées (temps, portions)
  if (METADATA_LINE.test(trimmed)) return false
  // Commence par un nombre ou une fraction
  if (INGREDIENT_PATTERN.test(trimmed)) return true
  // Ligne courte (< 60 chars) sans verbe d'action courant
  if (trimmed.length < 60 && !/\b(faire|mettre|ajouter|mélanger|couper|cuire|verser|battre)\b/i.test(trimmed)) {
    return true
  }
  return false
}

/**
 * Détecter le nombre de portions dans le texte
 */
function detectServings(text: string): number | undefined {
  const match = text.match(/pour\s+(\d+)\s+(personnes?|parts?|portions?)/i)
  return match ? parseInt(match[1], 10) : undefined
}

/**
 * Détecter les temps de préparation/cuisson
 */
function detectTimes(text: string): { prep_time?: number; cook_time?: number } {
  const result: { prep_time?: number; cook_time?: number } = {}

  // Temps de préparation
  const prepMatch = text.match(/pr[ée]p(?:aration)?\s*:?\s*(\d+)\s*(?:min|mn|minutes?)/i)
  if (prepMatch) result.prep_time = parseInt(prepMatch[1], 10)

  // Temps de cuisson
  const cookMatch = text.match(/cuisson\s*:?\s*(\d+)\s*(?:min|mn|minutes?)/i)
  if (cookMatch) result.cook_time = parseInt(cookMatch[1], 10)

  // Format "Xh" ou "X h Y min"
  const prepHMatch = text.match(/pr[ée]p(?:aration)?\s*:?\s*(\d+)\s*h\s*(\d+)?/i)
  if (prepHMatch) result.prep_time = parseInt(prepHMatch[1], 10) * 60 + parseInt(prepHMatch[2] || '0', 10)

  const cookHMatch = text.match(/cuisson\s*:?\s*(\d+)\s*h\s*(\d+)?/i)
  if (cookHMatch) result.cook_time = parseInt(cookHMatch[1], 10) * 60 + parseInt(cookHMatch[2] || '0', 10)

  return result
}

/**
 * Parser de texte brut vers une recette structurée
 */
export function parseRecipeFromText(text: string): ParseResult {
  if (!text.trim()) {
    return { success: false, error: 'Le texte est vide.' }
  }

  const lines = text.split('\n').map(l => l.trim())

  let title = ''
  const ingredientLines: string[] = []
  const stepLines: string[] = []

  type Section = 'none' | 'ingredients' | 'steps'
  let currentSection: Section = 'none'
  let titleFound = false

  for (const line of lines) {
    if (!line) continue

    // Chercher le titre dans les premières lignes
    if (!titleFound) {
      const titleMarker = TITLE_MARKERS.find(p => p.test(line))
      if (titleMarker) {
        title = line.replace(titleMarker, '').trim()
        titleFound = true
        continue
      }
      // Première ligne non-vide = titre probable
      if (!title && currentSection === 'none' && !matchesAny(line, INGREDIENT_MARKERS) && !matchesAny(line, STEP_MARKERS)) {
        title = line.replace(/^#+\s*/, '') // Enlever les # markdown
        titleFound = true
        continue
      }
    }

    // Détecter les sections
    if (matchesAny(line, INGREDIENT_MARKERS)) {
      currentSection = 'ingredients'
      continue
    }
    if (matchesAny(line, STEP_MARKERS)) {
      currentSection = 'steps'
      continue
    }

    // Ignorer les lignes de métadonnées (temps, portions)
    if (METADATA_LINE.test(line)) continue

    // Ajouter la ligne dans la bonne section
    if (currentSection === 'ingredients') {
      ingredientLines.push(line)
    } else if (currentSection === 'steps') {
      // Enlever la numérotation
      stepLines.push(line.replace(NUMBERED_STEP, ''))
    } else {
      // Section non définie : heuristique
      if (NUMBERED_STEP.test(line)) {
        stepLines.push(line.replace(NUMBERED_STEP, ''))
      } else if (looksLikeIngredient(line)) {
        ingredientLines.push(line)
      } else {
        stepLines.push(line)
      }
    }
  }

  // Extraire les métadonnées du texte complet
  const servings = detectServings(text)
  const times = detectTimes(text)

  const parsed: ParsedRecipe = {
    title: title || 'Recette importée',
    category: 'plat',
    ingredients_text: ingredientLines.join('\n'),
    steps_text: stepLines.join('\n'),
    prep_time: times.prep_time,
    cook_time: times.cook_time,
    servings,
    source_type: 'paste',
  }

  return { success: true, recipe: parsed }
}
