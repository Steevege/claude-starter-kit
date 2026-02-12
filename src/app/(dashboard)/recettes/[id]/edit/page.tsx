/**
 * Page édition d'une recette
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import { RecipeFormSimple } from '@/components/recipes/recipe-form-simple'
import { Button } from '@/components/ui/button'

interface RecipeEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Await params (Next.js 15+)
  const { id } = await params

  // Récupérer la recette
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !recipe) {
    notFound()
  }

  const recipeTyped = recipe as Recipe

  // Convertir la recette au format du formulaire
  const ingredientsText = recipeTyped.ingredients
    .map(group => group.items.map(item => {
      let line = ''
      if (item.quantity) line += `${item.quantity} `
      if (item.unit) line += `${item.unit} `
      line += item.name
      if (item.note) line += ` (${item.note})`
      return line
    }).join('\n'))
    .join('\n\n')

  const stepsText = recipeTyped.steps
    .map(step => step.instruction)
    .join('\n')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modifier la recette</h1>
          <p className="mt-1 text-gray-600">
            {recipeTyped.title}
          </p>
        </div>

        <Link href={`/recettes/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Formulaire */}
      <RecipeFormSimple
        recipeId={id}
        defaultValues={{
          title: recipeTyped.title,
          category: recipeTyped.category,
          appliance: recipeTyped.appliance || undefined,
          ingredients_text: ingredientsText,
          steps_text: stepsText,
          prep_time: recipeTyped.metadata.prep_time,
          cook_time: recipeTyped.metadata.cook_time,
          servings: recipeTyped.metadata.servings,
          difficulty: recipeTyped.metadata.difficulty,
          source_type: recipeTyped.source_type,
          status: recipeTyped.status,
          is_favorite: recipeTyped.is_favorite,
        }}
        imageUrl={recipeTyped.image_url}
      />
    </div>
  )
}
