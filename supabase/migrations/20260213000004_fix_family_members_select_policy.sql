-- Fix : Un nouveau membre ne pouvait pas voir sa propre ligne après INSERT...RETURNING
-- Ajout : OR user_id = auth.uid()

DROP POLICY "Members view group members" ON family_members;

CREATE POLICY "Members view group members"
  ON family_members
  FOR SELECT
  USING (
    group_id = get_user_family_group_id(auth.uid())
    OR user_id = auth.uid()
  );
