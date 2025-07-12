/**
 * @name Margin Box
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/marginBox }
 */

export default function marginBoxEvents(){
    
    let body = cssPageWeaver.ui.body

     /* MARGIN BOXES ---------------------------------------------------------------------------------------------------- 
    ----------------------------------------------------------------------------------------------------------------*/
    let marginButton = document.querySelector('#label-marginBox-toggle');

    body.classList.add('no-marginBoxes');
    
    cssPageWeaver.ui.marginBox.toggleInput.addEventListener("input", (e) => {
        if(e.target.checked){
            /* see baseline */
            body.classList.remove('no-marginBoxes');
        }else{
            /* hide baseline */
            body.classList.add('no-marginBoxes');
        }
    });
}
