/**
 * @name Commands
 * @file Commandes d'édition et formatage
 */
export class Commands {
  constructor(editor) {
    this.editor = editor;
  }
  
  toggleBold() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;
    
    const range = selection.range;
    const text = selection.text;
    
    // Vérifier si déjà en gras
    if (this.isWrappedInTag(range, ['B', 'STRONG'])) {
      this.unwrapTag(range, ['B', 'STRONG']);
    } else {
      this.wrapSelection(range, 'strong');
    }
  }
  
  toggleItalic() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;
    
    const range = selection.range;
    
    if (this.isWrappedInTag(range, ['I', 'EM'])) {
      this.unwrapTag(range, ['I', 'EM']);
    } else {
      this.wrapSelection(range, 'em');
    }
  }
  
  wrapSelection(range, tagName) {
    const contents = range.extractContents();
    const wrapper = document.createElement(tagName);
    wrapper.className = 'editor-add';
    wrapper.appendChild(contents);
    range.insertNode(wrapper);
    
    // Maintenir la sélection
    range.selectNodeContents(wrapper);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  unwrapTag(range, tagNames) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }
    
    // Trouver l'élément de formatage parent
    let formatElement = null;
    let current = container;
    
    while (current && current !== document.body) {
      if (tagNames.includes(current.tagName)) {
        formatElement = current;
        break;
      }
      current = current.parentElement;
    }
    
    if (formatElement) {
      // Remplacer l'élément par son contenu
      const parent = formatElement.parentNode;
      while (formatElement.firstChild) {
        parent.insertBefore(formatElement.firstChild, formatElement);
      }
      parent.removeChild(formatElement);
      
      // Normaliser les nœuds de texte adjacents
      parent.normalize();
    }
  }
  
  isWrappedInTag(range, tagNames) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }
    
    let current = container;
    while (current && current !== document.body) {
      if (tagNames.includes(current.tagName)) {
        return true;
      }
      current = current.parentElement;
    }
    
    return false;
  }
  
  insertText(text) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  insertHTML(html) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const fragment = range.createContextualFragment(html);
    range.insertNode(fragment);
    range.collapse(false);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  deleteSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
  }
  
  selectAll(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}