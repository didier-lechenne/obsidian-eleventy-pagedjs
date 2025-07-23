// utils/grid-calculator.js
// Utilitaires pour les calculs de grille modulaire

/**
 * Classe pour les calculs liés aux grilles modulaires
 */
export class GridCalculator {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Récupère la configuration d'une grille modulaire
     */
    getGridConfig(modularGridElement) {
        const cacheKey = `config-${modularGridElement.id || 'anonymous'}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const computedStyle = getComputedStyle(modularGridElement);
        
        const config = {
            cols: parseInt(computedStyle.getPropertyValue('--grid-col').trim()) || 12,
            rows: parseInt(computedStyle.getPropertyValue('--grid-row').trim()) || 10,
            colGutter: computedStyle.getPropertyValue('--grid-col-gutter').trim() || '3mm',
            rowGutter: computedStyle.getPropertyValue('--grid-row-gutter').trim() || '3mm',
            element: modularGridElement
        };

        this.cache.set(cacheKey, config);
        return config;
    }

    /**
     * Calcule les dimensions d'une cellule de grille
     */
    calculateCellDimensions(containerElement, gridConfig) {
        const containerWidth = containerElement.offsetWidth;
        const containerHeight = containerElement.offsetHeight;
        
        return {
            width: containerWidth / gridConfig.cols,
            height: containerHeight / gridConfig.rows,
            stepX: containerWidth / gridConfig.cols,
            stepY: containerHeight / gridConfig.rows
        };
    }

    /**
     * Convertit une position pixel en coordonnées de grille
     */
    pixelToGrid(pixelX, pixelY, cellDimensions) {
        return {
            col: Math.round(pixelX / cellDimensions.stepX),
            row: Math.round(pixelY / cellDimensions.stepY)
        };
    }

    /**
     * Convertit les coordonnées de grille en pixels
     */
    gridToPixel(col, row, cellDimensions) {
        return {
            x: col * cellDimensions.stepX,
            y: row * cellDimensions.stepY
        };
    }

    /**
     * Calcule la nouvelle position basée sur un delta de mouvement
     */
    calculateNewPosition(startCol, startRow, deltaX, deltaY, cellDimensions, gridConfig) {
        const gridDeltaX = Math.round(deltaX / cellDimensions.stepX);
        const gridDeltaY = Math.round(deltaY / cellDimensions.stepY);
        
        const newCol = Math.max(1, Math.min(gridConfig.cols, startCol + gridDeltaX));
        const newRow = Math.max(1, Math.min(gridConfig.rows, startRow + gridDeltaY));
        
        return { col: newCol, row: newRow };
    }

    /**
     * Calcule les nouvelles dimensions basées sur un delta de redimensionnement
     */
    calculateNewSize(startWidth, startHeight, deltaX, deltaY, cellDimensions, gridConfig) {
        const widthDelta = Math.round(deltaX / cellDimensions.stepX);
        const heightDelta = Math.round(deltaY / cellDimensions.stepY);
        
        const newWidth = Math.max(1, Math.min(gridConfig.cols, startWidth + widthDelta));
        const newHeight = Math.max(1, Math.min(gridConfig.rows, startHeight + heightDelta));
        
        return { width: newWidth, height: newHeight };
    }

    /**
     * Vérifie si une position/taille est valide dans la grille
     */
    isValidPlacement(col, row, width, height, gridConfig) {
        return (
            col >= 1 && 
            row >= 1 && 
            col + width - 1 <= gridConfig.cols && 
            row + height - 1 <= gridConfig.rows &&
            width >= 1 &&
            height >= 1
        );
    }

    /**
     * Trouve la position optimale pour un élément
     */
    findOptimalPosition(preferredCol, preferredRow, width, height, gridConfig, occupiedCells = []) {
        // Essayer la position préférée d'abord
        if (this.isValidPlacement(preferredCol, preferredRow, width, height, gridConfig) &&
            !this.isOccupied(preferredCol, preferredRow, width, height, occupiedCells)) {
            return { col: preferredCol, row: preferredRow };
        }

        // Chercher la première position libre
        for (let row = 1; row <= gridConfig.rows - height + 1; row++) {
            for (let col = 1; col <= gridConfig.cols - width + 1; col++) {
                if (this.isValidPlacement(col, row, width, height, gridConfig) &&
                    !this.isOccupied(col, row, width, height, occupiedCells)) {
                    return { col, row };
                }
            }
        }

        // Aucune position libre trouvée
        return null;
    }

    /**
     * Vérifie si une zone est occupée
     */
    isOccupied(col, row, width, height, occupiedCells) {
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                if (occupiedCells.some(cell => cell.col === c && cell.row === r)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Récupère les propriétés CSS de grille d'un élément
     */
    getElementGridProperties(element) {
        const style = element.style;
        
        return {
            col: parseInt(style.getPropertyValue('--print-col')) || 1,
            row: parseInt(style.getPropertyValue('--print-row')) || 1,
            width: parseInt(style.getPropertyValue('--print-width')) || 1,
            height: parseInt(style.getPropertyValue('--print-height')) || 1
        };
    }

    /**
     * Applique les propriétés CSS de grille à un élément
     */
    setElementGridProperties(element, col, row, width, height) {
        element.style.setProperty('--print-col', col);
        element.style.setProperty('--print-row', row);
        element.style.setProperty('--print-width', width);
        element.style.setProperty('--print-height', height);
    }

    /**
     * Calcule les contraintes de redimensionnement
     */
    getResizeConstraints(element, gridConfig) {
        const props = this.getElementGridProperties(element);
        
        return {
            minWidth: 1,
            maxWidth: gridConfig.cols - props.col + 1,
            minHeight: 1,
            maxHeight: gridConfig.rows - props.row + 1,
            minCol: 1,
            maxCol: gridConfig.cols - props.width + 1,
            minRow: 1,
            maxRow: gridConfig.rows - props.height + 1
        };
    }

    /**
     * Génère des informations de debug pour la grille
     */
    getDebugInfo(element, gridConfig, cellDimensions) {
        const props = this.getElementGridProperties(element);
        const constraints = this.getResizeConstraints(element, gridConfig);
        
        return {
            element: element.id || element.className,
            grid: `${gridConfig.cols}×${gridConfig.rows}`,
            position: `[${props.col}, ${props.row}]`,
            size: `${props.width}×${props.height}`,
            cellSize: `${Math.round(cellDimensions.width)}×${Math.round(cellDimensions.height)}px`,
            constraints: {
                position: `[${constraints.minCol}-${constraints.maxCol}, ${constraints.minRow}-${constraints.maxRow}]`,
                size: `${constraints.minWidth}-${constraints.maxWidth}×${constraints.minHeight}-${constraints.maxHeight}`
            }
        };
    }

    /**
     * Vide le cache des calculs
     */
    clearCache() {
        this.cache.clear();
    }
}