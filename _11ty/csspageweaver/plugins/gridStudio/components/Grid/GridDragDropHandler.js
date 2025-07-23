import { ImageManipulator } from "../image/ImageManipulator.js";

export class GridDragDropHandler {
  constructor(gridManager = null) {
    this.gridManager = gridManager;
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
      edge: 15, // Zone de bord pour resize
      corner: 20, // Zone de coin pour resize diagonal
    };
  }

  initializeDragDrop() {
    if (this.isInitialized) {
      this.cleanup();
    }

    this.setupGlobalListeners();
    this.isInitialized = true;
    console.log("🎯 GridDragDropHandler: Mode simplifié activé");
  }

  setupGlobalListeners() {
    // Utiliser mouseenter/mouseleave avec capture
    document.addEventListener("mouseenter", this.handleMouseEnter.bind(this), {
      capture: true,
      passive: true,
    });
    document.addEventListener("mouseleave", this.handleMouseLeave.bind(this), {
      capture: true,
      passive: true,
    });
    document.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      true
    );
    document.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this),
      true
    );
    document.addEventListener("mouseup", this.handleMouseUp.bind(this), true);

    console.log("🎧 Listeners optimisés configurés");
  }

handleMouseEnter(e) {
  if (this.isResizing || !document.body.classList.contains("gridStudio"))
    return;

  // Filtrer les événements non-Element
  if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;

  const target = e.target.closest(".resize, .figure, .insert");

  if (
    !target ||
    e.target.closest("figcaption") ||
    !this.isInModularGrid(target)
  )
    return;

  // Éviter les répétitions
  if (this.hoveredElement === target) return;

  // Nettoyer l'ancien élément survolé
  if (this.hoveredElement && this.hoveredElement !== target) {
    this.cleanupElement(this.hoveredElement);
  }

  this.hoveredElement = target;
  target.classList.add("selected");
  
  // ← AJOUTER CETTE LIGNE :
  if (this.gridManager) {
    this.gridManager.updateUI(target);
  }
}

  generateCodeForElement(element) {
    const manipulator = new ImageManipulator();
    manipulator.generateCode(element, true);
  }

  handleMouseLeave(e) {
    if (this.isResizing) return;

    // Filtrer les événements non-Element
    if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;

    const target = e.target.closest(".resize, .figure, .insert");
    if (!target || target !== this.hoveredElement) return;

    this.cleanupElement(target);
    this.hoveredElement = null;
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
    element.classList.remove("selected");
    element.style.cursor = "default";
  }

  handleMouseDown(e) {
    if (!document.body.classList.contains("gridStudio") || this.isResizing)
      return;

    if (!this.hoveredElement) return;

    const zone = this.getInteractionZone(
      this.hoveredElement,
      e.clientX,
      e.clientY
    );
    if (!zone) return;

    console.log("🎯 DÉBUT:", { element: this.hoveredElement.className, zone });

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
    this.startWidth =
      parseInt(element.style.getPropertyValue("--print-width")) || 6;
    this.startHeight =
      parseInt(element.style.getPropertyValue("--print-height")) || 3;
    this.startCol =
      parseInt(element.style.getPropertyValue("--print-col")) || 1;
    this.startRow =
      parseInt(element.style.getPropertyValue("--print-row")) || 1;

    // S'assurer que les propriétés sont définies
    this.ensureGridProperties(element);

    // États visuels
    document.body.classList.add("grid-resizing");
    element.classList.add("resizing", "selected");

    console.log("📏 Départ:", {
      mode: this.resizeMode,
      size: `${this.startWidth}×${this.startHeight}`,
      pos: `[${this.startCol}, ${this.startRow}]`,
    });
  }

  ensureGridProperties(element) {
    const props = [
      ["--print-col", this.startCol],
      ["--print-row", this.startRow],
      ["--print-width", this.startWidth],
      ["--print-height", this.startHeight],
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
    const { newWidth, newHeight, newCol, newRow } = this.calculateNewValues(
      deltaX,
      deltaY
    );

    // Debug
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      console.log(`🔄 ${this.resizeMode}:`, {
        delta: `[${deltaX}, ${deltaY}]`,
        old: `${this.startWidth}×${this.startHeight} @ [${this.startCol}, ${this.startRow}]`,
        new: `${newWidth}×${newHeight} @ [${newCol}, ${newRow}]`,
      });
    }

    // FORCER l'application des changements
    console.log("🚀 Appel applyGridChanges...");
    this.applyGridChanges(newWidth, newHeight, newCol, newRow);
  }

  calculateNewValues(deltaX, deltaY) {
    const container = this.currentElement.parentElement;
    const modularGrid = this.currentElement.closest(".modularGrid");

    const gridCols =
      parseInt(getComputedStyle(modularGrid).getPropertyValue("--grid-col")) ||
      12;
    const gridRows =
      parseInt(getComputedStyle(modularGrid).getPropertyValue("--grid-row")) ||
      10;

    const gridStepX = container.offsetWidth / gridCols;
    const gridStepY = container.offsetHeight / gridRows;

    const deltaCol = Math.round(deltaX / gridStepX);
    const deltaRow = Math.round(deltaY / gridStepY);

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    let newCol = this.startCol;
    let newRow = this.startRow;

    switch (this.resizeMode) {
      case "move":
        // Déplacement simple
        newCol = Math.max(
          1,
          Math.min(gridCols - this.startWidth + 1, this.startCol + deltaCol)
        );
        newRow = Math.max(
          1,
          Math.min(gridRows - this.startHeight + 1, this.startRow + deltaRow)
        );
        break;

      case "n-resize":
        // Redimensionnement par le haut
        const heightDeltaN = -deltaRow;
        newHeight = Math.max(1, this.startHeight + heightDeltaN);
        newRow = Math.max(1, this.startRow + deltaRow);
        if (newRow + newHeight - 1 > gridRows) {
          newHeight = gridRows - newRow + 1;
        }
        break;

      case "s-resize":
        // Redimensionnement par le bas
        newHeight = Math.max(
          1,
          Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow)
        );
        break;

      case "e-resize":
        // Redimensionnement par la droite
        newWidth = Math.max(
          1,
          Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol)
        );
        break;

      case "w-resize":
        // Redimensionnement par la gauche
        const widthDeltaW = -deltaCol;
        newWidth = Math.max(1, this.startWidth + widthDeltaW);
        newCol = Math.max(1, this.startCol + deltaCol);
        if (newCol + newWidth - 1 > gridCols) {
          newWidth = gridCols - newCol + 1;
        }
        break;

      case "ne-resize":
        // Nord-Est: haut + droite
        const heightDeltaNE = -deltaRow;
        newHeight = Math.max(1, this.startHeight + heightDeltaNE);
        newRow = Math.max(1, this.startRow + deltaRow);
        newWidth = Math.max(
          1,
          Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol)
        );
        if (newRow + newHeight - 1 > gridRows) {
          newHeight = gridRows - newRow + 1;
        }
        break;

      case "nw-resize":
        // Nord-Ouest: haut + gauche
        const heightDeltaNW = -deltaRow;
        const widthDeltaNW = -deltaCol;
        newHeight = Math.max(1, this.startHeight + heightDeltaNW);
        newRow = Math.max(1, this.startRow + deltaRow);
        newWidth = Math.max(1, this.startWidth + widthDeltaNW);
        newCol = Math.max(1, this.startCol + deltaCol);
        // Contraintes
        if (newRow + newHeight - 1 > gridRows) {
          newHeight = gridRows - newRow + 1;
        }
        if (newCol + newWidth - 1 > gridCols) {
          newWidth = gridCols - newCol + 1;
        }
        break;

      case "se-resize":
        // Sud-Est: bas + droite
        newHeight = Math.max(
          1,
          Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow)
        );
        newWidth = Math.max(
          1,
          Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol)
        );
        break;

      case "sw-resize":
        // Sud-Ouest: bas + gauche
        newHeight = Math.max(
          1,
          Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow)
        );
        const widthDeltaSW = -deltaCol;
        newWidth = Math.max(1, this.startWidth + widthDeltaSW);
        newCol = Math.max(1, this.startCol + deltaCol);
        if (newCol + newWidth - 1 > gridCols) {
          newWidth = gridCols - newCol + 1;
        }
        break;
    }

    return { newWidth, newHeight, newCol, newRow };
  }

  applyGridChanges(newWidth, newHeight, newCol, newRow) {
    const element = this.currentElement;

    console.log("🔧 AVANT applyGridChanges:", {
      mode: this.resizeMode,
      currentValues: {
        col: element.style.getPropertyValue("--print-col"),
        row: element.style.getPropertyValue("--print-row"),
        width: element.style.getPropertyValue("--print-width"),
        height: element.style.getPropertyValue("--print-height"),
      },
      newValues: { newCol, newRow, newWidth, newHeight },
    });

    // Propriétés à mettre à jour selon le mode
    const updates = [];

    if (this.resizeMode === "move") {
      updates.push(["--print-col", newCol], ["--print-row", newRow]);
    } else {
      // Pour tous les modes de resize, appliquer position ET taille
      updates.push(
        ["--print-col", newCol],
        ["--print-row", newRow],
        ["--print-width", newWidth],
        ["--print-height", newHeight]
      );
    }

    // Appliquer sur l'élément principal
    updates.forEach(([prop, value]) => {
      element.style.setProperty(prop, value);
      console.log(`✅ Applied ${prop}: ${value}`);
    });

    // Appliquer sur figcaption si elle existe
    const figcaption = element.nextElementSibling;
    if (figcaption && figcaption.tagName.toLowerCase() === "figcaption") {
      updates.forEach(([prop, value]) => {
        figcaption.style.setProperty(prop, value);
      });
    }

    console.log("🔧 APRÈS applyGridChanges:", {
      col: element.style.getPropertyValue("--print-col"),
      row: element.style.getPropertyValue("--print-row"),
      width: element.style.getPropertyValue("--print-width"),
      height: element.style.getPropertyValue("--print-height"),
    });
  }

  handleMouseUp(e) {
    if (!this.isResizing) return;

    console.log("🏁 Fin du resize");

    const currentElement = this.currentElement;

    // Nettoyer les états
    document.body.classList.remove("grid-resizing");
    if (currentElement) {
      currentElement.classList.remove("resizing");
      currentElement.style.cursor = "default";

      // Générer le code final
      this.generateCode(currentElement);

      // Masquer après un délai
      setTimeout(() => {
        if (currentElement && !currentElement.matches(":hover")) {
          currentElement.classList.remove("selected");
        }
      }, 1000);
    }

    // Reset
    this.isResizing = false;
    this.currentElement = null;
    this.resizeMode = null;
  }

  generateCode(element) {
    if (!element) return;

    const manipulator = new ImageManipulator();
    manipulator.generateCode(element, true);

    console.log("📝 Code généré");
  }

  cleanup() {
    // Supprimer les listeners
    document.removeEventListener("mouseenter", this.handleMouseEnter, {
      capture: true,
      passive: true,
    });
    document.removeEventListener("mouseleave", this.handleMouseLeave, {
      capture: true,
      passive: true,
    });
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    document.removeEventListener("mousedown", this.handleMouseDown, true);
    document.removeEventListener("mouseup", this.handleMouseUp, true);

    // Nettoyer les états
    if (this.hoveredElement) {
      this.cleanupElement(this.hoveredElement);
      this.hoveredElement = null;
    }

    // Nettoyer les classes
    document.querySelectorAll(".selected, .resizing").forEach((el) => {
      el.classList.remove("selected", "resizing");
      el.style.cursor = "default";
    });

    document.body.classList.remove("grid-resizing");

    this.isInitialized = false;
    console.log("🧹 GridDragDropHandler nettoyé");
  }

  destroy() {
    this.cleanup();
  }

  isInModularGrid(element) {
    return element.closest(".modularGrid") !== null;
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
}

}






// Rétrocompatibilité PagedJS
if (typeof Paged !== "undefined") {
  class GridResizeHandler extends Paged.Handler {
    constructor(chunker, polisher, caller) {
      super(chunker, polisher, caller);
      this.gridHandler = new GridDragDropHandler();
    }

    afterPreview(pages) {
      this.gridHandler.initializeDragDrop();
    }
  }

  Paged.registerHandlers(GridResizeHandler);
}
