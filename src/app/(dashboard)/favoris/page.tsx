/**
 * Page des recettes favorites
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'

import { RecipeGrid } from '@/components/recipes/recipe-grid'
import { Separator } from '@/components/ui/separator'
import type { Recipe } from '@/lib/types/recipe'

export default async function FavorisPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération favoris:', error)
  }

  const recipesTyped = (recipes || []) as Recipe[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Favoris</h1>
        <p className="mt-1 text-gray-600">
          {recipesTyped.length} {recipesTyped.length > 1 ? 'recettes favorites' : 'recette favorite'}
        </p>
      </div>

      <Separator />

      {/* Grille de recettes ou message vide */}
      {recipesTyped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Heart className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun favori pour l'instant
          </h3>
          <p className="text-gray-600 max-w-md">
            Ajoutez des recettes en favoris en cliquant sur le coeur pour les retrouver ici.
          </p>
        </div>
      ) : (
        <RecipeGrid recipes={recipesTyped} />
      )}
    </div>
  )
}
