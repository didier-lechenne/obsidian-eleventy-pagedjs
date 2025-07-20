const config = require("./siteData.js");
const markdownIt = require("markdown-it");


module.exports = function (eleventyConfig) {
  const md = markdownIt({ 
    html: true, 
    typographer: true 
  });

let globalImageCounter = 0;


eleventyConfig.on('eleventy.before', () => {
  globalImageCounter = 0;
});



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
  eleventyConfig.addPreprocessor("imageCustom", "*", (data, content) => {
    return content.replace(
      /\(\s*image\s*:\s*(.+?)\s+caption\s*:\s*"([^"]*?)"\s*\)/g,
      
      function (match, src, caption) {
        globalImageCounter++;

        // Nettoyer le src en supprimant les espaces en trop
        const cleanSrc = src.trim();

        const figcaptionHtml =
          caption && caption.trim()
            ? `<figcaption class="figcaption">${md.renderInline(caption)}</figcaption>`
            : "";

        return `<figure id="image-${globalImageCounter}" class="figure image">
        <img src="${cleanSrc}" alt="${caption || ""}">
        ${figcaptionHtml}
      </figure>`;
      }
    );
  });

  // 3. Transformer (notes: "...") en notes markdown
  eleventyConfig.addPreprocessor("notes", "*", (data, content) => {
    content = content.replace(/\(notes?\s*:\s*"(.*?)"\s*\)/gs, "^[$1]");
    return content;
  });

  eleventyConfig.addPreprocessor("breakcolumn", "*", (data, content) => {
    return content.replace(
      /<br\s+class=["']breakcolumn["'](\s*\/?)>/gi,
      '<span class="breakcolumn"></span>'
    );
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

      return content
        .replace(
          /\u00A0/g,
          '<span class="i_space non-breaking-space">&nbsp;</span>'
        )
        .replace(
          /\u202F/g,
          '<span class="i_space narrow-no-break-space">\u202F</span>'
        )
        .replace(/\u2009/g, '<span class="i_space thin-space">&thinsp;</span>')
        .replace(/\u200A/g, '<span class="i_space hair-space">&hairsp;</span>');
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




