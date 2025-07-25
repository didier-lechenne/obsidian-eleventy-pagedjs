// codeGenerator.js - Générateur de shortcodes pour le plugin layout

import { TurndownService } from './lib/turndown.js';
import { getCleanClasses, getRelativePath, copyToClipboard } from './utils.js';

export class codeGenerator {
    constructor() {
        this.turndownService = typeof TurndownService !== 'undefined' ? new TurndownService() : null;
        this.isInitialized = false;
        this.lastCopyTime = 0;  // ✅ Throttling des copies
        this.copyThrottle = 1000; // ✅ 1 seconde minimum entre copies
    }

    initialize() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ codeGenerator: Génération de code activée');
    }

    setupEventListeners() {
        // Écouter les événements de génération de code
        document.addEventListener('generateCode', this.handleGenerateCode.bind(this));
        
        // Bouton copier
        const copyButton = document.querySelector('.copy .button');
        if (copyButton) {
            copyButton.addEventListener('click', this.handleCopyClick.bind(this));
        }
    }

   handleGenerateCode(e) {
        const { element, shouldCopy = false } = e.detail;
        
        // ✅ Vérifier si la copie est vraiment demandée et appropriée
        const canCopy = shouldCopy && this.shouldAllowCopy();
        
        this.generate(element, canCopy);
    }

    shouldAllowCopy() {
        const now = Date.now();
        
        // ✅ Throttling : éviter les copies trop fréquentes
        if (now - this.lastCopyTime < this.copyThrottle) {
            console.log('🚫 Copie throttlée (trop fréquente)');
            return false;
        }
        
        // ✅ Vérifier que le document a le focus
        if (!document.hasFocus()) {
            console.log('🚫 Copie ignorée (document pas en focus)');
            return false;
        }
        
        // ✅ Vérifier qu'on est dans un contexte sécurisé (HTTPS/localhost)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.log('🚫 Copie ignorée (contexte non-sécurisé)');
            return false;
        }
        
        return true;
    }

    handleCopyClick() {
        const content = document.querySelector('.cssoutput');
        if (content) {
            copyToClipboard(content.textContent);
        }
    }

    generate(element, shouldCopy = false) {
        if (!element) return '';

        const isInsert = element.classList.contains('insert');
        const code = isInsert ? this.generateInsertCode(element) : this.generateImageCode(element);
        
        this.displayCode(code);
        
        if (shouldCopy) {
            copyToClipboard(code);
        }

        console.log('📝 Code généré:', code);
        return code;
    }

    async copyWithFeedback(code) {
        try {
            const success = await copyToClipboard(code);
            if (success) {
                this.lastCopyTime = Date.now();
                console.log('✅ Code copié avec succès');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la copie:', error);
        }
    }

    // ✅ Handler pour le bouton copier explicite
    handleCopyClick() {
        const content = document.querySelector('.cssoutput');
        if (content && content.textContent) {
            // ✅ Clic explicite → toujours autoriser la copie
            this.copyWithFeedback(content.textContent);
        }
    }

    
    generateInsertCode(element) {
        const classes = getCleanClasses(element);
        const styles = this.getInlineStyles(element);
        
        const classPart = classes ? classes.split(' ').map(cls => `.${cls}`).join(' ') : '';
        const stylePart = styles ? `style="${styles}"` : '';
        
        return `{.insert ${classPart} ${stylePart}}`.trim();
    }

    generateImageCode(element) {
        const type = this.getImageType(element);
        const img = element.querySelector('img');
        const url = img ? getRelativePath(img.src) : '';
        const properties = this.getImageProperties(element);
        const classes = getCleanClasses(element);
        const caption = this.getCaption(element);

        let parts = [url];
        if (properties) parts.push(properties);
        if (classes) parts.push(`class: ${classes}`);
        if (caption) parts.push(`caption: "${caption}"`);

        return `(${type}: ${parts.join(' ')})`;
    }

    getImageType(element) {
        if (element.classList.contains('resize')) return 'imagegrid';
        if (element.classList.contains('image')) return 'image';
        return 'figure';
    }

    getInlineStyles(element) {
        const cssProps = {
            '--print-width': element.style.getPropertyValue('--print-width'),
            '--print-height': element.style.getPropertyValue('--print-height'),
            '--align-self': element.style.getPropertyValue('--align-self'), 
            '--print-row': element.style.getPropertyValue('--print-row'),
            '--print-col': element.style.getPropertyValue('--print-col'),
            '--col': element.style.getPropertyValue('--col'),
            '--width': element.style.getPropertyValue('--width'),
            '--img-x': element.style.getPropertyValue('--img-x'),
            '--img-y': element.style.getPropertyValue('--img-y'),
            '--img-w': element.style.getPropertyValue('--img-w'),
            'cursor': element.style.cursor
        };
        
        const styles = [];
        Object.entries(cssProps).forEach(([prop, value]) => {
            if (value && value.trim()) {
                styles.push(`${prop}:${value.trim()}`);
            }
        });
        
        return styles.join('; ');
    }

    getImageProperties(element) {
        const props = [
            'col', 'width', 'print-col', 'print-width', 
            'print-row', 'print-height', 'align-self', 
            'img-x', 'img-y', 'img-w'
        ];
        
        const values = [];
        
        props.forEach(prop => {
            const value = element.style.getPropertyValue(`--${prop}`);
            if (value) {
                values.push(`${prop}:${value}`);
            }
        });
        
        return values.join(' ');
    }

    getCaption(element) {
        const img = element.querySelector('img');
        if (img && img.alt) {
            return img.alt;
        }
        
        let figcaption = element.querySelector('figcaption');
        
        if (!figcaption) {
            const nextElement = element.nextElementSibling;
            if (nextElement && nextElement.tagName.toLowerCase() === 'figcaption') {
                figcaption = nextElement;
            }
        }
        
        if (!figcaption || !figcaption.textContent.trim()) return '';

        const clone = figcaption.cloneNode(true);
        
        // Supprimer les éléments de référence
        const toRemove = clone.querySelectorAll('.figure_call_back, .figure_reference');
        toRemove.forEach(el => el.remove());

        if (this.turndownService) {
            try {
                return this.turndownService.turndown(clone.innerHTML);
            } catch (error) {
                console.warn('Erreur conversion Markdown:', error);
                return clone.textContent.trim();
            }
        } else {
            return clone.textContent.trim();
        }
    }

    displayCode(code) {
        // Affiche le code dans l'interface
        const showCode = document.querySelector("#showCode");
        const cssOutput = document.querySelector(".cssoutput");
        
        if (showCode) showCode.value = code;
        if (cssOutput) cssOutput.textContent = code;
    }

    cleanup() {
        if (!this.isInitialized) return;

        document.removeEventListener('generateCode', this.handleGenerateCode);
        
        const copyButton = document.querySelector('.copy .button');
        if (copyButton) {
            copyButton.removeEventListener('click', this.handleCopyClick);
        }

        this.isInitialized = false;
        console.log('🧹 codeGenerator nettoyé');
    }

    destroy() {
        this.cleanup();
    }
}