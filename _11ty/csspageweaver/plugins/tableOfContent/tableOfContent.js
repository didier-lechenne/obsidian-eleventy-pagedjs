/**
 * @name Table of content
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/table_of_content/ }
 */

import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class tableOfContent extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.tocContainer = cssPageWeaver.features.tableOfContent.parameters?.tocContainer || "#toc_container"; 
    this.tocTitles = cssPageWeaver.features.tableOfContent.parameters?.tocTitles || ["h1", "h2"]; 
    this.beforePageNumber = cssPageWeaver.features.tableOfContent.parameters?.beforePageNumber; 
    this.position = cssPageWeaver.features.tableOfContent.parameters?.position; 
  }

  beforeParsed(content) {
    createToc({
      content: content,
      container: this.tocContainer, 
      titleElements: this.tocTitles,
      position: this.position
    });

  }
}



function createToc(config) {

  const content = config.content;
  const tocElement = config.container;
  const titleElements = config.titleElements;

  let tocElementDiv = content.querySelector(tocElement)
  if(!tocElementDiv) return console.warn('couldn’t start the toc')
  tocElementDiv.innerHTML = ''
  let tocUl = document.createElement('ul')
  tocUl.id = 'list-toc-generated'


  if(config.before){
    tocUl.style.setProperty('--before-page', '"' + config.before + '"');
  }


  tocElementDiv.appendChild(tocUl)

  // add class to all title elements
  let tocElementNbr = 0
  for (var i = 0; i < titleElements.length; i++) {
    let titleHierarchy = i + 1
    let titleElement = content.querySelectorAll(titleElements[i])

    titleElement.forEach(function (element) {
      // check if shouldbe shown
      if (
        !element.classList.contains('toc-ignore') || 
        !element.classList.contains('toc-ignore')
      ) {
        // add classes to the element
        element.classList.add('title-element')
        element.setAttribute('data-title-level', titleHierarchy)

        // add an id if doesn't exist
        tocElementNbr++

        if (element.id == '') {
          element.id = 'title-element-' + tocElementNbr
        }
        let newIdElement = element.id
      }
    })
  }

  // create toc list
  let tocElements = content.querySelectorAll('.title-element')

  for (var i = 0; i < tocElements.length; i++) {
    let tocElement = tocElements[i]

    let tocNewLi = document.createElement('li')

    // Add class for the hierarcy of toc
    tocNewLi.classList.add('toc-element')
    tocNewLi.classList.add('toc-element-level-' + tocElement.dataset.titleLevel)

    let classes = [
      ...(tocElement.className ? tocElement.className.split(' ') : []),
      ...(tocElement.closest('section')?.className ? tocElement.closest('section')?.className.split(' ') : []),
    ];
    
    classes.forEach((meta) => {
      if (!meta || meta === 'title-element') return;
      tocNewLi.classList.add(`toc-${meta}`);
    });

    //get the exisiting class
    // Keep class of title elements
    let classTocElement = tocElement.classList
    for (var n = 0; n < classTocElement.length; n++) {
      if (classTocElement[n] != 'title-element') {
        tocNewLi.classList.add(classTocElement[n])
      }
    }

    if(config.position && config.position === "before"){
      tocNewLi.innerHTML =
      '<a class="toc-page-before" href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
    }else{
      tocNewLi.innerHTML =
      '<a class="toc-page-after" href="#' + tocElement.id + '">' + tocElement.innerHTML + '</a>';
    }


    tocUl.appendChild(tocNewLi)
 }
}
