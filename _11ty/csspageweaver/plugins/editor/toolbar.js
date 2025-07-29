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
    return `<button data-command="${this.command}" data-tooltip="${this.title}">${this.icon}</button>`;
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
      }),
      new ToolbarButton('smallcaps', 'ᴀᴀ', 'Petites capitales', () => {
        this.toolbar.editor.commands.toggleSmallCaps();
      }),
      new ToolbarButton('superscript', 'x²', 'Exposant', () => {
        this.toolbar.editor.commands.toggleSuperscript();
      })
    ];
  }
}

// Extension pour le lettrage (letter-spacing)
class LetterSpacingExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
    this.currentSpan = null;
    this.input = null;
  }
  
  getButtons() {
    return [
      new ToolbarButton('letter-spacing', 'A ↔ A', 'Lettrage (Letter-spacing)', () => {
        this.toggleLetterSpacing();
      })
    ];
  }
  
  toggleLetterSpacing() {
    // Si input actif, valider et fermer
    if (this.input && this.input.style.display !== 'none') {
      this.hideLetterSpacingInput();
      return;
    }
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Vérifier si déjà dans un span avec --ls
    const existingSpan = this.findLetterSpacingSpan(range);
    
    if (existingSpan) {
      this.showLetterSpacingInput(existingSpan);
    } else {
      this.wrapWithLetterSpacing(range);
    }
  }
  
  findLetterSpacingSpan(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }
    
    let current = container;
    while (current && current !== document.body) {
      if (current.tagName === 'SPAN' && 
          current.style.getPropertyValue('--ls') !== '') {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  wrapWithLetterSpacing(range) {
    const contents = range.extractContents();
    const span = document.createElement('span');
    span.style.setProperty('--ls', '0');
    span.className = 'editor-add';
    span.appendChild(contents);
    
    range.insertNode(span);
    range.selectNodeContents(span);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Afficher l'input immédiatement
    this.showLetterSpacingInput(span);
  }
  
  showLetterSpacingInput(span) {
    this.currentSpan = span;
    
    // Créer ou réutiliser l'input
    if (!this.input) {
      this.createLetterSpacingInput();
    }
    
    // Récupérer la valeur actuelle
    const currentValue = span.style.getPropertyValue('--ls') || '0';
    this.input.value = currentValue;
    
    // Changer le bouton LS en validation
    const lsButton = this.toolbar.element.querySelector('[data-command="letter-spacing"]');
    if (lsButton) {
      lsButton.innerHTML = '✓';
      lsButton.title = 'Valider letter-spacing (Entrée)';
      lsButton.classList.add('editing');
    }
    
    // Positionner l'input près de la toolbar
    this.positionInput();
    this.input.style.display = 'block';
    this.input.focus();
    this.input.select();
  }
  
  createLetterSpacingInput() {
    this.input = document.createElement('input');
    this.input.type = 'number';
    this.input.step = '1';
    this.input.className = 'letter-spacing-input';
    
    // Events
    this.input.addEventListener('input', (e) => {
      if (this.currentSpan) {
        const value = e.target.value;
        this.currentSpan.style.setProperty('--ls', value);
      }
    });
    
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        this.hideLetterSpacingInput();
      }
    });
    
    this.input.addEventListener('blur', () => {
      // Délai plus long et vérifier si on reste dans la toolbar/input
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement !== this.input && !this.toolbar.element.contains(activeElement)) {
          this.hideLetterSpacingInput();
        }
      }, 200);
    });
    
    document.body.appendChild(this.input);
  }
  
  positionInput() {
    if (!this.toolbar.element || !this.input) return;
    
    const toolbarRect = this.toolbar.element.getBoundingClientRect();
    this.input.style.left = `${toolbarRect.right + 10 + window.scrollX}px`;
    this.input.style.top = `${toolbarRect.top + window.scrollY}px`;
  }
  
  hideLetterSpacingInput() {
    if (this.input) {
      this.input.style.display = 'none';
    }
    
    // Restaurer le bouton LS
    const lsButton = this.toolbar.element.querySelector('[data-command="letter-spacing"]');
    if (lsButton) {
      lsButton.innerHTML = 'A ↔ A';
      lsButton.title = 'Lettrage (Letter-spacing)';
      lsButton.classList.remove('editing');
    }
    
    this.currentSpan = null;
    
    // Masquer la toolbar maintenant
    this.toolbar.isVisible = false;
    this.toolbar.element.classList.remove('visible');
  }
  
  // Méthode pour nettoyer lors du reset
  resetLetterSpacing(element) {
    const letterSpacingSpans = element.querySelectorAll('span[style*="--ls"]');
    letterSpacingSpans.forEach(span => {
      if (span.classList.contains('editor-add')) {
        // Remplacer par le contenu
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
      }
    });
  }
}

// Extension pour espaces typographiques
class SpacingExtension {
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
    
    // Nettoyer letter-spacing
    const letterSpacingExt = this.toolbar.extensions.find(ext => ext instanceof LetterSpacingExtension);
    if (letterSpacingExt) {
      letterSpacingExt.resetLetterSpacing(element);
    }
    
    // Remplacer spans d'espaces par espaces normaux
    const spaceSpans = element.querySelectorAll('span.i_space.editor-add');
    spaceSpans.forEach(span => {
      const textNode = document.createTextNode(' ');
      span.parentNode.replaceChild(textNode, span);
    });
    
    // Supprimer spans de guillemets mais garder le contenu
    const quoteSpans = element.querySelectorAll('span.editor-add:not(.i_space)');
    quoteSpans.forEach(span => {
      while (span.firstChild) {
        span.parentNode.insertBefore(span.firstChild, span);
      }
      span.parentNode.removeChild(span);
    });
    
    // Supprimer formatage Bold/Italic ajouté par l'éditeur uniquement
    const boldElements = element.querySelectorAll('strong.editor-add, b.editor-add');
    boldElements.forEach(el => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });
    
    const italicElements = element.querySelectorAll('em.editor-add, i.editor-add');
    italicElements.forEach(el => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });

    // Supprimer SmallCaps ajoutés par l'éditeur uniquement
    const smallCapsElements = element.querySelectorAll('span.small-caps.editor-add');
    smallCapsElements.forEach(el => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });

    // Supprimer Superscript ajoutés par l'éditeur uniquement
    const supElements = element.querySelectorAll('sup.editor-add');
    supElements.forEach(el => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
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
    
    // Reconstituer l'élément complet si scindé par PagedJS
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
      linkStyle: 'inlined'
    });

    // Ajouter règles personnalisées sans écraser les règles par défaut
    this.turndown.addRule('smallcaps', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && node.classList.contains('small-caps');
      },
      replacement: function (content) {
        return `<smallcaps>${content}</smallcaps>`;
      }
    });

    this.turndown.addRule('breakcolumnSpan', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && node.classList.contains('breakcolumn');
      },
      replacement: function () {
        return '<breakcolumn>';
      }
    });

    this.turndown.addRule('letterSpacing', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && 
               node.style.getPropertyValue('--ls') !== '';
      },
      replacement: function (content, node) {
        const lsValue = node.style.getPropertyValue('--ls');
        return `<span style="--ls:${lsValue}">${content}</span>`;
      }
    });

    this.turndown.addRule('removeSpaceSpans', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && 
              node.className.includes('i_space');
      },
      replacement: function (content) {
        return content;
      }
    });

    this.turndown.addRule('lineBreak', {
      filter: 'br',
      replacement: function () {
        return '<br/>';
      }
    });

    this.turndown.addRule('footnoteCall', {
      filter: function (node) {
        return node.nodeName === 'A' && 
              node.classList.contains('footnote') && 
              node.hasAttribute('data-footnote-call');
      },
      replacement: function (content, node) {
        const footnoteId = node.getAttribute('data-footnote-call') || node.getAttribute('data-ref');
        const footnoteContent = document.querySelector(`#note-${footnoteId}`);
        
        if (footnoteContent) {
          // Utiliser service global configuré
          const noteMarkdown = window.mainTurndownService.turndown(footnoteContent.innerHTML)
            .replace(/\s+/g, ' ').trim()
            .replace(/\]/g, '\\]');
          return `^[${noteMarkdown}]`;
        }
        
        return `^[Note ${footnoteId.substring(0, 8)}]`;
      }
    });

    this.turndown.addRule('footnoteDefinition', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && 
              node.classList.contains('footnote') && 
              node.hasAttribute('id') && 
              node.id.startsWith('note-');
      },
      replacement: function () {
        return '';
      }
    });

   this.turndown.addRule('superscript', {
      filter: 'sup',
      replacement: function (content) {
        return `<sup>${content}</sup>`;
      }
    }); 

    // Stocker référence globale pour les règles
    window.mainTurndownService = this.turndown;

    // Keep rules après l'initialisation
    this.turndown.keep(function(node) {
      return (node.nodeName === 'SPAN' && node.hasAttribute('style')) ||
            (node.nodeName === 'SUP') ||
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
      new LetterSpacingExtension(this),
      new SpacingExtension(this),
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
    
    // Event listener spécial pour copy-md pendant letter-spacing
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-command="copy-md"]');
      if (button && this.element.contains(button)) {
        const buttonObj = this.buttons.get('copy-md');
        if (buttonObj && buttonObj.action) {
          buttonObj.action();
        }
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
    // Ne pas masquer si l'input letter-spacing est actif
    const letterSpacingExt = this.extensions.find(ext => ext instanceof LetterSpacingExtension);
    if (letterSpacingExt && letterSpacingExt.input && letterSpacingExt.input.style.display !== 'none') {
      return;
    }
    
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
    const isSmallCaps = this.isFormatActive('smallcaps', element);
    const isSuperscript = this.isFormatActive('superscript', element);
    const hasLetterSpacing = this.hasLetterSpacing(element);
    
    this.element.querySelector('[data-command="bold"]')?.classList.toggle('active', isBold);
    this.element.querySelector('[data-command="italic"]')?.classList.toggle('active', isItalic);
    this.element.querySelector('[data-command="smallcaps"]')?.classList.toggle('active', isSmallCaps);
    this.element.querySelector('[data-command="superscript"]')?.classList.toggle('active', isSuperscript);
    this.element.querySelector('[data-command="letter-spacing"]')?.classList.toggle('active', hasLetterSpacing);
  }
  
  isFormatActive(format, element) {
    const tags = {
      bold: ['B', 'STRONG'],
      italic: ['I', 'EM'],
      smallcaps: ['SPAN'],
      superscript: ['SUP']
    };
    
    let current = element;
    while (current && current !== document.body) {
      if (format === 'smallcaps') {
        if (current.tagName === 'SPAN' && current.classList.contains('small-caps')) {
          return true;
        }
      } else if (format === 'superscript') {
        if (current.tagName === 'SUP') {
          return true;
        }
      } else if (tags[format] && tags[format].includes(current.tagName)) {
        return true;
      }
      current = current.parentElement;
    }
    
    return false;
  }
  
  hasLetterSpacing(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === 'SPAN' && 
          current.style.getPropertyValue('--ls') !== '') {
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