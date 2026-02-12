/**
 * Page détail d'une recette familiale (lecture seule)
 * Pas de modifier/supprimer, affiche le nom du propriétaire, bouton copier
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, ChefHat, User } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import type { FamilyMember } from '@/lib/types/family'
import { RECIPE_CATEGORY_LABELS, RECIPE_DIFFICULTY_LABELS, RECIPE_APPLIANCE_LABELS, RECIPE_APPLIANCE_COLORS } from '@/lib/types/recipe'
import { CopyRecipeButton } from '@/components/family/copy-recipe-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IngredientsList } from '@/components/recipes/ingredients-list'

interface FamilyRecipeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FamilyRecipeDetailPage({ params }: FamilyRecipeDetailPageProps) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  // Récupérer la recette (la RLS vérifie qu'elle est visible)
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !recipe) {
    notFound()
  }

  const recipeTyped = recipe as Recipe

  // Si c'est sa propre recette, rediriger vers la page normale
  if (recipeTyped.user_id === user.id) {
    redirect(`/recettes/${id}`)
  }

  // Trouver le nom du propriétaire via family_members
  const { data: ownerMembership } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('user_id', recipeTyped.user_id)
    .single()

  const ownerName = (ownerMembership as FamilyMember | null)?.display_name || 'Membre'

  const totalTime = (recipeTyped.metadata.prep_time || 0) + (recipeTyped.metadata.cook_time || 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/famille">
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

          <CopyRecipeButton recipeId={id} />
        </div>
      </div>

      {/* Image principale */}
      {recipeTyped.image_url && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-accent/30">
          <img
            src={recipeTyped.image_url}
            alt={recipeTyped.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Titre et badges */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground">
          {recipeTyped.title}
        </h1>

        {/* Propriétaire */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="w-4 h-4" />
          <span className="text-sm">Recette de <strong>{ownerName}</strong></span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {RECIPE_CATEGORY_LABELS[recipeTyped.category]}
          </Badge>

          {recipeTyped.appliance && (
            <Badge variant="secondary" className={RECIPE_APPLIANCE_COLORS[recipeTyped.appliance]}>
              {RECIPE_APPLIANCE_LABELS[recipeTyped.appliance]}
            </Badge>
          )}

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
