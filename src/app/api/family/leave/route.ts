/**
 * Route API pour quitter un groupe familial
 *
 * POST /api/family/leave
 * Body : {} (vide)
 * Response : { success: true }
 *
 * Si l'utilisateur est owner :
 * - Transfère le rôle owner au membre le plus ancien
 * - Ou supprime le groupe s'il est le dernier membre
 * Remet is_shared = false sur toutes les recettes de l'utilisateur
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Trouver le membership actuel
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id, group_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas membre d\'un groupe familial' },
        { status: 404 }
      )
    }

    // Si owner, transférer le rôle ou supprimer le groupe
    if (membership.role === 'owner') {
      // Trouver le membre le plus ancien (hors owner)
      const { data: otherMembers } = await supabase
        .from('family_members')
        .select('id, user_id')
        .eq('group_id', membership.group_id)
        .neq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)

      if (otherMembers && otherMembers.length > 0) {
        // Transférer le rôle owner au membre le plus ancien
        await supabase
          .from('family_members')
          .update({ role: 'owner' })
          .eq('id', otherMembers[0].id)
      } else {
        // Dernier membre : supprimer le groupe (CASCADE supprime les members)
        await supabase
          .from('family_groups')
          .delete()
          .eq('id', membership.group_id)
      }
    }

    // Retirer le membre (si le groupe n'a pas été supprimé par CASCADE)
    await supabase
      .from('family_members')
      .delete()
      .eq('id', membership.id)

    // Remettre is_shared = false sur toutes les recettes du user
    await supabase
      .from('recipes')
      .update({ is_shared: false })
      .eq('user_id', user.id)
      .eq('is_shared', true)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur serveur:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
