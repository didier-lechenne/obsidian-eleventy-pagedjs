import { ImageManipulator } from './ImageManipulator.js';

export class GridDragDropHandler {
    constructor() {
        this.isResizing = false;
        this.currentElement = null;
        this.hoveredElement = null;
        this.resizeMode = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startCol = 0;
        this.startRow = 0;
        this.isInitialized = false;
        
        // Zones de détection (en pixels depuis les bords)
        this.zones = {
            edge: 15,     // Zone de bord pour resize
            corner: 20    // Zone de coin pour resize diagonal
        };
        
        console.log('🔧 GridDragDropHandler: Zones invisibles');
    }

    initializeDragDrop() {
        if (this.isInitialized) {
            this.cleanup();
        }
        
        this.addZoneStyles();
        this.setupGlobalListeners();
        this.isInitialized = true;
        
        console.log('✅ GridDragDropHandler: Zones invisibles initialisées');
    }

    addZoneStyles() {
        if (document.querySelector('#zone-grid-resize-styles')) return;

        const style = document.createElement('style');
        style.id = 'zone-grid-resize-styles';
        style.textContent = `
        @media screen, pagedjs-ignore {
            /* Élément sélectionnable */
            .modularGrid .resizable {
                outline: 2px solid #3b82f6 !important;
                background: rgba(59, 130, 246, 0.05) !important;
                position: relative;
            }
            
            /* État de redimensionnement */
            body.grid-resizing {
                user-select: none;
                cursor: inherit !important;
            }
            
            body.grid-resizing * {
                pointer-events: none !important;
            }
            
            body.grid-resizing .resizable,
            body.grid-resizing .resizable * {
                pointer-events: auto !important;
            }
            
            .resizing {
                outline: 2px solid #ef4444 !important;
                background: rgba(239, 68, 68, 0.1) !important;
                z-index: 1000;
            }
            
            /* Debug info */
            .resize-debug {
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                pointer-events: none;
                z-index: 1001;
                white-space: nowrap;
            }
            
            /* Indicateur visuel du mode de resize au centre */
            .resizable::after {
                content: attr(data-resize-mode);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.9);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-family: monospace;
                pointer-events: none;
                z-index: 10;
                opacity: 0.8;
            }
            
            /* Masquer l'indicateur par défaut */
            .resizable::after {
                display: none;
            }
            
            /* Afficher pendant le hover */
            body.layout .modularGrid .resizable::after {
                display: block;
            }
        }
        `;
        document.head.appendChild(style);
        console.log('✅ Styles zones ajoutés');
    }

    isInModularGrid(element) {
        return element.closest('.modularGrid') !== null;
    }

    setupGlobalListeners() {
        // Utiliser mouseenter/mouseleave avec vérification de type
        document.addEventListener('mouseenter', (e) => {
            // Vérifier que c'est un élément DOM
            if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
            this.handleMouseEnter(e);
        }, { capture: true, passive: true });
        
        document.addEventListener('mouseleave', (e) => {
            if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
            this.handleMouseLeave(e);
        }, { capture: true, passive: true });
        
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        }, true);
        
        document.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        }, true);
        
        document.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        }, true);
        
        console.log('🎧 Listeners zones configurés');
    }

    handleMouseEnter(e) {
        if (this.isResizing || !document.body.classList.contains('layout')) return;

        const target = e.target.closest('.resize, .figure, .insert');
        
        if (!target || 
            e.target.closest('figcaption') || 
            !this.isInModularGrid(target) ||
            this.hoveredElement === target) return;

        // Nettoyer l'ancien élément
        if (this.hoveredElement && this.hoveredElement !== target) {
            this.cleanupElement(this.hoveredElement);
        }

        this.hoveredElement = target;
        target.classList.add('resizable');
        target.dataset.resizeMode = 'move'; // Mode par défaut
        
        console.log('✅ Hover sur:', target.className);
    }

    handleMouseLeave(e) {
        if (this.isResizing) return;

        const target = e.target.closest('.resize, .figure, .insert');
        if (!target || target !== this.hoveredElement) return;

        // Vérifier qu'on sort vraiment de l'élément
        const relatedTarget = e.relatedTarget;
        if (!target.contains(relatedTarget)) {
            this.cleanupElement(target);
            this.hoveredElement = null;
            console.log('🚪 Sortie de:', target.className);
        }
    }

    handleMouseMove(e) {
        // Pendant resize = traiter mouvement
        if (this.isResizing) {
            this.handleResizeMove(e);
            return;
        }

        // Pas d'élément survolé = pas de traitement
        if (!this.hoveredElement) return;

        this.updateCursor(this.hoveredElement, e.clientX, e.clientY);
    }

    cleanupElement(element) {
        element.classList.remove('resizable');
        element.style.cursor = 'default';
        delete element.dataset.resizeMode;
    }

    updateCursor(element, clientX, clientY) {
        const zone = this.getInteractionZone(element, clientX, clientY);
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
        
        element.style.cursor = cursors[zone] || 'default';
        element.dataset.resizeMode = zone;
    }

    getInteractionZone(element, clientX, clientY) {
        const rect = element.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const isNearLeft = x <= this.zones.edge;
        const isNearRight = x >= rect.width - this.zones.edge;
        const isNearTop = y <= this.zones.edge;
        const isNearBottom = y >= rect.height - this.zones.edge;
        
        // Coins (priorité)
        if (isNearLeft && isNearTop) return 'nw-resize';
        if (isNearRight && isNearTop) return 'ne-resize';
        if (isNearLeft && isNearBottom) return 'sw-resize';
        if (isNearRight && isNearBottom) return 'se-resize';
        
        // Bords
        if (isNearLeft) return 'w-resize';
        if (isNearRight) return 'e-resize';
        if (isNearTop) return 'n-resize';
        if (isNearBottom) return 's-resize';
        
        return 'move';
    }

    handleMouseDown(e) {
        if (!document.body.classList.contains('layout') || this.isResizing) return;
        if (!this.hoveredElement) return;

        const zone = this.getInteractionZone(this.hoveredElement, e.clientX, e.clientY);
        if (!zone) return;

        console.log('🎯 DÉBUT:', { element: this.hoveredElement.className, zone });

        e.preventDefault();
        e.stopPropagation();

        this.startResize(this.hoveredElement, zone, e);
    }

    startResize(element, mode, e) {
        this.isResizing = true;
        this.resizeMode = mode;
        this.currentElement = element;
        this.startX = e.clientX;
        this.startY = e.clientY;

        // Valeurs CSS actuelles
        this.startWidth = parseInt(element.style.getPropertyValue('--print-width')) || 6;
        this.startHeight = parseInt(element.style.getPropertyValue('--print-height')) || 3;
        this.startCol = parseInt(element.style.getPropertyValue('--print-col')) || 1;
        this.startRow = parseInt(element.style.getPropertyValue('--print-row')) || 1;

        // S'assurer que les propriétés sont définies
        this.ensureGridProperties(element);

        // États visuels
        document.body.classList.add('grid-resizing');
        element.classList.add('resizing');
        element.dataset.resizeMode = mode;

        // Debug
        this.showDebugInfo();

        console.log('📏 Départ:', {
            mode: this.resizeMode,
            size: `${this.startWidth}×${this.startHeight}`,
            pos: `[${this.startCol}, ${this.startRow}]`
        });
    }

    ensureGridProperties(element) {
        const props = [
            ['--print-col', this.startCol],
            ['--print-row', this.startRow],
            ['--print-width', this.startWidth],
            ['--print-height', this.startHeight]
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

        // Calculer les nouvelles valeurs
        const { newWidth, newHeight, newCol, newRow } = this.calculateNewValues(deltaX, deltaY);

        // Appliquer les changements
        this.applyGridChanges(newWidth, newHeight, newCol, newRow);
        
        // Mettre à jour debug
        this.updateDebugInfo(newWidth, newHeight, newCol, newRow);
    }

    calculateNewValues(deltaX, deltaY) {
        const container = this.currentElement.parentElement;
        const modularGrid = this.currentElement.closest('.modularGrid');

        const gridCols = parseInt(getComputedStyle(modularGrid).getPropertyValue('--grid-col')) || 12;
        const gridRows = parseInt(getComputedStyle(modularGrid).getPropertyValue('--grid-row')) || 10;

        const gridStepX = container.offsetWidth / gridCols;
        const gridStepY = container.offsetHeight / gridRows;

        const deltaCol = Math.round(deltaX / gridStepX);
        const deltaRow = Math.round(deltaY / gridStepY);

        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        let newCol = this.startCol;
        let newRow = this.startRow;

        switch (this.resizeMode) {
            case 'move':
                newCol = Math.max(1, Math.min(gridCols - this.startWidth + 1, this.startCol + deltaCol));
                newRow = Math.max(1, Math.min(gridRows - this.startHeight + 1, this.startRow + deltaRow));
                break;

            case 'n-resize':
                const heightDeltaN = -deltaRow;
                newHeight = Math.max(1, this.startHeight + heightDeltaN);
                newRow = Math.max(1, this.startRow + deltaRow);
                if (newRow + newHeight - 1 > gridRows) {
                    newHeight = gridRows - newRow + 1;
                }
                break;

            case 's-resize':
                newHeight = Math.max(1, Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow));
                break;

            case 'e-resize':
                newWidth = Math.max(1, Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol));
                break;

            case 'w-resize':
                const widthDeltaW = -deltaCol;
                newWidth = Math.max(1, this.startWidth + widthDeltaW);
                newCol = Math.max(1, this.startCol + deltaCol);
                if (newCol + newWidth - 1 > gridCols) {
                    newWidth = gridCols - newCol + 1;
                }
                break;

            case 'ne-resize':
                const heightDeltaNE = -deltaRow;
                newHeight = Math.max(1, this.startHeight + heightDeltaNE);
                newRow = Math.max(1, this.startRow + deltaRow);
                newWidth = Math.max(1, Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol));
                if (newRow + newHeight - 1 > gridRows) {
                    newHeight = gridRows - newRow + 1;
                }
                break;

            case 'nw-resize':
                const heightDeltaNW = -deltaRow;
                const widthDeltaNW = -deltaCol;
                newHeight = Math.max(1, this.startHeight + heightDeltaNW);
                newRow = Math.max(1, this.startRow + deltaRow);
                newWidth = Math.max(1, this.startWidth + widthDeltaNW);
                newCol = Math.max(1, this.startCol + deltaCol);
                break;

            case 'se-resize':
                newHeight = Math.max(1, Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow));
                newWidth = Math.max(1, Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol));
                break;

            case 'sw-resize':
                newHeight = Math.max(1, Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow));
                const widthDeltaSW = -deltaCol;
                newWidth = Math.max(1, this.startWidth + widthDeltaSW);
                newCol = Math.max(1, this.startCol + deltaCol);
                break;
        }

        return { newWidth, newHeight, newCol, newRow };
    }

    applyGridChanges(newWidth, newHeight, newCol, newRow) {
        const element = this.currentElement;

        // Propriétés à mettre à jour selon le mode
        const updates = [];

        if (this.resizeMode === 'move') {
            updates.push(['--print-col', newCol], ['--print-row', newRow]);
        } else {
            updates.push(
                ['--print-col', newCol],
                ['--print-row', newRow],
                ['--print-width', newWidth],
                ['--print-height', newHeight]
            );
        }

        // Appliquer sur l'élément principal
        updates.forEach(([prop, value]) => {
            element.style.setProperty(prop, value);
        });

        // Appliquer sur figcaption si elle existe
        const figcaption = element.nextElementSibling;
        if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
            updates.forEach(([prop, value]) => {
                if (prop === '--print-row') {
                    figcaption.style.setProperty(prop, value + newHeight);
                } else {
                    figcaption.style.setProperty(prop, value);
                }
            });
        }
    }

    handleMouseUp(e) {
        if (!this.isResizing) return;

        console.log('🏁 Fin du resize');

        const currentElement = this.currentElement;

        // Nettoyer les états
        document.body.classList.remove('grid-resizing');
        if (currentElement) {
            currentElement.classList.remove('resizing');
            currentElement.style.cursor = 'default';

            // Générer le code final
            this.generateCode(currentElement);

            // Masquer après un délai
            setTimeout(() => {
                if (currentElement && !currentElement.matches(':hover')) {
                    currentElement.classList.remove('resizable');
                    delete currentElement.dataset.resizeMode;
                }
            }, 1000);
        }

        // Nettoyer debug
        this.hideDebugInfo();

        // Reset
        this.isResizing = false;
        this.currentElement = null;
        this.resizeMode = null;
    }

    showDebugInfo() {
        this.hideDebugInfo();
        
        const debug = document.createElement('div');
        debug.className = 'resize-debug';
        debug.id = 'resize-debug';
        
        this.currentElement.appendChild(debug);
        this.updateDebugInfo(this.startWidth, this.startHeight, this.startCol, this.startRow);
    }

    updateDebugInfo(width, height, col, row) {
        const debug = document.querySelector('#resize-debug');
        if (debug) {
            const modeEmojis = {
                'move': '🔄', 'se-resize': '↘️', 'e-resize': '➡️', 's-resize': '⬇️',
                'nw-resize': '↖️', 'n-resize': '⬆️', 'w-resize': '⬅️', 'ne-resize': '↗️', 'sw-resize': '↙️'
            };
            
            const emoji = modeEmojis[this.resizeMode] || '🔧';
            debug.textContent = `${emoji} ${width}×${height} @ [${col},${row}]`;
        }
    }

    hideDebugInfo() {
        const debug = document.querySelector('#resize-debug');
        if (debug) debug.remove();
    }

    generateCode(element) {
        if (!element) return;

        const manipulator = new ImageManipulator();
        manipulator.generateCode(element, true);

        console.log('📝 Code généré');
    }

    cleanup() {
        // Supprimer les listeners
        document.removeEventListener('mouseenter', this.handleMouseEnter, { capture: true, passive: true });
        document.removeEventListener('mouseleave', this.handleMouseLeave, { capture: true, passive: true });
        document.removeEventListener('mousemove', this.handleMouseMove, true);
        document.removeEventListener('mousedown', this.handleMouseDown, true);
        document.removeEventListener('mouseup', this.handleMouseUp, true);

        // Nettoyer les états
        if (this.hoveredElement) {
            this.cleanupElement(this.hoveredElement);
            this.hoveredElement = null;
        }

        document.querySelectorAll('.resizable, .resizing').forEach(el => {
            el.classList.remove('resizable', 'resizing');
            el.style.cursor = 'default';
            delete el.dataset.resizeMode;
        });

        document.body.classList.remove('grid-resizing');

        this.isInitialized = false;
        console.log('🧹 GridDragDropHandler zones nettoyé');
    }

    destroy() {
        this.cleanup();
    }
}