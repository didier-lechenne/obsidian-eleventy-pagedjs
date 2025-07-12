/**
 * @name Full page
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/fullPage }
 */
import { Handler } from '/csspageweaver/lib/paged.esm.js';


let bleedFull = '6mm';

export default class fullPage extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.selectorFullSpread = new Set();
    this.fullSpreadEls = new Set();
    this.selectorFullPage = new Set();
    this.fullPageEls = new Set();
    this.selectorFullRight = new Set();
    this.fullRightEls = new Set();
    this.selectorFullLeft= new Set();
    this.fullLeftEls = new Set();
    this.usedPagedEls = new Set();
    this.specificPage = new Set();
    this.specificPageClone = new Set();
  }



  onDeclaration(declaration, dItem, dList, rule) {
    // Read customs properties
    if (declaration.property == "--pagedjs-full-page") {
      // get selector of the declaration (NOTE: need csstree.js)
      let selector = csstree.generate(rule.ruleNode.prelude);
      // Push selector in correct set 
      if (declaration.value.value.includes("page")) {
        this.selectorFullPage.add(selector);
      }else if(declaration.value.value.includes("spread")) {
        this.selectorFullSpread.add(selector);
      }else if(declaration.value.value.includes("right")) {
        this.selectorFullRight.add(selector);
      }else if(declaration.value.value.includes("left")) {
        this.selectorFullLeft.add(selector);
      }else{
        let obj = { page: declaration.value.value, elem: selector };
        this.specificPage.add(JSON.stringify(obj));

      }
    }
  }

  afterParsed(parsed){

    console.log("FULL PAGE loaded");
 
    // ADD pagedjs classes to elements
    for (let item of this.selectorFullPage) {
      let elems = parsed.querySelectorAll(item);
      for (let elem of elems) {
        elem.classList.add("pagedjs_full-page-elem");
      }
    }
    for (let item of this.selectorFullSpread) {
      let elems = parsed.querySelectorAll(item);
      for (let elem of elems) {
        elem.classList.add("pagedjs_full-spread-elem");
      }
    }
    for (let item of this.selectorFullLeft) {
      let elems = parsed.querySelectorAll(item);
      for (let elem of elems) {
        elem.classList.add("pagedjs_full-page-left-elem");
      }
    }
    for (let item of this.selectorFullRight) {
      let elems = parsed.querySelectorAll(item);
      for (let elem of elems) {
        elem.classList.add("pagedjs_full-page-right-elem");
      }
    }


    // SPECIFIC PAGE ------------------------------------
    this.specificPage.forEach(entry => {
      const obj = JSON.parse(entry);
      const elements = parsed.querySelectorAll(obj.elem);
      if (elements.length > 0) {
        // pourquoi c’est ajouté même si l’élément n’existe pas ?
        elements[0].classList.add("pagedjs_full-page-specific");
        const clone = elements[0].cloneNode(true); 
        obj.elemClone = clone.outerHTML; 
        elements[0].remove();
      }
      this.specificPageClone.add(JSON.stringify(obj));
    });
    

  }


  renderNode(clone, node) {
    // FULL SPREAD
    // if you find a full page element, move it in the array
    if (node.nodeType == 1 && node.classList.contains("pagedjs_full-spread-elem")) {
      this.fullSpreadEls.add(node);
      this.usedPagedEls.add(node);

      // remove the element from the flow by hiding it.
      clone.style.display = "none";
    }

    // FULL PAGE
    if (node.nodeType == 1 && node.classList.contains("pagedjs_full-page-left-elem")) {
      this.fullLeftEls.add(node);
      this.usedPagedEls.add(node);
      clone.style.display = "none";
    }else if (node.nodeType == 1 && node.classList.contains("pagedjs_full-page-right-elem")) {
      this.fullRightEls.add(node);
      this.usedPagedEls.add(node);
      clone.style.display = "none";
    }else if (node.nodeType == 1 && node.classList.contains("pagedjs_full-page-elem")) {
      this.fullPageEls.add(node);
      this.usedPagedEls.add(node);
      clone.style.display = "none";
    }

  }

  afterPageLayout(pageElement, page, breakToken, chunker) {

    if(page.id == "page-1"){
      let allPages = document.querySelector(".pagedjs_pages");
      allPages.style.setProperty('--bleed-images',  bleedFull);
    }
    
    // ADD --pagedjs-fold on body if doesn't exist
    if(pageElement.classList.contains("pagedjs_first_page")){
      let body = document.getElementsByTagName("body")[0];
      let style = window.getComputedStyle(body);
      let fold = style.getPropertyValue('--pagedjs-fold');
      if(!fold){
        body.style.setProperty('--pagedjs-fold', '0mm')
      }
    }

    // FULL SPREAD
    // if there is an element in the fullSpreadEls Set, (goodbye arrays!)

    for (let img of this.fullSpreadEls) {

      if (page.element.classList.contains("pagedjs_right_page")) {

        let imgLeft;
        let imgRight;
        
        if (img.nodeName == "IMG") {
          /* Add outside + inside container if the element is an img */
          let containerLeft = document.createElement("div");
          containerLeft.classList.add("pagedjs_full-spread_container");
          let containerLeftInside = document.createElement("div");
          containerLeftInside.classList.add("pagedjs_full-spread_content");
          containerLeft.appendChild(containerLeftInside).appendChild(img);
          imgLeft = containerLeft;

          let containerRight = document.createElement("div");
          containerRight.classList.add("pagedjs_full-spread_container");
          let containerRightInside = document.createElement("div");
          containerRightInside.classList.add("pagedjs_full-spread_content");
          containerRight.appendChild(containerRightInside).appendChild(img.cloneNode(true));
          imgRight = containerRight;

        } else {
          /* Add outside container if the element is an img */
          let containerLeft = document.createElement("div");
          containerLeft.classList.add("pagedjs_full-spread_container");
          img.classList.add("pagedjs_full-spread_content");
          containerLeft.appendChild(img);
          imgLeft = containerLeft;
          let containerRight = document.createElement("div");
          containerRight.classList.add("pagedjs_full-spread_container");
          img.classList.add("pagedjs_full-spread_content");
          containerRight.appendChild(img.cloneNode(true));
          imgRight = containerRight;
          
        }

        // put the first element on the page
        let fullPage = chunker.addPage();
        fullPage.element
          .querySelector(".pagedjs_page_content")
          .insertAdjacentElement("afterbegin", imgLeft);
        fullPage.element.classList.add("pagedjs_page_fullLeft");

        // page right
        let fullPageRight = chunker.addPage();
        fullPageRight.element
          .querySelector(".pagedjs_page_content")
          .insertAdjacentElement("afterbegin", imgRight);
        fullPageRight.element.classList.add("pagedjs_page_fullRight");
        img.style.removeProperty("display");

        this.fullSpreadEls.delete(img);
        
      }
    }


    // FULL PAGE
    // if there is an element in the fullPageEls Set
    for (let img of this.fullPageEls) {
      let container = document.createElement("div");
        container.classList.add("pagedjs_full-page_content");
        container.appendChild(img);
      let fullPage = chunker.addPage();

      fullPage.element
        .querySelector(".pagedjs_page_content")
        .insertAdjacentElement("afterbegin", container);
      fullPage.element.classList.add("pagedjs_page_fullPage");
      img.style.removeProperty("display");

      this.fullPageEls.delete(img);
    }

    // FULL Left PAGE
    // if there is an element in the fullLeftEls Set
    for (let img of this.fullLeftEls) {

      if (page.element.classList.contains("pagedjs_right_page")) {
        let container = document.createElement("div");
          container.classList.add("pagedjs_full-page_content");
          container.appendChild(img);
        let fullPage = chunker.addPage();

        fullPage.element
          .querySelector(".pagedjs_page_content")
          .insertAdjacentElement("afterbegin", container);
        fullPage.element.classList.add("pagedjs_page_fullPage");
        img.style.removeProperty("display");

        this.fullLeftEls.delete(img);
      }
    }

    // FULL RIGHT PAGE
    // if there is an element in the fullRightEls Set
    for (let img of this.fullRightEls) {

      if (page.element.classList.contains("pagedjs_left_page")) {
        let container = document.createElement("div");
          container.classList.add("pagedjs_full-page_content");
          container.appendChild(img);
        let fullPage = chunker.addPage();

        fullPage.element
          .querySelector(".pagedjs_page_content")
          .insertAdjacentElement("afterbegin", container);
        fullPage.element.classList.add("pagedjs_page_fullPage");
        img.style.removeProperty("display");

        this.fullRightEls.delete(img);
      }
    }



    // SPECIFIC PAGE ------------------------------------
    let pageNum = pageElement.id.split('page-')[1];
    pageNum = parseInt(pageNum);
  
    this.specificPageClone.forEach(entry => {
      const obj = JSON.parse(entry);
      let targetedPage = obj.page;
      let prevPage = parseInt(targetedPage) - 1;

      let elem = obj.elemClone;

      if(prevPage == pageNum){
        let container = document.createElement("div");
          container.classList.add("pagedjs_full-page_content");
          container.innerHTML = elem;
          let fullPage = chunker.addPage();

          fullPage.element
            .querySelector(".pagedjs_page_content")
            .insertAdjacentElement("afterbegin", container);
          fullPage.element.classList.add("pagedjs_page_fullPage");
      }
    });
    

  }
}

