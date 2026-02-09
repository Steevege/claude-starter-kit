/**
 * Page d'import de recettes
 * Auth check côté serveur + composant client ImportTabs
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { ImportTabs } from '@/components/recipes/import/import-tabs'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Importer une recette</h1>
        <p className="mt-1 text-gray-600">
          Importez une recette depuis un site web, du texte copié, ou une photo.
        </p>
      </div>

      <ImportTabs />
    </div>
  )
}
