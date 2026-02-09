/**
 * Page d'accueil - Redirige vers login ou recettes selon l'authentification
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si authentifié → recettes, sinon → login
  if (user) {
    redirect('/recettes')
  } else {
    redirect('/login')
  }
}
