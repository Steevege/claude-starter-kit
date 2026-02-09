'use client'

/**
 * Composant d'import par photo
 * Capture appareil photo + galerie, preview, puis :
 * - "Analyser avec l'IA" : envoie à Claude Vision pour extraction
 * - "Remplir manuellement" : formulaire vide avec photo attachée
 */

import { useState, useRef } from 'react'
import { Camera, ImagePlus, ArrowRight, Sparkles, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { compressImageToBase64 } from '@/lib/utils/image-compress'
import type { ParseResult } from '@/lib/parsers/types'

interface PhotoImportProps {
  onContinue: (imageFile: File) => void
  onResult?: (result: ParseResult, imageFile: File) => void
}

export function PhotoImport({ onContinue, onResult }: PhotoImportProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setImageFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleAnalyzeWithAI = async () => {
    if (!imageFile) return

    setError(null)
    setIsAnalyzing(true)

    try {
      // Compresser l'image avant envoi
      const compressed = await compressImageToBase64(imageFile)

      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'photo',
          image: compressed.base64,
          mediaType: compressed.mediaType,
        }),
      })

      const result: ParseResult = await response.json()

      if (result.success && onResult) {
        onResult(result, imageFile)
      } else if (result.success && !onResult) {
        // Fallback si onResult pas fourni
        onContinue(imageFile)
      } else {
        setError(result.error || 'L\'IA n\'a pas pu lire cette image. Essayez de remplir manuellement.')
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau et réessayez.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Photo de la recette</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Prenez en photo une recette d&apos;un livre ou magazine. L&apos;IA peut analyser l&apos;image pour pré-remplir le formulaire.
        </p>

        {/* Boutons capture/galerie */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Appareil photo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryRef.current?.click()}
            disabled={isAnalyzing}
            className="flex-1"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Galerie
          </Button>
        </div>

        {/* Inputs cachés */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="hidden"
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Preview + actions */}
      {preview && (
        <div className="space-y-4">
          <div className="relative w-full max-h-80 rounded-lg overflow-hidden bg-accent/30 border">
            <img
              src={preview}
              alt="Photo de recette"
              className="w-full h-full object-contain"
            />
          </div>

          {error && (
            <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser avec l&apos;IA
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => imageFile && onContinue(imageFile)}
              disabled={isAnalyzing}
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Remplir manuellement
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
