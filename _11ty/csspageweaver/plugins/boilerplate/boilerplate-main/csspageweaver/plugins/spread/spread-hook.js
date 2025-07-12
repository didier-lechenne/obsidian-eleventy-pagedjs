import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class nrbPages extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  afterPageLayout(pageElement, page, breakToken) {

    let nbrSpan = document.querySelector("#nrb-pages");
    let pagesDocument = document.querySelectorAll(".pagedjs_page");
    if (nbrSpan) {
      nbrSpan.innerHTML = pagesDocument.length;
    }
  }
  
  afterRendered(pages){
    let nbrSpan = document.querySelector("#nrb-pages");
    if (nbrSpan) {
      nbrSpan.innerHTML = pages.length;
    }
  }

}