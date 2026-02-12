/**
 * Page liste des recettes (dashboard principal)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'

import { RecipeGrid } from '@/components/recipes/recipe-grid'
import { RecipeFilters } from '@/components/recipes/recipe-filters'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Recipe } from '@/lib/types/recipe'

interface RecettesPageProps {
  searchParams: Promise<{
    category?: string
    appliance?: string
    status?: string
    search?: string
  }>
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

  // Await searchParams (Next.js 15+)
  const params = await searchParams

  // Query recipes avec filtres
  let recipes: Recipe[] | null = null
  let error: { message: string } | null = null

  if (params.search) {
    // Recherche dans titre ET ingrédients via RPC
    const result = await supabase.rpc('search_recipes', {
      search_term: params.search,
      category_filter: params.category || null,
      status_filter: params.status || null,
    })
    recipes = result.data as Recipe[] | null
    error = result.error
    // Filtrer par appareil côté client (RPC ne gère pas encore ce filtre)
    if (params.appliance && recipes) {
      recipes = recipes.filter(r => r.appliance === params.appliance)
    }
  } else {
    // Query standard sans recherche
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (params.category) {
      query = query.eq('category', params.category)
    }

    if (params.appliance) {
      query = query.eq('appliance', params.appliance)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const result = await query
    recipes = result.data as Recipe[] | null
    error = result.error
  }

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

        <div className="flex gap-2">
          <Link href="/import">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </Link>
          <Link href="/recettes/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle recette
            </Button>
          </Link>
        </div>
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
