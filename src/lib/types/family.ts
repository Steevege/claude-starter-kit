/**
 * Types TypeScript pour le partage familial
 */

// Rôle dans le groupe familial
export type FamilyRole = 'owner' | 'member'

// Groupe familial
export interface FamilyGroup {
  id: string
  name: string
  code: string
  created_by: string
  created_at: string
}

// Membre du groupe familial
export interface FamilyMember {
  id: string
  group_id: string
  user_id: string
  role: FamilyRole
  display_name: string
  joined_at: string
}

// Résultat du lookup par code
export interface FamilyGroupLookup {
  id: string
  name: string
  code: string
  member_count: number
}

// Recette partagée avec info du propriétaire
export interface SharedRecipe {
  id: string
  user_id: string
  title: string
  category: string
  appliance: string | null
  ingredients: unknown[]
  steps: unknown[]
  metadata: Record<string, unknown>
  image_url: string | null
  source_type: string
  status: string
  is_favorite: boolean
  is_shared: boolean
  tags: string[]
  created_at: string
  updated_at: string
  owner_display_name: string
}
