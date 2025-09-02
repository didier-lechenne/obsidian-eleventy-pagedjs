export function breakPlugin(turndownService) {
  turndownService.addRule("breakpage", {
    filter: function (node) {
      return node.nodeName === "BR" && node.classList.contains("breakpage");
    },
    replacement: function (content, node) {
      return "\n<breakpage>\n";
    },
  });

turndownService.addRule("breakcolumn", {
  filter: function (node) {
    return node.nodeName === "DIV" && node.classList.contains("breakcolumn");
  },
  replacement: function (content, node) {
    // Clone le nœud pour éviter de modifier le DOM original
    const cleanNode = node.cloneNode(false);

    // Supprime tous les attributs `data-*`
    Array.from(cleanNode.attributes).forEach(attr => {
      if (attr.name.startsWith("data-")) {
        cleanNode.removeAttribute(attr.name);
      }
    });

    // Retourne la balise personnalisée
    return "\n<breakcolumn>\n";
  },
});




}
