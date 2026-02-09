/**
 * Composant carte recette pour affichage en grille
 */

import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon, Clock, Users } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import { RECIPE_CATEGORY_LABELS } from '@/lib/types/recipe'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FavoriteToggleButton } from '@/components/recipes/favorite-toggle-button'
import { cn } from '@/lib/utils'

interface RecipeCardProps {
  recipe: Recipe
  className?: string
}

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  apero: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  entree: 'bg-green-100 text-green-800 hover:bg-green-200',
  plat: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  accompagnement: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  sauce: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  dessert: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
  boisson: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
  petit_dejeuner: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  gouter: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
  pain_viennoiserie: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  conserve: 'bg-lime-100 text-lime-800 hover:bg-lime-200',
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const categoryColor = CATEGORY_COLORS[recipe.category] || 'bg-gray-100 text-gray-800'

  return (
    <Link href={`/recettes/${recipe.id}`}>
      <Card className={cn(
        'overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        className
      )}>
        {/* Image */}
        <div className="relative aspect-video w-full bg-accent/30">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/50">
              <ImageIcon className="w-16 h-16" />
            </div>
          )}

          {/* Toggle favori */}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5">
            <FavoriteToggleButton
              recipeId={recipe.id}
              isFavorite={recipe.is_favorite}
              size="sm"
            />
          </div>
        </div>

        {/* Contenu */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">
            {recipe.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Temps total */}
            {(recipe.metadata.prep_time || recipe.metadata.cook_time) && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {(recipe.metadata.prep_time || 0) + (recipe.metadata.cook_time || 0)} min
              </span>
            )}

            {/* Portions */}
            {recipe.metadata.servings && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.metadata.servings}
              </span>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="px-4 pb-4 pt-0">
          <Badge variant="secondary" className={categoryColor}>
            {RECIPE_CATEGORY_LABELS[recipe.category]}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  )
}
