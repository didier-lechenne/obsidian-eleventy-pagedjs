import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class myCustomHandler1 extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    beforeParsed(content){
        // let h2 = content.querySelectorAll('h2');
        // h2.forEach( h2 => {
        //     h2.insertAdjacentHTML("afterbegin", '🍄'); 
        // });
    }

    afterParsed(parsed) {
        console.info("%c [CSS Page Weaver] Example custom handler 1 with afterParsed hook (see js/custom-handler-example-1.js", 'color: green;');  
    }
  
}


