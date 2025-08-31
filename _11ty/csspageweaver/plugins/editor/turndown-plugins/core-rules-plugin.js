export function coreRulesPlugin(turndownService) {
  // Override des règles de base pour garder certains éléments
  turndownService.keep(function (node) {
    return (
      (node.nodeName === "SPAN" && node.style.getPropertyValue("--ls")) ||
      (node.nodeName === "DIV" && node.classList.contains("breakcolumn")) ||
      node.nodeName === "SUP" ||
      node.nodeName === "BREAKPAGE" ||
      node.nodeName === "BREAKCOLUMN" ||
      node.nodeName === "BREAKSCREEN" ||
      node.nodeName === "BREAKPRINT"
    );
  });

//   turndownService.addRule("lineBreak", {
//     filter: "br",
//     replacement: function () {
//       return " <br>\n";
//     },
//   });

  // Custom escape function
  turndownService.escape = function (string) {
    var customEscapes = [
      [/\\/g, "\\\\"],
      [/\*/g, "\\*"],
      [/^-/g, "\\-"],
      [/^\+ /g, "\\+ "],
      [/^(=+)/g, "\\$1"],
      [/^(#{1,6}) /g, "\\$1 "],
      [/`/g, "\\`"],
      [/^~~~/g, "\\~~~"],
      [/^>/g, "\\>"],
      [/_/g, "\\_"],
      [/^(\d+)\. /g, "$1\\. "],
      [/(\s)(#)/g, "$1\\$2"],
      [/\[\[/g, "\\[\\["], // Échappe les crochets doubles ouvrants
      [/\]\]/g, "\\]\\]"], // Échappe les crochets doubles fermants
    ];

    return customEscapes.reduce(function (accumulator, escape) {
      return accumulator.replace(escape[0], escape[1]);
    }, string);
  };
}
