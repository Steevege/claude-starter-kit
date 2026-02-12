/**
 * Page liste des vidéos
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { VideoGrid } from '@/components/videos/video-grid'
import { VideoFilters } from '@/components/videos/video-filters'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Recipe } from '@/lib/types/recipe'

interface VideosPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
  }>
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams

  let videos: Recipe[] | null = null
  let error: { message: string } | null = null

  if (params.search) {
    // Recherche via RPC avec filtre source_type
    const result = await supabase.rpc('search_recipes', {
      search_term: params.search,
      category_filter: params.category || null,
      source_type_filter: 'video',
    })
    videos = result.data as Recipe[] | null
    error = result.error
  } else {
    // Query standard
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_type', 'video')
      .order('created_at', { ascending: false })

    if (params.category) {
      query = query.eq('category', params.category)
    }

    const result = await query
    videos = result.data as Recipe[] | null
    error = result.error
  }

  if (error) {
    console.error('Erreur récupération vidéos:', error)
  }

  const videosTyped = (videos || []) as Recipe[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Vidéos</h1>
          <p className="mt-1 text-gray-600">
            {videosTyped.length} {videosTyped.length > 1 ? 'vidéos' : 'vidéo'}
          </p>
        </div>

        <Link href="/videos/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une vidéo
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Filtres */}
      <VideoFilters />

      <Separator />

      {/* Grille de vidéos */}
      <VideoGrid videos={videosTyped} />
    </div>
  )
}
