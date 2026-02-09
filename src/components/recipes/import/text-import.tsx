'use client'

/**
 * Composant d'import par texte collé
 * Grande textarea + bouton "Analyser le texte"
 */

import { useState } from 'react'
import { FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseRecipeFromText } from '@/lib/parsers/text-parser'
import type { ParseResult } from '@/lib/parsers/types'

interface TextImportProps {
  onResult: (result: ParseResult) => void
}

export function TextImport({ onResult }: TextImportProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = () => {
    setError(null)
    const result = parseRecipeFromText(text)

    if (result.success) {
      onResult(result)
    } else {
      setError(result.error || 'Impossible d\'analyser ce texte.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipe-text">Texte de la recette</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-2">
          Collez le texte complet d&apos;une recette (titre, ingrédients, étapes). Le format est détecté automatiquement.
        </p>
        <Textarea
          id="recipe-text"
          rows={12}
          placeholder={`Exemple :\n\nTarte aux pommes\n\nIngrédients :\n1 pâte feuilletée\n4 pommes\n50 g de sucre\n30 g de beurre\n\nPréparation :\n1. Préchauffer le four à 200°C\n2. Étaler la pâte dans un moule\n3. Éplucher et couper les pommes en lamelles\n4. Disposer sur la pâte\n5. Saupoudrer de sucre et beurre\n6. Enfourner 30 minutes`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <Button
        onClick={handleAnalyze}
        disabled={!text.trim()}
        className="w-full sm:w-auto"
      >
        <FileText className="w-4 h-4 mr-2" />
        Analyser le texte
      </Button>
    </div>
  )
}
