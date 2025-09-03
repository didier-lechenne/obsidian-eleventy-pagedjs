export function breakPlugin(turndownService) {
  turndownService.addRule("breakpage", {
    filter: function (node) {
      return node.nodeName === "BR" && node.classList.contains("breakpage");
    },
    replacement: function (content, node) {
      return "\n\n<breakpage />\n\n";
    },
  });

  turndownService.addRule("breakcolumn", {
    filter: function (node) {
      return node.nodeName === "HR" && node.classList.contains("breakcolumn");
    },
    replacement: function (content, node) {
      return "\n\n<breakcolumn />\n\n";
    },
  });




}
