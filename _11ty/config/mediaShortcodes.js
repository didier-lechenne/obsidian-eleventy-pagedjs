const fs = require("fs");
const markdownIt = require("markdown-it");
const md = markdownIt({
  html: true,
  breaks: true,
  linkify: false,
  typographer: true,
});

module.exports = function (eleventyConfig) {
  let globalImageCounter = 0;
  let globalFigureCounter = 0;
  let globalFigureGridCounter = 0;
  let globalFullpageCounter = 0;
  let globalElementCounter = 0;

  // Cache pour les configurations d'images
  let imageConfigs = {};
  let configHasChanged = false;



  function getImageConfig(imageId, overrides = {}) {
    const baseConfig = imageConfigs[imageId] || {};
    return { ...baseConfig, ...overrides };
  }

  function generateStyles(config) {
    const cssVarMapping = {
      col: "--col",
      printCol: "--print-col",
      width: "--width",
      printWidth: "--print-width",
      printRow: "--print-row",
      printHeight: "--print-height",
      alignSelf: "--align-self",
      alignself: "--align-self", // Support des deux formats
      imgX: "--img-x",
      imgY: "--img-y",
      imgW: "--img-w",
      page: "--pagedjs-full-page"
    };

    let styles = "";
    Object.entries(config).forEach(([key, value]) => {
      if (cssVarMapping[key] && value !== undefined) {
        styles += `${cssVarMapping[key]}: ${value}; `;
      }
    });
    return styles ? ` style="${styles}"` : "";
  }

function generateHTML(type, config) {
  const styleAttr = generateStyles(config);
  const classAttr = config.class ? ` ${config.class}` : "";
  const captionHTML = config.caption ? md.renderInline(config.caption) : "";
  const id = config.id;
  let cleanAlt = "";
  if (config.caption) {
    cleanAlt = config.caption
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[^;]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Incrémenter le compteur pour tous les types qui en ont besoin
  
  if (['image', 'imagegrid', 'fullpage', 'figure'].includes(type)) {
    globalElementCounter++;
  }

  switch (type) {
    case "image":
      return `<figure data-id="${id}" id="image-${globalElementCounter}" class="${globalElementCounter} figure image${classAttr}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}" >
        ${captionHTML ? `<figcaption class="figcaption">${captionHTML}</figcaption>` : ""}
      </figure>`;

    case "imagegrid":
      let output = `<figure data-id="${id}" class="${globalElementCounter} resize${classAttr}" id="figure-${globalElementCounter}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}" >
      </figure>`;
      if (captionHTML) {
        output += `<figcaption class="figcaption figcaption-${globalElementCounter}">${captionHTML}</figcaption>`;
      }
      return output;

    case "fullpage":
      return `<figure data-id="${id}" id="figure-${globalElementCounter}" class="${globalElementCounter} full-page ${classAttr}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}">
      </figure>`;

    case "figure":
      return `<span class="spanMove figure_call" id="fig-${globalElementCounter}-call">
        [<a href="#fig-${globalElementCounter}">fig. ${globalElementCounter}</a>]
      </span>
      <span class="figure figmove${classAttr}" id="fig-${globalElementCounter}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}" >
        ${captionHTML ? `<span class="figcaption"><span class="figure_reference">[fig. ${globalElementCounter}]</span> ${captionHTML}</span>` : ""}
      </span>`;

    case "imagenote":
      return `<span class="imagenote sideNote${classAttr}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}" >
        ${captionHTML ? `<span class="caption">${captionHTML}</span>` : ""}
      </span>`;

    case "video":
      const posterAttr = config.poster ? ` poster="${config.poster}"` : "";
      return `<figure class="video${classAttr}"${styleAttr}>
        <video controls${posterAttr}>
          <source src="${config.src}">
        </video>
        ${captionHTML ? `<figcaption class="figcaption">${captionHTML}</figcaption>` : ""}
      </figure>`;

    default:
      return `<!-- Type ${type} non supporté -->`;
  }
}

  eleventyConfig.on("eleventy.before", () => {
    globalFigureCounter = 0;
    globalFigureGridCounter = 0;
    globalImageCounter = 0;
    globalElementCounter = 0;

    try {
      imageConfigs = JSON.parse(
        fs.readFileSync("_11ty/_data/images.json", "utf8")
      );
      console.log(
        `✅ ${Object.keys(imageConfigs).length} configs d'images chargées`
      );
    } catch (e) {
      imageConfigs = {};
      console.log("📝 Nouveau fichier images.json sera créé");
    }
    configHasChanged = false;
  });

  eleventyConfig.on("eleventy.after", () => {
    if (configHasChanged) {
      fs.writeFileSync(
        "_11ty/_data/images.json",
        JSON.stringify(imageConfigs, null, 2)
      );
      console.log(`💾 ${Object.keys(imageConfigs).length} configs sauvées`);
    }
  });

  eleventyConfig.addShortcode("image", function (firstParam, options = {}) {
    let config, imageId;

    // DÉTECTION DU FORMAT D'APPEL
    if (
      typeof firstParam === "string" &&
      !firstParam.includes("/") &&
      !firstParam.includes(".")
    ) {
      // FORMAT 1: {% image "intro-domestique" %}
      imageId = firstParam;
      config = getImageConfig(imageId, options);

      if (!config.src) {
        return `<!-- ERROR: Image "${imageId}" non trouvée dans JSON -->`;
      }
    } else {
      // FORMAT 2: {% image "images/photo.jpg", { id: "intro-domestique", printCol: 1 } %}
      imageId = options.id;
      const existingConfig = imageConfigs[imageId] || {};

      config = {
        ...existingConfig, // Config JSON existante
        ...options, // Nouvelles valeurs
        src: firstParam, // Force le nouveau src
      };

      // SAUVEGARDE DANS LE JSON
      if (
        imageId &&
        JSON.stringify(existingConfig) !== JSON.stringify(config)
      ) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML("image", config);
  });

  eleventyConfig.addShortcode("imagegrid", function (firstParam, options = {}) {
    let config, imageId;

    if (
      typeof firstParam === "string" &&
      !firstParam.includes("/") &&
      !firstParam.includes(".")
    ) {
      imageId = firstParam;
      config = getImageConfig(imageId, options);

      if (!config.src) {
        return `<!-- ERROR: Image "${imageId}" non trouvée dans JSON -->`;
      }
    } else {
      imageId = options.id;
      const existingConfig = imageConfigs[imageId] || {};

      config = {
        ...existingConfig,
        ...options,
        src: firstParam,
      };

      if (
        imageId &&
        JSON.stringify(existingConfig) !== JSON.stringify(config)
      ) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML("imagegrid", config);
  });

  eleventyConfig.addShortcode("video", function (firstParam, options = {}) {
    let config, imageId;

    if (
      typeof firstParam === "string" &&
      !firstParam.includes("/") &&
      !firstParam.includes(".")
    ) {
      imageId = firstParam;
      config = getImageConfig(imageId, options);

      if (!config.src) {
        return `<!-- ERROR: Video "${imageId}" non trouvée dans JSON -->`;
      }
    } else {
      imageId = options.id;
      const existingConfig = imageConfigs[imageId] || {};

      config = {
        ...existingConfig,
        ...options,
        src: firstParam,
      };

      if (
        imageId &&
        JSON.stringify(existingConfig) !== JSON.stringify(config)
      ) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML("video", config);
  });

  eleventyConfig.addShortcode("figure", function (firstParam, options = {}) {
    let config, imageId;

    if (
      typeof firstParam === "string" &&
      !firstParam.includes("/") &&
      !firstParam.includes(".")
    ) {
      imageId = firstParam;
      config = getImageConfig(imageId, options);

      if (!config.src) {
        return `<!-- ERROR: Figure "${imageId}" non trouvée dans JSON -->`;
      }
    } else {
      imageId = options.id;
      const existingConfig = imageConfigs[imageId] || {};

      config = {
        ...existingConfig,
        ...options,
        src: firstParam,
      };

      if (
        imageId &&
        JSON.stringify(existingConfig) !== JSON.stringify(config)
      ) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML("figure", config);
  });

  eleventyConfig.addShortcode("imagenote", function (firstParam, options = {}) {
    let config, imageId;

    if (
      typeof firstParam === "string" &&
      !firstParam.includes("/") &&
      !firstParam.includes(".")
    ) {
      imageId = firstParam;
      config = getImageConfig(imageId, options);

      if (!config.src) {
        return `<!-- ERROR: ImageNote "${imageId}" non trouvée dans JSON -->`;
      }
    } else {
      imageId = options.id;
      const existingConfig = imageConfigs[imageId] || {};

      config = {
        ...existingConfig,
        ...options,
        src: firstParam,
      };

      if (
        imageId &&
        JSON.stringify(existingConfig) !== JSON.stringify(config)
      ) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML("imagenote", config);
  });

  eleventyConfig.addShortcode("fullpage", function (firstParam, options = {}) {
    let config, itemId;

    // Format 1: {% monShortcode "mon-id" %}
    if (
      typeof firstParam === "string" &&
      !firstParam.includes("/") &&
      !firstParam.includes(".")
    ) {
      itemId = firstParam;
      config = getImageConfig(itemId, options);

      if (!config.src) {
        return `<!-- ERROR: Item "${itemId}" non trouvé dans JSON -->`;
      }
    } else {
      // Format 2: {% monShortcode "chemin/fichier.ext", { id: "mon-id", propriete: "valeur" } %}
      itemId = options.id;
      const existingConfig = imageConfigs[itemId] || {};

      config = {
        ...existingConfig,
        ...options,
        src: firstParam,
      };

      // Sauvegarde dans le JSON si l'ID existe et a changé
      if (itemId && JSON.stringify(existingConfig) !== JSON.stringify(config)) {
        imageConfigs[itemId] = { ...config };
        configHasChanged = true;
      }
    }

    // Générer le HTML personnalisé
    return generateHTML("fullpage", config);
  });
};
