const config = require("./siteData.js");

module.exports = function (eleventyConfig) {

  eleventyConfig.addCollection("printPages", (collectionApi) => {
    const result = collectionApi
      .getFilteredByGlob([
        config.publicFolder + "/*.md",           
        config.publicFolder + "/templates/*.md"  
      ])
      .filter((item) => !item.data.draft)
      .filter((item) => !item.data.show || item.data.show === "print")
      .sort((a, b) => {
        const numA = parseInt(a.fileSlug) || 999;
        const numB = parseInt(b.fileSlug) || 999;
        return numA - numB;
      });

    return result;
  });

  eleventyConfig.addCollection("screenPages", (collectionApi) => {
    const result = collectionApi
      .getFilteredByGlob([
        config.publicFolder + "/*.md",           
        config.publicFolder + "/templates/*.md"  
      ])
      .filter((item) => !item.data.draft)
      .filter((item) => !item.data.show || item.data.show === "web")
      .sort((a, b) => {
        const numA = parseInt(a.fileSlug) || 999;
        const numB = parseInt(b.fileSlug) || 999;
        return numA - numB;
      });
      
    return result;
  });
};
