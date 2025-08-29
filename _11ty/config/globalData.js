module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("eleventyComputed", {
    //  SINGLE PAGE
    permalink: (data) => {
      if (data.page.inputPath.endsWith("print.md")) {
        return data.permalink;
      }
      if (data.page.inputPath.endsWith("screen.md")) {
        return data.permalink;
      }
      if (data.page.inputPath.endsWith(".md")) {
        return false;
      }
      return data.permalink;
    },
  });
};