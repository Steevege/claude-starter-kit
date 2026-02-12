/**
 * Route API pour copier une recette familiale dans ses propres recettes
 *
 * POST /api/family/recipes/copy
 * Body : { recipe_id: string }
 * Response : { recipe: Recipe }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Valider les données
    const body = await request.json()
    const { recipe_id } = body

    if (!recipe_id || typeof recipe_id !== 'string') {
      return NextResponse.json(
        { error: 'ID de recette requis' },
        { status: 400 }
      )
    }

    // Récupérer la recette source (la RLS vérifie qu'elle est visible)
    const { data: sourceRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipe_id)
      .single()

    if (fetchError || !sourceRecipe) {
      return NextResponse.json(
        { error: 'Recette introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que ce n'est pas sa propre recette
    if (sourceRecipe.user_id === user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas copier votre propre recette' },
        { status: 400 }
      )
    }

    // Créer une copie de la recette pour l'utilisateur
    const { data: newRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: sourceRecipe.title,
        category: sourceRecipe.category,
        appliance: sourceRecipe.appliance,
        ingredients: sourceRecipe.ingredients,
        steps: sourceRecipe.steps,
        metadata: sourceRecipe.metadata,
        image_url: sourceRecipe.image_url,
        source_type: sourceRecipe.source_type,
        status: 'a_tester',
        is_favorite: false,
        is_shared: false,
        tags: sourceRecipe.tags,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur copie recette:', insertError)
      return NextResponse.json(
        { error: 'Impossible de copier la recette' },
        { status: 500 }
      )
    }

    return NextResponse.json({ recipe: newRecipe })
  } catch (err) {
    console.error('Erreur serveur:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
