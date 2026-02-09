/**
 * Page Mode Cuisine - Vue étape par étape optimisée mobile
 */

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Recipe } from '@/lib/types/recipe'
import { CookingMode } from '@/components/recipes/cooking-mode'

interface CookingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CookingPage({ params }: CookingPageProps) {
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

  return <CookingMode recipe={recipe as Recipe} />
}
