/**
 * Route API pour créer un groupe familial
 *
 * POST /api/family
 * Body : { name: string, display_name: string }
 * Response : { group: FamilyGroup, member: FamilyMember }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGroupSchema } from '@/lib/schemas/family'

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
    const parsed = createGroupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, display_name } = parsed.data

    // Vérifier que l'utilisateur n'est pas déjà dans un groupe
    const { data: existingMembership } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Vous êtes déjà membre d\'un groupe familial' },
        { status: 409 }
      )
    }

    // Générer le code famille côté API
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let familyCode = ''
    for (let i = 0; i < 6; i++) {
      familyCode += chars[Math.floor(Math.random() * chars.length)]
    }

    // Créer le groupe avec le code généré
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .insert({ name, created_by: user.id, code: familyCode })
      .select()
      .single()

    if (groupError) {
      console.error('Erreur création groupe:', groupError)
      return NextResponse.json(
        { error: 'Impossible de créer le groupe' },
        { status: 500 }
      )
    }

    // Ajouter le créateur comme owner
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
        display_name,
      })
      .select()
      .single()

    if (memberError) {
      console.error('Erreur ajout membre:', memberError)
      // Nettoyer le groupe créé en cas d'erreur
      await supabase.from('family_groups').delete().eq('id', group.id)
      return NextResponse.json(
        { error: 'Impossible de rejoindre le groupe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ group, member })
  } catch (err) {
    console.error('Erreur serveur:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
