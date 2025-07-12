/**
 * @name Beau drapeau
 * @author Benjamin G. <ecrire@bnjm.eu>
 * @see { @link https://gitlab.com/csspageweaver/plugins/beauDrapeau }
 */

import { beauDrapeau } from '/csspageweaver/plugins/beauDrapeau/beauDrapeau.js';

export default function () {

  // Declare selector
  let toggleInput = cssPageWeaver.ui.beauDrapeau.toggleInput

  // Add event
  toggleInput.addEventListener('input', () => {
    
    // Change toggle button style and content
    //beauDrapeau().ui().toggle().button('edit-button')
    
    // Run function
    beauDrapeau().edit()
  })
}