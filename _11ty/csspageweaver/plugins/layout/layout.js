// layout.js - Point d'entrée principal du plugin layout

import { gridHandler } from './gridHandler.js';
import { imageHandler } from './imageHandler.js';
import { codeGenerator } from './codeGenerator.js';
import { Handler } from "/csspageweaver/lib/paged.esm.js";

/**
 * Gestionnaire principal du plugin Layout pour PagedJS
 * Orchestre la grille modulaire, la manipulation d'images et la génération de code
 */
export default class Layout extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        
        this.gridHandler = new gridHandler();
        this.imageHandler = new imageHandler();
        this.codeGenerator = new codeGenerator();
        
        this.isInitialized = false;
        this.toggleHandler = null;
        this.fileTitle = cssPageWeaver.docTitle;
        
        console.log('🚀 Layout Plugin: Initialisation...');
    }

    beforeParsed(content) {
        this.cleanup();
    }

    afterRendered(pages) {
        // Délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
            this.initializeHandlers();
            this.initializeLayoutToggle();
            this.isInitialized = true;
            console.log('✅ Layout Plugin: Prêt');
        }, 100);
    }

    initializeHandlers() {
        try {
            this.gridHandler.initialize();
            this.imageHandler.initialize();
            this.codeGenerator.initialize();
            
            console.log('🎯 Tous les handlers sont initialisés');
        } catch (error) {
            console.error('❌ Erreur initialisation handlers:', error);
        }
    }

    initializeLayoutToggle() {
        if (this.toggleHandler) return; // Éviter les doublons

        console.log('🎛️ Initialisation du toggle Layout...');
        
        // Vérifications avec fallbacks
        let body = cssPageWeaver?.ui?.body;
        let toggleInput = cssPageWeaver?.ui?.layout?.toggleInput;
        
        // Fallback pour body
        if (!body) {
            console.warn('⚠️ cssPageWeaver.ui.body non trouvé, utilisation de document.body');
            body = document.body;
        }
        
        // Fallback pour toggleInput - chercher dans le DOM
        if (!toggleInput) {
            console.warn('⚠️ cssPageWeaver.ui.layout.toggleInput non trouvé, recherche dans le DOM...');
            
            // Essayer plusieurs sélecteurs possibles
            const selectors = [
                'input[data-plugin="layout"]',
                '#layout-toggle',
                'input[name="layout"]',
                '.layout-toggle input',
                '[data-toggle="layout"]'
            ];
            
            for (const selector of selectors) {
                toggleInput = document.querySelector(selector);
                if (toggleInput) {
                    console.log(`✅ Toggle trouvé avec sélecteur: ${selector}`);
                    break;
                }
            }
            
            if (!toggleInput) {
                console.error('❌ Aucun toggle trouvé - le mode layout ne pourra pas être activé');
                return;
            }
        }

        console.log('✅ Body et toggle trouvés');

        // Récupérer la préférence sauvegardée
        const preference = localStorage.getItem('layout') === 'true';
        
        body.classList.toggle('layout', preference);
        toggleInput.checked = preference;
        
        console.log(`🔧 État initial: layout=${body.classList.contains('layout')}`);

        // Créer le handler d'événement
        this.toggleHandler = (e) => {
            const isEnabled = e.target.checked;
            body.classList.toggle("layout", isEnabled);
            localStorage.setItem('layout', isEnabled);
            
            if (isEnabled) {
                console.log('🟢 Mode Layout activé');
            } else {
                console.log('🔴 Mode Layout désactivé');
            }
            
            // Debug: vérifier que la classe est bien appliquée
            console.log('🔍 Classe layout présente:', body.classList.contains('layout'));
        };
        
        toggleInput.addEventListener("input", this.toggleHandler);
        console.log('🎛️ Toggle Layout configuré');
    }

    cleanup() {
        if (!this.isInitialized) return;

        try {
            // Nettoyer les handlers
            if (this.gridHandler) {
                this.gridHandler.cleanup();
            }
            
            if (this.imageHandler) {
                this.imageHandler.cleanup();
            }
            
            if (this.codeGenerator) {
                this.codeGenerator.cleanup();
            }

            // Nettoyer le toggle
            if (this.toggleHandler && cssPageWeaver.ui.layout.toggleInput) {
                cssPageWeaver.ui.layout.toggleInput.removeEventListener("input", this.toggleHandler);
                this.toggleHandler = null;
            }

            this.isInitialized = false;
            console.log('🧹 Layout Plugin nettoyé');
            
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
        }
    }

    destroy() {
        this.cleanup();
        
        if (this.gridHandler) this.gridHandler.destroy();
        if (this.imageHandler) this.imageHandler.destroy();
        if (this.codeGenerator) this.codeGenerator.destroy();
        
        console.log('💥 Layout Plugin détruit');
    }
}

// Export des classes pour usage externe si nécessaire
export { gridHandler, imageHandler, codeGenerator };

// Rendre les classes disponibles globalement pour compatibilité
if (typeof window !== 'undefined') {
    window.LayoutPlugin = {
        Layout,
        gridHandler,
        imageHandler,
        codeGenerator
    };
}