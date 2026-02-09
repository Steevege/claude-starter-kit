'use client'

/**
 * Bouton toggle favori avec état optimiste
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface FavoriteToggleButtonProps {
  recipeId: string
  isFavorite: boolean
  size?: 'sm' | 'md'
}

export function FavoriteToggleButton({
  recipeId,
  isFavorite,
  size = 'sm',
}: FavoriteToggleButtonProps) {
  const router = useRouter()
  const [optimisticFavorite, setOptimisticFavorite] = useState(isFavorite)
  const [isUpdating, setIsUpdating] = useState(false)

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUpdating) return

    const newValue = !optimisticFavorite
    setOptimisticFavorite(newValue)
    setIsUpdating(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: newValue })
        .eq('id', recipeId)

      if (error) {
        console.error('Erreur toggle favori:', error)
        setOptimisticFavorite(!newValue)
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Erreur:', err)
      setOptimisticFavorite(!newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={cn(
        'transition-colors focus:outline-none disabled:opacity-50',
        isUpdating && 'cursor-wait'
      )}
      aria-label={optimisticFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        className={cn(
          iconSize,
          'transition-colors',
          optimisticFavorite
            ? 'text-red-500 fill-red-500'
            : 'text-muted-foreground hover:text-red-400'
        )}
      />
    </button>
  )
}
