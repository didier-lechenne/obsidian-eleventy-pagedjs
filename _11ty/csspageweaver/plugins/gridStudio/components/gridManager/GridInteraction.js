// components/gridManager/GridInteraction.js

export class GridInteraction {
   constructor() {
       this.edgeZone = 15;
       this.cornerZone = 20;
   }

   getInteractionZone(element, clientX, clientY) {
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

   getCursorForZone(zone) {
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
       
       return cursors[zone] || 'default';
   }

   updateCursor(element, zone) {
       element.style.cursor = this.getCursorForZone(zone);
   }
}