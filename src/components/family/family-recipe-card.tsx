'use client'

/**
 * Carte recette familiale (lecture seule)
 * Variante de recipe-card sans actions d'édition, avec nom du propriétaire
 */

import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon, Clock, Users, User } from 'lucide-react'

import type { Recipe } from '@/lib/types/recipe'
import { RECIPE_CATEGORY_LABELS, RECIPE_APPLIANCE_LABELS, RECIPE_APPLIANCE_COLORS } from '@/lib/types/recipe'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Couleurs par catégorie (identiques à recipe-card)
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

interface FamilyRecipeCardProps {
  recipe: Recipe
  ownerName: string
  className?: string
}

export function FamilyRecipeCard({ recipe, ownerName, className }: FamilyRecipeCardProps) {
  const categoryColor = CATEGORY_COLORS[recipe.category] || 'bg-gray-100 text-gray-800'

  return (
    <Link href={`/famille/${recipe.id}`}>
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

          {/* Badge propriétaire */}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{ownerName}</span>
          </div>
        </div>

        {/* Contenu */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">
            {recipe.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {(recipe.metadata.prep_time || recipe.metadata.cook_time) && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {(recipe.metadata.prep_time || 0) + (recipe.metadata.cook_time || 0)} min
              </span>
            )}

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
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className={categoryColor}>
              {RECIPE_CATEGORY_LABELS[recipe.category]}
            </Badge>
            {recipe.appliance && (
              <Badge variant="secondary" className={RECIPE_APPLIANCE_COLORS[recipe.appliance]}>
                {RECIPE_APPLIANCE_LABELS[recipe.appliance]}
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
