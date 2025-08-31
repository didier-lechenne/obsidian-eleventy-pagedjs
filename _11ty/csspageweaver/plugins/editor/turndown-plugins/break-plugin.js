export function breakPlugin(turndownService) {

  turndownService.addRule("breakcolumn", {
    filter: function (node, options) {
      return node.nodeName === "DIV" && node.classList.contains("breakcolumn");
    },
    replacement: function (content, node) {
      return `<breakcolumn>`;
    },
  });

  turndownService.addRule("breakpage", {
    filter: function (node) {
      return node.nodeName === "BR" && node.classList.contains("breakpage");
    },
    replacement: function (content, node) {
      return `<breakpage>`;
    },
  });
}