/**
 * @file modules/letterSpacing.js
 * Gestion de l'espacement des lettres
 */

import { StateManager } from './state.js';

/**
 * Module de gestion de l'espacement des lettres
 */
export const LetterSpacingModule = {
  /**
   * Applique l'espacement des lettres à un élément
   */
  applyLetterSpacing(element, newLetterSpacing) {
    // Vérifier s'il y a déjà un span avec --ls qui entoure tout le contenu
    let existingSpan = null;
    if (element.children.length === 1 && 
        element.children[0].tagName === 'SPAN' && 
        element.children[0].classList.contains('letterSpacing') &&
        element.children[0].classList.contains('tc-added')) {
      existingSpan = element.children[0];
    }

    if (existingSpan) {
      // Modifier la valeur existante
      existingSpan.style.setProperty('--ls', newLetterSpacing.toFixed(2));
    } else {
      // Créer un nouveau span qui entoure tout le contenu
      const span = document.createElement('span');
      span.classList.add('letterSpacing');
      span.classList.add('tc-added'); // 
      span.style.setProperty('--ls', newLetterSpacing.toFixed(2));
      
      // Déplacer tout le contenu existant dans le span
      while (element.firstChild) {
        span.appendChild(element.firstChild);
      }
      
      // Ajouter le span à l'élément
      element.appendChild(span);
    }

    StateManager.log(`Letter spacing applied: --ls:${newLetterSpacing.toFixed(2)}`);
  },

  /**
   * Obtient la valeur actuelle d'espacement des lettres
   */
  getCurrentLetterSpacing(element) {
    const existingSpan = element.querySelector('span.letterSpacing.tc-added');
    return existingSpan ? parseFloat(existingSpan.style.getPropertyValue('--ls')) || 0 : 0;
  },

  /**
   * Supprime l'espacement des lettres typeCraft
   */
  removeLetterSpacing(element) {
    const typeCraftLetterSpacingSpans = element.querySelectorAll('span.letterSpacing.tc-added');
    typeCraftLetterSpacingSpans.forEach(span => {
      span.replaceWith(...span.childNodes);
    });
  },

  /**
   * Vérifie si un élément est ciblé pour l'espacement
   */
  isTargetElement(eventTarget, currentEditingElement) {
    const isTargetElement = eventTarget === currentEditingElement;
    const isTargetSpan = eventTarget.classList && 
                        eventTarget.classList.contains('letterSpacing') && 
                        eventTarget.classList.contains('tc-added') &&
                        eventTarget.parentElement === currentEditingElement;
    
    return isTargetElement || isTargetSpan;
  },

  /**
   * Obtient l'élément racine pour l'application de l'espacement
   */
  getRootElement(eventTarget, currentEditingElement) {
    return eventTarget === currentEditingElement ? eventTarget : eventTarget.parentElement;
  }
};