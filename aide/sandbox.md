## **Ordre d'exécution Eleventy :**

1. **Preprocessors** → s'appliquent **AVANT** le rendu Markdown
2. **Rendu Markdown** → transforme le Markdown en HTML
3. **Filters** → s'appliquent **PENDANT** le rendu des templates
4. **Transforms** → s'appliquent **APRÈS** le rendu HTML final
<span style="--ls:16"> </span>
## **ORDRE D'EXÉCUTION ELEVENTY (corrigé) :**

1. **PREPROCESSORS** : `notes`, `smallcaps`, `break`, `imgfull`
    - `(notes: "texte")` → `^[texte]`
    - `<smallcaps>texte</smallcaps>` → `<span class="small-caps">texte</span>`
2. **RENDU MARKDOWN** : Markdown → HTML
    - `^[texte]` → `<a href="#fn1">1</a>` + footnotes
3. **TEMPLATE** : Rendu des templates (Liquid/Nunjucks)
    - `{{ content }}` (contient le HTML du markdown)
    - `{{ content | filter }}` (si filters appliqués)
4. **FILTERS** : ⚠️ **ATTENTION - Seulement sur HTML déjà rendu**
    - ❌ `{{ content | notes }}` → IMPOSSIBLE (notes déjà traitées)
    - ❌ `{{ content | smallcaps }}` → IMPOSSIBLE (smallcaps déjà traitées)
    - ✅ Filters uniquement pour post-traitement HTML
5. **TRANSFORMS** : Post-traitement du HTML final
    - `invisibleSpaces`, `addClasses`, `uniqueFootnotes`

## **Conclusion :**

**Votre architecture actuelle est parfaite :**

- ✅ **Preprocessors** : `notes`, `smallcaps`, `break`, `imgfull`
- ✅ **Transforms** : `invisibleSpaces`, `addClasses`, `uniqueFootnotes`

```js
// Parser YAML-like dans les paramètres
function parseIncludeParams(info) {
  const lines = info.replace(/^include\s+/, '').split('\n');
  const params = {};
  
  if (lines[0]) {
    params.file = lines[0].trim();
  }
  
  // Parser les lignes suivantes comme YAML
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && line.includes(':')) {
      const [key, ...values] = line.split(':');
      params[key.trim()] = values.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }
  
  return params;
}
```

```
::: include fichier.md
class: "highlight special"
style: "background: #f0f0f0; padding: 1rem;"
id: "included-content"
:::
```


avec eleventy

```js
// .eleventy.js
const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // Shortcode pour inclure des fichiers
  eleventyConfig.addShortcode("include", function(file, options = {}) {
    try {
      const filePath = path.resolve('.', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Construire les attributs
      let attributes = `class="include ${options.class || ''}"`.trim();
      if (options.style) attributes += ` style="${options.style}"`;
      if (options.id) attributes += ` id="${options.id}"`;
      
      // Rendre le markdown si nécessaire
      const renderedContent = file.endsWith('.md') 
        ? eleventyConfig.getFilter("markdownify")(content)
        : content;
        
      return `<div ${attributes}>${renderedContent}</div>`;
    } catch (error) {
      return `<div class="include error">❌ Erreur: ${error.message}</div>`;
    }
  });
};
```

```
<!-- Basique -->
{% include "fichier.md" %}

<!-- Avec paramètres -->
{% include "fichier.md", { class: "highlight special", style: "background: #f0f0f0;", id: "intro" } %}
```