/**
 * Schemas Zod pour validation des recettes
 */

import { z } from 'zod'

// Schema pour un ingrédient
export const ingredientSchema = z.object({
  name: z.string().min(1, 'Le nom de l\'ingrédient est requis'),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
})

// Schema pour un groupe d'ingrédients
export const ingredientGroupSchema = z.object({
  group: z.string().optional(),
  items: z.array(ingredientSchema).min(1, 'Au moins un ingrédient requis'),
})

// Schema pour une étape de préparation
export const recipeStepSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string().min(1, 'L\'instruction est requise'),
  duration: z.number().int().positive().optional(),
})

// Schema pour les métadonnées
export const recipeMetadataSchema = z.object({
  prep_time: z.number().int().positive().optional(),
  cook_time: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['facile', 'moyen', 'difficile']).optional(),
  source_url: z.string().url('URL invalide').optional().or(z.literal('')),
})

// Schema pour une recette complète (création)
export const recipeInsertSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long (max 200 caractères)'),

  category: z.enum([
    'apero',
    'entree',
    'plat',
    'accompagnement',
    'sauce',
    'dessert',
    'boisson',
    'petit_dejeuner',
    'gouter',
    'pain_viennoiserie',
    'conserve',
  ], {
    message: 'Catégorie invalide',
  }),

  appliance: z.enum(['airfryer', 'robot_cuiseur', 'cookeo']).nullable().optional(),

  ingredients: z
    .array(ingredientGroupSchema)
    .min(1, 'Au moins un groupe d\'ingrédients requis'),

  steps: z
    .array(recipeStepSchema)
    .min(1, 'Au moins une étape requise'),

  metadata: recipeMetadataSchema.default({}),

  image_url: z.string().url('URL invalide').nullable().optional(),

  source_type: z.enum(['manual', 'url', 'paste', 'photo', 'video']),

  status: z.enum(['a_tester', 'testee', 'approuvee']).default('a_tester'),

  is_favorite: z.boolean().default(false),

  tags: z.array(z.string()).default([]),
})

// Schema pour mise à jour (tous champs optionnels)
export const recipeUpdateSchema = recipeInsertSchema.partial().extend({
  id: z.string().uuid('ID invalide'),
})

// Schema pour recherche/filtres
export const recipeFilterSchema = z.object({
  category: z.string().optional(),
  appliance: z.string().optional(),
  status: z.string().optional(),
  is_favorite: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// Types inférés des schemas (pour TypeScript)
export type RecipeInsertInput = z.infer<typeof recipeInsertSchema>
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>
export type RecipeFilterInput = z.infer<typeof recipeFilterSchema>
