# Plugin pageMove

Plugin pour CSSPageWeaver permettant de repositionner des pages avec `--page-move-after` et `--page-move-before`.

## Installation

1. Placer le dossier `pageMove/` dans `/plugins/`
2. Le plugin se charge automatiquement avec CSSPageWeaver
3. Aucune interface utilisateur - fonctionne automatiquement selon les règles définies

## Utilisation

### 1. CSS (méthode recommandée)

```css
/* Déplacer un chapitre après la page 2 */
.conclusion {
    --page-move-after: 2;
}

/* Déplacer un chapitre avant la page 1 */
.intro {
    --page-move-before: 1;
}
```

### 2. HTML (attributs data)

```html
<!-- Déplacer cette section après la page 3 -->
<section class="chapter" data-page-move-after="3">
    <h1>Chapitre à déplacer</h1>
</section>

<!-- Déplacer avant la page 1 -->
<div data-page-move-before="1">Contenu</div>
```

### 3. JavaScript (configuration globale)

```javascript
window.PageMoveConfig = [
    {
        selector: '.appendix',
        direction: 'after',
        targetPage: 5
    },
    {
        selector: '.preface',
        direction: 'before',
        targetPage: 1
    }
];
```

## Exemple complet

```html
<style>
.conclusion { --page-move-after: 2; }
</style>

<section class="intro">Page 1</section>
<section class="chapter1">Page 2</section>
<section class="conclusion">Page 3 → va après page 2</section>
<section class="chapter2">Page 4</section>
```

**Résultat :** intro → chapter1 → conclusion → chapter2

## Structure du plugin

```
pageMove/
├── config.json
├── hook-pageMove.js  
└── pageMove.js
```