/**
 * Page liste des recettes (dashboard principal)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RecettesPage() {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Recettes</h1>
        <p className="mt-2 text-gray-600">
          Bienvenue {user.email} ! Vous êtes connecté.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          La liste des recettes sera affichée ici.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Prochaines étapes : créer les composants pour afficher et gérer les recettes.
        </p>
      </div>
    </div>
  )
}
