// gridHandler.js - Gestionnaire de redimensionnement dans la grille modulaire

import { 
    isInModularGrid, 
    getGridConfig, 
    convertPixelsToGrid, 
    getCursorForZone,
    cleanupElement,
    validateGridValues
} from './utils.js';

export class gridHandler {
    constructor() {
        this.isResizing = false;
        this.currentElement = null;
        this.hoveredElement = null;
        this.resizeMode = null;
        this.startX = 0;
        this.startY = 0;
        this.startValues = {};
        this.isInitialized = false;
        this.isShiftPressed = false;
        
        // Zones de détection étendues (débordent du bloc)
        this.zones = {
            edge: 20,     // Zone de bord
            corner: 25    // Zone de coin
        };
    }

    initialize() {
        if (this.isInitialized) {
            this.cleanup();
        }
        
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ gridHandler: Zones de redimensionnement activées');
    }

    setupEventListeners() {
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), { capture: true, passive: true });
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), { capture: true, passive: true });
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
        document.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleMouseEnter(e) {
        if (this.isResizing || !document.body.classList.contains('layout')) return;
        if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
        if (e.target.closest('figcaption')) return;

        const target = e.target.closest('.resize, .figure, .insert');
        
        if (target && 
            isInModularGrid(target) && 
            this.hoveredElement !== target) {
            
            if (this.hoveredElement && this.hoveredElement !== target) {
                cleanupElement(this.hoveredElement);
            }

            this.hoveredElement = target;
            target.classList.add('resizable');
            this.addMoveButton(target);
        }
    }

    handleMouseLeave(e) {
        if (this.isResizing) return;
        if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;

        const target = e.target.closest('.resize, .figure, .insert');
        if (!target || target !== this.hoveredElement) return;

        const relatedTarget = e.relatedTarget;
        if (!target.contains(relatedTarget)) {
            setTimeout(() => {
                if (this.hoveredElement === target && !target.matches(':hover')) {
                    cleanupElement(target);
                    this.hoveredElement = null;
                }
            }, 100);
        }
    }

    handleMouseMove(e) {
        if (this.isResizing) {
            this.handleResizeMove(e);
            return;
        }

        if (!this.hoveredElement) return;
        this.updateCursor(this.hoveredElement, e.clientX, e.clientY);
    }

    handleMouseDown(e) {
        if (!document.body.classList.contains('layout') || this.isResizing) return;

        let resizeMode = null;
        let targetElement = null;

        // Clic sur le bouton de déplacement
        if (e.target.classList.contains('move-button')) {
            resizeMode = 'move';
            targetElement = e.target.closest('.resize, .figure, .insert');
        }
        // Clic dans une zone de redimensionnement
        else if (this.hoveredElement) {
            const zone = this.getInteractionZone(this.hoveredElement, e.clientX, e.clientY);
            if (zone) {
                resizeMode = zone;
                targetElement = this.hoveredElement;
            }
        }

        if (!resizeMode || !targetElement || !isInModularGrid(targetElement)) return;

        e.preventDefault();
        e.stopPropagation();
        this.startResize(targetElement, resizeMode, e);
    }

    handleMouseUp(e) {
        if (!this.isResizing) return;

        const currentElement = this.currentElement;

        // Nettoyer les états
        document.body.classList.remove('grid-resizing');
        if (currentElement) {
            currentElement.classList.remove('resizing');
            currentElement.style.cursor = 'default';
            currentElement.dataset.resizeMode = 'hover';

         

            // Émettre événement pour génération de code
            document.dispatchEvent(new CustomEvent('gridResized', {
                detail: { element: currentElement }
            }));
            console.log('🎯 gridHandler: Événement gridResized émis');

            setTimeout(() => {
                if (currentElement && !currentElement.matches(':hover')) {
                    cleanupElement(currentElement);
                }
            }, 300);
        }

        // Reset
        this.isResizing = false;
        this.currentElement = null;
        this.resizeMode = null;
    }

    handleKeyDown(e) {
        if (e.key === 'Shift' && !this.isShiftPressed) {
            this.isShiftPressed = true;
            this.toggleMoveButtons(false);
        }
    }

    handleKeyUp(e) {
        if (e.key === 'Shift' && this.isShiftPressed) {
            this.isShiftPressed = false;
            this.toggleMoveButtons(true);
        }
    }

    addMoveButton(element) {
        const existingButton = element.querySelector('.move-button');
        if (existingButton) existingButton.remove();

        const moveButton = document.createElement('div');
        moveButton.className = 'move-button';
        moveButton.dataset.mode = 'move';
        moveButton.title = 'Déplacer dans la grille';
        element.appendChild(moveButton);

        if (this.isShiftPressed) {
            moveButton.style.display = 'none';
        }
    }

    toggleMoveButtons(show) {
        document.querySelectorAll('.move-button').forEach(button => {
            button.style.display = show ? 'flex' : 'none';
        });
    }

    updateCursor(element, clientX, clientY) {
        const zone = this.getInteractionZone(element, clientX, clientY);
        const cursor = getCursorForZone(zone);
        
        element.style.cursor = cursor;
        element.style.setProperty('cursor', cursor, 'important');
        element.dataset.resizeMode = zone || 'hover';
    }

    getInteractionZone(element, clientX, clientY) {
        const rect = element.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Zones étendues : débordent à l'extérieur ET à l'intérieur
        const isNearLeft = x >= -this.zones.corner && x <= this.zones.corner;
        const isNearRight = x >= rect.width - this.zones.corner && x <= rect.width + this.zones.corner;
        const isNearTop = y >= -this.zones.corner && y <= this.zones.corner;
        const isNearBottom = y >= rect.height - this.zones.corner && y <= rect.height + this.zones.corner;

        const isEdgeLeft = x >= -this.zones.edge && x <= this.zones.edge;
        const isEdgeRight = x >= rect.width - this.zones.edge && x <= rect.width + this.zones.edge;
        const isEdgeTop = y >= -this.zones.edge && y <= this.zones.edge;
        const isEdgeBottom = y >= rect.height - this.zones.edge && y <= rect.height + this.zones.edge;

        // Coins (priorité maximale)
        if (isNearLeft && isNearTop) return 'nw-resize';
        if (isNearRight && isNearTop) return 'ne-resize';
        if (isNearLeft && isNearBottom) return 'sw-resize';
        if (isNearRight && isNearBottom) return 'se-resize';

        // Bords
        if (isEdgeLeft) return 'w-resize';
        if (isEdgeRight) return 'e-resize';
        if (isEdgeTop) return 'n-resize';
        if (isEdgeBottom) return 's-resize';

        return null;
    }

    startResize(element, mode, e) {
        this.isResizing = true;
        this.resizeMode = mode;
        this.currentElement = element;
        this.startX = e.clientX;
        this.startY = e.clientY;

        // Stocker les valeurs initiales
        this.startValues = {
            width: parseInt(element.style.getPropertyValue('--print-width')) || 6,
            height: parseInt(element.style.getPropertyValue('--print-height')) || 3,
            col: parseInt(element.style.getPropertyValue('--print-col')) || 1,
            row: parseInt(element.style.getPropertyValue('--print-row')) || 1
        };

        this.ensureGridProperties(element);

        // États visuels
        document.body.classList.add('grid-resizing');
        element.classList.add('resizing', 'resizable');
        element.dataset.resizeMode = mode;
    }

    ensureGridProperties(element) {
        const props = [
            ['--print-col', this.startValues.col],
            ['--print-row', this.startValues.row],
            ['--print-width', this.startValues.width],
            ['--print-height', this.startValues.height]
        ];

        props.forEach(([prop, value]) => {
            if (!element.style.getPropertyValue(prop)) {
                element.style.setProperty(prop, value);
            }
        });
    }

    handleResizeMove(e) {
        if (!this.isResizing || !this.currentElement) return;

        e.preventDefault();

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        const newValues = this.calculateNewValues(deltaX, deltaY);
        this.applyGridChanges(newValues);
    }

    calculateNewValues(deltaX, deltaY) {
        const container = this.currentElement.parentElement;
        const modularGrid = this.currentElement.closest('.modularGrid');
        const gridConfig = getGridConfig(modularGrid);

        const { deltaCol, deltaRow } = convertPixelsToGrid(deltaX, deltaY, container, gridConfig);

        let newValues = { ...this.startValues };

        switch (this.resizeMode) {
            case 'move':
                newValues.col = this.startValues.col + deltaCol;
                newValues.row = this.startValues.row + deltaRow;
                break;

            case 'n-resize':
                newValues.height = this.startValues.height - deltaRow;
                newValues.row = this.startValues.row + deltaRow;
                break;

            case 's-resize':
                newValues.height = this.startValues.height + deltaRow;
                break;

            case 'e-resize':
                newValues.width = this.startValues.width + deltaCol;
                break;

            case 'w-resize':
                newValues.width = this.startValues.width - deltaCol;
                newValues.col = this.startValues.col + deltaCol;
                break;

            case 'ne-resize':
                newValues.height = this.startValues.height - deltaRow;
                newValues.row = this.startValues.row + deltaRow;
                newValues.width = this.startValues.width + deltaCol;
                break;

            case 'nw-resize':
                newValues.height = this.startValues.height - deltaRow;
                newValues.row = this.startValues.row + deltaRow;
                newValues.width = this.startValues.width - deltaCol;
                newValues.col = this.startValues.col + deltaCol;
                break;

            case 'se-resize':
                newValues.height = this.startValues.height + deltaRow;
                newValues.width = this.startValues.width + deltaCol;
                break;

            case 'sw-resize':
                newValues.height = this.startValues.height + deltaRow;
                newValues.width = this.startValues.width - deltaCol;
                newValues.col = this.startValues.col + deltaCol;
                break;
        }

        return validateGridValues(newValues, gridConfig);
    }

    applyGridChanges(values) {
        const { col, row, width, height } = values;
        const element = this.currentElement;

        const updates = this.resizeMode === 'move' 
            ? [['--print-col', col], ['--print-row', row]]
            : [
                ['--print-col', col],
                ['--print-row', row],
                ['--print-width', width],
                ['--print-height', height]
            ];

        // Appliquer sur l'élément principal
        updates.forEach(([prop, value]) => {
            element.style.setProperty(prop, value);
        });

        
        // Synchroniser figcaption si elle existe
        const figcaption = element.nextElementSibling;
        if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
            updates.forEach(([prop, value]) => {
                if (prop === '--print-row') {
                    figcaption.style.setProperty(prop, value + height);
                } else {
                    figcaption.style.setProperty(prop, value);
                }
            });
        }
    }

    cleanup() {
        if (!this.isInitialized) return;

        // Supprimer les event listeners
        document.removeEventListener('mouseenter', this.handleMouseEnter, { capture: true, passive: true });
        document.removeEventListener('mouseleave', this.handleMouseLeave, { capture: true, passive: true });
        document.removeEventListener('mousemove', this.handleMouseMove, true);
        document.removeEventListener('mousedown', this.handleMouseDown, true);
        document.removeEventListener('mouseup', this.handleMouseUp, true);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        // Nettoyer les éléments
        if (this.hoveredElement) {
            cleanupElement(this.hoveredElement);
            this.hoveredElement = null;
        }

        document.querySelectorAll('.resizable, .resizing').forEach(cleanupElement);
        document.body.classList.remove('grid-resizing');

        this.isInitialized = false;
        console.log('🧹 gridHandler nettoyé');
    }

    destroy() {
        this.cleanup();
    }
}