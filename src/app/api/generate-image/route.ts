/**
 * Route API pour générer une image de recette via Google Imagen 4 Fast
 *
 * POST /api/generate-image
 * Body : { recipeId: string, title: string, category: string }
 * Response : { success: true, image_url: string } | { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RECIPE_CATEGORY_LABELS, type RecipeCategory } from '@/lib/types/recipe'

export const maxDuration = 30

interface RequestBody {
  recipeId: string
  title: string
  category: string
}

export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié' },
      { status: 401 }
    )
  }

  // Lire le body
  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body JSON invalide' },
      { status: 400 }
    )
  }

  const { recipeId, title, category } = body

  if (!recipeId || !title) {
    return NextResponse.json(
      { success: false, error: 'recipeId et title requis' },
      { status: 400 }
    )
  }

  // Vérifier que la recette appartient à l'utilisateur
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .single()

  if (recipeError || !recipe) {
    return NextResponse.json(
      { success: false, error: 'Recette non trouvée' },
      { status: 404 }
    )
  }

  // Vérifier la clé API Gemini
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'GOOGLE_GEMINI_API_KEY non configurée dans .env.local' },
      { status: 500 }
    )
  }

  // Construire le prompt de génération d'image
  const categoryLabel = RECIPE_CATEGORY_LABELS[category as RecipeCategory] || category
  const prompt = `Photo culinaire professionnelle et appétissante d'un plat "${title}" (catégorie : ${categoryLabel}). Vue de dessus légèrement en angle, assiette dressée avec soin, éclairage naturel doux, arrière-plan flou de cuisine, style food photography magazine.`

  try {
    // Appel à l'API Google Imagen 4 Fast
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'imagen-4.0-fast-generate-001',
          prompt,
          response_format: 'b64_json',
          n: 1,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erreur Gemini Imagen:', response.status, errorData)
      return NextResponse.json(
        { success: false, error: `Erreur de génération d'image (${response.status}). Réessayez.` },
        { status: 422 }
      )
    }

    const result = await response.json()
    const base64Image = result.data?.[0]?.b64_json

    if (!base64Image) {
      return NextResponse.json(
        { success: false, error: 'Aucune image générée. Réessayez.' },
        { status: 422 }
      )
    }

    // Convertir base64 en buffer
    const imageBuffer = Buffer.from(base64Image, 'base64')
    const filePath = `${user.id}/${recipeId}.webp`

    // Upload vers Supabase Storage (écrase l'ancienne image si elle existe)
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erreur upload Supabase:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la sauvegarde de l\'image.' },
        { status: 500 }
      )
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filePath)

    // Ajouter un timestamp pour éviter le cache
    const imageUrl = `${publicUrl}?t=${Date.now()}`

    // Mettre à jour la recette avec l'URL de l'image
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ image_url: imageUrl })
      .eq('id', recipeId)

    if (updateError) {
      console.error('Erreur update recette:', updateError)
      return NextResponse.json(
        { success: false, error: 'Image générée mais erreur lors de la mise à jour de la recette.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, image_url: imageUrl })
  } catch (err) {
    console.error('Erreur génération image:', err)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération. Réessayez.' },
      { status: 500 }
    )
  }
}
