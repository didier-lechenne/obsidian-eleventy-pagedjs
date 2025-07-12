/**
 * @name Baseline
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/baseline/ }
 */


export default function baseline() {
    let body = cssPageWeaver.ui.body
    let fileTitle = cssPageWeaver.docTitle;
    let parameters = cssPageWeaver.features.baseline.parameters || {}
    let isParametersSet = Object.keys(parameters).length > 0

    /* BASELINE ---------------------------------------------------------------------------------------------------- 
    ----------------------------------------------------------------------------------------------------------------*/

    /* Set baseline onload */
    let baseline = {}

    // set default value
    baseline.default = {
        size: 32 ,
        position: 0
    }

    baseline.toggle = {}
    baseline.toggle.value = localStorage.getItem('baselineToggle_' + fileTitle)
    baseline.toggle.input = cssPageWeaver.ui.baseline.toggleInput

    baseline.button = cssPageWeaver.ui.baseline.toggleLabel

    baseline.size = {}
    baseline.size.value = parameters.size || baseline.default.size
    baseline.size.input = document.querySelector('#size-baseline')

    baseline.position = {}
    baseline.position.value = parameters.position || baseline.default.position
    baseline.position.input = document.querySelector('#position-baseline')
    

    /* */
    /* Retrieve previous sessions */
    baseline.size.value = localStorage.getItem('baselineSize_' + fileTitle) || baseline.size.value
    baseline.position.value = localStorage.getItem('baselinePosition_' + fileTitle) || baseline.position.value

    /* */
    /* DOM edit */

    /* Toggle */
    if(baseline.toggle.value == "no-baseline"){
        body.classList.add('no-baseline');
        baseline.toggle.input.checked = false;
    }else if(baseline.toggle.value == "baseline"){
        body.classList.remove('no-baseline');
        baseline.toggle.input.checked = true;
    }else{
        body.classList.add('no-baseline');
        localStorage.setItem('baselineToggle_' + fileTitle, 'no-baseline');        //baselineButton.querySelector(".button-hide").classList.remove("button-not-selected");
        baseline.toggle.input.checked = false;
    }

    /* Set baseline size and position on load */
    baseline.size.input.value = baseline.size.value
    document.documentElement.style.setProperty('--pagedjs-baseline', baseline.size.value + 'px');
    baseline.position.input.value = baseline.position.value
    document.documentElement.style.setProperty('--pagedjs-baseline-position', baseline.position.value + 'px');


    /*  */
    /* Event listenner */

    /* Toggle event  */
    baseline.toggle.input.addEventListener("input", (e) => {
        if(e.target.checked){
            /* see baseline */
            body.classList.remove('no-baseline');
            localStorage.setItem('baselineToggle_' + fileTitle, 'baseline');
        }else{
            /* hide baseline */
            body.classList.add('no-baseline');
            localStorage.setItem('baselineToggle_' + fileTitle, 'no-baseline');
        }
    });

    /* Change baseline size on input */
    document.querySelector("#size-baseline").addEventListener("input", (e) => {
        baseline.size.value = e.target.value
        document.documentElement.style.setProperty('--pagedjs-baseline', baseline.size.value + 'px');
        localStorage.setItem('baselineSize_'  + fileTitle, baseline.size.value);
    });


    /* Change baseline position on input */
      document.querySelector("#position-baseline").addEventListener("input", (e) => {
        baseline.position.value = e.target.value
        document.documentElement.style.setProperty('--pagedjs-baseline-position', baseline.position.value + 'px');
        localStorage.setItem('baselinePosition_'  + fileTitle, baseline.position.value);
    });

}