-- Migration : Partage familial sélectif
-- Date : 2026-02-13
-- Description : Tables family_groups, family_members, colonne is_shared sur recipes,
--               fonction generate_family_code(), RLS et modification policy SELECT recipes

-- ============================================================================
-- 1. FONCTION GÉNÉRATION CODE FAMILLE (6 caractères, sans ambiguïté)
-- ============================================================================

-- Alphabet sans caractères ambigus (I/O/0/1 exclus)
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Vérifier unicité
    EXIT WHEN NOT EXISTS (SELECT 1 FROM family_groups WHERE family_groups.code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABLE FAMILY_GROUPS
-- ============================================================================

CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code CHAR(6) NOT NULL UNIQUE DEFAULT generate_family_code(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLE FAMILY_MEMBERS
-- ============================================================================

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_group_id ON family_members(group_id);
CREATE INDEX idx_family_groups_code ON family_groups(code);

-- ============================================================================
-- 5. COLONNE is_shared SUR RECIPES
-- ============================================================================

ALTER TABLE recipes ADD COLUMN is_shared BOOLEAN DEFAULT false;

CREATE INDEX idx_recipes_shared ON recipes(is_shared) WHERE is_shared = true;

-- ============================================================================
-- 6. RLS SUR FAMILY_GROUPS
-- ============================================================================

ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;

-- Les membres voient leur groupe
CREATE POLICY "Members view own group"
  ON family_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.group_id = family_groups.id
        AND family_members.user_id = auth.uid()
    )
  );

-- Tout utilisateur authentifié peut créer un groupe
CREATE POLICY "Authenticated users create groups"
  ON family_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Seul le créateur peut supprimer le groupe
CREATE POLICY "Creator deletes group"
  ON family_groups
  FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- 7. RLS SUR FAMILY_MEMBERS
-- ============================================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Les membres du groupe voient les autres membres
CREATE POLICY "Members view group members"
  ON family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members AS my_membership
      WHERE my_membership.group_id = family_members.group_id
        AND my_membership.user_id = auth.uid()
    )
  );

-- Tout utilisateur authentifié peut s'ajouter comme membre (rejoindre)
CREATE POLICY "Users join groups"
  ON family_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un membre peut se retirer lui-même
CREATE POLICY "Users leave groups"
  ON family_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Un membre peut mettre à jour son propre profil (display_name, role)
CREATE POLICY "Users update own membership"
  ON family_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. MODIFIER POLICY SELECT DE RECIPES (mes recettes + recettes partagées famille)
-- ============================================================================

-- Supprimer l'ancienne policy SELECT
DROP POLICY "Users view own recipes" ON recipes;

-- Nouvelle policy : mes recettes + recettes partagées par les membres de ma famille
CREATE POLICY "Users view own and family shared recipes"
  ON recipes
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_shared = true
      AND EXISTS (
        SELECT 1 FROM family_members AS my_membership
        JOIN family_members AS recipe_owner_membership
          ON my_membership.group_id = recipe_owner_membership.group_id
        WHERE my_membership.user_id = auth.uid()
          AND recipe_owner_membership.user_id = recipes.user_id
          AND my_membership.user_id != recipes.user_id
      )
    )
  );

-- ============================================================================
-- 9. FONCTION LOOKUP PAR CODE (pour rejoindre un groupe)
-- ============================================================================

-- RPC pour trouver un groupe par son code (accessible à tout user authentifié)
CREATE OR REPLACE FUNCTION lookup_family_group_by_code(family_code TEXT)
RETURNS TABLE (id UUID, name TEXT, code CHAR(6), member_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fg.id,
    fg.name,
    fg.code,
    COUNT(fm.id) AS member_count
  FROM family_groups fg
  LEFT JOIN family_members fm ON fm.group_id = fg.id
  WHERE fg.code = UPPER(family_code)
  GROUP BY fg.id, fg.name, fg.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE family_groups IS 'Groupes familiaux pour le partage de recettes';
COMMENT ON TABLE family_members IS 'Membres des groupes familiaux';
COMMENT ON COLUMN family_groups.code IS 'Code unique 6 caractères pour rejoindre le groupe';
COMMENT ON COLUMN family_members.display_name IS 'Prénom affiché aux autres membres';
COMMENT ON COLUMN recipes.is_shared IS 'Si true, la recette est visible par les membres du groupe familial';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
