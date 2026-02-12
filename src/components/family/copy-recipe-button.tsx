'use client'

/**
 * Bouton pour copier une recette familiale dans ses propres recettes
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface CopyRecipeButtonProps {
  recipeId: string
}

export function CopyRecipeButton({ recipeId }: CopyRecipeButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCopy = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/family/recipes/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: recipeId }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Erreur lors de la copie')
        return
      }

      setCopied(true)
      setTimeout(() => {
        router.push(`/recettes/${result.recipe.id}`)
      }, 1000)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  if (copied) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="w-4 h-4 mr-2 text-green-600" />
        Copié !
      </Button>
    )
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={isLoading}
      >
        <Copy className="w-4 h-4 mr-2" />
        {isLoading ? 'Copie...' : 'Copier dans mes recettes'}
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
