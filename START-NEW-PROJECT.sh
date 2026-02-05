#!/bin/bash

echo "🚀 Création d'un nouveau projet Claude Code"
echo ""

# Demander le nom du projet
read -p "Nom du projet (kebab-case): " project_name

if [ -z "$project_name" ]; then
    echo "❌ Nom de projet requis"
    exit 1
fi

# Créer le dossier du nouveau projet
mkdir "$project_name"

# Obtenir le chemin absolu du starter kit
STARTER_KIT_PATH="$(cd "$(dirname "$0")" && pwd)"

# Copier le template (exclure le script lui-même et .git)
rsync -av --exclude='START-NEW-PROJECT.sh' --exclude='.git' --exclude='README.md' "$STARTER_KIT_PATH/" "$project_name/"

# Se placer dans le nouveau projet
cd "$project_name"

# Remplacer [NOM_PROJET] dans les fichiers
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    find . -type f \( -name "*.md" \) -exec sed -i '' "s/\[NOM_PROJET\]/$project_name/g" {} +
else
    # Linux
    find . -type f \( -name "*.md" \) -exec sed -i "s/\[NOM_PROJET\]/$project_name/g" {} +
fi

# Renommer les fichiers template
mv PRD-TEMPLATE.md PRD.md 2>/dev/null || true
mv ARCHITECTURE-TEMPLATE.md ARCHITECTURE.md 2>/dev/null || true

# Créer un README spécifique au projet
cat > README.md << EOF
# $project_name

[Description courte du projet]

## 🚀 Quick Start

### Prérequis
- Node.js v18+
- npm ou yarn
- [Autres prérequis]

### Installation

1. Installer les dépendances
\`\`\`bash
npm install
\`\`\`

2. Configuration
\`\`\`bash
cp .env.example .env.local
# Éditer .env.local avec vos clés
\`\`\`

3. Lancer en dev
\`\`\`bash
npm run dev
\`\`\`

## 📚 Documentation

- [PRD.md](./PRD.md) - Spécifications produit
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique
- [CLAUDE.md](./CLAUDE.md) - Instructions Claude Code

## 🛠️ Commandes Disponibles

\`\`\`bash
npm run dev          # Lancer en développement
npm run build        # Build production
npm run test         # Lancer les tests
npm run lint         # Vérifier le code
\`\`\`

## 🎯 Roadmap

- [ ] MVP Features
- [ ] V1 Features
- [ ] V2 Features

## 📝 License

[Votre licence]
EOF

# Initialiser Git
git init
git add .
git commit -m "feat: initial setup from claude-starter-kit"

echo ""
echo "✅ Projet créé : $project_name"
echo ""
echo "📋 Prochaines étapes:"
echo "1. cd $project_name"
echo "2. Éditer PRD.md avec vos spécifications"
echo "3. claude (lancer Claude Code)"
echo "4. Demander à Claude de proposer l'architecture"
echo ""
