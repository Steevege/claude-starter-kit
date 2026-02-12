/**
 * Page Famille - Gestion du groupe et recettes partagées
 *
 * Si pas de groupe : formulaires créer/rejoindre
 * Si groupe : bannière infos + grille recettes partagées des autres membres
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'

import type { FamilyGroup, FamilyMember } from '@/lib/types/family'
import type { Recipe } from '@/lib/types/recipe'
import { Separator } from '@/components/ui/separator'
import { CreateGroupForm } from '@/components/family/create-group-form'
import { JoinGroupForm } from '@/components/family/join-group-form'
import { GroupInfoCard } from '@/components/family/group-info-card'
import { FamilyRecipeCard } from '@/components/family/family-recipe-card'

export default async function FamillePage() {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Chercher le membership de l'utilisateur
  const { data: membership } = await supabase
    .from('family_members')
    .select('id, group_id, role, display_name')
    .eq('user_id', user.id)
    .single()

  // Si pas de groupe : afficher les formulaires
  if (!membership) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Famille</h1>
          <p className="mt-1 text-gray-600">
            Partagez vos recettes avec votre famille
          </p>
        </div>

        <Separator />

        <div className="max-w-md mx-auto space-y-6">
          <CreateGroupForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <JoinGroupForm />
        </div>
      </div>
    )
  }

  // L'utilisateur a un groupe : charger les données
  const { data: group } = await supabase
    .from('family_groups')
    .select('*')
    .eq('id', membership.group_id)
    .single()

  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('group_id', membership.group_id)
    .order('joined_at', { ascending: true })

  // Charger les recettes partagées des AUTRES membres
  // La RLS nous donne accès aux recettes partagées de la famille
  const { data: sharedRecipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_shared', true)
    .neq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const groupTyped = group as FamilyGroup
  const membersTyped = (members || []) as FamilyMember[]
  const recipesTyped = (sharedRecipes || []) as Recipe[]

  // Créer un mapping user_id → display_name
  const memberNames: Record<string, string> = {}
  membersTyped.forEach(m => {
    memberNames[m.user_id] = m.display_name
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Famille</h1>
        <p className="mt-1 text-gray-600">
          {recipesTyped.length} {recipesTyped.length > 1 ? 'recettes partagées' : 'recette partagée'}
        </p>
      </div>

      <Separator />

      {/* Info groupe */}
      <div className="max-w-md">
        <GroupInfoCard
          group={groupTyped}
          members={membersTyped}
          currentUserId={user.id}
        />
      </div>

      <Separator />

      {/* Grille des recettes partagées */}
      {recipesTyped.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucune recette partagée
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Les membres du groupe peuvent partager leurs recettes depuis la page de détail
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipesTyped.map((recipe) => (
            <FamilyRecipeCard
              key={recipe.id}
              recipe={recipe}
              ownerName={memberNames[recipe.user_id] || 'Membre'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
