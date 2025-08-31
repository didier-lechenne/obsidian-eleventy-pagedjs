export function breakPlugin(turndownService) {

  turndownService.addRule("breakcolumn", {
    filter: function (node) {
      return node.nodeName === "DIV" && node.classList.contains("breakcolumn");
    },
    replacement: function () {
      return "<breakcolumn>";
    }
  }, { priority: "high" });  // Priorité élevée

  turndownService.addRule("breakpage", {
    filter: function (node) {
      return node.nodeName === "BR" && node.classList.contains("breakpage");
    },
    replacement: function (content, node) {
      return `<breakpage>`;
    },
  });
}