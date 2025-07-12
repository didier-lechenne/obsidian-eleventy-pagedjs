const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync('./_11ty/_data/config.yml', 'utf8'));


module.exports = function(eleventyConfig) {
  
  // Shortcode pour inclure des fichiers
  eleventyConfig.addShortcode("include", function(filename) {
    // Adapter le chemin pour la nouvelle structure
    const includePath = path.join('./_11ty/includes', filename);
    try {
      return fs.readFileSync(includePath, 'utf8');
    } catch (e) {
      console.error(`Erreur inclusion ${filename}:`, e.message);
      return `[Erreur: fichier ${filename} non trouvé]`;
    }
  });
  
  // Shortcode pour les liens internes (amélioré)
  eleventyConfig.addShortcode("link", function(page, text = null) {
    const slug = page.toLowerCase().replace(/\s+/g, '-');
    const displayText = text || page;
    return `<a href="/${slug}/" class="internal-link">${displayText}</a>`;
  });




  // Shortcode pour les citations
  eleventyConfig.addShortcode("quote", function(text, author = null) {
    const authorHtml = author ? `<cite>— ${author}</cite>` : '';
    return `<blockquote class="custom-quote"><p>${text}</p>${authorHtml}</blockquote>`;
  });
};