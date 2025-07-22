import { Handler } from '/csspageweaver/lib/paged.esm.js';
import { GridDragDropHandler } from './GridDragDropHandler.js';
import { DragZoomHandler } from './DragZoomHandler.js';

export default class Layout extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.gridHandler = new GridDragDropHandler();
        this.dragZoomHandler = new DragZoomHandler(chunker, polisher, caller);
        this.isInitialized = false;
    }

    beforeParsed(content) {
        this.cleanup();
    }

    afterRendered(pages) {
        setTimeout(() => {
            this.gridHandler.initializeDragDrop();
            this.dragZoomHandler.initializeManipulator();
            this.dragZoomHandler.createControlsUI();
            this.isInitialized = true;
        }, 100);
    }

    cleanup() {
        if (this.gridHandler?.destroy) {
            this.gridHandler.destroy();
        }
    }
}