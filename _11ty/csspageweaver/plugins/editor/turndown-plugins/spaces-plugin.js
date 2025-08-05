export function spacesPlugin(turndownService) {
  turndownService.addRule("removeSpaceSpans", {
    filter: function (node) {
      return node.nodeName === "SPAN" && node.className.includes("i_space");
    },
    replacement: function (content) {
      return content;
    },
  });

}