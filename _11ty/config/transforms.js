const config = require("./siteData.js");

module.exports = function (eleventyConfig) {
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

  // Transformer pour les liens externes
  // eleventyConfig.addTransform("externalLinks", function (content, outputPath) {
  //   if (outputPath && outputPath.endsWith(".html")) {
  //     // Ajouter target="_blank" aux liens externes
  //     content = content.replace(
  //       /<a href="(https?:\/\/[^"]*)"([^>]*)>/g,
  //       '<a href="$1"$2 target="_blank" rel="noopener">'
  //     );
  //     return content;
  //   }
  //   return content;
  // });

  eleventyConfig.addPreprocessor("obsidianEmbeds", "*", (data, content) => {

    function slugify(text) {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    // Extensions de fichiers par type
    const imageExts = ["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp"];
    const audioExts = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
    const videoExts = ["mp4", "webm", "ogv", "mov", "avi"];
    const pdfExts = ["pdf"];

    // Fonction pour détecter le type de fichier
    function getFileType(filename) {
      const ext = filename.split(".").pop().toLowerCase();
      if (imageExts.includes(ext)) return "image";
      if (audioExts.includes(ext)) return "audio";
      if (videoExts.includes(ext)) return "video";
      if (pdfExts.includes(ext)) return "pdf";
      return "note";
    }

    // 1. Traiter tous les embeds ![[...]]
    content = content.replace(
      /!\[\[([^\]]+)\]\]/g,
      function (match, embedContent) {
        let [filePath, ...rest] = embedContent.split("|");
        filePath = filePath.trim();

        // Détecter si c'est un chemin avec dossier (images/, assets/, etc.)
        const hasFolder = filePath.includes("/");
        const basePath = hasFolder ? "" : "images/"; // Par défaut dans images/ si pas de dossier spécifié
        const fullPath = hasFolder ? filePath : basePath + filePath;

        const fileType = getFileType(filePath);

        switch (fileType) {
          case 'image':
            let imageAltText = 'Image'; // ✅ Renommé pour éviter le conflit
            let caption = '';
            let attributes = ' class="content-image" loading="lazy"';
            
            if (rest.length > 0) {
              const params = rest.join('|').trim();
              
              // Cas 1: Juste des dimensions (100x200)
              const dimensionOnly = params.match(/^(\d+)x(\d+)$/);
              if (dimensionOnly) {
                const [, width, height] = dimensionOnly;
                attributes += ` width="${width}" height="${height}"`;
              }
              // Cas 2: Dimensions + caption (100x200|Titre de l'image)  
              else if (params.includes('|')) {
                const parts = params.split('|');
                const dimensionMatch = parts[0].match(/^(\d+)x(\d+)$/);
                if (dimensionMatch) {
                  const [, width, height] = dimensionMatch;
                  attributes += ` width="${width}" height="${height}"`;
                  caption = parts.slice(1).join('|').trim();
                  imageAltText = caption;
                } else {
                  caption = params;
                  imageAltText = caption;
                }
              }
              // Cas 3: Juste du texte (sera utilisé comme caption et alt)
              else {
                const dimensionInText = params.match(/^(\d+)x(\d+)(.*)$/);
                if (dimensionInText) {
                  const [, width, height, remainingText] = dimensionInText;
                  attributes += ` width="${width}" height="${height}"`;
                  if (remainingText.trim()) {
                    caption = remainingText.trim();
                    imageAltText = caption;
                  }
                } else {
                  caption = params;
                  imageAltText = params;
                }
              }
            }
            
            const img = `<img${attributes} src="${fullPath}" alt="${imageAltText}">`;
            const figcaptionHtml = caption ? `<figcaption>${caption}</figcaption>` : '';
            
            return `<figure>${img}${figcaptionHtml}</figure>`;

          case "audio":
            return `<audio controls>
    <source src="${fullPath}" type="audio/${filePath.split(".").pop()}">
    Votre navigateur ne supporte pas l'audio.
  </audio>`;

          case "video":
            return `<video controls>
    <source src="${fullPath}" type="video/${filePath.split(".").pop()}">
    Votre navigateur ne supporte pas la vidéo.
  </video>`;

          case "pdf":
            return `<iframe src="${fullPath}" width="100%" height="600px">
    <a href="${fullPath}">Ouvrir le PDF</a>
  </iframe>`;

          case "note":
            const noteAltText = rest.join("|").trim() || "Fichier"; // ✅ Variable locale
            if (filePath.includes("#")) {
              const [noteName, anchor] = filePath.split("#");
              const cleanNote = noteName.replace(/^\d+[\.\-\s]*/, "");
              const slugifiedNote = slugify(cleanNote);
              return `<div class="embedded-note">
    <a href="#${slugifiedNote}" class="embed-link">📄 ${noteAltText || anchor || cleanNote}</a>
  </div>`;
            } else {
              const cleanNote = filePath.replace(/^\d+[\.\-\s]*/, "");
              const slugifiedNote = slugify(cleanNote);
              return `<div class="embedded-note">
    <a href="#${slugifiedNote}" class="embed-link">📄 ${noteAltText || cleanNote}</a>
  </div>`;
            }

          default:
            const defaultAltText = rest.join("|").trim() || "Fichier"; // ✅ Variable locale
            return `<a href="${fullPath}">${defaultAltText}</a>`;
        }
      }
    );

    // 2. Traiter ligne par ligne pour les liens [[]] (sans !)
    const lines = content.split("\n");
    const processedLines = lines.map((line) => {
      // Si la ligne est un titre markdown, on ne touche pas aux [[]]
      if (line.trim().match(/^#{1,6}\s/)) {
        return line;
      }

      // Transformer les liens [[]] normaux
      return line.replace(/\[\[([^\]]+)\]\]/g, function (match, content) {
        let linkPart, displayText;

        // Gérer [[page|texte]]
        if (content.includes("|")) {
          [linkPart, displayText] = content.split("|");
          linkPart = linkPart.trim();
          displayText = displayText.trim();
        } else {
          linkPart = content;
          displayText = null;
        }

        // Gérer [[page#ancre]]
        if (linkPart.includes("#")) {
          const [pagePart, anchorPart] = linkPart.split("#");
          const cleanPage = pagePart.replace(/^\d+[\.\-\s]*/, "");
          const slugifiedPage = slugify(cleanPage);
          if (!displayText) {
            displayText = anchorPart || cleanPage;
          }
          return `<a href="#${slugifiedPage}" class="internal-link">${displayText}</a>`;
        }

        // Format normal [[page]]
        const cleanContent = linkPart.replace(/^\d+[\.\-\s]*/, "");
        const slugifiedContent = slugify(cleanContent);
        if (!displayText) {
          displayText = cleanContent;
        }
        return `<a href="#${slugifiedContent}" class="internal-link">${displayText}</a>`;
      });
    });
    content = processedLines.join("\n");



    return content;
  });

  // 3. Transformer (notes: "...") en notes markdown
  eleventyConfig.addPreprocessor("notes", "*", (data, content) => {
    content = content.replace(/\(notes?\s*:\s*"(.*?)"\s*\)/gs, "^[$1]");
    return content;
  });

  eleventyConfig.addTransform("invisibleSpaces", function (content, outputPath) {
      if (!outputPath || !outputPath.endsWith(".html")) {
        return content;
      }

      return content
        .replace(/\u00A0/g, '<span class="non-breaking-space">&nbsp;</span>')
        .replace(/\u202F/g, '<span class="narrow-no-break-space">\u202F</span>')
        .replace(/\u2009/g, '<span class="thin-space">&thinsp;</span>')
        .replace(/\u200A/g, '<span class="hair-space">&hairsp;</span>');
    }
  );

  // transformation APRES le rendu markdown cela concerne donc
  // dans cette configuration, ./index.html et ./print/index.html
  //
  // tous les fichiers .md sont rendus dans une page unique
  // mais chaque fichier .md remet le compteur de notes à zero
  // c'est pourquoi les notes ont besoin d'être renumérotées, de 1 à x
  // pour éviter d'avoir plusieurs notes, dans la même page (index.html), avec le même id
  //
  // pour la version ./print/index.html
  // pagedjs demande une écriture particulière (<span class="footnotes">...</span>)
  // le script "assets/js/print/footNotes.js"
  // remettra le rendu de ces notes markdown, en notes compatibles pour pagedjs
  // ouf !!!!

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
