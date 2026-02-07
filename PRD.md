# Product Requirements Document - Mon Livre de Recettes

## Vue d'Ensemble

### Vision
Application web familiale pour centraliser toutes les recettes de cuisine dans un format unifié, quelle que soit leur source d'origine (photos, texte web, saisie manuelle).

### Problème Résolu
Actuellement, les recettes sont éparpillées dans différents formats et sources. L'application crée un "classeur numérique" unique où tout est normalisé, cherchable et accessible, notamment sur mobile en cuisinant.

### Utilisateurs Cibles
- Utilisateur principal (Steeve) + famille/proches
- Chacun son compte et ses recettes
- Usage principal : mobile en cuisinant

## Analogie Validée
**Comme un classeur familial de recettes** où chacun peut :
- Ajouter des recettes depuis n'importe quelle source
- Tout est automatiquement reformaté au même format
- Tout est classé et cherchable
- Consultation sur téléphone en cuisinant

## Fonctionnalités

### MVP (v1) - Fonctionnalités Essentielles

#### 1. Authentification
- **REQ-AUTH-001**: SHALL support email/password authentication via Supabase Auth
- **REQ-AUTH-002**: SHALL isolate user recipes using Row Level Security
- **REQ-AUTH-003**: SHALL auto-refresh session using SSR cookies

**Scenarios**:
- Nouvel utilisateur crée un compte email/password
- Utilisateur se connecte et voit uniquement ses recettes
- Session reste active pendant la navigation

#### 2. Import de Recettes (🎯 PRIORITÉ)
- **REQ-IMPORT-001**: SHALL support recipe import from web URLs
- **REQ-IMPORT-002**: SHALL support recipe import from copy-pasted text
- **REQ-IMPORT-003**: SHALL support recipe import from photo upload
- **REQ-IMPORT-004**: SHALL validate imported recipe before saving

**Scenarios** (v1 - Parsing Manuel):
1. Utilisateur colle URL d'un site de recettes
2. Utilisateur copie-colle le texte complet d'une recette
3. Utilisateur uploade photo d'un livre de cuisine
4. → Parsing manuel via Claude Code
5. → JSON structuré inséré via formulaire de validation
6. → Recette sauvegardée en base

**Scenarios** (v2 - Parsing Automatique):
- Même workflow mais parsing automatisé via API Claude Haiku

#### 3. CRUD Recettes
- **REQ-RECIPE-001**: SHALL list user's recipes with category filters
- **REQ-RECIPE-002**: SHALL display full recipe details
- **REQ-RECIPE-003**: SHALL allow manual recipe creation via form
- **REQ-RECIPE-004**: SHALL support recipe editing and deletion
- **REQ-RECIPE-005**: SHALL upload and display recipe images

**Scenarios**:
- Consulter liste de toutes ses recettes
- Filtrer par catégorie (plats, desserts, etc.)
- Voir détail complet d'une recette (ingrédients, étapes, photo)
- Créer nouvelle recette manuellement
- Modifier/supprimer une recette existante

#### 4. Recherche et Organisation
- **REQ-SEARCH-001**: SHALL search recipes by title and ingredients
- **REQ-SEARCH-002**: SHALL filter recipes by category
- **REQ-SEARCH-003**: SHALL mark recipes as favorites

**Scenarios**:
- Chercher "poulet" → trouve toutes les recettes contenant poulet
- Filtrer catégorie "dessert" → affiche uniquement desserts
- Marquer recette favorite pour accès rapide

#### 5. Expérience Mobile
- **REQ-UX-001**: SHALL be fully responsive (mobile-first)
- **REQ-UX-002**: SHALL display optimized view for cooking mode
- **REQ-UX-003**: SHALL provide bottom navigation on mobile

**Scenarios**:
- Consulter recette sur téléphone en cuisinant
- Navigation fluide avec pouces (bottom nav)
- Texte lisible sans zoom

### v2 - Fonctionnalités Avancées

#### Parsing Automatique
- Route API `/api/parse-recipe` avec Claude Haiku
- Parsing temps réel dans l'interface
- Coût estimé : ~0.01€/recette

#### Mode Cuisine
- Vue étape par étape
- Gros texte lisible
- Timers intégrés
- Navigation tactile (suivant/précédent)

#### Partage Familial
- Tables `family_groups` et `family_members`
- RLS étendu pour partage sélectif
- Invitations par email

#### Features Additionnelles
- Liste de courses auto-générée
- Tags personnalisés
- Ajustement portions (multiplicateur quantités)
- Export PDF pour impression

### Hors-Périmètre

❌ Planificateur de repas hebdomadaire
❌ Réseau social / recettes publiques
❌ Suggestions basées IA
❌ Partage entre amis (hors famille)
❌ Application mobile native
❌ Mode offline (PWA v2+)

## Modèle de Données

### Table `recipes`

```typescript
type Recipe = {
  id: string; // UUID
  user_id: string; // FK auth.users
  title: string;
  category: RecipeCategory;
  ingredients: IngredientGroup[];
  steps: RecipeStep[];
  metadata: RecipeMetadata;
  image_url: string | null;
  source_type: 'manual' | 'url' | 'paste' | 'photo';
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type RecipeCategory =
  | 'apero'
  | 'entree'
  | 'plat'
  | 'accompagnement'
  | 'sauce'
  | 'dessert'
  | 'boisson'
  | 'petit_dejeuner'
  | 'gouter'
  | 'pain_viennoiserie'
  | 'conserve';

type IngredientGroup = {
  group?: string; // Optionnel : "Pâte", "Garniture"
  items: Ingredient[];
};

type Ingredient = {
  name: string;
  quantity?: number;
  unit?: string;
  note?: string;
};

type RecipeStep = {
  order: number;
  instruction: string;
  duration?: number; // minutes
};

type RecipeMetadata = {
  prep_time?: number; // minutes
  cook_time?: number; // minutes
  servings?: number;
  difficulty?: 'facile' | 'moyen' | 'difficile';
  source_url?: string;
};
```

### Storage Bucket `recipe-images`

- Format autorisés : jpg, png, webp
- Taille max : 5 MB
- Compression client-side : max 1200px largeur
- Nommage : `{user_id}/{recipe_id}.webp`

## Workflow Utilisateur Détaillé

### Workflow Import (v1 - MVP)

1. **Accès page import** `/import`
2. **Sélection mode** : URL / Paste / Photo
3. **Input source**:
   - URL : coller lien site recette
   - Paste : coller texte complet
   - Photo : upload + preview
4. **Parsing manuel** (hors app):
   - Copier le contenu
   - Ouvrir Claude Code
   - Prompt de parsing → JSON structuré
5. **Validation** : Formulaire pré-rempli avec JSON
6. **Ajustements** : Corriger si nécessaire
7. **Sauvegarde** : Insertion en base + storage image

### Workflow Consultation

1. **Liste recettes** `/recettes`
2. **Filtres** : Catégories, favoris, recherche
3. **Sélection** : Tap sur carte recette
4. **Détail** `/recettes/[id]` : Affichage complet
5. **Actions** : Modifier, supprimer, marquer favori

## Métriques de Succès

### MVP
- ✅ **10 recettes importées** en < 3 min chacune (workflow v1)
- ✅ **Consultation mobile fluide** (LCP < 2.5s)
- ✅ **Auth familiale** : 2+ utilisateurs isolés
- ✅ **Recherche fonctionnelle** : résultats pertinents
- ✅ **Tests Playwright** : 100% pass workflows critiques

### v2
- Import automatique < 10 secondes par recette
- Mode cuisine utilisé sur 50%+ des consultations
- 3+ membres famille actifs avec partage

## Tech Stack

- **Frontend** : Next.js 14 (App Router), React 18, TypeScript
- **Styling** : Tailwind CSS, shadcn/ui
- **Backend** : Supabase (Auth, Database, Storage)
- **Database** : PostgreSQL avec JSONB
- **Hosting** : Vercel
- **Tests** : Playwright

## Contraintes et Exigences

### Performance
- LCP < 2.5s sur mobile 3G
- Responsive parfait mobile/tablet/desktop
- Images optimisées WebP

### Sécurité
- RLS sur toutes les tables
- Variables sensibles dans .env
- Validation Zod sur tous les inputs
- HTTPS forcé

### Accessibilité
- Contraste WCAG AA minimum
- Tailles texte lisibles mobile (16px+)
- Navigation clavier fonctionnelle

### Limites Techniques
- Supabase Free Tier : 500MB storage, 50K users
- Compression images agressive
- Monitoring utilisation dashboard Supabase

## Risques Identifiés

### Risque 1 : Parsing photos manuscrites complexe
**Impact** : Moyen
**Mitigation** :
- Écran validation/correction après parsing
- Commencer par URLs (HTML parsing fiable)
- Claude Vision performant sur manuscrit

### Risque 2 : Limites free tier Supabase
**Impact** : Faible (usage familial)
**Mitigation** :
- Compression images max 1200px WebP
- Monitoring dashboard
- Upgrade $25/mois si nécessaire

### Risque 3 : Motivation saisie manuelle
**Impact** : Moyen
**Mitigation** :
- Workflow import ultra-fluide dès MVP
- Support tous formats dès v1
- UX mobile optimisée

## Planning Estimé

| Phase | Durée | Tâches |
|-------|-------|--------|
| Setup | 1 jour | Init Next.js, Supabase, Deploy Vercel |
| Auth & DB | 2 jours | Middleware, pages auth, migrations SQL |
| CRUD | 3-4 jours | Liste, détail, formulaire, upload |
| Import | 2-3 jours | Formulaire multi-mode, workflow v1 |
| UX & Polish | 2 jours | Recherche, filtres, responsive, loading |
| Tests & Docs | 1-2 jours | Playwright, README, templates |

**Total : 10-15 jours**

## Évolutions Futures

### Court terme (v2)
- API parsing automatique
- Mode cuisine étapes
- Partage familial

### Moyen terme (v3)
- Liste de courses
- Ajustement portions
- Export PDF
- Tags avancés

### Long terme (v4+)
- PWA mode offline
- Application mobile native
- Planificateur repas
- Suggestions IA personnalisées

---

**Version** : 1.0
**Date** : 2026-02-07
**Auteur** : Steeve + Claude Code
