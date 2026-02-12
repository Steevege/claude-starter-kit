/**
 * Page édition d'une recette vidéo
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { VideoForm } from '@/components/videos/video-form'
import { Button } from '@/components/ui/button'
import type { Recipe } from '@/lib/types/recipe'

interface EditVideoPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditVideoPage({ params }: EditVideoPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !recipe) {
    notFound()
  }

  const recipeTyped = recipe as Recipe

  // Si ce n'est pas une vidéo, rediriger vers la page recette standard
  if (recipeTyped.source_type !== 'video') {
    redirect(`/recettes/${id}/edit`)
  }

  const defaultValues = {
    title: recipeTyped.title,
    video_url: recipeTyped.metadata.source_url || '',
    notes: recipeTyped.metadata.notes || '',
    category: recipeTyped.category,
    is_favorite: recipeTyped.is_favorite,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/videos">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux vidéos
        </Button>
      </Link>

      <h1 className="text-3xl font-bold text-gray-900">Modifier la vidéo</h1>

      <VideoForm recipeId={id} defaultValues={defaultValues} />
    </div>
  )
}
