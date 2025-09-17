const markdownIt = require("markdown-it");
const fs = require("fs");
const path = require("path");
const config = require('./siteData.js');

module.exports = function (eleventyConfig) {
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: false,
    typographer: true,
  });

  const mediaTypes = {
    image: {
      name: 'Image',
      template: '<figure data-type="{type}" data-grid="image" class="figure {type} {classes}" id="{id}" data-src="{src}"{styles}>{media}{captionHtml}</figure>',
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    },
    imagenote: {
      name: 'Image Note',
      template: '<span data-type="{type}" class="{type} {classes}" id="{id}" data-src="{src}"{styles}>{media}{captionHtml}</span>',
      extensions: []
    },
    figure: {
      name: 'Figure',
      template: '<figure data-type="{type}" data-grid="image" class="{type} {classes}"{styles}>{media}{captionHtml}</figure>',
      extensions: []
    },
    grid: {
      name: 'Grid',
      template: '<figure data-type="{type}" data-grid="image" class="figure {type} {classes}"{styles}>{media}</figure>{captionHtml}',
      extensions: []
    },
    fullpage: {
      name: 'Full Page',
      template: '<figure data-type="{type}" data-grid="image" class="full-page figure {type} {classes}"{styles}>{media}</figure>',
      extensions: []
    }
  };

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
        
        // Chercher type exact ou type suivi de :
        for (const type of allowedTypes) {
          if (lowerParam === type || lowerParam.startsWith(type + ':')) {
            return type;
          }
        }
      }
      
      return null;
    }

    getFileExtension(filename) {
      const lastDot = filename.lastIndexOf('.');
      return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
    }
  }

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
      const [rawKey, ...valueParts] = part.split(':');
      const key = rawKey.trim(); 
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
        case 'printCol':
          result['print-col'] = value;
          break;
        case 'print-width':
        case 'printwidth':
        case 'printWidth':
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

  class TemplateEngine {
    render(template, data) {
      return template
        .replace(/{type}/g, data.type)
        .replace(/{classes}/g, data.classes)
        .replace(/{id}/g, data.id)
        .replace(/{src}/g, data.src)
        .replace(/{media}/g, data.media)
        .replace(/{caption}/g, data.caption)
        .replace(/{captionHtml}/g, data.captionHtml)
        .replace(/{styles}/g, data.styles);
    }
  }

  class WikilinkProcessor {
    constructor(templateEngine, mediaTypes, mediaParser) {
      this.templateEngine = templateEngine;
      this.mediaTypes = mediaTypes;
      this.mediaParser = mediaParser;
    }

    processWikilink(match, filename, params = '') {
      const parsedData = this.mediaParser.parseAttributes(params, filename);
      const mediaType = this.mediaTypes[parsedData.type] || this.mediaTypes.figure;
      
      let src = filename.trim();
      if (!src.startsWith('./') && !src.startsWith('/')) {
        src = `./images/${src.split('/').pop()}`;
      }
            
      const stylesString = this.applyStyles(parsedData);
      
      // Generate caption HTML only if caption exists
      let captionHtml = '';
      if (parsedData.caption) {
        const renderedCaption = md.renderInline(parsedData.caption);
        
        if (parsedData.type === 'imagenote') {
          captionHtml = `<span class="figcaption">${renderedCaption}</span>`;
        } else if (parsedData.type === 'grid') {
          captionHtml = `<figcaption class="figcaption"${stylesString ? ` style="${stylesString}"` : ''}>${renderedCaption}</figcaption>`;
        } else {
          captionHtml = `<figcaption class="figcaption">${renderedCaption}</figcaption>`;
        }
      }
      
      const templateData = {
        type: parsedData.type,
        classes: parsedData.classes.join(' '),
        id: this.generateId(filename),
        src: src,
        media: `<img src="${src}" alt="${parsedData.caption || ''}" loading="lazy">`,
        caption: parsedData.caption || '',
        captionHtml: captionHtml,
        styles: stylesString ? ` style="${stylesString}"` : ''
      };

      return this.templateEngine.render(mediaType.template, templateData);
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

  eleventyConfig.addAsyncShortcode("markdown", async function (file, options = {}) {
    const cleanFile = file.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const filePath = path.join(`./${config.publicFolder}`, cleanFile);

    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      
      const styles = [];

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convertir camelCase en kebab-case et ajouter --
          const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          styles.push(`${cssVar}: ${value}`);
        }
      });

      const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : "";
      const classAttr = options.class ? ` class="${options.class}"` : "";
      const idAttr = options.id ? ` id="${options.id}"` : "";

      const renderedContent = cleanFile.endsWith(".md") ? md.render(content) : content;

      return `<div data-grid="markdown" data-md="${cleanFile}"${idAttr}${classAttr}${styleAttr}>${renderedContent}</div>`;
      
    } catch (error) {
      console.error(`Erreur inclusion ${cleanFile}:`, error.message);
      return `<div class="include error">❌ Erreur: ${cleanFile} non trouvé</div>`;
    }
  });

  const typeDetector = new TypeDetector(mediaTypes);
  const mediaParser = new MediaParser(typeDetector);
  const templateEngine = new TemplateEngine();
  const wikilinkProcessor = new WikilinkProcessor(templateEngine, mediaTypes, mediaParser);

  // Shortcode grid utilisant la même logique que les wikilinks
  eleventyConfig.addShortcode("grid", function(src, options = {}) {
    // Convertir les options en format "params" pour réutiliser le parser
    const params = Object.entries(options)
      .map(([key, value]) => {
        // Gérer les valeurs avec espaces (caption, class)
        if (typeof value === 'string' && (value.includes(' ') || value.includes(':'))) {
          return `${key}:"${value}"`;
        }
        return `${key}:${value}`;
      })
      .join('|');
    
    // Ajouter le type grid si pas déjà spécifié
    const finalParams = params ? `grid|${params}` : 'grid';
    
    return wikilinkProcessor.processWikilink('', src, finalParams);
  });

  eleventyConfig.addPreprocessor("processWikilinks", "*", (data, content) => {
    const wikilinkRegex = /!\[\[\s*([^|\]]+?)\s*(?:\|([\s\S]*?))?\]\]/g;
    return content.replace(wikilinkRegex, (match, filename, params) => {
      return wikilinkProcessor.processWikilink(match, filename, params);
    });
  });

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