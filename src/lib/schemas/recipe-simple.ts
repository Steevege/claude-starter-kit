/**
 * Schema Zod simplifié pour MVP
 * Version temporaire en attendant le formulaire complet
 */

import { z } from 'zod'

// Schema MVP simplifié
export const recipeSimpleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),

  category: z.enum([
    'apero', 'entree', 'plat', 'accompagnement', 'sauce',
    'dessert', 'boisson', 'petit_dejeuner', 'gouter',
    'pain_viennoiserie', 'conserve'
  ]),

  // Ingrédients en texte simple (sera parsé)
  ingredients_text: z.string().min(1, 'Au moins un ingrédient requis'),

  // Étapes en texte simple (sera parsé)
  steps_text: z.string().min(1, 'Au moins une étape requise'),

  // Metadata optionnels
  prep_time: z.number().optional(),
  cook_time: z.number().optional(),
  servings: z.number().optional(),
  difficulty: z.enum(['facile', 'moyen', 'difficile']).optional(),

  source_type: z.enum(['manual', 'url', 'paste', 'photo']).default('manual'),
  source_url: z.string().optional(),
  status: z.enum(['a_tester', 'testee', 'approuvee']).default('a_tester'),
  is_favorite: z.boolean().default(false),
})

export type RecipeSimpleInput = z.infer<typeof recipeSimpleSchema>

// Fonction pour convertir le format simple vers le format DB
export function parseSimpleRecipe(input: RecipeSimpleInput) {
  // Parser les ingrédients (un par ligne)
  const ingredientLines = input.ingredients_text
    .split('\n')
    .filter(line => line.trim())
    .map(line => ({
      name: line.trim(),
      quantity: undefined,
      unit: undefined,
    }))

  // Parser les étapes (une par ligne ou numérotées)
  const stepLines = input.steps_text
    .split('\n')
    .filter(line => line.trim())
    .map((line, idx) => ({
      order: idx + 1,
      instruction: line.trim().replace(/^\d+\.\s*/, ''), // Enlever "1. " si présent
    }))

  return {
    title: input.title,
    category: input.category,
    ingredients: [{ items: ingredientLines }],
    steps: stepLines,
    metadata: {
      prep_time: input.prep_time,
      cook_time: input.cook_time,
      servings: input.servings,
      difficulty: input.difficulty,
      ...(input.source_url ? { source_url: input.source_url } : {}),
    },
    source_type: input.source_type,
    status: input.status || 'a_tester',
    is_favorite: input.is_favorite,
    tags: [],
  }
}
