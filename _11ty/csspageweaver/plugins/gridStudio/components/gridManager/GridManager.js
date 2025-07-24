// components/gridManager/GridManager.js
import { ImageControls } from '../image/ImageControls.js';
import { ImageManipulator } from '../image/ImageManipulator.js';


export class GridManager {
   constructor() {
       this.cache = new Map();
       this.onCodeGenerate = null;
       this.edgeZone = 15;
       this.cornerZone = 20;
   }

   // === DÉTECTION ===
   
   isInModularGrid(element) {
       return element.closest('.modularGrid') !== null;
   }

   getGridConfig(element) {
       const modularGrid = element.closest('.modularGrid');
       if (!modularGrid) return null;
       
       const cacheKey = modularGrid.id || 'default';
       if (this.cache.has(cacheKey)) {
           return this.cache.get(cacheKey);
       }
       
       const style = getComputedStyle(modularGrid);
       const config = {
           cols: parseInt(style.getPropertyValue('--grid-col')) || 12,
           rows: parseInt(style.getPropertyValue('--grid-row')) || 10,
           element: modularGrid
       };
       
       this.cache.set(cacheKey, config);
       return config;
   }

   // === INTERACTION ===

   getInteractionZone(element, clientX, clientY) {
       if (!this.isInModularGrid(element)) return null;
       
       const rect = element.getBoundingClientRect();
       const x = clientX - rect.left;
       const y = clientY - rect.top;
       
       const isNearLeft = x <= this.edgeZone;
       const isNearRight = x >= rect.width - this.edgeZone;
       const isNearTop = y <= this.edgeZone;
       const isNearBottom = y >= rect.height - this.edgeZone;
       
       // Coins (priorité)
       if (isNearLeft && isNearTop) return 'nw-resize';
       if (isNearRight && isNearTop) return 'ne-resize';
       if (isNearLeft && isNearBottom) return 'sw-resize';
       if (isNearRight && isNearBottom) return 'se-resize';
       
       // Bords
       if (isNearLeft) return 'w-resize';
       if (isNearRight) return 'e-resize';
       if (isNearTop) return 'n-resize';
       if (isNearBottom) return 's-resize';
       
       return 'move';
   }

   updateCursor(element, clientX, clientY) {
       if (!this.isInModularGrid(element)) {
           element.style.cursor = 'default';
           return;
       }
       
       const zone = this.getInteractionZone(element, clientX, clientY);
       const cursors = {
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
       
       element.style.cursor = cursors[zone] || 'default';
   }

   // === UI ===

   setupAlignSelfListener(element, selectElement) {
       const elementId = element.getAttribute('data-unique-identifier');

       if (selectElement._currentElementId === elementId) return;
       
       selectElement._currentElement = element;
       selectElement._currentElementId = elementId;
       
       if (selectElement._gridListener) {
           selectElement.removeEventListener('change', selectElement._gridListener);
       }
       
       selectElement._gridListener = (e) => {
           element.style.setProperty('--align-self', e.target.value);
           console.log(`✅ Applied --align-self: ${e.target.value}`);
           
           if (this.onCodeGenerate) {
               this.onCodeGenerate(element);
           }
       };
       
       selectElement.addEventListener('change', selectElement._gridListener);
   }

updateUI(element, shiftPressed = false) {
    // 1. Toujours faire align-self
    const alignValue = element.style.getPropertyValue('--align-self') || 'auto';
    const alignSelect = document.querySelector('#align_self');
    if (alignSelect) {
        alignSelect.value = alignValue;
        this.setupAlignSelfListener(element, alignSelect);
    }
    
    // 2. Si c'est une image, AUSSI faire l'interface image
    if (shiftPressed && element.matches('figure.resize, .image, figure')) {
        this.initImageControls(element);
        console.log('🖼️ Interface image activée (Shift enfoncé)');
    } else if (element.matches('figure.resize, .image, figure')) {
        console.log('⌨️ Maintenez Shift pour l\'interface image');
    }
}



initImageControls(element) {
    console.log('🔍 initImageControls appelé avec:', element);
    
    const img = element.querySelector('img');
    console.log('🔍 Image trouvée:', img);
    
    if (!img) {
        console.log('❌ Pas d\'image trouvée');
        return;
    }
    
    console.log('🔧 Création ImageControls...');
    
    // Créer ImageControls
    const controls = new ImageControls(element, img, () => {
        const manipulator = new ImageManipulator();
        manipulator.generateCode(element, true);
    });
    
    console.log('✅ ImageControls créé:', controls);
    console.log('🔍 controls.parent:', controls.parent);
    
    controls.init();
}

   // === CALLBACKS ===

   setCodeGenerateCallback(callback) {
       this.onCodeGenerate = callback;
   }

   // === CLEANUP ===

   clearCache() {
       this.cache.clear();
   }

   cleanup() {
       this.clearCache();
       this.onCodeGenerate = null;
   }
}