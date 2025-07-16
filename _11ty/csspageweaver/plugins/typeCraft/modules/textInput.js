/**
 * @file modules/textInput.js
 * Gestion des saisies spéciales (espaces insécables, guillemets, sauts de ligne)
 */

import { StateManager } from './state.js';

/**
 * Module de gestion des saisies de texte spéciales
 */
export const TextInputModule = {
  /**
   * Insère un saut de ligne
   */
  insertLineBreak() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const br = document.createElement('br');
    br.classList.add('tc-added');
    range.insertNode(br);
    
    // Repositionner le curseur après le <br>
    range.setStartAfter(br);
    range.setEndAfter(br);
    selection.removeAllRanges();
    selection.addRange(range);
    
    StateManager.log('Line break added');
  },

  /**
   * Insère un espace insécable normal (\u00A0)
   */
  insertNormalNonBreakingSpace() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const nbsp = document.createTextNode('\u00A0');
    range.insertNode(nbsp);
    
    // Repositionner le curseur après l'espace insécable
    range.setStartAfter(nbsp);
    range.setEndAfter(nbsp);
    selection.removeAllRanges();
    selection.addRange(range);
    
    StateManager.log('Normal space added');
  },

  /**
   * Insère un espace insécable fine (\u202F)
   */
  insertThinNonBreakingSpace() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const thinNbsp = document.createTextNode('\u202F');
    range.insertNode(thinNbsp);
    
    // Repositionner le curseur après l'espace insécable fine
    range.setStartAfter(thinNbsp);
    range.setEndAfter(thinNbsp);
    selection.removeAllRanges();
    selection.addRange(range);
    
    StateManager.log('Thin non-breaking space added');
  },

  /**
   * Gère les remplacements automatiques de guillemets
   * >> devient [espace fine insécable]»
   * << devient «[espace fine insécable]
   */
  handleQuoteReplacement(event) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType !== Node.TEXT_NODE) return;
    
    const textContent = textNode.textContent;
    const cursorPos = range.startOffset;
    
    // Détecter >> et remplacer par [espace fine insécable]»
    if (event.data === '>' && cursorPos >= 2 && textContent.substring(cursorPos - 2, cursorPos) === '>>') {
      const replacement = '\u202F»';
      const newText = textContent.substring(0, cursorPos - 2) + replacement + textContent.substring(cursorPos);
      textNode.textContent = newText;
      
      // Repositionner le curseur
      const newCursorPos = cursorPos - 2 + replacement.length;
      range.setStart(textNode, newCursorPos);
      range.setEnd(textNode, newCursorPos);
      selection.removeAllRanges();
      selection.addRange(range);
      
      StateManager.log('>> replaced with french closing quote');
    }
    
    // Détecter << et remplacer par «[espace fine insécable]
    else if (event.data === '<' && cursorPos >= 2 && textContent.substring(cursorPos - 2, cursorPos) === '<<') {
      const replacement = '«\u202F';
      const newText = textContent.substring(0, cursorPos - 2) + replacement + textContent.substring(cursorPos);
      textNode.textContent = newText;
      
      // Repositionner le curseur
      const newCursorPos = cursorPos - 2 + replacement.length;
      range.setStart(textNode, newCursorPos);
      range.setEnd(textNode, newCursorPos);
      selection.removeAllRanges();
      selection.addRange(range);
      
      StateManager.log('<< replaced with french opening quote');
    }
  },

  /**
   * Vérifie si l'élément est ciblé pour la saisie
   */
  isTargetElement(eventTarget, currentEditingElement) {
    const isTargetElement = eventTarget === currentEditingElement;
    const isTargetSpan = eventTarget.classList && 
                        eventTarget.classList.contains('letterSpacing') && 
                        eventTarget.classList.contains('tc-added') &&
                        eventTarget.parentElement === currentEditingElement;
    
    return isTargetElement || isTargetSpan;
  }
};