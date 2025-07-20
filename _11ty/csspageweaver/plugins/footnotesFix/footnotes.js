/**
 * @name Footnotes
 * @file Reset the way footnote are counted
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/footnotesFix/ }
 */

import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class footnotes extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.parameters = cssPageWeaver.features.footnotesFix.parameters;
    this.reset = this.parameters?.reset ; 
    this.counter = 0;
    this.selector = this.parameters?.selector || ".footnote";
  }

  beforeParsed(content) {
   

    let notes = content.querySelectorAll(this.selector);
    notes.forEach(function (note, index) {
      note.classList.add("pagedjs_footnote");
    });


   
    if(this.reset){
      let elems = content.querySelectorAll(this.reset);        
      elems.forEach(function (elem, index) {
          var span = document.createElement('span');
          span.classList.add("reset-fix-footnote");
          span.style.position = "absolute";
          elem.insertBefore(span, elem.firstChild);
      });
    }else{
      console.log("[footnotesFix] no reset")
    }
   
  }


  afterPageLayout(pageElement, page, breakToken){

    if(this.reset){

      // reset on pages
      if(this.reset === "page"){
          this.counter = 0;  
      }

      // reset on specific element
      let newchapter = pageElement.querySelector('.reset-fix-footnote');
      if(newchapter){
          this.counter = 0;        
      }

      let footnotes = pageElement.querySelectorAll(".pagedjs_footnote_content [data-note]");
    
      let callnotes = pageElement.querySelectorAll('a.pagedjs_footnote');
      callnotes.forEach((call, index) => {

          this.counter = this.counter + 1; // increment
          let num = this.counter - 1;

          // update data-counter for call
          call.setAttribute('data-counter-footnote-increment', num);
          call.style.counterReset = "footnote " + num;

          // update data-counter for marker
          let footnote = footnotes[index];
          let dataCounter = num + 1;
          footnote.setAttribute('data-counter-note', dataCounter);
          footnote.style.counterReset = "footnote-marker " + num;

      });
    }
  }



}