export function spacesPlugin(turndownService) {
  turndownService.addRule("removeSpaceSpans", {
    filter: function (node) {
      return node.nodeName === "SPAN" && node.className.includes("i_space");
    },
    replacement: function (content) {
      return content;
    },
  });

  turndownService.addRule("lineBreak", {
    filter: function(node) {
      // Seulement les BR avec des classes spécifiques, pas tous les BR
      return node.nodeName === "BR" && (
        node.className ||  // BR avec classes
        node.hasAttribute('data-ref') ||  // BR identifiés
        node.parentNode.className.includes('paged-editor-content') // BR dans éléments éditables
      );
    },
    replacement: function (content, node) {
      // Si c'est un breakpage, ne pas ajouter de \n
      if (node.className.includes('breakpage')) {
        return '<breakpage>';
      }
      return " <br/>\n";
    },
  });
}