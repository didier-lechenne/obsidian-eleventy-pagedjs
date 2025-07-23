// components/Image/index.js
// Export principal du composant Image

export { ImageControls } from './ImageControls.js';
export { ImageManipulator } from './ImageManipulator.js';
export { DragZoomHandler } from './DragZoomHandler.js';


// Constantes spécifiques aux images
export const IMAGE_DEFAULTS = {
    minWidth: 100,
    maxWidth: 10000,
    scaleFactor: 1.1,
    translateStep: 1
};

// Positions prédéfinies pour ImageControls
export const IMAGE_POSITIONS = [
    { id: 'top_left', x: 0, y: 0 },
    { id: 'top_middle', x: 0.5, y: 0 },
    { id: 'top_right', x: 1, y: 0 },
    { id: 'middle_left', x: 0, y: 0.5 },
    { id: 'middle_middle', x: 0.5, y: 0.5 },
    { id: 'middle_right', x: 1, y: 0.5 },
    { id: 'bottom_left', x: 0, y: 1 },
    { id: 'bottom_middle', x: 0.5, y: 1 },
    { id: 'bottom_right', x: 1, y: 1 }
];

// Propriétés CSS gérées
export const IMAGE_CSS_PROPERTIES = {
    col: '--col',
    width: '--width', 
    printCol: '--print-col',
    printWidth: '--print-width',
    printRow: '--print-row',
    printHeight: '--print-height',
    alignSelf: '--alignself',
    figcaptionArrow: '--figcaption_arrow',
    imgX: '--img-x',
    imgY: '--img-y',
    imgW: '--img-w'
};