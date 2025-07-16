/**
 * @name typeCraft
 * @author Didier Lechenne. <didier@lechenne.fr>
 * @see { @link  }
 */


import { typeCraft } from '/csspageweaver/plugins/typeCraft/typeCraft.js';

export default function () {

  // Declare selector
  let toggleInput = cssPageWeaver.ui.typeCraft.toggleInput

  // Add event
  toggleInput.addEventListener('input', () => {
    // Run function
    typeCraft().edit()
  })
}