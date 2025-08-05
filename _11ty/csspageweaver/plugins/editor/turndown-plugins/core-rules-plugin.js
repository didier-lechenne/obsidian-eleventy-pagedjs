export function coreRulesPlugin(turndownService) {
  // Override des règles de base pour garder certains éléments
turndownService.keep(function (node) {
  return (
    (node.nodeName === "SPAN" && node.style.getPropertyValue("--ls")) ||
    (node.nodeName === "SPAN" && node.classList.contains("breakcolumn")) ||
    node.nodeName === "SUP" ||
    (node.nodeName === "BR" &&
      (node.classList.contains("breakpage") ||
        node.classList.contains("breakcolumn") ||
        node.classList.contains("breakscreen") ||
        node.classList.contains("breakprint"))) ||
    // Ajout pour <breakpage>
    (node.nodeName === "BREAKPAGE") ||
    (node.nodeName === "BREAKCOLUMN") ||
    (node.nodeName === "BREAKSCREEN") ||
    (node.nodeName === "BREAKPRINT")
  );
});

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
    ];

    return customEscapes.reduce(function (accumulator, escape) {
      return accumulator.replace(escape[0], escape[1]);
    }, string);
  };
}