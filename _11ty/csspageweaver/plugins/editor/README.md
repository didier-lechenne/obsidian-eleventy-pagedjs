# Plugin Editor pour PagedJS

Plugin d'édition WYSIWYG Medium-like pour PagedJS avec support de la typographie française.

## Fonctionnalités

- ✅ Édition inline des éléments HTML
- ✅ Barre d'outils contextuelle 
- ✅ Formatage Petites capitales et Exposant
- ✅ Lettrage personnalisé (letter-spacing)
- ✅ Typographie française (espaces insécables, guillemets)
- ✅ Copie Markdown avec reconstruction des éléments scindés
- ✅ Reset sélectif des transformations
- ✅ Support le contenu des footnotes

### Barre d'outils
8 boutons disponibles :

| Bouton | Icône | Fonction |
|--------|-------|----------|
| Petites capitales | ᴀᴀ | Formatage `<span class="small-caps">` |
| Exposant | x² | Formatage `<sup>` |
| Lettrage | A ↔ A | Letter-spacing personnalisé avec CSS variables |
| Espace insécable | ⎵ | Ajoute `<span class="i_space non-breaking-space">` |
| Espace fine | ⸱ | Ajoute `<span class="i_space narrow-no-break-space">` |
| Guillemet ouvrant | « | Insère « + espace fine |
| Guillemet fermant | » | Insère espace fine + » |
| Saut de ligne | ↵ | Insère `<br class="editor-add">` |
| Reset | ⟲ | Supprime transformations |
| Copie MD | 📋 | Copie élément en Markdown |

<!-- ### Raccourcis clavier
- `Ctrl+Shift+C` : Copie Markdown -->

### Lettrage (Letter-spacing)
- Sélectionner du texte et cliquer sur "A ↔ A"
- Un input numérique apparaît pour ajuster la valeur
- Validation par Entrée ou clic sur ✓
- Utilise les CSS variables `--ls` pour l'espacement

### Reset 
Le bouton Reset supprime uniquement les éléments avec classe `editor-add` :
- Espaces insécables/fines → espaces normaux
- Guillemets ajoutés → supprimés
- `<br>` ajoutés → supprimés
- Formatage Petites capitales/Exposant → supprimé
- Letter-spacing personnalisé → supprimé

## Gestion des éléments scindés

Le plugin reconstitue automatiquement les éléments scindés par PagedJS lors de la copie Markdown :

```html
<!-- Page 1 -->
<p data-ref="123" data-split-to="123">Début du texte...</p>

<!-- Page 2 -->  
<p data-ref="123" data-split-from="123">...fin du texte</p>
```

La copie MD rassemble tous les fragments avec le même `data-ref`.

## Configuration

Le plugin s'active/désactive via le toggle avec id `editor-toggle`. L'état est sauvegardé en localStorage.

## Développement

### Structure des fichiers

```
editor/
├── editor.js               # Plugin principal
├── toolbar.js              # Système de toolbar avec extensions 
├── selection.js            # Gestion des sélections de texte
├── commands.js             # Commandes de formatage
├── turndown.js             # Bibliothèque conversion HTML→Markdown 
├── editor.css              # Styles interface
```

### Extensions de la toolbar

#### FormattingExtension
- Petites capitales (`<span class="small-caps">`)
- Exposant (`<sup>`)

#### LetterSpacingExtension  
- Interface pour ajuster le letter-spacing
- Input numérique contextuel
- CSS variables `--ls`

#### SpacingExtension
- Espaces typographiques français
- Guillemets avec espaces fines
- Sauts de ligne
- Reset des transformations

#### UtilsExtension
- Copie Markdown avec règles personnalisées
- Reconstruction des éléments scindés

### Ajouter une extension

#### 1. Ajouter les commandes dans commands.js

```javascript
// Dans commands.js, ajouter ces méthodes :
toggleUnderline() {
  const selection = this.editor.selection.getCurrentSelection();
  if (!selection || !selection.isValid) return;
  
  const range = selection.range;
  
  if (this.isWrappedInTag(range, ['U'])) {
    this.unwrapTag(range, ['U']);
  } else {
    this.wrapSelection(range, 'u');
  }
}

toggleStrikethrough() {
  const selection = this.editor.selection.getCurrentSelection();
  if (!selection || !selection.isValid) return;
  
  const range = selection.range;
  
  if (this.isWrappedInTag(range, ['S', 'STRIKE', 'DEL'])) {
    this.unwrapTag(range, ['S', 'STRIKE', 'DEL']);
  } else {
    this.wrapSelection(range, 's');
  }
}
```

#### 2. Créer la classe d'extension

```javascript
class UnderlineExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
    this.editor = toolbar.editor;
  }
  
  getButtons() {
    return [
      new ToolbarButton('underline', '<u>U</u>', 'Souligner', () => {
        this.toggleUnderline();
      }),
      new ToolbarButton('strike', '<s>S</s>', 'Barrer', () => {
        this.toggleStrikethrough();
      })
    ];
  }
  
  toggleUnderline() {
    this.editor.commands.toggleUnderline();
  }
  
  toggleStrikethrough() {
    this.editor.commands.toggleStrikethrough();
  }
  
  // Méthodes utilitaires réutilisables (déjà présentes dans commands.js)
  // wrapSelection(), unwrapTag(), isWrappedInTag() sont héritées
}
```

#### 2. Enregistrer l'extension dans toolbar.js

```javascript
// Dans la méthode registerExtensions()
registerExtensions() {
  this.extensions = [
    new FormattingExtension(this),
    new LetterSpacingExtension(this),  
    new SpacingExtension(this),
    new UtilsExtension(this),
    new UnderlineExtension(this) // Ajouter ici
  ];
}
```

#### 3. Ajouter les états dans updateButtonStates()

```javascript
// Dans toolbar.js, méthode updateButtonStates()
updateButtonStates() {
  // ... code existant ...
  
  const isUnderline = this.isFormatActive('underline', element);
  const isStrike = this.isFormatActive('strike', element);
  
  // ... autres états ...
  
  this.element.querySelector('[data-command="underline"]')?.classList.toggle('active', isUnderline);
  this.element.querySelector('[data-command="strike"]')?.classList.toggle('active', isStrike);
}

// Étendre la méthode isFormatActive()
isFormatActive(format, element) {
  const tags = {
    bold: ['B', 'STRONG'],
    italic: ['I', 'EM'],
    smallcaps: ['SPAN'],
    superscript: ['SUP'],
    underline: ['U'], // Ajouter
    strike: ['S', 'STRIKE', 'DEL'] // Ajouter
  };
  
  // ... reste du code existant ...
}
```

#### 4. Ajouter règles Markdown (optionnel)

```javascript
// Dans setupTurndown() de toolbar.js
this.turndown.addRule('underline', {
  filter: 'u',
  replacement: function (content) {
    return `<u>${content}</u>`;
  }
});

this.turndown.addRule('strikethrough', {
  filter: ['s', 'strike', 'del'],
  replacement: function (content) {
    return `~~${content}~~`; // ou <s> selon préférence
  }
});
```

#### 5. Gérer le reset (dans SpacingExtension)

```javascript
// Dans resetTransformations() de SpacingExtension
resetTransformations() {
  // ... code existant ...
  
  // Supprimer underline/strike ajoutés par l'éditeur
  const underlineElements = element.querySelectorAll('u.editor-add');
  underlineElements.forEach(el => {
    while (el.firstChild) {
      el.parentNode.insertBefore(el.firstChild, el);
    }
    el.parentNode.removeChild(el);
  });
  
  const strikeElements = element.querySelectorAll('s.editor-add, strike.editor-add, del.editor-add');
  strikeElements.forEach(el => {
    while (el.firstChild) {
      el.parentNode.insertBefore(el.firstChild, el);
    }
    el.parentNode.removeChild(el);
  });
}
```

#### Structure type d'une extension

**Méthodes obligatoires :**
- `constructor(toolbar)` : Initialisation
- `getButtons()` : Retourne array de ToolbarButton

**Méthodes utiles :**
- Actions de formatage (`toggleX()`)
- Utilitaires DOM (`wrapSelection`, `unwrapTag`, `isWrappedInTag`)
- Gestion d'état personnalisée
- Nettoyage pour le reset

### Règles Markdown personnalisées

Le plugin ajoute des règles Turndown pour :
- `<span class="small-caps">` → `<smallcaps>`
- `<sup>` → `<sup>`
- `<span style="--ls:X">` → `<span style="--ls:X">`
- Appels de notes de bas de page
- Suppression des spans d'espaces

### Customisation CSS

Classes principales :
- `.paged-editor-active` : Mode édition actif
- `.paged-editor-content` : Éléments éditables
- `.paged-editor-toolbar` : Barre d'outils
- `.editor-add` : Éléments ajoutés par l'éditeur
- `.letter-spacing-input` : Input de lettrage

Variables CSS personnalisables dans `:root` pour couleurs, espacements, transitions.