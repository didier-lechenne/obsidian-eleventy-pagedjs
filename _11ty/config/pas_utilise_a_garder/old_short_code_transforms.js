const config = require("./siteData.js");
const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  const md = markdownIt({ 
    html: true, 
    typographer: true 
  });

let globalImageCounter = 0;
let globalFigureCounter = 0;
let globalFigureGridCounter = 0;

eleventyConfig.on('eleventy.before', () => {
  globalImageCounter = 0;
  globalFigureCounter = 0;
  globalFigureGridCounter = 0;
});

// === FONCTIONS UTILITAIRES POUR SHORTCODES ===

// Fonction pour générer un slug à partir d'un texte
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}





// Fonction pour parser les attributs du shortcode
function parseShortcut(type, src, attributesString, allowedAttrTypes) {
  const attrs = {};
  
  const regex = /(\w+)\s*:\s*(?:"([^"]*)"|([^\s:]+(?:[^\s:])*?)(?=\s+\w+\s*:|$))/g;
  
  let match;
  while ((match = regex.exec(attributesString)) !== null) {
    const key = match[1].trim();
    const value = (match[2] !== undefined) ? match[2] : match[3];
    
    if (allowedAttrTypes.includes(key)) {
      attrs[key] = value.trim();
    }
  }

  return {
    type,
    src,
    attributes: attrs
  };
}

// Fonction pour générer les styles inline
function generateInlineStyles(attributes) {
  let styles = '';

  if (attributes.col) styles += `--col: ${attributes.col}; `;
  if (attributes.printcol) styles += `--printCol: ${attributes.printcol}; `;
  if (attributes.width) styles += `--width: ${attributes.width}; `;
  if (attributes.printwidth) styles += `--printWidth: ${attributes.printwidth}; `;
  if (attributes.printrow) styles += `--printRow: ${attributes.printrow}; `;
  if (attributes.printheight) styles += `--printHeight: ${attributes.printheight}; `;
  if (attributes.alignself) styles += `--alignself: ${attributes.alignself}; `;
  if (attributes.imgX) styles += `--imgX: ${attributes.imgX}; `;
  if (attributes.imgY) styles += `--imgY: ${attributes.imgY}; `;
  if (attributes.imgW) styles += `--imgW: ${attributes.imgW}; `;

  return styles;
}



// Fonction principale pour générer le HTML
function generateHTML(parsedData, figureNumber, id, figureGrid) {
  const { type, src, attributes } = parsedData;
  const srcWithPath = `${src}`;
  const styleAttr = generateInlineStyles(attributes);
  let out = '';

  switch (type) {
    case 'image':
      out = `<figure class="figure image ${attributes.class || ''}" id="image_${figureGrid}" style="${styleAttr}">`;
      out += `<img src="${srcWithPath}" alt="${attributes.caption || ''}">`;
      if (attributes.caption) {
        out += `<figcaption class="figcaption">${md.renderInline(attributes.caption)}</figcaption>`;
      }
      out += `</figure>`;
      break;

    case 'imagenote':
      out = `<span class="imagenote sideNote ${attributes.class || ''}" id="${id}">`;
      out += `<img src="${srcWithPath}" alt="${attributes.caption || ''}">`;
      if (attributes.caption) {
        out += `<span class="caption">${md.renderInline(attributes.caption)}</span>`;
      }
      out += `</span>`;
      break;

    case 'figure':
      out = `<span data-ref="fig. ${figureNumber}" data-caption="${attributes.caption || ''}" data-id="${id}-${figureNumber}" data-style="${styleAttr}" data-class="figure ${attributes.class || ''}" data-src="${srcWithPath}" class="spanMove figure_call" id="${id}-call">&#8239;[<a href="#${id}-${figureNumber}">fig. ${figureNumber}</a>]</span>`;
      out += `<span class="figure figmove ${attributes.class || ''}" id="${id}-${figureNumber}" style="${styleAttr}">`;
      out += `<img src="${srcWithPath}" alt="${attributes.caption || ''}">`;
      if (attributes.caption) {
        out += `<span class="figcaption"><span class="figure_reference">[fig. ${figureNumber}]</span> ${md.renderInline(attributes.caption)} <a href='#${id}-call' class='figure_call_back'>↩</a></span>`;
      }
      out += `</span>`;
      break;

    case 'insertFig':
      out = `<span class="figure_call" id="${id}-call">[<a href="#${id}-${figureNumber}">fig. ${figureNumber}</a>]</span>`;
      break;

    case 'showFig':
      out = `<figure class="figure ${attributes.class || ''}" id="${id}-${figureNumber}" style="${styleAttr}">`;
      out += `<img src="${srcWithPath}" alt="${attributes.caption || ''}">`;
      if (attributes.caption) {
        out += `<figcaption class="figcaption"><span class="figure_reference">fig. ${figureNumber}</span> ${md.renderInline(attributes.caption)} <a href='#${id}-call' class='figure_call_back'>↩</a></figcaption>`;
      }
      out += `</figure>`;
      break;

    case 'imagegrid':
      out = `<figure class="resize ${attributes.class || ''}" id="figure_${figureGrid}" style="${styleAttr}">`;
      out += `<img  data-id="figure_${figureGrid}" class="" src="${srcWithPath}"  alt="${attributes.caption || ''}">`;
      out += `</figure>`;
      if (attributes.caption) {
        out += `<figcaption class="figcaption figcaption_${figureGrid} " style="${styleAttr}"> ${md.renderInline(attributes.caption)}</figcaption>`;
      }
      break;

    default:
      return '';
  }
  return out;
}

  // === NOUVEAUX SHORTCODES COMPLETS ===
  eleventyConfig.addPreprocessor("shortCodes", "*", (data, content) => {
    const shortcodeTypes = ['image', 'imagenote', 'figure', 'insertFig', 'showFig',  'imagegrid'];
    const attrTypes = ['class', 'caption', 'print',  'col', 'printcol', 'width', 'printwidth', 'printrow', 'printheight', 'alignself', 'imgX', 'imgY', 'imgW'];


    
    // Regex normale pour les autres shortcodes
    const regex = new RegExp(`\\(\\s*(${shortcodeTypes.join('|')})\\s*:\\s*([^\\s]+)\\s*(.*?)\\s*\\)`, 'g');



    // Puis traiter les autres shortcodes
    content = content.replace(regex, (match, type, src, attributesString) => {
      const id = slugify(src);
      let figureNumber = globalFigureCounter;
      let figureGrid = globalFigureGridCounter;

      const parsedData = parseShortcut(type, src, attributesString, attrTypes);

      if (type === 'figure') {
        globalFigureCounter++;
        figureNumber = globalFigureCounter;
      }
      if (type === 'imagegrid' || type === 'image') {
        globalFigureGridCounter++;
        figureGrid = globalFigureGridCounter;
      }
      
      return generateHTML(parsedData, figureNumber, id, figureGrid);
    });

    return content;
  });

  // === TRANSFORMERS ET PREPROCESSORS EXISTANTS ===

  // Transformer pour ajouter des classes CSS aux éléments
  eleventyConfig.addTransform("addClasses", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Ajouter des classes aux blockquotes
      content = content.replace(
        /<blockquote>/g,
        '<blockquote class="custom-quote">'
      );

      // Ajouter des classes aux tables
      content = content.replace(/<table>/g, '<table class="content-table">');

      // Ajouter des classes aux images
      content = content.replace(
        /<img(?![^>]*class=)/g,
        '<img class="content-image"'
      );

      return content;
    }
    return content;
  });

  // Preprocessor pour les images personnalisées (image: ... caption: "...")
//   eleventyConfig.addPreprocessor("imageCustom", "*", (data, content) => {
//     return content.replace(
//       /\(\s*image\s*:\s*(.+?)\s+caption\s*:\s*"(.*?)"\s*\)/g,
      
//       function (match, src, caption) {
//         globalImageCounter++;

//         // Nettoyer le src en supprimant les espaces en trop
//         const cleanSrc = src.trim();

//         const figcaptionHtml =
//           caption && caption.trim()
//             ? `<figcaption class="figcaption">${md.renderInline(caption)}</figcaption>`
//             : "";

//         return `<figure id="image-${globalImageCounter}" class="figure image">
//         <img src="${cleanSrc}" ">
//         ${figcaptionHtml}
//       </figure>`;
//       }
//     );
//   });




  // 3. Transformer (notes: "...") en notes markdown
  eleventyConfig.addPreprocessor("notes", "*", (data, content) => {
    content = content.replace(/\(notes?\s*:\s*"(.*?)"\s*\)/gs, "^[$1]");
    return content;
  });

  eleventyConfig.addPreprocessor("break", "*", (data, content) => {
    content = content.replace(
      /<br\s+class=["']breakcolumn["'](\s*\/?)>/gi,
      '<span class="breakcolumn"></span>'
    );

     content = content.replace(
      /<breakcolumn>/gi,
      '<span class="breakcolumn"></span>'
    );

     content = content.replace(
      /<breakpage>/gi,
      '<br class="breakpage">'
    );

    return content;
  });

  
  eleventyConfig.addPreprocessor("smallcaps", "*", (data, content) => {
    // Transformer <smallcaps>XXX</smallcaps> en <span class="smallcaps">XXX</span>
    content = content.replace(
      /<smallcaps>(.*?)<\/smallcaps>/gi,
      '<span class="small-caps">$1</span>'
    );

    return content;
  });

  eleventyConfig.addPreprocessor("imgfull", "*", (data, content) => {
    content = content.replace(
      /\(\s*imgfull\s*:\s*([^\s]+)\s+page\s*:\s*([^)]+)\s*\)/g,
      function (match, src, page) {
        globalImageCounter++;
        const cleanPage = page.trim();
        return `<figure id="figure-${globalImageCounter}" class="full-page ${cleanPage}">
          <img src="${src}">
        </figure>`;
      }
    );

    return content;
  });

eleventyConfig.addTransform(
  "invisibleSpaces",
  function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) {
      return content;
    }

    // Fonction améliorée pour protéger le contenu des attributs HTML
    function replaceOutsideAttributes(content, searchRegex, replacement) {
      let result = '';
      let i = 0;
      
      while (i < content.length) {
        // Chercher le début d'une balise HTML
        const tagStart = content.indexOf('<', i);
        
        if (tagStart === -1) {
          // Plus de balises, traiter le reste du contenu
          const remainingText = content.slice(i);
          result += remainingText.replace(searchRegex, replacement);
          break;
        }
        
        // Traiter le texte avant la balise
        const beforeTag = content.slice(i, tagStart);
        result += beforeTag.replace(searchRegex, replacement);
        
        // Trouver la fin de la balise en gérant les attributs avec des guillemets
        let tagEnd = tagStart + 1;
        let inQuotes = false;
        let quoteChar = '';
        
        while (tagEnd < content.length) {
          const char = content[tagEnd];
          
          if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
          } else if (inQuotes && char === quoteChar) {
            // Vérifier si ce n'est pas un guillemet échappé
            if (content[tagEnd - 1] !== '\\') {
              inQuotes = false;
              quoteChar = '';
            }
          } else if (!inQuotes && char === '>') {
            tagEnd++;
            break;
          }
          
          tagEnd++;
        }
        
        // Ajouter la balise telle quelle (sans transformation)
        result += content.slice(tagStart, tagEnd);
        i = tagEnd;
      }
      
      return result;
    }

    // Appliquer les transformations en évitant les attributs HTML
    content = replaceOutsideAttributes(
      content,
      /\u00A0/g,
      '<span class="i_space non-breaking-space">&nbsp;</span>'
    );
    
    content = replaceOutsideAttributes(
      content,
      /\u202F/g,
      '<span class="i_space narrow-no-break-space">\u202F</span>'
    );

    return content;
  }
);

  eleventyConfig.addTransform(
    "uniqueFootnotes",
    function (content, outputPath) {
      if (outputPath && outputPath.endsWith(".html")) {
        let compteur = 0;

        const patterns = [
          [
            /<a href="#fn\d+" id="fnref\d+">\[(\d+)\]<\/a>/g,
            () => {
              compteur++;
              return `<a data-ref="${compteur}" href="#fn${compteur}" id="fnref${compteur}">${compteur}</a>`;
            },
          ],
          [
            /<li id="fn\d+" class="footnote-item">/g,
            () => {
              compteur++;
              return `<li data-ref="${compteur}"  id="fn${compteur}" class="footnote-item">`;
            },
          ],
          [
            /<a href="#fnref\d+" class="footnote-backref">/g,
            () => {
              compteur++;
              return `<a data-ref="${compteur}" href="#fnref${compteur}" class="footnote-backref">`;
            },
          ],
        ];

        patterns.forEach(([regex, replacer]) => {
          compteur = 0;
          content = content.replace(regex, replacer);
        });
      }

      return content;
    }
  );
  
};