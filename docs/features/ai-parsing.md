# Feature : Parsing automatique IA des recettes

**Statut** : Terminé
**Date** : 2026-02-09
**Commit** : `30281c7`
**Requirements** : REQ-IMPORT-001, REQ-IMPORT-002, REQ-IMPORT-003

---

## Contexte

Le MVP d'import de recettes fonctionnait avec des parsers déterministes :
- **URL** : JSON-LD schema.org via cheerio (fiable pour Marmiton, 750g...)
- **Texte** : regex/heuristiques côté client (approximatif)
- **Photo** : aucun parsing, formulaire vide

### Problème
- Le parsing texte par regex ratait souvent la structure (ingrédients vs étapes)
- Les sites sans JSON-LD retournaient un formulaire quasi-vide
- Les photos de recettes nécessitaient une saisie manuelle complète

### Solution
Intégration de Claude Haiku comme moteur de parsing intelligent sur les 3 modes d'import.

---

## Architecture

### Nouveau module : `src/lib/parsers/ai-parser.ts`

3 fonctions exportées :

| Fonction | Usage | Input |
|----------|-------|-------|
| `parseRecipeWithAI(text)` | Texte libre → recette structurée | Texte brut |
| `parseRecipeFromImage(base64, mediaType)` | Photo → recette via Vision | Image base64 JPEG/PNG/WebP |
| `parseRecipeFromHtmlWithAI(html, sourceUrl)` | Fallback URL quand JSON-LD échoue | HTML nettoyé (max 8000 chars) |

**Modèle** : `claude-haiku-4-5-20251001`
**Prompt système** : demande un JSON strict avec title, category, ingredients_text, steps_text, métadonnées
**Extraction JSON** : gère 3 formats de réponse (JSON brut, bloc markdown, objet dans du texte)

### Route API : `POST /api/parse-recipe`

Étendue pour accepter 3 modes :

```
{ url: "..." }                              → JSON-LD + fallback IA
{ mode: "text", text: "..." }               → Parsing IA direct
{ mode: "photo", image: "...", mediaType }   → Claude Vision
```

- `maxDuration = 30` (timeout Vercel pour les appels IA)
- Rétrocompatible avec l'ancien format `{ url }`
- Le fallback IA pour URL ne se déclenche que si JSON-LD retourne des données incomplètes (pas d'ingrédients ou pas d'étapes)

### Compression image : `src/lib/utils/image-compress.ts`

- Fonction `compressImageToBase64(file, maxWidth, quality)`
- Canvas HTML5 : redimensionne à 1200px max, exporte JPEG qualité 80%
- Retourne `{ base64, mediaType }` sans préfixe data URI

---

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/parsers/ai-parser.ts` | Module centralisant les appels Claude Haiku |
| `src/lib/utils/image-compress.ts` | Compression image client-side avant envoi |

## Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/app/api/parse-recipe/route.ts` | 3 modes (url/text/photo), fallback IA, maxDuration=30 |
| `src/components/recipes/import/text-import.tsx` | Appel serveur + spinner (remplace parsing client regex) |
| `src/components/recipes/import/photo-import.tsx` | 2 boutons : "Analyser avec l'IA" / "Remplir manuellement" |
| `src/components/recipes/import/import-tabs.tsx` | Prop `onResult` passée à PhotoImport |
| `.env.example` | Template ANTHROPIC_API_KEY |
| `package.json` | Dépendance `@anthropic-ai/sdk` |

---

## Décisions techniques

### Pourquoi Claude Haiku ?
- Rapport qualité/prix optimal (~0.01$/recette)
- Supporte Vision (parsing photos)
- Latence faible (~2-5s par requête)
- Suffisamment précis pour l'extraction structurée

### Pourquoi le fallback IA pour URL ?
- JSON-LD reste prioritaire (gratuit, instantané, fiable)
- L'IA n'intervient que si le résultat JSON-LD manque d'ingrédients ou d'étapes
- Évite les appels API inutiles pour les sites bien structurés

### Pourquoi compression JPEG côté client ?
- Réduit la taille avant envoi réseau (photos 5MB → ~100-200KB)
- Canvas HTML5 natif, pas de dépendance
- JPEG offre le meilleur ratio compression/qualité pour les photos de texte

### Pourquoi conserver le bouton "Remplir manuellement" ?
- Fallback si la clé API n'est pas configurée
- Fallback si l'IA ne peut pas lire l'image (manuscrit illisible, mauvaise qualité)
- L'utilisateur garde toujours le contrôle

---

## Tests effectués

| Scénario | Résultat |
|----------|----------|
| Texte : mousse au chocolat (titre, ingrédients, étapes, métadonnées) | Extraction complète et correcte |
| Photo : image générée de crêpes bretonnes | Claude Vision lit le texte et pré-remplit le formulaire |
| Responsive mobile (375x812) | Onglets, boutons et formulaire bien disposés |
| Erreurs console | 0 erreur |
| TypeScript strict | 0 erreur `tsc --noEmit` |

### Scénarios non testés (à valider manuellement)
- URL sans JSON-LD (blog personnel) → fallback IA
- Photo manuscrite (écriture cursive)
- Clé API absente → message d'erreur FR
- Rate limit / timeout API → messages d'erreur FR

---

## Dépendances ajoutées

| Package | Version | Usage |
|---------|---------|-------|
| `@anthropic-ai/sdk` | ^0.39.0 | Client API Claude Haiku |

## Variables d'environnement

| Variable | Requis | Usage |
|----------|--------|-------|
| `ANTHROPIC_API_KEY` | Oui (pour parsing IA) | Authentification API Anthropic |

---

## Coût estimé

- ~0.01$ par recette parsée (texte ou photo)
- 0$ pour les URLs avec JSON-LD valide (pas d'appel IA)
- Budget estimé : < 1$/mois pour un usage familial
