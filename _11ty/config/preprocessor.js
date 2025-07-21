module.exports = function (eleventyConfig) {
  let globalImageCounter = 0;

  eleventyConfig.on("eleventy.before", () => {
    globalImageCounter = 0;
  });

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

    content = content.replace(/<breakpage>/gi, '<br class="breakpage">');

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


};
