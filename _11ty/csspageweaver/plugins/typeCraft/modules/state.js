/**
 * @file modules/state.js
 * Gestion de l'état global de typeCraft
 */

// État global partagé entre tous les modules
export const state = {
  isEditMode: false,
  currentEditingElement: null,
  eventListeners: new Map(),
  config: {
    letterSpacingStep: 0.01,
    debugMode: false
  }
};

// Gestionnaire d'état avec getters/setters
export const StateManager = {
  // Propriétés principales
  get isEditMode() { return state.isEditMode; },
  set isEditMode(value) { state.isEditMode = value; },
  
  get currentEditingElement() { return state.currentEditingElement; },
  set currentEditingElement(value) { state.currentEditingElement = value; },

  // Configuration
  getConfig(key) { return state.config[key]; },
  setConfig(key, value) { state.config[key] = value; },

  // Gestion des event listeners pour éviter les fuites mémoire
  addEventListeners(element, events) {
    if (!state.eventListeners.has(element)) {
      state.eventListeners.set(element, []);
    }
    state.eventListeners.get(element).push(...events);
  },

  removeEventListeners(element) {
    if (state.eventListeners.has(element)) {
      const listeners = state.eventListeners.get(element);
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
      state.eventListeners.delete(element);
    }
  },

  clearAllEventListeners() {
    state.eventListeners.forEach((listeners, element) => {
      this.removeEventListeners(element);
    });
  },

  // Debug
  log(message, data = null) {
    if (state.config.debugMode) {
      console.log(`[typeCraft] ${message}`, data || '');
    }
  }
};