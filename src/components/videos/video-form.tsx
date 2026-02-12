'use client'

/**
 * Formulaire d'ajout/édition de recette vidéo
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { createClient } from '@/lib/supabase/client'
import { videoRecipeSchema, type VideoRecipeInput } from '@/lib/schemas/video-recipe'
import {
  RECIPE_CATEGORY_LABELS,
  VIDEO_PLATFORM_LABELS,
  VIDEO_PLATFORM_COLORS,
  detectVideoPlatform,
  type RecipeCategory,
  type VideoPlatform,
} from '@/lib/types/recipe'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CATEGORIES: RecipeCategory[] = [
  'apero', 'entree', 'plat', 'accompagnement', 'sauce',
  'dessert', 'boisson', 'petit_dejeuner', 'gouter',
  'pain_viennoiserie', 'conserve',
]

interface VideoFormProps {
  recipeId?: string
  defaultValues?: Partial<VideoRecipeInput>
}

export function VideoForm({ recipeId, defaultValues }: VideoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedPlatform, setDetectedPlatform] = useState<VideoPlatform | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<VideoRecipeInput>({
    resolver: zodResolver(videoRecipeSchema) as any,
    defaultValues: defaultValues || {
      title: '',
      video_url: '',
      notes: '',
      category: 'plat',
      is_favorite: false,
    },
  })

  // Auto-détecter la plateforme quand l'URL change
  const videoUrl = watch('video_url')
  useEffect(() => {
    if (videoUrl && videoUrl.startsWith('http')) {
      setDetectedPlatform(detectVideoPlatform(videoUrl))
    } else {
      setDetectedPlatform(null)
    }
  }, [videoUrl])

  const onSubmit = async (data: VideoRecipeInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Non authentifié')
        return
      }

      const platform = detectVideoPlatform(data.video_url)

      const recipeData = {
        title: data.title,
        category: data.category,
        appliance: null,
        ingredients: [],
        steps: [],
        metadata: {
          source_url: data.video_url,
          notes: data.notes || undefined,
          platform,
        },
        source_type: 'video' as const,
        status: 'a_tester' as const,
        is_favorite: data.is_favorite,
        tags: [],
      }

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
        const { error: insertError } = await supabase
          .from('recipes')
          .insert({
            ...recipeData,
            user_id: user.id,
          })

        if (insertError) {
          console.error('Erreur insert:', insertError)
          throw insertError
        }
      }

      router.push('/videos')
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

      <Card>
        <CardHeader>
          <CardTitle>Recette vidéo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Pâtes à la truffe (recette TikTok)"
              disabled={isLoading}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Lien vidéo + badge plateforme */}
          <div>
            <Label htmlFor="video_url">Lien vidéo *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video_url"
                placeholder="https://www.instagram.com/reel/..."
                disabled={isLoading}
                className="flex-1"
                {...register('video_url')}
              />
              {detectedPlatform && (
                <Badge className={VIDEO_PLATFORM_COLORS[detectedPlatform]}>
                  {VIDEO_PLATFORM_LABELS[detectedPlatform]}
                </Badge>
              )}
            </div>
            {errors.video_url && (
              <p className="text-sm text-destructive mt-1">{errors.video_url.message}</p>
            )}
          </div>

          {/* Note personnelle */}
          <div>
            <Label htmlFor="notes">Note personnelle (optionnel)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Ex: Recette vue chez @chef_name, à tester ce week-end..."
              disabled={isLoading}
              {...register('notes')}
            />
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
          {isLoading ? 'Enregistrement...' : recipeId ? 'Mettre à jour' : 'Ajouter la vidéo'}
        </Button>
      </div>
    </form>
  )
}
