const collectionsConfig = require("./_11ty/config/collections.js");
const markdownPlugin = require("./_11ty/config/markdown.js");
const filtersConfig = require("./_11ty/config/filters.js");
const shortcodesConfig = require("./_11ty/config/shortcodes.js");
const transformsConfig = require("./_11ty/config/transforms.js");
const passthroughConfig = require("./_11ty/config/passthrough.js");
const yamlPlugin = require("./_11ty/config/yaml.js");

const config = require('./_11ty/config/siteData.js');


module.exports = function (eleventyConfig) {


  eleventyConfig.addTransform("fixImagePaths", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Transformer les chemins relatifs en chemins absolus
      content = content.replace(
        /src="images\//g, 
        'src="../images/'
      );
      return content;
    }
    return content;
  });


  eleventyConfig.on("afterBuild", () => {
    console.log("✅ Site print généré avec succès !");
  });



eleventyConfig.addGlobalData("eleventyComputed", {
  permalink: (data) => {
    
    if (data.siteMode === "print") {
      return "/";
    }
    
    if (data.page.inputPath.endsWith('.md')) {
      return false;
    }
    return data.permalink;
  }
});



  // === APPLIQUER LES CONFIGURATIONS ===

  eleventyConfig.addPlugin(yamlPlugin);
  eleventyConfig.addPlugin(markdownPlugin);

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
      output: "_site/print",
      includes: "../_11ty/_includes",
      layouts: "../_11ty/_layouts",
      data: "../_11ty/_data",
    },
  };
};
