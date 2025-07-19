import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class nrbPages extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

    afterRendered(pages) {
        // Appliquer les couleurs après le rendu
        const sectionsWithBgColor = document.querySelectorAll('[data-bg-color]');
        
        sectionsWithBgColor.forEach(section => {
            const bgColor = section.getAttribute('data-bg-color');
            const pageElement = section.closest('.pagedjs_blankpage_page');
            
            if (pageElement && bgColor) {
                pageElement.style.setProperty('--bgColor', bgColor);
            }
        });
    }
  


}




