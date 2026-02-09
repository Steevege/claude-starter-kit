'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface GenerateImageButtonProps {
  recipeId: string
  title: string
  category: string
  imageUrl?: string | null
}

export function GenerateImageButton({ recipeId, title, category, imageUrl }: GenerateImageButtonProps) {
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

      router.refresh()
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // Recette avec image existante → image + bouton regénérer en overlay
  if (imageUrl) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-accent/30">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center space-y-2">
                <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-sm">Génération en cours...</p>
              </div>
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 opacity-80 hover:opacity-100 shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Regénérer
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  // Recette sans image → placeholder + bouton générer
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
