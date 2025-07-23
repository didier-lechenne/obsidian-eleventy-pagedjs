import { CodeGenerator } from './CodeGenerator.js';
import { ImageControls } from './ImageControls.js';
import { ImageManipulator } from './ImageManipulator.js';
import { DragZoomHandler } from './DragZoomHandler.js';

// Rendre les classes disponibles globalement si nécessaire
window.CodeGenerator = CodeGenerator;
window.ImageControls = ImageControls;
window.ImageManipulator = ImageManipulator;

// Initialisation
Paged.registerHandlers(DragZoomHandler);