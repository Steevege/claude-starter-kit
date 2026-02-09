'use client'

/**
 * Composant d'import par URL
 * Input URL + bouton "Analyser" + loading/erreur
 */

import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ParseResult } from '@/lib/parsers/types'

interface UrlImportProps {
  onResult: (result: ParseResult) => void
}

export function UrlImport({ onResult }: UrlImportProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!url.trim()) return

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const result: ParseResult = await response.json()

      if (result.success) {
        onResult(result)
      } else {
        setError(result.error || 'Erreur lors de l\'analyse.')
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipe-url">URL de la recette</Label>
        <p className="text-sm text-gray-500 mt-1 mb-2">
          Collez le lien d&apos;une recette depuis Marmiton, 750g, CuisineAZ, ou tout autre site.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="recipe-url"
              type="url"
              placeholder="https://www.marmiton.org/recettes/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!url.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse...
              </>
            ) : (
              'Analyser'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      )}
    </div>
  )
}
