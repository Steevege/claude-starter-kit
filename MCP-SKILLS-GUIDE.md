# 🧰 Guide MCP, Skills et Agents

> Guide de référence pour optimiser ton workflow avec Claude Code

## 📊 Vue d'Ensemble

### Ton Stack Actuel
```
┌─────────────────────────────────────────┐
│           MCP SERVERS (2)               │
├─────────────────────────────────────────┤
│ ✅ Context7     → Docs à jour           │
│ ✅ Playwright   → Tests UI/Web          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         SKILLS ESSENTIELS (6)           │
├─────────────────────────────────────────┤
│ /interview        → Phase Découverte    │
│ /frontend-design  → UI/UX               │
│ /webapp-testing   → Tests Playwright    │
│ /doc-coauthoring  → Documentation       │
│ /skill-creator    → Skills custom       │
│ /mcp-builder      → MCP custom          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      AGENTS (Automatiques)              │
├─────────────────────────────────────────┤
│ Explore → Recherche codebase            │
│ Plan    → Planification (Shift+Tab)     │
│ Bash    → Git & système                 │
└─────────────────────────────────────────┘
```

---

## 🎯 **MCP SERVERS** - Intégrations Externes

### 1️⃣ Context7 (CRITIQUE) ✅

**Quand l'utiliser** : TOUJOURS avant de coder
**Automatique** : Oui (selon CLAUDE.md)

```
✓ Générer du code avec une bibliothèque
✓ Configurer/installer une dépendance
✓ Consulter documentation API
✓ Vérifier syntaxe récente d'un framework
```

**Exemple workflow** :
```bash
User: "Ajoute validation de formulaire avec Zod"
Claude:
  1. 🔍 Query Context7 pour doc Zod récente
  2. 📝 Génère code avec syntaxe à jour
  3. ✅ Explique en français
```

**Commandes** :
```bash
# Vérifier si actif
claude mcp list

# Débug si problème
claude mcp logs context7
```

---

### 2️⃣ Playwright MCP (Tests UI) ✅

**Quand l'utiliser** : Après chaque feature UI
**Automatique** : Non (appeler explicitement)

```
✓ Tester interface graphique
✓ Capturer screenshots responsive
✓ Vérifier accessibilité
✓ Débugger comportement UI
✓ Naviguer dans app web locale
```

**Exemple workflow** :
```bash
User: "Teste la page de login"
Claude:
  1. 🌐 Lance Playwright browser
  2. 📸 Screenshot desktop/mobile/tablet
  3. 🔍 Vérifie éléments interactifs
  4. ✅ Rapport de test
```

**Commandes** :
```bash
# Vérifier installation
npx playwright --version

# Reconfigurer si besoin
claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest

# Redémarrer Claude Code si non chargé
```

---

### 🆕 MCP à Ajouter (Optionnels)

#### GitHub MCP (si workflows Git intenses)
```bash
# Installation
claude mcp add github

# Use cases
✓ Créer/lire/commenter PRs automatiquement
✓ Gérer issues depuis Claude
✓ Review code dans les PRs
✓ Automatiser workflows Git complexes
```

#### Notion MCP (si utilisation Notion)
```bash
# Installation
claude mcp add notion

# Use cases
✓ Sync @PRD.md ↔ Notion
✓ Tracking features OpenSpec
✓ Gestion projet centralisée
```

---

## 🛠️ **SKILLS** - Workflows Spécialisés

### Core Workflow

#### `/interview` - Découverte Structurée
**Phase** : 1 - Découverte
**Quand** : Début de projet ou nouvelle feature complexe

```
✓ Questions itératives pour clarifier besoin
✓ Recherche alternatives existantes (code + web)
✓ Documentation via Context7
✓ Validation compréhension (analogies)
✓ Découpage en features si trop complexe
✓ Active mode Plan par défaut
```

**Workflow** :
```
/interview → Questions → Recherche → Doc → Plan → Validation
```

---

#### `/frontend-design` - Interfaces de Qualité
**Phase** : 4 - Build
**Quand** : Création/amélioration d'interfaces web

```
✓ Design distinctif et moderne
✓ Responsive mobile-first
✓ Accessibilité intégrée
✓ Évite esthétique "générique AI"
✓ Code production-ready
```

**Use cases** :
- Créer landing page
- Dashboard application
- Composants React réutilisables
- Améliorer UI existante

---

#### `/webapp-testing` - Tests Playwright
**Phase** : 4 - Build (après implémentation)
**Quand** : Valider chaque interface

```
✓ Complément au Playwright MCP
✓ Tests interactifs détaillés
✓ Debugging comportement UI
✓ Screenshots comparatifs
✓ Logs browser
```

**Différence vs Playwright MCP** :
- MCP = Tests directs, rapides
- Skill = Workflow guidé, plus complet

---

### Documentation

#### `/doc-coauthoring` - Rédaction Collaborative
**Phase** : 1-2 (Découverte/Architecture)
**Quand** : Écrire @PRD.md, @ARCHITECTURE.md

```
✓ Workflow structuré de rédaction
✓ Transfert de contexte efficace
✓ Itérations de raffinement
✓ Vérification auprès des lecteurs
```

**Idéal pour** :
- Product Requirements Document
- Architecture Decision Records
- Technical Specs
- Documentation utilisateur

---

### Customisation

#### `/skill-creator` - Créer Skills Custom
**Quand** : Workflow récurrent non couvert

**Exemples d'usages** :
```
✓ Générer spec OpenSpec automatiquement
✓ Workflow commit personnalisé
✓ Validation code selon guidelines projet
✓ Templates de fichiers spécifiques
```

**Process** :
```
1. Identifier pattern récurrent
2. /skill-creator
3. Définir inputs/outputs
4. Tester et itérer
5. Documenter dans projet
```

---

#### `/mcp-builder` - MCP Servers Custom
**Quand** : Intégration service externe récurrente

**Use cases** :
```
✓ API interne entreprise
✓ Base de données spécifique
✓ Service cloud custom
✓ Outil métier propriétaire
```

**Technologies** :
- Python (FastMCP) - Recommandé si API Python
- Node/TypeScript (MCP SDK) - Recommandé pour intégrations JS

---

### Utilitaires (Selon Besoins)

| Skill | Quand Utiliser | Cas d'Usage |
|-------|----------------|-------------|
| `/pdf` | Manipulation PDFs | Extraire texte, fusionner, remplir formulaires |
| `/xlsx` | Données tabulaires | Nettoyer data, générer rapports, formules |
| `/docx` | Documents Word | Générer rapports formatés, templates |
| `/pptx` | Présentations | Créer decks, pitch clients |
| `/canvas-design` | Art visuel | Posters, designs statiques |

---

## 🤖 **AGENTS** - Assistants Spécialisés

### Explore Agent

**Activation** : Automatique (>3 queries) ou manuel

```bash
# Manuel si tu sais que ça va être complexe
Task → Explore → "Trouve tous les composants auth"
```

**Quand** :
```
✓ Recherche approfondie dans codebase
✓ Patterns complexes à identifier
✓ Analyse architecture existante
✓ > 3 queries Glob/Grep prévues
```

**Éviter si** :
- Recherche simple (1-2 fichiers connus)
- Question directe (utilise Glob/Grep direct)

---

### Plan Agent

**Activation** : `Shift+Tab` ou automatique selon complexité

**Quand** :
```
✓ Feature multi-fichiers
✓ Décisions architecturales
✓ Modifications structurelles
✓ Besoin validation avant implémentation
```

**Workflow** :
```
1. Shift+Tab → Mode Plan
2. Explore codebase
3. Propose architecture
4. User approuve
5. Shift+Tab → Mode Build
6. Implémentation
```

---

### Bash Agent

**Activation** : Automatique pour opérations système

**Use cases** :
```
✓ Git operations (commit, push, pull)
✓ Installation dépendances (npm, pip)
✓ Tests (npm test, pytest)
✓ Build (npm run build)
✓ Déploiement
```

**Note** : Claude utilise outils dédiés (Read, Edit, Write) plutôt que cat/sed/awk

---

## 📋 Checklist Par Phase

### Phase 1 : Découverte
```
[ ] /interview pour cadrer le besoin
[ ] /doc-coauthoring pour @PRD.md
[ ] Context7 activé (automatique)
[ ] Définir MVP/V1/V2
```

### Phase 2 : Architecture
```
[ ] Plan Agent si complexe (Shift+Tab)
[ ] Context7 pour comparaison tech
[ ] /doc-coauthoring pour @ARCHITECTURE.md
[ ] Validation user
```

### Phase 3 : Setup
```
[ ] Git init + .env
[ ] Installer dépendances (Context7 pour syntaxe)
[ ] Permissions Claude
```

### Phase 4 : Build (Boucle)
```
[ ] /clear (nouveau contexte)
[ ] Context7 avant génération code
[ ] /frontend-design si UI
[ ] Implémenter feature
[ ] /webapp-testing + Playwright MCP
[ ] Commit + Push
[ ] Répéter
```

---

## 🎓 Tips & Best Practices

### Context7
```bash
✓ TOUJOURS l'utiliser avant coder
✗ Ne jamais se fier qu'aux données d'entraînement
✓ Vérifier docs même si "tu connais"
✓ Syntaxe récente > syntaxe obsolète
```

### Skills
```bash
✓ Préférer skill spécialisé vs prompt générique
✗ Ne pas cumuler skills pour même tâche
✓ Créer skill custom si >3 répétitions
✓ Documenter skills custom dans projet
```

### Agents
```bash
✓ Laisser Claude décider (automatique)
✗ Ne pas forcer agent si simple
✓ Shift+Tab explicite pour Plan Mode
✓ /clear entre features pour reset contexte
```

### Playwright
```bash
✓ Tester CHAQUE interface (obligatoire)
✓ Desktop + Mobile + Tablet
✗ Ne pas skipper tests responsive
✓ Redémarrer Claude si MCP non chargé
```

---

## 🚨 Troubleshooting

### Context7 ne répond pas
```bash
# 1. Vérifier status
claude mcp list

# 2. Voir logs
claude mcp logs context7

# 3. Redémarrer Claude Code
# 4. Reconfigurer si nécessaire
```

### Playwright MCP introuvable
```bash
# 1. Vérifier installation
npx playwright --version

# 2. Reconfigurer MCP
claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest

# 3. Redémarrer Claude Code

# 4. Tester
claude mcp list | grep playwright
```

### Skill non trouvé
```bash
# 1. Vérifier disponibilité
/help

# 2. Syntax exacte
/skill-name (pas /skill_name)

# 3. Si custom : vérifier installation
# 4. Contacter support si built-in manquant
```

### Agent bloqué
```bash
# 1. Esc pour stopper
# 2. Analyser erreur
# 3. /clear si contexte pollué
# 4. Reformuler demande
```

---

## 📚 Ressources

### Documentation
- [Claude Code Docs](https://claude.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Playwright](https://playwright.dev)

### Support
```bash
# Help intégré
/help

# Feedback/Issues
https://github.com/anthropics/claude-code/issues

# Logs Claude
~/.claude/logs/
```

---

## 🎯 Quick Reference

### Commandes Clés
```bash
/interview           # Découverte projet
/frontend-design     # UI/UX
/webapp-testing      # Tests Playwright
/doc-coauthoring     # Rédaction docs
/skill-creator       # Créer skill
/mcp-builder         # Créer MCP

Shift+Tab            # Toggle Plan/Build
/clear               # Reset contexte
/context             # Usage tokens
Esc                  # Stop action
```

### Workflow Optimal
```
1. /interview → Cadrer
2. Shift+Tab → Planifier (si complexe)
3. Context7 → Documenter
4. /frontend-design → Builder UI
5. /webapp-testing → Tester
6. Git commit → Valider
7. /clear → Feature suivante
```

---

**Dernière mise à jour** : 2026-02-06
**Projet** : claude-starter-kit
**Auteur** : Claude Code + User
