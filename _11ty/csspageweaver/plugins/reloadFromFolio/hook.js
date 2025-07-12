/** @file This reload a fragment of your document and CSS Also
 * 
 */ 

import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class reloadFromFolio extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    this.defaultParameters = {
      "parameters": {
        "reloading": false,
        "singlePage": false,
        "fromFolio": 1,
        "excludeHookFromReload": ["reloadInPlace"],
        "excludeScriptFromReload": []
      }
    }
    
    this.parameters = {...this.defaultParameters, ...cssPageWeaver.features.reloadFromFolio.parameters};


    // define timestamp
    this.timestamp = Date.now()
    
    // Define elements selectors
    this.pageContainer = cssPageWeaver_frame?.container.origin || undefined;
    this.stylesheets = []
  }

  beforeParsed(content){
    // If reload active
    if (this.parameters.reloading && cssPageWeaver_frame) {

      // Get pagedJs Container
      this.allPages_container = this.pageContainer.querySelector('.pagedjs_pages');
      
      // Update firstGen container selector
      this.firstGenPages = this.allPages_container.querySelectorAll(`.pagedjs_page:not([data-reload-at="${this.timestamp}"])`);
      this.firstGenPages_count = this.firstGenPages.childElementCount;
      this.firstGenPages_array = Array.from(this.firstGenPages);

      // Remove old stylesheets
      this.removeStyle()
      // Append newly reloaded ones
      this.stylesheets.forEach(s => {
        document.querySelector('head').appendChild(s)
      })

    }
  }

  afterTreeWalk(ast, sheet){
    if (this.parameters.reloading && cssPageWeaver_frame) {
      let stylesheetEl = this.createStyle(sheet._text)
      this.stylesheets.push(stylesheetEl)
    }
  }

  afterPageLayout(pageElement, page, breakToken) {
    if (this.parameters.reloading && cssPageWeaver_frame) {
        
      // Add timestape to page
      pageElement.setAttribute('data-reload-at', this.timestamp)

      const index = parseInt(pageElement.dataset.pageNumber);

      // If page folio is in valid range, insert pages
      if (this.isIndexOnRange(index)) {
        // Remove the old version of the page if exist
        const pageToReplace = this.getPageByNumber(index)
        pageToReplace?.remove();

        // Insert Page at position
        this.insertPage(pageElement, index)
      }
    }
  }

  afterRendered(pages) {
    if (this.parameters.reloading && cssPageWeaver_frame) {

      // Update lastGen container selector
      this.lastGenPages = this.pageContainer.querySelectorAll(`.pagedjs_pages:last-of-type:not(:first-of-type) .pagedjs_page[data-reload-at="${this.timestamp}"]`)
      this.lastGenPages_count = this.lastGenPages.length;
      this.lastGenPages_array = Array.from(this.lastGenPages);

      // Remove excess pages if needed
      this.removeExcedingPages();

      // Remove 
      this.lastGenPages[0].parentNode.remove()

      // Update the page number in the Spread module if needed
      cssPageWeaver.querySelector('#nrb-pages').textContent = this.lastGenPages_count;

      // Close the reload process
      this.parameters.reloading = false;
    }
  }

  isIndexOnRange(index){

    // Retrieve key parameters from user interaction and/or config.json 
    const { fromFolio, isOnly } = this.parameters;
    // If One Page reload, set end index same as starting one
    const toFolio = isOnly ? fromFolio : Infinity;
    return index >= fromFolio && index <= toFolio
  }

  insertPage(pageElement, index){
    // Clone page
    let pageElementClone = pageElement.cloneNode(true)

    // Select following page
    const followingPage = this.getPageByNumber(index + 1)
    
    // Insert new page
    if (followingPage) {
      // Insert the cloned page before the following page
      this.allPages_container.insertBefore(pageElementClone, followingPage);
    } else {
      // If no following page, insert the cloned page at the end
      this.allPages_container.insertAdjacentElement('beforeend', pageElementClone);
    }
  }

  getPageByNumber(n){
    let selector = `[data-page-number="${n}"]:not([data-reload-at="${this.timestamp}"])`
    return this.allPages_container.querySelector(selector);
  } 


  /**
   * Removes excess pages from the existing container if the new container has fewer pages.
   */
  removeExcedingPages() {

      // If child length difference between containers
      if (this.lastGenPages_count < this.firstGenPages_count) {
          console.log('a')
          // Remove excess pages from the existing container
          for (let i = lastGenPages_count + 1; i <= firstGenPages_count; i++) {
          console.log('b')
              this.firstGenPages.querySelector(`[data-page-number="${i}"]`).remove();
          }
      }
  }

  /**
   * Reload document stylesheet, except CSS Page Weaver ones 
   */
  removeStyle() {
    // Get all the link elements that are stylesheets
    const styles = document.querySelectorAll(`style[data-pagedjs-inserted-styles]`);

    // Iterate over each link element
    styles.forEach((style, index) => {
        // First style is usually pagedjs basic interface
        if(index > 0 && style.getAttribute('data-reload-at') != this.timestamp){
          //console.log(style)
          style.remove()
        }
    });
  }

  /**
   * Create a Style element with CSS rules
   * {string} sheet - CSS rules to write in style element
   */
  createStyle(sheet){
    let stylesheet = document.createElement('STYLE')
    stylesheet.setAttribute('data-pagedjs-inserted-styles', true)
    stylesheet.setAttribute('data-reload-at', this.timestamp)
    stylesheet.innerHTML = sheet
    return stylesheet    
  }

}