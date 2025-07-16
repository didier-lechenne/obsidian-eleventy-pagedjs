/**
 * @file modules/events.js
 * Gestion centralisée des événements clavier et souris
 */

import { StateManager } from './state.js';
import { FormattingModule } from './formatting.js';
import { LetterSpacingModule } from './letterSpacing.js';
import { TextInputModule } from './textInput.js';
import { CleanupModule } from './cleanup.js';

/**
 * Module de gestion des événements
 */
export const EventsModule = {
  /**
   * Initialise tous les événements selon le mode
   */
  initializeEvents() {
    if (StateManager.isEditMode) {
      this.attachEvents();
    } else {
      this.detachEvents();
    }
  },

  /**
   * Attache tous les événements
   */
  attachEvents() {
    this.attachLetterSpacingEvents();
    this.attachKeyboardEvents();
    this.attachInputEvents();
    StateManager.log('Events attached');
  },

  /**
   * Détache tous les événements
   */
  detachEvents() {
    StateManager.clearAllEventListeners();
    StateManager.log('Events detached');
  },

  /**
   * Événements pour l'espacement des lettres (Shift + scroll)
   */
  attachLetterSpacingEvents() {
    const handleMouseOver = (event) => {
      const currentElement = StateManager.currentEditingElement;
      if (!currentElement || !LetterSpacingModule.isTargetElement(event.target, currentElement)) return;
      
      const targetElement = LetterSpacingModule.getRootElement(event.target, currentElement);
      
      const wheelHandler = (wheelEvent) => this.handleLetterSpacingWheel(wheelEvent, targetElement);
      const mouseLeaveHandler = () => {
        targetElement.removeEventListener('wheel', wheelHandler);
        targetElement.removeEventListener('mouseleave', mouseLeaveHandler);
      };
      
      targetElement.addEventListener('wheel', wheelHandler);
      targetElement.addEventListener('mouseleave', mouseLeaveHandler);
    };

    document.addEventListener('mouseover', handleMouseOver);
    StateManager.addEventListeners(document, [
      { event: 'mouseover', handler: handleMouseOver }
    ]);
  },

  /**
   * Gère l'espacement des lettres avec Shift + molette
   */
  handleLetterSpacingWheel(event, element) {
    if (!event.shiftKey) return;
    
    event.preventDefault();
    
    const step = StateManager.getConfig('letterSpacingStep');
    const currentSpacing = LetterSpacingModule.getCurrentLetterSpacing(element);
    const newSpacing = event.deltaY > 0 ? currentSpacing - step : currentSpacing + step;
    
    LetterSpacingModule.applyLetterSpacing(element, newSpacing);
  },

  /**
   * Événements clavier pour toutes les fonctionnalités
   */
  attachKeyboardEvents() {
    const handleKeyDown = (event) => {
      const currentElement = StateManager.currentEditingElement;
      if (!currentElement || !this.isTargetForKeyboard(event.target, currentElement)) return;
      
      // Reset (Shift + R)
      if (event.shiftKey && event.key === 'R') {
        event.preventDefault();
        const id = currentElement.getAttribute('editable-id');
        CleanupModule.clearElement(id);
        return;
      }
      
      // Saut de ligne (Shift + Enter)
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        TextInputModule.insertLineBreak();
        return;
      }
      
      // Espace insécable normal (Shift + Space sans Ctrl)
      if (event.shiftKey && !event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        TextInputModule.insertNormalNonBreakingSpace();
        return;
      }
      
      // Espace insécable fine (Shift + Ctrl + Space)
      if (event.shiftKey && event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        TextInputModule.insertThinNonBreakingSpace();
        return;
      }
      
      // Formatage gras (Shift + B)
      if (event.shiftKey && event.key === 'B') {
        event.preventDefault();
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
          FormattingModule.toggleBold(selection);
          StateManager.log('Bold formatting toggled');
        }
        return;
      }
      
      // Formatage italique (Shift + I)
      if (event.shiftKey && event.key === 'I') {
        event.preventDefault();
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
          FormattingModule.toggleItalic(selection);
          StateManager.log('Italic formatting toggled');
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    StateManager.addEventListeners(document, [
      { event: 'keydown', handler: handleKeyDown }
    ]);
  },

  /**
   * Événements de saisie pour les remplacements automatiques
   */
  attachInputEvents() {
    const handleInput = (event) => {
      const currentElement = StateManager.currentEditingElement;
      if (!currentElement || !TextInputModule.isTargetElement(event.target, currentElement)) return;
      
      // Remplacement automatique des guillemets
      if (event.inputType === 'insertText' && (event.data === '>' || event.data === '<')) {
        TextInputModule.handleQuoteReplacement(event);
      }
    };

    document.addEventListener('input', handleInput);
    StateManager.addEventListeners(document, [
      { event: 'input', handler: handleInput }
    ]);
  },

  /**
   * Vérifie si l'élément est ciblé pour les événements clavier
   */
  isTargetForKeyboard(eventTarget, currentEditingElement) {
    const isTargetElement = eventTarget === currentEditingElement;
    const isTargetSpan = eventTarget.classList && 
                        eventTarget.classList.contains('letterSpacing') && 
                        eventTarget.classList.contains('tc-added') &&
                        eventTarget.parentElement === currentEditingElement;
    
    return isTargetElement || isTargetSpan;
  }
};