/**
 * @name typeCraft
 * @author Didier Lechenne. <didier@lechenne.fr>
 * @see { @link  }
 */

import { Handler } from '/csspageweaver/lib/paged.esm.js';
import { typeCraft } from '/csspageweaver/plugins/typeCraft/typeCraft.js';

/*  */
export class PreparetypeCraft extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.parameters = cssPageWeaver.features.typeCraft || {}
  }

  addClassToBreaking(content){
    let brs = content.querySelectorAll("br")
    brs.forEach(br => {
      br.classList.add("canon")
    })
  }

  getPageAssetsLocation(){
    const pathname = window.location.pathname
    const index = pathname.lastIndexOf('/')
    const filename = pathname.substring(index + 1)
    const dotIndex = filename.lastIndexOf('.')
    const pagename = filename.substring(0, dotIndex)
    return pagename
  }
  
  assignEditableCapabilities(element) {
    element.setAttribute("contentEditable", false)
  }

  assignEditableIds(content) {
    const sections = content.querySelectorAll('section');
    let sectionCounter = 0;
    let idCounter = 0;
    let idPrefix = 'a';

    sections.forEach((section) => {
      idCounter = 0;
      idPrefix = String.fromCharCode(sectionCounter + 97);

      const selectors = '*:not(hgroup) p, *:not(hgroup) li, *:not(hgroup) h1, *:not(hgroup) h2, *:not(hgroup) h3, *:not(hgroup) h4, *:not(hgroup) h5, *:not(hgroup) h6'
      const targetElements = section.querySelectorAll(selectors);

      targetElements.forEach((element) => {
        idCounter++;
        const editableId = `${idPrefix}${idCounter}`;
        element.setAttribute('editable-id', editableId);
        this.assignEditableCapabilities(element)
      });

      sectionCounter++;
    });



  }


assignEditableIdsNotes(content) {
  const sections = content.querySelectorAll('.pagedjs_footnote_inner_content');
  let sectionCounter = 0;
  let idCounter = 0;
  let idPrefix = 'fn'; // Préfixe spécifique aux footnotes

  sections.forEach((section) => {
    idCounter = 0;
    idPrefix = `fn${String.fromCharCode(sectionCounter + 97)}`; // fn-a, fn-b, etc.

    const selectors = 'span.footnote';
    const targetElements = section.querySelectorAll(selectors);

    targetElements.forEach((element) => {
      idCounter++;
      const editableId = `${idPrefix}${idCounter}`;
      element.setAttribute('editable-id', editableId);
      this.assignEditableCapabilities(element);
    });

    sectionCounter++;
  });
}

  async beforeParsed(content) {
    // Canonise existing Breaking Point
    this.addClassToBreaking(content)

    // Assign ID to all editable element
    this.assignEditableIds(content)

  }
  async afterPageLayout(content) {
    this.assignEditableIdsNotes(content)
  }

}