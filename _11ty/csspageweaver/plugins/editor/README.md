# Plugin Editor pour PagedJS

Plugin d'édition WYSIWYG Medium-like pour PagedJS avec support de la typographie française.

## Fonctionnalités

- ✅ Édition inline des éléments HTML
- ✅ Barre d'outils contextuelle 
- ✅ Formatage Bold/Italic
- ✅ Typographie française (espaces insécables, guillemets)
- ✅ Copie Markdown avec reconstruction des éléments scindés
- ✅ Reset sélectif des transformations
- ✅ Support des footnotes

### Barre d'outils
8 boutons disponibles :

| Bouton | Icône | Fonction |
|--------|-------|----------|
| Bold | **B** | Formatage gras |
| Italic | *I* | Formatage italique |
| Espace insécable | ⎵ | Ajoute `<span class="i_space non-breaking-space">` |
| Espace fine | ⸱ | Ajoute `<span class="i_space narrow-no-break-space">` |
| Guillemet ouvrant | « | Insère « + espace fine |
| Guillemet fermant | » | Insère espace fine + » |
| Saut de ligne | ↵ | Insère `<br class="editor-add">` |
| Reset | ⟲ | Supprime transformations |
| Copie MD | 📋 | Copie élément en Markdown |
### Raccourcis clavier
- `Ctrl+B` : Bold
- `Ctrl+I` : Italic
- `Ctrl+Shift+C` : Copie Markdown


### Reset intelligent
Le bouton Reset supprime uniquement les éléments avec classe `editor-add` :
- Espaces insécables/fines → espaces normaux
- Guillemets ajoutés → supprimés
- `<br>` ajoutés → supprimés
- Formatage Bold/Italic → supprimé
- 
## Gestion des éléments scindés

Le plugin reconstitue automatiquement les éléments scindés par PagedJS lors de la copie Markdown :

```html
<!-- Page 1 -->
<p data-ref="123" data-split-to="123">Début du texte...</p>

<!-- Page 2 -->  
<p data-ref="123" data-split-from="123">...fin du texte</p>
```

La copie MD rassemble tous les fragments avec le même `data-ref`.


## Développement

## Structure des fichiers

```
editor/
├── editor.js               # Plugin principal 
├── toolbar.js              # Système de toolbar avec extensions
├── selection.js            # Gestion des sélections
├── commands.js              # Commandes de formatage
├── french-format.js        # Formatage typographique français
├── turndown.js             # Bibliothèque conversion HTML→MD
└── editor.css              # Styles interface
```

### Ajouter une extension
```javascript
class CustomExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }
  
  getButtons() {
    return [
      new ToolbarButton('custom', '⚡', 'Action custom', () => {
        this.customAction();
      })
    ];
  }
  
  customAction() {
    // Votre logique
  }
}

// Dans toolbar.js
this.extensions = [
  new FormattingExtension(this),
  new FrenchExtension(this), 
  new UtilsExtension(this),
  new CustomExtension(this) // Ajouter ici
];
```

### Customisation CSS
Classes principales :
- `.paged-editor-active` : Mode édition actif
- `.paged-editor-content` : Éléments éditables
- `.paged-editor-toolbar` : Barre d'outils
- `.editor-add` : Éléments ajoutés par l'éditeur
