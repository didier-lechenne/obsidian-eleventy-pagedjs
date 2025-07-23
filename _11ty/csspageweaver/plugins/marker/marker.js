export default function markerEvents(){
    const body = cssPageWeaver.ui.body;
    const markerToggle = cssPageWeaver.ui.marker.toggleInput;

    // Par défaut caché, visible si localStorage = 'true'
    const isVisible = localStorage.getItem('marker') === 'true';
    body.classList.toggle('no-marker', !isVisible);
    if (!isVisible) {
        body.style.setProperty('--color-marker', 'hsla(240, 100%, 50%, 0)', 'important');
    }
    markerToggle.checked = isVisible;

    function toggleMarker(){
        const isVisible = !body.classList.contains('no-marker');
        
        body.classList.toggle('no-marker', isVisible);
        markerToggle.checked = !isVisible;
        localStorage.setItem('marker', !isVisible);
        
        if (isVisible) {
            body.style.setProperty('--color-marker', 'hsla(240, 100%, 50%, 0)', 'important');
        } else {
            body.style.removeProperty('--color-marker');
        }
    }

    markerToggle.addEventListener("input", toggleMarker);

    // Raccourcis clavier
    cssPageWeaver.features.marker?.ui.shortcut?.forEach(shortcut => {
        if (shortcut.active) {
            cssPageWeaver.helpers.addKeydownListener(shortcut.keys, toggleMarker);
        }
    });
}