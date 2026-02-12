/**
 * Types partagés pour les parsers d'import de recettes
 */

import type { RecipeCategory, RecipeAppliance, RecipeDifficulty } from '@/lib/types/recipe'

// Recette parsée en format texte (compatible avec RecipeFormSimple defaultValues)
export interface ParsedRecipe {
  title: string
  category: RecipeCategory
  appliance?: RecipeAppliance
  ingredients_text: string // Un ingrédient par ligne
  steps_text: string // Une étape par ligne
  prep_time?: number
  cook_time?: number
  servings?: number
  difficulty?: RecipeDifficulty
  source_type: 'url' | 'paste' | 'photo'
  source_url?: string
  image_url?: string
}

// Résultat d'un parsing
export interface ParseResult {
  success: boolean
  recipe?: ParsedRecipe
  error?: string
}
