export function textColPlugin(turndownService) {
  turndownService.addRule("textCol", {
    filter: function (node) {
      return node.nodeName === "DIV" && node.classList.contains("textCol");
    },
    replacement: function (content, node) {
      let processedContent = content;
      let innerHTML = node.innerHTML;
      let breakRegex = /<span[^>]*breakcolumn[^>]*><\/span>\s*(\w+)/g;
      let match;
      while ((match = breakRegex.exec(innerHTML)) !== null) {
        let wordAfter = match[1];
        processedContent = processedContent.replace(
          wordAfter,
          `\n<breakcolumn>\n${wordAfter}`
        );
      }

      const gridCol = node.style.getPropertyValue("--grid-col") || "12";
      const gridColGutter = node.style.getPropertyValue("--grid-col-gutter") || "";

      let attributes = `gridCol="${gridCol}"`;
      if (gridColGutter) {
        attributes += ` gridColGutter="${gridColGutter}"`;
      }

      return `<textCol ${attributes}>\n${processedContent}\n</textCol>`;
    },
  });
}