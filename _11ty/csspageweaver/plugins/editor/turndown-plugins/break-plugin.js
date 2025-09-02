export function breakPlugin(turndownService) {
  turndownService.addRule("breakpage", {
    filter: function (node) {
      return node.nodeName === "BR" && node.classList.contains("breakpage");
    },
    replacement: function (content, node) {
      return "\n<breakpage>\n";
    },
  });

  turndownService.remove(function (node) {
    return node.nodeName === "DIV" && node.classList.contains("breakcolumn");
  });

  turndownService.addRule("breakcolumn", {
    filter: function (node) {
      console.log("Testing breakcolumn:", node.nodeName, node.className);
      return node.nodeName === "DIV" && node.classList.contains("breakcolumn");
    },
    replacement: function (content, node) {
      console.log("Rule breakcolumn triggered!", node);
      return "\n<breakcolumn>\n";
    },
  });
}
