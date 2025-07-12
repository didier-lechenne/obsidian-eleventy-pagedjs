/**
 * @name Beau drapeau
 * @author Benjamin G. <ecrire@bnjm.eu>
 * @see { @link https://gitlab.com/csspageweaver/plugins/beauDrapeau }
 */

import { Handler } from '/csspageweaver/lib/paged.esm.js';
import { beauDrapeau } from '/csspageweaver/plugins/beauDrapeau/beauDrapeau.js';

/*  */
export class PrepareBeauDrapeau extends Handler {

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.parameters = cssPageWeaver.features.beauDrapeau || {}
    this.parameters.data = cssPageWeaver.features.beauDrapeau?.data || cssPageWeaver.features.beauDrapeau.directory + 'beauDrapeau-data.js'
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


  async applyBackUp(content){
    console.log("retrieve previous beauDrapeau", beauDrapeau.data )

    // Loop through each object in the beauDrapeauData array
    beauDrapeau.data.forEach((data) => {

      // Get the corresponding DOM element by ID
      const element = content.querySelector(`[editable-id="${data.id}"`);
      if (element) {

        // If the element exists 
        // and has a non-null breaking array, add <br> elements
        if (data.breaking && data.breaking.length > 0) {
          let textContent = element.textContent;
          data.breaking.forEach((index) => {
            const firstPart = textContent.slice(0, index);
            const secondPart = textContent.slice(index);
            element.innerHTML = `${firstPart}<br>${secondPart}`;
            textContent = element.textContent; // Update the textContent variable to reflect the new <br> element
          });
        }

        // If the element exists 
        // and has a non-null letterspacing value, add inline styles
        if (data.letterspacing !== null) {
          element.style.letterSpacing = `${data.letterspacing}`;
        }
      }
    });

  }

  // new function to load _beauDrapeau.json
  async loadBackUp() {
    try {

      let data_location = this.parameters.data ? this.parameters.data : `./${this.getPageAssetsLocation()}/beauDrapeau-data.js` 
      const response = await fetch(data_location);
      //const response = await fetch(`./${cssPageWeaver.directory.plugins}/beauDrapeau/beauDrapeau-data.js`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data
    } catch (error) {
    }
  }


  async beforeParsed(content) {
    // Canonise existing Breaking Point
    this.addClassToBreaking(content)

    // Assign ID to all editable element
    this.assignEditableIds(content)

    // Load previous data
    beauDrapeau.data = await this.loadBackUp();

    // Break if no data
    if(!beauDrapeau.data){ return }

    await this.applyBackUp(content)

  }

}