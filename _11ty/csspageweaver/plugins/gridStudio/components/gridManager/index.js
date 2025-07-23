// components/gridManager/index.js

export { GridManager } from './GridManager.js';
export { GridDetector } from './GridDetector.js';
export { GridInteraction } from './GridInteraction.js';
export { GridUIHandler } from './GridUIHandler.js';

// Constantes pour les grilles modulaires
export const GRID_ZONES = {
   MOVE: 'move',
   N_RESIZE: 'n-resize',
   S_RESIZE: 's-resize',
   E_RESIZE: 'e-resize',
   W_RESIZE: 'w-resize',
   NE_RESIZE: 'ne-resize',
   NW_RESIZE: 'nw-resize',
   SE_RESIZE: 'se-resize',
   SW_RESIZE: 'sw-resize'
};

export const GRID_CURSORS = {
   'move': 'move',
   'n-resize': 'ns-resize',
   's-resize': 'ns-resize', 
   'e-resize': 'ew-resize',
   'w-resize': 'ew-resize',
   'ne-resize': 'nesw-resize',
   'nw-resize': 'nwse-resize',
   'se-resize': 'nwse-resize', 
   'sw-resize': 'nesw-resize'
};

export const GRID_DEFAULTS = {
   cols: 12,
   rows: 10,
   edgeZone: 15,
   cornerZone: 20
};