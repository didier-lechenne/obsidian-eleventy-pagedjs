# Plugin Layout

Plugin modulaire pour **CSSPageWeaver** offrant une grille interactive pour le positionnement précis d'éléments, la manipulation d'images et la génération automatique de shortcodes.

## 🎯 Fonctionnalités

### ✨ Grille Modulaire Interactive
- **Redimensionnement en direct** : Ajustez la taille des éléments directement dans la grille
- **Déplacement par glisser-déposer** : Repositionnez les éléments visuellement
- **Zones de redimensionnement étendues** : Coins et bords sensibles pour un contrôle précis
- **Validation automatique** : Respect des limites de la grille

### 🖼️ Manipulation d'Images Avancée
- **Déplacement d'image** : `Shift + glisser` pour repositionner l'image dans son conteneur
- **Zoom dynamique** : `Shift + molette` pour redimensionner
- **Contrôle au clavier** : `Shift + flèches` pour micro-ajustements
- **Positionnement 9 points** : Grille 3×3 pour un placement rapide
- **Actions rapides** : Remplir le bloc ou ajuster le contenu

### 🔧 Génération de Code Automatisée
- **Shortcodes Eleventy** : Génération automatique compatible `.eleventy.js`
- **Propriétés CSS** : Export de toutes les variables CSS personnalisées
- **Copie intelligente** : Copie automatique lors d'actions explicites
- **Formatage propre** : Code indenté et lisible

## 🚀 Installation

1. **Placez le plugin** dans `_11ty/csspageweaver/plugins/layout/`
2. **Activez le plugin** dans votre configuration CSSPageWeaver
3. **Incluez les styles** : Le CSS sera automatiquement chargé

```
_11ty/csspageweaver/plugins/layout/
├── layout.js              # Gestionnaire principal
├── gridHandler.js         # Logique de grille
├── imageHandler.js        # Manipulation d'images
├── codeGenerator.js       # Génération de shortcodes
├── utils.js              # Fonctions utilitaires
├── template.html         # Interface utilisateur
├── layout.css           # Styles du plugin
├── config.json          # Configuration
└── lib/
    └── turndown.js      # Conversion HTML → Markdown
```

## 📖 Utilisation

### Activation du Mode Layout

```javascript
// Le plugin s'active automatiquement via l'interface
// ou via le localStorage : layout = true
```

### Éléments Supportés

Le plugin reconnaît et gère automatiquement ces classes :

```html
<!-- Éléments redimensionnables -->
<div class="resize">...</div>
<figure class="figure">...</figure>
<div class="insert">...</div>
```

### Grille Modulaire

```css
/* Configuration de grille dans votre CSS */
.modularGrid {
    --grid-col: 12;  /* 12 colonnes */
    --grid-row: 10;  /* 10 lignes */
}
```

## 🎮 Contrôles

### Mode Grille
| Action | Contrôle |
|--------|----------|
| **Redimensionner** | Glisser les bords/coins |
| **Déplacer** | Glisser le bouton central |
| **Sélectionner** | Survol + mode layout actif |

### Mode Image
| Action | Contrôle |
|--------|----------|
| **Sélectionner** | `Shift + survol` |
| **Déplacer image** | `Shift + glisser` |
| **Zoom** | `Shift + molette` |
| **Micro-ajustement** | `Shift + flèches` |
| **Zoom clavier** | `Shift + +/-` |

### Interface
| Élément | Fonction |
|---------|----------|
| **Grille 3×3** | Positionnement rapide |
| **Alignement vertical** | `align-self` CSS |
| **Remplir bloc** | Image à 100% |
| **Ajuster contenu** | Respect ratio image |

## 🔧 API

### Événements Personnalisés

```javascript
// Émis lors du redimensionnement
document.addEventListener('gridResized', (e) => {
    console.log('Élément redimensionné:', e.detail.element);
});

// Génération de code sur demande
document.dispatchEvent(new CustomEvent('generateCode', {
    detail: { 
        element: monElement, 
        shouldCopy: true 
    }
}));
```

### Classes CSS

```css
/* États visuels automatiques */
.layout .resizable {
    outline: 1px solid var(--accentColor);
}

.layout .resizing {
    outline-color: #ff6600;
    z-index: 1000;
}

.layout .selected {
    background-color: hsla(16, 100%, 50%, 0.15);
}
```

## 📝 Shortcodes Générés

### Figure avec Image
```liquid
{% figure "images/photo.jpg", { 
  printCol: 2,
  printRow: 3,
  printWidth: 4,
  printHeight: 3,
  imgX: 15.5,
  imgY: 0, 
  imgW: 120.8,
  caption: "Légende de l'image"
} %}
```

### Élément Insert
```liquid
{% insert { 
  printCol: 1,
  printRow: 1,
  printWidth: 6,
  printHeight: 2,
  alignSelf: "center",
  class: "highlight special"
} %}
```

## ⚙️ Configuration

### Variables CSS Personnalisables

```css
:root {
    --accentColor: #0066cc;              /* Couleur principale */
    --cssPageWeaver-color-accent-hover: #0080ff;  /* Couleur survol */
}
```

### Options du Plugin

```json
{
    "name": "layout",
    "description": "Grille modulaire interactive",
    "ui": {
        "title": "layout",
        "template": "template.html",
        "toggle": true
    },
    "hook": "hook-layout.js",
    "stylesheet": "layout.css"
}
```

## 🎨 Personnalisation

### Couleurs par Type d'Élément

```css
/* Éléments .resize */
.modularGrid .resize.resizable {
    outline-color: #ff6600 !important;
}

/* Éléments .figure */  
.modularGrid .figure.resizable {
    outline-color: #00cc66 !important;
}

/* Éléments .insert */
.modularGrid .insert.resizable {
    outline-color: #9966cc !important;
}
```

### Zones de Redimensionnement

```javascript
// Dans gridHandler.js
this.zones = {
    edge: 20,     // Zone de bord (px)
    corner: 25    // Zone de coin (px)
};
```

## 🐛 Dépannage

### Problèmes Courants

**Le mode layout ne s'active pas**
```javascript
// Vérifier la présence du toggle
const toggle = document.querySelector('[data-plugin="layout"]');
console.log('Toggle trouvé:', toggle);
```

**Éléments non redimensionnables**
```css
/* Vérifier la structure HTML */
<section class="modularGrid">
    <div class="resize"><!-- Votre contenu --></div>
</section>
```

**Shortcodes non générés**
```javascript
// Vérifier les propriétés CSS
const element = document.querySelector('.resize');
console.log('Propriétés:', element.style.cssText);
```

### Debug Mode

```javascript
// Activer les logs détaillés (décommentez dans le code)
console.log('🚀 Layout Plugin: Initialisation...');
console.log('✅ Layout Plugin: Prêt');
```

## 📄 Licence

Plugin développé pour **CSSPageWeaver** - Framework de mise en page modulaire.

## 🤝 Contribution

Pour contribuer au développement :

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité
3. **Testez** vos modifications
4. **Soumettez** une pull request

## 📚 Documentation Technique

### Architecture

```
Layout (Handler principal)
├── gridHandler (Redimensionnement)
├── imageHandler (Manipulation images) 
└── codeGenerator (Export shortcodes)
```

### Cycle de Vie

1. **beforeParsed()** : Nettoyage
2. **afterRendered()** : Initialisation des handlers
3. **cleanup()** : Libération des ressources
4. **destroy()** : Destruction complète

---

**Version** : 1.0.0  
**Compatibilité** : CSSPageWeaver 2.0+  
**Navigateurs** : Chrome 80+, Firefox 75+, Safari 13+