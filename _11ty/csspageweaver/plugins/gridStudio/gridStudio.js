// gridStudio.js - Point d'entrée principal du plugin gridStudio

// Import des composants via leurs index
import { 
   GridDragDropHandler,
   GRID_DEFAULTS,
   RESIZE_MODES
} from './components/grid/index.js';

import { 
   ImageControls, 
   ImageManipulator, 
   DragZoomHandler,
   IMAGE_DEFAULTS
} from './components/image/index.js';


import { 
   ImageGridCaptionHandler,
   CAPTION_BEHAVIORS 
} from './components/caption/index.js';  

import { 
   CodeGenerator,
   SHORTCODE_TYPES
} from './components/codeGen/index.js';

import { 
   GridManager
} from './components/gridManager/index.js';

// Import des utilitaires
import { DOMHelpers } from './utils/dom-helpers.js';
import { GridCalculator } from './utils/grid-calculator.js';




/**
* Classe principale du plugin gridStudio
* Orchestration des différents composants
*/
class gridStudioPlugin {
   constructor() {
       console.log('🏗️ gridStudioPlugin constructor START');
       console.trace('📍 Appelé depuis:');
       
       this.components = {
           grid: null,
           image: null,
           caption: null,
           codeGen: null
       };
       
       console.log('📦 Components initialisés');
       
       try {
           console.log('🔧 Création utils...');
           this.utils = {
               dom: new DOMHelpers(),
               grid: new GridCalculator(),
               gridManager: new GridManager()
           };
           console.log('✅ this.utils créé:', this.utils);
           
       } catch (error) {
           console.error('❌ Erreur dans constructeur utils:', error);
           this.utils = {};
       }
       
       this.isInitialized = false;
       console.log('🏗️ gridStudioPlugin constructor END');
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
           this.components.grid = new GridDragDropHandler(this.utils.gridManager);
           this.components.caption = new ImageGridCaptionHandler();
           this.components.codeGen = new CodeGenerator();
           this.components.image = new ImageManipulator(this.utils.gridManager);

           
           if (this.utils.gridManager && typeof this.utils.gridManager.setCodeGenerateCallback === 'function') {
               this.utils.gridManager.setCodeGenerateCallback(
                   (element) => this.components.image.generateCode(element, true)
               );
           } else {
               console.warn('GridManager ou setCodeGenerateCallback non disponible');
               // Dans gridStudio.js, dans la méthode init()
// console.log('🔍 Debug GridManager:');
// console.log('this.utils:', this.utils);
// console.log('this.utils.gridManager:', this.utils.gridManager);
// console.log('typeof gridManager:', typeof this.utils.gridManager);
// console.log('setCodeGenerateCallback existe?', 'setCodeGenerateCallback' in this.utils.gridManager);
// console.log('Méthodes de gridManager:', Object.getOwnPropertyNames(this.utils.gridManager.constructor.prototype));
           

}

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
       
       // Nettoyer les utilitaires
       this.utils.gridManager?.cleanup();
       
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
   GridManager,
   
   // Constantes réexportées depuis les modules
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
   window.GridManager = GridManager;
   window.gridStudioPlugin = gridStudioPlugin;
}