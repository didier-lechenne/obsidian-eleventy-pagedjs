// utils/dom-helpers.js
// Utilitaires pour la manipulation du DOM

/**
 * Classe d'aide pour les opérations DOM courantes
 */
export class DOMHelpers {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Sélecteur avec cache
     */
    querySelector(selector, context = document) {
        const key = `${selector}-${context.toString()}`;
        
        if (!this.cache.has(key)) {
            this.cache.set(key, context.querySelector(selector));
        }
        
        return this.cache.get(key);
    }

    /**
     * Sélecteurs multiples avec cache
     */
    querySelectorAll(selector, context = document) {
        const key = `all-${selector}-${context.toString()}`;
        
        if (!this.cache.has(key)) {
            this.cache.set(key, context.querySelectorAll(selector));
        }
        
        return this.cache.get(key);
    }

    /**
     * Vide le cache des sélecteurs
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Trouve l'élément parent le plus proche avec une classe
     */
    findClosestWithClass(element, className) {
        return element.closest(`.${className}`);
    }

    /**
     * Vérifie si un élément est dans une grille modulaire
     */
    isInModularGrid(element) {
        return this.findClosestWithClass(element, 'modularGrid') !== null;
    }

    /**
     * Crée un élément avec classes et attributs
     */
    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.classes) {
            element.className = Array.isArray(options.classes) 
                ? options.classes.join(' ')
                : options.classes;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        return element;
    }

    /**
     * Supprime tous les éléments correspondant au sélecteur
     */
    removeElements(selector, context = document) {
        const elements = context.querySelectorAll(selector);
        elements.forEach(el => el.remove());
        
        // Nettoyer le cache
        this.clearCache();
    }

    /**
     * Ajoute des styles CSS dynamiquement
     */
    addStyles(css, id = null) {
        // Éviter les doublons si un ID est fourni
        if (id && document.querySelector(`#${id}`)) {
            return;
        }

        const style = document.createElement('style');
        if (id) style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
        
        return style;
    }

    /**
     * Supprime une feuille de style par ID
     */
    removeStyles(id) {
        const style = document.querySelector(`#${id}`);
        if (style) {
            style.remove();
        }
    }

    /**
     * Clone un élément avec ses event listeners
     */
    deepCloneElement(element) {
        const clone = element.cloneNode(true);
        
        // Copier les event listeners (approximation)
        const originalEvents = element._events || {};
        clone._events = { ...originalEvents };
        
        return clone;
    }

    /**
     * Mesure les dimensions d'un élément
     */
    measureElement(element) {
        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);
        
        return {
            width: rect.width,
            height: rect.height,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            margins: {
                top: parseInt(computedStyle.marginTop),
                right: parseInt(computedStyle.marginRight),
                bottom: parseInt(computedStyle.marginBottom),
                left: parseInt(computedStyle.marginLeft)
            },
            padding: {
                top: parseInt(computedStyle.paddingTop),
                right: parseInt(computedStyle.paddingRight),
                bottom: parseInt(computedStyle.paddingBottom),
                left: parseInt(computedStyle.paddingLeft)
            }
        };
    }

    /**
     * Vérifie si un élément est visible
     */
    isVisible(element) {
        const style = getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
    }

    /**
     * Attend qu'un élément apparaisse dans le DOM
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found after ${timeout}ms`));
            }, timeout);
        });
    }
}