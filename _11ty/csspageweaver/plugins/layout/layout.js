import { Handler } from "../../../lib/paged.esm.js";
import { TurndownService } from "./turndown.js";

// Configuration centralisée
const CONFIG = {
  ZONES: { edge: 20, corner: 25 },
  CURSORS: {
    'start-start': 'nw-resize',
    'start-end': 'ne-resize', 
    'end-start': 'sw-resize',
    'end-end': 'se-resize',
    'start-middle': 'n-resize',
    'end-middle': 's-resize',
    'middle-start': 'w-resize',
    'middle-end': 'e-resize',
    'move': 'move'
  },
  GRID_POSITIONS: [
    { id: "top_left", x: 0, y: 0 },
    { id: "top_middle", x: 0.5, y: 0 },
    { id: "top_right", x: 1, y: 0 },
    { id: "middle_left", x: 0, y: 0.5 },
    { id: "middle_middle", x: 0.5, y: 0.5 },
    { id: "middle_right", x: 1, y: 0.5 },
    { id: "bottom_left", x: 0, y: 1 },
    { id: "bottom_middle", x: 0.5, y: 1 },
    { id: "bottom_right", x: 1, y: 1 }
  ]
};

// Gestionnaire d'état centralisé
class LayoutState {
  constructor() {
    this.selectedElement = null;
    this.mode = 'idle'; // idle, resizing, dragging
    this.resizeData = null;
    this.isShiftPressed = false;
    // console.log('🏗️ LayoutState créé');
  }

  select(element) {
    this.deselect();
    this.selectedElement = element;
    element.classList.add('selected');
    // console.log('📌 Élément sélectionné:', element.dataset.grid);
    return element;
  }

  deselect() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected', 'resizable', 'hover');
      this.selectedElement.style.cursor = 'default';
      this.cleanupElement(this.selectedElement);
    }
    this.selectedElement = null;
  }

  startResize(element, mode, mousePos, startValues) {
    this.mode = 'resizing';
    this.resizeData = { element, mode, mousePos, startValues };
    document.body.classList.add('grid-resizing');
    element.classList.add('resizing');
    // console.log('🔧 Début redimensionnement:', mode);
  }

  endResize() {
    if (this.mode !== 'resizing' || !this.resizeData) return;
    
    document.body.classList.remove('grid-resizing');
    this.resizeData.element.classList.remove('resizing');
    this.mode = 'idle';
    this.resizeData = null;
    // console.log('✅ Fin redimensionnement');
  }

  startDrag(image) {
    this.mode = 'dragging';
    this.dragData = { image };
    image.style.cursor = 'grab';
    // console.log('🖱️ Début drag image');
  }

  endDrag() {
    if (this.mode !== 'dragging' || !this.dragData) return;
    
    this.dragData.image.style.cursor = 'default';
    this.mode = 'idle';
    this.dragData = null;
    // console.log('✅ Fin drag image');
  }

  cleanupElement(element) {
    element.classList.remove('resizable', 'resizing', 'selected', 'hover');
    element.style.cursor = 'default';
    delete element.dataset.resizeMode;
    
    const moveButton = element.querySelector('.move-button');
    if (moveButton) moveButton.remove();
  }
}

// Utilitaires DOM
class DOMUtils {
  static getGridElement(target) {
    if (!target || !target.closest) return null;
    
    // Cas spécial : figcaption → remonte au figure parent
    if (target.tagName?.toLowerCase() === 'figcaption' || target.classList.contains('figcaption')) {
      const figure = target.previousElementSibling;
      if (figure && figure.tagName?.toLowerCase() === 'figure' && figure.hasAttribute('data-grid')) {
        return figure;
      }
    }
    
    return target.closest('[data-grid]');
  }

  static isInModularGrid(element) {
    return element && element.closest('.modularGrid') !== null;
  }

  static getResizeZone(element, clientX, clientY) {
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const isNearLeft = x >= -CONFIG.ZONES.corner && x <= CONFIG.ZONES.corner;
    const isNearRight = x >= rect.width - CONFIG.ZONES.corner && x <= rect.width + CONFIG.ZONES.corner;
    const isNearTop = y >= -CONFIG.ZONES.corner && y <= CONFIG.ZONES.corner;
    const isNearBottom = y >= rect.height - CONFIG.ZONES.corner && y <= rect.height + CONFIG.ZONES.corner;

    const isEdgeLeft = x >= -CONFIG.ZONES.edge && x <= CONFIG.ZONES.edge;
    const isEdgeRight = x >= rect.width - CONFIG.ZONES.edge && x <= rect.width + CONFIG.ZONES.edge;
    const isEdgeTop = y >= -CONFIG.ZONES.edge && y <= CONFIG.ZONES.edge;
    const isEdgeBottom = y >= rect.height - CONFIG.ZONES.edge && y <= rect.height + CONFIG.ZONES.edge;

    // Coins
    if (isNearLeft && isNearTop) return 'start-start';
    if (isNearRight && isNearTop) return 'start-end';
    if (isNearLeft && isNearBottom) return 'end-start';
    if (isNearRight && isNearBottom) return 'end-end';

    // Bords
    if (isEdgeLeft) return 'middle-start';
    if (isEdgeRight) return 'middle-end';
    if (isEdgeTop) return 'start-middle';
    if (isEdgeBottom) return 'end-middle';

    return null;
  }

  static createMoveButton() {
    const button = document.createElement('div');
    button.className = 'move-button';
    button.dataset.mode = 'move';
    button.title = 'Déplacer dans la grille';
    return button;
  }
}

// Gestionnaire d'interactions unifié
class InteractionManager {
  constructor(state, resizeManager, onCodeGenerate = null) {
    this.state = state;
    this.resizeManager = resizeManager;
    this.onCodeGenerate = onCodeGenerate;
    // console.log('🎮 InteractionManager créé');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // console.log('📡 Configuration des event listeners');
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  handleClick(e) {
    if (!document.body.classList.contains('layout')) return;

    const element = DOMUtils.getGridElement(e.target);
    if (!element || !DOMUtils.isInModularGrid(element)) return;

    e.preventDefault();
    e.stopPropagation();
    // console.log('🖱️ Clic sur élément:', element.dataset.grid);
    this.selectElement(element);
  }

  handleMouseOver(e) {
    if (!document.body.classList.contains('layout')) return;

    const element = DOMUtils.getGridElement(e.target);
    if (!element || !DOMUtils.isInModularGrid(element)) return;

    if (this.shouldActivateElement(element, e)) {
      this.activateElement(element);
    }
  }

  handleMouseOut(e) {
    const element = DOMUtils.getGridElement(e.target);
    if (element && !element.classList.contains('selected')) {
      element.classList.remove('hover');
    }
  }

  handleMouseMove(e) {
    if (this.state.mode === 'resizing') {
      this.resizeManager.handleMove(e);
    } else if (this.state.mode === 'dragging') {
      this.handleImageDrag(e);
    } else {
      this.updateCursor(e);
    }
  }

  handleMouseDown(e) {
    if (!document.body.classList.contains('layout')) return;

    // Drag d'image avec Shift
    if (e.shiftKey && this.state.mode === 'idle') {
      const img = this.findImageElement(e.target);
      if (img) {
        this.state.startDrag(img);
        this.prevMousePos = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }
    }

    // Redimensionnement
    const element = DOMUtils.getGridElement(e.target);
    if (!element || !DOMUtils.isInModularGrid(element) || this.state.mode !== 'idle') return;

    let resizeMode = null;
    
    if (e.target.classList.contains('move-button')) {
      resizeMode = 'move';
    } else {
      resizeMode = DOMUtils.getResizeZone(element, e.clientX, e.clientY);
    }

    if (resizeMode) {
      e.preventDefault();
      e.stopPropagation();
      // console.log('🎯 Début redimensionnement mode:', resizeMode);
      this.resizeManager.start(element, resizeMode, { x: e.clientX, y: e.clientY });
    }
  }

  handleMouseUp(e) {
    if (this.state.mode === 'resizing') {
      this.resizeManager.end();
    } else if (this.state.mode === 'dragging') {
      this.state.endDrag();
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Shift' && !this.state.isShiftPressed) {
      this.state.isShiftPressed = true;
      this.toggleMoveButtons(false);
    }

    if (!e.shiftKey || !this.state.selectedElement) return;

    const element = this.state.selectedElement;
    const img = this.findImageElement(element);

    // Déplacement d'image avec flèches
    const moves = {
      ArrowUp: [0, -2],
      ArrowDown: [0, 2], 
      ArrowLeft: [-2, 0],
      ArrowRight: [2, 0]
    };

    const move = moves[e.key];
    if (move && img) {
      e.preventDefault();
      this.translateImage(img, ...move);
      // console.log('🔄 Déplacement image avec flèches, génération du code...');
      this.onCodeGenerate?.(element, true);
      return;
    }

    // Zoom d'image
    const zoomActions = {
      Equal: 1.005,
      Minus: 0.995,
      NumpadAdd: 1.005,
      NumpadSubtract: 0.995
    };

    const zoomScale = zoomActions[e.code];
    if (zoomScale && img) {
      e.preventDefault();
      this.zoomImage(img, zoomScale, 0.5, 0.5);
      // console.log('🔍 Zoom image, génération du code...');
      this.onCodeGenerate?.(element, true);
    }
  }

  handleKeyUp(e) {
    if (e.key === 'Shift' && this.state.isShiftPressed) {
      this.state.isShiftPressed = false;
      this.toggleMoveButtons(true);
    }
  }

  handleWheel(e) {
    if (!e.shiftKey || !e.target.tagName || e.target.tagName.toLowerCase() !== 'img') return;

    const element = e.target.closest('[data-grid="image"]');
    if (!element) return;

    e.preventDefault();
    const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    const scaleAmount = 1.0 + (delta * 5) / 90.0;

    this.zoomImage(e.target, scaleAmount, e.layerX / e.target.width, e.layerY / e.target.height);
    
    // console.log('🔍 Zoom avec molette, génération du code...');
    this.onCodeGenerate?.(element, true);
  }

  // Méthodes d'aide
  shouldActivateElement(element, event) {
    const isImage = element.dataset.grid === 'image';
    return isImage ? event.shiftKey : true;
  }

  activateElement(element) {
    if (!element.classList.contains('selected')) {
      element.classList.add('hover');
      this.selectElement(element);
    }
  }

  selectElement(element) {
    const selected = this.state.select(element);
    this.setupElementControls(selected);
    // Notifier le générateur de code
    this.onElementSelected?.(selected);
  }

  setupElementControls(element) {
    element.classList.add('resizable');
    const moveButton = DOMUtils.createMoveButton();
    element.appendChild(moveButton);
    
    if (this.state.isShiftPressed) {
      moveButton.style.display = 'none';
    }
  }

  updateCursor(e) {
    const element = DOMUtils.getGridElement(e.target);
    if (!element) return;

    const zone = DOMUtils.getResizeZone(element, e.clientX, e.clientY);
    const cursor = CONFIG.CURSORS[zone] || 'default';
    
    element.style.cursor = cursor;
    element.dataset.resizeMode = zone || 'hover';
  }

  toggleMoveButtons(show) {
    document.querySelectorAll('.move-button').forEach(button => {
      button.style.display = show ? 'flex' : 'none';
    });
  }

  findImageElement(target) {
    if (target.tagName?.toLowerCase() === 'img') return target;
    const container = target.closest('[data-grid="image"]');
    return container ? container.querySelector('img') : null;
  }

  handleImageDrag(e) {
    if (!this.state.dragData || !e.shiftKey) return;

    e.preventDefault();
    const deltaX = e.clientX - this.prevMousePos.x;
    const deltaY = e.clientY - this.prevMousePos.y;

    this.translateImage(this.state.dragData.image, deltaX, deltaY);
    this.prevMousePos = { x: e.clientX, y: e.clientY };
    
    const element = this.state.dragData.image.closest('[data-grid="image"]');
    if (element) {
      // console.log('🖱️ Drag image, génération du code...');
      this.onCodeGenerate?.(element, true);
    }
  }

  translateImage(img, deltaX, deltaY) {
    const parent = img.parentElement;
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

  setCSSProperties(element, properties) {
    Object.entries(properties).forEach(([prop, value]) => {
      if (value !== null && value !== undefined) {
        element.style.setProperty(`--${prop}`, value);
      }
    });
  }
}

// Gestionnaire de redimensionnement
class ResizeManager {
  constructor(state, onCodeGenerate = null) {
    this.state = state;
    this.onCodeGenerate = onCodeGenerate;
    // console.log('📏 ResizeManager créé');
  }

  start(element, mode, mousePos) {
    const startValues = this.getStartValues(element);
    this.state.startResize(element, mode, mousePos, startValues);
  }

  handleMove(e) {
    if (!this.state.resizeData) return;
    
    e.preventDefault();
    const { element, mode, mousePos, startValues } = this.state.resizeData;
    
    const deltaX = e.clientX - mousePos.x;
    const deltaY = e.clientY - mousePos.y;
    
    const newValues = this.calculateNewValues(element, mode, deltaX, deltaY, startValues);
    this.applyGridChanges(element, newValues);
  }

  end() {
    if (this.state.resizeData) {
      // console.log('📐 Fin de redimensionnement, génération du code...');
      const element = this.state.resizeData.element;
      this.state.endResize();
      this.onCodeGenerate?.(element, true);
    }
  }

  getStartValues(element) {
    return {
      width: parseInt(element.style.getPropertyValue('--print-width')) || 6,
      height: parseInt(element.style.getPropertyValue('--print-height')) || 3,
      col: parseInt(element.style.getPropertyValue('--print-col')) || 1,
      row: parseInt(element.style.getPropertyValue('--print-row')) || 1
    };
  }

  calculateNewValues(element, mode, deltaX, deltaY, startValues) {
    const container = element.parentElement;
    const modularGrid = element.closest('.modularGrid');
    const gridConfig = this.getGridConfig(modularGrid);
    
    const { deltaCol, deltaRow } = this.convertPixelsToGrid(deltaX, deltaY, container, gridConfig);
    
    let newValues = { ...startValues };

    switch (mode) {
      case 'move':
        newValues.col = startValues.col + deltaCol;
        newValues.row = startValues.row + deltaRow;
        break;
      case 'start-middle':
        newValues.height = startValues.height - deltaRow;
        newValues.row = startValues.row + deltaRow;
        break;
      case 'end-middle':
        newValues.height = startValues.height + deltaRow;
        break;
      case 'middle-end':
        newValues.width = startValues.width + deltaCol;
        break;
      case 'middle-start':
        newValues.width = startValues.width - deltaCol;
        newValues.col = startValues.col + deltaCol;
        break;
      case 'start-end':
        newValues.height = startValues.height - deltaRow;
        newValues.row = startValues.row + deltaRow;
        newValues.width = startValues.width + deltaCol;
        break;
      case 'start-start':
        newValues.height = startValues.height - deltaRow;
        newValues.row = startValues.row + deltaRow;
        newValues.width = startValues.width - deltaCol;
        newValues.col = startValues.col + deltaCol;
        break;
      case 'end-end':
        newValues.height = startValues.height + deltaRow;
        newValues.width = startValues.width + deltaCol;
        break;
      case 'end-start':
        newValues.height = startValues.height + deltaRow;
        newValues.width = startValues.width - deltaCol;
        newValues.col = startValues.col + deltaCol;
        break;
    }

    return this.validateGridValues(newValues, gridConfig);
  }

  applyGridChanges(element, values) {
    const { col, row, width, height } = values;
    
    const updates = [
      ['--print-col', col],
      ['--print-row', row],
      ['--print-width', width],
      ['--print-height', height]
    ];

    updates.forEach(([prop, value]) => {
      element.style.setProperty(prop, value);
    });

    // Synchronise la figcaption
    const figcaption = element.nextElementSibling;
    if (figcaption && figcaption.tagName.toLowerCase() === 'figcaption') {
      updates.forEach(([prop, value]) => {
        figcaption.style.setProperty(prop, value);
      });
    }
  }

  getGridConfig(section) {
    if (!section) return { cols: 12, rows: 10 };

    const computedStyle = getComputedStyle(section);
    const cols = parseInt(computedStyle.getPropertyValue('--grid-col').trim()) || 12;
    const rows = parseInt(computedStyle.getPropertyValue('--grid-row').trim()) || 10;

    return { cols, rows };
  }

  convertPixelsToGrid(deltaX, deltaY, container, gridConfig) {
    const gridStepX = container.offsetWidth / gridConfig.cols;
    const gridStepY = container.offsetHeight / gridConfig.rows;

    return {
      deltaCol: Math.round(deltaX / gridStepX),
      deltaRow: Math.round(deltaY / gridStepY)
    };
  }

  validateGridValues(values, gridConfig) {
    const { col, row, width, height } = values;

    return {
      col: Math.max(1, Math.min(gridConfig.cols, col)),
      row: Math.max(1, Math.min(gridConfig.rows, row)),
      width: Math.max(1, Math.min(gridConfig.cols - col + 1, width)),
      height: Math.max(1, Math.min(gridConfig.rows - row + 1, height))
    };
  }
}

// Générateur de code
class CodeGenerator {
  constructor() {
    this.turndownService = this.setupTurndown();
    // console.log('📝 CodeGenerator créé');
  }

  setupTurndown() {
    const turndown = new TurndownService({
      headingStyle: 'atx',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined'
    });

    turndown.addRule('lineBreak', {
      filter: 'br',
      replacement: () => ' <br/>'
    });

    turndown.addRule('emphasis', {
      filter: ['em', 'i'],
      replacement: (content) => content.trim() ? `*${content}*` : ''
    });

    return turndown;
  }

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

    // console.log('📄 Code généré:', code.substring(0, 50) + '...', shouldCopy ? 'AVEC copie' : 'sans copie');

    if (shouldCopy) {
      this.copyToClipboard(code);
    }

    return code;
  }

  generateMarkdownCode(element) {
    const classes = this.getCleanClasses(element);
    const properties = this.buildPropertiesObject(element);
    const markdown = element.getAttribute('data-md') || '';

    if (classes) properties.class = `"${classes}"`;

    const propertiesStr = this.formatPropertiesObject(properties);
    return `{% markdown "${markdown}", ${propertiesStr} %}`;
  }

  generateImageCode(element) {
    const img = element.querySelector('img');
    const url = img ? this.getRelativePath(img.src) : '';
    const classes = this.getCleanClasses(element);
    const caption = this.getCaption(element);
    const properties = this.buildPropertiesObject(element);

    if (caption) properties.caption = `"${this.escapeQuotes(caption)}"`;
    if (classes) properties.class = `"${classes}"`;

    const propertiesStr = this.formatPropertiesObject(properties);
    return `{% grid "/${url}", ${propertiesStr} %}`;
  }

  generateContentCode(element) {
    const classes = this.getCleanClasses(element);
    const properties = this.buildPropertiesObject(element);

    if (classes) properties.class = `"${classes}"`;

    const propertiesStr = this.formatPropertiesObject(properties);
    return `{% resize ${propertiesStr} %}`;
  }

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

  getCleanClasses(element) {
    const exclude = ['selected', 'hover', 'cursor', 'resizable', 'resizing'];
    return Array.from(element.classList)
      .filter(cls => !exclude.includes(cls))
      .join(' ')
      .trim();
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

  getCaption(element) {
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

    const img = element.querySelector('img');
    if (img && img.alt) return img.alt;

    return '';
  }

  escapeQuotes(str) {
    return str.replace(/"/g, '\\"');
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // console.log('📋 Code copié dans le presse-papier:', text.length, 'caractères');
      
      const copyElement = document.querySelector('.copy');
      if (copyElement) {
        copyElement.classList.add('copied');
        setTimeout(() => copyElement.classList.remove('copied'), 1000);
      }
      
      return true;
    } catch (err) {
      console.warn('⚠️ Erreur copie clipboard, fallback vers execCommand');
      const input = document.querySelector('#showCode');
      if (input) {
        input.select();
        document.execCommand('copy');
        return true;
      }
      console.error('❌ Échec copie:', err);
      return false;
    }
  }
}

// Classe principale Layout V2
export default class Layout extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    // console.log('🚀 LAYOUT V2 - Initialisation du constructeur');

    this.state = new LayoutState();
    this.codeGenerator = new CodeGenerator();
    
    // Callback pour générer le code avec ou sans copie
    const onCodeGenerate = (element, shouldCopy = false) => {
      // console.log('🔧 Génération du code pour:', element.dataset.grid, shouldCopy ? 'AVEC copie' : 'sans copie');
      return this.codeGenerator.generateCode(element, shouldCopy);
    };
    
    this.resizeManager = new ResizeManager(this.state, onCodeGenerate);
    this.interactionManager = new InteractionManager(this.state, this.resizeManager, onCodeGenerate);
    
    // Lien avec la génération de code pour la sélection
    this.interactionManager.onElementSelected = (element) => {
      this.updateUI(element);
      // console.log('🎯 Élément sélectionné, génération du code sans copie');
      this.codeGenerator.generateCode(element, false);
    };

    this.isInitialized = false;
    this.toggleHandler = null;

    // console.log('✅ LAYOUT V2 - Constructeur terminé');
  }

  // === CYCLE DE VIE DU PLUGIN ===

  beforeParsed(content) {
    // console.log('🧹 LAYOUT V2 - beforeParsed appelé');
    this.cleanup();
  }

  afterRendered(pages) {
    // console.log('🎬 LAYOUT V2 - afterRendered appelé');
    setTimeout(() => {
      this.initialize();
      this.initializeLayoutToggle();
      this.isInitialized = true;
      // console.log('⚡ LAYOUT V2 - Initialisation terminée');
    }, 100);
  }

  initialize() {
    // console.log('🔧 LAYOUT V2 - initialize appelé');
    if (this.isInitialized) this.cleanup();
    this.setupPanelControls();
  }

  // === INTERFACE UTILISATEUR ===

  setupPanelControls() {
    // console.log('🎛️ Configuration des contrôles du panneau');
    // Grille 9 points pour positionnement d'images
    CONFIG.GRID_POSITIONS.forEach(pos => {
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

        newElement.addEventListener('change', (e) => {
          if (this.state.selectedElement) {
            const propName = prop.property.replace('--', '');
            this.interactionManager.setCSSProperties(this.state.selectedElement, {
              [propName]: e.target.value
            });
            this.codeGenerator.generateCode(this.state.selectedElement);
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

  positionImage(alignX, alignY) {
    if (!this.state.selectedElement || this.state.selectedElement.dataset.grid !== 'image') return;

    const img = this.interactionManager.findImageElement(this.state.selectedElement);
    if (!img) return;

    const parentWidth = this.state.selectedElement.offsetWidth;
    const parentHeight = this.state.selectedElement.offsetHeight;
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;

    const imgX = (((parentWidth - imgWidth) * alignX) / parentWidth) * 100;
    const imgY = (((parentHeight - imgHeight) * alignY) / parentHeight) * 100;

    this.interactionManager.setCSSProperties(this.state.selectedElement, {
      'img-x': imgX,
      'img-y': imgY
    });

    // console.log('📍 Position image grille 9 points, génération du code...');
    this.codeGenerator.generateCode(this.state.selectedElement, true);
  }

  fillBlock() {
    if (!this.state.selectedElement || this.state.selectedElement.dataset.grid !== 'image') return;

    this.interactionManager.setCSSProperties(this.state.selectedElement, { 'img-w': 100 });
    this.positionImage(0.5, 0.5);
    
    // console.log('🔳 Remplir bloc, génération du code...');
    this.codeGenerator.generateCode(this.state.selectedElement, true);
  }

  adjustContent() {
    if (!this.state.selectedElement || this.state.selectedElement.dataset.grid !== 'image') return;

    const img = this.interactionManager.findImageElement(this.state.selectedElement);
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const parentWidth = this.state.selectedElement.offsetWidth;
    const parentHeight = this.state.selectedElement.offsetHeight;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    const newWidth = aspectRatio * parentHeight;
    const imgW = (newWidth / parentWidth) * 100;

    const imgWidth = (parentWidth * imgW) / 100;
    const imgX = ((parentWidth - imgWidth) / 2 / parentWidth) * 100;

    this.interactionManager.setCSSProperties(this.state.selectedElement, {
      'img-w': imgW,
      'img-y': 0,
      'img-x': imgX
    });

    // console.log('📏 Ajuster contenu, génération du code...');
    this.codeGenerator.generateCode(this.state.selectedElement, true);
  }

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
      if (label) label.setAttribute('data-name', '');
      if (position) position.setAttribute('data-shortcode', '');
    }
  }

  getCSSProperties(element) {
    const properties = [
      'col', 'width', 'print-col', 'print-width', 'print-row',
      'print-height', 'align-self', 'figcaption_arrow',
      'img-x', 'img-y', 'img-w'
    ];

    const result = {};
    properties.forEach(prop => {
      result[prop] = element.style.getPropertyValue(`--${prop}`) || '';
    });

    return result;
  }

  // === ACTIVATION/DÉSACTIVATION DU MODE LAYOUT ===

  initializeLayoutToggle() {
    if (this.toggleHandler) return;

    let body = cssPageWeaver?.ui?.body || document.body;
    let toggleInput = cssPageWeaver?.ui?.layout?.toggleInput;

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

    const preference = localStorage.getItem('layout') === 'true';

    body.classList.toggle('layout', preference);
    toggleInput.checked = preference;

    this.toggleHandler = (e) => {
      const isEnabled = e.target.checked;
      body.classList.toggle('layout', isEnabled);
      localStorage.setItem('layout', isEnabled);
      // console.log('🔄 Mode layout:', isEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ');
    };

    toggleInput.addEventListener('input', this.toggleHandler);
  }

  // === NETTOYAGE ET DESTRUCTION ===

  cleanup() {
    if (!this.isInitialized) return;

    try {
      // console.log('🧹 Nettoyage du plugin...');
      // L'InteractionManager gère ses propres event listeners
      this.state.deselect();
      
      document.querySelectorAll('.resizable, .resizing').forEach(element => {
        this.state.cleanupElement(element);
      });

      document.body.classList.remove('grid-resizing');

      if (this.toggleHandler && cssPageWeaver?.ui?.layout?.toggleInput) {
        cssPageWeaver.ui.layout.toggleInput.removeEventListener('input', this.toggleHandler);
        this.toggleHandler = null;
      }

      this.isInitialized = false;
    } catch (error) {
      // console.error('❌ Erreur lors du nettoyage:', error);
    }
  }

  destroy() {
    this.cleanup();
  }
}