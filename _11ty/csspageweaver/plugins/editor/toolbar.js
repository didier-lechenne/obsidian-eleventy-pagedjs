import * as turndownPlugins from "./turndown-plugins/index.js";
import { PagedMarkdownRecovery } from "./recovery.js";
import { TOOLBAR_CONFIG } from "./config.js";
import { UIFactory, ToolbarButton, ToolbarSelect, validateToolbarConfiguration } from "./ui-factory.js";
import { ACTIONS_REGISTRY } from "./actions.js";

/**
 * @name Toolbar
 * @description Barre d'outils refactorisée utilisant l'architecture actions/factory
 * 
 * Cette version simplifie drastiquement la logique de création en déléguant
 * toute la complexité au registre d'actions et à la factory.
 * 
 * Architecture: Config → Actions → Factory → Toolbar → DOM
 */
export class Toolbar {
  constructor(editor, customConfig = null) {
    this.editor = editor;
    this.config = customConfig || TOOLBAR_CONFIG;
    
    // Validation de la configuration avant de continuer
    const validationReport = validateToolbarConfiguration(this.config);
    if (!validationReport.isValid) {
      console.error("❌ Configuration de toolbar invalide:", validationReport.errors);
      // On continue quand même avec les éléments valides pour éviter un crash total
    }
    
    // État de la toolbar
    this.element = null;
    this.isVisible = false;
    
    // Maps pour stocker les éléments créés, organisés par type pour un accès rapide
    this.buttons = new Map();
    this.selects = new Map();
    
    // Initialisation du système de recovery pour les actions d'export
    // Cette instance sera accessible via this.recovery par les actions qui en ont besoin
    this.recovery = new PagedMarkdownRecovery();
    
    // Initialisation des composants
    this.setupTurndown();
    this.createToolbar();
  }

  /**
   * Configuration du service de conversion HTML vers Markdown
   * Cette partie reste identique à l'ancienne version car elle ne dépend pas
   * de la structure des boutons
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
   * Création de la toolbar - Version simplifiée utilisant la factory
   * 
   * Cette méthode remplace l'ancienne logique complexe avec extensions multiples
   * par une approche directe et linéaire basée sur la configuration.
   */
  createToolbar() {
    // Création de l'élément DOM principal
    this.element = document.createElement("div");
    this.element.className = "paged-editor-toolbar";

    // Génération des éléments via la factory
    // Cette boucle remplace toute la logique des extensions multiples
    let elementsHTML = "";
    
    this.config.elements.forEach(actionId => {
      // La factory se charge de créer l'élément approprié selon le type d'action
      const element = UIFactory.createElement(actionId, this.editor);
      
      if (!element) {
        // L'élément n'a pas pu être créé (action inconnue), on continue
        return;
      }
      
      // Organisation des éléments créés dans les maps appropriées pour un accès rapide
      if (element instanceof ToolbarButton) {
        this.buttons.set(actionId, element);
      } else if (element instanceof ToolbarSelect) {
        this.selects.set(actionId, element);
      }
      
      // Ajout du HTML généré au DOM
      elementsHTML += element.render();
    });

    // Insertion du HTML dans le DOM et activation des événements
    this.element.innerHTML = elementsHTML;
    document.body.appendChild(this.element);
    this.bindEvents();
  }

  /**
   * Gestion des événements - Version adaptée pour la nouvelle architecture
   * 
   * Cette méthode utilise maintenant les propriétés étendues des éléments
   * pour déterminer le comportement approprié
   */
  bindEvents() {
    // Prévention du comportement par défaut sur mousedown pour éviter la perte de sélection
    this.element.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    // Gestion unifiée des clics sur les boutons et les déclencheurs de select
    this.element.addEventListener("click", (e) => {
      // Gestion des déclencheurs de menu déroulant (select custom)
      const selectTrigger = e.target.closest(".select-trigger");
      if (selectTrigger) {
        e.preventDefault();
        this.toggleCustomDropdown(selectTrigger);
        return;
      }

      // Gestion des options dans les menus déroulants custom
      const customOption = e.target.closest(".custom-option");
      if (customOption) {
        this.handleCustomOptionClick(customOption);
        return;
      }

      // Gestion des boutons classiques
      const button = e.target.closest("button");
      if (!button) return;

      const command = button.dataset.command;
      const buttonElement = this.buttons.get(command);
      
      if (buttonElement && buttonElement.action) {
        // Exécution de l'action du bouton
        buttonElement.action();
        
        // Mise à jour de l'état des boutons après l'action
        this.updateButtonStates();
        
        // Gestion des feedbacks spéciaux pour certains boutons utilitaires
        if (buttonElement.hasSpecialFeedback) {
          this.showCopyFeedback(button);
        }
      }
    });
  }

  /**
   * Gestion des menus déroulants personnalisés
   * 
   * Cette méthode remplace la gestion des <select> HTML par des div stylables
   */
  toggleCustomDropdown(trigger) {
    const wrapper = trigger.closest(".toolbar-select-wrapper");
    const dropdown = wrapper.querySelector(".custom-dropdown");
    
    // Fermer tous les autres dropdowns ouverts avant d'ouvrir celui-ci
    this.element.querySelectorAll(".custom-dropdown").forEach(otherDropdown => {
      if (otherDropdown !== dropdown) {
        otherDropdown.style.display = "none";
      }
    });
    
    // Toggle de l'état du dropdown cliqué
    const isCurrentlyVisible = dropdown.style.display !== "none";
    dropdown.style.display = isCurrentlyVisible ? "none" : "block";
  }

  /**
   * Gestion du clic sur une option dans un menu déroulant personnalisé
   */
  handleCustomOptionClick(optionElement) {
    const wrapper = optionElement.closest(".toolbar-select-wrapper");
    const command = wrapper.dataset.command;
    const value = optionElement.dataset.value;
    
    // Récupération de l'élément select et exécution de son action
    const selectElement = this.selects.get(command);
    if (selectElement && selectElement.action && value) {
      selectElement.action(value);
    }
    
    // Fermeture du dropdown après sélection
    const dropdown = wrapper.querySelector(".custom-dropdown");
    dropdown.style.display = "none";
  }

  /**
   * Affichage et positionnement de la toolbar
   * Cette logique reste identique à l'ancienne version
   */
  show(selection) {
    if (!selection || !selection.range) return;

    this.isVisible = true;
    this.element.classList.add("visible");

    this.positionToolbar(selection.range);
    this.updateButtonStates();
  }

  /**
   * Masquage de la toolbar avec gestion des cas spéciaux
   */
  hide() {
    // Fermeture de tous les dropdowns ouverts lors du masquage
    this.element.querySelectorAll(".custom-dropdown").forEach(dropdown => {
      dropdown.style.display = "none";
    });

    this.isVisible = false;
    this.element.classList.remove("visible");
  }

  /**
   * Positionnement de la toolbar par rapport à la sélection
   * Cette logique reste identique à l'ancienne version car elle ne dépend pas
   * de la structure interne des boutons
   */
  positionToolbar(range) {
    const rect = range.getBoundingClientRect();

    // Vérification de la validité des coordonnées
    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }

    const toolbarRect = this.element.getBoundingClientRect();

    // Calcul de la position horizontale centrée par rapport à la sélection
    let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
    let top = rect.top - toolbarRect.height - 50;

    // Ajustements pour éviter le débordement de l'écran
    const margin = 10;
    if (left < margin) left = margin;
    if (left + toolbarRect.width > window.innerWidth - margin) {
      left = window.innerWidth - toolbarRect.width - margin;
    }

    // Si pas assez de place au-dessus, afficher en-dessous de la sélection
    if (top < margin) {
      top = rect.bottom + 20;
    }

    // Application de la position avec prise en compte du scroll
    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${top + window.scrollY}px`;
  }

  /**
   * Mise à jour des états des boutons - Version simplifiée
   * 
   * Cette méthode utilise maintenant les fonctions checkActive des boutons
   * plutôt que de dupliquer la logique de vérification
   */
  updateButtonStates() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    // Détermination de l'élément de référence pour les vérifications d'état
    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const element = ancestor.nodeType === Node.TEXT_NODE ? 
      ancestor.parentElement : ancestor;

    // Mise à jour de l'état actif de chaque bouton toggle
    this.buttons.forEach((buttonElement, actionId) => {
      if (buttonElement.isToggle) {
        const isActive = buttonElement.updateActiveState(element);
        const domButton = this.element.querySelector(`[data-command="${actionId}"]`);
        domButton?.classList.toggle("active", isActive);
      }
    });
  }

  /**
   * Affichage du feedback visuel pour les boutons avec retour d'information
   * Cette méthode reste identique à l'ancienne version
   */
  showCopyFeedback(button) {
    const originalHTML = button.innerHTML;
    const checkIcon = `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0ibTkgMTIgMiAyIDQtNCIvPjwvc3ZnPg==" style="width: 16px; height: 16px; filter: invert(1);" alt="Check">`;
    
    button.innerHTML = checkIcon;
    button.classList.add("success");

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove("success");
    }, 1000);
  }

  /**
   * Méthode utilitaire pour récupérer une référence à une action spécifique
   * Ceci peut être utile pour les intégrations externes ou le debugging
   */
  getAction(actionId) {
    return ACTIONS_REGISTRY[actionId] || null;
  }

  /**
   * Méthode pour ajouter dynamiquement des actions à la toolbar
   * Ceci permet d'étendre la toolbar après sa création initiale
   */
  addAction(actionId, position = -1) {
    if (position === -1) {
      this.config.elements.push(actionId);
    } else {
      this.config.elements.splice(position, 0, actionId);
    }
    
    // Reconstruction de la toolbar avec le nouvel élément
    this.element.innerHTML = "";
    this.buttons.clear();
    this.selects.clear();
    this.createToolbar();
  }

  /**
   * Méthode pour supprimer des actions de la toolbar
   */
  removeAction(actionId) {
    const index = this.config.elements.indexOf(actionId);
    if (index > -1) {
      this.config.elements.splice(index, 1);
      
      // Reconstruction de la toolbar sans l'élément supprimé
      this.element.innerHTML = "";
      this.buttons.clear();
      this.selects.clear();
      this.createToolbar();
    }
  }

  /**
   * Nettoyage et destruction de la toolbar
   */
  destroy() {
    // Fermeture de tous les dropdowns avant destruction
    if (this.element) {
      this.element.querySelectorAll(".custom-dropdown").forEach(dropdown => {
        dropdown.style.display = "none";
      });
    }

    // Suppression de l'élément DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Nettoyage des références
    this.buttons.clear();
    this.selects.clear();
    this.element = null;
  }
}