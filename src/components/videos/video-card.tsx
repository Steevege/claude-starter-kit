'use client'

/**
 * Carte vidéo pour affichage en grille
 */

import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import {
  RECIPE_CATEGORY_LABELS,
  VIDEO_PLATFORM_LABELS,
  VIDEO_PLATFORM_COLORS,
  detectVideoPlatform,
} from '@/lib/types/recipe'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FavoriteToggleButton } from '@/components/recipes/favorite-toggle-button'
import { DeleteRecipeButton } from '@/components/recipes/delete-recipe-button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Couleurs par catégorie (réutilisées de recipe-card)
const CATEGORY_COLORS: Record<string, string> = {
  apero: 'bg-orange-100 text-orange-800',
  entree: 'bg-green-100 text-green-800',
  plat: 'bg-blue-100 text-blue-800',
  accompagnement: 'bg-purple-100 text-purple-800',
  sauce: 'bg-yellow-100 text-yellow-800',
  dessert: 'bg-pink-100 text-pink-800',
  boisson: 'bg-cyan-100 text-cyan-800',
  petit_dejeuner: 'bg-amber-100 text-amber-800',
  gouter: 'bg-rose-100 text-rose-800',
  pain_viennoiserie: 'bg-orange-100 text-orange-800',
  conserve: 'bg-lime-100 text-lime-800',
}

interface VideoCardProps {
  recipe: Recipe
  className?: string
}

export function VideoCard({ recipe, className }: VideoCardProps) {
  const router = useRouter()
  const videoUrl = recipe.metadata.source_url || ''
  const platform = recipe.metadata.platform || detectVideoPlatform(videoUrl)
  const notes = recipe.metadata.notes || ''
  const categoryColor = CATEGORY_COLORS[recipe.category] || 'bg-gray-100 text-gray-800'

  return (
    <Card className={cn('transition-all hover:shadow-lg', className)}>
      <CardContent className="p-4 space-y-3">
        {/* Titre + favori */}
        <div className="flex items-start justify-between gap-2">
          <Link href={`/videos/${recipe.id}/edit`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
              {recipe.title}
            </h3>
          </Link>
          <div className="flex-shrink-0">
            <FavoriteToggleButton
              recipeId={recipe.id}
              isFavorite={recipe.is_favorite}
              size="sm"
            />
          </div>
        </div>

        {/* Note tronquée */}
        {notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notes}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className={VIDEO_PLATFORM_COLORS[platform]}>
            {VIDEO_PLATFORM_LABELS[platform]}
          </Badge>
          <Badge variant="secondary" className={categoryColor}>
            {RECIPE_CATEGORY_LABELS[recipe.category]}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex justify-between">
        {/* Ouvrir dans un nouvel onglet */}
        {videoUrl && (
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir
            </Button>
          </a>
        )}

        {/* Supprimer */}
        <div onClick={(e) => e.stopPropagation()}>
          <DeleteRecipeButton
            recipeId={recipe.id}
            recipeTitle={recipe.title}
            variant="ghost"
            size="icon"
            iconOnly
            onDeleted={() => {
              router.push('/videos')
              router.refresh()
            }}
          />
        </div>
      </CardFooter>
    </Card>
  )
}
