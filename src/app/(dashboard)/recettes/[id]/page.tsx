/**
 * Page détail d'une recette
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Edit, Trash2, ChefHat } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import { RECIPE_CATEGORY_LABELS, RECIPE_DIFFICULTY_LABELS } from '@/lib/types/recipe'
import { DeleteRecipeButton } from '@/components/recipes/delete-recipe-button'
import { FavoriteToggleButton } from '@/components/recipes/favorite-toggle-button'
import { StatusToggleButton } from '@/components/recipes/status-toggle-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IngredientsList } from '@/components/recipes/ingredients-list'

interface RecipeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
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

  const totalTime = (recipeTyped.metadata.prep_time || 0) + (recipeTyped.metadata.cook_time || 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/recettes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="flex gap-2">
          <Link href={`/recettes/${id}/cooking`}>
            <Button variant="outline" size="sm">
              <ChefHat className="w-4 h-4 mr-2" />
              Cuisiner
            </Button>
          </Link>

          <Link href={`/recettes/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </Link>

          <DeleteRecipeButton
            recipeId={id}
            recipeTitle={recipeTyped.title}
          />
        </div>
      </div>

      {/* Image principale */}
      {recipeTyped.image_url && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-accent/30">
          <Image
            src={recipeTyped.image_url}
            alt={recipeTyped.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Titre et badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold text-foreground">
            {recipeTyped.title}
          </h1>
          <div className="flex-shrink-0">
            <FavoriteToggleButton
              recipeId={recipeTyped.id}
              isFavorite={recipeTyped.is_favorite}
              size="md"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {RECIPE_CATEGORY_LABELS[recipeTyped.category]}
          </Badge>

          <StatusToggleButton
            recipeId={recipeTyped.id}
            status={recipeTyped.status}
          />

          {recipeTyped.metadata.difficulty && (
            <Badge variant="outline">
              {RECIPE_DIFFICULTY_LABELS[recipeTyped.metadata.difficulty]}
            </Badge>
          )}

          {recipeTyped.tags?.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Métadonnées */}
      {totalTime > 0 && (
        <div className="flex flex-wrap gap-6 text-muted-foreground">
          {recipeTyped.metadata.prep_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Préparation</p>
                <p className="text-lg">{recipeTyped.metadata.prep_time} min</p>
              </div>
            </div>
          )}

          {recipeTyped.metadata.cook_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Cuisson</p>
                <p className="text-lg">{recipeTyped.metadata.cook_time} min</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Contenu principal : Ingrédients + Étapes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingrédients (1/3) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ingrédients</CardTitle>
          </CardHeader>
          <CardContent>
            <IngredientsList
              ingredients={recipeTyped.ingredients}
              servings={recipeTyped.metadata.servings}
            />
          </CardContent>
        </Card>

        {/* Étapes (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Préparation</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipeTyped.steps.map((step) => (
                <li key={step.order} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {step.order}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-foreground">{step.instruction}</p>
                    {step.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ⏱️ {step.duration} min
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Source si présente */}
      {recipeTyped.metadata.source_url && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Source :{' '}
              <a
                href={recipeTyped.metadata.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {recipeTyped.metadata.source_url}
              </a>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
