
// === CONFIGURATION DE BASE ===
const yamlPlugin = require("./_11ty/config/yaml.js");
const globalDataPlugin = require("./_11ty/config/globalData.js");
const passthroughCopy = require("./_11ty/config/passthroughCopy.js");

// === TRAITEMENT DU CONTENU ===
const preprocessorConfig = require("./_11ty/config/preprocessor.js");
const shortcodesConfig = require("./_11ty/config/mediaShortcodes.js");
const markdownPlugin = require("./_11ty/config/markdown.js");

// === COLLECTIONS ET FILTRES ===
const collectionsConfig = require("./_11ty/config/collections.js");
const filtersConfig = require("./_11ty/config/filters.js");

// === POST-TRAITEMENT ===
const transformsConfig = require("./_11ty/config/transforms.js");
const afterBuild = require("./_11ty/config/afterBuild.js");

// === CONFIGURATION SITE ===
const config = require("./_11ty/config/siteData.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("fixImagePaths", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Transformer les chemins relatifs en chemins absolus
      content = content.replace(/src="images\//g, 'src="/images/');
      return content;
    }
    return content;
  });

  // === APPLIQUER LES CONFIGURATIONS ===
  // 1. Configuration YAML 
  // 2. Données globales
  // 3. Copie des fichiers statiques
  // 4. Préprocesseurs
  // 5. Shortcodes (avant markdown)
  // 6. Rendu Markdown
  // 7. Collections
  // 8. Filtres
  // 9. Transformations
  // 10. After Build 

  eleventyConfig.addPlugin(yamlPlugin);
  eleventyConfig.addPlugin(globalDataPlugin);
  eleventyConfig.addPlugin(passthroughCopy);
  preprocessorConfig(eleventyConfig);
  shortcodesConfig(eleventyConfig);
  eleventyConfig.addPlugin(markdownPlugin);
  collectionsConfig(eleventyConfig);
  filtersConfig(eleventyConfig);
  transformsConfig(eleventyConfig);
  eleventyConfig.addPlugin(afterBuild);

  // === CONFIGURATION SERVEUR DE DEV ===
  eleventyConfig.setServerOptions({
    port: 3000,
    watch: ["_11ty/**/*", config.publicFolder + "/**/*"],
    showAllHosts: true,
    domDiff: true,
    ignored: ["node_modules/**", ".git/**", "**/.DS_Store", "_site/**/*", "**/*.tmp"],
  });

  // === CONFIGURATION DES DOSSIERS ===
  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    pathPrefix: "",
    dir: {
      input: config.publicFolder,
      output: "_site/",
      includes: "../_11ty/_includes",
      layouts: "../_11ty/_layouts",
      data: "../_11ty/_data",
    },
  };
};
