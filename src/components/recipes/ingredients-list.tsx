'use client'

import { useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Ingredient, IngredientGroup } from '@/lib/types/recipe'

interface IngredientsListProps {
  ingredients: IngredientGroup[]
  servings?: number
  textSize?: 'sm' | 'base'
}

/**
 * Formate une quantité ajustée :
 * - Arrondi à 1 décimale
 * - Supprime le .0 inutile
 */
function formatQuantity(quantity: number, multiplier: number): string {
  const adjusted = quantity * multiplier
  const rounded = Math.round(adjusted * 10) / 10
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)
}

// Regex pour extraire "300 g" ou "3" ou "1/2" en début de texte name
// Capture : quantité (nombre ou fraction), unité optionnelle, reste du texte
const QUANTITY_REGEX = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(g|kg|ml|cl|l|cs|cc|cuillères?\s+à\s+(?:soupe|café)|pincées?|sachets?)?\s*(?:de\s+|d')?(.+)$/i

type ParsedIngredient = {
  quantity: number | null
  unit: string | null
  text: string
}

/**
 * Parse un ingrédient qui a toute sa description dans le champ name.
 * Ex: "300 g de farine" → { quantity: 300, unit: "g", text: "farine" }
 * Ex: "3 oeufs entiers" → { quantity: 3, unit: null, text: "oeufs entiers" }
 * Ex: "sel et poivre" → { quantity: null, unit: null, text: "sel et poivre" }
 */
function parseInlineQuantity(name: string): ParsedIngredient {
  const match = name.match(QUANTITY_REGEX)
  if (!match) return { quantity: null, unit: null, text: name }

  const rawQty = match[1].replace(',', '.')
  let quantity: number
  if (rawQty.includes('/')) {
    const [num, den] = rawQty.split('/').map(s => parseFloat(s.trim()))
    quantity = num / den
  } else {
    quantity = parseFloat(rawQty)
  }

  if (isNaN(quantity)) return { quantity: null, unit: null, text: name }

  return {
    quantity,
    unit: match[2]?.trim() || null,
    text: match[3].trim(),
  }
}

/**
 * Rend un ingrédient avec quantité ajustée.
 * Gère 2 cas :
 * 1. Ingrédient structuré (quantity/unit séparés) - directement
 * 2. Ingrédient en texte brut (tout dans name) - parse dynamiquement
 */
function renderIngredient(item: Ingredient, multiplier: number): React.ReactNode {
  // Cas 1 : ingrédient structuré avec quantity
  if (item.quantity != null) {
    return (
      <>
        {item.unit ? (
          <span className="font-medium">
            {formatQuantity(item.quantity, multiplier)} {item.unit}{' '}
          </span>
        ) : (
          <span className="font-medium">
            {formatQuantity(item.quantity, multiplier)}{' '}
          </span>
        )}
        {item.name}
        {item.note && (
          <span className="text-muted-foreground italic"> ({item.note})</span>
        )}
      </>
    )
  }

  // Cas 2 : tout est dans name, on parse dynamiquement
  const parsed = parseInlineQuantity(item.name)
  if (parsed.quantity != null) {
    return (
      <>
        <span className="font-medium">
          {formatQuantity(parsed.quantity, multiplier)}
          {parsed.unit ? ` ${parsed.unit} ` : ' '}
        </span>
        {parsed.text}
      </>
    )
  }

  // Pas de quantité trouvée → affichage brut
  return <>{item.name}</>
}

export function IngredientsList({ ingredients, servings, textSize = 'sm' }: IngredientsListProps) {
  const [targetServings, setTargetServings] = useState(servings ?? 0)

  const hasServings = servings !== undefined && servings > 0
  const multiplier = hasServings ? targetServings / servings : 1
  const isModified = hasServings && targetServings !== servings

  const textClass = textSize === 'base' ? 'text-base' : 'text-sm'

  return (
    <div className="space-y-4">
      {/* Contrôle des portions */}
      {hasServings && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Portions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTargetServings((s) => Math.max(1, s - 1))}
              disabled={targetServings <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold w-8 text-center tabular-nums">
              {targetServings}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTargetServings((s) => s + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            {isModified && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setTargetServings(servings)}
                title="Revenir aux portions d'origine"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Liste des ingrédients */}
      {ingredients.map((group, groupIdx) => (
        <div key={groupIdx}>
          {group.group && (
            <h4 className={`font-semibold ${textClass} text-foreground mb-2`}>
              {group.group}
            </h4>
          )}
          <ul className="space-y-2">
            {group.items.map((item, itemIdx) => (
              <li key={itemIdx} className={`flex gap-2 ${textClass}`}>
                <span className="text-muted-foreground/50">•</span>
                <span>{renderIngredient(item, multiplier)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
