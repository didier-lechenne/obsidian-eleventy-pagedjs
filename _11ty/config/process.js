
  // transformation AVANT le rendu markdown
  // toutes les écritures (notes: "...") seront transformées en ^[...] (markdown inline notes)
  // un format markdown qui sera traité par eleventy
eleventyConfig.addPreprocessor("customInterlinker", "*", (data, content) => {
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Si la ligne est un titre markdown (commence par #)
    if (line.trim().match(/^#{1,6}\s/)) {
      // Utiliser un placeholder qui ne sera pas interprété par markdown
      return line.replace(/\[\[([^\]]+)\]\]/g, 'XXXXWIKISTART__$1__WIKIENDXXXX');
    }
    return line;
  });
  
  // content =  processedLines.join('\n');
  //   // 3. Transformer (notes: "...") en notes markdown
  //   content = content.replace(/\(notes?\s*:\s*"(.*?)"\s*\)/gs, '^[$1]');
  
  //   return content;
  });