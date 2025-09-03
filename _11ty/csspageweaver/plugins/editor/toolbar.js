import { PagedMarkdownRecovery } from "./recovery.js";
import { TOOLBAR_CONFIG } from "./toolbar-config.js";
import {
  UIFactory,
  ToolbarButton,
  ToolbarSelect,
  validateToolbarConfiguration,
} from "./ui-factory.js";
import { ACTIONS_REGISTRY } from "./actions.js";

export class Toolbar {
  constructor(editor, customConfig = null) {
    this.editor = editor;
    this.config = customConfig || TOOLBAR_CONFIG;

    // Validation de la configuration
    const validationReport = validateToolbarConfiguration(this.config);
    if (!validationReport.isValid) {
      console.error(
        "❌ Configuration de toolbar invalide:",
        validationReport.errors
      );
    }

    // État de la toolbar
    this.element = null;
    this.isVisible = false;

    // Maps pour stocker les éléments créés
    this.buttons = new Map();
    this.selects = new Map();

    // Recovery centralisé pour HTML→MD
    this.recovery = new PagedMarkdownRecovery(editor);

    // Initialisation
    this.setupGlobalTurndown();
    this.createToolbar();
  }

  setupGlobalTurndown() {
    // Service global pour compatibilité
    window.mainTurndownService = this.recovery.getTurndownService();
  }

  createToolbar() {
    this.element = document.createElement("div");
    this.element.className = "paged-editor-toolbar";

    let elementsHTML = "";

    this.config.elements.forEach((actionId) => {
      const element = UIFactory.createElement(actionId, this.editor);

      if (!element) return;

      if (element instanceof ToolbarButton) {
        this.buttons.set(actionId, element);
      } else if (element instanceof ToolbarSelect) {
        this.selects.set(actionId, element);
      }

      elementsHTML += element.render();
    });

    this.element.innerHTML = elementsHTML;
    document.body.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    // Empêcher la perte de sélection
    this.element.addEventListener("mousedown", (e) => {
      if (!e.target.classList.contains("ls-input")) {
        e.preventDefault();
      }
    });

    // Délégation d'événements unifiée
    this.element.addEventListener("click", (e) => {
      // Input letter-spacing - ne rien faire sur click
      if (e.target.classList.contains("ls-input")) {
        e.stopPropagation();
        return;
      }

      // Gestion des options de dropdown
      const option = e.target.closest(".custom-option");
      if (option) {
        this.handleCustomOptionClick(option);
        return;
      }

      // Gestion des triggers de dropdown
      const trigger = e.target.closest(".select-trigger");
      if (trigger) {
        e.stopPropagation();
        this.toggleDropdown(trigger);
        return;
      }

      // Gestion des boutons
      const button = e.target.closest(".toolbar-button");
      if (button && !button.disabled) {
        const actionId = button.getAttribute("data-action");
        this.executeAction(actionId);
        return;
      }
    });

    // Gestion des inputs letter-spacing
    this.element.addEventListener("input", (e) => {
      if (e.target.classList.contains("ls-input")) {
        this.handleLetterSpacingInput(e);
      }
    });

    // Fermer dropdowns en cliquant ailleurs
    document.addEventListener("click", (e) => {
      if (!this.element.contains(e.target)) {
        this.closeAllDropdowns();
      }
    });
  }

  handleCustomOptionClick(option) {
    const select = option.closest(".toolbar-select");
    const actionId = select.getAttribute("data-action");
    const value = option.getAttribute("data-value");

    this.executeAction(actionId, value);
    this.closeDropdown(select);
    this.updateSelectDisplay(select, option);
  }

  handleLetterSpacingInput(e) {
    const value = parseFloat(e.target.value) || 0;
    this.executeAction("letter-spacing", value);
  }

  toggleDropdown(trigger) {
    const select = trigger.parentElement;
    const dropdown = select.querySelector(".select-dropdown");
    const isOpen = dropdown.style.display === "block";

    this.closeAllDropdowns();

    if (!isOpen) {
      dropdown.style.display = "block";
      select.classList.add("active");
    }
  }

  closeDropdown(select) {
    const dropdown = select.querySelector(".select-dropdown");
    dropdown.style.display = "none";
    select.classList.remove("active");
  }

  closeAllDropdowns() {
    this.element.querySelectorAll(".select-dropdown").forEach(dropdown => {
      dropdown.style.display = "none";
    });
    this.element.querySelectorAll(".toolbar-select.active").forEach(select => {
      select.classList.remove("active");
    });
  }

  updateSelectDisplay(select, option) {
    const trigger = select.querySelector(".select-trigger");
    const label = trigger.querySelector(".select-label");
    label.textContent = option.textContent;
  }

  executeAction(actionId, value = null) {
    const action = ACTIONS_REGISTRY[actionId];
    if (!action) {
      console.warn(`Action inconnue: ${actionId}`);
      return;
    }

    try {
      action.execute(this.editor, value);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'action ${actionId}:`, error);
    }
  }

  show(selection) {
    if (!selection || !selection.range) {
      this.element.style.display = "none";
      return;
    }

    const rect = selection.range.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - this.element.offsetWidth / 2;
    const y = rect.top - this.element.offsetHeight - 10;

    this.element.style.left = `${Math.max(10, x)}px`;
    this.element.style.top = `${Math.max(10, y)}px`;
    this.element.style.display = "flex";
    this.isVisible = true;
  }

  hide() {
    this.element.style.display = "none";
    this.isVisible = false;
    this.closeAllDropdowns();
  }

  isVisible() {
    return this.isVisible;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}