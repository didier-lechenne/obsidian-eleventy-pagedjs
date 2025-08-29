const config = require('./siteData.js');

module.exports = function (eleventyConfig) {
  // Copier les ressources depuis _11ty
  eleventyConfig.addPassthroughCopy({
    [`${config.publicFolder}/images`]: "images",
    [`_11ty/assets/themes/${config.theme}`]: "assets",
    "_11ty/csspageweaver": "csspageweaver",
  });
};