/**
 * @name Preview page
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/previewPage }
 */

export default function previewEvents(){
    const body = cssPageWeaver.ui.body

    // set a "unique" filename based on title element, in case several books are opened
    const fileTitle = document.getElementsByTagName("title")[0].text;

    const previewToggle = document.querySelector("#preview-toggle");
    const previewButton = document.querySelector("#button-preview");

    // Check localStorage for user's preference and apply it
    const preference = localStorage.getItem('previewToggle' + fileTitle);
    if (preference === "preview") {
        body.classList.add('interface-preview');
        previewToggle.checked = true;
    } else {
        body.classList.remove('interface-preview');
        previewToggle.checked = false;
    }

    function preview(){
        const isPreview = body.classList.contains('interface-preview');
        body.classList.toggle('interface-preview');
        previewToggle.checked = !isPreview;
        localStorage.setItem('previewToggle' + fileTitle, isPreview ? 'no-preview' : 'preview');

    }
    // Toggle preview mode when the button is clicked
    previewButton.addEventListener("click", (e) => {
        e.preventDefault();
        preview()
    });

    // Add keydown listener based on configuration 
    cssPageWeaver.features.previewPage.ui.shortcut.forEach( shortcut => {
        // if user do not have disable plugin 
        if(shortcut.active){

            // Get shortcut combinaison from config
            const keys = shortcut.keys
            
            // CSS Page Weaver has a simple function to help you register your keyboard shortcut
            cssPageWeaver.helpers.addKeydownListener(keys, preview)
        }
    })

}