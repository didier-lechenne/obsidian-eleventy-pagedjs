// breakcolumn-specific.js
export function breakColumnPlugin(turndownService) {
 turndownService.addRule("breakcolumn", {
    filter: function (node) {
      return node.nodeName === "DIV" && node.classList.contains("breakcolumn");
    }, 
  replacement: function() {
    return "<breakcolumn>";
  }
});
}