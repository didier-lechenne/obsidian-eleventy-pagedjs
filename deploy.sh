#!/bin/bash
set -e  # Arrêter en cas d'erreur

echo "🔨 Building with Eleventy..."
npm run build

echo "📁 Deploying to Codeberg Pages..."
cd _site

# Configuration Git
git init 2>/dev/null || true
git branch -M pages 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin git@codeberg.org:didierlechenne/valentine.git

# Déploiement
git add .
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f origin pages

echo "✅ Site deployed to https://didierlechenne.codeberg.page/valentine"