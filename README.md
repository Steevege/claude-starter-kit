# Mon Livre de Recettes 📖

Application web familiale pour centraliser et gérer ses recettes de cuisine dans un format unifié, quelle que soit leur source d'origine (photos, texte web, saisie manuelle).

## 🎯 Fonctionnalités MVP (v1)

- ✅ **Authentification** : Comptes individuels pour chaque membre de la famille
- 🔄 **Import multi-sources** : Photos, URLs web, copier-coller, saisie manuelle
- 📝 **CRUD Recettes** : Création, lecture, modification, suppression
- 🔍 **Recherche & Filtres** : Par titre, ingrédients, catégories
- ❤️ **Favoris** : Marquer ses recettes préférées
- 📱 **Mobile-first** : Interface optimisée pour consultation en cuisinant
- 🖼️ **Upload photos** : Stockage images avec compression

## 🛠️ Tech Stack

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript
- **Styling** : Tailwind CSS v4, shadcn/ui
- **Backend** : Supabase (Auth, PostgreSQL, Storage)
- **Hosting** : Vercel
- **Tests** : Playwright

## 📋 Prérequis

- Node.js 20+ installé
- Compte Supabase (gratuit)
- npm ou yarn

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd mes-recettes
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier `.env.example` vers `.env.local`
3. Remplir les variables avec vos clés Supabase :

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Où trouver ces clés ?**
> Dashboard Supabase → Settings → API → Project URL et anon/public key

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

## 📁 Structure du Projet

```
mes-recettes/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Routes authentification
│   │   ├── (dashboard)/       # Routes application
│   │   └── api/               # Route handlers API
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── recipes/           # Composants recettes
│   │   ├── layout/            # Header, Nav, Footer
│   │   └── auth/              # Composants auth
│   ├── lib/
│   │   ├── supabase/          # Clients Supabase
│   │   ├── schemas/           # Schemas Zod
│   │   └── types/             # Types TypeScript
│   └── middleware.ts          # Session refresh auto
├── public/                     # Assets statiques
├── supabase/
│   └── migrations/            # Migrations SQL
├── PRD.md                     # Spécifications produit
├── ARCHITECTURE.md            # Documentation technique
└── CLAUDE.md                  # Guidelines développement
```

## 🗃️ Modèle de Données

### Table `recipes`

```typescript
{
  id: UUID
  user_id: UUID
  title: string
  category: 'apero' | 'entree' | 'plat' | ... (11 catégories)
  ingredients: IngredientGroup[] // JSONB
  steps: RecipeStep[] // JSONB
  metadata: {
    prep_time?: number
    cook_time?: number
    servings?: number
    difficulty?: 'facile' | 'moyen' | 'difficile'
  }
  image_url?: string
  source_type: 'manual' | 'url' | 'paste' | 'photo'
  is_favorite: boolean
  tags: string[]
  created_at: timestamp
  updated_at: timestamp
}
```

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Variables sensibles dans `.env.local` (gitignored)
- ✅ Validation Zod sur tous les inputs
- ✅ HTTPS forcé (Vercel)
- ✅ Session cookies sécurisés (SSR Supabase)

## 🧪 Tests

```bash
# Tests E2E Playwright
npx playwright test

# Tests en mode UI
npx playwright test --ui

# Tests d'un fichier spécifique
npx playwright test auth.spec.ts
```

## 📦 Build & Déploiement

### Build local

```bash
npm run build
npm start
```

### Déploiement Vercel

1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel Dashboard
3. Deploy automatique à chaque push sur `main`

```bash
# Ou via CLI Vercel
vercel --prod
```

## 🛣️ Roadmap

### v1 (MVP) - En cours
- [x] Setup Next.js + Supabase + shadcn/ui
- [ ] Pages auth (login/signup)
- [ ] CRUD recettes
- [ ] Workflow import (v1 manuel)
- [ ] Recherche & filtres
- [ ] Tests Playwright
- [ ] Deploy Vercel

### v2 (Future)
- [ ] API parsing automatique (Claude Haiku)
- [ ] Mode cuisine (étape par étape)
- [ ] Partage familial
- [ ] Liste de courses auto
- [ ] Ajustement portions
- [ ] Export PDF

## 📚 Documentation

- **[@PRD.md](./PRD.md)** - Spécifications produit détaillées
- **[@ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture technique complète
- **[@CLAUDE.md](./CLAUDE.md)** - Guidelines de développement

## 🤝 Contribution

Ce projet est personnel/familial. Voir [@CLAUDE.md](./CLAUDE.md) pour les conventions de développement.

## 📄 Licence

ISC

---

**Créé avec** ❤️ **par Steeve + Claude Code**
