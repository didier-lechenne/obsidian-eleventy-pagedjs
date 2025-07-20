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