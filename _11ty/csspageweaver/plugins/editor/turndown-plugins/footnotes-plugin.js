export function footnotesPlugin(turndownService) {
  turndownService.addRule("footnoteCall", {
    filter: function (node) {
      return (
        node.nodeName === "A" &&
        node.classList.contains("footnote") &&
        node.hasAttribute("data-footnote-call")
      );
    },
    replacement: function (content, node) {
      const footnoteId = node.getAttribute("data-footnote-call") || node.getAttribute("data-ref");
      const footnoteContent = document.querySelector(`#note-${footnoteId}`);

      if (footnoteContent) {
        const noteMarkdown = window.mainTurndownService
          .turndown(footnoteContent.innerHTML)
          .replace(/\s+/g, " ")
          .trim();
        return `^[${noteMarkdown}]`;
      }

      return `^[Note ${footnoteId.substring(0, 8)}]`;
    },
  });

  turndownService.addRule("footnoteDefinition", {
    filter: function (node) {
      return (
        node.nodeName === "SPAN" &&
        node.classList.contains("footnote") &&
        node.hasAttribute("id") &&
        node.id.startsWith("note-")
      );
    },
    replacement: function () {
      return "";
    },
  });
}