/**
 * @name Invisible spaces
 * @author Didier Lechenne <didier@lechenne.fr>
 * @see { @link  }
 */

export default function invisibleSpacesEvents() {
    const STORAGE_KEY = 'invisibleSpaces';
    
    let body = cssPageWeaver.ui.body;
    let toggleInput = cssPageWeaver.ui.invisibleSpaces.toggleInput;
    
    // Fonction pour sauvegarder l'état
    function saveState(enabled) {
        try {
            localStorage.setItem(STORAGE_KEY, enabled.toString());
        } catch (error) {
            console.warn('[invisibleSpaces] Could not save to localStorage:', error);
        }
    }
    
    // Fonction pour charger l'état sauvegardé
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'true'; // Par défaut false si pas de valeur
        } catch (error) {
            console.warn('[invisibleSpaces] Could not load from localStorage:', error);
            return false; // Valeur par défaut
        }
    }
    
    // Fonction pour appliquer l'état (classe CSS + input)
    function applyState(enabled) {
        body.classList.toggle('no-spaces', !enabled);
        toggleInput.checked = enabled;
    }
    
    // Initialisation : charger et appliquer l'état sauvegardé
    const savedState = loadState();
    applyState(savedState);
    
    // Écouteur d'événement avec sauvegarde
    toggleInput.addEventListener("input", (e) => {
        const enabled = e.target.checked;
        body.classList.toggle('no-spaces', !enabled);
        saveState(enabled);
    });
}
