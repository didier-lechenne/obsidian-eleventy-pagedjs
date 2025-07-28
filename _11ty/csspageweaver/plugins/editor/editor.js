/**
 * @name Editor
 * @file Plugin éditeur Medium-like pour PagedJS avec formatage français
 * @author Editor Plugin
 */
import { Handler } from '/csspageweaver/lib/paged.esm.js';
import { Toolbar } from './toolbar.js';
import { Selection } from './selection.js';
import { Commands } from './commands.js';
import { FrenchFormat } from './french-format.js';

export default class Editor extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    
    this.options = {
      selector: '[data-editable], .footnote, figcaption',
      autoTypography: true,
      shortcuts: true
    };
    
    this.isActive = false;
    this.editableElements = [];
    this.currentSelection = null;
    
    // Modules
    this.toolbar = null;
    this.selection = null;
    this.commands = null;
    this.frenchFormat = null;
  }
  
  beforeParsed(content) {
    this.assignEditableIds(content);
    this.initModules();
    this.setupEventListeners();
  }
  
  afterRendered() {
    this.setupEditableElements();
    this.setupToggle();
  }
  
  assignEditableIds(content) {
    var sections = content.querySelectorAll('section');
    var sectionCounter = 0;
    var idCounter = 0;
    var idPrefix = 'a';

    sections.forEach((section) => {
      idCounter = 0;
      idPrefix = String.fromCharCode(sectionCounter + 97);

      const selectors = '*:not(hgroup) p, *:not(hgroup) li, *:not(hgroup) h1, *:not(hgroup) h2, *:not(hgroup) h3, *:not(hgroup) h4, *:not(hgroup) h5, *:not(hgroup) h6, .footnote, figcaption';
      const targetElements = section.querySelectorAll(selectors);

      targetElements.forEach((element) => {
        idCounter++;
        var editableId = `${idPrefix}${idCounter}`;
        element.setAttribute('editable-id', editableId);
        this.assignEditableCapabilities(element);
      });

      sectionCounter++;
    });
  }
  
  assignEditableCapabilities(element) {
    element.setAttribute('data-editable', '');
  }
  
  setupToggle() {
    var toggle = document.getElementById('editor-toggle');
    if (toggle) {
      // Restaurer état depuis localStorage
      const savedState = localStorage.getItem('editor-plugin-active');
      if (savedState === 'true') {
        toggle.checked = true;
        this.activate();
      }
      
      toggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.activate();
          localStorage.setItem('editor-plugin-active', 'true');
        } else {
          this.deactivate();
          localStorage.setItem('editor-plugin-active', 'false');
        }
      });
    }
  }
  
  initModules() {
    this.toolbar = new Toolbar(this);
    this.selection = new Selection(this);
    this.commands = new Commands(this);
    this.frenchFormat = new FrenchFormat(this);
  }
  
  setupEditableElements() {
    this.editableElements = document.querySelectorAll(this.options.selector);
    
    this.editableElements.forEach(element => {
      element.contentEditable = true;
      element.classList.add('paged-editor-content');
      element.spellcheck = false;
      element.autocorrect = 'off';
      element.autocapitalize = 'off';
    });
  }
  
  setupEventListeners() {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('input', this.handleInput.bind(this));
    document.addEventListener('paste', this.handlePaste.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
  }
  
  handleFocusIn(event) {
    if (!this.isActive) return;
    if (this.isInEditableElement(event.target)) {
      // Créer une sélection au curseur
      const selection = window.getSelection();
      if (selection.rangeCount === 0) {
        const range = document.createRange();
        range.setStart(event.target, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      setTimeout(() => {
        const currentSelection = this.selection.getCurrentSelection();
        if (currentSelection) {
          this.toolbar.show(currentSelection);
        }
      }, 10);
    }
  }
  
  handleMouseUp(event) {
    this.debouncedUpdateSelection();
  }
  
  debouncedUpdateSelection = this.debounce(() => {
    this.updateSelection();
  }, 100);
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  handleKeyUp(event) {
    if (this.isNavigationKey(event.keyCode)) return;
    setTimeout(() => this.updateSelection(), 10);
  }
  
  handleKeyDown(event) {
    if (!this.isInEditableElement(event.target)) return;
    
    if (this.options.shortcuts) {
      this.handleShortcuts(event);
    }
    
    if (this.options.autoTypography) {
      this.frenchFormat.handleKeyDown(event);
    }
  }
  
  handleInput(event) {
    if (!this.isActive) return;
    if (!this.isInEditableElement(event.target)) return;
    
    if (this.options.autoTypography) {
      this.frenchFormat.processInput(event);
    }
  }
  
  handlePaste(event) {
    if (!this.isInEditableElement(event.target)) return;
    
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    this.commands.insertText(text);
  }
  
  handleShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.commands.toggleBold();
          break;
        case 'i':
          event.preventDefault();
          this.commands.toggleItalic();
          break;
        case 'c':
          if (event.shiftKey) {
            event.preventDefault();
            this.toolbar.copySelectionAsMarkdown();
          }
          break;
      }
    }
  }
  
  updateSelection() {
    if (!this.isActive) return;
    
    const selection = this.selection.getCurrentSelection();
    
    if (selection && this.isInEditableElement(selection.anchorNode)) {
      // Afficher si sélection valide OU si curseur dans élément éditable ou footnote
      const activeElement = document.activeElement;
      if (selection.isValid || 
          activeElement.hasAttribute('data-editable') || 
          activeElement.classList.contains('footnote')) {
        this.currentSelection = selection;
        this.toolbar.show(selection);
        return;
      }
    }
    
    this.currentSelection = null;
    this.toolbar.hide();
  }
  
  isInEditableElement(node) {
    if (!node) return false;
    
    let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    
    while (element) {
      if (element.hasAttribute('data-editable') || element.classList.contains('footnote')) {
        return true;
      }
      element = element.parentElement;
    }
    
    return false;
  }
  
  isNavigationKey(keyCode) {
    return [37, 38, 39, 40, 16, 17, 18].includes(keyCode);
  }
  
  activate() {
    this.isActive = true;
    document.body.classList.add('paged-editor-active');
  }
  
  deactivate() {
    this.isActive = false;
    this.toolbar.hide();
    document.body.classList.remove('paged-editor-active');
    
    // Nettoyer les éléments éditables
    this.editableElements.forEach(element => {
      element.contentEditable = false;
      element.classList.remove('paged-editor-content');
    });
  }
  
  getContent(selector) {
    const element = document.querySelector(selector || this.options.selector);
    return element ? element.innerHTML : '';
  }
  
  setContent(content, selector) {
    const element = document.querySelector(selector || this.options.selector);
    if (element) {
      element.innerHTML = content;
    }
  }
}