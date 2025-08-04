
/**
 * @name Selection
 * @file Gestion des sélections de texte
 */
export class Selection {
  constructor(editor) {
    this.editor = editor;
  }
  
  getCurrentSelection() {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) {
      return null;
    }
    
    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    
    return {
      selection,
      range,
      text,
      isValid: text.length > 0 || !range.collapsed, // Valide si texte OU sélection non-vide
      anchorNode: selection.anchorNode,
      focusNode: selection.focusNode,
      isCollapsed: selection.isCollapsed
    };
  }
  
  saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    return {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
  }
  
  restoreSelection(saved) {
    if (!saved) return;
    
    const range = document.createRange();
    range.setStart(saved.startContainer, saved.startOffset);
    range.setEnd(saved.endContainer, saved.endOffset);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  

  
  getSelectionBounds() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    return range.getBoundingClientRect();
  }
  

  
  isSelectionInEditableElement() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    return this.editor.isInEditableElement(container);
  }
  
  getSelectedHTML() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return '';
    
    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    return container.innerHTML;
  }
  
  replaceSelection(html) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const fragment = range.createContextualFragment(html);
    range.insertNode(fragment);
    
    // Positionner curseur à la fin
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  insertAtCursor(text) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  clearSelection() {
    window.getSelection().removeAllRanges();
  }
}