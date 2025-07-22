const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync('./_11ty/_data/config.yml', 'utf8'));


module.exports = function(eleventyConfig) {
  

  
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


eleventyConfig.addShortcode("imgfullPage", function (src, alt, className = "", style = "", caption = "") {
  let attributes = `src="${src}" alt="${alt}" `;
  
  if (className) {
    attributes += ` class="${className}"`;
  }
  
  if (style) {
    attributes += ` style="${style}"`;
  }
  
  attributes += ' loading="lazy"';
  
  const img = `<img ${attributes}>`;
  const figcaption = caption ? `<figcaption>${caption}</figcaption>` : '';
  
  return `<figure>${img}${figcaption}</figure>`;
});


  eleventyConfig.addNunjucksShortcode("imgfullPage", function (src, fullPage) {
    if (!src) {
      return '<p>Erreur: src manquant</p>';
    }
  
    const figureClass = fullPage ? `full-page ${fullPage}` : "";
    
    return `<figure id="figure" class="${figureClass}">
      <img src="${src}">
    </figure>`;
  });





};