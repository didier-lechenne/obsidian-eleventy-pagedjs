// imageHandler.js - Gestionnaire de manipulation d'images

import { 
    findImageElement, 
    getShortcodeType, 
    getCSSProperties, 
    setCSSProperties,
    getImageId,
    copyToClipboard,
    getGridConfig
} from './utils.js';

export class imageHandler {
    constructor() {
        this.selectedElement = null;
        this.isDragging = false;
        this.prevX = 0;
        this.prevY = 0;
        this.resetCursorTimeout = null;
        this.isInitialized = false;
        
        this.positions = [
            { id: 'top_left', x: 0, y: 0 },
            { id: 'top_middle', x: 0.5, y: 0 },
            { id: 'top_right', x: 1, y: 0 },
            { id: 'middle_left', x: 0, y: 0.5 },
            { id: 'middle_middle', x: 0.5, y: 0.5 },
            { id: 'middle_right', x: 1, y: 0.5 },
            { id: 'bottom_left', x: 0, y: 1 },
            { id: 'bottom_middle', x: 0.5, y: 1 },
            { id: 'bottom_right', x: 1, y: 1 }
        ];
    }

    initialize() {
        if (this.isInitialized) {
            this.cleanup();
        }

        this.setupEventListeners();
        this.setupPanelControls();
        this.isInitialized = true;
        console.log('✅ imageHandler: Manipulation d\'images activée');
    }

    setupEventListeners() {
        // Gestion de la sélection et survol
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
        
        // Gestion du drag & drop (Shift + drag)
        document.addEventListener('mousedown', this.handleDragStart.bind(this));
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        
        // Gestion du zoom (Shift + wheel)
        document.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Gestion des flèches (Shift + arrows)
        document.addEventListener('keydown', this.handleArrowKeys.bind(this));
        
        // Événements personnalisés pour la génération de code
        document.addEventListener('gridResized', this.handleGridResized.bind(this));
    }

    setupPanelControls() {
        // Position controls (grille 3x3)
        this.positions.forEach(pos => {
            const element = document.querySelector(`#${pos.id}`);
            if (element) {
                element.onclick = () => this.positionImage(pos.x, pos.y);
            }
        });

        // Property controls
        const properties = [
            { id: '#col', property: '--col' },
            { id: '#width', property: '--width' },
            { id: '#printcol', property: '--print-col' },
            { id: '#printwidth', property: '--print-width' },
            { id: '#printrow', property: '--print-row' },
            { id: '#printheight', property: '--print-height' },
            { id: '#align_self', property: '--align-self' },
            { id: '#figcaption_arrow', property: '--figcaption_arrow' }
        ];

        properties.forEach(prop => {
            const element = document.querySelector(prop.id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                
                newElement.addEventListener('change', (e) => {
                    if (this.selectedElement) {
                        this.selectedElement.style.setProperty(prop.property, e.target.value);
                        this.generateCodeForElement(this.selectedElement);
                    }
                });
            }
        });

        // Action controls
        const fillBlock = document.querySelector("#remplir_bloc");
        const adjustContent = document.querySelector("#ajuster_contenu");

        if (fillBlock) {
            fillBlock.onclick = () => this.fillBlock();
        }
        if (adjustContent) {
            adjustContent.onclick = () => this.adjustContent();
        }
    }

    handleMouseOver(e) {
        const shortcodeInfo = getShortcodeType(e.target);
        if (!shortcodeInfo) return;

        const { parent, type } = shortcodeInfo;

        if (!parent.classList.contains('selected')) {
            parent.classList.add('hover');
        }

        if (e.shiftKey) {
            this.selectElement(parent, type);
        }
    }

    handleMouseOut(e) {
        const shortcodeInfo = getShortcodeType(e.target);
        if (shortcodeInfo) {
            shortcodeInfo.parent.classList.remove('hover');
        }
    }

    selectElement(parent, type) {
        // Désélectionner les autres éléments
        const section = parent.closest('section');
        if (section) {
            section.querySelectorAll('.selected').forEach(elem => {
                elem.classList.remove('selected');
            });
        }

        parent.classList.remove('hover');
        parent.classList.add('selected');
        this.selectedElement = parent;
        
        // Coche la checkbox si elle existe
        const checkbox = document.querySelector("#rd1");
        if (checkbox) checkbox.checked = true;

        // Met à jour la configuration de la grille
        this.updateGridConfig(section);

        // Met à jour l'interface
        const cssProps = getCSSProperties(parent);
        const imgId = getImageId(parent);
        const img = findImageElement(parent);
        
        this.updateUI(imgId, cssProps, img, type);
        
        // Génère le code
        this.generateCodeForElement(parent);
    }

    updateGridConfig(section) {
        if (!section) return;

        const gridConfig = getGridConfig(section);
        this.updateInputMaxValues(gridConfig);
    }

    updateInputMaxValues(gridConfig) {
        const inputs = [
            { id: '#col', max: gridConfig.cols },
            { id: '#width', max: gridConfig.cols },
            { id: '#printcol', max: gridConfig.cols },
            { id: '#printwidth', max: gridConfig.cols },
            { id: '#printrow', max: gridConfig.rows },
            { id: '#printheight', max: gridConfig.rows }
        ];

        inputs.forEach(input => {
            const element = document.querySelector(input.id);
            if (element) element.setAttribute('max', input.max);
        });
    }

    updateUI(imgId, cssProperties, img, shortcodeType) {
        // Met à jour les valeurs des inputs
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
        const label = document.querySelector("#label_rd1");
        if (label) label.setAttribute('data-name', `#${shortcodeType}_${imgId}`);
        
        const position = document.querySelector("#position");
        if (position) position.setAttribute('data-shortcode', shortcodeType);
    }

    // === MANIPULATION D'IMAGES ===

    handleDragStart(e) {
        if (!e.shiftKey) return;

        const img = findImageElement(e.target);
        if (!img) return;

        this.isDragging = true;
        this.currentImage = img;
        this.prevX = e.clientX;
        this.prevY = e.clientY;
        img.style.cursor = 'grab';
        
        e.preventDefault();
    }

    handleDragMove(e) {
        if (!this.isDragging || !this.currentImage || !e.shiftKey) return;

        e.preventDefault();
        
        const deltaX = e.clientX - this.prevX;
        const deltaY = e.clientY - this.prevY;
        
        this.translateImage(deltaX, deltaY);
        
        this.prevX = e.clientX;
        this.prevY = e.clientY;
    }

    handleDragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        if (this.currentImage) {
            this.currentImage.style.cursor = 'default';
            const parent = this.currentImage.closest('figure, .resize, .image');
            if (parent) {
                this.generateCodeForElement(parent);
            }
        }
        this.currentImage = null;
    }

    translateImage(deltaX, deltaY) {
        const parent = this.currentImage.parentElement;
        const parentWidth = parent.offsetWidth;
        const parentHeight = parent.offsetHeight;

        const currentX = parseFloat(getComputedStyle(parent).getPropertyValue("--img-x")) || 0;
        const currentY = parseFloat(getComputedStyle(parent).getPropertyValue("--img-y")) || 0;

        const newX = currentX + (deltaX / parentWidth * 100);
        const newY = currentY + (deltaY / parentHeight * 100);

        parent.style.setProperty("--img-x", newX);
        parent.style.setProperty("--img-y", newY);
    }

    handleWheel(e) {
        if (!e.shiftKey || !e.target.tagName || e.target.tagName.toLowerCase() !== 'img') return;

        e.preventDefault();
        
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        const scaleAmount = 1.0 + (delta * 5 / 90.0);
        
        this.zoomImage(e.target, scaleAmount, e.layerX / e.target.width, e.layerY / e.target.height);
        
        // Curseur de zoom temporaire
        e.target.style.cursor = delta > 0 ? 'zoom-in' : 'zoom-out';
        
        clearTimeout(this.resetCursorTimeout);
        this.resetCursorTimeout = setTimeout(() => {
            e.target.style.cursor = '';
            const parent = e.target.closest('figure, .resize, .image');
            if (parent) {
                this.generateCodeForElement(parent);
            }
        }, 300);
    }

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
        parent.style.setProperty("--img-w", newWidthPercentage);
        
        const newLeftPercentage = ((-oldWidth * resizeFract * relX) + img.offsetLeft) / parentWidth * 100;
        const newTopPercentage = ((-oldHeight * resizeFract * relY) + img.offsetTop) / parentHeight * 100;
        
        parent.style.setProperty("--img-x", newLeftPercentage);
        parent.style.setProperty("--img-y", newTopPercentage);
    }

    handleArrowKeys(e) {
        if (!e.shiftKey) return;

        const selectedElement = this.selectedElement;
        if (!selectedElement) return;

        const img = findImageElement(selectedElement);
        if (!img) return;

        const moves = {
            'ArrowUp': [0, -2],
            'ArrowDown': [0, 2],
            'ArrowLeft': [-2, 0],
            'ArrowRight': [2, 0]
        };
        
        const move = moves[e.key];
        if (move) {
            e.preventDefault();
            this.translateImage(...move);
            this.generateCodeForElement(selectedElement);
        }
    }

    // === CONTRÔLES PANEL ===

    positionImage(alignX, alignY) {
        if (!this.selectedElement) return;
        
        const img = findImageElement(this.selectedElement);
        if (!img) return;
        
        const parentWidth = this.selectedElement.offsetWidth;
        const parentHeight = this.selectedElement.offsetHeight;
        const imgWidth = img.offsetWidth;
        const imgHeight = img.offsetHeight;

        const imgX = (parentWidth - imgWidth) * alignX / parentWidth * 100;
        const imgY = (parentHeight - imgHeight) * alignY / parentHeight * 100;

        this.selectedElement.style.setProperty('--img-x', imgX);
        this.selectedElement.style.setProperty('--img-y', imgY);
        this.generateCodeForElement(this.selectedElement);
    }

    fillBlock() {
        if (!this.selectedElement) return;
        
        this.selectedElement.style.setProperty('--img-w', 100);
        this.positionImage(0.5, 0.5);
    }

    adjustContent() {
        if (!this.selectedElement) return;
        
        const img = findImageElement(this.selectedElement);
        if (!img || !img.naturalWidth || !img.naturalHeight) return;

        const parentWidth = this.selectedElement.offsetWidth;
        const parentHeight = this.selectedElement.offsetHeight;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        const newWidth = aspectRatio * parentHeight;
        const imgW = (newWidth / parentWidth) * 100;
        
        this.selectedElement.style.setProperty('--img-w', imgW);
        this.selectedElement.style.setProperty('--img-y', 0);
        
        // Centre horizontalement
        const imgWidth = (parentWidth * imgW / 100);
        const imgX = (parentWidth - imgWidth) / 2 / parentWidth * 100;
        this.selectedElement.style.setProperty('--img-x', imgX);
        
        this.generateCodeForElement(this.selectedElement);
    }

    // === GÉNÉRATION DE CODE ===

    handleGridResized(e) {
        this.generateCodeForElement(e.detail.element);
    }

    generateCodeForElement(element) {
        // Émettre un événement pour que CodeGenerator puisse écouter
        document.dispatchEvent(new CustomEvent('generateCode', {
            detail: { element, shouldCopy: true }
        }));
    }

    cleanup() {
        if (!this.isInitialized) return;

        // Supprimer les event listeners
        document.removeEventListener('mouseover', this.handleMouseOver);
        document.removeEventListener('mouseout', this.handleMouseOut);
        document.removeEventListener('mousedown', this.handleDragStart);
        document.removeEventListener('mousemove', this.handleDragMove);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.removeEventListener('wheel', this.handleWheel, { passive: false });
        document.removeEventListener('keydown', this.handleArrowKeys);
        document.removeEventListener('gridResized', this.handleGridResized);

        if (this.resetCursorTimeout) {
            clearTimeout(this.resetCursorTimeout);
        }

        // Nettoyer la sélection
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }

        this.isInitialized = false;
        console.log('🧹 imageHandler nettoyé');
    }

    destroy() {
        this.cleanup();
    }
}