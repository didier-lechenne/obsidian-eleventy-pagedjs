const fs = require('fs');
const yaml = require('js-yaml'); 

// const { HtmlBasePlugin } = require("@11ty/eleventy");
const collectionsConfig = require("./_11ty/config/collections.js");
const markdownPlugin = require("./_11ty/config/markdown.js");
const preprocessorConfig = require("./_11ty/config/preprocessor.js");
const filtersConfig = require("./_11ty/config/filters.js");
const shortcodesConfig = require("./_11ty/config/mediaShortcodes.js");
const transformsConfig = require("./_11ty/config/transforms.js");
const yamlPlugin = require("./_11ty/config/yaml.js");
const config = require('./_11ty/config/siteData.js');

module.exports = function (eleventyConfig) {
	
  eleventyConfig.addFilter("readYaml", function(filePath) {
    try {
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.warn(`Erreur lecture ${filePath}:`, error.message);
      return {};
    }
  });
  
  // Surveillance du fichier options.yml
  const configYaml = yaml.load(fs.readFileSync('_11ty/_data/config.yml', 'utf8')); // 
  eleventyConfig.addWatchTarget(`./${configYaml.publicFolder}/options.yml`);

  eleventyConfig.addTransform("fixImagePaths", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Transformer les chemins relatifs en chemins absolus
      content = content.replace(
        /src="images\//g, 
        'src="/images/'
      );
      return content;
    }
    return content;
  });

  eleventyConfig.on("afterBuild", () => {
    console.log("✅ Site généré avec succès (avec start) !");
  });

  // Copier les ressources depuis _11ty
  eleventyConfig.addPassthroughCopy({
    [`${config.publicFolder}/images`]: "images",
    [`_11ty/assets/themes/${config.theme}`]: "assets",
    "_11ty/csspageweaver": "csspageweaver"
  });


  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      // Pour z_indexPrint.md
      if (data.page.inputPath.endsWith('z_indexPrint.md')) {
        return data.permalink;
      }
      // Pour z_indexScreen.md  
      if (data.page.inputPath.endsWith('z_indexScreen.md')) {
        return data.permalink;
      }
      // Ignore tous les autres .md
      if (data.page.inputPath.endsWith('.md')) {
        return false;
      }
      return data.permalink;
    }
  });

  // === APPLIQUER LES CONFIGURATIONS ===
  // 1. PREPROCESSORS     (preprocessor.js)
  // 2. SHORTCODES        (mediaShortcodes.js)  
  // 3. RENDU MARKDOWN    (markdown.js)
  // 4. TEMPLATE RENDERING
  // 5. TRANSFORMS        (transforms.js)

  // eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(yamlPlugin);
  preprocessorConfig(eleventyConfig);
  eleventyConfig.addPlugin(markdownPlugin);
  collectionsConfig(eleventyConfig);
  filtersConfig(eleventyConfig);
  shortcodesConfig(eleventyConfig);
  transformsConfig(eleventyConfig);

  // === CONFIGURATION SERVEUR DE DEV ===
  eleventyConfig.setServerOptions({
    port: 3000,
    watch: ["_11ty/**/*", "valentine/**/*"],
    showAllHosts: true,
    domDiff: true,
    ignored: [
      "node_modules/**", 
      ".git/**",
      "**/.DS_Store"
    ]
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