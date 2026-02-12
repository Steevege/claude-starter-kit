/**
 * Schemas Zod pour le partage familial
 */

import { z } from 'zod'

// Créer un groupe familial
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Le nom du groupe est requis').max(50),
  display_name: z.string().min(1, 'Votre prénom est requis').max(30),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>

// Rejoindre un groupe familial
export const joinGroupSchema = z.object({
  code: z.string().length(6, 'Le code doit contenir 6 caractères').toUpperCase(),
  display_name: z.string().min(1, 'Votre prénom est requis').max(30),
})

export type JoinGroupInput = z.infer<typeof joinGroupSchema>
