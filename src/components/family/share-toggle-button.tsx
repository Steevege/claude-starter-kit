'use client'

/**
 * Bouton toggle partage familial avec état optimiste
 * Pattern identique au FavoriteToggleButton
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ShareToggleButtonProps {
  recipeId: string
  isShared: boolean
  size?: 'sm' | 'md'
}

export function ShareToggleButton({
  recipeId,
  isShared,
  size = 'sm',
}: ShareToggleButtonProps) {
  const router = useRouter()
  const [optimisticShared, setOptimisticShared] = useState(isShared)
  const [isUpdating, setIsUpdating] = useState(false)

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUpdating) return

    const newValue = !optimisticShared
    setOptimisticShared(newValue)
    setIsUpdating(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('recipes')
        .update({ is_shared: newValue })
        .eq('id', recipeId)

      if (error) {
        console.error('Erreur toggle partage:', error)
        setOptimisticShared(!newValue)
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Erreur:', err)
      setOptimisticShared(!newValue)
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
      aria-label={optimisticShared ? 'Ne plus partager en famille' : 'Partager en famille'}
      title={optimisticShared ? 'Partagée en famille' : 'Partager en famille'}
    >
      <Users
        className={cn(
          iconSize,
          'transition-colors',
          optimisticShared
            ? 'text-blue-500 fill-blue-500'
            : 'text-muted-foreground hover:text-blue-400'
        )}
      />
    </button>
  )
}
