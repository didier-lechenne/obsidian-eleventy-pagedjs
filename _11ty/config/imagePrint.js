const EleventyImage = require("@11ty/eleventy-img");
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const config = require('siteData.js');;



module.exports = function(eleventyConfig) {

  // Shortcode SANS transformation
  eleventyConfig.addShortcode("image", function (src, alt, className = "", style = "") {
    // Gérer les chemins relatifs "../images/"
    let finalSrc;
    finalSrc = src;

    // Construire les attributs avec data-no-transform pour exclure du plugin
    let attributes = `src="${finalSrc}" alt="${alt}" data-no-transform="true"`;
    
    if (className) {
      attributes += ` class="${className}"`;
    }
    
    if (style) {
      attributes += ` style="${style}"`;
    }
    
    attributes += ' loading="lazy"';
    
    return `<img ${attributes}>`;
  });

  eleventyConfig.addShortcode("rawimage", function (src, alt, className = "", style = "") {
  // Génère une <img> simple qui ne sera pas transformée
  let finalSrc
  finalSrc = src;
  return `<img src="${finalSrc}" alt="${alt}" class="${className}" style="${style}" >`;
});


    // no more used in gridlists
    eleventyConfig.addShortcode("icon", function (name) {
        return `<svg><use xlink:href="#svg-${name}"></use></svg>`;
    });

    // used in markdown files
    eleventyConfig.addNunjucksAsyncShortcode("inlineSvg", async url => {
    let options = {
      widths: [300],
      formats: ["svg"],
      svgShortCircuit: true
    };
    let stats = await Image(url, options);
    const svgUrl = stats.svg[0].url;

    const data = fs.readFileSync(`./${svgUrl}`, function(err, contents) {
      if (err) return err;
      return contents;
    });

    return `<figure class="svg">${ data.toString("utf8") }</figure>`;
  });
}