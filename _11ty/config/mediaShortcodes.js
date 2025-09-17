const markdownIt = require("markdown-it");
const config = require('./siteData.js');

module.exports = function (eleventyConfig) {
  // Créer une instance markdown locale pour le rendu des captions
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: false,
    typographer: true,
  });

  // Types de médias par défaut
  const mediaTypes = {
    image: {
      name: 'Image',
      template: '<figure data-type="{type}" data-grid="image" class="figure {type} {classes}" id="{id}" data-src="{src}">{media}<figcaption class="figcaption">{caption}</figcaption></figure>',
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    },
    imagenote: {
      name: 'Image Note',
      template: '<span data-type="{type}" class="{type} {classes}" id="{id}" data-src="{src}">{media}<span class="figcaption">{caption}</span></span>',
      extensions: []
    },
    figure: {
      name: 'Figure',
      template: '<figure data-type="{type}" data-grid="image" class="{type} {classes}">{media}<figcaption class="figcaption">{caption}</figcaption></figure>',
      extensions: []
    },
    grid: {
      name: 'Grid',
      template: '<figure data-type="{type}" data-grid="image" class="figure {type} {classes}">{media}</figure><figcaption class="figcaption">{caption}</figcaption>',
      extensions: []
    },
    fullpage: {
      name: 'Full Page',
      template: '<figure data-type="{type}" data-grid="image" class="full-page figure {type} {classes}">{media}<figcaption class="figcaption">{caption}</figcaption></figure>',
      extensions: []
    }
  };

  // Classe pour détecter le type
  class TypeDetector {
    constructor(mediaTypes) {
      this.mediaTypes = mediaTypes;
    }

    detectFromFilename(filename) {
      const ext = this.getFileExtension(filename);
      
      for (const [typeName, config] of Object.entries(this.mediaTypes)) {
        if (!['image', 'imagenote', 'figure', 'grid', 'fullpage'].includes(typeName)) continue;
        
        if (config.extensions.includes(ext)) {
          return typeName;
        }
      }
      
      return 'figure';
    }

    detectFromKeyword(params) {
      const allowedTypes = ['image', 'imagenote', 'figure', 'grid', 'fullpage'];
      
      for (const param of params) {
        const lowerParam = param.toLowerCase();
        
        if (allowedTypes.includes(lowerParam)) {
          return lowerParam;
        }
      }
      
      return null;
    }

    getFileExtension(filename) {
      const lastDot = filename.lastIndexOf('.');
      return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
    }
  }

  // Classe pour parser les attributs
  class MediaParser {
    constructor(typeDetector) {
      this.typeDetector = typeDetector;
    }

    parseAttributes(altText, filename) {
      const result = {
        type: 'figure',
        caption: '',
        classes: [],
      };

      if (!altText) {
        if (filename) {
          result.type = this.typeDetector.detectFromFilename(filename);
        }
        return result;
      }

      const cleanedAltText = altText.replace(/\s+/g, ' ').trim();
      const parts = cleanedAltText.split('|').map(part => part.trim());

      // Détecter le type depuis les mots-clés
      const keywordType = this.typeDetector.detectFromKeyword(parts);
      if (keywordType) {
        result.type = keywordType;
        const keywordIndex = parts.findIndex(p => p.toLowerCase() === keywordType);
        if (keywordIndex !== -1) {
          parts.splice(keywordIndex, 1);
        }
      } else if (filename) {
        result.type = this.typeDetector.detectFromFilename(filename);
      }

      // Parser les autres paramètres
      for (const part of parts) {
        if (part.includes(':')) {
          this.parseKeyValuePair(part, result);
        } else if (part && !result.caption) {
          result.caption = part;
        }
      }

      return result;
    }

    parseKeyValuePair(part, result) {
      const [key, ...valueParts] = part.split(':');
      const value = valueParts.join(':').trim();

      switch (key.toLowerCase()) {
        case 'caption':
          result.caption = value;
          break;
        case 'class':
          result.classes = value.split(',').map(cls => cls.trim());
          break;
        case 'width':
          result.width = value;
          break;
        case 'col':
          result.col = value;
          break;
        case 'fullpage':
        case 'full-page':
          result['pagedjs-full-page'] = value;
          break;
        case 'alignself':
        case 'align-self':
          result['align-self'] = value;
          break;
        case 'print-col':
        case 'printcol':
          result['print-col'] = value;
          break;
        case 'print-width':
        case 'printwidth':
          result['print-width'] = value;
          break;
        case 'print-row':
        case 'printrow':
          result['print-row'] = value;
          break;
        case 'print-height':
        case 'printheight':
          result['print-height'] = value;
          break;
        case 'print-x':
        case 'img-x':
        case 'imgx':
          result['print-x'] = value;
          break;
        case 'print-y':
        case 'img-y':
        case 'imgy':
          result['print-y'] = value;
          break;
        case 'img-w':
        case 'imgw':
          result['img-w'] = value;
          break;
        default:
          result[key.toLowerCase()] = value;
          break;
      }
    }
  }

  // Moteur de template
  class TemplateEngine {
    render(template, data) {
      return template
        .replace(/{type}/g, data.type)
        .replace(/{classes}/g, data.classes)
        .replace(/{id}/g, data.id)
        .replace(/{src}/g, data.src)
        .replace(/{media}/g, data.media)
        .replace(/{caption}/g, data.caption);
    }
  }

  // Classe pour traiter les wikilinks
  class WikilinkProcessor {
    constructor(templateEngine, mediaTypes, mediaParser) {
      this.templateEngine = templateEngine;
      this.mediaTypes = mediaTypes;
      this.mediaParser = mediaParser;
    }

    processWikilink(match, filename, params = '') {
      const parsedData = this.mediaParser.parseAttributes(params, filename);
      const mediaType = this.mediaTypes[parsedData.type] || this.mediaTypes.figure;
      
      // Construire le chemin complet
      let src = filename.trim();
      if (!src.startsWith('./')) {
        src = `./images/${src}`;
      }
      
      // Générer les données du template
      const templateData = {
        type: parsedData.type,
        classes: parsedData.classes.join(' '),
        id: this.generateId(filename),
        src: src,
        media: `<img src="${src}" alt="${parsedData.caption || ''}" loading="lazy">`,
        caption: parsedData.caption ? md.renderInline(parsedData.caption) : ''
      };

      // Rendre le template
      let html = this.templateEngine.render(mediaType.template, templateData);
      
      // Ajouter les styles CSS
      const styles = this.applyStyles(parsedData);
      if (styles) {
        html = html.replace(/(<[^>]+)>/, `$1 style="${styles}">`);
      }

      return html;
    }

    generateId(filename) {
      const cleanFilename = filename.replace(/\./g, '').replace(/[^a-zA-Z0-9]/g, '');
      return `content${cleanFilename}`;
    }

    applyStyles(parsedData) {
      const styles = [];
      const excludedProps = ['type', 'caption', 'classes'];
      
      Object.entries(parsedData).forEach(([key, value]) => {
        if (typeof value === 'string' && !excludedProps.includes(key)) {
          styles.push(`--${key}: ${value}`);
        }
      });

      return styles.join('; ');
    }
  }

  // Renderer de médias (pour les images markdown classiques)
  class MediaRenderer {
    constructor(templateEngine, mediaTypes) {
      this.templateEngine = templateEngine;
      this.mediaTypes = mediaTypes;
    }

    renderMedia(imgHtml, parsedData) {
      if (!['image', 'imagenote', 'figure', 'grid', 'fullpage'].includes(parsedData.type)) {
        return imgHtml;
      }

      const mediaType = this.mediaTypes[parsedData.type] || this.mediaTypes.figure;
      
      const id = this.generateId(parsedData.src || '');
      const renderedCaption = parsedData.caption ? md.renderInline(parsedData.caption) : '';
      
      const templateData = {
        type: parsedData.type,
        classes: parsedData.classes.join(' '),
        id: id,
        src: parsedData.src || '',
        media: imgHtml,
        caption: renderedCaption
      };

      let html = this.templateEngine.render(mediaType.template, templateData);
      html = this.applyStyles(html, parsedData);
      
      return html;
    }

    generateId(src) {
      const filename = src.split('/').pop()?.replace(/\?.*$/, '')?.replace(/\./g, '') || '';
      return `content${filename}`;
    }

    applyStyles(html, parsedData) {
      const styles = [];
      const excludedProps = ['type', 'caption', 'classes'];
      
      Object.entries(parsedData).forEach(([key, value]) => {
        if (typeof value === 'string' && !excludedProps.includes(key)) {
          styles.push(`--${key}: ${value}`);
        }
      });

      if (styles.length > 0) {
        const styleAttr = styles.join('; ');
        html = html.replace(/(<[^>]+)>/i, `$1 style="${styleAttr}">`);
      }

      return html;
    }
  }

  // Fonction pour traiter les images
  function shouldProcessMedia(parsedData) {
    if (!['image', 'imagenote', 'figure', 'grid', 'fullpage'].includes(parsedData.type)) return false;
    
    return !!(
      parsedData.caption || 
      parsedData.col || 
      parsedData.width ||
      parsedData['print-col'] ||
      parsedData['print-width'] ||
      parsedData['print-row'] ||
      parsedData['print-height'] ||
      parsedData['print-x'] ||
      parsedData['print-y'] ||
      parsedData['img-w'] ||
      parsedData['align-self'] ||
      parsedData['pagedjs-full-page'] ||
      parsedData.type !== 'figure'
    );
  }

  // Initialiser les composants
  const typeDetector = new TypeDetector(mediaTypes);
  const mediaParser = new MediaParser(typeDetector);
  const templateEngine = new TemplateEngine();
  const mediaRenderer = new MediaRenderer(templateEngine, mediaTypes);
  const wikilinkProcessor = new WikilinkProcessor(templateEngine, mediaTypes, mediaParser);

  // Transform pour traiter les wikilinks ET les images markdown
  eleventyConfig.addTransform("processMedia", function(content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      // 1. Traiter les wikilinks ![[filename|params]]
      const wikilinkRegex = /!\[\[\s*([^|\]]+?)\s*(?:\|([\s\S]*?))?\]\]/g;
      content = content.replace(wikilinkRegex, (match, filename, params) => {
        return wikilinkProcessor.processWikilink(match, filename, params);
      });

      // 2. Traiter les images markdown classiques
      content = content.replace(/<img([^>]*?)alt=["']([^"']*?)["']([^>]*?)>/gi, (match, beforeAlt, altText, afterAlt) => {
        const srcMatch = match.match(/src=["']([^"']*?)["']/);
        if (!srcMatch) return match;
        
        const src = srcMatch[1];
        const filename = src.split('/').pop() || '';
        
        const parsedData = mediaParser.parseAttributes(altText, filename);
        parsedData.src = src;
        
        if (!shouldProcessMedia(parsedData)) {
          return match;
        }
        
        return mediaRenderer.renderMedia(match, parsedData);
      });
    }
    
    return content;
  });

  // Support pour les grilles d'images (containers)
  const markdownItContainer = require('markdown-it-container');
  
  eleventyConfig.amendLibrary("md", mdLib => {
    mdLib.use(markdownItContainer, 'columnGrid', {
      render: function (tokens, idx) {
        if (tokens[idx].nesting === 1) {
          return '<div class="columnGrid">\n';
        } else {
          return '</div>\n';
        }
      }
    });
  });
};