import { Handler } from "../../../lib/paged.esm.js";
import { TurndownService } from './turndown.js';

export default class Layout extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        
        
        this.turndownService = this.setupTurndown();
       

        // État centralisé du plugin
        this.state = {
            selectedElement: null,      // Élément actuellement sélectionné
            hoveredElement: null,       // Élément survolé
            isResizing: false,          // En cours de redimensionnement
            isDragging: false,          // En cours de drag d'image
            currentImage: null,         // Image en cours de manipulation
            resizeMode: null,           // Mode de redimensionnement (move, n-resize, etc.)
            startX: 0,                  // Position initiale de la souris
            startY: 0,
            startValues: {},            // Valeurs CSS initiales
            isShiftPressed: false       // État de la touche Shift
        };
        
        // Zones de détection pour le redimensionnement (en pixels)
        this.zones = { edge: 20, corner: 25 };
        this.isInitialized = false;
        this.toggleHandler = null;
        
        // Positions pour la grille 9 points de positionnement d'images
        this.positions = [
            { id: "top_left", x: 0, y: 0 },
            { id: "top_middle", x: 0.5, y: 0 },
            { id: "top_right", x: 1, y: 0 },
            { id: "middle_left", x: 0, y: 0.5 },
            { id: "middle_middle", x: 0.5, y: 0.5 },
            { id: "middle_right", x: 1, y: 0.5 },
            { id: "bottom_left", x: 0, y: 1 },
            { id: "bottom_middle", x: 0.5, y: 1 },
            { id: "bottom_right", x: 1, y: 1 }
        ];
    }

setupTurndown() {
    const turndown = new TurndownService({
        headingStyle: 'atx',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined'
    });

    // Règle pour préserver <br/>
    turndown.addRule('lineBreak', {
        filter: 'br',
        replacement: function() {
            return ' <br/>';
        }
    });

    // Règle pour préserver <em> comme *italique*
    turndown.addRule('emphasis', {
        filter: ['em', 'i'],
        replacement: function(content) {
            if (!content.trim()) return '';
            return `*${content}*`;
        }
    });

    return turndown;
}

    // === CYCLE DE VIE DU PLUGIN ===

    beforeParsed(content) {
        this.cleanup();
    }

    afterRendered(pages) {
        setTimeout(() => {
            this.initialize();
            this.initializeLayoutToggle();
            this.isInitialized = true;
        }, 100);
    }

    initialize() {
        if (this.isInitialized) this.cleanup();
        
        this.setupEventListeners();
        this.setupPanelControls();
    }

    // === GESTIONNAIRE D'ÉVÉNEMENTS ===
    
    setupEventListeners() {
        // Événements de survol pour la détection des éléments
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), { capture: true });
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), { capture: true });
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
        
        // Événements de souris pour le redimensionnement et le drag
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
        document.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
        
        // Événements spéciaux pour les images
        document.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        document.addEventListener('click', this.handleClick.bind(this), true);
    }

    handleClick(e) {
        if (!document.body.classList.contains('layout')) return;
        
        const element = this.getGridElement(e.target);
        if (element && this.isInModularGrid(element)) {
            e.preventDefault();
            e.stopPropagation();
            this.selectElement(element);
        }
    }

    // Détection d'éléments data-grid dans le DOM
    getGridElement(target) {
        return target && target.closest ? target.closest('[data-grid]') : null;
    }

    // Vérifie si l'élément est dans une grille modulaire
    isInModularGrid(element) {
        return element && element.closest('.modularGrid') !== null;
    }

    // === GESTION DU SURVOL ET SÉLECTION ===

    handleMouseEnter(e) {
        if (this.state.isResizing || !document.body.classList.contains('layout')) return;
        if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
        
        const element = this.getGridElement(e.target);
        if (element && this.isInModularGrid(element) && element !== this.state.hoveredElement) {
            this.setHoveredElement(element);
        }
    }

    handleMouseLeave(e) {
        if (this.state.isResizing) return;
        if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
        
        const element = this.getGridElement(e.target);
        if (!element || element !== this.state.hoveredElement) return;
        
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !element.contains(relatedTarget)) {
            setTimeout(() => {
                // Nettoyage sécurisé avec vérifications multiples
                if (this.state.hoveredElement && 
                    this.state.hoveredElement === element && 
                    element.isConnected && 
                    !element.matches(':hover')) {
                    this.clearHover();
                }
            }, 100);
        }
    }

    handleMouseOver(e) {
        const element = this.getGridElement(e.target);
        if (!element || !this.isInModularGrid(element)) return;

        if (!element.classList.contains('selected')) {
            element.classList.add('hover');
        }
        this.selectElement(element);

        // Sélection avec Shift+survol
        if (e.shiftKey || true) {
            this.selectElement(element);
        }
    }

    handleMouseOut(e) {
        const element = this.getGridElement(e.target);
        if (element) {
            element.classList.remove('hover');
        }
    }

    // Active l'état "survolé" pour un élément
    setHoveredElement(element) {
        if (this.state.hoveredElement && this.state.hoveredElement !== element) {
            this.cleanupElement(this.state.hoveredElement);
        }
        
        this.state.hoveredElement = element;
        element.classList.add('resizable');
        this.addMoveButton(element);
    }

    // Nettoie l'état de survol
    clearHover() {
        if (this.state.hoveredElement) {
            this.cleanupElement(this.state.hoveredElement);
            this.state.hoveredElement = null;
        }
    }

    // Sélectionne un élément pour édition
    selectElement(element) {
        // Désélectionner les autres éléments de la section
        const section = element.closest('section');
        if (section) {
            section.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        }

        element.classList.remove('hover');
        element.classList.add('selected');
        this.state.selectedElement = element;

        // Met à jour l'interface utilisateur
        this.updateUI(element);
        // Génère le code sans copie automatique
        this.generateCode(element, false);
    }

    // === SYSTÈME DE REDIMENSIONNEMENT ===

    handleMouseMove(e) {
        if (this.state.isResizing) {
            this.handleResizeMove(e);
            return;
        }

        if (this.state.isDragging) {
            this.handleImageDragMove(e);
            return;
        }

        // Met à jour le curseur selon la zone de survol
        if (this.state.hoveredElement) {
            this.updateCursor(this.state.hoveredElement, e.clientX, e.clientY);
        }
    }

    handleMouseDown(e) {
        if (!document.body.classList.contains('layout')) return;

        // Gestion du drag d'image avec Shift
        if (e.shiftKey) {
            const img = this.findImageElement(e.target);
            if (img) {
                this.startImageDrag(img, e);
                return;
            }
        }

        if (this.state.isResizing) return;

        let resizeMode = null;
        let targetElement = null;

        // Détection du mode de redimensionnement
        if (e.target.classList.contains('move-button')) {
            resizeMode = 'move';
            targetElement = this.getGridElement(e.target);
        } else if (this.state.hoveredElement) {
            const zone = this.getInteractionZone(this.state.hoveredElement, e.clientX, e.clientY);
            if (zone) {
                resizeMode = zone;
                targetElement = this.state.hoveredElement;
            }
        }

        if (resizeMode && targetElement && this.isInModularGrid(targetElement)) {
            e.preventDefault();
            e.stopPropagation();
            this.startResize(targetElement, resizeMode, e);
        }
    }

    handleMouseUp(e) {
        if (this.state.isResizing) {
            this.endResize();
        }
        
        if (this.state.isDragging) {
            this.endImageDrag();
        }
    }

    // Démarre le redimensionnement d'un élément
    startResize(element, mode, e) {
        this.state.isResizing = true;
        this.state.resizeMode = mode;
        this.state.currentElement = element;
        this.state.startX = e.clientX;
        this.state.startY = e.clientY;

        // Sauvegarde des valeurs initiales
        this.state.startValues = {
            width: parseInt(element.style.getPropertyValue('--print-width')) || 6,
            height: parseInt(element.style.getPropertyValue('--print-height')) || 3,
            col: parseInt(element.style.getPropertyValue('--print-col')) || 1,
            row: parseInt(element.style.getPropertyValue('--print-row')) || 1
        };

        this.ensureGridProperties(element);
        
        // États visuels pendant le redimensionnement
        document.body.classList.add('grid-resizing');
        element.classList.add('resizing', 'resizable');
        element.dataset.resizeMode = mode;
    }

    // Gère le mouvement pendant le redimensionnement
    handleResizeMove(e) {
        if (!this.state.isResizing || !this.state.currentElement) return;

        e.preventDefault();
        
        const deltaX = e.clientX - this.state.startX;
        const deltaY = e.clientY - this.state.startY;
        
        const newValues = this.calculateNewValues(deltaX, deltaY);
        this.applyGridChanges(newValues);
    }

    // Termine le redimensionnement
    endResize() {
        if (!this.state.isResizing) return;

        const element = this.state.currentElement;
        
        document.body.classList.remove('grid-resizing');
        if (element) {
            element.classList.remove('resizing');
            element.style.cursor = 'default';
            element.dataset.resizeMode = 'hover';
            
            // Génère le code avec copie automatique (action explicite)
            this.generateCode(element, true);
            
            setTimeout(() => {
                if (element && !element.matches(':hover')) {
                    this.cleanupElement(element);
                }
            }, 300);
        }

        // Reset de l'état
        this.state.isResizing = false;
        this.state.currentElement = null;
        this.state.resizeMode = null;
    }

    // Calcule les nouvelles valeurs de grille selon le mode de redimensionnement
    calculateNewValues(deltaX, deltaY) {
        const container = this.state.currentElement.parentElement;
        const modularGrid = this.state.currentElement.closest('.modularGrid');
        const gridConfig = this.getGridConfig(modularGrid);
        
        const { deltaCol, deltaRow } = this.convertPixelsToGrid(deltaX, deltaY, container, gridConfig);
        
        let newValues = { ...this.state.startValues };

        // Logique de redimensionnement selon le mode
        switch (this.state.resizeMode) {
            case 'move':
                newValues.col = this.state.startValues.col + deltaCol;
                newValues.row = this.state.startValues.row + deltaRow;
                break;
            case 'n-resize':
                newValues.height = this.state.startValues.height - deltaRow;
                newValues.row = this.state.startValues.row + deltaRow;
                break;
            case 's-resize':
                newValues.height = this.state.startValues.height + deltaRow;
                break;
            case 'e-resize':
                newValues.width = this.state.startValues.width + deltaCol;
                break;
            case 'w-resize':
                newValues.width = this.state.startValues.width - deltaCol;
                newValues.col = this.state.startValues.col + deltaCol;
                break;
            case 'ne-resize':
                newValues.height = this.state.startValues.height - deltaRow;
                newValues.row = this.state.startValues.row + deltaRow;
                newValues.width = this.state.startValues.width + deltaCol;
                break;
            case 'nw-resize':
                newValues.height = this.state.startValues.height - deltaRow;
                newValues.row = this.state.startValues.row + deltaRow;
                newValues.width = this.state.startValues.width - deltaCol;
                newValues.col = this.state.startValues.col + deltaCol;
                break;
            case 'se-resize':
                newValues.height = this.state.startValues.height + deltaRow;
                newValues.width = this.state.startValues.width + deltaCol;
                break;
            case 'sw-resize':
                newValues.height = this.state.startValues.height + deltaRow;
                newValues.width = this.state.startValues.width - deltaCol;
                newValues.col = this.state.startValues.col + deltaCol;
                break;
        }

        return this.validateGridValues(newValues, gridConfig);
    }

    // Applique les changements de grille à l'élément
    applyGridChanges(values) {
        const { col, row, width, height } = values;
        const element = this.state.currentElement;

        const updates = this.state.resizeMode === 'move' 
            ? [['--print-col', col], ['--print-row', row]]
            : [
                ['--print-col', col],
                ['--print-row', row], 
                ['--print-width', width],
                ['--print-height', height]
            ];

        // Applique les propriétés CSS
        updates.forEach(([prop, value]) => {
            element.style.setProperty(prop, value);
        });

        // Synchronise la figcaption si elle existe
        const figcaption = element.nextElementSibling;
        if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
            updates.forEach(([prop, value]) => {
                figcaption.style.setProperty(prop, value);
            });
        }
    }

    // === MANIPULATION D'IMAGES ===

    // Trouve l'élément image dans la hiérarchie DOM
    findImageElement(target) {
        if (target.tagName?.toLowerCase() === 'img') {
            return target;
        }
        
        const container = target.closest('[data-grid="image"]');
        return container ? container.querySelector('img') : null;
    }

    // Démarre le drag d'une image
    startImageDrag(img, e) {
        const element = img.closest('[data-grid="image"]');
        if (!element) return;

        this.state.isDragging = true;
        this.state.currentImage = img;
        this.state.prevX = e.clientX;
        this.state.prevY = e.clientY;
        img.style.cursor = 'grab';

        e.preventDefault();
    }

    // Gère le mouvement pendant le drag d'image
    handleImageDragMove(e) {
        if (!this.state.isDragging || !this.state.currentImage || !e.shiftKey) return;

        e.preventDefault();

        const deltaX = e.clientX - this.state.prevX;
        const deltaY = e.clientY - this.state.prevY;

        this.translateImage(deltaX, deltaY);

        this.state.prevX = e.clientX;
        this.state.prevY = e.clientY;
    }

    // Termine le drag d'image
    endImageDrag() {
        if (!this.state.isDragging) return;

        this.state.isDragging = false;
        if (this.state.currentImage) {
            this.state.currentImage.style.cursor = 'default';
            const element = this.state.currentImage.closest('[data-grid="image"]');
            if (element) {
                // Action explicite → copie automatique
                this.generateCode(element, true);
            }
        }
        this.state.currentImage = null;
    }

    // Déplace une image dans son conteneur
    translateImage(deltaX, deltaY) {
        if (!this.state.currentImage) return;

        const parent = this.state.currentImage.parentElement;
        if (!parent) return;

        const parentWidth = parent.offsetWidth;
        const parentHeight = parent.offsetHeight;

        const currentX = parseFloat(getComputedStyle(parent).getPropertyValue('--img-x')) || 0;
        const currentY = parseFloat(getComputedStyle(parent).getPropertyValue('--img-y')) || 0;

        const newX = currentX + (deltaX / parentWidth) * 100;
        const newY = currentY + (deltaY / parentHeight) * 100;

        this.setCSSProperties(parent, {
            'img-x': newX,
            'img-y': newY
        });
    }

    // Gère le zoom avec la molette (Shift + molette)
    handleWheel(e) {
        if (!e.shiftKey || !e.target.tagName || e.target.tagName.toLowerCase() !== 'img') return;

        const element = e.target.closest('[data-grid="image"]');
        if (!element) return;

        e.preventDefault();

        const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
        const scaleAmount = 1.0 + (delta * 5) / 90.0;

        this.zoomImage(e.target, scaleAmount, e.layerX / e.target.width, e.layerY / e.target.height);

        // Curseur temporaire selon le sens du zoom
        e.target.style.cursor = delta > 0 ? 'zoom-in' : 'zoom-out';

        clearTimeout(this.resetCursorTimeout);
        this.resetCursorTimeout = setTimeout(() => {
            e.target.style.cursor = '';
            this.generateCode(element, true);
        }, 300);
    }

    // Redimensionne une image avec point focal
    zoomImage(img, scaleAmount, relX, relY) {
        const parent = img.parentElement;
        const oldWidth = img.offsetWidth;
        const oldHeight = img.offsetHeight;

        let newWidth = scaleAmount * oldWidth;
        newWidth = Math.max(100, Math.min(10000, newWidth));

        const resizeFract = (newWidth - oldWidth) / oldWidth;
        const parentWidth = parent.offsetWidth;
        const parentHeight = parent.offsetHeight;

        const newWidthPercentage = (newWidth / parentWidth) * 100;
        const newLeftPercentage = ((-oldWidth * resizeFract * relX + img.offsetLeft) / parentWidth) * 100;
        const newTopPercentage = ((-oldHeight * resizeFract * relY + img.offsetTop) / parentHeight) * 100;

        this.setCSSProperties(parent, {
            'img-w': newWidthPercentage,
            'img-x': newLeftPercentage,
            'img-y': newTopPercentage
        });
    }

    // Gère les raccourcis clavier
    handleKeyDown(e) {
        if (e.key === 'Shift' && !this.state.isShiftPressed) {
            this.state.isShiftPressed = true;
            this.toggleMoveButtons(false);
        }

        if (!e.shiftKey || !this.state.selectedElement) return;

        const element = this.state.selectedElement;
        const img = this.findImageElement(element);

        // Déplacement d'image avec les flèches
        const moves = {
            ArrowUp: [0, -2],
            ArrowDown: [0, 2],
            ArrowLeft: [-2, 0],
            ArrowRight: [2, 0]
        };

        const move = moves[e.key];
        if (move && img) {
            e.preventDefault();
            this.state.currentImage = img;
            this.translateImage(...move);
            this.generateCode(element, true);
            return;
        }

        // Zoom d'image avec +/-
        const zoomActions = {
            'Equal': 1.005,
            'Minus': 0.995,
            'NumpadAdd': 1.005,
            'NumpadSubtract': 0.995
        };

        const zoomScale = zoomActions[e.code];
        if (zoomScale && img) {
            e.preventDefault();
            this.zoomImage(img, zoomScale, 0.5, 0.5);
            
            img.style.cursor = zoomScale > 1 ? 'zoom-in' : 'zoom-out';
            clearTimeout(this.resetCursorTimeout);
            this.resetCursorTimeout = setTimeout(() => {
                img.style.cursor = '';
                this.generateCode(element, true);
            }, 300);
        }
    }

    handleKeyUp(e) {
        if (e.key === 'Shift' && this.state.isShiftPressed) {
            this.state.isShiftPressed = false;
            this.toggleMoveButtons(true);
        }
    }

    // === INTERFACE UTILISATEUR ===

    // Configure les contrôles du panneau (grille 9 points, propriétés, actions)
    setupPanelControls() {
        // Grille 9 points pour positionnement d'images
        this.positions.forEach(pos => {
            const element = document.querySelector(`#${pos.id}`);
            if (element) {
                element.onclick = () => this.positionImage(pos.x, pos.y);
            }
        });

        // Inputs de propriétés CSS
        const properties = [
            { id: '#col', property: '--col' },
            { id: '#width', property: '--width' },
            { id: '#printcol', property: '--print-col' },
            { id: '#printwidth', property: '--print-width' },
            { id: '#printrow', property: '--print-row' },
            { id: '#printheight', property: '--print-height' },
            { id: '#alignself', property: '--align-self' },
            { id: '#figcaption_arrow', property: '--figcaption_arrow' }
        ];

        properties.forEach(prop => {
            const element = document.querySelector(prop.id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);

                newElement.addEventListener('change', e => {
                    if (this.state.selectedElement) {
                        const propName = prop.property.replace('--', '');
                        this.setCSSProperties(this.state.selectedElement, {
                            [propName]: e.target.value
                        });
                        this.generateCode(this.state.selectedElement);
                    }
                });
            }
        });

        // Boutons d'action pour les images
        const fillBlock = document.querySelector('#remplir_bloc');
        const adjustContent = document.querySelector('#ajuster_contenu');

        if (fillBlock) fillBlock.onclick = () => this.fillBlock();
        if (adjustContent) adjustContent.onclick = () => this.adjustContent();
    }

    // Positionne une image selon la grille 9 points
    positionImage(alignX, alignY) {
        if (!this.state.selectedElement || this.state.selectedElement.dataset.grid !== 'image') return;

        const img = this.findImageElement(this.state.selectedElement);
        if (!img) return;

        const parentWidth = this.state.selectedElement.offsetWidth;
        const parentHeight = this.state.selectedElement.offsetHeight;
        const imgWidth = img.offsetWidth;
        const imgHeight = img.offsetHeight;

        const imgX = (((parentWidth - imgWidth) * alignX) / parentWidth) * 100;
        const imgY = (((parentHeight - imgHeight) * alignY) / parentHeight) * 100;

        this.setCSSProperties(this.state.selectedElement, {
            'img-x': imgX,
            'img-y': imgY
        });

        this.generateCode(this.state.selectedElement, true);
    }

    // Fait occuper toute la largeur du bloc à l'image
    fillBlock() {
        if (!this.state.selectedElement || this.state.selectedElement.dataset.grid !== 'image') return;

        this.setCSSProperties(this.state.selectedElement, { 'img-w': 100 });
        this.positionImage(0.5, 0.5);
    }

    // Ajuste l'image selon son ratio naturel
    adjustContent() {
        if (!this.state.selectedElement || this.state.selectedElement.dataset.grid !== 'image') return;

        const img = this.findImageElement(this.state.selectedElement);
        if (!img || !img.naturalWidth || !img.naturalHeight) return;

        const parentWidth = this.state.selectedElement.offsetWidth;
        const parentHeight = this.state.selectedElement.offsetHeight;
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        const newWidth = aspectRatio * parentHeight;
        const imgW = (newWidth / parentWidth) * 100;

        const imgWidth = (parentWidth * imgW) / 100;
        const imgX = ((parentWidth - imgWidth) / 2 / parentWidth) * 100;

        this.setCSSProperties(this.state.selectedElement, {
            'img-w': imgW,
            'img-y': 0,
            'img-x': imgX
        });

        this.generateCode(this.state.selectedElement, true);
    }

    // Met à jour l'interface utilisateur selon l'élément sélectionné
    updateUI(element) {
        const label = document.querySelector('#label_rd1');
        const position = document.querySelector('#position');
        
        if (element) {
            const cssProperties = this.getCSSProperties(element);
            const elementId = element.getAttribute('data-id') || element.id || '0';
            const type = element.dataset.grid;

            // Met à jour les inputs
            Object.entries(cssProperties).forEach(([key, value]) => {
                const input = document.querySelector(`#${key}`);
                if (input) {
                    if (input.tagName === 'SELECT') {
                        input.value = value || input.options[0].value;
                    } else {
                        input.value = Number(value) || 0;
                    }
                }
            });

            // Met à jour les labels
            if (label) label.setAttribute('data-name', `${elementId}`);
            if (position) position.setAttribute('data-shortcode', type);
        } else {
            // Cas null - vide les informations
            if (label) label.setAttribute('data-name', '');
            if (position) position.setAttribute('data-shortcode', '');
        }
    }

    // === GÉNÉRATION DE CODE ===

    // Génère le shortcode selon le type d'élément
    generateCode(element, shouldCopy = false) {
        if (!element) return '';

        const type = element.dataset.grid;
        let code = '';

        switch (type) {
            case 'markdown':
                code = this.generateMarkdownCode(element);
                break;
            case 'image':
                code = this.generateImageCode(element);
                break;
            default:
                code = this.generateContentCode(element);
        }

//         this.displayCode(code);

        if (shouldCopy) {
            this.copyToClipboard(code);
        }

        return code;
    }

    // Génère le shortcode pour les zones d'insertion
    generateMarkdownCode(element) {
    const classes = this.getCleanClasses(element);
    const properties = this.buildPropertiesObject(element);
    const markdown = element.getAttribute('data-md') || '';

    if (classes) {
        properties.class = `"${classes}"`;
    }

    const propertiesStr = this.formatPropertiesObject(properties);
    return `{% markdown "${markdown}", ${propertiesStr} %}`;
    }

    // Génère le shortcode pour les images
    generateImageCode(element) {
        const img = element.querySelector('img');
        const url = img ? this.getRelativePath(img.src) : '';
        const classes = this.getCleanClasses(element);
        const caption = this.getCaption(element);
        const properties = this.buildPropertiesObject(element);

        if (caption) {
            properties.caption = `"${this.escapeQuotes(caption)}"`;
        }

        if (classes) {
            properties.class = `"${classes}"`;
        }

        const propertiesStr = this.formatPropertiesObject(properties);
        return `{% grid "${url}", ${propertiesStr} %}`;
    }

    // Génère le shortcode pour le contenu
    generateContentCode(element) {
        const classes = this.getCleanClasses(element);
        const properties = this.buildPropertiesObject(element);

        if (classes) {
            properties.class = `"${classes}"`;
        }

        const propertiesStr = this.formatPropertiesObject(properties);
        return `{% resize ${propertiesStr} %}`;
    }

    // Construit l'objet des propriétés CSS à exporter
    buildPropertiesObject(element) {
    const cssVarMapping = {
        col: '--col',
        printCol: '--print-col',
        width: '--width',
        printWidth: '--print-width',
        printRow: '--print-row',
        printHeight: '--print-height',
        alignSelf: '--align-self',
        imgX: '--img-x',
        imgY: '--img-y',
        imgW: '--img-w'
    };

    const properties = {};

    Object.entries(cssVarMapping).forEach(([key, cssVar]) => {
        const value = element.style.getPropertyValue(cssVar);
        if (value && value.trim()) {
        if (key === 'alignSelf') {
            properties[key] = `"${value.trim()}"`; // Ajoute les guillemets
        } else {
            properties[key] = parseFloat(value.trim()) || value.trim();
        }
        }
    });

    return properties;
    }

    // Formate l'objet des propriétés en syntaxe readable
    formatPropertiesObject(properties) {
        if (Object.keys(properties).length === 0) return '{}';

        const entries = Object.entries(properties).map(([key, value]) => {
            return `  ${key}: ${value}`;
        });

        return `{ \n${entries.join(',\n')}\n}`;
    }

    // Affiche le code généré dans l'interface
    // displayCode(code) {
    //     const showCode = document.querySelector('#showCode');
    //     const cssOutput = document.querySelector('.cssoutput');

    //     if (showCode) showCode.value = code;
    //     if (cssOutput) cssOutput.textContent = code;
    // }

    // === UTILITAIRES ===

    // Ajoute le bouton de déplacement à un élément
    addMoveButton(element) {
        const existingButton = element.querySelector('.move-button');
        if (existingButton) existingButton.remove();

        const moveButton = document.createElement('div');
        moveButton.className = 'move-button';
        moveButton.dataset.mode = 'move';
        moveButton.title = 'Déplacer dans la grille';
        element.appendChild(moveButton);

        // Cache le bouton si Shift est pressé
        if (this.state.isShiftPressed) {
            moveButton.style.display = 'none';
        }
    }

    // Contrôle la visibilité des boutons de déplacement
    toggleMoveButtons(show) {
        document.querySelectorAll('.move-button').forEach(button => {
            button.style.display = show ? 'flex' : 'none';
        });
    }

    // Met à jour le curseur selon la zone de survol
    updateCursor(element, clientX, clientY) {
        const zone = this.getInteractionZone(element, clientX, clientY);
        const cursor = this.getCursorForZone(zone);

        element.style.cursor = cursor;
        element.style.setProperty('cursor', cursor, 'important');
        element.dataset.resizeMode = zone || 'hover';
    }

    // Détermine la zone d'interaction (coin, bord, centre)
    getInteractionZone(element, clientX, clientY) {
        const rect = element.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Zones étendues (débordent à l'extérieur et à l'intérieur)
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

    // Retourne le curseur approprié pour une zone
    getCursorForZone(zone) {
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

    // S'assure que les propriétés de grille sont définies
    ensureGridProperties(element) {
        const props = [
            ['--print-col', this.state.startValues.col],
            ['--print-row', this.state.startValues.row],
            ['--print-width', this.state.startValues.width],
            ['--print-height', this.state.startValues.height]
        ];

        props.forEach(([prop, value]) => {
            if (!element.style.getPropertyValue(prop)) {
                element.style.setProperty(prop, value);
            }
        });
    }

    // Récupère la configuration de la grille (colonnes/lignes)
    getGridConfig(section) {
        if (!section) return { cols: 12, rows: 10 };

        const computedStyle = getComputedStyle(section);
        const cols = parseInt(computedStyle.getPropertyValue('--grid-col').trim()) || 12;
        const rows = parseInt(computedStyle.getPropertyValue('--grid-row').trim()) || 10;

        return { cols, rows };
    }

    // Convertit les pixels en unités de grille
    convertPixelsToGrid(deltaX, deltaY, container, gridConfig) {
        const gridStepX = container.offsetWidth / gridConfig.cols;
        const gridStepY = container.offsetHeight / gridConfig.rows;

        return {
            deltaCol: Math.round(deltaX / gridStepX),
            deltaRow: Math.round(deltaY / gridStepY)
        };
    }

    // Valide et corrige les valeurs de grille
    validateGridValues(values, gridConfig) {
        const { col, row, width, height } = values;
        
        return {
            col: Math.max(1, Math.min(gridConfig.cols, col)),
            row: Math.max(1, Math.min(gridConfig.rows, row)),
            width: Math.max(1, Math.min(gridConfig.cols - col + 1, width)),
            height: Math.max(1, Math.min(gridConfig.rows - row + 1, height))
        };
    }

    // Définit plusieurs propriétés CSS en une fois
    setCSSProperties(element, properties) {
        Object.entries(properties).forEach(([prop, value]) => {
            if (value !== null && value !== undefined) {
                element.style.setProperty(`--${prop}`, value);
            }
        });
    }

    // Récupère les propriétés CSS d'un élément
    getCSSProperties(element) {
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

    // Récupère les classes CSS utiles (sans les classes techniques)
    getCleanClasses(element) {
        const exclude = ['selected', 'hover', 'cursor', 'resizable', 'resizing'];
        return Array.from(element.classList)
            .filter(cls => !exclude.includes(cls))
            .join(' ')
            .trim();
    }

    // Convertit une URL absolue en chemin relatif
    getRelativePath(url) {
        try {
            const urlObj = new URL(url);
            let path = urlObj.pathname + urlObj.search + urlObj.hash;
            return path.startsWith('/') ? path.substring(1) : path;
        } catch {
            return url;
        }
    }

    // Extrait l'ID numérique d'un élément
    getImageId(element) {
        const dataId = element.getAttribute('data-id');
        if (!dataId) return '0';
        
        const match = dataId.match(/\d+$/);
        return match ? match[0] : '0';
    }

    // la légende d'une image

    getCaption(element) {
        // Cherche d'abord figcaption
        let figcaption = element.nextElementSibling;
        if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
            const clone = figcaption.cloneNode(true);
            const toRemove = clone.querySelectorAll('.figure_call_back, .figure_reference');
            toRemove.forEach(el => el.remove());
            
            if (this.turndownService) {
                try {
                    return this.turndownService.turndown(clone.innerHTML);
                } catch (error) {
                    console.warn('Erreur Turndown:', error);
                }
            }
        }
        
        // Fallback sur img.alt
        const img = element.querySelector('img');
        if (img && img.alt) {
            return img.alt;
        }
        
        return '';
    }



    
    escapeQuotes(str) {
        return str.replace(/"/g, '\\"');
    }

    // Copie du texte vers le presse-papiers 
    async copyToClipboard(text) {
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

    // Nettoie un élément de ses états temporaires
    cleanupElement(element) {
        element.classList.remove('resizable', 'resizing', 'selected', 'hover');
        element.style.cursor = 'default';
        delete element.dataset.resizeMode;

        const moveButton = element.querySelector('.move-button');
        if (moveButton) moveButton.remove();
    }

    // === ACTIVATION/DÉSACTIVATION DU MODE LAYOUT ===

    // Configure le toggle pour activer/désactiver le mode layout
    initializeLayoutToggle() {
        if (this.toggleHandler) return;

        let body = cssPageWeaver?.ui?.body || document.body;
        let toggleInput = cssPageWeaver?.ui?.layout?.toggleInput;
        
        // Recherche du toggle dans le DOM si non fourni
        if (!toggleInput) {
            const selectors = [
                'input[data-plugin="layout"]',
                '#layout-toggle',
                'input[name="layout"]',
                '.layout-toggle input',
                '[data-toggle="layout"]'
            ];
            
            for (const selector of selectors) {
                toggleInput = document.querySelector(selector);
                if (toggleInput) break;
            }
            
            if (!toggleInput) return;
        }

        // Récupère la préférence sauvegardée
        const preference = localStorage.getItem('layout') === 'true';
        
        body.classList.toggle('layout', preference);
        toggleInput.checked = preference;

        // Gestionnaire de changement d'état
        this.toggleHandler = (e) => {
            const isEnabled = e.target.checked;
            body.classList.toggle("layout", isEnabled);
            localStorage.setItem('layout', isEnabled);
        };
        
        toggleInput.addEventListener("input", this.toggleHandler);
    }

    // === NETTOYAGE ET DESTRUCTION ===

    // Nettoie toutes les ressources du plugin
    cleanup() {
        if (!this.isInitialized) return;

        try {
            // Supprime tous les event listeners
            document.removeEventListener('mouseenter', this.handleMouseEnter, { capture: true });
            document.removeEventListener('mouseleave', this.handleMouseLeave, { capture: true });
            document.removeEventListener('mouseover', this.handleMouseOver);
            document.removeEventListener('mouseout', this.handleMouseOut);
            document.removeEventListener('mousemove', this.handleMouseMove, true);
            document.removeEventListener('mousedown', this.handleMouseDown, true);
            document.removeEventListener('mouseup', this.handleMouseUp, true);
            document.removeEventListener('wheel', this.handleWheel, { passive: false });
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);

            document.removeEventListener('click', this.handleClick, true);

            // Nettoie les timeouts
            if (this.resetCursorTimeout) {
                clearTimeout(this.resetCursorTimeout);
            }

            // Nettoie les éléments du DOM
            if (this.state.hoveredElement) {
                this.cleanupElement(this.state.hoveredElement);
            }

            if (this.state.selectedElement) {
                this.state.selectedElement.classList.remove('selected');
            }

            document.querySelectorAll('.resizable, .resizing').forEach(element => {
                this.cleanupElement(element);
            });

            document.body.classList.remove('grid-resizing');

            // Nettoie le toggle
            if (this.toggleHandler && cssPageWeaver?.ui?.layout?.toggleInput) {
                cssPageWeaver.ui.layout.toggleInput.removeEventListener("input", this.toggleHandler);
                this.toggleHandler = null;
            }

            // Reset complet de l'état
            this.state = {
                selectedElement: null,
                hoveredElement: null,
                isResizing: false,
                isDragging: false,
                currentImage: null,
                resizeMode: null,
                startX: 0,
                startY: 0,
                startValues: {},
                isShiftPressed: false
            };

            this.isInitialized = false;
            
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage:', error);
        }
    }

    // Destruction complète du plugin
    destroy() {
        this.cleanup();
    }
}