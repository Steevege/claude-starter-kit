-- Ajout du source_type 'video' pour le répertoire de recettes vidéo
-- Les vidéos sont des recettes légères (titre + lien + note, sans ingrédients/étapes)

-- 1. Modifier le CHECK constraint sur source_type pour ajouter 'video'
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_source_type_check;
ALTER TABLE recipes ADD CONSTRAINT recipes_source_type_check
  CHECK (source_type IN ('manual', 'url', 'paste', 'photo', 'video'));

-- 2. Index sur source_type pour séparer vidéos et recettes
CREATE INDEX IF NOT EXISTS idx_recipes_source_type ON recipes(source_type);

-- 3. Mettre à jour la RPC search_recipes pour supporter l'exclusion/inclusion par source_type
CREATE OR REPLACE FUNCTION search_recipes(
  search_term text,
  category_filter text DEFAULT NULL,
  status_filter text DEFAULT NULL,
  source_type_filter text DEFAULT NULL,
  exclude_source_type text DEFAULT NULL
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
    AND (source_type_filter IS NULL OR r.source_type = source_type_filter)
    AND (exclude_source_type IS NULL OR r.source_type != exclude_source_type)
  ORDER BY r.created_at DESC;
$$ LANGUAGE sql STABLE SECURITY INVOKER;
