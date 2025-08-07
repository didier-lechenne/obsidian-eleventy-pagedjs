# Guide de développement - Éditeur PagedJS

Ce guide explique comment ajouter vos propres boutons et menus à la barre d'outils de l'éditeur, même si vous n'êtes pas un développeur expert.

## 🎯 Principe de base

L'éditeur fonctionne comme un système modulaire : vous décrivez ce que vous voulez (une action), puis le système crée automatiquement l'interface correspondante.

**Analogie simple :** C'est comme commander dans un restaurant. Vous choisissez dans le menu (registre des actions), et la cuisine (factory) prépare automatiquement votre plat (interface).

## 📝 Étape 1 : Créer une nouvelle action

### Pour un bouton simple (insertion de texte)

Ouvrez le fichier `actions.js` et ajoutez votre action dans `ACTIONS_REGISTRY` :

```javascript
'mon-bouton': {
  type: 'insert',                    // Type d'action : insertion simple
  icon: '©',                         // Ce qui s'affiche dans le bouton
  title: 'Insérer symbole copyright', // Texte qui apparaît au survol
  execute: (editor) => {             // Ce qui se passe quand on clique
    editor.commands.insertText('©'); // Insère le symbole copyright
  }
}
```

### Pour un bouton qui active/désactive un formatage

```javascript
'souligne': {
  type: 'toggle',                    // Type d'action : on/off
  icon: '<u>U</u>',                  // Bouton avec U souligné
  title: 'Souligner le texte',
  execute: (editor) => {
    // Ici il faut d'abord ajouter la méthode dans commands.js (voir étape 2)
    editor.commands.toggleUnderline();
  },
  isActive: (element) => {           // Comment savoir si le formatage est actif
    return element.closest('u') !== null; // Vérifie si on est dans une balise <u>
  }
}
```

### Pour un menu déroulant avec plusieurs choix

```javascript
'symboles-maths': {
  type: 'select',                    // Type d'action : menu déroulant
  icon: '∑ ⌄',                       // Icône avec flèche vers le bas
  title: 'Symboles mathématiques',
  options: [                         // Liste des choix disponibles
    { value: 'sum', label: '∑ - Somme', char: '∑' },
    { value: 'integral', label: '∫ - Intégrale', char: '∫' },
    { value: 'infinity', label: '∞ - Infini', char: '∞' },
    { value: 'pi', label: 'π - Pi', char: 'π' }
  ],
  execute: (editor, value) => {      // Reçoit la valeur choisie
    const option = ACTIONS_REGISTRY['symboles-maths'].options.find(opt => opt.value === value);
    if (option?.char) {
      editor.commands.insertText(option.char);
    }
  }
}
```

## ⚙️ Étape 2 : Ajouter des commandes complexes (si nécessaire)

Si votre bouton fait plus qu'insérer du texte, ajoutez la logique dans `commands.js`.

**Exemple pour le soulignement :**

```javascript
// Dans la classe Commands, ajoutez cette méthode :
toggleUnderline() {
  const selection = this.editor.selection.getCurrentSelection();
  if (!selection || !selection.isValid) return; // Vérifier qu'il y a une sélection
  
  const range = selection.range;
  
  // Si déjà souligné, enlever le soulignement
  if (this.isWrappedInTag(range, ['U'])) {
    this.unwrapTag(range, ['U']);
  } else {
    // Sinon, ajouter le soulignement
    this.wrapSelection(range, 'u');
  }
  
  this.triggerAutoCopy(); // Copie automatique du résultat
}
```

**Explication des méthodes utiles :**

- `this.wrapSelection(range, 'u')` : Entoure la sélection d'une balise `<u>`
- `this.unwrapTag(range, ['U'])` : Supprime les balises `<u>` autour de la sélection
- `this.isWrappedInTag(range, ['U'])` : Vérifie si la sélection est dans une balise `<u>`
- `this.insertText('texte')` : Insère du texte à la position du curseur

## 📋 Étape 3 : Ajouter à la barre d'outils

Ouvrez `toolbar-config.js` et ajoutez l'identifiant de votre action :

```javascript
export const TOOLBAR_CONFIG = {
  elements: [
    'smallcaps',
    'superscript', 
    'mon-bouton',        // ← Votre nouveau bouton
    'souligne',          // ← Votre bouton toggle
    'symboles-maths',    // ← Votre menu déroulant
    'letter-spacing',
    'nbsp',
    // ... autres boutons existants
  ]
}
```

**Important :** L'ordre dans cette liste détermine l'ordre d'affichage dans la barre d'outils.

## 🎨 Étape 4 : Personnaliser l'apparence (optionnel)

Pour personnaliser l'apparence de votre bouton, ajoutez des règles CSS dans `editor.css` :

```css
/* Style spécifique pour votre bouton */
.paged-editor-toolbar button[data-command="mon-bouton"] {
  background-color: #ff6b6b;
  border-radius: 50%;
}

/* Style quand le bouton est actif (pour les boutons toggle) */
.paged-editor-toolbar button[data-command="souligne"].active {
  background: #4ecdc4;
}
```

## 🔧 Types d'actions disponibles

### Type 'insert'
Pour insérer du texte, des caractères spéciaux, des éléments simples. Le bouton ne change pas d'état.

### Type 'toggle'
Pour des formatages qui s'activent/désactivent (gras, italique, souligné...). Le bouton change d'apparence selon l'état.

### Type 'select'
Pour des menus déroulants avec plusieurs choix. Idéal pour des listes d'options.

### Type 'utility'
Pour des actions complexes (copie, export, reset...). Actions qui ne modifient pas directement le texte.

## 🚀 Exemple complet : Bouton pour insérer la date

```javascript
// Dans actions.js
'date-aujourdhui': {
  type: 'insert',
  icon: '📅',
  title: 'Insérer la date d\'aujourd\'hui',
  execute: (editor) => {
    const aujourd_hui = new Date();
    const date_formatee = aujourd_hui.toLocaleDateString('fr-FR');
    editor.commands.insertText(date_formatee);
  }
}
```

```javascript
// Dans toolbar-config.js
export const TOOLBAR_CONFIG = {
  elements: [
    'smallcaps',
    'superscript',
    'date-aujourdhui', // ← Nouveau bouton date
    'letter-spacing',
    // ... reste des boutons
  ]
}
```

## 🐛 Résolution de problèmes courants

**Mon bouton n'apparaît pas :**
- Vérifiez que l'identifiant dans `actions.js` correspond exactement à celui dans `toolbar-config.js`
- Regardez la console du navigateur pour des erreurs

**Mon bouton ne fait rien :**
- Vérifiez que la fonction `execute` est bien définie
- Si vous utilisez une méthode de `commands.js`, assurez-vous qu'elle existe

**Erreur "Action inconnue" :**
- L'identifiant dans `toolbar-config.js` ne correspond pas à celui dans `actions.js`

## 💡 Conseils pour aller plus loin

Pour des actions plus complexes, étudiez les exemples existants dans `actions.js` comme `letter-spacing` ou `quotes-fr`. Ils montrent des techniques avancées comme la création d'interfaces utilisateur temporaires ou la gestion d'états complexes.

N'hésitez pas à copier et adapter le code existant plutôt que de repartir de zéro. C'est une pratique normale en développement !