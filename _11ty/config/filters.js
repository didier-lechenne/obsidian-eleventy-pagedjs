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

eleventyConfig.addFilter("toStyleAttributes", function(data) {
  const styles = [];
  
  // Exclure les propriétés système et les objets complexes
  const excludeKeys = [
    'page', 'collections', 'pkg', 'eleventy', 'content', 
    'date', 'tags', 'layout', 'permalink', 'config', 
    'eleventyComputed', 'templateEngineOverride'
  ];
  
  for (const [key, value] of Object.entries(data)) {
    if (!excludeKeys.includes(key) && 
        value !== undefined && 
        value !== null && 
        typeof value !== 'object') { // Exclure tous les objets
      
      const cssVar = key.startsWith('--') ? key : `--${key}`;
      styles.push(`${cssVar}:${value}`);
    }
  }
  
  return styles.length > 0 ? styles.join('; ') : '';
});


eleventyConfig.addFilter("toDataAttributes", function(data) {
  const attributes = [];
  
  // Exclure les propriétés système et les objets complexes
  const excludeKeys = [
    'page', 'collections', 'pkg', 'eleventy', 'content',
    'config', 'eleventyComputed', 'templateEngineOverride', 'permalink'
  ];
  
  for (const [key, value] of Object.entries(data)) {
    if (!excludeKeys.includes(key) && 
        value !== undefined && 
        value !== null && 
        typeof value !== 'object') { // Exclure tous les objets
      
      // Convertir en string et échapper proprement pour HTML
      let stringValue = String(value);
      
      // Échapper les caractères HTML dangereux
      stringValue = stringValue
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      attributes.push(`data-${key}="${stringValue}"`);
    }
  }
  
  return attributes.join(' ');
});

};