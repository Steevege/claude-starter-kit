-- Fix : Le créateur ne pouvait pas voir son propre groupe lors de la création
-- Car la policy SELECT exigeait d'être déjà membre (via get_user_family_group_id)
-- Ajout : OR created_by = auth.uid()

DROP POLICY "Members view own group" ON family_groups;

CREATE POLICY "Members view own group"
  ON family_groups
  FOR SELECT
  USING (
    id = get_user_family_group_id(auth.uid())
    OR created_by = auth.uid()
  );
