-- Fix : Récursion infinie dans les policies RLS family_members
-- Problème : La policy SELECT de family_members se référence elle-même,
--            causant une boucle quand recipes l'interroge.
-- Solution : Fonction SECURITY DEFINER qui bypasse RLS pour les vérifications internes.

-- ============================================================================
-- 1. FONCTION HELPER (SECURITY DEFINER = bypass RLS)
-- ============================================================================

-- Retourne le group_id de l'utilisateur (NULL si pas de groupe)
CREATE OR REPLACE FUNCTION get_user_family_group_id(uid UUID)
RETURNS UUID AS $$
  SELECT group_id FROM family_members WHERE user_id = uid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 2. CORRIGER POLICY family_members (supprimer auto-référence)
-- ============================================================================

DROP POLICY "Members view group members" ON family_members;

CREATE POLICY "Members view group members"
  ON family_members
  FOR SELECT
  USING (
    group_id = get_user_family_group_id(auth.uid())
  );

-- ============================================================================
-- 3. CORRIGER POLICY family_groups (supprimer référence à family_members)
-- ============================================================================

DROP POLICY "Members view own group" ON family_groups;

CREATE POLICY "Members view own group"
  ON family_groups
  FOR SELECT
  USING (
    id = get_user_family_group_id(auth.uid())
  );

-- ============================================================================
-- 4. CORRIGER POLICY recipes SELECT (utiliser la fonction helper)
-- ============================================================================

DROP POLICY "Users view own and family shared recipes" ON recipes;

CREATE POLICY "Users view own and family shared recipes"
  ON recipes
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_shared = true
      AND get_user_family_group_id(auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM family_members AS recipe_owner
        WHERE recipe_owner.user_id = recipes.user_id
          AND recipe_owner.group_id = get_user_family_group_id(auth.uid())
      )
    )
  );

-- ============================================================================
-- FIN FIX
-- ============================================================================
