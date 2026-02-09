'use client'

/**
 * Composant d'import par texte collé
 * Grande textarea + analyse via IA côté serveur
 */

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ParseResult } from '@/lib/parsers/types'

interface TextImportProps {
  onResult: (result: ParseResult) => void
}

export function TextImport({ onResult }: TextImportProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'text', text }),
      })

      const result: ParseResult = await response.json()

      if (result.success) {
        onResult(result)
      } else {
        setError(result.error || 'Impossible d\'analyser ce texte.')
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau et réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipe-text">Texte de la recette</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-2">
          Collez le texte complet d&apos;une recette (titre, ingrédients, étapes). L&apos;IA analysera automatiquement le contenu.
        </p>
        <Textarea
          id="recipe-text"
          rows={12}
          placeholder={`Exemple :\n\nTarte aux pommes\n\nIngrédients :\n1 pâte feuilletée\n4 pommes\n50 g de sucre\n30 g de beurre\n\nPréparation :\n1. Préchauffer le four à 200°C\n2. Étaler la pâte dans un moule\n3. Éplucher et couper les pommes en lamelles\n4. Disposer sur la pâte\n5. Saupoudrer de sucre et beurre\n6. Enfourner 30 minutes`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <Button
        onClick={handleAnalyze}
        disabled={!text.trim() || isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Analyser le texte
          </>
        )}
      </Button>
    </div>
  )
}
