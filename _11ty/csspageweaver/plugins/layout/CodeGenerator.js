// Classe pour la génération de code
import { TurndownService } from './turndown.js';

class CodeGenerator {
    constructor() {
        this.turndownService = typeof TurndownService !== 'undefined' ? new TurndownService() : null;
    }

    generate(parent) {
        const isInsert = parent.classList.contains('insert');
        
        if (isInsert) {
            return this.generateInsertCode(parent);
        } else {
            return this.generateImageCode(parent);
        }
    }

    generateInsertCode(parent) {
        const classes = this.getCleanClasses(parent);
        const styles = this.getInlineStyles(parent);
        
        const classPart = classes ? classes.split(' ').map(cls => `.${cls}`).join(' ') : '';
        const stylePart = styles ? `style="${styles}"` : '';
        
        return `{.insert ${classPart} ${stylePart}}`.trim();
    }

    generateImageCode(parent) {
        const type = this.getImageType(parent);
        const img = parent.querySelector('img');
        const url = img ? this.getRelativePath(img.src) : '';
        const properties = this.getImageProperties(parent);
        const classes = this.getCleanClasses(parent);
        const caption = this.getCaption(parent);

        let parts = [url];
        if (properties) parts.push(properties);
        if (classes) parts.push(`class: ${classes}`);
        if (caption) parts.push(`caption: "${caption}"`);

        return `(${type}: ${parts.join(' ')})`;
    }

    getImageType(parent) {
        if (parent.classList.contains('resize')) return 'imagegrid';
        if (parent.classList.contains('image')) return 'image';
        return 'figure';
    }

    getCleanClasses(parent) {
        const exclude = ['selected', 'hover', 'cursor', 'figure', 'image', 'insert', 'resize', 'figmove', 'icono'];
        return Array.from(parent.classList)
            .filter(cls => !exclude.includes(cls))
            .join(' ')
            .trim();
    }

    getInlineStyles(parent) {
        const cssProps = {
            '--print-width': parent.style.getPropertyValue('--print-width'),
            '--print-height': parent.style.getPropertyValue('--print-height'),
            '--align-self': parent.style.getPropertyValue('--align-self'), 
            '--print-row': parent.style.getPropertyValue('--print-row'),
            '--print-col': parent.style.getPropertyValue('--print-col'),
            '--col': parent.style.getPropertyValue('--col'),
            '--width': parent.style.getPropertyValue('--width'),
            '--img-x': parent.style.getPropertyValue('--img-x'),
            '--img-y': parent.style.getPropertyValue('--img-y'),
            '--img-w': parent.style.getPropertyValue('--img-w'),
            'cursor': parent.style.cursor
        };
        
        const styles = [];
        Object.entries(cssProps).forEach(([prop, value]) => {
            if (value && value.trim()) {
                styles.push(`${prop}:${value.trim()}`);
            }
        });
        
        return styles.join('; ');
    }

    getImageProperties(parent) {
        const props = ['col', 'width', 'print-col', 'print-width', 'print-row', 'print-height', 'align-self', 'img-x', 'img-y', 'img-w'];
        const values = [];
        
        props.forEach(prop => {
            const value = parent.style.getPropertyValue(`--${prop}`);
            if (value) {
                values.push(`${prop}:${value}`);
            }
        });
        
        return values.join(' ');
    }

    getCaption(parent) {
        const img = parent.querySelector('img');
        if (img && img.alt) {
            return img.alt;
        }
        
        let figcaption = parent.querySelector('figcaption');
        
        if (!figcaption) {
            const nextElement = parent.nextElementSibling;
            if (nextElement && nextElement.tagName.toLowerCase() === 'figcaption') {
                figcaption = nextElement;
            }
        }
        
        if (!figcaption || !figcaption.textContent.trim()) return '';

        const clone = figcaption.cloneNode(true);
        
        const toRemove = clone.querySelectorAll('.figure_call_back, .figure_reference');
        toRemove.forEach(el => el.remove());

        if (this.turndownService) {
            return this.turndownService.turndown(clone.innerHTML);
        } else {
            return clone.textContent.trim();
        }
    }

    getRelativePath(url) {
        try {
            const urlObj = new URL(url);
            let path = urlObj.pathname + urlObj.search + urlObj.hash;
            return path.startsWith('/') ? path.substring(1) : path;
        } catch {
            return url;
        }
    }
}

export { CodeGenerator };