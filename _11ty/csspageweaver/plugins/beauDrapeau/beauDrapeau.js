/**
 * @file Manage text alignement
 * A interface to manually but easily handle line break and letterspacing of textuals elements, in the browser.
 * @author Benjamin G. <ecrire@bnjm.eu>
 * @see https://gitlab.com/BenjmnG/beauDrapeau
 */

export const beauDrapeau = () => ({

  isEditMode: false,
  data: new Array(),

  ui: () => ({

    toggle: () => ({

      button: (id) => {
        var button = document.getElementById(id);

        if(!button){
          return
        }
        // Toggle button value
        if (beauDrapeau.isEditMode) {
            button.classList.add('active')
            button.value = 'Edit On';
        } else {
            button.classList.remove('active')
            button.value = 'Edit Off';
        }
      },

      /**
       * Toggles the `contentEditable` attribute for all elements with the `contentEditable` attribute.
       */
      contentEditable: () => {
        const editableElements = document.querySelectorAll('[contentEditable]');
        editableElements.forEach((element) => {
          element.contentEditable = beauDrapeau.isEditMode;
        });
      },
    }),

    download: (dataBlob) => {
      // Check if the download link already exists
      const existingLink = document.getElementById('edit-download');

      if (existingLink) {
        // If the link exists, update the URL and text content
        existingLink.href = URL.createObjectURL(dataBlob);
      } else {
        // If the link doesn't exist, create a new one and append it to the document body
        let link = document.createElement('a');
        link.id = 'edit-download';
        link.classList = 'button';
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'beauDrapeau-data.js';
        link.innerHTML = '<?xml version="1.0" encoding="UTF-8"?> <svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 0 40 40"> <defs> <style> .a8r7{ fill: none; stroke: currentColor; stroke-miterlimit: 10; stroke-width: 3px; stroke-linecap: round;} </style> </defs> <line class="a8r7" x1="15.49" x2="15.49" y2="27.93"/> <line class="a8r7" y1="34.77" x2="31.31" y2="34.77"/> <polyline class="a8r7" points="22.9 21.02 15.65 28.26 8.41 21.02"/> </svg>'

        let div = document.createElement('div');
        div.classList = "buttons-group"

        div.append(link)

        console.log(div)

        // Add styles
        //link = beauDrapeau().ui().style(link, 1)

        document.getElementById('beauDrapeau-form').insertAdjacentElement('beforeEnd', div);
      }
    },

    event: () => ({
      letterSpacing: () => {
        let letterSpacing = 0;

        const handleScroll = (event) => {
          if (event.shiftKey && event.target.isContentEditable) {
            event.preventDefault();
            const step = 0.01;
            const newLetterSpacing = event.deltaY > 0 ? letterSpacing - step : letterSpacing + step;
            event.target.style.letterSpacing = `${newLetterSpacing}em`;
            letterSpacing = newLetterSpacing;
          }
        };

        const handleMouseOver = (event) => {
          if (event.target.isContentEditable) {
            event.target.addEventListener('wheel', handleScroll);
            event.target.addEventListener('mouseleave', handleMouseOut);
          }
        };

        const handleMouseOut = (event) => {
          if (event.target.isContentEditable) {
            event.target.removeEventListener('wheel', handleScroll);
            event.target.removeEventListener('mouseleave', handleMouseOut);
          }
        };

        if (beauDrapeau.isEditMode) {
          document.addEventListener('mouseover', handleMouseOver);
          document.addEventListener('mouseout', handleMouseOut);
        } else {
          document.removeEventListener('mouseover', handleMouseOver);
          document.removeEventListener('mouseout', handleMouseOut);

        }
      },

      reset: () => {

        const handleKeyDown = (event) => {
          if (event.shiftKey && event.key === 'R' && event.target.isContentEditable) {
            event.preventDefault();
            const id = event.target.getAttribute('editable-id');
            beauDrapeau().clear(id);
          }
        };
        if (beauDrapeau.isEditMode) {
          document.addEventListener('keydown', handleKeyDown);
        } else {
          document.removeEventListener('keydown', handleKeyDown);
        }
      }

    }),


    style(el, pos){
      // Add styles
      el.style.position = 'fixed';
      el.style.top = '2rem';
      el.style.padding = '.75em .5em';
      el.style.right = `${5.5 * pos + 1}rem`; 
      el.style.backgroundColor = '#f3f3f3';
      el.style.borderRadius = '3px';
      el.style.border = '1px solid currentColor';
      el.style.zIndex = '99';
      el.style.color = '#0064ff';
      el.style.textAlign = 'center';
      el.style.fontFamily = 'sans-serif';
      el.style.backgroundColor = '#e1e1e1';
      el.style.cursor = 'pointer';
      el.classList = 'no-print';

      return el
    }

  }),

  data: () => ({

    /**
     * Resets the `breaking` property of the given data object to an empty array.
     * @param {object} data - The data object to update.
     */
    clearBreaking: (data) => {
      data.breaking = [];
    },

    /**
     * Check if element had breaking point element
     * @param {Element} editableElement - The editable element to inspect.
     */
    checkBreaking: (editableElement) => {
      let brs = editableElement.querySelectorAll('br:not(.canon)');
      return brs.length > 0 ? brs : null
    },

    /**
     * Check if element had inline style
     * @param {Element} editableElement - The editable element to inspect.
     */
    checkInlineStyle: (editableElement) => {
      const style = editableElement.getAttribute('style');
      let ls
      if(style){ 
        ls = style.match(/letter-spacing:\s*([^;]+);/);
      }
      return ls ? ls[1] : null
    },


    /**
     * Updates the `breaking` property of the given data object with the indices of the `br` elements in the given editable element.
     * @param {Element} editableElement - The editable element to inspect.
     * @param {object} data - The data object to update.
     */
    updateBreaking: (editableElement, breaking, data) => {
      if(!breaking){return}
      breaking.forEach((br) => {
        const textContent = editableElement.innerHTML
        const brIndex = textContent.indexOf(br.outerHTML);
        data.breaking.push(brIndex);
      });
    },

    /**
     * Updates the `letterspacing` property of the given data object with the value of the `letter-spacing` style for the given editable element.
     * @param {Element} editableElement - The editable element to inspect.
     * @param {object} data - The data object to update.
     */
    updateInlineStyle: (letterSpacing, data) => {
      if(!letterSpacing) { return }
      data.letterspacing = letterSpacing;
    },

    sort: () => {
      beauDrapeau.data.sort((a, b) => a.id.localeCompare(b.id));
    },

    /**
     * Retrieves the data object for the given editable ID, or creates a new one if it doesn't exist.
     * @param {string} editableId - The ID of the editable element.
     * @return {object} The data object for the given editable ID, with `id`, `breaking`, and `letterspacing` properties.
     */
    getOrCreate: (editableId) => {
      const data_template = { id: editableId, breaking: [], letterspacing: null };

      let data = beauDrapeau.data.find((item) => item.id === editableId);

      if (!data) {
        data = data_template;
        beauDrapeau.data.push(data);
      }
      return data;
    }

  }),

  /**
   * Saves the `beauDrapeau.data` object to a file called `_beauDrapeau.js`.
   */
  save: () => {
    // Convert the `beauDrapeau.data` object to a string
    const dataString = JSON.stringify(beauDrapeau.data, null, 2);

    // Create a new Blob object with the data string
    const dataBlob = new Blob([dataString], { type: 'application/json' });

    // Pass to download button
    beauDrapeau().ui().download(dataBlob)

  },


  /**
   * Toggles the edit mode on or off, updates the UI, and saves the data if edit mode is turned off.
   */
  edit: () => {
    beauDrapeau.isEditMode = !beauDrapeau.isEditMode;

    // update UI
    beauDrapeau().ui().toggle().button()

    // Toggle the ContentEditable attribute for all elements
    beauDrapeau().ui().toggle().contentEditable()

    // Initialize event listeners
    beauDrapeau().ui().event().letterSpacing();
    beauDrapeau().ui().event().reset();

    // If Edit mode is off, perform the cleanup and save the data
    if (!beauDrapeau.isEditMode) {

      const editableElements = document.querySelectorAll('[contentEditable]');
      editableElements.forEach((editableElement) => {

        const editableId    = editableElement.getAttribute('editable-id')
        const letterspacing = beauDrapeau().data().checkInlineStyle(editableElement)
        const breaking      = beauDrapeau().data().checkBreaking(editableElement)

        if(letterspacing || breaking){

          let data = beauDrapeau().data().getOrCreate(editableId);

          // Reset breaking points
          beauDrapeau().data().clearBreaking(data);

          // Handle breaking elements
          beauDrapeau().data().updateBreaking(editableElement, breaking, data);

          // Handle inline styles
          beauDrapeau().data().updateInlineStyle(letterspacing, data);
        }

      });    

      // Sort
      if(beauDrapeau.data.length > 0){
        beauDrapeau().data().sort(beauDrapeau.data);
      }

      // Save
      console.log(beauDrapeau.data)
      beauDrapeau().save()
    }
  },

  clear: (ids) => {
    // Convert the `ids` argument to an array if it's not already an array
    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    // Loop through each ID in the `ids` array
    ids.forEach((id) => {
      // Get the corresponding DOM element by ID
      console.log("Clear element ", id)
      const element = document.querySelector("[editable-id='"+id+"'");

      if (element) {

        // Remove all <br> elements with class "canon"
        const brElements = element.querySelectorAll('br:not(.canon)');
        brElements.forEach((br) => {
          br.remove();
        });

        // Remove inline letter-spacing styles
        element.style.letterSpacing = '';

        // Find the corresponding data object in `beauDrapeau.data`
        const dataIndex = beauDrapeau.data.findIndex((data) => data.id === id);
        if (dataIndex !== -1) {
          beauDrapeau.data = beauDrapeau.data.filter((data) => data.id !== id);
        }
      }
    });

    beauDrapeau().save()
  },
})