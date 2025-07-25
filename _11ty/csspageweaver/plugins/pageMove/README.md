# Plugin pageMove

Plugin pour CSSPageWeaver permettant de repositionner des pages avec `--page-move-after` et `--page-move-before`.


## Utilisation

### 1. CSS 

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

### 3. HTML (styles inline)

```html
<!-- Déplacer avec style inline -->
<section style="--page-move-after: 2;" class="chapter">
    <h1>Chapitre à déplacer</h1>
</section>

```
