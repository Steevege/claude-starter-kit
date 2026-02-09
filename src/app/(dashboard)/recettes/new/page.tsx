/**
 * Page création d'une nouvelle recette
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { RecipeFormSimple } from '@/components/recipes/recipe-form-simple'
import { Button } from '@/components/ui/button'

export default async function NewRecipePage() {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle recette</h1>
          <p className="mt-1 text-gray-600">
            Ajoutez une nouvelle recette à votre collection
          </p>
        </div>

        <Link href="/recettes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Formulaire */}
      <RecipeFormSimple />
    </div>
  )
}
