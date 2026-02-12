/**
 * Types TypeScript pour le modèle de données des recettes
 */

// Catégories de recettes (11 catégories)
export type RecipeCategory =
  | 'apero'
  | 'entree'
  | 'plat'
  | 'accompagnement'
  | 'sauce'
  | 'dessert'
  | 'boisson'
  | 'petit_dejeuner'
  | 'gouter'
  | 'pain_viennoiserie'
  | 'conserve'

// Difficulté de la recette
export type RecipeDifficulty = 'facile' | 'moyen' | 'difficile'

// Statut de la recette
export type RecipeStatus = 'a_tester' | 'testee' | 'approuvee'

// Appareil de cuisine (optionnel)
export type RecipeAppliance = 'airfryer' | 'robot_cuiseur' | 'cookeo'

// Type de source d'import
export type RecipeSourceType = 'manual' | 'url' | 'paste' | 'photo'

// Ingrédient individuel
export interface Ingredient {
  name: string
  quantity?: number
  unit?: string
  note?: string // Ex: "T55" pour farine, "bien mûres" pour bananes
}

// Groupe d'ingrédients (optionnel)
export interface IngredientGroup {
  group?: string // Ex: "Pâte", "Garniture", "Sauce"
  items: Ingredient[]
}

// Étape de préparation
export interface RecipeStep {
  order: number
  instruction: string
  duration?: number // En minutes
}

// Métadonnées de la recette
export interface RecipeMetadata {
  prep_time?: number // Temps de préparation en minutes
  cook_time?: number // Temps de cuisson en minutes
  servings?: number // Nombre de portions
  difficulty?: RecipeDifficulty
  source_url?: string // URL source si importé depuis le web
}

// Recette complète (correspond à la table recipes)
export interface Recipe {
  id: string
  user_id: string
  title: string
  category: RecipeCategory
  appliance: RecipeAppliance | null
  ingredients: IngredientGroup[]
  steps: RecipeStep[]
  metadata: RecipeMetadata
  image_url: string | null
  source_type: RecipeSourceType
  status: RecipeStatus
  is_favorite: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

// Type pour création de recette (sans id, user_id, timestamps)
export type RecipeInsert = Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>

// Type pour mise à jour de recette (tous champs optionnels sauf id)
export type RecipeUpdate = Partial<RecipeInsert> & { id: string }

// Labels lisibles pour les catégories
export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  apero: 'Apéritif',
  entree: 'Entrée',
  plat: 'Plat principal',
  accompagnement: 'Accompagnement',
  sauce: 'Sauce',
  dessert: 'Dessert',
  boisson: 'Boisson',
  petit_dejeuner: 'Petit-déjeuner',
  gouter: 'Goûter',
  pain_viennoiserie: 'Pain & Viennoiserie',
  conserve: 'Conserve',
}

// Labels lisibles pour les difficultés
export const RECIPE_DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
}

// Labels lisibles pour les appareils
export const RECIPE_APPLIANCE_LABELS: Record<RecipeAppliance, string> = {
  airfryer: 'Airfryer',
  robot_cuiseur: 'Robot cuiseur',
  cookeo: 'Cookeo',
}

// Couleurs Tailwind pour les appareils
export const RECIPE_APPLIANCE_COLORS: Record<RecipeAppliance, string> = {
  airfryer: 'bg-red-100 text-red-800 hover:bg-red-200',
  robot_cuiseur: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  cookeo: 'bg-teal-100 text-teal-800 hover:bg-teal-200',
}

// Liste ordonnée des appareils (pour les filtres)
export const RECIPE_APPLIANCES: RecipeAppliance[] = ['airfryer', 'robot_cuiseur', 'cookeo']

// Labels lisibles pour les statuts
export const RECIPE_STATUS_LABELS: Record<RecipeStatus, string> = {
  a_tester: 'À tester',
  testee: 'Testée',
  approuvee: 'Approuvée',
}

// Couleurs Tailwind pour les statuts
export const RECIPE_STATUS_COLORS: Record<RecipeStatus, string> = {
  a_tester: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  testee: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  approuvee: 'bg-green-100 text-green-800 hover:bg-green-200',
}

// Ordre de rotation pour le toggle (clic = statut suivant)
export const RECIPE_STATUS_CYCLE: Record<RecipeStatus, RecipeStatus> = {
  a_tester: 'testee',
  testee: 'approuvee',
  approuvee: 'a_tester',
}

// Liste ordonnée des statuts (pour les filtres)
export const RECIPE_STATUSES: RecipeStatus[] = ['a_tester', 'testee', 'approuvee']
