/**
 * @name Spread
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/ }
 */

export default function spreadEvents(){

    const body = cssPageWeaver.ui.body
    const fileTitle = cssPageWeaver.docTitle;
    const toggleInput = document.querySelector('#spread-toggle-button')

    /* SPREAD ---------------------------------------------------------------------------------------------------- 
    ----------------------------------------------------------------------------------------------------------------*/
    /* Toggle spread or recto-verso */
    let preference = localStorage.getItem('spreadToggle' + fileTitle);
    

    if(preference == "spread"){
        body.classList.remove('no-spread');
        toggleInput.checked = true
    }else if(preference == "no-spread"){
        body.classList.add('no-spread');
        toggleInput.checked = false
    }
    document.querySelector("#label-spread-toggle").addEventListener("click", (e) => {
        //e.preventDefault()

        if(body.classList.contains("no-spread")){
            body.classList.remove('no-spread');
            localStorage.setItem('spreadToggle' + fileTitle, 'spread');  
        }else{
            body.classList.add('no-spread');
            localStorage.setItem('spreadToggle' + fileTitle, 'no-spread');
        }
    });

}