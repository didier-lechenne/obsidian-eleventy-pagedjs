gridStudio permet l'**édition visuelle interactive d'éléments dans une grille modulaire** via deux mécanismes principaux :

## 1. **Éléments ciblés**

- `.resize` - Images redimensionnables
- `.figure` - Figures avec légendes
- `.insert` - Blocs de contenu
- Tous doivent être dans un conteneur `.modularGrid`

## 2. **Mécanismes d'interaction**

### **A. Images (ImageManipulator)**

- **Déplacement** : Shift + glisser l'image
- **Zoom** : Shift + molette souris
- **Touches fléchées** : Shift + ↑↓←→ pour déplacer

### **B. Grille modulaire (GridDragDropHandler)**

- **Zones de détection** sur les bords des éléments :
    - **Bords** (15px) : redimensionnement unidirectionnel
    - **Coins** (20px) : redimensionnement diagonal
    - **Centre** : déplacement de position

### **C. Propriétés CSS manipulées**

css

```css
--print-col      /* Position colonne */
--print-row      /* Position ligne */
--print-width    /* Largeur en colonnes */
--print-height   /* Hauteur en lignes */
--img-x, --img-y /* Position image dans conteneur */
--img-w          /* Largeur image */
```

## 3. **Activation**

Le mode s'active via un toggle UI qui ajoute la classe `.gridStudio` au body, déclenchant les listeners d'événements pour la manipulation visuelle.

Le système génère automatiquement le code shortcode correspondant aux manipulations effectuées.