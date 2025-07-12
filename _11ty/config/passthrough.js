const config = require('./siteData.js');


module.exports = function(eleventyConfig) {
  

  // Copier les fichiers du contenu (PDFs, etc.)
  eleventyConfig.addPassthroughCopy({
    "content/files": "files"
  });

  // Fichiers spéciaux à la racine
  // eleventyConfig.addPassthroughCopy({
  //   "_11ty/assets/favicon.ico": "favicon.ico"
  // });


};