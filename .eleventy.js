const collectionsConfig = require("./_11ty/config/collections.js");
const markdownPlugin = require("./_11ty/config/markdown.js");
const imagePlugin = require("./_11ty/config/image.js");
const filtersConfig = require("./_11ty/config/filters.js");
const shortcodesConfig = require("./_11ty/config/shortcodes.js");
const transformsConfig = require("./_11ty/config/transforms.js");
const passthroughConfig = require("./_11ty/config/passthrough.js");
const yamlPlugin = require("./_11ty/config/yaml.js");

const config = require("./_11ty/config/siteData.js");

module.exports = function (eleventyConfig) {


  // Copier les assets depuis _11ty
  eleventyConfig.addPassthroughCopy({
     [`${config.publicFolder}/images`]: "images"  ,
    "_11ty/assets": "assets",
    "_11ty/assets/modes": "assets/modes",
    "_11ty/csspageweaver": "csspageweaver"
  });

 
  eleventyConfig.on("afterBuild", () => {
    console.log("✅ Site screen généré avec succès !");
  });

  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {

    if (data.siteMode === "screen") {
      return data.permalink;
    }
      if (data.page.inputPath.endsWith(".md")) {
        return false;
      }
      return data.permalink;
    },
  });

  // === APPLIQUER LES CONFIGURATIONS ===

  eleventyConfig.addPlugin(yamlPlugin);
  eleventyConfig.addPlugin(markdownPlugin);
  eleventyConfig.addPlugin(imagePlugin);

  collectionsConfig(eleventyConfig);
  filtersConfig(eleventyConfig);
  shortcodesConfig(eleventyConfig);
  transformsConfig(eleventyConfig);
  passthroughConfig(eleventyConfig);

  // === CONFIGURATION SERVEUR DE DEV ===
  eleventyConfig.setServerOptions({
    port: 3000,
    showAllHosts: true,
    domDiff: true,
    ignored: ["node_modules/**", ".git/**", "**/.DS_Store"],
  });

  // === CONFIGURATION DES DOSSIERS ===
  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    pathPrefix: "",
    dir: {
      input: config.publicFolder,
      output: "_site",
      includes: "../_11ty/_includes",
      layouts: "../_11ty/_layouts",
      data: "../_11ty/_data",
    },
  };
};
