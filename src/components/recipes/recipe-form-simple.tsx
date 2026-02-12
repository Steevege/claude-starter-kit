'use client'

/**
 * Formulaire simplifié de création de recette (MVP)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { createClient } from '@/lib/supabase/client'
import { recipeSimpleSchema, parseSimpleRecipe, type RecipeSimpleInput } from '@/lib/schemas/recipe-simple'
import { RECIPE_CATEGORY_LABELS, RECIPE_STATUS_LABELS, RECIPE_STATUSES, RECIPE_APPLIANCE_LABELS, RECIPE_APPLIANCES, type RecipeCategory } from '@/lib/types/recipe'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CATEGORIES: RecipeCategory[] = [
  'apero', 'entree', 'plat', 'accompagnement', 'sauce',
  'dessert', 'boisson', 'petit_dejeuner', 'gouter',
  'pain_viennoiserie', 'conserve'
]

interface RecipeFormSimpleProps {
  recipeId?: string
  defaultValues?: Partial<RecipeSimpleInput>
  imageUrl?: string | null
  photoFile?: File | null
}

export function RecipeFormSimple({ recipeId, defaultValues, imageUrl, photoFile }: RecipeFormSimpleProps = {}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(photoFile || null)
  const [imagePreview, setImagePreview] = useState<string | null>(imageUrl || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<RecipeSimpleInput>({
    resolver: zodResolver(recipeSimpleSchema) as any,
    defaultValues: defaultValues || {
      title: '',
      category: 'plat',
      ingredients_text: '',
      steps_text: '',
      source_type: 'manual',
      status: 'a_tester',
      is_favorite: false,
    },
  })

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

  const onSubmit = async (data: RecipeSimpleInput) => {
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

      // Parser et convertir au format DB
      const recipeData = parseSimpleRecipe(data)

      let recipeIdToUse = recipeId

      if (recipeId) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            ...recipeData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipeId)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Erreur update:', updateError)
          throw updateError
        }
      } else {
        // Mode création
        const { data: newRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert({
            ...recipeData,
            user_id: user.id,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Erreur insert:', insertError)
          throw insertError
        }
        recipeIdToUse = newRecipe.id
      }

      // Upload image si fichier local présent
      if (imageFile && recipeIdToUse) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${recipeIdToUse}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageFile, { upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(fileName)

          await supabase
            .from('recipes')
            .update({ image_url: publicUrl })
            .eq('id', recipeIdToUse)
        }
      } else if (imageUrl && recipeIdToUse) {
        // Image externe (ex: URL importée depuis Marmiton)
        await supabase
          .from('recipes')
          .update({ image_url: imageUrl })
          .eq('id', recipeIdToUse)
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
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
              placeholder="Ex: Omelette au fromage"
              disabled={isLoading}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
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
          </div>

          {/* Appareil */}
          <div>
            <Label htmlFor="appliance">Appareil (optionnel)</Label>
            <select
              id="appliance"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isLoading}
              {...register('appliance', {
                setValueAs: (v) => v === '' ? undefined : v
              })}
            >
              <option value="">Aucun</option>
              {RECIPE_APPLIANCES.map((a) => (
                <option key={a} value={a}>
                  {RECIPE_APPLIANCE_LABELS[a]}
                </option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="status">Statut</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isLoading}
              {...register('status')}
            >
              {RECIPE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {RECIPE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div>
            <Label htmlFor="image">Image (optionnel)</Label>
            <div className="mt-2 space-y-4">
              {imagePreview && (
                <div className="relative w-full h-48 rounded-md overflow-hidden bg-accent/30">
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
              <Label htmlFor="prep_time">Préparation (min) - optionnel</Label>
              <Input
                id="prep_time"
                type="number"
                min="0"
                placeholder="Ex: 10"
                {...register('prep_time', {
                  setValueAs: (v) => v === '' || v === null ? undefined : Number(v)
                })}
              />
            </div>
            <div>
              <Label htmlFor="cook_time">Cuisson (min) - optionnel</Label>
              <Input
                id="cook_time"
                type="number"
                min="0"
                placeholder="Ex: 15"
                {...register('cook_time', {
                  setValueAs: (v) => v === '' || v === null ? undefined : Number(v)
                })}
              />
            </div>
            <div>
              <Label htmlFor="servings">Portions - optionnel</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                placeholder="Ex: 4"
                {...register('servings', {
                  setValueAs: (v) => v === '' || v === null ? undefined : Number(v)
                })}
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulté - optionnel</Label>
              <select
                id="difficulty"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('difficulty', {
                  setValueAs: (v) => v === '' ? undefined : v
                })}
              >
                <option value="">Aucune</option>
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
              </select>
            </div>
          </div>

          {/* Favori */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_favorite"
              className="w-4 h-4"
              {...register('is_favorite')}
            />
            <Label htmlFor="is_favorite" className="cursor-pointer">
              Marquer comme favori
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Ingrédients */}
      <Card>
        <CardHeader>
          <CardTitle>Ingrédients *</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="ingredients_text">Un ingrédient par ligne</Label>
            <Textarea
              id="ingredients_text"
              rows={8}
              placeholder={'Ex:\n400 g de spaghetti\n200 g de lardons fumés\n4 oeufs\n100 g de parmesan râpé\nsel et poivre'}
              disabled={isLoading}
              {...register('ingredients_text')}
            />
            {errors.ingredients_text && (
              <p className="text-sm text-destructive mt-1">{errors.ingredients_text.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Étapes */}
      <Card>
        <CardHeader>
          <CardTitle>Préparation *</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="steps_text">Une étape par ligne</Label>
            <Textarea
              id="steps_text"
              rows={8}
              placeholder={'Ex:\nFaire cuire les pâtes dans l\'eau bouillante salée\nFaire revenir les lardons dans une poêle\nBattre les oeufs avec le parmesan\nMélanger les pâtes avec les lardons\nAjouter le mélange oeufs-parmesan hors du feu'}
              disabled={isLoading}
              {...register('steps_text')}
            />
            {errors.steps_text && (
              <p className="text-sm text-destructive mt-1">{errors.steps_text.message}</p>
            )}
          </div>
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
