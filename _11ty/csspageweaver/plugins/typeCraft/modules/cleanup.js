/**
 * @file modules/cleanup.js

 */

import { StateManager } from './state.js';

/**
 * Module de nettoyage des éléments
 */
export const CleanupModule = {
  /**
   * Nettoie un ou plusieurs éléments
   */
  clearElement(ids) {
    // Convertir en tableau si ce n'est pas déjà un tableau
    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    // Traiter chaque ID
    ids.forEach((id) => {
      StateManager.log("Clearing element", id);
      const element = document.querySelector(`[editable-id='${id}']`);

      if (element) {
        this.cleanElementFormatting(element);
        StateManager.log(`Element ${id} cleaned (typeCraft formatting only, non-breaking spaces preserved)`);
      }
    });
  },

  /**
   * Nettoie le formatage d'un élément spécifique
   */
  cleanElementFormatting(element) {
    // 1. Supprimer les styles inline de letter-spacing
    element.style.letterSpacing = '';
    
    // 2. Supprimer SEULEMENT les spans typeCraft letter-spacing (préserver les spans originaux)
    const typeCraftLetterSpacingSpans = element.querySelectorAll('span.letterSpacing.tc-added');
    typeCraftLetterSpacingSpans.forEach(span => {
      span.replaceWith(...span.childNodes);
    });

    // 3. Supprimer SEULEMENT le formatage bold/italic typeCraft (préserver le formatage original)
    const typeCraftBoldElements = element.querySelectorAll('strong.tc-added, b.tc-added');
    typeCraftBoldElements.forEach(boldElement => {
      boldElement.replaceWith(...boldElement.childNodes);
    });

    const typeCraftItalicElements = element.querySelectorAll('em.tc-added, i.tc-added');
    typeCraftItalicElements.forEach(italicElement => {
      italicElement.replaceWith(...italicElement.childNodes);
    });

    // 4. Supprimer SEULEMENT les sauts de ligne typeCraft (préserver les <br> originaux)
    const typeCraftLineBreaks = element.querySelectorAll('br.tc-added');
    typeCraftLineBreaks.forEach(br => {
      br.remove();
    });
    
    // Note: Les espaces insécables (normaux et fins) ne sont JAMAIS supprimés 
    // car ils peuvent être légitimes dans le contenu original ET sont utiles 
    // pour la typographie même s'ils ont été ajoutés manuellement
  },

  /**
   * Nettoie tous les éléments editables de la page
   */
  clearAllElements() {
    const editableElements = document.querySelectorAll('[editable-id]');
    const ids = Array.from(editableElements).map(el => el.getAttribute('editable-id'));
    this.clearElement(ids);
    StateManager.log(`Cleared all ${ids.length} editable elements`);
  },

  /**
   * Nettoie uniquement l'élément actuellement en cours d'édition
   */
  clearCurrentElement() {
    if (StateManager.currentEditingElement) {
      const id = StateManager.currentEditingElement.getAttribute('editable-id');
      this.clearElement(id);
    } else {
      StateManager.log('No element currently being edited');
    }
  },

  /**
   * Supprime un type spécifique de formatage typeCraft
   */
  removeSpecificFormatting(element, formattingType) {
    switch (formattingType) {
      case 'letterSpacing':
        const spans = element.querySelectorAll('span.letterSpacing.tc-added');
        spans.forEach(span => span.replaceWith(...span.childNodes));
        element.style.letterSpacing = '';
        break;
        
      case 'bold':
        const bolds = element.querySelectorAll('strong.tc-added, b.tc-added');
        bolds.forEach(bold => bold.replaceWith(...bold.childNodes));
        break;
        
      case 'italic':
        const italics = element.querySelectorAll('em.tc-added, i.tc-added');
        italics.forEach(italic => italic.replaceWith(...italic.childNodes));
        break;
        
      case 'lineBreaks':
        const brs = element.querySelectorAll('br.tc-added');
        brs.forEach(br => br.remove());
        break;
        
      default:
        StateManager.log(`Unknown formatting type: ${formattingType}`);
    }
    
    StateManager.log(`Removed ${formattingType} formatting from element`);
  }
};