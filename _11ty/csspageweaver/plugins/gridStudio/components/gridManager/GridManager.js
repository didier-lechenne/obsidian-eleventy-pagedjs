// components/gridManager/GridManager.js

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

   updateUI(element) {
       // Récupérer --align-self de l'élément
       const alignValue = element.style.getPropertyValue('--align-self') || 'auto';
       
       // Mettre à jour le dropdown
       const alignSelect = document.querySelector('#align_self');
       if (alignSelect) {
           alignSelect.value = alignValue;
           this.setupAlignSelfListener(element, alignSelect);
           console.log(`📍 Set select to: ${alignValue}`);
       }
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