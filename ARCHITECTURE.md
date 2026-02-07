# Architecture Technique - Mon Livre de Recettes

## Vue d'Ensemble

Application web full-stack utilisant Next.js 14 avec App Router, Supabase comme backend (auth + database + storage), et déploiement sur Vercel.

**Philosophie** : Mobile-first, Server Components par défaut, simplicité avant sophistication.

## Tech Stack

### Frontend
- **Framework** : Next.js 14.3+ (App Router)
- **Langage** : TypeScript 5.3+
- **UI Library** : React 18
- **Styling** : Tailwind CSS 3.4+
- **Composants** : shadcn/ui (Radix UI + Tailwind)
- **Forms** : React Hook Form + Zod
- **State** : React Server Components (minimal client state)

### Backend
- **BaaS** : Supabase
  - **Auth** : Email/password avec SSR cookies
  - **Database** : PostgreSQL 15+
  - **Storage** : Supabase Storage (images)
  - **Types** : Génération auto TypeScript

### Hosting & CI/CD
- **Hosting** : Vercel (optimisé Next.js)
- **CDN** : Vercel Edge Network
- **Database** : Supabase Cloud (free tier)

### Testing
- **E2E** : Playwright (installé globalement)
- **Type Checking** : TypeScript strict mode

## Décisions Architecturales

### 1. Pourquoi Next.js 14 App Router ?

**Choix** : Next.js 14 avec App Router (vs Pages Router)

**Raisons** :
- ✅ Server Components par défaut = performance native
- ✅ Routing file-system intuitif
- ✅ Streaming SSR avec Suspense
- ✅ Route handlers pour API
- ✅ Middleware natif pour auth
- ✅ Optimisations images automatiques
- ✅ Déploiement Vercel zero-config

**Alternatives rejetées** :
- ❌ Pages Router : ancien paradigme, moins performant
- ❌ Vite + React Router : config manuelle SSR complexe
- ❌ Remix : écosystème plus petit, moins de resources

### 2. Pourquoi Supabase ?

**Choix** : Supabase (vs Firebase, backend custom)

**Raisons** :
- ✅ PostgreSQL = relations SQL natives
- ✅ Auth + DB + Storage tout-en-un
- ✅ Row Level Security (RLS) = isolation users
- ✅ Free tier généreux (500MB, 50K users)
- ✅ Types TypeScript auto-générés
- ✅ Supabase CLI pour migrations locales
- ✅ Réplication temps réel (si besoin v2)

**Alternatives rejetées** :
- ❌ Firebase : NoSQL moins adapté relations recettes
- ❌ Backend Node custom : temps dev x5, maintenance
- ❌ Prisma + PostgreSQL custom : coût hosting DB

### 3. Pourquoi JSONB pour ingrédients/étapes ?

**Choix** : Colonnes JSONB `ingredients` et `steps`

**Raisons** :
- ✅ Flexibilité : recettes ont structures variables (3-30 ingrédients)
- ✅ Performance : 1 query vs 3 JOINs (tables normalisées)
- ✅ Simplicité : pas de gestion foreign keys complexes
- ✅ Type-safety : validation Zod côté app
- ✅ Queries JSONB PostgreSQL puissantes (`@>`, `->>`)

**Alternatives rejetées** :
- ❌ Tables normalisées (`recipe_ingredients`, `recipe_steps`) : over-engineering pour MVP familial

### 4. Architecture Auth : SSR avec Cookies

**Choix** : Supabase SSR avec cookies (vs client-side)

**Raisons** :
- ✅ Session server-side = sécurité maximale
- ✅ Server Components accès direct DB
- ✅ Middleware refresh auto session
- ✅ Pas de flash "non authentifié" au load
- ✅ SEO-friendly (si recettes publiques v2)

**Pattern** :
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('recipes').select('*')
  return <RecipeGrid recipes={data} />
}
```

## Structure du Projet

```
mes-recettes/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Route group : pages auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/             # Route group : app principale
│   │   │   ├── layout.tsx           # Layout avec nav
│   │   │   ├── recettes/
│   │   │   │   ├── page.tsx         # Liste recettes
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Détail recette
│   │   │   ├── import/
│   │   │   │   └── page.tsx         # Import recettes
│   │   │   └── favoris/
│   │   │       └── page.tsx         # Recettes favorites
│   │   ├── api/                     # Route handlers
│   │   │   └── recipes/
│   │   │       └── route.ts         # CRUD API
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Homepage (redirect)
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── recipes/                 # Composants recettes
│   │   │   ├── recipe-card.tsx
│   │   │   ├── recipe-form.tsx
│   │   │   ├── recipe-import-form.tsx
│   │   │   ├── recipe-detail.tsx
│   │   │   └── ingredient-list.tsx
│   │   ├── layout/                  # Composants layout
│   │   │   ├── header.tsx
│   │   │   ├── nav.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── auth/                    # Composants auth
│   │       ├── login-form.tsx
│   │       └── signup-form.tsx
│   ├── lib/
│   │   ├── supabase/                # Clients Supabase
│   │   │   ├── client.ts            # Client-side
│   │   │   ├── server.ts            # Server Components
│   │   │   └── middleware.ts        # Middleware
│   │   ├── schemas/                 # Zod schemas
│   │   │   ├── recipe.ts
│   │   │   └── auth.ts
│   │   ├── types/                   # TypeScript types
│   │   │   ├── database.types.ts    # Auto-généré Supabase
│   │   │   └── recipe.ts            # Types métier
│   │   └── utils.ts                 # Utilitaires
│   └── middleware.ts                # Middleware session refresh
├── supabase/
│   ├── config.toml                  # Config Supabase CLI
│   └── migrations/                  # Migrations SQL
│       └── 20260207_initial_schema.sql
├── public/
│   └── images/
├── .env.local                       # Variables environnement (gitignored)
├── .env.example                     # Template .env
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Base de Données

### Schema PostgreSQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table recettes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Données principales
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'apero', 'entree', 'plat', 'accompagnement', 'sauce',
    'dessert', 'boisson', 'petit_dejeuner', 'gouter',
    'pain_viennoiserie', 'conserve'
  )),

  -- Structure JSONB
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  -- Médias et source
  image_url TEXT,
  source_type TEXT CHECK (source_type IN ('manual', 'url', 'paste', 'photo')),

  -- Organisation
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_favorite ON recipes(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_recipes_search ON recipes USING gin(to_tsvector('french', title));

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy : utilisateur voit seulement ses recettes
CREATE POLICY "Users manage own recipes"
  ON recipes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Format JSONB

**`ingredients` (IngredientGroup[])**
```json
[
  {
    "group": "Pâte",
    "items": [
      {
        "name": "farine",
        "quantity": 250,
        "unit": "g",
        "note": "T55"
      },
      {
        "name": "oeufs",
        "quantity": 3
      }
    ]
  },
  {
    "group": "Garniture",
    "items": [
      {
        "name": "lardons",
        "quantity": 200,
        "unit": "g"
      }
    ]
  }
]
```

**`steps` (RecipeStep[])**
```json
[
  {
    "order": 1,
    "instruction": "Préchauffer le four à 180°C",
    "duration": 5
  },
  {
    "order": 2,
    "instruction": "Mélanger la farine et les oeufs jusqu'à obtenir une pâte lisse",
    "duration": 10
  }
]
```

**`metadata` (RecipeMetadata)**
```json
{
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "facile",
  "source_url": "https://example.com/recipe"
}
```

### Storage : Bucket `recipe-images`

**Configuration** :
```sql
-- Bucket public pour images recettes
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true);

-- Policy : users upload leurs images
CREATE POLICY "Users upload own images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : users lisent leurs images
CREATE POLICY "Users read own images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : users suppriment leurs images
CREATE POLICY "Users delete own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recipe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Nommage fichiers** : `{user_id}/{recipe_id}.webp`

**Contraintes** :
- Formats autorisés : jpg, png, webp
- Taille max : 5 MB
- Compression client-side : max 1200px largeur
- Conversion WebP côté client (meilleure compression)

## Authentification SSR

### Middleware Session Refresh

```typescript
// /src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session si expirée
  await supabase.auth.getUser()

  // Redirect si non authentifié sur routes protégées
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup')
  const isProtectedRoute = !isAuthRoute && request.nextUrl.pathname !== '/'

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/recettes', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Clients Supabase

**Server Component** (`/src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**Client Component** (`/src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Patterns de Code

### Server Component (Liste Recettes)

```typescript
// /src/app/(dashboard)/recettes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { RecipeCard } from '@/components/recipes/recipe-card'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  const { data: recipes } = await query

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes?.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
```

### Client Component (Formulaire)

```typescript
// /src/components/recipes/recipe-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recipeSchema } from '@/lib/schemas/recipe'

export function RecipeForm({ recipe }) {
  const form = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues: recipe || {},
  })

  async function onSubmit(data) {
    // Upload image si présente
    // Insert/update recette via API route
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Champs formulaire */}
    </form>
  )
}
```

### Validation Zod

```typescript
// /src/lib/schemas/recipe.ts
import { z } from 'zod'

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
})

export const ingredientGroupSchema = z.object({
  group: z.string().optional(),
  items: z.array(ingredientSchema),
})

export const recipeStepSchema = z.object({
  order: z.number(),
  instruction: z.string().min(1),
  duration: z.number().optional(),
})

export const recipeSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum([
    'apero', 'entree', 'plat', 'accompagnement', 'sauce',
    'dessert', 'boisson', 'petit_dejeuner', 'gouter',
    'pain_viennoiserie', 'conserve'
  ]),
  ingredients: z.array(ingredientGroupSchema),
  steps: z.array(recipeStepSchema),
  metadata: z.object({
    prep_time: z.number().optional(),
    cook_time: z.number().optional(),
    servings: z.number().optional(),
    difficulty: z.enum(['facile', 'moyen', 'difficile']).optional(),
    source_url: z.string().url().optional(),
  }).optional(),
  source_type: z.enum(['manual', 'url', 'paste', 'photo']),
  is_favorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})
```

## Mobile-First Responsive

### Breakpoints Tailwind

```javascript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',  // Téléphone paysage
      'md': '768px',  // Tablet portrait
      'lg': '1024px', // Tablet paysage / Desktop
      'xl': '1280px', // Desktop large
    },
  },
}
```

### Patterns Courants

```tsx
// Grille responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Navigation : bottom mobile, sidebar desktop
<nav className="fixed bottom-0 left-0 right-0 md:static md:w-64">

// Texte : base mobile, large desktop
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// Padding : compact mobile, aéré desktop
<div className="p-4 md:p-6 lg:p-8">

// Caché mobile, visible desktop
<div className="hidden md:block">

// Visible mobile, caché desktop
<div className="md:hidden">
```

## Sécurité

### Checklist Obligatoire

- ✅ **RLS activé** sur toutes les tables
- ✅ **Secrets jamais commités** (.env dans .gitignore)
- ✅ **HTTPS forcé** (automatique Vercel)
- ✅ **Input validation** Zod avant insertion DB
- ✅ **Image upload** : max 5MB, formats autorisés validés
- ✅ **Service Role Key** jamais exposé client-side
- ✅ **CORS** configuré si API publique v2
- ✅ **Rate limiting** Vercel gratuit (1000 req/min)

### Variables d'Environnement

```bash
# .env.local (gitignored)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# .env.example (commité)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Performance

### Optimisations Next.js

- ✅ **Server Components** par défaut (pas de JS client inutile)
- ✅ **Image optimization** : composant `<Image>` Next.js
- ✅ **Font optimization** : `next/font` pour Tailwind
- ✅ **Code splitting** automatique par route
- ✅ **Streaming SSR** avec Suspense

### Optimisations Images

```tsx
import Image from 'next/image'

<Image
  src={recipe.image_url}
  alt={recipe.title}
  width={400}
  height={300}
  className="object-cover"
  loading="lazy"
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

### Cibles Performance

- **LCP (Largest Contentful Paint)** : < 2.5s sur mobile 3G
- **FID (First Input Delay)** : < 100ms
- **CLS (Cumulative Layout Shift)** : < 0.1
- **Bundle size** : < 200KB JS initial

## Workflow Import (v1 MVP)

### Étapes Utilisateur

1. **Page `/import`** : Formulaire multi-modes
2. **Sélection mode** : paste / url / photo
3. **Input source** :
   - Paste : textarea large
   - URL : input text
   - Photo : upload + preview
4. **Copier contenu** : clipboard ou photo uploadée temporairement
5. **Parsing externe** : Claude Code (manuel v1)
6. **JSON structuré** : Coller dans textarea caché ou API
7. **Validation** : Formulaire pré-rempli
8. **Ajustements** : Corrections manuelles
9. **Sauvegarde** : Insert DB + storage image

### Composant Import Form

```typescript
// /src/components/recipes/recipe-import-form.tsx
'use client'

type ImportMode = 'paste' | 'url' | 'photo'

export function RecipeImportForm() {
  const [mode, setMode] = useState<ImportMode>('paste')
  const [content, setContent] = useState('')
  const [parsedRecipe, setParsedRecipe] = useState(null)

  async function handleParse() {
    // v1 : user colle JSON structuré manuellement
    // v2 : call API /api/parse-recipe avec content
  }

  return (
    <div>
      {/* Toggle mode */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setMode('paste')}>Texte</Button>
        <Button onClick={() => setMode('url')}>URL</Button>
        <Button onClick={() => setMode('photo')}>Photo</Button>
      </div>

      {/* Input selon mode */}
      {mode === 'paste' && (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full h-64"
        />
      )}

      {/* ... autres modes */}

      {/* Formulaire validation si parsedRecipe existe */}
      {parsedRecipe && (
        <RecipeForm recipe={parsedRecipe} />
      )}
    </div>
  )
}
```

## Évolutions v2

### API Parsing Automatique

```typescript
// /src/app/api/parse-recipe/route.ts
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const { content, source_type } = await request.json()

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4.0',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Parse cette recette et retourne un JSON structuré : ${content}`
    }]
  })

  // Extraction JSON depuis réponse
  // Validation Zod
  // Return structured recipe
}
```

**Coût estimé** : ~0.01€/recette avec Haiku

### Partage Familial

```sql
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE family_members (
  group_id UUID REFERENCES family_groups(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (group_id, user_id)
);

-- Nouvelle policy RLS : user voit ses recettes + recettes groupe
CREATE POLICY "Users see own and shared recipes"
  ON recipes
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM family_members
      WHERE user_id = auth.uid() AND group_id = recipes.family_group_id
    )
  );
```

## Dépendances

```json
{
  "dependencies": {
    "next": "^14.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.58.0",
    "tailwindcss": "^3.4.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "typescript": "^5.3.3",
    "@playwright/test": "^1.58.1",
    "supabase": "^1.142.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

## Commandes Utiles

```bash
# Dev local
npm run dev

# Build production
npm run build

# Tests Playwright
npx playwright test

# Supabase local
supabase start
supabase db reset

# Migrations
supabase migration new migration_name
supabase db push

# Types TypeScript Supabase
supabase gen types typescript --local > src/lib/types/database.types.ts

# Deploy Vercel
vercel --prod
```

## Monitoring & Debugging

### Logs
- **Vercel Dashboard** : Logs runtime production
- **Supabase Dashboard** : Query logs, slow queries
- **Browser DevTools** : Network, Console, Performance

### Métriques
- **Vercel Analytics** : Web Vitals (LCP, FID, CLS)
- **Supabase Dashboard** : Database size, connections, requests
- **Playwright Reports** : Test results, screenshots failures

---

**Version** : 1.0
**Date** : 2026-02-07
**Stack** : Next.js 14 + Supabase + Tailwind CSS + Vercel
