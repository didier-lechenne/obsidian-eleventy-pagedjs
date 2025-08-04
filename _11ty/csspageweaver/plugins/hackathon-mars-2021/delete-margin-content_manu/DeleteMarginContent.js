const ELEMS_SELECT = ['.object', '#object-id']; /* ← list of the objects */

class DeleteMarginContent extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  afterPageLayout(page) {
    let elem = page.querySelectorAll(`${ELEMS_SELECT}`);
    if(elem.length){
      let page = elem[0].closest('.pagedjs_pagebox');
      let generatedContent = page.querySelectorAll(".hasContent");
      Array.prototype.forEach.call(generatedContent, remove);
    }

  }
}

Paged.registerHandlers(DeleteMarginContent);

function remove(e){
  e.remove();
}


