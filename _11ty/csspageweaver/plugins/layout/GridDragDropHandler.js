import { ImageManipulator } from './ImageManipulator.js';

export class GridDragDropHandler {
    constructor() {
        this.isResizing = false;
        this.currentElement = null;
        this.resizeMode = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startCol = 0;
        this.startRow = 0;
        this.isInitialized = false;
    }

    initializeDragDrop() {
        if (this.isInitialized) {
            this.cleanup();
        }
        
        this.addResizeStyles();
        this.setupGlobalListeners();
        this.setupHoverClass();
        this.isInitialized = true;
        console.log('🎯 GridDragDropHandler: Poignées pour grilles modulaires');
    }

    // Vérifie si l'élément est dans une grille modulaire
    isInModularGrid(element) {
        const modularGrid = element.closest('.modularGrid');
        return modularGrid !== null;
    }

    addResizeStyles() {
        if (document.querySelector('#grid-resize-styles')) return;

        const style = document.createElement('style');
        style.id = 'grid-resize-styles';
        style.textContent = `

        @media screen, pagedjs-ignore {
            /* Conteneur avec poignées visibles seulement avec la classe .resizable */
            .modularGrid .resizable {
                position: relative;
            }
            
            .modularGrid .resizable::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                border: 1px dashed var(--accentColor, blue);
                opacity: 0.7;
                z-index: 1;
                outline-offset: 20px;
            }
            
            /* Poignée position (haut gauche) */
            .modularGrid .resizable .position-handle {
                position: absolute;
                top: 5px;
                left: 5px;
                width: 24px;
                height: 24px;
                background: rgb(255,255,255);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                cursor: move;
                pointer-events: auto;
                z-index: 15;
            }
            
            .position-handle::before {
                content: '';
                width: 16px;
                height: 16px;
                background-image: url('/csspageweaver/plugins/layout/svg/grip.svg');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            /* Poignée largeur (droite) */
            .modularGrid .resizable .width-handle {
                position: absolute;
                top: 50%;
                right: 5px;
                width: 24px;
                height: 24px;
                background: rgb(255,255,255);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                cursor: ew-resize;
                transform: translateY(-50%);
                pointer-events: auto;
                z-index: 15;
            }

            .width-handle::before {
                content: '';
                width: 16px;
                height: 16px;
                background-image: url('/csspageweaver/plugins/layout/svg/unfold-horizontal.svg');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            /* Poignée hauteur (bas) */
            .modularGrid .resizable .height-handle {
                position: absolute;
                bottom: 5px;
                left: 50%;
                width: 24px;
                height: 24px;
                background:rgb(255,255,255);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                cursor: ns-resize;
                transform: translateX(-50%);
                pointer-events: auto;
                z-index: 15;
            }

            .height-handle::before {
                content: '';
                width: 16px;
                height: 16px;
                background-image: url('/csspageweaver/plugins/layout/svg/unfold-vertical.svg');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }

            /* Poignée diagonale (coin bas droit) */
            .modularGrid .resizable .both-handle {
                position: absolute;
                bottom: 5px;
                right: 5px;
                width: 24px;
                height: 24px;
                background:rgb(255, 255, 255);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                cursor: nwse-resize;
                pointer-events: auto;
                z-index: 15;
            }

            .both-handle::before {
                content: '';
                width: 16px;
                height: 16px;
                background-image: url('./csspageweaver/plugins/layout/svg/move-diagonal-2.svg');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }

            /* États de redimensionnement */
            body.grid-resizing {
                user-select: none;
            }
            
            body.grid-resizing * {
                pointer-events: none;
            }
            
            body.grid-resizing .resizable,
            body.grid-resizing .resizable * {
                pointer-events: auto;
            }
            
            /* Animation pendant le déplacement */
            .resizing {
                opacity: 0.8;
                z-index: 100;
            }
            
            /* Debug info */
            .resize-debug {
                position: absolute;
                top: -35px;
                left: 5px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                pointer-events: none;
                z-index: 20;
                white-space: nowrap;
                font-family: monospace;
            }
            
            /* Mode layout uniquement */
            body:not(.interface-preview) .modularGrid .resizable .position-handle,
            body:not(.interface-preview) .modularGrid .resizable .width-handle,
            body:not(.interface-preview) .modularGrid .resizable .height-handle,
            body:not(.interface-preview) .modularGrid .resizable .both-handle {
                display: flex !important;
                opacity: 1;
            }
            
            /* Masquer les poignées par défaut */


            .position-handle,
            .width-handle,
            .height-handle,
            .both-handle {
                display: none !important;
            }
            
            /* Debug : afficher temporairement toutes les poignées en mode layout */
            body:not(.interface-preview) .modularGrid .resize .position-handle,
            body:not(.interface-preview) .modularGrid .resize .width-handle,
            body:not(.interface-preview) .modularGrid .resize .height-handle,
            body:not(.interface-preview) .modularGrid .resize .both-handle,
            body:not(.interface-preview) .modularGrid .figure .position-handle,
            body:not(.interface-preview) .modularGrid .figure .width-handle,
            body:not(.interface-preview) .modularGrid .figure .height-handle,
            body:not(.interface-preview) .modularGrid .figure .both-handle,
            body:not(.interface-preview) .modularGrid .insert .position-handle,
            body:not(.interface-preview) .modularGrid .insert .width-handle,
            body:not(.interface-preview) .modularGrid .insert .height-handle,
            body:not(.interface-preview) .modularGrid .insert .both-handle {
                display: flex ;
                opacity: 0.7;
            }
            
            /* Pleine visibilité au survol */
            body:not(.interface-preview) .modularGrid .resizable .position-handle,
            body:not(.interface-preview) .modularGrid .resizable .width-handle,
            body:not(.interface-preview) .modularGrid .resizable .height-handle,
            body:not(.interface-preview) .modularGrid .resizable .both-handle {
                opacity: 1 !important;
            }

    }
        `;
        document.head.appendChild(style);
    }

    setupHoverClass() {
        document.addEventListener('mouseover', (e) => {
            // Ne pas traiter les événements sur les légendes
            if (e.target.closest('figcaption')) return;
            
            const target = e.target.closest('.resize, .figure, .insert');
            
            // Vérifier si on est en mode layout ET dans une grille modulaire
            if (target && 
                document.body.dataset.mode === 'layout' && 
                !this.isResizing && 
                this.isInModularGrid(target)) {
                
                target.classList.add('resizable');
                this.addHandlesIfNeeded(target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            // Ne pas traiter les événements sur les légendes
            if (e.target.closest('figcaption')) return;
            
            const target = e.target.closest('.resize, .figure, .insert');
            if (target && !this.isResizing && !target.contains(e.relatedTarget)) {
                target.classList.remove('resizable');
            }
        });
    }

    addHandlesIfNeeded(element) {
        // Ne pas ajouter de poignées si pas dans une grille modulaire
        if (!this.isInModularGrid(element)) return;
        
        // Vérifier si les poignées existent déjà
        const handles = ['position-handle', 'width-handle', 'height-handle', 'both-handle'];
        
        handles.forEach(handleClass => {
            if (!element.querySelector(`.${handleClass}`)) {
                const handle = document.createElement('div');
                handle.className = handleClass;
                handle.dataset.mode = handleClass.replace('-handle', '');
                
                // Icônes pour chaque type
                switch(handleClass) {
                    case 'position-handle':
                        handle.title = 'Déplacer la position';
                        break;
                    case 'width-handle':
                        handle.title = 'Redimensionner la largeur';
                        break;
                    case 'height-handle':
                        handle.title = 'Redimensionner la hauteur';
                        break;
                    case 'both-handle':
                        handle.title = 'Redimensionner les deux';
                        break;
                }
                
                element.appendChild(handle);
            }
        });
    }

    setupGlobalListeners() {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        document.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
        
        console.log('🎧 Listeners de grille modulaire configurés');
    }

    handleMouseDown(e) {
        if (document.body.dataset.mode !== 'layout') return;

        let resizeMode = null;
        let targetElement = null;

        // Détecter le clic sur les poignées
        if (e.target.classList.contains('position-handle')) {
            resizeMode = 'position';
            targetElement = e.target.closest('.resize, .figure, .insert');
        } else if (e.target.classList.contains('width-handle')) {
            resizeMode = 'width';
            targetElement = e.target.closest('.resize, .figure, .insert');
        } else if (e.target.classList.contains('height-handle')) {
            resizeMode = 'height';
            targetElement = e.target.closest('.resize, .figure, .insert');
        } else if (e.target.classList.contains('both-handle')) {
            resizeMode = 'both';
            targetElement = e.target.closest('.resize, .figure, .insert');
        }

        if (!resizeMode || !targetElement) return;
        
        // Vérifier si l'élément est dans une grille modulaire
        if (!this.isInModularGrid(targetElement)) {
            console.log('⚠️ Élément pas dans une grille modulaire');
            return;
        }

        console.log('🎯 DÉBUT DU RESIZE!', {
            element: targetElement.id || targetElement.className,
            mode: resizeMode,
            modularGrid: targetElement.closest('.modularGrid')?.className || 'N/A'
        });

        e.preventDefault();
        e.stopPropagation();

        this.isResizing = true;
        this.resizeMode = resizeMode;
        this.currentElement = targetElement;

        // Position de départ
        this.startX = e.clientX;
        this.startY = e.clientY;

        // Valeurs CSS actuelles
this.startWidth = parseInt(this.currentElement.style.getPropertyValue('--print-width')) || 6;
this.startHeight = parseInt(this.currentElement.style.getPropertyValue('--print-height')) || 3;
this.startCol = parseInt(this.currentElement.style.getPropertyValue('--print-col')) || 1;
this.startRow = parseInt(this.currentElement.style.getPropertyValue('--print-row')) || 1;

        // S'assurer que l'élément a les valeurs initiales définies
        if (!this.currentElement.style.getPropertyValue('--print-col')) {
            this.currentElement.style.setProperty('--print-col', this.startCol);
        }
        if (!this.currentElement.style.getPropertyValue('--print-row')) {
            this.currentElement.style.setProperty('--print-row', this.startRow);
        }
        if (!this.currentElement.style.getPropertyValue('--print-width')) {
            this.currentElement.style.setProperty('--print-width', this.startWidth);
        }
        if (!this.currentElement.style.getPropertyValue('--print-height')) {
            this.currentElement.style.setProperty('--print-height', this.startHeight);
        }

        console.log('📏 Valeurs de départ:', {
            mode: this.resizeMode,
            startWidth: this.startWidth,
            startHeight: this.startHeight,
            startCol: this.startCol,
            startRow: this.startRow
        });

        // États visuels
        document.body.classList.add('grid-resizing');
        this.currentElement.classList.add('resizing');
        this.currentElement.classList.add('resizable');

        // Debug visuel
        this.showDebugInfo();
    }

    handleMouseMove(e) {
        if (!this.isResizing || !this.currentElement) return;

        e.preventDefault();

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        // Calculer la taille d'une cellule de grille
        const container = this.currentElement.parentElement;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Obtenir le nombre de colonnes et de lignes de la grille depuis l'élément .modularGrid le plus proche
        const modularGrid = this.currentElement.closest('.modularGrid');
        const gridCols = parseInt(getComputedStyle(modularGrid).getPropertyValue('--grid-col')) || 12;
        const gridRows = parseInt(getComputedStyle(modularGrid).getPropertyValue('--grid-row')) || 10;
        
        const gridStepX = containerWidth / gridCols;
        const gridStepY = containerHeight / gridRows;

        const deltaCol = Math.round(deltaX / gridStepX);
        const deltaRow = Math.round(deltaY / gridStepY);

        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        let newCol = this.startCol;
        let newRow = this.startRow;

        // Calcul selon le mode
        switch(this.resizeMode) {
            case 'position':
                newCol = Math.max(1, Math.min(gridCols - this.startWidth + 1, this.startCol + deltaCol));
                newRow = Math.max(1, Math.min(gridRows - this.startHeight + 1, this.startRow + deltaRow));
                break;
                
            case 'width':
                newWidth = Math.max(1, Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol));
                break;
                
            case 'height':
                newHeight = Math.max(1, Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow));
                break;
                
            case 'both':
                newWidth = Math.max(1, Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol));
                newHeight = Math.max(1, Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow));
                break;
        }

        // Appliquer les changements
        if (this.resizeMode === 'position' || this.resizeMode === 'both') {
            this.currentElement.style.setProperty('--print-col', newCol);
            this.currentElement.style.setProperty('--print-row', newRow);
            
            // Appliquer également sur figcaption (élément suivant)
            const figcaption = this.currentElement.nextElementSibling;
            if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
                figcaption.style.setProperty('--print-col', newCol);
                figcaption.style.setProperty('--print-row', newRow );
            }
        }
        
        if (this.resizeMode === 'width' || this.resizeMode === 'both') {
            this.currentElement.style.setProperty('--print-width', newWidth);
            
            // Appliquer également sur figcaption (élément suivant)
            const figcaption = this.currentElement.nextElementSibling;
            if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
                figcaption.style.setProperty('--print-width', newWidth);
            }
        }
        
        if (this.resizeMode === 'height' || this.resizeMode === 'both') {
            this.currentElement.style.setProperty('--print-height', newHeight);
            
            // Mettre à jour la position verticale de figcaption après changement de hauteur
            const figcaption = this.currentElement.nextElementSibling;
            if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
                figcaption.style.setProperty('--print-height',  newHeight);
            }
        }

        // Mettre à jour le debug
        this.updateDebugInfo(
            this.resizeMode === 'position' ? this.startWidth : newWidth, 
            this.resizeMode === 'position' ? this.startHeight : newHeight, 
            newCol, 
            newRow
        );
    }

    handleMouseUp(e) {
        if (!this.isResizing) return;

        console.log('🏁 Fin du resize');

        // Sauvegarder la référence à l'élément avant de la réinitialiser
        const currentElement = this.currentElement;

        // Nettoyer les états
        document.body.classList.remove('grid-resizing');
        if (currentElement) {
            currentElement.classList.remove('resizing');
            
            // Permettre à resizable de disparaître après un délai
            setTimeout(() => {
                if (currentElement && !currentElement.matches(':hover')) {
                    currentElement.classList.remove('resizable');
                }
            }, 1000);
        }

        // Générer le code final
        this.generateCode();

        // Nettoyer le debug
        this.hideDebugInfo();

        // Reset des propriétés
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
            const modularGrid = this.currentElement.closest('.modularGrid');
            const gridCols = parseInt(getComputedStyle(modularGrid).getPropertyValue('--grid-col')) || 12;
            const gridRows = parseInt(getComputedStyle(modularGrid).getPropertyValue('--grid-row')) || 10;
            
            if (this.resizeMode === 'position') {
                debug.textContent = `Position: [${col}, ${row}] (Grid: ${gridCols}×${gridRows})`;
            } else if (this.resizeMode === 'width') {
                debug.textContent = `Width: ${width}/${gridCols} cols`;
            } else if (this.resizeMode === 'height') {
                debug.textContent = `Height: ${height}/${gridRows} rows`;
            } else if (this.resizeMode === 'both') {
                debug.textContent = `Size: ${width}×${height} @ [${col}, ${row}]`;
            }
        }
    }

    hideDebugInfo() {
        const debug = document.querySelector('#resize-debug');
        if (debug) {
            debug.remove();
        }
    }

    generateCode() {
        if (!this.currentElement) return;

        // Debug : vérifier l'attribut alt
        const img = this.currentElement.querySelector('img');
        if (img) {
            console.log('🔍 img.alt:', img.alt);
            console.log('🔍 img.getAttribute("alt"):', img.getAttribute("alt"));
        }

        // Utiliser ImageManipulator pour générer le code
        const manipulator = new ImageManipulator();
        
        // Appeler la méthode generateCode existante avec copie automatique
        manipulator.generateCode(this.currentElement, true);
        
        console.log('📝 Code généré via ImageManipulator');
    }

    cleanup() {
        // Supprimer les listeners
        document.removeEventListener('mousedown', this.handleMouseDown, true);
        document.removeEventListener('mousemove', this.handleMouseMove, true);
        document.removeEventListener('mouseup', this.handleMouseUp, true);
        
        // Supprimer toutes les classes resizable
        document.querySelectorAll('.resizable').forEach(el => {
            el.classList.remove('resizable');
        });
        
        // Supprimer les poignées ajoutées
        document.querySelectorAll('.position-handle, .width-handle, .height-handle, .both-handle').forEach(handle => handle.remove());
        
        // États
        document.body.classList.remove('grid-resizing');
        
        this.isInitialized = false;
        console.log('🧹 GridDragDropHandler nettoyé');
    }

    destroy() {
        this.cleanup();
    }
}

if (typeof Paged !== "undefined") {
    class GridResizeHandler extends Paged.Handler {
        constructor(chunker, polisher, caller) {
            super(chunker, polisher, caller);
            this.gridHandler = new GridDragDropHandler();
        }

        afterPreview(pages) {
            this.gridHandler.initializeDragDrop();
        }

        afterRendered(pages) {
   
        }
    }

    Paged.registerHandlers(GridResizeHandler);
} else {
    // Mode écran
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body.dataset.mode === 'layout') {
            const gridHandler = new GridDragDropHandler();
            gridHandler.initializeDragDrop();
        }
    });
}