/**
 * @name Editor
 * @file Plugin éditeur Medium-like pour PagedJS avec formatage français
 * @author Editor Plugin
 */
import { Handler } from "/csspageweaver/lib/paged.esm.js";
import { Toolbar } from "./toolbar.js";
import { Selection } from "./selection.js";
import { Commands } from "./commands.js";

export default class Editor extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    this.options = {
      selector: "[data-editable], .footnote, figcaption",
      shortcuts: true,
    };

    this.isActive = false;
    this.editableElements = [];
    this.currentSelection = null;

    // Modules
    this.toolbar = null;
    this.selection = null;
    this.commands = null;

    this.autoCopyTimeout = null;
    this.autoCopyEnabled = true;

    // Export temps réel
    this.realtimeExport = {
      enabled: false,
      callback: null,
      debounceDelay: 300
    };
    this.exportTimeout = null;
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
    var sections = content.querySelectorAll("section");
    var sectionCounter = 0;
    var idCounter = 0;
    var idPrefix = "a";

    sections.forEach((section) => {
      idCounter = 0;
      idPrefix = String.fromCharCode(sectionCounter + 97);

      const selectors =
        "*:not(hgroup) p, *:not(hgroup) li, *:not(hgroup) h1, *:not(hgroup) h2, *:not(hgroup) h3, *:not(hgroup) h4, *:not(hgroup) h5, *:not(hgroup) h6, .footnote, figcaption";
      const targetElements = section.querySelectorAll(selectors);

      targetElements.forEach((element) => {
        idCounter++;
        var editableId = `${idPrefix}${idCounter}`;
        element.setAttribute("editable-id", editableId);
        this.assignEditableCapabilities(element);
      });

      sectionCounter++;
    });
  }

  assignEditableCapabilities(element) {
    element.setAttribute("data-editable", "");
  }

  setupToggle() {
    var toggle = document.getElementById("editor-toggle");
    if (toggle) {
      // Restaurer état depuis localStorage
      const savedState = localStorage.getItem("editor-plugin");
      if (savedState === "true") {
        toggle.checked = true;
        this.activate();
      }

      toggle.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.activate();
          localStorage.setItem("editor-plugin", "true");
        } else {
          this.deactivate();
          localStorage.setItem("editor-plugin", "false");
        }
      });
    }
  }

  initModules() {
    this.toolbar = new Toolbar(this);
    this.selection = new Selection(this);
    this.commands = new Commands(this);
  }

  setupEditableElements() {
    this.editableElements = document.querySelectorAll(this.options.selector);

    this.editableElements.forEach((element) => {
      element.contentEditable = true;
      element.classList.add("paged-editor-content");
      element.spellcheck = false;
      element.autocorrect = "off";
      element.autocapitalize = "off";
    });
  }

  setupEventListeners() {
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("paste", this.handlePaste.bind(this));
    document.addEventListener("focusin", this.handleFocusIn.bind(this));
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
  }

  handlePaste(event) {
    if (!this.isInEditableElement(event.target)) return;

    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    this.commands.insertText(text);
  }

  handleShortcuts(event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case "b":
        event.preventDefault();
        this.commands.toggleBold();
        break;
      case "i":
        event.preventDefault();
        this.commands.toggleItalic();
        break;
      case "c":
        if (event.shiftKey) {
          event.preventDefault();
          // Appeler directement la méthode centralisée
          this.commands.copyElementAsMarkdown({ silent: false, auto: false });
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
      if (
        selection.isValid ||
        activeElement.hasAttribute("data-editable") ||
        activeElement.classList.contains("footnote")
      ) {
        this.currentSelection = selection;
        this.toolbar.show(selection);

        // Auto-copie TOUJOURS quand dans un élément éditable
        this.autoCopyToClipboard();

        // Déclencher l'export temps réel
        this.triggerRealtimeExport();

        return;
      }
    }

    this.currentSelection = null;
    this.toolbar.hide();
  }

  autoCopyToClipboard() {
  // Délai pour éviter la copie répétée lors du drag
  clearTimeout(this.autoCopyTimeout);
  this.autoCopyTimeout = setTimeout(() => {
    // Appeler directement la méthode centralisée dans Commands
    this.commands.performAutoCopy();
  }, 300);
}

  // === NOUVELLES MÉTHODES POUR L'EXPORT TEMPS RÉEL ===

  enableRealtimeExport(callback, delay = 300) {
    this.realtimeExport.enabled = true;
    this.realtimeExport.callback = callback;
    this.realtimeExport.debounceDelay = delay;
  }

  disableRealtimeExport() {
    this.realtimeExport.enabled = false;
    this.realtimeExport.callback = null;
    clearTimeout(this.exportTimeout);
  }

 triggerRealtimeExport() {
  if (!this.realtimeExport.enabled || !this.realtimeExport.callback) return;

  // Debounce pour éviter trop d'appels
  clearTimeout(this.exportTimeout);
  this.exportTimeout = setTimeout(() => {
    const activeElement = document.activeElement;
    if (activeElement && this.isInEditableElement(activeElement)) {
      // Générer le markdown directement avec Commands
      const completeHTML = this.commands.reconstructSplitElement(activeElement);
      const markdown = this.toolbar.turndown.turndown(completeHTML);
      this.realtimeExport.callback(markdown, activeElement);
    }
  }, this.realtimeExport.debounceDelay);
}

  // === MÉTHODES EXISTANTES ===

  isInEditableElement(node) {
    if (!node) return false;

    let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    while (element) {
      if (
        element.hasAttribute("data-editable") ||
        element.classList.contains("footnote")
      ) {
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
    document.body.classList.add("paged-editor-active");
  }

  deactivate() {
    this.isActive = false;
    this.toolbar.hide();
    document.body.classList.remove("paged-editor-active");

    // Nettoyer les éléments éditables
    this.editableElements.forEach((element) => {
      element.contentEditable = false;
      element.classList.remove("paged-editor-content");
    });

    // Désactiver l'export temps réel
    this.disableRealtimeExport();
  }

//   getContent(selector) {
//     const element = document.querySelector(selector || this.options.selector);
//     return element ? element.innerHTML : "";
//   }

//   setContent(content, selector) {
//     const element = document.querySelector(selector || this.options.selector);
//     if (element) {
//       element.innerHTML = content;
//     }
//   }
}