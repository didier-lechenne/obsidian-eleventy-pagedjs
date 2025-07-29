// codeGenerator.js - Générateur de shortcodes pour le plugin layout

import { TurndownService } from './lib/turndown.js';
import { getCleanClasses, getRelativePath, copyToClipboard } from './utils.js';

export class codeGenerator {
    constructor() {
        this.turndownService = typeof TurndownService !== 'undefined' ? new TurndownService() : null;
        this.isInitialized = false;
        this.lastCopyTime = 0;  
        this.copyThrottle = 1000; 
    }

    initialize() {
        if (this.isInitialized) return;
        this.setupEventListeners();
        this.isInitialized = true;
    }

    setupEventListeners() {
        document.addEventListener('generateCode', this.handleGenerateCode.bind(this));
        
        const copyButton = document.querySelector('.copy .button');
        if (copyButton) {
            copyButton.addEventListener('click', this.handleCopyClick.bind(this));
        }
    }

    handleGenerateCode(e) {
        const { element, shouldCopy = false } = e.detail;
        this.generate(element, shouldCopy);
    }

    generate(element, shouldCopy = false) {
        if (!element) return '';

        const isInsert = element.classList.contains('insert');
        const code = isInsert ? this.generateInsertCode(element) : this.generateImageCode(element);
        
        this.displayCode(code);
        
        if (shouldCopy) {
            copyToClipboard(code);
        }

        return code;
    }

    generateInsertCode(element) {
        const classes = getCleanClasses(element);
        const properties = this.buildPropertiesObject(element);
        
        if (classes) {
            properties.class = `"${classes}"`;
        }
        
        const propertiesStr = this.formatPropertiesObject(properties);
        return `{% insert ${propertiesStr} %}`;
    }

    generateImageCode(element) {
        const type = this.getImageType(element);
        const img = element.querySelector('img');
        const url = img ? getRelativePath(img.src) : '';
        const classes = getCleanClasses(element);
        const caption = this.getCaption(element);
        const properties = this.buildPropertiesObject(element);

        // Ajouter la légende si elle existe
        if (caption) {
            properties.caption = `"${this.escapeQuotes(caption)}"`;
        }

        // Ajouter les classes
        if (classes) {
            properties.class = `"${classes}"`;
        }

        const propertiesStr = this.formatPropertiesObject(properties);
        return `{% ${type} "${url}", ${propertiesStr} %}`;
    }

    buildPropertiesObject(element) {
        const cssVarMapping = {
            col: "--col",
            printCol: "--print-col",
            width: "--width",
            printWidth: "--print-width",
            printRow: "--print-row",
            printHeight: "--print-height",
            alignSelf: "--align-self",
            alignself: "--align-self", 
            imgX: "--img-x",
            imgY: "--img-y",
            imgW: "--img-w"
        };

        const properties = {};
        
        Object.entries(cssVarMapping).forEach(([key, cssVar]) => {
            const value = element.style.getPropertyValue(cssVar);
            if (value && value.trim()) {
                if (key === 'alignSelf' || key === 'alignself') {
                    properties[key] = `"${value.trim()}"`;
                } else {
                    properties[key] = parseFloat(value.trim()) || value.trim();
                }
            }
        });

        return properties;
    }

    formatPropertiesObject(properties) {
        if (Object.keys(properties).length === 0) return '{}';

        const entries = Object.entries(properties).map(([key, value]) => {
            return `  ${key}: ${value}`;
        });

        return `{ \n${entries.join(',\n')}\n}`;
    }

    getImageType(element) {
        if (element.classList.contains('resize')) return 'imagegrid';
        if (element.classList.contains('image')) return 'image';
        return 'figure';
    }

    escapeQuotes(str) {
        return str.replace(/"/g, '\\"');
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
        
        const toRemove = clone.querySelectorAll('.figure_call_back, .figure_reference');
        toRemove.forEach(el => el.remove());

        if (this.turndownService) {
            try {
                return this.turndownService.turndown(clone.innerHTML);
            } catch (error) {
                return clone.textContent.trim();
            }
        } else {
            return clone.textContent.trim();
        }
    }

    handleCopyClick() {
        const content = document.querySelector('.cssoutput');
        if (content) {
            copyToClipboard(content.textContent);
        }
    }

    displayCode(code) {
        const showCode = document.querySelector("#showCode");
        const cssOutput = document.querySelector(".cssoutput");
        
        if (showCode) showCode.value = code;
        if (cssOutput) cssOutput.textContent = code;
    }

    // Méthodes conservées pour compatibilité
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

    cleanup() {
        if (!this.isInitialized) return;

        document.removeEventListener('generateCode', this.handleGenerateCode);
        
        const copyButton = document.querySelector('.copy .button');
        if (copyButton) {
            copyButton.removeEventListener('click', this.handleCopyClick);
        }

        this.isInitialized = false;
    }

    destroy() {
        this.cleanup();
    }
}