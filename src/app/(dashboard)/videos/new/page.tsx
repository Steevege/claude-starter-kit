/**
 * Page ajout d'une recette vidéo
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { VideoForm } from '@/components/videos/video-form'
import { Button } from '@/components/ui/button'

export default async function NewVideoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/videos">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux vidéos
        </Button>
      </Link>

      <h1 className="text-3xl font-bold text-gray-900">Ajouter une vidéo</h1>

      <VideoForm />
    </div>
  )
}
