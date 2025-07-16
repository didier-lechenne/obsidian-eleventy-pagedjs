/**
 * @name typeCraft
 * @author Didier Lechenne. <didier@lechenne.fr>
 * @see { @link  }
 */

// modules
import { StateManager } from './modules/state.js';
import { FormattingModule } from './modules/formatting.js';
import { LetterSpacingModule } from './modules/letterSpacing.js';
import { TextInputModule } from './modules/textInput.js';
import { ClipboardModule } from './modules/clipboard.js';
import { EventsModule } from './modules/events.js';
import { CleanupModule } from './modules/cleanup.js';

/**
 * Raccourcis configurables (format simple pour utilisateurs)
 */
const shortcuts = {
  bold: 'Shift+B',
  italic: 'Shift+I', 
  reset: 'Shift+R',
  copy: 'Shift+C',
  lineBreak: 'Shift+Enter',
  normalSpace: 'Shift+ ',        // Espace = ' '
  thinSpace: 'Shift+Ctrl+ '      // Espace = ' '
};

/**
 * API principale de typeCraft
 */
export const typeCraft = () => ({
  
  formatting: FormattingModule,

  ui: () => ({
    toggle: () => ({
      button: (id) => {
        StateManager.log(`Button toggle called for ${id} - handled by cssPageWeaver`);
      },

      contentEditable: () => {
        const editableElements = document.querySelectorAll('[editable-id]');
        
        if (StateManager.isEditMode) {
          editableElements.forEach((element) => {
            element.classList.add('tc-editable');
            
            const clickHandler = (event) => {
              event.preventDefault();
              event.stopPropagation();
              
              const clickedElement = event.target;
              const editableId = clickedElement.getAttribute('editable-id');
              
              if (!editableId) return;
              
              if (StateManager.currentEditingElement) {
                StateManager.currentEditingElement.contentEditable = false;
                StateManager.currentEditingElement.classList.remove('tc-editing');
                StateManager.currentEditingElement.classList.add('tc-editable');
              }
              
              StateManager.currentEditingElement = clickedElement;
              clickedElement.contentEditable = true;
              clickedElement.classList.remove('tc-editable');
              clickedElement.classList.add('tc-editing');
              clickedElement.focus();
              
              StateManager.log(`Element ${editableId} selected for editing`);
            };
            
            element.addEventListener('click', clickHandler);
            StateManager.addEventListeners(element, [
              { event: 'click', handler: clickHandler }
            ]);
          });
        } else {
          editableElements.forEach((element) => {
            element.classList.remove('tc-editable', 'tc-editing');
            element.contentEditable = false;
            StateManager.removeEventListeners(element);
          });
          
          if (StateManager.currentEditingElement) {
            ClipboardModule.copyToClipboard();
            StateManager.currentEditingElement = null;
          }
        }
      },
    }),

    copyToClipboard: () => ClipboardModule.copyToClipboard(),
  }),

  /**
   * Toggle du mode édition avec événements personnalisés
   */
  edit: () => {
    StateManager.isEditMode = !StateManager.isEditMode;
    typeCraft().ui().toggle().contentEditable();
    
    if (StateManager.isEditMode) {
      attachCustomEvents();
    } else {
      StateManager.clearAllEventListeners();
    }
    
    StateManager.log(`Edit mode ${StateManager.isEditMode ? 'enabled' : 'disabled'}`);
  },

  clear: (ids) => CleanupModule.clearElement(ids),

  config: {
    set: (key, value) => StateManager.setConfig(key, value),
    get: (key) => StateManager.getConfig(key),
    enableDebug: () => StateManager.setConfig('debugMode', true),
    disableDebug: () => StateManager.setConfig('debugMode', false)
  },

  /**
   * Changer un raccourci (format simple)
   */
  setShortcut: (action, combination) => {
    shortcuts[action] = combination;
    StateManager.log(`Raccourci ${action} défini sur ${combination}`);
  },

  /**
   * Voir tous les raccourcis
   */
  showShortcuts: () => {
    console.log('=== Raccourcis typeCraft ===');
    for (const [action, combo] of Object.entries(shortcuts)) {
      console.log(`${action}: ${combo}`);
    }
    return shortcuts;
  },

  modules: {
    state: StateManager,
    formatting: FormattingModule,
    letterSpacing: LetterSpacingModule,
    textInput: TextInputModule,
    clipboard: ClipboardModule,
    events: EventsModule,
    cleanup: CleanupModule
  },

  utils: {
    isEditMode: () => StateManager.isEditMode,
    getCurrentElement: () => StateManager.currentEditingElement,
    log: (message, data) => StateManager.log(message, data),
    
    addCustomEvent: (element, eventType, handler) => {
      element.addEventListener(eventType, handler);
      StateManager.addEventListeners(element, [{ event: eventType, handler }]);
    }
  }
});

/**
 * Fonction helper pour parser les raccourcis
 */
function parseShortcut(combination) {
  const parts = combination.split('+');
  const result = { shift: false, ctrl: false, alt: false, key: '' };
  
  parts.forEach(part => {
    const p = part.toLowerCase();
    if (p === 'shift') result.shift = true;
    else if (p === 'ctrl') result.ctrl = true;
    else if (p === 'alt') result.alt = true;
    else {
      // Cas spécial pour l'espace
      if (part === ' ' || p === 'space') {
        result.key = ' ';
      } else {
        result.key = part.toUpperCase();
      }
    }
  });
  
  return result;
}

/**
 * Événements simplifiés avec raccourcis configurables
 */
function attachCustomEvents() {
  // Événements clavier
  const handleKeyDown = (event) => {
    const currentElement = StateManager.currentEditingElement;
    if (!currentElement) return;
    
    // Vérifier chaque raccourci
    for (const [action, combination] of Object.entries(shortcuts)) {
      const shortcut = parseShortcut(combination);
      
      if ((event.key === shortcut.key || 
           (shortcut.key === ' ' && event.key === ' ')) &&
          event.shiftKey === shortcut.shift &&
          event.ctrlKey === shortcut.ctrl &&
          event.altKey === shortcut.alt) {
        
        event.preventDefault();
        
        switch (action) {
          case 'reset':
            const id = currentElement.getAttribute('editable-id');
            CleanupModule.clearElement(id);
            break;
            
          case 'bold':
            const selection1 = window.getSelection();
            if (selection1.rangeCount > 0 && !selection1.isCollapsed) {
              FormattingModule.toggleBold(selection1);
            }
            break;
            
          case 'italic':
            const selection2 = window.getSelection();
            if (selection2.rangeCount > 0 && !selection2.isCollapsed) {
              FormattingModule.toggleItalic(selection2);
            }
            break;
            
          case 'copy':
            ClipboardModule.copyToClipboard();
            break;
            
          case 'lineBreak':
            TextInputModule.insertLineBreak();
            break;
            
          case 'normalSpace':
            TextInputModule.insertNormalNonBreakingSpace();
            break;
            
          case 'thinSpace':
            TextInputModule.insertThinNonBreakingSpace();
            break;
        }
        return;
      }
    }
  };

  // Espacement lettres (Shift + molette)
  const handleMouseOver = (event) => {
    const currentElement = StateManager.currentEditingElement;
    if (!currentElement) return;
    
    const wheelHandler = (wheelEvent) => {
      if (!wheelEvent.shiftKey) return;
      wheelEvent.preventDefault();
      
      const step = StateManager.getConfig('letterSpacingStep');
      const currentSpacing = LetterSpacingModule.getCurrentLetterSpacing(currentElement);
      const newSpacing = wheelEvent.deltaY > 0 ? currentSpacing - step : currentSpacing + step;
      
      LetterSpacingModule.applyLetterSpacing(currentElement, newSpacing);
    };
    
    const mouseLeaveHandler = () => {
      event.target.removeEventListener('wheel', wheelHandler);
      event.target.removeEventListener('mouseleave', mouseLeaveHandler);
    };
    
    event.target.addEventListener('wheel', wheelHandler);
    event.target.addEventListener('mouseleave', mouseLeaveHandler);
  };

  // Remplacements automatiques
  const handleInput = (event) => {
    const currentElement = StateManager.currentEditingElement;
    if (!currentElement) return;
    
    if (event.inputType === 'insertText' && (event.data === '>' || event.data === '<')) {
      TextInputModule.handleQuoteReplacement(event);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('input', handleInput);
  
  StateManager.addEventListeners(document, [
    { event: 'keydown', handler: handleKeyDown },
    { event: 'mouseover', handler: handleMouseOver },
    { event: 'input', handler: handleInput }
  ]);
}

typeCraft.data = [];
export default typeCraft;