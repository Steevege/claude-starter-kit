/**
 * Schema Zod pour les recettes vidéo
 * Formulaire léger : titre + lien + note + catégorie
 */

import { z } from 'zod'

export const videoRecipeSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),

  video_url: z
    .string()
    .min(1, 'Le lien vidéo est requis')
    .url('Le lien doit être une URL valide'),

  notes: z.string().optional(),

  category: z.enum([
    'apero', 'entree', 'plat', 'accompagnement', 'sauce',
    'dessert', 'boisson', 'petit_dejeuner', 'gouter',
    'pain_viennoiserie', 'conserve',
  ]),

  is_favorite: z.boolean().default(false),
})

export type VideoRecipeInput = z.infer<typeof videoRecipeSchema>
