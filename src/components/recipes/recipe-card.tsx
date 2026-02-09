/**
 * Composant carte recette pour affichage en grille
 */

import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import { RECIPE_CATEGORY_LABELS } from '@/lib/types/recipe'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
        'overflow-hidden transition-all hover:shadow-lg cursor-pointer',
        className
      )}>
        {/* Image */}
        <div className="relative aspect-video w-full bg-gray-200">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Badge favori */}
          {recipe.is_favorite && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
          )}
        </div>

        {/* Contenu */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">
            {recipe.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            {/* Temps total */}
            {(recipe.metadata.prep_time || recipe.metadata.cook_time) && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {(recipe.metadata.prep_time || 0) + (recipe.metadata.cook_time || 0)} min
              </span>
            )}

            {/* Portions */}
            {recipe.metadata.servings && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
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
