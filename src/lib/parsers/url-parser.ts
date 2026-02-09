/**
 * Parser de recettes depuis des URLs
 *
 * Stratégie :
 * 1. Chercher JSON-LD schema.org/Recipe (Marmiton, 750g, CuisineAZ, etc.)
 * 2. Fallback : extraction HTML basique
 */

import * as cheerio from 'cheerio'
import type { ParsedRecipe, ParseResult } from './types'
import type { RecipeCategory } from '@/lib/types/recipe'

// Mapping catégories anglais/français vers nos catégories
const CATEGORY_MAP: Record<string, RecipeCategory> = {
  // Français
  'apéritif': 'apero',
  'apéro': 'apero',
  'aperitif': 'apero',
  'entrée': 'entree',
  'entree': 'entree',
  'plat': 'plat',
  'plat principal': 'plat',
  'accompagnement': 'accompagnement',
  'sauce': 'sauce',
  'dessert': 'dessert',
  'boisson': 'boisson',
  'cocktail': 'boisson',
  'petit-déjeuner': 'petit_dejeuner',
  'petit déjeuner': 'petit_dejeuner',
  'goûter': 'gouter',
  'gouter': 'gouter',
  'pain': 'pain_viennoiserie',
  'viennoiserie': 'pain_viennoiserie',
  'conserve': 'conserve',
  'confiture': 'conserve',
  // Anglais
  'appetizer': 'apero',
  'starter': 'entree',
  'main course': 'plat',
  'main dish': 'plat',
  'side dish': 'accompagnement',
  'side': 'accompagnement',
  'breakfast': 'petit_dejeuner',
  'snack': 'gouter',
  'drink': 'boisson',
  'beverage': 'boisson',
  'bread': 'pain_viennoiserie',
}

/**
 * Convertir durée ISO 8601 (PT1H30M) en minutes
 */
function parseISO8601Duration(duration: string): number | undefined {
  if (!duration) return undefined
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return undefined
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  return hours * 60 + minutes || undefined
}

/**
 * Mapper une catégorie textuelle vers nos catégories
 */
function mapCategory(raw: string | string[] | undefined): RecipeCategory {
  if (!raw) return 'plat'
  const categories = Array.isArray(raw) ? raw : [raw]

  for (const cat of categories) {
    const normalized = cat.toLowerCase().trim()
    if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized]
    // Recherche partielle
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) return value
    }
  }
  return 'plat'
}

/**
 * Extraire les instructions selon les 3 formats JSON-LD possibles
 */
function extractInstructions(instructions: unknown): string {
  if (!instructions) return ''

  // Format 1 : tableau de strings
  if (Array.isArray(instructions) && typeof instructions[0] === 'string') {
    return instructions.join('\n')
  }

  // Format 2 : tableau de HowToStep
  if (Array.isArray(instructions) && typeof instructions[0] === 'object') {
    return instructions
      .map((step: { text?: string; '@type'?: string; itemListElement?: { text?: string }[] }) => {
        // HowToStep
        if (step.text) return step.text
        // HowToSection avec itemListElement
        if (step.itemListElement) {
          return step.itemListElement.map((s: { text?: string }) => s.text || '').join('\n')
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  // Format 3 : string simple
  if (typeof instructions === 'string') {
    return instructions
  }

  return ''
}

/**
 * Extraire les ingrédients
 */
function extractIngredients(ingredients: unknown): string {
  if (!ingredients) return ''
  if (Array.isArray(ingredients)) {
    return ingredients.map(i => typeof i === 'string' ? i : '').filter(Boolean).join('\n')
  }
  if (typeof ingredients === 'string') return ingredients
  return ''
}

/**
 * Extraire l'URL de l'image
 */
function extractImage(image: unknown): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  if (Array.isArray(image)) return typeof image[0] === 'string' ? image[0] : (image[0] as { url?: string })?.url
  if (typeof image === 'object' && image !== null) return (image as { url?: string }).url
  return undefined
}

/**
 * Extraire le nombre de portions
 */
function extractServings(recipeYield: unknown): number | undefined {
  if (!recipeYield) return undefined
  if (typeof recipeYield === 'number') return recipeYield
  const str = Array.isArray(recipeYield) ? recipeYield[0] : String(recipeYield)
  const match = String(str).match(/(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

/**
 * Chercher l'objet Recipe dans le JSON-LD (3 formats possibles)
 */
function findRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>

  // Format 1 : objet direct avec @type Recipe
  if (obj['@type'] === 'Recipe') return obj
  // Variante : @type est un tableau
  if (Array.isArray(obj['@type']) && (obj['@type'] as string[]).includes('Recipe')) return obj

  // Format 2 : @graph contenant un Recipe
  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph'] as Record<string, unknown>[]) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
  }

  // Format 3 : tableau de scripts JSON-LD
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
  }

  return null
}

/**
 * Parser principal : extrait une recette depuis du HTML
 */
export function parseRecipeFromHtml(html: string, sourceUrl: string): ParseResult {
  const $ = cheerio.load(html)

  // Stratégie 1 : JSON-LD
  const jsonLdScripts = $('script[type="application/ld+json"]')

  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const content = $(jsonLdScripts[i]).html()
      if (!content) continue
      const data = JSON.parse(content)
      const recipe = findRecipeInJsonLd(data)

      if (recipe) {
        const parsed: ParsedRecipe = {
          title: String(recipe.name || '').trim(),
          category: mapCategory(recipe.recipeCategory as string | string[] | undefined),
          ingredients_text: extractIngredients(recipe.recipeIngredient),
          steps_text: extractInstructions(recipe.recipeInstructions),
          prep_time: parseISO8601Duration(String(recipe.prepTime || '')),
          cook_time: parseISO8601Duration(String(recipe.cookTime || '')),
          servings: extractServings(recipe.recipeYield),
          source_type: 'url',
          source_url: sourceUrl,
          image_url: extractImage(recipe.image),
        }

        if (parsed.title && (parsed.ingredients_text || parsed.steps_text)) {
          return { success: true, recipe: parsed }
        }
      }
    } catch {
      // JSON invalide, continuer
    }
  }

  // Stratégie 2 : Fallback HTML basique
  const title = $('h1').first().text().trim() || $('title').text().trim()

  if (title) {
    return {
      success: true,
      recipe: {
        title,
        category: 'plat',
        ingredients_text: '',
        steps_text: '',
        source_type: 'url',
        source_url: sourceUrl,
      },
    }
  }

  return {
    success: false,
    error: 'Impossible d\'extraire la recette depuis cette page. Essayez de copier-coller le texte directement.',
  }
}
