// utils.js - Fonctions utilitaires communes pour le plugin layout

/**
 * Détection et classification d'éléments
 */
export function findImageElement(target) {
    if (target.tagName?.toLowerCase() === 'img') {
        return target;
    }
    
    const figure = target.closest('figure, .resize, .image');
    return figure ? figure.querySelector('img') : null;
}

export function getShortcodeType(element) {
    const types = [
        { selector: '.resize', name: 'resize' },
        { selector: '.image', name: 'image' },
        { selector: '.figure', name: 'figure' },
        { selector: '.insert', name: 'insert' }
    ];

    for (const type of types) {
        const parent = element.closest(type.selector);
        if (parent) return { parent, type: type.name };
    }
    
    return null;
}

export function isInModularGrid(element) {
    return element.closest('.modularGrid') !== null;
}

/**
 * Gestion des propriétés CSS de grille
 */
export function getGridConfig(section) {
    if (!section) return { cols: 12, rows: 10 };

    const computedStyle = getComputedStyle(section);
    const cols = parseInt(computedStyle.getPropertyValue('--grid-col').trim()) || 12;
    const rows = parseInt(computedStyle.getPropertyValue('--grid-row').trim()) || 10;

    return { cols, rows };
}

export function getCSSProperties(element) {
    const properties = [
        'col', 'width', 'print-col', 'print-width', 
        'print-row', 'print-height', 'align-self', 
        'figcaption_arrow', 'img-x', 'img-y', 'img-w'
    ];

    const result = {};
    properties.forEach(prop => {
        result[prop] = element.style.getPropertyValue(`--${prop}`) || '';
    });

    return result;
}

export function setCSSProperties(element, properties) {
    Object.entries(properties).forEach(([prop, value]) => {
        if (value !== null && value !== undefined) {
            element.style.setProperty(`--${prop}`, value);
        }
    });
}

export function getCleanClasses(element) {
    const exclude = ['selected', 'hover', 'cursor', 'figure', 'image', 'insert', 'resize', 'figmove', 'icono', 'resizable', 'resizing'];
    return Array.from(element.classList)
        .filter(cls => !exclude.includes(cls))
        .join(' ')
        .trim();
}

/**
 * Calculs de grille
 */
export function convertPixelsToGrid(deltaX, deltaY, container, gridConfig) {
    const gridStepX = container.offsetWidth / gridConfig.cols;
    const gridStepY = container.offsetHeight / gridConfig.rows;

    return {
        deltaCol: Math.round(deltaX / gridStepX),
        deltaRow: Math.round(deltaY / gridStepY)
    };
}

export function convertGridToPixels(cols, rows, container, gridConfig) {
    const gridStepX = container.offsetWidth / gridConfig.cols;
    const gridStepY = container.offsetHeight / gridConfig.rows;

    return {
        width: cols * gridStepX,
        height: rows * gridStepY
    };
}



/**
 * Helpers DOM et utilitaires
 */
export function getRelativePath(url) {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname + urlObj.search + urlObj.hash;
        return path.startsWith('/') ? path.substring(1) : path;
    } catch {
        return url;
    }
}

export function getImageId(element) {
    const dataId = element.getAttribute('data-id');
    if (!dataId) return '0';
    
    const match = dataId.match(/\d+$/);
    return match ? match[0] : '0';
}

export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Feedback visuel
        const copyElement = document.querySelector('.copy');
        if (copyElement) {
            copyElement.classList.add('copied');
            setTimeout(() => copyElement.classList.remove('copied'), 1000);
        }
        
        return true;
    } catch (err) {
        // console.error('Failed to copy:', err);
        
        // Fallback pour les anciens navigateurs
        const input = document.querySelector('#showCode');
        if (input) {
            input.select();
            document.execCommand('copy');
            return true;
        }
        
        return false;
    }
}

/**
 * Gestion des curseurs pour les zones de redimensionnement
 */
export function getCursorForZone(zone) {
    const cursors = {
        'move': 'move',
        'n-resize': 'ns-resize',
        's-resize': 'ns-resize',
        'e-resize': 'ew-resize',
        'w-resize': 'ew-resize',
        'ne-resize': 'nesw-resize',
        'nw-resize': 'nwse-resize',
        'se-resize': 'nwse-resize',
        'sw-resize': 'nesw-resize'
    };
    
    return cursors[zone] || 'default';
}

/**
 * Nettoyage des éléments
 */
export function cleanupElement(element) {
    element.classList.remove('resizable', 'resizing', 'selected', 'hover');
    element.style.cursor = 'default';
    delete element.dataset.resizeMode;

    // Supprimer les boutons temporaires
    const moveButton = element.querySelector('.move-button');
    if (moveButton) moveButton.remove();
}

/**
 * Validation des valeurs de grille
 */
export function validateGridValues(values, gridConfig) {
    const { col, row, width, height } = values;
    
    return {
        col: Math.max(1, Math.min(gridConfig.cols, col)),
        row: Math.max(1, Math.min(gridConfig.rows, row)),
        width: Math.max(1, Math.min(gridConfig.cols - col + 1, width)),
        height: Math.max(1, Math.min(gridConfig.rows - row + 1, height))
    };
}