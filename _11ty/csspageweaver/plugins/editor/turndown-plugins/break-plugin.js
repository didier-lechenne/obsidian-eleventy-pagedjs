export function breakPlugin(turndownService) {

  turndownService.addRule("breakpage", {
    filter: function (node) {
      return node.nodeName === "BR" && node.classList.contains("breakpage");
    },
    replacement: function (content, node) {
      return `<breakpage>`;
    },
  });
}