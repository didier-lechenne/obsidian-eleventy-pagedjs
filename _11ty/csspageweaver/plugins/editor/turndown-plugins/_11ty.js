// Règle Turndown pour convertir les figures HTML en shortcode {% image %}
turndownService.addRule('eleventyImage', {
  filter: function(node) {
    return node.nodeName === 'FIGURE' && 
           node.getAttribute('data-grid') === 'image' &&
           node.querySelector('img');
  },

  replacement: function(content, node) {
    const img = node.querySelector('img');
    const figcaption = node.querySelector('figcaption');
    
    if (!img) return '';
    
    const src = img.getAttribute('src');
    if (!src) return '';
    
    // Nettoyer le src pour enlever les chemins relatifs si nécessaire
    const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');
    
    // Construire les options du shortcode
    let options = '';
    
    if (figcaption) {
      const captionText = figcaption.textContent || figcaption.innerText;
      if (captionText.trim()) {
        // Échapper les guillemets dans le caption
        const escapedCaption = captionText.replace(/"/g, '\\"');
        options = `{ \n  caption: "${escapedCaption}"\n}`;
      }
    }
    
    // Construire le shortcode
    if (options) {
      return `{% image "${cleanSrc}", ${options} %}`;
    } else {
      return `{% image "${cleanSrc}" %}`;
    }
  }
});