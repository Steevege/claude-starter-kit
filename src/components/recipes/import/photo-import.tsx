'use client'

/**
 * Composant d'import par photo
 * Capture appareil photo + galerie, preview, puis formulaire vide
 */

import { useState, useRef } from 'react'
import { Camera, ImagePlus, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface PhotoImportProps {
  onContinue: (imageFile: File) => void
}

export function PhotoImport({ onContinue }: PhotoImportProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Photo de la recette</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Prenez en photo une recette d&apos;un livre ou magazine, puis remplissez le formulaire en vous y référant.
        </p>

        {/* Boutons capture/galerie */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraRef.current?.click()}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Appareil photo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryRef.current?.click()}
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

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="relative w-full max-h-80 rounded-lg overflow-hidden bg-accent/30 border">
            <img
              src={preview}
              alt="Photo de recette"
              className="w-full h-full object-contain"
            />
          </div>

          <Button
            onClick={() => imageFile && onContinue(imageFile)}
            className="w-full"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continuer vers le formulaire
          </Button>
        </div>
      )}
    </div>
  )
}
