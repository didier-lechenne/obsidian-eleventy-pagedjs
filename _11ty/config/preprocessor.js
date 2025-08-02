module.exports = function (eleventyConfig) {
  let globalImageCounter = 0;

  eleventyConfig.on("eleventy.before", () => {
    globalImageCounter = 0;
  });

    eleventyConfig.addPreprocessor("break", "*", (data, content) => {
    content = content.replace(
      /<br\s+class=["']breakcolumn["'](\s*\/?)>/gi,
      '<span class="breakcolumn">BREAK</span>'
    );

    content = content.replace(
      /<breakcolumn>/gi,
      '<span class="breakcolumn">BREAK</span>'
    );

//     content = content.replace(/<breakpage>/gi, '<br class="breakpage">');

    return content;
  });

 eleventyConfig.addPreprocessor("textCol", "*", (data, content) => {
    // Transforme <textCol gridCol="12" gridColGutter="3mm"></textCol>
    // en HTML avec classes CSS appropriées
    
    content = content.replace(
      /<textCol\s+([^>]*?)>(.*?)<\/textCol>/gs,
      (match, attributes, innerContent) => {
        // Extraction des attributs
        const gridColMatch = attributes.match(/gridCol=["']([^"']+)["']/);
        const gridColGutterMatch = attributes.match(/gridColGutter=["']([^"']+)["']/);
        
        const gridCol = gridColMatch ? gridColMatch[1] : "12";
        const gridColGutter = gridColGutterMatch ? gridColGutterMatch[1] : "0";
        
        // Construction du style avec variables CSS
        let style = `style="--grid-col: ${gridCol};`;
        if (gridColGutter !== "0") {
          style += `--grid-col-gutter: ${gridColGutter};`;
        }
        style += `"`;
        
        return `<span ${style} data-editable class="marker textCol">${innerContent}</span>`;
      }
    );
    
    return content;
  });
  

  eleventyConfig.addPreprocessor("notes", "*", (data, content) => {
    content = content.replace(/\(notes?\s*:\s*"(.*?)"\s*\)/gs, "^[$1]");
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

 


};
