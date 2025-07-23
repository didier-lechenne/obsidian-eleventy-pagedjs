// components/gridManager/GridDetector.js

export class GridDetector {
   constructor() {
       this.cache = new Map();
   }

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

   getModularGridElement(element) {
       return element.closest('.modularGrid');
   }

   isValidGridElement(element) {
       return element && element.matches('.resize, .figure, .insert');
   }

   clearCache() {
       this.cache.clear();
   }
}