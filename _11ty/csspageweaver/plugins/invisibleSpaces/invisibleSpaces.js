/**
 * @name Invisible spaces
 * @author Didier Lechenne <didier@lechenne.fr>
 * @see { @link  }
 */

export default function invisibleSpacesEvents(){
    
    let body = cssPageWeaver.ui.body

    body.classList.add('no-invisibleSpaces');

    cssPageWeaver.ui.invisibleSpaces.toggleInput.addEventListener("input", (e) => {
        if(e.target.checked){
            /* see baseline */
            body.classList.remove('no-invisibleSpaces');
        }else{
            /* hide baseline */
            body.classList.add('no-invisibleSpaces');
        }
    });

}
