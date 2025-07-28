/**
 * @name FrenchFormat
 * @file Formatage automatique typographie française
 */
export class FrenchFormat {
  constructor(editor) {
    this.editor = editor;
    this.nbsp = '\u00A0'; // Espace insécable
    
    // Règles de remplacement
    this.rules = [
      // Guillemets
      { pattern: /"/g, replacement: '«\u00A0' },
      { pattern: /"/g, replacement: '\u00A0»' },
      
      // Ponctuation haute : ; ! ?
      { pattern: /\s*([;!?])/g, replacement: '\u00A0$1' },
      
      // Deux-points
      { pattern: /\s*:/g, replacement: '\u00A0:' },
      
      // Points de suspension
      { pattern: /\.{3}/g, replacement: '…' },
      
      // Espaces multiples
      { pattern: /  +/g, replacement: ' ' },
      
      // Tirets
      { pattern: /--/g, replacement: '—' }
    ];
  }
  
  handleKeyDown(event) {
    const key = event.key;
    
    // Gestion guillemets automatiques
    if (key === '"') {
      event.preventDefault();
      this.insertSmartQuotes();
      return;
    }
    
    // Ponctuation haute
    if ([';', '!', '?', ':'].includes(key)) {
      event.preventDefault();
      this.insertPunctuationWithSpace(key);
      return;
    }
    
    // Points de suspension
    if (key === '.' && this.isTripleDot()) {
      event.preventDefault();
      this.replaceWithEllipsis();
      return;
    }
  }
  
  processInput(event) {
    if (event.inputType === 'insertText') {
      setTimeout(() => this.applyAutoCorrections(), 10);
    }
  }
  
  insertSmartQuotes() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const text = range.toString();
    
    if (text) {
      // Entourer sélection
      range.deleteContents();
      range.insertNode(document.createTextNode(`«${this.nbsp}${text}${this.nbsp}»`));
    } else {
      // Détecter ouverture/fermeture contextuelle
      const before = this.getTextBefore(range, 10);
      const isOpening = !before.includes('«') || before.lastIndexOf('»') > before.lastIndexOf('«');
      
      if (isOpening) {
        range.insertNode(document.createTextNode(`«${this.nbsp}`));
      } else {
        range.insertNode(document.createTextNode(`${this.nbsp}»`));
      }
    }
    
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  insertPunctuationWithSpace(punct) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Supprimer espace avant si présent
    const before = this.getTextBefore(range, 1);
    if (before === ' ') {
      range.setStart(range.startContainer, range.startOffset - 1);
    }
    
    range.deleteContents();
    range.insertNode(document.createTextNode(`${this.nbsp}${punct}`));
    range.collapse(false);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  isTripleDot() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    const before = this.getTextBefore(range, 2);
    
    return before === '..';
  }
  
  replaceWithEllipsis() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.setStart(range.startContainer, range.startOffset - 2);
    range.deleteContents();
    range.insertNode(document.createTextNode('…'));
    range.collapse(false);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  getTextBefore(range, length) {
    const container = range.startContainer;
    if (container.nodeType !== Node.TEXT_NODE) return '';
    
    const offset = range.startOffset;
    const start = Math.max(0, offset - length);
    
    return container.textContent.substring(start, offset);
  }
  
  applyAutoCorrections() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection) return;
    
    const element = selection.anchorNode;
    if (!this.editor.isInEditableElement(element)) return;
    
    // Appliquer corrections sur le paragraphe courant
    let paragraph = element;
    while (paragraph && paragraph.tagName !== 'P' && paragraph !== document.body) {
      paragraph = paragraph.parentElement;
    }
    
    if (!paragraph || paragraph === document.body) return;
    
    const originalText = paragraph.textContent;
    let correctedText = originalText;
    
    // Appliquer règles
    this.rules.forEach(rule => {
      correctedText = correctedText.replace(rule.pattern, rule.replacement);
    });
    
    if (correctedText !== originalText) {
      // Sauvegarder position curseur
      const savedSelection = this.editor.selection.saveSelection();
      
      // Remplacer texte
      paragraph.textContent = correctedText;
      
      // Restaurer position (approximative)
      if (savedSelection) {
        this.editor.selection.restoreSelection(savedSelection);
      }
    }
  }
  
  formatText(text) {
    let result = text;
    
    this.rules.forEach(rule => {
      result = result.replace(rule.pattern, rule.replacement);
    });
    
    return result;
  }
  
  insertNonBreakingSpace() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(this.nbsp));
    range.collapse(false);
    
    selection.removeAllRanges();
    selection.addRange(range);
  }
}