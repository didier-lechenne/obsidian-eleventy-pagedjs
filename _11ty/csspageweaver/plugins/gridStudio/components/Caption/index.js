// components/Caption/index.js
// Export principal du composant Caption

export { ImageGridCaptionHandler } from './ImageGridCaptionHandler.js';


// Comportements de légendes disponibles
export const CAPTION_BEHAVIORS = {
    FIXED: 'fixed',           // Légende reste en bas du conteneur
    FOLLOW: 'follow',         // Légende suit l'image
    HIDE: 'hide',            // Légende se cache pendant resize
    EXTERNAL: 'external'      // Légende déplacée hors conteneur
};

// Configuration par défaut
export const CAPTION_DEFAULTS = {
    behavior: CAPTION_BEHAVIORS.FIXED,
    hideTimeout: 500,
    followOffset: 10, // pixels
    wrapperClass: 'imagegrid-wrapper'
};

// Sélecteurs CSS utilisés
export const CAPTION_SELECTORS = {
    figcaption: 'figcaption',
    img: 'img',
    wrapper: '.imagegrid-wrapper',
    resizing: '.is-resizing'
};