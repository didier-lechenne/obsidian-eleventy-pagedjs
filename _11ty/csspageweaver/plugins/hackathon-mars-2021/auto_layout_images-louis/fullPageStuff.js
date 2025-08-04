// spread variables ----------------------------------------
var classElemFullPage = "full-page";

class fullPageStuff extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.fullPageEls = new Set();
    this.usedPagedEls = new Set();
  }

  renderNode(clone, node) {
    if (node.nodeType == 1 && node.classList.contains(classElemFullPage)) {
      console.log(node);
      this.fullPageEls.add(node);
      this.usedPagedEls.add(node);
      clone.style.display = "none";
    }
  }

  afterPageLayout(pageElement, page, breakToken, chunker) {
    for (let img of this.fullPageEls) {
      let fullPage = chunker.addPage();
      fullPage.element
        .querySelector(".pagedjs_page_content")
        .insertAdjacentElement("afterbegin", img);
      this.fullPageEls.delete(img);
    }
  }
}
Paged.registerHandlers(fullPageStuff);
