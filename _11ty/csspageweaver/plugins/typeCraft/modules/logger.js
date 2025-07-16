/**
 * @file modules/logger.js
 * Système de logging centralisé pour TypeCraft
 */

export const Logger = {
  // Configuration des niveaux de log
  levels: {
    ERROR: 0,
    WARN: 1, 
    INFO: 2,
    DEBUG: 3
  },

  // Catégories de logs
  categories: {
    events: true,
    formatting: true,
    letterSpacing: true,
    clipboard: true,
    state: true,
    general: true
  },

  // Niveau de log actuel (contrôlé par config)
  getCurrentLevel() {
    if (!StateManager.getConfig('debugMode')) return this.levels.ERROR;
    return StateManager.getConfig('logLevel') || this.levels.DEBUG;
  },

  // Log général avec niveau et catégorie
  _log(level, message, category = 'general', data = null) {
    // Vérifier si on doit logger ce niveau
    if (level > this.getCurrentLevel()) return;
    
    // Vérifier si cette catégorie est activée
    if (!this.categories[category]) return;

    const levelName = Object.keys(this.levels)[level];
    const prefix = `[typeCraft:${category}:${levelName}]`;
    
    switch (level) {
      case this.levels.ERROR:
        console.error(prefix, message, data || '');
        break;
      case this.levels.WARN:
        console.warn(prefix, message, data || '');
        break;
      case this.levels.INFO:
        console.info(prefix, message, data || '');
        break;
      case this.levels.DEBUG:
        console.log(prefix, message, data || '');
        break;
    }
  },

  // Méthodes publiques
  error(message, category = 'general', data = null) {
    this._log(this.levels.ERROR, message, category, data);
  },

  warn(message, category = 'general', data = null) {
    this._log(this.levels.WARN, message, category, data);
  },

  info(message, category = 'general', data = null) {
    this._log(this.levels.INFO, message, category, data);
  },

  debug(message, category = 'general', data = null) {
    this._log(this.levels.DEBUG, message, category, data);
  },

  // Méthode de compatibilité avec l'ancien StateManager.log
  log(message, data = null) {
    this.info(message, 'general', data);
  },

  // Performance tracking
  time(label, category = 'performance') {
    if (this.categories[category] && this.getCurrentLevel() >= this.levels.DEBUG) {
      console.time(`[typeCraft:${category}] ${label}`);
    }
  },

  timeEnd(label, category = 'performance') {
    if (this.categories[category] && this.getCurrentLevel() >= this.levels.DEBUG) {
      console.timeEnd(`[typeCraft:${category}] ${label}`);
    }
  },

  // Configuration des catégories
  enableCategory(category) {
    this.categories[category] = true;
  },

  disableCategory(category) {
    this.categories[category] = false;
  },

  // Logging groupé pour les opérations complexes
  group(label, category = 'general') {
    if (this.categories[category] && this.getCurrentLevel() >= this.levels.DEBUG) {
      console.group(`[typeCraft:${category}] ${label}`);
    }
  },

  groupEnd() {
    if (this.getCurrentLevel() >= this.levels.DEBUG) {
      console.groupEnd();
    }
  }
};

// Dans state.js, remplacer StateManager.log par :
export const StateManager = {
  // ... autres propriétés

  // Déléguer au Logger centralisé
  log(message, data = null) {
    Logger.log(message, data);
  },

  warn(message, data = null) {
    Logger.warn(message, 'state', data);
  },

  error(message, data = null) {
    Logger.error(message, 'state', data);
  }
};