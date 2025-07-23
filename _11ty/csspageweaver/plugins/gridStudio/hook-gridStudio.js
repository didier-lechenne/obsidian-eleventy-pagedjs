// hook.js - Hook PagedJS pour le plugin gridStudio

import { Handler } from "/csspageweaver/lib/paged.esm.js";
import { gridStudioPlugin } from "./gridStudio.js";
import { GridDragDropHandler } from "./components/grid/index.js";
import { DragZoomHandler } from "./components/image/index.js";

/**
 * Handler principal pour l'intégration PagedJS
 * Gère le cycle de vie du plugin dans le contexte de PagedJS
 */


export default class gridStudio extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    
    // Instance principale du plugin
    this.gridStudioPlugin = new gridStudioPlugin();
    this.gridHandler = new GridDragDropHandler();
    // Références pour compatibilité avec l'ancien code
    this.gridHandler = null;
    this.dragZoomHandler = null;
    //  this.gridHandler = new GridDragDropHandler();
    // this.dragZoomHandler = new DragZoomHandler(chunker, polisher, caller);

    // État
    this.isInitialized = false;
    this.toggleHandler = null;
    this.fileTitle = cssPageWeaver.docTitle;
    
    console.log('🔌 gridStudio Handler initialisé');
  }

  /**
   * Appelé avant le parsing du contenu
   */
  beforeParsed(content) {
    this.cleanup();
  }

  /**
   * Appelé après le rendu des pages
   */
  afterRendered(pages) {
    // Initialiser avec un délai pour s'assurer que le DOM est prêt
    setTimeout(() => {
      this.initializeComponents();
      this.initializegridStudioToggle();
      this.isInitialized = true;
      
      console.log('📄 gridStudio Handler prêt après rendu');
    }, 100);
  }

  /**
   * Initialise les composants du plugin
   */
  initializeComponents() {
    try {
      // Initialiser le plugin principal
      this.gridStudioPlugin.init();
      
      // Récupérer les références pour compatibilité
      this.gridHandler = this.gridStudioPlugin.getComponent('grid');
      
      // Créer DragZoomHandler séparément (pour compatibilité)
      this.dragZoomHandler = new DragZoomHandler(
        this.chunker, 
        this.polisher, 
        this.caller
      );
      
      // Activer les fonctionnalités
      this.gridHandler?.initializeDragDrop();
      this.dragZoomHandler?.initializeManipulator();
      this.dragZoomHandler?.createControlsUI();
      
      console.log('🎯 Composants gridStudio initialisés');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des composants:', error);
    }
  }

  /**
   * Initialise le toggle du mode gridStudio
   */
  initializegridStudioToggle() {
    // Éviter les doublons
    if (this.toggleHandler) return;

    try {
      const body = cssPageWeaver.ui.body;
      const toggleInput = cssPageWeaver.ui.gridStudio.toggleInput;

      // Récupérer la préférence sauvegardée
      const preference = localStorage.getItem('gridStudio') === 'true';
      
      body.classList.toggle('gridStudio', preference);
      toggleInput.checked = preference;

      // Créer le handler d'événement
      this.toggleHandler = (e) => {
        const isEnabled = e.target.checked;
        
        body.classList.toggle("gridStudio", isEnabled);
        localStorage.setItem('gridStudio', isEnabled);
        
        // Activer/désactiver le plugin selon l'état
        if (isEnabled) {
          this.gridStudioPlugin.activate();
        } else {
          this.gridStudioPlugin.deactivate();
        }
        
        console.log(`🔄 Mode gridStudio ${isEnabled ? 'activé' : 'désactivé'}`);
      };
      
      toggleInput.addEventListener("input", this.toggleHandler);
      
      // Activer si la préférence l'indique
      if (preference) {
        this.gridStudioPlugin.activate();
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du toggle:', error);
    }
  }

  /**
   * Nettoyage des ressources
   */
  cleanup() {
    try {
      // Nettoyer le plugin principal
      if (this.gridStudioPlugin) {
        this.gridStudioPlugin.destroy();
      }
      
      // Nettoyer les handlers individuels (compatibilité)
      if (this.gridHandler?.destroy) {
        this.gridHandler.destroy();
      }
      
      if (this.dragZoomHandler?.cleanup) {
        this.dragZoomHandler.cleanup();
      }
      
      // Nettoyer le listener du toggle
      if (this.toggleHandler && cssPageWeaver.ui?.gridStudio?.toggleInput) {
        cssPageWeaver.ui.gridStudio.toggleInput.removeEventListener("input", this.toggleHandler);
        this.toggleHandler = null;
      }
      
      this.isInitialized = false;
      console.log('🧹 gridStudio Handler nettoyé');
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Méthode de destruction complète
   */
  destroy() {
    this.cleanup();
    this.gridStudioPlugin = null;
    this.gridHandler = null;
    this.dragZoomHandler = null;
  }
}