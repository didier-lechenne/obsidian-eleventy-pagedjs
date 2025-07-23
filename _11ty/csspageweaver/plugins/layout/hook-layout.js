import { Handler } from "/csspageweaver/lib/paged.esm.js";
import { GridDragDropHandler } from "./GridDragDropHandler.js";
import { DragZoomHandler } from "./DragZoomHandler.js";

export default class Layout extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.gridHandler = new GridDragDropHandler();
    this.dragZoomHandler = new DragZoomHandler(chunker, polisher, caller);
    this.isInitialized = false;
    this.toggleHandler = null; // Stocker la référence du handler
    this.fileTitle = cssPageWeaver.docTitle;
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

    // Ajouter le listener seulement s'il n'existe pas déjà
    if (!this.toggleHandler) {
      this.initializeLayoutToggle();
    }
  }

  initializeLayoutToggle() {
    let body = cssPageWeaver.ui.body;
    let toggleInput = cssPageWeaver.ui.layout.toggleInput;

    // Récupérer la préférence sauvegardée
    let preference = localStorage.getItem('layout') === 'true';
    
    body.classList.toggle('layout', preference);
    toggleInput.checked = preference;

    // Créer le handler d'événement
    this.toggleHandler = (e) => {
      body.classList.toggle("layout", e.target.checked);
      localStorage.setItem('layout', e.target.checked);
    };
    
    toggleInput.addEventListener("input", this.toggleHandler);
  }

  cleanup() {
    if (this.gridHandler?.destroy) {
      this.gridHandler.destroy();
    }
    
    // Nettoyer le listener
    if (this.toggleHandler) {
      cssPageWeaver.ui.layout.toggleInput.removeEventListener("input", this.toggleHandler);
      this.toggleHandler = null;
    }
  }
}