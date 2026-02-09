'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GenerateImageButtonProps {
  recipeId: string
  title: string
  category: string
}

export function GenerateImageButton({ recipeId, title, category }: GenerateImageButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, title, category }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Erreur inconnue')
        return
      }

      // Rafraîchir la page pour afficher la nouvelle image
      router.refresh()
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-accent/30 flex items-center justify-center">
        <div className="text-center space-y-3 p-6">
          <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Pas de photo pour cette recette</p>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4 mr-2" />
                Générer une image avec l'IA
              </>
            )}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
