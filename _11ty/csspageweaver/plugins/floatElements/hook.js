/**
 * @name Float elements
 * @file This file make add full float element possibilities
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://jsdoc.app/about-getting-started }
 */

import { Handler } from "../../../lib/paged.esm.js";
import * as csstree from '../../../lib/csstree.min.js';

export class floatElems extends Handler {
  constructor(chunker, polisher, caller) {
      super(chunker, polisher, caller);
      this.selectorBottom = new Set();
      this.selectorTop = new Set();
      this.selectorNextPage = new Set();
      this.nextPageElem = new Set();
      this.nextPageElemTemp = new Set();
  }


  // Function to build the CSS selector from the element and its parents
  buildCssSelector(element) {
    let selector = [];
    let current = element;

    while (current) {
      if (current.classList && current.classList.contains('pagedjs_page_content')) {
        break; // Stop if the parent with class 'pagedjs_page_content' is found
    }

        let currentSelector = current.nodeName.toLowerCase();

        if (current.id) {
            currentSelector += `[data-id="${current.id}"]`;
        }

        if (current.className) {
            currentSelector += `.${current.className.split(' ').join('.')}`;
        }

        selector.unshift(currentSelector);
        current = current.parentNode;
    }

    selector = selector.join(' > ');
    // selector = selector.replace(/#document-fragment( > )?/g, ''); // Clean the CSS selector by removing '#document-fragment'

    return selector;
  }


  onDeclaration(declaration, dItem, dList, rule) {
      // Read customs properties
      if (declaration.property == "--pagedjs-float-elem") {
        // get selector of the declaration (NOTE: need csstree.js)
        let selector = csstree.generate(rule.ruleNode.prelude);
        // Push selector in correct set 
        if(declaration.value.value.includes("bottom")) {
          this.selectorBottom.add(selector);
        }else if(declaration.value.value.includes("top")) {
          this.selectorTop.add(selector);
        }else if(declaration.value.value.includes("next-page")) {
          this.selectorNextPage.add(selector);
        }
      }
   
  }


  afterParsed(parsed){
      // bottom
      for (let item of this.selectorBottom) {
          let elems = parsed.querySelectorAll(item);
          for (let elem of elems) {
              elem.classList.add("float-elem_bottom");
          }
      }

      // top
      for (let item of this.selectorTop) {
          let elems = parsed.querySelectorAll(item);
          for (let elem of elems) {
              elem.classList.add("float-elem_top");
          }
      }
      

      // next-page
      for (let item of this.selectorNextPage) {
        let elems = parsed.querySelectorAll(item);
        for (let elem of elems) {
            console.log(elem)
            elem.classList.add("float-elem_next-page");
        }
      }
  } 



afterPageLayout(pageElement, page, breakToken){

  // TOP (positionning)
  let floatTopPage = pageElement.querySelector(".float-elem_top");
  if(floatTopPage){
    let selector = this.buildCssSelector(floatTopPage.parentNode);
    parent = pageElement.querySelector(selector)
    parent.insertBefore(floatTopPage, parent.firstChild);
  }

  // BOTTOM (positionning)
  let floatBottomPage = pageElement.querySelector(".float-elem_bottom");
  if(floatBottomPage){
    let selector = this.buildCssSelector(floatBottomPage.parentNode);
    parent = pageElement.querySelector(selector);
    parent.insertBefore(floatBottomPage, parent.firstChild);
    floatBottomPage.style.position = "absolute";
    floatBottomPage.style.bottom = "0px";
  }

  // NEXT PAGE (positionning into parent section)
  for (let elem of this.nextPageElemTemp) {
    let parent = pageElement.querySelector(elem.parentSelector);
    let node = elem.elem;
    if(parent){
      parent.insertBefore(node, parent.firstChild);
    }
  }
  this.nextPageElemTemp.clear();
  

}




  // NEXT PAGE (pass to next page) -------------------
  renderNode(clone, node) {
    if (node.nodeType == 1 && node.classList.contains("float-elem_next-page")) {
      clone.remove();
      this.nextPageElem.add({ elem: node, parentSelector: this.buildCssSelector(node.parentNode) });
    }
  } 

  onPageLayout(page, Token, layout) {
    for (let elem of this.nextPageElem) {
      page.insertBefore(elem.elem, page.firstChild);
      this.nextPageElemTemp.add(elem);
    }
    this.nextPageElem.clear();
  }

  
}
