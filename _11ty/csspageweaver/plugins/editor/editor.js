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
      autoCopy: true,
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

    document.addEventListener("click", (e) => {
      if (!this.isActive) return;

      if (e.target.closest(".paged-editor-toolbar")) {
        return;
      }

      const element = e.target.closest(this.options.selector);
      if (element) {
        // Copie automatique en Markdown
        this.commands.triggerAutoCopy();

        // Afficher la toolbar même sans sélection de texte
        const selection = this.selection.getCurrentSelection();
        this.toolbar.show(selection || { range: null });
      } else {
        this.toolbar.hide();
      }
    });
  }

  handleMouseUp(e) {
    if (!this.isActive) return;
    this.debounce(() => {
      if (this.isInEditableElement(e.target)) {
        const selection = this.selection.getCurrentSelection();
        this.toolbar.show(selection || { range: null });
      }
    }, 100);
  }

  handleKeyUp(e) {
    if (!this.isActive) return;
    this.debounce(() => {
      if (this.isInEditableElement(e.target)) {
        const selection = this.selection.getCurrentSelection();
        this.toolbar.show(selection || { range: null });
      }
    }, 100);
  }

  handleKeyDown(e) {
    if (!this.isActive || !this.options.shortcuts) return;

    // Raccourcis clavier pour actions communes
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          this.commands.toggleFormatting("strong");
          break;
        case "i":
          e.preventDefault();
          this.commands.toggleFormatting("em");
          break;
      }
    }
  }

  handlePaste(e) {
    if (!this.isActive) return;

    // Empêcher le collage de HTML formaté
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  handleFocusIn(e) {
    if (!this.isActive) return;

    if (this.isInEditableElement(e.target)) {
      this.debounce(() => {
        const selection = this.selection.getCurrentSelection();
        this.toolbar.show(selection || { range: null });
      }, 50);
    }
  }

  // ====== MÉTHODES D'ACTIVATION ======

  activate() {
    if (this.isActive) return;

    this.isActive = true;
    document.body.classList.add("paged-editor-active");

    this.setupEditableElements();
    // La toolbar est déjà initialisée dans le constructeur

    console.log("✅ Éditeur activé");
  }

  deactivate() {
    if (!this.isActive) return;

    this.isActive = false;
    document.body.classList.remove("paged-editor-active");

    this.toolbar?.hide();

    // Désactiver l'édition
    if (this.editableElements) {
      this.editableElements.forEach((element) => {
        element.contentEditable = false;
        element.classList.remove("paged-editor-content");
      });
    }

    console.log("❌ Éditeur désactivé");
  }

  // ====== MÉTHODES UTILITAIRES ======

  debounce(func, delay) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(func, delay);
  }

  isInEditableElement(element) {
    if (!element || !element.nodeType) return false;

    // Remonter jusqu'à trouver un élément DOM
    element =
      element.nodeType === Node.TEXT_NODE ? element.parentElement : element;

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

  // MÉTHODE PRINCIPALE - getCurrentElement
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

  // Feedback visuel pour la copie
  showFeedback(message) {
    const feedback = document.createElement("div");
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      z-index: 10000;
      opacity: 1;
      transition: opacity 0.3s ease;
      font-size: 14px;
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.opacity = "0";
      setTimeout(() => {
        if (feedback.parentNode) {
          document.body.removeChild(feedback);
        }
      }, 300);
    }, 1500);
  }
}
