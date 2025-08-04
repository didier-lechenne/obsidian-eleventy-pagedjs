// spread variables ----------------------------------------
class vizStuff extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.fullPageEls = new Set();
    this.usedPagedEls = new Set();
  }

  renderNode(clone, node) {
    if (node.nodeType == 1 && node.tagName === "CANVAS") {
      if (!node.dataset || !node.dataset.script)
        throw "Missing data-script attr !";

      var script = document.createElement("script");
      script.onload = function () {};
      script.src = node.dataset.script;
      node.insertAdjacentElement("afterend", script);
      // get

      clone.style.width = node.getAttribute("width");
      clone.style.height = node.getAttribute("height");
    }
  }

  afterPageLayout(pageElement, page, breakToken, chunker) {}
}
Paged.registerHandlers(vizStuff);
