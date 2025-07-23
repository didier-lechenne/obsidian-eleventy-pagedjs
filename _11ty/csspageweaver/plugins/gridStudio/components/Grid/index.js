// components/Grid/index.js
// Export principal du composant Grid

export { GridDragDropHandler } from './GridDragDropHandler.js';


// Constantes spécifiques au Grid
export const GRID_DEFAULTS = {
    cols: 12,
    rows: 10,
    gutter: '3mm'
};

// Types de redimensionnement supportés
export const RESIZE_MODES = {
    POSITION: 'position',
    WIDTH: 'width', 
    HEIGHT: 'height',
    BOTH: 'both'
};

// Sélecteurs CSS utilisés par le composant
export const GRID_SELECTORS = {
    modularGrid: '.modularGrid',
    resizable: '.resizable',
    handles: {
        position: '.position-handle',
        width: '.width-handle',
        height: '.height-handle',
        both: '.both-handle'
    }
};