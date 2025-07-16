const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const Image = require("@11ty/eleventy-img")
const path = require('path')

const fs = require("fs");

module.exports = function(eleventyConfig) {

  
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		// which file extensions to process
		extensions: "css,html",
		// Add any other Image utility options here:
		// optional, output image formats
		formats: ["webp", "jpeg"],
		// formats: ["auto"],
		// optional, output image widths
		widths: ["800", "400"],
		urlPath: "valentine/images/", 
		resolveUrls: true,   
		// optional, attributes assigned on <img> override these values.
		defaultAttributes: {
			sizes: "auto",
			loading: "lazy",
			// decoding: "async",
		},
		sharpOptions: {
			animated: true,
		},
	});

  // shortcode (should be unused)
  eleventyConfig.addShortcode("image", async function (src, alt, widths = [400, 800], sizes = "100vh") {
    widths = [400, 800]
    src = path.dirname(this.page.inputPath) + "/" + src;
		let metadata = await Image(src, {
			widths,
			formats: ["avif", "jpg"],
		});
		let imageAttributes = {
			alt,
			sizes,
			loading: "lazy",
			decoding: "async",
		};
		// You bet we throw an error on a missing alt (alt="" works okay)
		return Image.generateHTML(metadata, imageAttributes);
	});

	// no more used in gridlists
	eleventyConfig.addShortcode("icon", function (name) {
		return `<svg><use xlink:href="#svg-${name}"></use></svg>`;
	});

	// used in markdown files
	eleventyConfig.addNunjucksAsyncShortcode("inlineSvg", async url => {
    let options = {
      widths: [300],
      formats: ["svg"],
      svgShortCircuit: true
    };
    let stats = await Image(url, options);
    const svgUrl = stats.svg[0].url;

    const data = fs.readFileSync(`./${svgUrl}`, function(err, contents) {
      if (err) return err;
      return contents;
    });

    return `<figure class="svg">${ data.toString("utf8") }</figure>`;
  });
}