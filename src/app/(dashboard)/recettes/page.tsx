/**
 * Page liste des recettes (dashboard principal)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { RecipeGrid } from '@/components/recipes/recipe-grid'
import { RecipeFilters } from '@/components/recipes/recipe-filters'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Recipe } from '@/lib/types/recipe'

interface RecettesPageProps {
  searchParams: {
    category?: string
    search?: string
  }
}

export default async function RecettesPage({ searchParams }: RecettesPageProps) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query recipes avec filtres
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Filtre catégorie
  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  // Filtre recherche (titre)
  if (searchParams.search) {
    query = query.ilike('title', `%${searchParams.search}%`)
  }

  const { data: recipes, error } = await query

  if (error) {
    console.error('Erreur récupération recettes:', error)
  }

  const recipesTyped = (recipes || []) as Recipe[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Recettes</h1>
          <p className="mt-1 text-gray-600">
            {recipesTyped.length} {recipesTyped.length > 1 ? 'recettes' : 'recette'}
          </p>
        </div>

        <Link href="/recettes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle recette
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Filtres */}
      <RecipeFilters />

      <Separator />

      {/* Grille de recettes */}
      <RecipeGrid recipes={recipesTyped} />
    </div>
  )
}
