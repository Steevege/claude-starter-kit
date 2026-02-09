'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, ClipboardList, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { Recipe } from '@/lib/types/recipe'
import { IngredientsList } from '@/components/recipes/ingredients-list'

interface CookingModeProps {
  recipe: Recipe
}

export function CookingMode({ recipe }: CookingModeProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)

  const steps = recipe.steps
  const totalSteps = steps.length
  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  const goBack = useCallback(() => {
    router.push(`/recettes/${recipe.id}`)
  }, [router, recipe.id])

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1)
  }, [isFirst])

  const goNext = useCallback(() => {
    if (!isLast) setCurrentStep((s) => s + 1)
  }, [isLast])

  // Navigation clavier
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') goBack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext, goBack])

  if (totalSteps === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-lg text-muted-foreground">Cette recette n&apos;a pas d&apos;étapes.</p>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          Retour à la recette
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header fixe */}
      <header className="flex-shrink-0 border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="h-11 px-3"
          >
            <X className="w-5 h-5 mr-1" />
            Quitter
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Étape {currentStep + 1}/{totalSteps}
          </span>
        </div>
        {/* Barre de progression */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Contenu étape - zone scrollable */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 lg:px-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-primary mb-4">
            Étape {step.order}
          </h2>
          <p className="text-xl md:text-2xl leading-relaxed text-foreground">
            {step.instruction}
          </p>
          {step.duration && (
            <p className="mt-6 text-base text-muted-foreground">
              ⏱ {step.duration} min
            </p>
          )}
        </div>
      </main>

      {/* Barre d'actions fixe en bas */}
      <footer className="flex-shrink-0 border-t bg-background px-4 py-3">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="h-12"
            onClick={() => setShowIngredients(true)}
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Ingrédients</span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-4"
              onClick={goPrev}
              disabled={isFirst}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Préc
            </Button>

            {isLast ? (
              <Button
                size="lg"
                className="h-12 px-6"
                onClick={goBack}
              >
                <Check className="w-5 h-5 mr-2" />
                Terminer
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-12 px-4"
                onClick={goNext}
              >
                Suiv
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* Panneau Ingrédients (Sheet depuis le bas) */}
      <Sheet open={showIngredients} onOpenChange={setShowIngredients}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ingrédients</SheetTitle>
            <SheetDescription>{recipe.title}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <IngredientsList
              ingredients={recipe.ingredients}
              servings={recipe.metadata.servings}
              textSize="base"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
