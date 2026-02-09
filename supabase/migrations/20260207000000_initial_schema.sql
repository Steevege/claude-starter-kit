-- Migration initiale : Schema Mon Livre de Recettes
-- Date : 2026-02-07
-- Description : Table recipes avec JSONB, RLS, Storage bucket

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Activer extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLE RECIPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Données principales
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'apero',
    'entree',
    'plat',
    'accompagnement',
    'sauce',
    'dessert',
    'boisson',
    'petit_dejeuner',
    'gouter',
    'pain_viennoiserie',
    'conserve'
  )),

  -- Structure JSONB pour flexibilité
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Médias et source
  image_url TEXT,
  source_type TEXT CHECK (source_type IN ('manual', 'url', 'paste', 'photo')),

  -- Organisation
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES POUR PERFORMANCE
-- ============================================================================

-- Index sur user_id (queries principales)
CREATE INDEX IF NOT EXISTS idx_recipes_user_id
  ON recipes(user_id);

-- Index sur category (filtres)
CREATE INDEX IF NOT EXISTS idx_recipes_category
  ON recipes(category);

-- Index sur is_favorite (filtres favoris)
CREATE INDEX IF NOT EXISTS idx_recipes_favorite
  ON recipes(is_favorite)
  WHERE is_favorite = true;

-- Index full-text search sur title (recherche)
CREATE INDEX IF NOT EXISTS idx_recipes_search_title
  ON recipes USING gin(to_tsvector('french', title));

-- Index GIN sur ingredients JSONB (recherche ingrédients)
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients
  ON recipes USING gin(ingredients);

-- Index sur created_at (tri par date)
CREATE INDEX IF NOT EXISTS idx_recipes_created_at
  ON recipes(created_at DESC);

-- ============================================================================
-- 4. TRIGGER POUR updated_at
-- ============================================================================

-- Fonction pour mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur recipes
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs voient uniquement leurs recettes
CREATE POLICY "Users view own recipes"
  ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs insèrent uniquement leurs recettes
CREATE POLICY "Users insert own recipes"
  ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs modifient uniquement leurs recettes
CREATE POLICY "Users update own recipes"
  ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs suppriment uniquement leurs recettes
CREATE POLICY "Users delete own recipes"
  ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. STORAGE BUCKET POUR IMAGES
-- ============================================================================

-- Créer bucket public pour images de recettes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. STORAGE POLICIES
-- ============================================================================

-- Policy : Les utilisateurs uploadent leurs images
CREATE POLICY "Users upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : Tout le monde peut lire les images (public bucket)
CREATE POLICY "Public read images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recipe-images');

-- Policy : Les utilisateurs suppriment leurs images
CREATE POLICY "Users delete own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : Les utilisateurs modifient leurs images
CREATE POLICY "Users update own images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 8. COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE recipes IS 'Table principale des recettes de cuisine';
COMMENT ON COLUMN recipes.ingredients IS 'Structure JSONB : [{ group?: string, items: [{ name, quantity?, unit?, note? }] }]';
COMMENT ON COLUMN recipes.steps IS 'Structure JSONB : [{ order: number, instruction: string, duration?: number }]';
COMMENT ON COLUMN recipes.metadata IS 'Structure JSONB : { prep_time?, cook_time?, servings?, difficulty?, source_url? }';
COMMENT ON COLUMN recipes.source_type IS 'Type de source : manual (saisie), url (site web), paste (copier-coller), photo (upload image)';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
