const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItAttrs = require("markdown-it-attrs");
const markdownItSup = require("markdown-it-sup");
const markdownItMark = require("markdown-it-mark");
const markdownItAbbr = require("markdown-it-abbr");
const markdownItContainer = require("markdown-it-container");
// const markdownItFigures = require("markdown-it-image-figures");

const string = require("string");

let globalNoteCounter = 0;

module.exports = function (eleventyConfig) {
  eleventyConfig.on("eleventy.before", () => {
    globalNoteCounter = 0;
  });

  // Markdown config
  let options = {
    html: true,
    breaks: true,
    linkify: false,
    typographer: true,
  };

  var md = markdownIt(options);

  // letzgo
  md.use(markdownItFootnote)
    .use(markdownItAbbr)
    .use(markdownItSup)
    .use(markdownItMark)
    .use(markdownItContainer, "columns")
    .use(markdownItContainer, "breakcolumn") 
    .use(markdownItContainer, "content")
    .use(markdownItContainer, "items")
    .use(markdownItContainer, "insert")
    .use(markdownItContainer, "modularGrid")
    .use(markdownItContainer, "details", {
      validate: function (params) {
        return params.trim().match(/^details\s+(.*)$/);
      },
      render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(/^details\s+(.*)$/);
        if (tokens[idx].nesting === 1) {
          return (
            "<details><summary>" + md.utils.escapeHtml(m[1]) + "</summary>\n"
          );
        } else {
          return "</details>\n";
        }
      },
    })
    // .use(markdownItFigures, {
    //   dataType: false,
    //   figcaption: true,
    //   keepAlt: true,
    //   lazyLoading: true,
    //   link: false,
    //   tabindex: false,
    //   copyAttrs: true,
    // })
    .use(markdownItAttrs, {
      allowedAttributes: ["id", "class", "style"],
    });

  // markdownify filter to parse frontmatter stuff
  eleventyConfig.addFilter("markdownify", (markdownString) =>
    md.render(markdownString ?? "")
  );

  eleventyConfig.setLibrary("md", md);
};
