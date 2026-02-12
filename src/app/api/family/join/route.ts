/**
 * Route API pour rejoindre un groupe familial par code
 *
 * POST /api/family/join
 * Body : { code: string, display_name: string }
 * Response : { group: FamilyGroup, member: FamilyMember }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { joinGroupSchema } from '@/lib/schemas/family'

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
    const parsed = joinGroupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { code, display_name } = parsed.data

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

    // Trouver le groupe par code via la fonction RPC
    const { data: groups, error: lookupError } = await supabase
      .rpc('lookup_family_group_by_code', { family_code: code.toUpperCase() })

    if (lookupError || !groups || groups.length === 0) {
      return NextResponse.json(
        { error: 'Code famille introuvable' },
        { status: 404 }
      )
    }

    const group = groups[0]

    // Ajouter comme membre
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
        display_name,
      })
      .select()
      .single()

    if (memberError) {
      console.error('Erreur ajout membre:', memberError)
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
