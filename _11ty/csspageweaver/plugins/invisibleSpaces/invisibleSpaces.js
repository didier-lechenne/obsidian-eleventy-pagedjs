/**
 * @name Invisible spaces
 * @author Didier Lechenne <didier@lechenne.fr>
 * @see { @link  }
 */

export default function invisibleSpacesEvents(){
    
    let body = cssPageWeaver.ui.body
    body.classList.add('no-spaces');
    cssPageWeaver.ui.invisibleSpaces.toggleInput.addEventListener("input", (e) => {
        body.classList.toggle('no-spaces', !e.target.checked);
    });

}
