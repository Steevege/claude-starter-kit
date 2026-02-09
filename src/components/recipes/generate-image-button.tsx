'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { compressImageToBase64 } from '@/lib/utils/image-compress'
import Image from 'next/image'

interface GenerateImageButtonProps {
  recipeId: string
  title: string
  category: string
  imageUrl?: string | null
}

export function GenerateImageButton({ recipeId, title, category, imageUrl }: GenerateImageButtonProps) {
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<'generate' | 'upload' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setLoadingType('generate')
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
      setLoadingType(null)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setLoadingType('upload')
    setError(null)

    try {
      // Compresser l'image
      const compressed = await compressImageToBase64(file, 1200, 0.85)
      const imageBuffer = Uint8Array.from(atob(compressed.base64), c => c.charCodeAt(0))

      // Upload vers Supabase Storage
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Non authentifié')
        return
      }

      const filePath = `${user.id}/${recipeId}.webp`

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        setError('Erreur lors de l\'upload. Réessayez.')
        return
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath)

      const newImageUrl = `${publicUrl}?t=${Date.now()}`

      // Mettre à jour la recette
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: newImageUrl })
        .eq('id', recipeId)

      if (updateError) {
        setError('Image uploadée mais erreur lors de la mise à jour.')
        return
      }

      router.refresh()
    } catch {
      setError('Erreur lors de l\'upload. Réessayez.')
    } finally {
      setLoading(false)
      setLoadingType(null)
      // Reset le file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const loadingLabel = loadingType === 'upload' ? 'Upload en cours...' : 'Génération en cours...'

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleUpload}
      className="hidden"
    />
  )

  // Recette avec image existante
  if (imageUrl) {
    return (
      <div className="space-y-2">
        {hiddenInput}
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
                <p className="text-sm">{loadingLabel}</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="secondary"
              size="sm"
              className="opacity-80 hover:opacity-100 shadow-md"
            >
              <Upload className="w-4 h-4 mr-1" />
              Ma photo
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="secondary"
              size="sm"
              className="opacity-80 hover:opacity-100 shadow-md"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Regénérer
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  // Recette sans image
  return (
    <div className="space-y-2">
      {hiddenInput}
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-accent/30 flex items-center justify-center">
        <div className="text-center space-y-3 p-6">
          <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Pas de photo pour cette recette</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading && loadingType === 'upload' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Ma photo
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading && loadingType === 'generate' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Générer avec l'IA
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
