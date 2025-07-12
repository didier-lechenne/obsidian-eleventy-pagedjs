
const config = require('./siteData.js');

module.exports = function (eleventyConfig) {
  // Collection PRINT (pour ?print et ?print&layout)
  eleventyConfig.addCollection("printPages", (collectionApi) => {
    const result = collectionApi
      .getFilteredByGlob(config.publicFolder + '/*.md')
      .filter((item) => !item.data.draft)
      .filter((item) => !item.inputPath.endsWith("z_indexPrint.md"))
      .filter((item) => !item.inputPath.endsWith("z_indexScreen.md"))
      .filter((item) => {
        const show = item.data.show;
        return show === "print" || show === "all" || !show;
      })
    .sort((a, b) => {
      const getNumber = (item) => {
        const num = parseInt(item.fileSlug);
        return isNaN(num) ? 999 : num;  // ← Utilise isNaN() au lieu de ||
      };
      
      const numA = getNumber(a);
      const numB = getNumber(b);
      return numA - numB;
    });

    return result;
  });

  // Collection SCREEN (pour ?screen et ?screen&layout)
  eleventyConfig.addCollection("screenPages", (collectionApi) => {
    const result = collectionApi
      .getFilteredByGlob(config.publicFolder + '/*.md')
      .filter((item) => !item.data.draft)
      .filter((item) => !item.inputPath.endsWith("z_indexScreen.md"))
      .filter((item) => !item.inputPath.endsWith("z_indexPrint.md"))
      .filter((item) => {
        const show = item.data.show;
        return show === "screen" || show === "all" || !show;
      })
    .sort((a, b) => {
      const getNumber = (item) => {
        const num = parseInt(item.fileSlug);
        return isNaN(num) ? 999 : num;  // ← Utilise isNaN() au lieu de ||
      };
      
      const numA = getNumber(a);
      const numB = getNumber(b);
      return numA - numB;
    });

    return result;
  });

  // eleventyConfig.addCollection("contentPages", (collectionApi) => {
  //   return collectionApi
  //     .getFilteredByGlob("content/text/*.md")
  //     .filter((item) => !item.data.draft)
  //     .filter((item) => !item.inputPath.endsWith("z_index.md"))
  //     .sort((a, b) => {
  //       if (a.data.order < b.data.order) {
  //         return -1;
  //       } else {
  //         return 1;
  //       }
  //     });
  // });

  // eleventyConfig.addCollection("blog", function (collectionApi) {
  //   return collectionApi
  //     .getFilteredByGlob("content/text/blog/*.md")
  //     .filter((item) => !item.data.draft)
  //     .sort((a, b) => b.date - a.date);
  // });
};
