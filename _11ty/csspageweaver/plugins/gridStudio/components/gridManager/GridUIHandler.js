// components/gridManager/GridUIHandler.js

export class GridUIHandler {
   constructor() {
       this.onCodeGenerate = null;
   }

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

   updateAlignSelfUI(element) {
       const alignValue = element.style.getPropertyValue('--align-self') || 'auto';
       const alignSelect = document.querySelector('#align_self');
       
       if (alignSelect) {
           alignSelect.value = alignValue;
           this.setupAlignSelfListener(element, alignSelect);
           console.log(`📍 Set select to: ${alignValue}`);
       }
   }

   setCodeGenerateCallback(callback) {
       this.onCodeGenerate = callback;
   }

   cleanup() {
       this.onCodeGenerate = null;
   }
}