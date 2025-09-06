const config = require("./_11ty/config/siteData.js");

module.exports = function (eleventyConfig) {
  const env = process.env.ELEVENTY_ENV; // "print" ou "screen"
  const buildType = process.env.ELEVENTY_BUILD; // "built"

  console.log(`🚀 Mode: ${env}, Build: ${buildType}`);

  // === CONFIGURATION SELON LE MODE ===
  
  // 1. DOSSIER DE SORTIE DIFFÉRENT
  const outputDir = env === "print" ? "print" : "/";
  

  return {
    dir: {
      input: config.publicFolder,
      output: outputDir, 
      includes: "../_11ty/_includes",
      layouts: "../_11ty/_layouts",
      data: "../_11ty/_data",
    },
  };
};