const fs = require('fs');
const markdownIt = require("markdown-it");
const md = markdownIt({ 
  html: true, 
  typographer: true 
});

module.exports = function(eleventyConfig) {
  // ✅ Variables déclarées DANS la fonction
  let globalImageCounter = 0;
  let globalFigureCounter = 0;
  let globalFigureGridCounter = 0;
  
  // Cache pour les configurations d'images
  let imageConfigs = {};
  let configHasChanged = false;

  // ✅ Fonctions utilitaires DANS le scope
  function getImageConfig(imageId, overrides = {}) {
    const baseConfig = imageConfigs[imageId] || {};
    return { ...baseConfig, ...overrides };
  }

  function generateStyles(config) {
    const cssVarMapping = {
      col: '--col', printcol: '--printCol', width: '--width', 
      printwidth: '--printWidth', printrow: '--printRow', 
      printheight: '--printHeight', alignself: '--alignself',
      imgX: '--imgX', imgY: '--imgY', imgW: '--imgW'
    };
    
    let styles = '';
    Object.entries(config).forEach(([key, value]) => {
      if (cssVarMapping[key] && value !== undefined) {
        styles += `${cssVarMapping[key]}: ${value}; `;
      }
    });
    return styles ? ` style="${styles}"` : '';
  }

  function generateHTML(type, config) {
    const styleAttr = generateStyles(config);
    const classAttr = config.class ? ` ${config.class}` : '';
    const captionHTML = config.caption ? md.renderInline(config.caption) : '';
    const id = config.id;
    
    switch(type) {
      case 'image':
        globalImageCounter++;
        return `<figure data-id="${id}" id="image-${globalImageCounter}" class="figure image${classAttr}"${styleAttr}>
          <img src="${config.src}" alt="${config.caption || ''}" >
          ${captionHTML ? `<figcaption class="figcaption">${captionHTML}</figcaption>` : ''}
        </figure>`;
        
      case 'imagegrid':
        globalFigureGridCounter++;
        let output = `<figure class="resize${classAttr}" id="figure_${globalFigureGridCounter}"${styleAttr}>
          <img src="${config.src}" alt="${config.caption || ''}" >
        </figure>`;
        
        if (captionHTML) {
          output += `<figcaption class="figcaption figcaption_${globalFigureGridCounter}">${captionHTML}</figcaption>`;
        }
        return output;

      case 'figure':
        globalFigureCounter++;
        return `<span class="spanMove figure_call" id="fig-${globalFigureCounter}-call">
          [<a href="#fig-${globalFigureCounter}">fig. ${globalFigureCounter}</a>]
        </span>
        <span class="figure figmove${classAttr}" id="fig-${globalFigureCounter}"${styleAttr}>
          <img src="${config.src}" alt="${config.caption || ''}" >
          ${captionHTML ? `<span class="figcaption"><span class="figure_reference">[fig. ${globalFigureCounter}]</span> ${captionHTML}</span>` : ''}
        </span>`;

      case 'imagenote':
        return `<span class="imagenote sideNote${classAttr}"${styleAttr}>
          <img src="${config.src}" alt="${config.caption || ''}" >
          ${captionHTML ? `<span class="caption">${captionHTML}</span>` : ''}
        </span>`;

      case 'video':
        const posterAttr = config.poster ? ` poster="${config.poster}"` : '';
        return `<figure class="video${classAttr}"${styleAttr}>
          <video controls${posterAttr}>
            <source src="${config.src}">
          </video>
          ${captionHTML ? `<figcaption class="figcaption">${captionHTML}</figcaption>` : ''}
        </figure>`;

      default:
        return `<!-- Type ${type} non supporté -->`;
    }
  }

  // ✅ Événements Eleventy
  eleventyConfig.on('eleventy.before', () => {
    globalFigureCounter = 0;
    globalFigureGridCounter = 0;
    globalImageCounter = 0;

    try {
      imageConfigs = JSON.parse(fs.readFileSync('_11ty/_data/images.json', 'utf8'));
      console.log(`✅ ${Object.keys(imageConfigs).length} configs d'images chargées`);
    } catch(e) {
      imageConfigs = {};
      console.log('📝 Nouveau fichier images.json sera créé');
    }
    configHasChanged = false;
  });

  eleventyConfig.on('eleventy.after', () => {
    if (configHasChanged) {
      fs.writeFileSync('_11ty/_data/images.json', JSON.stringify(imageConfigs, null, 2));
      console.log(`💾 ${Object.keys(imageConfigs).length} configs sauvées`);
    }
  });

  // ✅ Shortcodes avec vos noms originaux
  eleventyConfig.addShortcode("image", function(firstParam, options = {}) {
    let config, imageId;
    
    // DÉTECTION DU FORMAT D'APPEL
    if (typeof firstParam === 'string' && !firstParam.includes('/') && !firstParam.includes('.')) {
      // FORMAT 1: {% image "intro-domestique" %}
      imageId = firstParam;
      config = getImageConfig(imageId, options);
      
      if (!config.src) {
        return `<!-- ERROR: Image "${imageId}" non trouvée dans JSON -->`;
      }
    } else {
      // FORMAT 2: {% image "images/photo.jpg", { id: "intro-domestique", printcol: 1 } %}
      imageId = options.id;
      const existingConfig = imageConfigs[imageId] || {};
      
      config = {
        ...existingConfig,  // Config JSON existante
        ...options,         // Nouvelles valeurs
        src: firstParam     // Force le nouveau src
      };
      
      // SAUVEGARDE DANS LE JSON
      if (imageId) {
        // Vérifier s'il y a des changements
        const existingConfigString = JSON.stringify(existingConfig);
        const newConfigString = JSON.stringify(config);
        
        if (existingConfigString !== newConfigString) {
          imageConfigs[imageId] = { ...config };
          configHasChanged = true;
          
          if (Object.keys(existingConfig).length > 0) {
            console.log(`🔄 Config "${imageId}" mise à jour`);
          } else {
            console.log(`✨ Nouvelle config "${imageId}" créée`);
          }
        }
      }
    }

    return generateHTML('image', config);
  });

  eleventyConfig.addShortcode("imagegrid", function(firstParam, options = {}) {
    let config, imageId;
    
    if (typeof firstParam === 'string' && !firstParam.includes('/') && !firstParam.includes('.')) {
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
        src: firstParam
      };
      
      if (imageId && JSON.stringify(existingConfig) !== JSON.stringify(config)) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML('imagegrid', config);
  });

  eleventyConfig.addShortcode("video", function(firstParam, options = {}) {
    let config, imageId;
    
    if (typeof firstParam === 'string' && !firstParam.includes('/') && !firstParam.includes('.')) {
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
        src: firstParam
      };
      
      if (imageId && JSON.stringify(existingConfig) !== JSON.stringify(config)) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML('video', config);
  });

  eleventyConfig.addShortcode("figure", function(firstParam, options = {}) {
    let config, imageId;
    
    if (typeof firstParam === 'string' && !firstParam.includes('/') && !firstParam.includes('.')) {
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
        src: firstParam
      };
      
      if (imageId && JSON.stringify(existingConfig) !== JSON.stringify(config)) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML('figure', config);
  });

  eleventyConfig.addShortcode("imagenote", function(firstParam, options = {}) {
    let config, imageId;
    
    if (typeof firstParam === 'string' && !firstParam.includes('/') && !firstParam.includes('.')) {
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
        src: firstParam
      };
      
      if (imageId && JSON.stringify(existingConfig) !== JSON.stringify(config)) {
        imageConfigs[imageId] = { ...config };
        configHasChanged = true;
      }
    }

    return generateHTML('imagenote', config);
  });
};