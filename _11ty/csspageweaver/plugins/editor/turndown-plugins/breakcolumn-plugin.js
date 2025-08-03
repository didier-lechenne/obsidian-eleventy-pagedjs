export function breakColumnPlugin(turndownService) {
  turndownService.addRule("breakcolumn", {
    filter: function (node) {
      return node.nodeName === "SPAN" && node.classList.contains("breakcolumn");
    },
    replacement: function (content, node) {
      return `<breakcolumn>`;
    },
  });
}