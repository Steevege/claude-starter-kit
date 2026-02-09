'use client'

/**
 * Formulaire de création/édition de recette
 * Gestion dynamique des ingrédients et étapes
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Upload } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { recipeInsertSchema, type RecipeInsertInput } from '@/lib/schemas/recipe'
import { RECIPE_CATEGORY_LABELS, type RecipeCategory } from '@/lib/types/recipe'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CATEGORIES: RecipeCategory[] = [
  'apero', 'entree', 'plat', 'accompagnement', 'sauce',
  'dessert', 'boisson', 'petit_dejeuner', 'gouter',
  'pain_viennoiserie', 'conserve'
]

interface RecipeFormProps {
  defaultValues?: Partial<RecipeInsertInput>
  recipeId?: string
}

export function RecipeForm({ defaultValues, recipeId }: RecipeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.image_url || null
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RecipeInsertInput>({
    resolver: zodResolver(recipeInsertSchema),
    defaultValues: defaultValues || {
      title: '',
      category: 'plat',
      ingredients: [{ items: [{ name: '' }] }],
      steps: [{ order: 1, instruction: '' }],
      metadata: {},
      source_type: 'manual',
      is_favorite: false,
      tags: [],
    },
  })

  // Gestion dynamique des ingrédients
  const { fields: ingredientGroups, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: 'ingredients',
  })

  // Gestion dynamique des étapes
  const { fields: steps, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: 'steps',
  })

  // Upload image vers Supabase Storage
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (userId: string, recipeId: string): Promise<string | null> => {
    if (!imageFile) return null

    const supabase = createClient()
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${userId}/${recipeId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, imageFile, { upsert: true })

    if (uploadError) {
      console.error('Erreur upload image:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const onSubmit = async (data: RecipeInsertInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Vérifier auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Non authentifié')
        return
      }

      // Créer/Update recette
      let recipeIdToUse = recipeId

      if (recipeId) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipeId)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        // Mode création
        const { data: newRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert({
            ...data,
            user_id: user.id,
          })
          .select()
          .single()

        if (insertError) throw insertError
        recipeIdToUse = newRecipe.id
      }

      // Upload image si présente
      if (imageFile && recipeIdToUse) {
        const imageUrl = await uploadImage(user.id, recipeIdToUse)
        if (imageUrl) {
          await supabase
            .from('recipes')
            .update({ image_url: imageUrl })
            .eq('id', recipeIdToUse)
        }
      }

      // Redirection
      router.push(`/recettes/${recipeIdToUse}`)
      router.refresh()
    } catch (err) {
      console.error('Erreur soumission:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Pâtes Carbonara"
              disabled={isLoading}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isLoading}
              {...register('category')}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {RECIPE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Image */}
          <div>
            <Label htmlFor="image">Image</Label>
            <div className="mt-2 space-y-4">
              {imagePreview && (
                <div className="relative w-full h-48 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="prep_time">Préparation (min)</Label>
              <Input
                id="prep_time"
                type="number"
                min="0"
                {...register('metadata.prep_time', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="cook_time">Cuisson (min)</Label>
              <Input
                id="cook_time"
                type="number"
                min="0"
                {...register('metadata.cook_time', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="servings">Portions</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                {...register('metadata.servings', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulté</Label>
              <select
                id="difficulty"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('metadata.difficulty')}
              >
                <option value="">-</option>
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingrédients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingrédients *</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendGroup({ items: [{ name: '' }] })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Groupe
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {ingredientGroups.map((group, groupIdx) => (
            <div key={group.id} className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Nom du groupe (optionnel)"
                  {...register(`ingredients.${groupIdx}.group`)}
                />
                {ingredientGroups.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(groupIdx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Items du groupe - Simplifié pour l'instant */}
              <div className="space-y-2">
                <Label>Ingrédient (un par ligne, format: "quantité unité nom")</Label>
                <Textarea
                  placeholder={'Ex:\n400 g spaghetti\n200 g lardons\n4 oeufs'}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Note: Parsing avancé à venir. Pour l'instant, saisir un ingrédient simple par ligne.
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Étapes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Préparation *</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendStep({ order: steps.length + 1, instruction: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Étape
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Décrire cette étape..."
                  rows={2}
                  {...register(`steps.${idx}.instruction`)}
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`step-duration-${idx}`} className="text-xs">
                      Durée (min)
                    </Label>
                    <Input
                      id={`step-duration-${idx}`}
                      type="number"
                      min="0"
                      className="w-20"
                      {...register(`steps.${idx}.duration`, { valueAsNumber: true })}
                    />
                  </div>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {errors.steps?.[idx]?.instruction && (
                  <p className="text-sm text-red-600">
                    {errors.steps[idx]?.instruction?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : recipeId ? 'Mettre à jour' : 'Créer la recette'}
        </Button>
      </div>
    </form>
  )
}
