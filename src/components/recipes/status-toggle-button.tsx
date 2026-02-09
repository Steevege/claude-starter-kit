'use client'

/**
 * Badge cliquable pour cycler le statut d'une recette
 * (à tester → testée → approuvée → à tester)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import {
  type RecipeStatus,
  RECIPE_STATUS_LABELS,
  RECIPE_STATUS_COLORS,
  RECIPE_STATUS_CYCLE,
} from '@/lib/types/recipe'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusToggleButtonProps {
  recipeId: string
  status: RecipeStatus
}

export function StatusToggleButton({ recipeId, status }: StatusToggleButtonProps) {
  const router = useRouter()
  const [optimisticStatus, setOptimisticStatus] = useState(status)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUpdating) return

    const nextStatus = RECIPE_STATUS_CYCLE[optimisticStatus]
    setOptimisticStatus(nextStatus)
    setIsUpdating(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('recipes')
        .update({ status: nextStatus })
        .eq('id', recipeId)

      if (error) {
        console.error('Erreur changement statut:', error)
        setOptimisticStatus(optimisticStatus)
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Erreur:', err)
      setOptimisticStatus(optimisticStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'cursor-pointer transition-colors select-none',
        RECIPE_STATUS_COLORS[optimisticStatus],
        isUpdating && 'opacity-50 cursor-wait'
      )}
      onClick={handleToggle}
      aria-label={`Statut : ${RECIPE_STATUS_LABELS[optimisticStatus]}. Cliquer pour changer.`}
    >
      {RECIPE_STATUS_LABELS[optimisticStatus]}
    </Badge>
  )
}
