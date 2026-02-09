-- Ajout du champ status aux recettes
-- Valeurs : a_tester (défaut), testee, approuvee
ALTER TABLE recipes ADD COLUMN status TEXT NOT NULL DEFAULT 'a_tester'
  CHECK (status IN ('a_tester', 'testee', 'approuvee'));

-- Index pour filtrer par statut
CREATE INDEX idx_recipes_status ON recipes(status);

-- Mettre à jour la fonction search_recipes pour supporter le filtre statut
CREATE OR REPLACE FUNCTION search_recipes(
  search_term text,
  category_filter text DEFAULT NULL,
  status_filter text DEFAULT NULL
)
RETURNS SETOF recipes AS $$
  SELECT r.* FROM recipes r
  WHERE r.user_id = auth.uid()
    AND (
      r.title ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(r.ingredients) AS grp,
             jsonb_array_elements(grp->'items') AS item
        WHERE item->>'name' ILIKE '%' || search_term || '%'
      )
    )
    AND (category_filter IS NULL OR r.category = category_filter)
    AND (status_filter IS NULL OR r.status = status_filter)
  ORDER BY r.created_at DESC;
$$ LANGUAGE sql STABLE SECURITY INVOKER;
