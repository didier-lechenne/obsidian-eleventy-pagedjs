export function typographyPlugin(turndownService) {
  // Small caps
  turndownService.addRule("smallcaps", {
    filter: function (node) {
      return node.nodeName === "SPAN" && node.classList.contains("small-caps");
    },
    replacement: function (content) {
      return `<smallcaps>${content}</smallcaps>`;
    },
  });

  // Letter spacing
  turndownService.addRule("letterSpacing", {
    filter: function (node) {
      return node.nodeName === "SPAN" && node.style.getPropertyValue("--ls") !== "";
    },
    replacement: function (content, node) {
      const lsValue = node.style.getPropertyValue("--ls");
      return `<span style="--ls:${lsValue}">${content}</span>`;
    },
  });

  // Superscript
  turndownService.addRule("superscript", {
    filter: "sup",
    replacement: function (content) {
      return `<sup>${content}</sup>`;
    },
  });
}