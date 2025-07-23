// main.js - Point d'entrée principal du plugin gridStudio
// Remplace l'ancien gridStudio.js

// Import des composants via leurs index
import GridComponent, { 
    GridDragDropHandler,
    GRID_DEFAULTS,
    RESIZE_MODES 
} from './components/grid/index.js';

import ImageComponent, { 
    ImageControls, 
    ImageManipulator, 
    DragZoomHandler,
    IMAGE_DEFAULTS
} from './components/image/index.js';

import CaptionComponent, { 
    ImageGridCaptionHandler,
    CAPTION_BEHAVIORS 
} from './components/caption/index.js';

import CodeGenComponent, { 
    CodeGenerator,
    SHORTCODE_TYPES 
} from './components/codeGen/index.js';

// Import des utilitaires
import { DOMHelpers } from './utils/dom-helpers.js';
import { GridCalculator } from './utils/grid-calculator.js';
// import { EventManager } from './utils/event-manager.js';

/**
 * Classe principale du plugin gridStudio
 * Orchestration des différents composants
 */
class gridStudioPlugin {
    constructor() {
        this.components = {
            grid: null,
            image: null,
            caption: null,
            codeGen: null
        };
        
        this.utils = {
            dom: new DOMHelpers(),
            grid: new GridCalculator(),
            events: new EventManager()
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialise tous les composants du plugin
     */
    init() {
        if (this.isInitialized) {
            console.warn('gridStudioPlugin déjà initialisé');
            return;
        }

        try {
            // Initialiser les composants dans l'ordre
            this.components.grid = new GridDragDropHandler();
            this.components.caption = new ImageGridCaptionHandler();
            this.components.codeGen = new CodeGenerator();
            
            // L'ImageManipulator dépend des autres composants
            this.components.image = new ImageManipulator();

            this.isInitialized = true;
            console.log('✅ gridStudioPlugin initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du gridStudioPlugin:', error);
            throw error;
        }
    }

    /**
     * Active le mode layout
     */
    activate() {
        if (!this.isInitialized) {
            this.init();
        }

        // Activer les composants
        this.components.grid?.initializeDragDrop();
        
        console.log('🎯 Mode layout activé');
    }

    /**
     * Désactive le mode layout
     */
    deactivate() {
        // Nettoyer tous les composants
        Object.values(this.components).forEach(component => {
            if (component && typeof component.cleanup === 'function') {
                component.cleanup();
            }
        });
        
        console.log('⏹️ Mode layout désactivé');
    }

    /**
     * Nettoyage complet
     */
    destroy() {
        this.deactivate();
        
        // Reset des références
        this.components = {};
        this.utils = {};
        this.isInitialized = false;
        
        console.log('🧹 gridStudioPlugin détruit');
    }

    /**
     * Accès aux composants pour usage externe
     */
    getComponent(name) {
        return this.components[name];
    }

    /**
     * Accès aux utilitaires
     */
    getUtil(name) {
        return this.utils[name];
    }
}

// Export pour compatibilité avec l'ancien système
export {
    // Classes principales (compatibilité)
    GridDragDropHandler,
    ImageControls,
    ImageManipulator,
    DragZoomHandler,
    CodeGenerator,
    ImageGridCaptionHandler,
    
    // Composants organisés
    GridComponent,
    ImageComponent, 
    CaptionComponent,
    CodeGenComponent,
    
    // Constantes utiles
    GRID_DEFAULTS,
    RESIZE_MODES,
    IMAGE_DEFAULTS,
    CAPTION_BEHAVIORS,
    SHORTCODE_TYPES,
    
    // Classe principale
    gridStudioPlugin
};

// Export par défaut
export default gridStudioPlugin;

// Rendre les classes disponibles globalement (compatibilité)
if (typeof window !== 'undefined') {
    window.GridDragDropHandler = GridDragDropHandler;
    window.ImageControls = ImageControls;
    window.ImageManipulator = ImageManipulator;
    window.DragZoomHandler = DragZoomHandler;
    window.CodeGenerator = CodeGenerator;
    window.gridStudioPlugin = gridStudioPlugin;
}