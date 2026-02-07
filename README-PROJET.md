# Claude Starter Kit

> Starter kit optimisé pour développer avec Claude Code - Workflow structuré, MCP configurés, skills recommandés

## 🎯 À Propos

Ce starter kit fournit une base complète pour démarrer des projets avec Claude Code, incluant :
- ✅ Workflow de développement structuré en 4 phases
- ✅ MCP pré-configurés (Context7, Playwright)
- ✅ Guidelines de développement (CLAUDE.md)
- ✅ Templates de documentation (@PRD.md, @ARCHITECTURE.md)
- ✅ Best practices et conventions

---

## 📚 Documentation Essentielle

### Pour Démarrer
- **[CLAUDE.md](./CLAUDE.md)** - Instructions projet pour Claude Code ⭐ **COMMENCE ICI**
- **[MCP-SKILLS-GUIDE.md](./MCP-SKILLS-GUIDE.md)** - Guide complet MCP, Skills et Agents

### Templates de Projet
- **[PRD.md](./PRD.md)** - Product Requirements Document (template)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture Decision Record (template)

---

## 🚀 Quick Start

### Prérequis
```bash
✅ Node.js v18+
✅ Claude Code CLI installé
✅ Git configuré
✅ Playwright (global) - Vérifie : npx playwright --version
```

### Installation

1. **Utiliser ce template**
```bash
# Option 1 : Via GitHub (si template repo)
gh repo create mon-projet --template claude-starter-kit

# Option 2 : Clone direct
git clone [url]
cd mon-projet
```

2. **Configuration initiale**
```bash
# Renommer le projet
# Éditer CLAUDE.md ligne 1 : # Instructions Projet - [MON_PROJET]

# Configurer Git
git remote set-url origin [votre-repo]
```

3. **Vérifier MCP**
```bash
# Lister les MCP configurés
claude mcp list

# Si Context7 ou Playwright manquent, voir MCP-SKILLS-GUIDE.md
```

4. **Prêt à coder !**
```bash
# Lance Claude Code dans le projet
cd mon-projet
claude

# Commence par la phase découverte
/interview
```

---

## 🎨 Workflow en 4 Phases

```
┌─────────────────────────────────────────────────────┐
│  Phase 1 : Découverte                               │
│  /interview → Clarifier → @PRD.md                   │
├─────────────────────────────────────────────────────┤
│  Phase 2 : Architecture                             │
│  Tech stack → Comparaison → @ARCHITECTURE.md        │
├─────────────────────────────────────────────────────┤
│  Phase 3 : Setup                                    │
│  Git + .env → Permissions → Install deps            │
├─────────────────────────────────────────────────────┤
│  Phase 4 : Build (Boucle)                           │
│  Plan → Code (Context7) → Test (Playwright) → Push  │
└─────────────────────────────────────────────────────┘
```

**Détails complets** : Voir [CLAUDE.md](./CLAUDE.md) section "Workflow Standard"

---

## 🧰 Outils Pré-Configurés

### MCP Servers
| MCP | Usage | Status |
|-----|-------|--------|
| **Context7** | Documentation à jour (AUTOMATIQUE) | ✅ |
| **Playwright** | Tests UI/Web | ✅ |

### Skills Recommandés
```bash
/interview        # Phase découverte structurée
/frontend-design  # Interfaces responsive & accessibles
/webapp-testing   # Tests Playwright guidés
/doc-coauthoring  # Co-rédaction documentation
```

**Guide complet** : [MCP-SKILLS-GUIDE.md](./MCP-SKILLS-GUIDE.md)

---

## 🛠️ Commandes Utiles

### Claude Code
```bash
/interview              # Démarrer découverte projet
/clear                  # Nettoyer contexte (entre features)
/context                # Vérifier usage tokens

Shift+Tab               # Basculer Plan ↔ Build mode
Shift+Enter             # Retour à la ligne (sans soumettre)
Esc                     # Stopper action en cours
```

### Développement
```bash
npm run dev             # Lancer en développement
npm run build           # Build production
npm run test            # Lancer les tests
npm run lint            # Vérifier le code
```

### Git
```bash
# Claude gère automatiquement :
# - git status
# - git add [fichiers]
# - git commit -m "..."
# - git push (après confirmation)
```

---

## 📖 Structure du Projet

```
claude-starter-kit/
├── CLAUDE.md                # Instructions Claude (⭐ PRIORITAIRE)
├── MCP-SKILLS-GUIDE.md      # Guide MCP/Skills/Agents
├── PRD.md                   # Template Product Requirements
├── ARCHITECTURE.md          # Template Architecture Decision
├── README.md                # Ce fichier
├── .env.example             # Template variables environnement
├── package.json             # Dépendances (à créer)
└── src/                     # Code source (à créer)
```

---

## 🎓 Best Practices

### ✅ À Faire
- **Toujours** utiliser Context7 avant génération de code
- **Toujours** tester les interfaces avec Playwright
- **Toujours** `/clear` entre features (contexte propre)
- **Toujours** documenter dans @PRD.md et @ARCHITECTURE.md
- Commits fréquents avec messages clairs
- Responsive mobile-first obligatoire

### ❌ À Éviter
- Coder sans consulter Context7 (docs obsolètes)
- Skipper tests UI Playwright
- Réinstaller outils déjà globaux (Node, Playwright)
- Exposer clés API côté client
- Mode sombre pour MVP (sauf demande explicite)

---

## 🚨 Troubleshooting

### Claude ne trouve pas Context7 ou Playwright
```bash
# 1. Vérifier MCP
claude mcp list

# 2. Voir logs
claude mcp logs context7
claude mcp logs playwright

# 3. Redémarrer Claude Code

# 4. Voir guide détaillé
# → MCP-SKILLS-GUIDE.md section "Troubleshooting"
```

### Playwright MCP ne fonctionne pas
```bash
# Vérifier installation globale
npx playwright --version

# Reconfigurer
claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest

# Redémarrer Claude Code
```

### Plus d'aide
- [MCP-SKILLS-GUIDE.md](./MCP-SKILLS-GUIDE.md) - Troubleshooting complet
- [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- `/help` dans Claude Code

---

## 🎯 Next Steps

1. **Personnalise le starter kit**
   - Édite `CLAUDE.md` ligne 1 avec ton nom de projet
   - Complète `PRD.md` avec tes spécifications
   - Configure `ARCHITECTURE.md` avec tes choix tech

2. **Lance ton premier projet**
   ```bash
   claude
   /interview  # Commence la découverte
   ```

3. **Explore le guide MCP**
   - Ouvre [MCP-SKILLS-GUIDE.md](./MCP-SKILLS-GUIDE.md)
   - Familiarise-toi avec les skills disponibles
   - Crée des skills custom si besoin récurrent

4. **Partage ton expérience**
   - Améliore ce starter kit avec tes learnings
   - Crée des skills custom pour ton équipe
   - Contribue à la communauté Claude Code

---

## 🤝 Contribution

Ce starter kit évolue avec les projets. N'hésite pas à :
- Proposer des améliorations
- Partager tes skills custom
- Documenter tes découvertes
- Ajouter des exemples concrets

---

## 📝 License

MIT - Utilise librement pour tes projets

---

## 🙏 Remerciements

- **Claude Code** - Par Anthropic
- **Context7** - Documentation MCP
- **Playwright** - Tests E2E

---

**Créé avec ❤️ et Claude Code**
