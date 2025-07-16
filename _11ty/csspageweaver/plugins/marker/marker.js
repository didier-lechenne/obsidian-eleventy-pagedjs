export default function markerEvents(){
    const body = cssPageWeaver.ui.body;

    // set a "unique" filename based on title element, in case several books are opened
    const fileTitle = document.getElementsByTagName("title")[0].text;

    const markerToggle = cssPageWeaver.ui.marker.toggleInput;

    // Check localStorage for user's preference and apply it
    const preference = localStorage.getItem('markerToggle' + fileTitle);
    if (preference === "hidden") {
        body.classList.add('no-marker');
        body.style.setProperty('--color-marker', 'hsla(240, 100%, 50%, 0)', 'important');
        markerToggle.checked = false;
    } else {
        body.classList.remove('no-marker');
        body.style.removeProperty('--color-marker');
        markerToggle.checked = true;
    }

    function toggleMarker(){
        const isHidden = body.classList.contains('no-marker');
        
        if(isHidden){
            /* see baseline */
            body.classList.remove('no-marker');
            body.style.removeProperty('--color-marker');
            markerToggle.checked = true;
            localStorage.setItem('markerToggle' + fileTitle, 'visible');
        }else{
            /* hide baseline */
            body.classList.add('no-marker');
            body.style.setProperty('--color-marker', 'hsla(240, 100%, 50%, 0)', 'important');
            markerToggle.checked = false;
            localStorage.setItem('markerToggle' + fileTitle, 'hidden');
        }
    }

    // Toggle marker when the input is changed
    markerToggle.addEventListener("input", (e) => {
        toggleMarker();
    });

    // Add keydown listener based on configuration (if you have shortcuts)
    if(cssPageWeaver.features.marker && cssPageWeaver.features.marker.ui.shortcut){
        cssPageWeaver.features.marker.ui.shortcut.forEach( shortcut => {
            // if user do not have disable plugin 
            if(shortcut.active){

                // Get shortcut combinaison from config
                const keys = shortcut.keys
                
                // CSS Page Weaver has a simple function to help you register your keyboard shortcut
                cssPageWeaver.helpers.addKeydownListener(keys, toggleMarker)
            }
        })
    }
}