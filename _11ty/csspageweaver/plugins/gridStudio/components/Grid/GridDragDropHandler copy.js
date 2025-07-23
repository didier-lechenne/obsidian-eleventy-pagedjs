import { ImageManipulator } from '../image/ImageManipulator.js';

export  class GridDragDropHandler {
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

    setupHoverClass() {
        document.addEventListener('mouseover', (e) => {
            // Ne pas traiter les événements sur les légendes
            if (e.target.closest('figcaption')) return;
            
            const target = e.target.closest('.resize, .figure, .insert');
            
            // Vérifier si on est en mode gridStudio ET dans une grille modulaire
            if (target && 
                document.body.classList.contains('gridStudio') && 
                !this.isResizing && 
                this.isInModularGrid(target)) {
                
                target.classList.add('selected');
                this.addHandlesIfNeeded(target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            // Ne pas traiter les événements sur les légendes
            if (e.target.closest('figcaption')) return;
            
            const target = e.target.closest('.resize, .figure, .insert');
            if (target && !this.isResizing && !target.contains(e.relatedTarget)) {
                target.classList.remove('selected');
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
        if (!document.body.classList.contains('gridStudio')) return;

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
        this.currentElement.classList.add('selected');

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
                    currentElement.classList.remove('selected');
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
        
        // Supprimer toutes les classes selected
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
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
        if (document.body.classList.contains('gridStudio')) {
            const gridHandler = new GridDragDropHandler();
            gridHandler.initializeDragDrop();
        }
    });
}