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
      autoCopy: false, // Option pour l'auto-copie
    };

    this.isActive = false;

    // Modules
    this.toolbar = null;
    this.selection = null;
    this.commands = null;

    // Timer unifié pour debounce
    this._debounceTimer = null;

    // Cache des éléments éditables
    this.editableElements = null;
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
    const sections = content.querySelectorAll("section");
    let sectionCounter = 0;

    sections.forEach((section) => {
      let idCounter = 0;
      const idPrefix = String.fromCharCode(sectionCounter + 97);

      const selectors =
        "*:not(hgroup) p, *:not(hgroup) li, *:not(hgroup) h1, *:not(hgroup) h2, *:not(hgroup) h3, *:not(hgroup) h4, *:not(hgroup) h5, *:not(hgroup) h6, .footnote, figcaption";
      const targetElements = section.querySelectorAll(selectors);

      targetElements.forEach((element) => {
        idCounter++;
        const editableId = `${idPrefix}${idCounter}`;
        element.setAttribute("editable-id", editableId);
        element.setAttribute("data-editable", "");
      });

      sectionCounter++;
    });
  }

  setupToggle() {
    const toggle = document.getElementById("editor-toggle");
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
    // Cache des éléments éditables
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

    // CORRECTION: Gestionnaire de clic pour afficher la toolbar
    document.addEventListener("click", (e) => {
      if (!this.isActive) return;

      if (this.isInEditableElement(e.target)) {
        setTimeout(() => {
          const selection = this.selection.getCurrentSelection();
          if (selection && this.toolbar) {
            this.toolbar.show(selection);
          }
        }, 50);
      }
    });
  }

  handleFocusIn(event) {
    if (!this.isActive) return;
    if (this.isInEditableElement(event.target)) {
      // Créer une sélection au curseur
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const currentSelection = this.selection.getCurrentSelection();
        if (currentSelection) {
          this.toolbar.show(currentSelection);
        }
      }
    }
  }

  handleMouseUp(event) {
    if (!this.isActive) return;
    this.updateSelection();
  }

  handleKeyUp(event) {
    if (!this.isActive) return;
    this.updateSelection();
  }

  handleKeyDown(event) {
    if (!this.isActive) return;

    if (this.options.shortcuts) {
      this.handleShortcuts(event);
    }
  }

  handleShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case "b":
          event.preventDefault();
          this.commands.toggleBold();
          break;
        case "i":
          event.preventDefault();
          this.commands.toggleItalic();
          break;
      }
    }
  }

  handlePaste(event) {
    if (!this.isActive) return;

    const selection = this.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    this.commands.insertText(text);
  }

  debounce(func, wait) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(func, wait);
  }

  activate() {
    if (this.isActive) return;
    this.isActive = true;

    if (this.editableElements) {
      this.editableElements.forEach((element) => {
        element.contentEditable = true;
        element.classList.add("paged-editor-content");
      });
    }

    document.body.classList.add("paged-editor-active");
    console.log("✅ Éditeur activé");
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.editableElements) {
      this.editableElements.forEach((element) => {
        element.contentEditable = false;
        element.classList.remove("paged-editor-content");
      });
    }

    document.body.classList.remove("paged-editor-active");
    this.toolbar?.hide();
    console.log("❌ Éditeur désactivé");
  }

  updateSelection() {
    if (!this.isActive) return;

    const currentSelection = this.selection.getCurrentSelection();

    if (currentSelection?.isValid) {
      const activeElement = document.activeElement;

      if (
        this.isInEditableElement(
          currentSelection.range.commonAncestorContainer
        ) ||
        this.isInEditableElement(activeElement) ||
        activeElement?.classList.contains("footnote")
      ) {
        this.toolbar.show(currentSelection);
        this.autoCopyToClipboard();
        return;
      }
    }

    if (document.querySelector(".external-letterspacing-input")) {
      return; // Ne pas cacher la toolbar si l'input letter-spacing est actif
    }
    this.toolbar.hide();
  }

  autoCopyToClipboard() {
    // Délai pour éviter la copie répétée lors du drag
    this.debounce(() => {
      this.commands.performAutoCopy();
    }, 300);
  }

  isInEditableElement(node) {
    if (!node) return false;

    const element =
      node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    // Vérification rapide avec cache si disponible
    if (this.editableElements) {
      for (const editable of this.editableElements) {
        if (element === editable || editable.contains(element)) {
          return true;
        }
      }
      return false;
    }

    // Fallback si pas de cache
    return element.closest(this.options.selector) !== null;
  }

  // CORRECTION: Méthode manquante getCurrentElement
  getCurrentElement() {
    const selection = this.selection.getCurrentSelection();
    if (!selection?.isValid) return null;

    let element = selection.range.commonAncestorContainer;

    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    while (element && element !== document.body) {
      if (element.hasAttribute && element.hasAttribute("data-editable")) {
        return element;
      }
      element = element.parentElement;
    }

    return null;
  }

  // Méthodes API publiques simplifiées
  getActiveElement() {
    return document.activeElement;
  }

  isEditorActive() {
    return this.isActive;
  }

  // Méthode pour obtenir l'élément éditable actif
  getActiveEditableElement() {
    const activeElement = document.activeElement;
    if (this.isInEditableElement(activeElement)) {
      return activeElement.closest(this.options.selector);
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : container;
      return element.closest(this.options.selector);
    }

    return null;
  }

  cleanup() {
    // Nettoyage des timers
    clearTimeout(this._debounceTimer);

    // Nettoyage des modules
    this.toolbar?.destroy();
    this.selection = null;
    this.commands = null;

    // Reset du cache
    this.editableElements = null;
  }
}
