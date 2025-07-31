# Plugin Layout

Plugin modulaire pour **CSSPageWeaver** offrant une grille interactive pour le positionnement précis d'éléments, la manipulation d'images et la génération automatique de shortcodes.

La mise à jour de votre fichier source .md n’est pas automatique !
Après vos manipulation, il faudra copier le shortcode avec ses nouvelles valeurs.
## Fonctionnalités

### Grille Modulaire Interactive
- **Redimensionnement en direct** : Ajustez la taille des éléments directement dans la grille
- **Déplacement par glisser-déposer** : Repositionnez les éléments visuellement
- **Zones de redimensionnement étendues** : Coins et bords sensibles pour un contrôle précis
- **Validation automatique** : Respect des limites de la grille

### Manipulation d'Images Avancée
- **Déplacement d'image** : `Shift + glisser` pour repositionner l'image dans son conteneur
- **Zoom dynamique** : `Shift + molette` pour redimensionner
- **Contrôle au clavier** : `Shift + flèches` pour micro-ajustements
- **Positionnement 9 points** : Grille 3×3 pour un placement rapide
- **Actions rapides** : Remplir le bloc ou ajuster le contenu

### Génération de Code Automatisée
- **Shortcodes Eleventy** : Génération automatique compatible `.eleventy.js`
- **Propriétés CSS** : Export de toutes les variables CSS personnalisées
- **Copie intelligente** : Copie automatique lors d'actions explicites
- **Formatage propre** : Code indenté et lisible

La mise à jour de votre fichier source .md n’est pas automatique !
Après vos manipulation, il faudra copier le shortcode avec ses nouvelles valeurs.
Il est automatiquement mis dans le presse papier.


### Configuration de la grille modulaire

```yaml
# Configuration du frontMatter
---
title: votre-titre
template: modularGrid  # obligatoire
gridCol: 12
gridRow: 22
gridColGutter: 3mm
gridRowGutter: 0mm
show: print
moveBefore: 47 # déplace la page avant
moveAfter: 45 # variante - Déplace la page apres
toc: ignore # ne sera jamais afficher dans la table des matières
---
```

### Sortcodes Générés

### Image
```liquid
{% grid "images/photo.jpg", { 
  printCol: 1,
  printRow: 3,
  printWidth: 4,
  printHeight: 3,
  imgX: 15.5,
  imgY: 0, 
  imgW: 120.8,
  caption: "Légende de l'image"
} %}
```

### Contenu textuel 
```liquid
{% grid "content/text.md", { 
  printCol: 1,
  printRow: 1,
  printWidth: 6,
  printHeight: 2,
  alignSelf: "center"
} %}
```


## Contrôles

### Mode Grille
| Action | Contrôle |
|--------|----------|
| **Redimensionner** | Glisser les bords/coins |
| **Déplacer** | Glisser le bouton central |
| **Sélectionner** | Clic sur l'élément |

### Mode Image (zoom)

| Action | Contrôle |
|--------|----------|
| **Déplacer image** | `Shift + glisser` |
| **Zoom** | `Shift + molette` |
| **Micro-ajustement** | `Shift + flèches` |
| **Zoom clavier** | `Shift + +/-` |

### Interface
| Élément                 | Fonction              |
| ----------------------- | --------------------- |
| **Grille 3×3**          | Positionnement rapide |
| **Alignement vertical** | `align-self`          |
| **Remplir bloc**        | Image à 100%          |
| **Ajuster contenu**     | Respect ratio image   |


### Zones de Redimensionnement

```javascript
// Dans layout.js
this.zones = {
    edge: 20,     // Zone de bord (px)
    corner: 25    // Zone de coin (px)
};
```


```
_11ty/csspageweaver/plugins/layout/
├── layout.js              # Gestionnaire principal
├── template.html          # Interface utilisateur
├── layout.css            # Styles du plugin
├── config.json           # Configuration
└── lib/
    └── turndown.js       # Conversion HTML → Markdown
```



### Éléments Supportés

Le plugin reconnaît et gère automatiquement ces attributs :

```html
<!-- Éléments redimensionnables -->
<figure data-grid="image">...</figure>
<div data-grid="markdown">...</div>
```
