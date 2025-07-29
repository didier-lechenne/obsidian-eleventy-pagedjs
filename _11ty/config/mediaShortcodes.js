const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Charger la config
const config = yaml.load(fs.readFileSync('./_11ty/_data/config.yml', 'utf8'));

const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const md = markdownIt({
  html: true,
  breaks: true,
  linkify: false,
  typographer: true,
});

md.use(markdownItFootnote)

// OPTION : Désactiver la sauvegarde JSON
const ENABLE_JSON_SAVE = false; // Passer à true pour réactiver

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
      alignself: "--align-self", 
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
      return `<figure data-id="${id}" id="image-${globalElementCounter}" class=" figure image${classAttr}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}" >
        ${captionHTML ? `<figcaption class="figcaption">${captionHTML}</figcaption>` : ""}
      </figure>`;

    case "imagegrid":
      let output = `<figure data-id="${id}" class=" resize${classAttr}" id="figure-${globalElementCounter}"${styleAttr}>
        <img src="${config.src}" alt="${cleanAlt}" >
      </figure>`;
      if (captionHTML) {
        output += `<figcaption class="figcaption figcaption-${globalElementCounter}" ${styleAttr}>${captionHTML}</figcaption>`;
      }
      return output;

    case "fullpage":
      return `<figure data-id="${id}" id="figure-${globalElementCounter}" class="full-page ${classAttr}"${styleAttr}>
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

    if (ENABLE_JSON_SAVE) {
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
    } else {
      imageConfigs = {};
      console.log("🚫 Sauvegarde JSON désactivée");
    }
    configHasChanged = false;
  });

  eleventyConfig.on("eleventy.after", () => {
    if (configHasChanged && ENABLE_JSON_SAVE) {
      fs.writeFileSync(
        "_11ty/_data/images.json",
        JSON.stringify(imageConfigs, null, 2)
      );
      console.log(`💾 ${Object.keys(imageConfigs).length} configs sauvées`);
    }
  });

  eleventyConfig.addShortcode("image", function (firstParam, options = {}) {
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
        ENABLE_JSON_SAVE &&
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
        ENABLE_JSON_SAVE &&
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
        ENABLE_JSON_SAVE &&
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
        ENABLE_JSON_SAVE &&
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
        ENABLE_JSON_SAVE &&
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
      itemId = options.id;
      const existingConfig = imageConfigs[itemId] || {};

      config = {
        ...existingConfig,
        ...options,
        src: firstParam,
      };

      if (itemId && ENABLE_JSON_SAVE && JSON.stringify(existingConfig) !== JSON.stringify(config)) {
        imageConfigs[itemId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML("fullpage", config);
  });

  eleventyConfig.addAsyncShortcode("markdown", async function(file, options = {}) {
    const filePath = path.join(`./${config.publicFolder}`, file);
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      let attributes = [];
      
      if (options.class) {
        attributes.push(`class="include ${options.class}"`);
      } else {
        attributes.push('class="include"');
      }
      
      if (options.style) {
        const escapedStyle = options.style.replace(/"/g, '&quot;');
        attributes.push(`style="${escapedStyle}"`);
      }
      
      if (options.id) {
        attributes.push(`id="${options.id}"`);
      }
      
      const attrString = attributes.join(' ');
      
      const renderedContent = file.endsWith('.md') 
        ? md.render(content)
        : content;
        
      return `<div ${attrString}>${renderedContent}</div>`;
      
    } catch (error) {
      console.error(`Erreur inclusion ${file}:`, error.message);
      return `<div class="include error">❌ Erreur: ${file} non trouvé</div>`;
    }
  });

};