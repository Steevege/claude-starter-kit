-- Fonction RPC pour rechercher dans le titre ET les ingrédients
-- Permet de résoudre REQ-SEARCH-001 : recherche par titre et ingrédients
CREATE OR REPLACE FUNCTION search_recipes(search_term text, category_filter text DEFAULT NULL)
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
  ORDER BY r.created_at DESC;
$$ LANGUAGE sql STABLE SECURITY INVOKER;
