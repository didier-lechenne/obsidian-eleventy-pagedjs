module.exports = function (eleventyConfig) {
  let globalImageCounter = 0;

  eleventyConfig.on("eleventy.before", () => {
    globalImageCounter = 0;
  });

  eleventyConfig.addTransform(
    "invisibleSpaces",
    function (content, outputPath) {
      if (!outputPath || !outputPath.endsWith(".html")) {
        return content;
      }

      
      content = content.replace(
        /\u00A0/g,
        '<span class="i_space no-break-space">&nbsp;</span>'
      );

      content = content.replace(
        /\u202F/g,
        '<span class="i_space no-break-narrow-space">\u202F</span>'
      );

      content = content.replace(
        /\u2009/g,
        '<span class="i_space thin-space">&thinsp;</span>'
      );

      content = content.replace(
        /\u200A/g,
        '<span class="i_space hair-space">&hairsp;</span>'
      );

      return content;
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
