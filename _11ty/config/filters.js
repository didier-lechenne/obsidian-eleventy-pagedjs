module.exports = function(eleventyConfig) {

  eleventyConfig.addFilter("slug", function(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  });
  
  eleventyConfig.addFilter("extractTitle", function(content) {
    const match = content.match(/<h2[^>]*>(.+)<\/h2>/);
    return match ? match[1] : 'Sans titre';
  });

  eleventyConfig.addFilter("cleanTitle", function(text) {
    if (!text) return text;
    return text.replace(/^\d+\./, '').trim();
  });


  eleventyConfig.addFilter("toDataAttributes", function(data) {
    const attributes = [];
    
    // Exclure certaines propriétés système
    const excludeKeys = ['page', 'collections', 'pkg', 'eleventy', 'content'];
    
    for (const [key, value] of Object.entries(data)) {
      if (!excludeKeys.includes(key) && value !== undefined && value !== null) {
        // Convertir les valeurs en string et échapper les guillemets
        const stringValue = String(value).replace(/"/g, '&quot;');
        attributes.push(`data-${key}="${stringValue}"`);
      }
    }
    
    return attributes.join(' ');
  });

};