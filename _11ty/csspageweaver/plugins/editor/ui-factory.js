import { ACTIONS_REGISTRY, executeAction, isValidAction } from "./actions.js";

/**
 * @name UIFactory
 * @description Factory qui transforme les actions du registre en éléments d'interface
 *
 * Cette classe suit le pattern Factory, où une méthode centrale décide
 * quel type d'élément créer selon le type de l'action demandée.
 *
 * Architecture: Action (registre) → Factory → ToolbarElement → DOM
 */

export class UIFactory {
  /**
   * Méthode principale qui crée un élément d'interface à partir d'un ID d'action
   *
   * @param {string} actionId - Identifiant de l'action dans le registre
   * @param {Object} editor - Instance de l'éditeur pour les callbacks
   * @returns {ToolbarButton|ToolbarSelect|null} - Élément d'interface créé
   */
  static createElement(actionId, editor) {
    // Vérification de sécurité : l'action existe-t-elle ?
    if (!isValidAction(actionId)) {
      console.warn(
        `🚨 Action inconnue demandée: "${actionId}". Vérifiez votre configuration.`
      );
      return null;
    }

    // Récupération de la configuration de l'action
    const actionConfig = ACTIONS_REGISTRY[actionId];

    // Choix de la stratégie de création selon le type d'action
    // Ceci implémente le pattern Strategy au sein du pattern Factory
    switch (actionConfig.type) {
      case "toggle":
        return UIFactory.createToggleButton(actionId, actionConfig, editor);

      case "insert":
        return UIFactory.createInsertButton(actionId, actionConfig, editor);

      case "utility":
        return UIFactory.createUtilityButton(actionId, actionConfig, editor);

      case "select":
        return UIFactory.createSelectElement(actionId, actionConfig, editor);

      default:
        console.error(
          `🚨 Type d'action non supporté: "${actionConfig.type}" pour l'action "${actionId}"`
        );
        return null;
    }
  }

  static createInputElement(actionId, actionConfig, editor) {
    return new ToolbarInput(
      actionId,
      actionConfig.icon,
      actionConfig.title,
      (value) => executeAction(actionId, editor, value)
    );
  }

  /**
   * Création d'un bouton toggle (qui peut être actif/inactif)
   *
   * Ces boutons changent d'apparence selon l'état du formatage dans la sélection.
   * Par exemple, le bouton "gras" sera actif si le texte sélectionné est déjà en gras.
   */
  static createToggleButton(actionId, actionConfig, editor) {
    // Cas spécial pour letter-spacing avec input intégré
    if (actionId === "letter-spacing") {
      return new ToolbarButton(
        actionId,
        `${actionConfig.icon} <input type="number" class="ls-input" placeholder="0" min="-5" max="20" step="1" style="width:40px;margin-left:5px;">`,
        actionConfig.title,
        () => executeAction(actionId, editor),
        {
          isToggle: true,
          checkActive: (element) => {
            return actionConfig.isActive
              ? actionConfig.isActive(element)
              : false;
          },
        }
      );
    }

    // Cas normal pour les autres boutons
    return new ToolbarButton(
      actionId,
      actionConfig.icon,
      actionConfig.title,
      () => executeAction(actionId, editor),
      {
        isToggle: true,
        checkActive: (element) => {
          return actionConfig.isActive ? actionConfig.isActive(element) : false;
        },
      }
    );
  }

  /**
   * Création d'un bouton d'insertion simple
   *
   * Ces boutons effectuent une action ponctuelle (insérer un caractère, un saut de ligne...)
   * Ils n'ont pas d'état actif/inactif particulier.
   */
  static createInsertButton(actionId, actionConfig, editor) {
    return new ToolbarButton(
      actionId,
      actionConfig.icon,
      actionConfig.title,
      () => executeAction(actionId, editor),
      {
        isToggle: false, // Ces boutons ne changent pas d'état
      }
    );
  }

  /**
   * Création d'un bouton utilitaire
   *
   * Ces boutons effectuent des opérations complexes sur le document
   * (reset, copie, export...). Ils peuvent avoir des comportements spéciaux
   * comme des feedbacks visuels.
   */
  static createUtilityButton(actionId, actionConfig, editor) {
    return new ToolbarButton(
      actionId,
      actionConfig.icon,
      actionConfig.title,
      () => executeAction(actionId, editor),
      {
        isToggle: false,
        // Propriété spéciale pour identifier les boutons utilitaires
        isUtility: true,
        // Certains boutons utilitaires ont des feedbacks spéciaux
        hasSpecialFeedback: actionId === "copy-md",
      }
    );
  }

  /**
   * Création d'un élément select (menu déroulant)
   *
   * Ces éléments permettent de choisir parmi plusieurs options.
   * Le callback reçoit la valeur sélectionnée en plus de l'éditeur.
   */
  static createSelectElement(actionId, actionConfig, editor) {
    return new ToolbarSelect(
      actionId,
      actionConfig.icon,
      actionConfig.title,
      actionConfig.options,
      (selectedValue) => executeAction(actionId, editor, selectedValue)
    );
  }

  /**
   * Méthode utilitaire pour créer plusieurs éléments à partir d'une liste d'IDs
   *
   * @param {string[]} actionIds - Liste des identifiants d'actions
   * @param {Object} editor - Instance de l'éditeur
   * @returns {Object[]} - Tableau d'éléments créés (filtré des éléments null)
   */
  static createElements(actionIds, editor) {
    return actionIds
      .map((actionId) => UIFactory.createElement(actionId, editor))
      .filter((element) => element !== null); // Supprime les éléments qui n'ont pas pu être créés
  }

  /**
   * Méthode de diagnostic pour analyser une configuration
   *
   * Utile pour débugger et comprendre ce qui va être créé
   * avant de construire effectivement la toolbar
   */
  static analyzeConfiguration(actionIds) {
    const analysis = {
      valid: [],
      invalid: [],
      byType: {
        toggle: [],
        insert: [],
        utility: [],
        select: [],
      },
    };

    actionIds.forEach((actionId) => {
      if (isValidAction(actionId)) {
        analysis.valid.push(actionId);
        const actionType = ACTIONS_REGISTRY[actionId].type;
        analysis.byType[actionType].push(actionId);
      } else {
        analysis.invalid.push(actionId);
      }
    });

    return analysis;
  }
}

/**
 * @name ToolbarButton
 * @description Classe améliorée pour les boutons de toolbar
 *
 * Cette version étend la classe originale avec des capacités supplémentaires
 * pour gérer les différents types de boutons créés par la factory.
 */
export class ToolbarButton {
  constructor(command, icon, title, action, options = {}) {
    this.command = command;
    this.icon = icon;
    this.title = title;
    this.action = action;

    // Options étendues pour différents comportements
    this.isToggle = options.isToggle || false;
    this.isUtility = options.isUtility || false;
    this.hasSpecialFeedback = options.hasSpecialFeedback || false;
    this.checkActive = options.checkActive || null;
  }

  render() {
    // Génération du HTML avec les attributs nécessaires pour le comportement
    const attributes = [
      `data-command="${this.command}"`,
      `data-tooltip="${this.title}"`,
    ];

    // Ajout d'attributs spéciaux selon le type de bouton
    if (this.isToggle) {
      attributes.push('data-toggle="true"');
    }

    if (this.isUtility) {
      attributes.push('data-utility="true"');
    }

    if (this.hasSpecialFeedback) {
      attributes.push('data-special-feedback="true"');
    }

    return `<button ${attributes.join(" ")}>${this.icon}</button>`;
  }

  /**
   * Vérifie si ce bouton doit être affiché comme actif
   * selon l'élément actuellement sélectionné
   */
  updateActiveState(element) {
    if (this.isToggle && this.checkActive) {
      return this.checkActive(element);
    }
    return false;
  }
}

/**
 * @name ToolbarSelect
 * @description Classe pour les éléments select de la toolbar
 *
 * Cette classe génère un menu déroulant personnalisé plutôt qu'un <select> HTML
 * natif pour avoir un meilleur contrôle sur le style et le comportement.
 */
export class ToolbarSelect {
  constructor(command, icon, title, options, action) {
    this.command = command;
    this.icon = icon;
    this.title = title;
    this.options = options;
    this.action = action;
  }

  render() {
    // Génération des options sous forme de divs personnalisées
    // Cela nous donne un contrôle total sur le style, contrairement aux <option> HTML
    const optionsHTML = this.options
      .map(
        (opt) =>
          `<div class="custom-option" data-value="${opt.value}" title="${opt.label}">${opt.label}</div>`
      )
      .join("");

    return `
      <div class="toolbar-select-wrapper" data-command="${this.command}" data-tooltip="${this.title}">
        <button class="select-trigger">${this.icon}</button>
        <div class="custom-dropdown" style="display: none;">
          ${optionsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Récupère l'option correspondant à une valeur donnée
   */
  getOptionByValue(value) {
    return this.options.find((option) => option.value === value);
  }
}

/**
 * @name Configuration Helpers
 * @description Fonctions utilitaires pour travailler avec les configurations
 */

/**
 * Valide une configuration de toolbar complète
 * Retourne un rapport détaillé sur les problèmes potentiels
 */
export function validateToolbarConfiguration(config) {
  const report = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: null,
  };

  // Vérification de la structure de base
  if (!config || !config.elements || !Array.isArray(config.elements)) {
    report.isValid = false;
    report.errors.push(
      "Configuration manquante ou propriété 'elements' invalide"
    );
    return report;
  }

  // Analyse des éléments
  const analysis = UIFactory.analyzeConfiguration(config.elements);

  // Erreurs bloquantes
  if (analysis.invalid.length > 0) {
    report.isValid = false;
    report.errors.push(`Actions inconnues: ${analysis.invalid.join(", ")}`);
  }

  // Avertissements informatifs
  if (analysis.valid.length === 0) {
    report.warnings.push("Aucune action valide trouvée dans la configuration");
  }

  if (analysis.byType.select.length > 3) {
    report.warnings.push(
      "Plus de 3 éléments select détectés, cela peut encombrer l'interface"
    );
  }

  // Résumé
  report.summary = {
    totalElements: config.elements.length,
    validElements: analysis.valid.length,
    invalidElements: analysis.invalid.length,
    distribution: analysis.byType,
  };

  return report;
}
