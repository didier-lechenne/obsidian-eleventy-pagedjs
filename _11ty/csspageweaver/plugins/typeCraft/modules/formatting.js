/**
 * @file modules/formatting.js
 * Gestion du formatage de texte (gras, italique)
 */

/**
 * Module de formatage de texte moderne avec classes de traçage
 */
export const FormattingModule = {
  /**
   * Toggle bold formatting using modern Selection API
   * @param {Selection} selection - Window selection object
   */
  toggleBold(selection) {
    if (!selection.rangeCount || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();
    
    // Vérifier si la sélection contient déjà du formatage bold ajouté par typeCraft
    const hastypeCraftBold = this.containstypeCraftElements(selectedContent, 'strong') ||
                              this.containstypeCraftElements(selectedContent, 'b');
    
    if (hastypeCraftBold) {
      // Retirer SEULEMENT le formatage bold ajouté par typeCraft
      this.removetypeCraftFormatting(selectedContent, ['strong', 'b']);
      range.insertNode(selectedContent);
    } else {
      // Ajouter le formatage gras avec classe de traçage
      const strong = document.createElement('strong');
      strong.classList.add('tc-added'); 
      strong.appendChild(selectedContent);
      range.insertNode(strong);
    }
    
    // Restaurer la sélection
    this.restoreSelection(selection, range);
  },

  /**
   * Toggle italic formatting using modern Selection API
   * @param {Selection} selection - Window selection object
   */
  toggleItalic(selection) {
    if (!selection.rangeCount || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();
    
    // Vérifier si la sélection contient déjà du formatage italic ajouté par typeCraft
    const hastypeCraftItalic = this.containstypeCraftElements(selectedContent, 'em') ||
                                this.containstypeCraftElements(selectedContent, 'i');
    
    if (hastypeCraftItalic) {
      // Retirer SEULEMENT le formatage italic ajouté par typeCraft
      this.removetypeCraftFormatting(selectedContent, ['em', 'i']);
      range.insertNode(selectedContent);
    } else {
      // Ajouter le formatage italique avec classe de traçage
      const em = document.createElement('em');
      em.classList.add('tc-added'); // ← CLASSE DE TRAÇAGE
      em.appendChild(selectedContent);
      range.insertNode(em);
    }
    
    // Restaurer la sélection
    this.restoreSelection(selection, range);
  },

  /**
   * Check if element or its parents have bold formatting
   */
  isElementBold(element) {
    if (!element || element === document.body) return false;
    
    const tagName = element.tagName?.toLowerCase();
    if (tagName === 'strong' || tagName === 'b') return true;
    
    const fontWeight = window.getComputedStyle(element).fontWeight;
    if (parseInt(fontWeight) >= 700 || fontWeight === 'bold') return true;
    
    return this.isElementBold(element.parentElement);
  },

  /**
   * Check if element or its parents have italic formatting
   */
  isElementItalic(element) {
    if (!element || element === document.body) return false;
    
    const tagName = element.tagName?.toLowerCase();
    if (tagName === 'em' || tagName === 'i') return true;
    
    const fontStyle = window.getComputedStyle(element).fontStyle;
    if (fontStyle === 'italic') return true;
    
    return this.isElementItalic(element.parentElement);
  },

  /**
   * Check if document fragment contains typeCraft-added elements of specific tags
   */
  containstypeCraftElements(fragment, tagName) {
    const elements = fragment.querySelectorAll(`${tagName}.tc-added`);
    return elements.length > 0;
  },

  /**
   * Remove only typeCraft-added formatting from document fragment
   */
  removetypeCraftFormatting(fragment, tagNames) {
    tagNames.forEach(tagName => {
      const elements = fragment.querySelectorAll(`${tagName}.tc-added`);
      elements.forEach(element => {
        // Remplacer l'élément par son contenu
        while (element.firstChild) {
          element.parentNode.insertBefore(element.firstChild, element);
        }
        element.remove();
      });
    });
  },

  /**
   * Restore selection after formatting change
   */
  restoreSelection(selection, range) {
    // Créer une nouvelle range pour la sélection restaurée
    const newRange = document.createRange();
    newRange.selectNodeContents(range.commonAncestorContainer);
    
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
};