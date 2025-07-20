/**
 * @name Inline Notes
 * @author Julien Bidoret
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see link https://gitlab.com/csspageweaver/plugins/inlineNotes
 */

import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class inlineNotes extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.input = cssPageWeaver.features.inlineNotes.parameters?.input || ".footnote-ref"; // ← CSS selector of the call element 
    this.containerNotes = cssPageWeaver.features.inlineNotes.parameters?.containerNotes || "#footnotes"; // ← CSS selector of the container of the footnote
    this.newClass = cssPageWeaver.features.inlineNotes.parameters?.newClass || "footnote"; // ← Class of the span create for the note
  }

  beforeParsed(content) {

    inlineNotesHandler({
        content: content,
        input: this.input,
        containerNotes: this.containerNotes,
        type: this.newClass
    });

  }


}



function inlineNotesHandler(params){

  let content = params.content;
  let input = params.input;
  let type = params.type;
  
  createNotes(content, input, type);

   let noteContainer = content.querySelector(params.containerNotes);
   if(noteContainer){
      noteContainer.remove();
   }

}


function getBlocks(element){
   return element.querySelectorAll('div,p,blockquote,section,article,h1,h2,h3,h4,h5,h6,figure');
}

// get only inline-level tags
function unwrapBlockChildren(element) {
   let blocks = getBlocks(element);
   
   blocks.forEach(block => {
       block.insertAdjacentHTML("beforebegin", block.innerHTML);
       block.remove();
   });
   let remainingblocks = getBlocks(element);
   if(remainingblocks.length) unwrapBlockChildren(element);
   return element;
}


function createNotes(content, input, type){

   let calls = content.querySelectorAll(input);
   calls.forEach( (call, index) => {

       // Trouver l'élément <a> dans call
       let linkElement = call.querySelector("a");
       if (!linkElement) {
           console.warn('Aucun élément <a> trouvé dans:', call);
           return;
       }

       // Obtenir l'attribut href
       let href = linkElement.getAttribute('href');
       if (!href) {
           console.warn('Élément <a> sans href:', linkElement);
           return;
       }

       // Chercher l'élément footnote dans tout le document content
       let note;
       try {
           note = content.querySelector(href); // ← Utiliser content, pas call
       } catch (error) {
           console.warn('Sélecteur invalide:', href, error);
           return;
       }

       if (!note) {
           console.warn('Élément footnote introuvable pour:', href);
           return;
       }

       let back = note.querySelector(".footnote-backref");
       if(back){
          back.remove();
       }
      
       let inline_note = document.createElement('span');
       inline_note.className = type;
       let num = index + 1;
       inline_note.dataset.counterNote = num;

       inline_note.innerHTML = unwrapBlockChildren(note).innerHTML;
       call.after(inline_note);

       call.parentElement.removeChild(call);

   })
  
}