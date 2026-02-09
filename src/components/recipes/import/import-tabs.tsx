'use client'

/**
 * Orchestrateur des 3 modes d'import
 * Onglets URL / Texte / Photo → Formulaire de validation pré-rempli
 */

import { useState } from 'react'
import { Link2, FileText, Camera, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecipeFormSimple } from '@/components/recipes/recipe-form-simple'
import { UrlImport } from './url-import'
import { TextImport } from './text-import'
import { PhotoImport } from './photo-import'
import type { ParseResult, ParsedRecipe } from '@/lib/parsers/types'
import type { RecipeSimpleInput } from '@/lib/schemas/recipe-simple'

type ImportMode = 'url' | 'text' | 'photo'

const TABS: { mode: ImportMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'url', label: 'URL', icon: <Link2 className="w-4 h-4" /> },
  { mode: 'text', label: 'Texte', icon: <FileText className="w-4 h-4" /> },
  { mode: 'photo', label: 'Photo', icon: <Camera className="w-4 h-4" /> },
]

export function ImportTabs() {
  const [mode, setMode] = useState<ImportMode>('url')
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const handleParseResult = (result: ParseResult) => {
    if (result.success && result.recipe) {
      setParsedRecipe(result.recipe)
    }
  }

  const handlePhotoContinue = (file: File) => {
    setPhotoFile(file)
    setParsedRecipe({
      title: '',
      category: 'plat',
      ingredients_text: '',
      steps_text: '',
      source_type: 'photo',
    })
  }

  const handlePhotoResult = (result: ParseResult, file: File) => {
    if (result.success && result.recipe) {
      setPhotoFile(file)
      setParsedRecipe(result.recipe)
    }
  }

  const handleBack = () => {
    setParsedRecipe(null)
    setPhotoFile(null)
  }

  // Formulaire de validation pré-rempli
  if (parsedRecipe) {
    const defaultValues: Partial<RecipeSimpleInput> = {
      title: parsedRecipe.title,
      category: parsedRecipe.category,
      ingredients_text: parsedRecipe.ingredients_text,
      steps_text: parsedRecipe.steps_text,
      prep_time: parsedRecipe.prep_time,
      cook_time: parsedRecipe.cook_time,
      servings: parsedRecipe.servings,
      difficulty: parsedRecipe.difficulty,
      source_type: parsedRecipe.source_type,
      source_url: parsedRecipe.source_url,
      is_favorite: false,
    }

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;import
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Vérifiez et complétez la recette</CardTitle>
            <p className="text-sm text-gray-500">
              La recette a été pré-remplie automatiquement. Vérifiez les informations et corrigez si nécessaire.
            </p>
          </CardHeader>
        </Card>

        <RecipeFormSimple
          defaultValues={defaultValues}
          imageUrl={parsedRecipe.image_url}
          photoFile={photoFile}
        />
      </div>
    )
  }

  // Sélection du mode d'import
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source de la recette</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Onglets */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {TABS.map(({ mode: tabMode, label, icon }) => (
            <button
              key={tabMode}
              onClick={() => setMode(tabMode)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === tabMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Contenu selon le mode */}
        {mode === 'url' && <UrlImport onResult={handleParseResult} onSwitchToText={() => setMode('text')} />}
        {mode === 'text' && <TextImport onResult={handleParseResult} />}
        {mode === 'photo' && <PhotoImport onContinue={handlePhotoContinue} onResult={handlePhotoResult} />}
      </CardContent>
    </Card>
  )
}
