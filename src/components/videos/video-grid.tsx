/**
 * Grille responsive de vidéos
 */

import { Video } from 'lucide-react'
import type { Recipe } from '@/lib/types/recipe'
import { VideoCard } from './video-card'

interface VideoGridProps {
  videos: Recipe[]
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Video className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune vidéo enregistrée
        </h3>
        <p className="text-gray-600 max-w-md">
          Ajoutez vos premières recettes vidéo (Instagram, TikTok, YouTube...) pour les retrouver ici.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} recipe={video} />
      ))}
    </div>
  )
}
