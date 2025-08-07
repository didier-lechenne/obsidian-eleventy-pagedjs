import * as turndownPlugins from "./turndown-plugins/index.js";
import { PagedMarkdownRecovery } from "./recovery.js";
import { TOOLBAR_CONFIG } from "./toolbar-config.js";
import {
  UIFactory,
  ToolbarButton,
  ToolbarSelect,
  validateToolbarConfiguration,
} from "./ui-factory.js";
import { ACTIONS_REGISTRY } from "./actions.js";

/**
 * @name Toolbar
 * @description Barre d'outils refactorisée - Version nettoyée
 *
 * Responsabilités claires :
 * - Interface utilisateur (affichage, positionnement, événements)
 * - Coordination avec les actions (pas de logique métier)
 * - Gestion Turndown pour les actions d'export
 */
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

    // Recovery pour les actions d'export
    this.recovery = new PagedMarkdownRecovery();

    // Initialisation
    this.setupTurndown();
    this.createToolbar();
  }

  /**
   * Configuration Turndown - utilisée par commands.js via this.editor.toolbar.turndown
   */
  setupTurndown() {
    this.turndown = new window.TurndownService({
      headingStyle: "atx",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
    });

    this.turndown.use(Object.values(turndownPlugins));
    window.mainTurndownService = this.turndown;
  }

  /**
   * Création de la toolbar via factory
   */
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

  /**
   * Gestion des événements DOM
   */
  bindEvents() {
    // Empêcher la perte de sélection
    this.element.addEventListener("mousedown", (e) => {
      if (!e.target.classList.contains("ls-input")) {
        e.preventDefault();
      }
    });

    this.element.addEventListener("input", (e) => {
      if (e.target.classList.contains("ls-input")) {
        const value = parseInt(e.target.value) || 0;
        const selection = this.editor.selection.getCurrentSelection();
        if (selection?.isValid) {
          this.editor.commands.applyLetterSpacing(value);
        }
      }
    });

    // Délégation d'événements unifiée
    this.element.addEventListener("click", (e) => {
      // Input letter-spacing
      if (e.target.classList.contains("ls-input")) {
        e.stopPropagation();
        return;
      }

      // Menus déroulants
      const selectTrigger = e.target.closest(".select-trigger");
      if (selectTrigger) {
        e.preventDefault();
        this.toggleCustomDropdown(selectTrigger);
        return;
      }

      // Options des menus
      const customOption = e.target.closest(".custom-option");
      if (customOption) {
        this.handleCustomOptionClick(customOption);
        return;
      }

      // Boutons standards
      const button = e.target.closest("button");
      if (!button) return;

      const command = button.dataset.command;
      const buttonElement = this.buttons.get(command);

      if (buttonElement?.action) {
        buttonElement.action();
        this.updateButtonStates();
      }
    });

    // Événement séparé pour l'input
    this.element.addEventListener("input", (e) => {
      if (e.target.classList.contains("ls-input")) {
        const value = parseInt(e.target.value) || 0;
        this.editor.commands.applyLetterSpacing(value);
      }
    });
  }

  /**
   * Gestion des dropdowns personnalisés
   */
  toggleCustomDropdown(trigger) {
    const wrapper = trigger.closest(".toolbar-select-wrapper");
    const dropdown = wrapper.querySelector(".custom-dropdown");

    // Fermer les autres dropdowns
    this.element
      .querySelectorAll(".custom-dropdown")
      .forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.style.display = "none";
        }
      });

    // Toggle du dropdown actuel
    const isCurrentlyVisible = dropdown.style.display !== "none";
    dropdown.style.display = isCurrentlyVisible ? "none" : "block";
  }

  /**
   * Gestion des sélections dans les dropdowns
   */
  handleCustomOptionClick(optionElement) {
    const wrapper = optionElement.closest(".toolbar-select-wrapper");
    const command = wrapper.dataset.command;
    const value = optionElement.dataset.value;

    const selectElement = this.selects.get(command);
    if (selectElement?.action && value) {
      selectElement.action(value);
    }

    // Fermer le dropdown
    const dropdown = wrapper.querySelector(".custom-dropdown");
    dropdown.style.display = "none";
  }

  /**
   * Affichage de la toolbar
   */
  show(selection) {
    if (!selection?.range) return;

    this.isVisible = true;
    this.element.classList.add("visible");

    this.positionToolbar(selection.range);
    this.updateButtonStates();
  }

  /**
   * Masquage de la toolbar
   */
  hide() {
    if (document.activeElement?.classList.contains("ls-input")) {
      return;
    }

    // Fermer tous les dropdowns
    this.element.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
      dropdown.style.display = "none";
    });

    this.isVisible = false;
    this.element.classList.remove("visible");
  }

  /**
   * Positionnement de la toolbar
   */
  positionToolbar(range) {
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }

    const toolbarRect = this.element.getBoundingClientRect();

    // Position centrée horizontalement
    let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
    let top = rect.top - toolbarRect.height - 80;

    // Ajustements pour rester dans l'écran
    const margin = 80;
    if (left < margin) left = margin;
    if (left + toolbarRect.width > window.innerWidth - margin) {
      left = window.innerWidth - toolbarRect.width - margin;
    }

    // Afficher en-dessous si pas de place au-dessus
    if (top < margin) {
      top = rect.bottom + 80;
    }

    // Application avec scroll
    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${top + window.scrollY}px`;
  }

  /**
   * Mise à jour des états des boutons
   * Délègue la logique métier aux actions via checkActive
   */
  updateButtonStates() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const element =
      ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;

    // Utilise les fonctions checkActive définies dans actions.js
    this.buttons.forEach((buttonElement, actionId) => {
      if (buttonElement.isToggle) {
        const isActive = buttonElement.updateActiveState(element);
        const domButton = this.element.querySelector(
          `[data-command="${actionId}"]`
        );
        domButton?.classList.toggle("active", isActive);
      }
    });
  }

  /**
   * Méthodes utilitaires pour l'extensibilité
   */
  getAction(actionId) {
    return ACTIONS_REGISTRY[actionId] || null;
  }

  addAction(actionId, position = -1) {
    if (position === -1) {
      this.config.elements.push(actionId);
    } else {
      this.config.elements.splice(position, 0, actionId);
    }

    this.rebuildToolbar();
  }

  removeAction(actionId) {
    const index = this.config.elements.indexOf(actionId);
    if (index > -1) {
      this.config.elements.splice(index, 1);
      this.rebuildToolbar();
    }
  }

  rebuildToolbar() {
    this.element.innerHTML = "";
    this.buttons.clear();
    this.selects.clear();
    this.createToolbar();
  }

  /**
   * Nettoyage
   */
  destroy() {
    if (this.element) {
      this.element.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
        dropdown.style.display = "none";
      });
    }

    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.buttons.clear();
    this.selects.clear();
    this.element = null;
  }
}
