/**
 * @name Grid
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/grid/ }
 */

export default function gridEvents(){
    let body = cssPageWeaver.ui.body;
    let fileTitle = cssPageWeaver.docTitle;


    let grid = {}

    // set default value
    grid.default = {
        toggle: 'no-grid'
    }

    grid.toggle = {}
    grid.toggle.input = cssPageWeaver.ui.grid.toggleInput
    grid.toggle.label = cssPageWeaver.ui.grid.toggleLabel


    /* Previous session */
    grid.toggle.value = localStorage.getItem('gridToggle_' + fileTitle) || grid.default.toggle

    if(grid.toggle.value == "no-grid"){
        body.classList.add('no-grid');
        grid.toggle.input.checked = false;
    }else if(grid.toggle.value == "grid"){
        body.classList.remove('no-grid');
        grid.toggle.input.checked = true;
    }else{
        body.classList.add('no-grid');
        localStorage.setItem('gridToggle_' + fileTitle, 'no-grid');
        grid.toggle.input.checked = false;
    }

            
    /* Grid toggle event */
    grid.toggle.input.addEventListener("input", (e) => {
        if(e.target.checked){
            body.classList.remove('no-grid');
            localStorage.setItem('gridToggle_' + fileTitle, 'grid');
        }else{
            body.classList.add('no-grid');
            localStorage.setItem('gridToggle_' + fileTitle, 'no-grid');
        }
    });
}