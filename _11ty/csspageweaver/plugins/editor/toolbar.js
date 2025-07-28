/**
 * @name Toolbar
 * @file Barre d'outils avec système d'extensions
 */

// Classe de base pour les boutons
class ToolbarButton {
  constructor(command, icon, title, action) {
    this.command = command;
    this.icon = icon;
    this.title = title;
    this.action = action;
  }
  
  render() {
    return `<button data-command="${this.command}" title="${this.title}">${this.icon}</button>`;
  }
}

// Extension pour formatage de base
class FormattingExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }
  
  getButtons() {
    return [
      new ToolbarButton('bold', '<strong>B</strong>', 'Gras (Ctrl+B)', () => {
        this.toolbar.editor.commands.toggleBold();
      }),
      new ToolbarButton('italic', '<em>I</em>', 'Italique (Ctrl+I)', () => {
        this.toolbar.editor.commands.toggleItalic();
      })
    ];
  }
}

// Extension française
class FrenchExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }
  
  getButtons() {
    return [
      new ToolbarButton('nbsp', '⎵', 'Espace insécable', () => {
        this.insertNonBreakingSpace();
      }),
      new ToolbarButton('nnbsp', '⸱', 'Espace insécable fine', () => {
        this.insertNarrowNonBreakingSpace();
      }),
      new ToolbarButton('quote-open', '«', 'Guillemet ouvrant', () => {
        this.insertOpeningQuote();
      }),
      new ToolbarButton('quote-close', '»', 'Guillemet fermant', () => {
        this.insertClosingQuote();
      }),
      new ToolbarButton('br', '↵', 'Saut de ligne', () => {
        this.insertBreak();
      }),
      new ToolbarButton('reset', '⟲', 'Supprimer transformations', () => {
        this.resetTransformations();
      })
    ];
  }
  
  insertNonBreakingSpace() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const span = document.createElement('span');
      span.className = 'i_space non-breaking-space editor-add';
      span.textContent = '\u00A0';
      
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  insertNarrowNonBreakingSpace() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const span = document.createElement('span');
      span.className = 'i_space narrow-no-break-space editor-add';
      span.textContent = '\u202F';
      
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  insertOpeningQuote() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      // Créer « + espace fine insécable avec span
      const fragment = document.createDocumentFragment();
      const quote = document.createElement('span');
      quote.className = 'editor-add';
      quote.textContent = '«';
      fragment.appendChild(quote);
      
      const span = document.createElement('span');
      span.className = 'i_space narrow-no-break-space editor-add';
      span.textContent = '\u202F';
      fragment.appendChild(span);
      
      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  insertClosingQuote() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      // Créer espace fine insécable + » avec span
      const fragment = document.createDocumentFragment();
      
      const span = document.createElement('span');
      span.className = 'i_space narrow-no-break-space editor-add';
      span.textContent = '\u202F';
      fragment.appendChild(span);
      
      const quote = document.createElement('span');
      quote.className = 'editor-add';
      quote.textContent = '»';
      fragment.appendChild(quote);
      
      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  insertBreak() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const br = document.createElement('br');
      br.className = 'editor-add';
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  resetTransformations() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    let element = selection.anchorNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    
    // Trouver l'élément éditable parent
    while (element && !element.hasAttribute('data-editable')) {
      element = element.parentElement;
    }
    
    if (!element) return;
    
    // Remplacer spans d'espaces par espaces normaux
    const spaceSpans = element.querySelectorAll('span.i_space.editor-add');
    spaceSpans.forEach(span => {
      const textNode = document.createTextNode(' ');
      span.parentNode.replaceChild(textNode, span);
    });
    
    // Supprimer autres éléments ajoutés (guillemets, br)
    const otherAddedElements = element.querySelectorAll('.editor-add:not(.i_space)');
    otherAddedElements.forEach(el => el.remove());
    
    // Supprimer formatage Bold/Italic
    const boldElements = element.querySelectorAll('strong, b');
    boldElements.forEach(el => {
      const textNode = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(textNode, el);
    });
    
    const italicElements = element.querySelectorAll('em, i');
    italicElements.forEach(el => {
      const textNode = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(textNode, el);
    });
    
    // Normaliser les nœuds de texte
    element.normalize();
  }
}

// Extension utilitaires
class UtilsExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }

    convertNoteContentToMarkdown(htmlElement) {
    const noteConverter = new window.TurndownService({
      headingStyle: 'atx',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined'
    });
    
    let markdown = noteConverter.turndown(htmlElement.innerHTML);
    markdown = markdown.replace(/\s+/g, ' ').trim();
    markdown = markdown.replace(/\]/g, '\\]');
    
    return markdown;
  }
  
  getButtons() {
    return [
      new ToolbarButton('copy-md', '📋', 'Copier élément en Markdown', () => {
        this.copyElementAsMarkdown();
      })
    ];
  }
  
  copyElementAsMarkdown() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    let element = selection.anchorNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    
    while (element && !element.hasAttribute('data-editable')) {
      element = element.parentElement;
    }
    
    if (!element) return;
    
    // Reconstituer l'élément complet s'il est scindé
    const completeHTML = this.reconstructSplitElement(element);
    const markdown = this.toolbar.turndown.turndown(completeHTML);
    
    navigator.clipboard.writeText(markdown).then(() => {
      this.toolbar.showCopyFeedback();
    }).catch(err => {
      console.error('Erreur copie:', err);
    });
  }
  
  reconstructSplitElement(element) {
    const dataRef = element.getAttribute('data-ref');
    
    // Si pas de data-ref, retourner l'élément seul
    if (!dataRef) {
      return element.innerHTML;
    }
    
    // Trouver tous les fragments avec le même data-ref
    const fragments = document.querySelectorAll(`[data-ref="${dataRef}"]`);
    
    if (fragments.length <= 1) {
      return element.innerHTML;
    }
    
    // Reconstituer dans l'ordre d'apparition
    let completeContent = '';
    fragments.forEach(fragment => {
      completeContent += fragment.innerHTML;
    });
    
    return completeContent;
  }
}

export class Toolbar {
  constructor(editor) {
    this.editor = editor;
    this.element = null;
    this.isVisible = false;
    this.buttons = new Map();
    this.extensions = [];
    
    this.setupTurndown();
    this.registerExtensions();
    this.createToolbar();
  }
  
setupTurndown() {
  this.turndown = new window.TurndownService({
    headingStyle: 'atx',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    rules: {
      // Règles pour les éléments Eleventy
      smallcaps: {
        filter: function (node) {
          return node.nodeName === 'SPAN' && node.classList.contains('small-caps');
        },
        replacement: function (content) {
          return `<smallcaps>${content}</smallcaps>`;
        }
      },
      breakcolumnSpan: {
        filter: function (node) {
          return node.nodeName === 'SPAN' && node.classList.contains('breakcolumn');
        },
        replacement: function () {
          return '<breakcolumn>';
        }
      },
      removeSpaceSpans: {
        filter: function (node) {
          return node.nodeName === 'SPAN' && 
                node.className.includes('i_space');
        },
        replacement: function (content) {
          return content;
        }
      },
      lineBreak: {
        filter: 'br',
        replacement: function () {
          return '<br/>';
        }
      },
      footnoteCall: {
        filter: function (node) {
          return node.nodeName === 'A' && 
                node.classList.contains('footnote') && 
                node.hasAttribute('data-footnote-call');
        },
        replacement: function (content, node) {
          const footnoteId = node.getAttribute('data-footnote-call') || node.getAttribute('data-ref');
          const footnoteContent = document.querySelector(`#note-${footnoteId}`);
          
          if (footnoteContent) {
            const utilsExt = new UtilsExtension(null);
            const noteMarkdown = utilsExt.convertNoteContentToMarkdown(footnoteContent);
            return `^[${noteMarkdown}]`;
          }
          
          return `^[Note ${footnoteId.substring(0, 8)}]`;
        }
      },
      footnoteDefinition: {
        filter: function (node) {
          return node.nodeName === 'SPAN' && 
                node.classList.contains('footnote') && 
                node.hasAttribute('id') && 
                node.id.startsWith('note-');
        },
        replacement: function () {
          return '';
        }
      }
    }
  }); // <- Fermeture du constructeur

  // Keep rules après l'initialisation
  this.turndown.keep(function(node) {
    return node.nodeName === 'SPAN' && 
           node.getAttribute('style') && 
           node.getAttribute('style').includes('--ls:');
  });
  
  this.turndown.keep(function(node) {
    return (node.nodeName === 'SPAN' && node.hasAttribute('style')) ||
           (node.nodeName === 'BR' && (
             node.classList.contains('breakpage') ||
             node.classList.contains('breakcolumn') ||
             node.classList.contains('breakscreen') ||
             node.classList.contains('breakprint')
           ));
  });
}
  
  registerExtensions() {
    this.extensions = [
      new FormattingExtension(this),
      new FrenchExtension(this),
      new UtilsExtension(this)
    ];
  }
  
  createToolbar() {
    this.element = document.createElement('div');
    this.element.className = 'paged-editor-toolbar';
    
    // Générer boutons depuis extensions
    let buttonsHTML = '';
    this.extensions.forEach(extension => {
      extension.getButtons().forEach(button => {
        this.buttons.set(button.command, button);
        buttonsHTML += button.render();
      });
    });
    
    this.element.innerHTML = buttonsHTML;
    document.body.appendChild(this.element);
    this.bindEvents();
  }
  
  bindEvents() {
    this.element.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    this.element.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      
      const command = button.dataset.command;
      const buttonObj = this.buttons.get(command);
      if (buttonObj && buttonObj.action) {
        buttonObj.action();
        this.updateButtonStates();
      }
    });
  }
  
  show(selection) {
    if (!selection || !selection.range) return;
    
    this.isVisible = true;
    this.element.classList.add('visible');
    
    this.positionToolbar(selection.range);
    this.updateButtonStates();
  }
  
  hide() {
    this.isVisible = false;
    this.element.classList.remove('visible');
  }
  
  positionToolbar(range) {
    const rect = range.getBoundingClientRect();
    
    // Vérifier si les coordonnées sont valides
    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }
    
    const toolbarRect = this.element.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2);
    let top = rect.top - toolbarRect.height - 50;
    
    const margin = 10;
    if (left < margin) left = margin;
    if (left + toolbarRect.width > window.innerWidth - margin) {
      left = window.innerWidth - toolbarRect.width - margin;
    }
    
    if (top < margin) {
      top = rect.bottom + 20;
    }
    
    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${top + window.scrollY}px`;
  }
  
  updateButtonStates() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const element = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;
    
    const isBold = this.isFormatActive('bold', element);
    const isItalic = this.isFormatActive('italic', element);
    
    this.element.querySelector('[data-command="bold"]')?.classList.toggle('active', isBold);
    this.element.querySelector('[data-command="italic"]')?.classList.toggle('active', isItalic);
  }
  
  isFormatActive(format, element) {
    const tags = {
      bold: ['B', 'STRONG'],
      italic: ['I', 'EM']
    };
    
    let current = element;
    while (current && current !== document.body) {
      if (tags[format] && tags[format].includes(current.tagName)) {
        return true;
      }
      current = current.parentElement;
    }
    
    return false;
  }
  
  showCopyFeedback() {
    const button = this.element.querySelector('[data-command="copy-md"]');
    const originalText = button.innerHTML;
    button.innerHTML = '✓';
    button.classList.add('success');
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('success');
    }, 1000);
  }
  
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}