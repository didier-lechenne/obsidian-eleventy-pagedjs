const yaml = require("js-yaml");

module.exports = function (eleventyConfig) {
  
  // accept yaml as data 
  eleventyConfig.addDataExtension("yaml, yml", (contents) =>
    yaml.load(contents),
  );

};