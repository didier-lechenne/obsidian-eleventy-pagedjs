export function _11tyPlugin(turndownService) {
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
    const optionsObj = {};
    
    // Récupérer l'ID depuis la figure ou l'image
    const id = node.id || node.getAttribute('id') || img.id || img.getAttribute('id');
    if (id) {
      optionsObj.id = id;
    }
    
    // Récupérer le caption
    if (figcaption) {
      const captionText = figcaption.textContent || figcaption.innerText;
      if (captionText.trim()) {
        // Échapper les guillemets dans le caption
        const escapedCaption = captionText.replace(/"/g, '\\"');
        optionsObj.caption = escapedCaption;
      }
    }
    
    // Construire le string des options
    let optionsStr = '';
    if (Object.keys(optionsObj).length > 0) {
      const optionsParts = [];
      
      if (optionsObj.id) {
        optionsParts.push(`  id: "${optionsObj.id}"`);
      }
      
      if (optionsObj.caption) {
        optionsParts.push(`  caption: "${optionsObj.caption}"`);
      }
      
      optionsStr = `{ \n${optionsParts.join(',\n')}\n}`;
    }
    
    // Construire le shortcode
    if (optionsStr) {
      return `{% image "${cleanSrc}", ${optionsStr} %}\n\n`;
    } else {
      return `{% image "${cleanSrc}" %}\n\n`;
    }
  }
});


// Règle Turndown pour convertir les figures full-page en shortcode {% fullpage %}
turndownService.addRule('eleventyFullpage', {
  filter: function(node) {
    return node.nodeName === 'FIGURE' && 
           node.getAttribute('data-grid') === 'image' &&
           node.classList.contains('full-page') &&
           node.querySelector('img');
  },

  replacement: function(content, node) {
    const img = node.querySelector('img');
    
    if (!img) return '';
    
    const src = img.getAttribute('src');
    if (!src) return '';
    
    // Nettoyer le src pour enlever les chemins relatifs si nécessaire
    const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');
    
    // Construire les options du shortcode
    const optionsObj = {};
    
    // Récupérer l'ID depuis data-id (priorité) puis id
    const dataId = node.getAttribute('data-id');
    const id = dataId || node.id || node.getAttribute('id');
    if (id) {
      optionsObj.id = id;
    }
    
    // Récupérer les classes ORIGINALES (filtrer les classes générées par le système)
    const classList = Array.from(node.classList).filter(cls => 
      cls !== 'full-page' && // Exclure full-page (implicite dans fullpage)
      !cls.startsWith('pagedjs_') && // Exclure toutes les classes pagedjs_*
      !cls.includes('pagedjs') // Exclure autres classes système
    );
    if (classList.length > 0) {
      optionsObj.class = classList.join(' ');
    }
    
    // Détecter la page UNIQUEMENT via le style --pagedjs-full-page
    const style = node.getAttribute('style');
    if (style) {
      const fullPageMatch = style.match(/--pagedjs-full-page:\s*(\d+)/);
      if (fullPageMatch) {
        optionsObj.page = parseInt(fullPageMatch[1]);
      }
    }
    
    // Construire le string des options
    let optionsStr = '';
    if (Object.keys(optionsObj).length > 0) {
      const optionsParts = [];
      
      if (optionsObj.id) {
        optionsParts.push(`  id: "${optionsObj.id}"`);
      }
      
      if (optionsObj.class) {
        optionsParts.push(`  class: "${optionsObj.class}"`);
      }
      
      if (optionsObj.page) {
        optionsParts.push(`  page: ${optionsObj.page}`);
      }
      
      optionsStr = `{ \n${optionsParts.join(',\n')}\n}`;
    }
    
    // Construire le shortcode
    if (optionsStr) {
      return `{% fullpage "${cleanSrc}", ${optionsStr} %}`;
    } else {
      return `{% fullpage "${cleanSrc}" %}`;
    }
  }
});


}