'use client'

/**
 * Filtres pour la liste de recettes
 */

import { useRouter, useSearchParams } from 'next/navigation'
import {
  RECIPE_CATEGORY_LABELS,
  RECIPE_STATUS_LABELS,
  RECIPE_STATUSES,
  RECIPE_APPLIANCE_LABELS,
  RECIPE_APPLIANCES,
  type RecipeCategory,
  type RecipeStatus,
  type RecipeAppliance,
} from '@/lib/types/recipe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

const CATEGORIES: RecipeCategory[] = [
  'apero',
  'entree',
  'plat',
  'accompagnement',
  'sauce',
  'dessert',
  'boisson',
  'petit_dejeuner',
  'gouter',
  'pain_viennoiserie',
  'conserve',
]

export function RecipeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')
  const currentAppliance = searchParams.get('appliance')
  const currentStatus = searchParams.get('status')
  const currentSearch = searchParams.get('search') || ''

  const [searchValue, setSearchValue] = useState(currentSearch)

  const handleCategoryClick = (category: RecipeCategory) => {
    const params = new URLSearchParams(searchParams.toString())

    if (currentCategory === category) {
      params.delete('category')
    } else {
      params.set('category', category)
    }

    router.push(`/recettes?${params.toString()}`)
  }

  const handleApplianceClick = (appliance: RecipeAppliance) => {
    const params = new URLSearchParams(searchParams.toString())

    if (currentAppliance === appliance) {
      params.delete('appliance')
    } else {
      params.set('appliance', appliance)
    }

    router.push(`/recettes?${params.toString()}`)
  }

  const handleStatusClick = (status: RecipeStatus) => {
    const params = new URLSearchParams(searchParams.toString())

    if (currentStatus === status) {
      params.delete('status')
    } else {
      params.set('status', status)
    }

    router.push(`/recettes?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())

    if (searchValue.trim()) {
      params.set('search', searchValue.trim())
    } else {
      params.delete('search')
    }

    router.push(`/recettes?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchValue('')
    router.push('/recettes')
  }

  const hasFilters = currentCategory || currentAppliance || currentStatus || currentSearch

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="text"
            name="search"
            aria-label="Rechercher une recette"
            placeholder="Rechercher une recette\u2026"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Rechercher</Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
          >
            <X className="w-4 h-4 mr-2" />
            Effacer
          </Button>
        )}
      </form>

      {/* Catégories */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Catégories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isActive = currentCategory === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className="inline-flex items-center"
              >
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-accent"
                >
                  {RECIPE_CATEGORY_LABELS[category]}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Appareil */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Appareil</p>
        <div className="flex flex-wrap gap-2">
          {RECIPE_APPLIANCES.map((appliance) => {
            const isActive = currentAppliance === appliance
            return (
              <button
                key={appliance}
                type="button"
                onClick={() => handleApplianceClick(appliance)}
                className="inline-flex items-center"
              >
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-accent"
                >
                  {RECIPE_APPLIANCE_LABELS[appliance]}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Statut */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Statut</p>
        <div className="flex flex-wrap gap-2">
          {RECIPE_STATUSES.map((status) => {
            const isActive = currentStatus === status
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                className="inline-flex items-center"
              >
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-accent"
                >
                  {RECIPE_STATUS_LABELS[status]}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
