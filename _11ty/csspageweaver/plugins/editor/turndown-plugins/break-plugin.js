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

//   turndownService.addRule("breakcolumn", {
//     filter: function (node) {
//       const isBreakColumn =
//         node.nodeName === "DIV" && node.classList.contains("breakcolumn");
//       if (isBreakColumn) {
//         console.log("FOUND BREAKCOLUMN DIV!", node);
//         // Forcer le traitement même si vide
//         node.isBlank = false;
//       }
//       return isBreakColumn;
//     },
//     replacement: function (content, node) {
//       console.log("Rule breakcolumn triggered!", node);
//       return "\n<breakcolumn>\n";
//     },
//   });
}
