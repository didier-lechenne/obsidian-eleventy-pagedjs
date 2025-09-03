# Instructions Copilot pour eleventy-pagedjs

Ce projet utilise Eleventy (11ty) pour générer deux types de sites statiques à partir des mêmes fichiers sources :
- Une version web avec des images optimisées
- Une version print avec PagedJS pour la mise en page papier

## Architecture et Composants Clés

### Configuration Multiple
- `.eleventy.js` - Configuration principale pour la version web
- `.eleventyPrint.js` - Configuration pour la version print
- `.eleventyStart.js` - Configuration de développement commune
- `_11ty/config/*.js` - Modules de configuration séparés (markdown, shortcodes, etc.)

### Workflow de Build
```bash
# Développement
npm run start           # Version web + print
npm run start:screen   # Version web uniquement
npm run start:print    # Version print uniquement

# Production
npm run build          # Les deux versions
npm run build:screen  # Version web
npm run build:print   # Version print
```

### Ordre de Traitement
1. Preprocessors (`_11ty/config/preprocessor.js`)
2. Markdown → HTML (`_11ty/config/markdown.js`)
3. Templates Nunjucks
4. Transformations (`_11ty/config/transforms.js`)

## Conventions Spécifiques

### Markdown Étendu
- Utilise plusieurs plugins markdown-it pour les fonctionnalités étendues
- Supporte les sauts de page/colonne via `<breakpage />` et `<breakcolumn />`
- Les attributs personnalisés sont supportés via markdown-it-attrs

### Images
- Version web : Images optimisées via @11ty/eleventy-img
- Version print : Chemins d'images convertis en absolus
- Shortcodes disponibles : `imgfull`, `imgdouble`, etc.

### Layouts
- `_11ty/_layouts/base.njk` - Layout de base
- `_11ty/_layouts/print.njk` - Layout spécifique print avec PagedJS
- `_11ty/_layouts/screen.njk` - Layout spécifique web

## Points d'Intégration

### PagedJS
- Intégré via `/csspageweaver/`
- Les styles print sont dans `_11ty/assets/themes/*/print.css`

### Configuration YAML
- `_11ty/_data/config.yml` - Configuration globale
- `_11ty/_data/theme.yml` - Configuration du thème

## Directives de Développement

1. Toujours tester les deux versions (web et print)
2. Utiliser les shortcodes appropriés pour les médias
3. Vérifier la pagination avec PagedJS pour la version print
