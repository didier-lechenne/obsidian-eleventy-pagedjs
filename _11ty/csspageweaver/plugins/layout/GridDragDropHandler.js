import { ImageManipulator } from "./ImageManipulator.js";

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
    this.resetCursorTimeout = null;
    this.isShiftPressed = false;

    // Zones de détection invisibles étendues (débordent du bloc)
    this.zones = {
      edge: 20, // Zone de bord : 40px total (20px dedans + 20px dehors)
      corner: 25, // Zone de coin : 50px total (25px dedans + 25px dehors)
    };
  }

  initializeDragDrop() {
    if (this.isInitialized) {
      this.cleanup();
    }

    this.setupGlobalListeners();
    this.setupHoverClass();
    this.isInitialized = true;
    console.log("🎯 GridDragDropHandler: Zones invisibles étendues activées");
  }

  isInModularGrid(element) {
    return element.closest(".modularGrid") !== null;
  }

  setupHoverClass() {
    document.addEventListener(
      "mouseenter",
      (e) => {
        if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
        if (e.target.closest("figcaption")) return;

        const target = e.target.closest(".resize, .figure, .insert");

        if (
          target &&
          document.body.classList.contains("layout") &&
          !this.isResizing &&
          this.isInModularGrid(target) &&
          this.hoveredElement !== target
        ) {
          if (this.hoveredElement && this.hoveredElement !== target) {
            this.cleanupElement(this.hoveredElement);
          }

          this.hoveredElement = target;
          target.classList.add("resizable");
          this.addMoveButton(target);
        }
      },
      { capture: true, passive: true }
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        if (!e.target || e.target.nodeType !== Node.ELEMENT_NODE) return;
        if (this.isResizing) return;

        const target = e.target.closest(".resize, .figure, .insert");
        if (!target || target !== this.hoveredElement) return;

        const relatedTarget = e.relatedTarget;
        if (!target.contains(relatedTarget)) {
          setTimeout(() => {
            if (this.hoveredElement === target && !target.matches(":hover")) {
              this.cleanupElement(target);
              this.hoveredElement = null;
            }
          }, 100);
        }
      },
      { capture: true, passive: true }
    );
  }



  addMoveButton(element) {
    // Supprimer l'ancien bouton s'il existe
    const existingButton = element.querySelector(".move-button");
    if (existingButton) existingButton.remove();

    // Ajouter le petit bouton de déplacement
    const moveButton = document.createElement("div");
    moveButton.className = "move-button";
    moveButton.dataset.mode = "move";
    moveButton.title = "Déplacer dans la grille";
    element.appendChild(moveButton);

    // Masquer le bouton si Shift est enfoncé
if (this.isShiftPressed) {
  moveButton.style.display = 'none';
}

  }

    // === GESTION DE LA TOUCHE SHIFT ===
    
    handleShiftDown(e) {
        
        if (e.key === 'Shift' && !this.isShiftPressed) {
            this.isShiftPressed = true;
            this.toggleMoveButtons(false); // Masquer tous les boutons
            console.log("shift done");
        }
    }

    handleShiftUp(e) {
        
        if (e.key === 'Shift' && this.isShiftPressed) {
            this.isShiftPressed = false;
            this.toggleMoveButtons(true); // Afficher tous les boutons
            console.log("shift done");
        }
    }

    toggleMoveButtons(show) {
        // Masquer/afficher tous les boutons de déplacement visibles
        document.querySelectorAll('.move-button').forEach(button => {
            button.style.display = show ? 'flex' : 'none';
        });
    }

  cleanupElement(element) {
    element.classList.remove("resizable");
    element.style.cursor = "default";
    delete element.dataset.resizeMode;

    const moveButton = element.querySelector(".move-button");
    if (moveButton) moveButton.remove();
   }

  setupGlobalListeners() {
    document.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this),
      true
    );
    document.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      true
    );
    document.addEventListener("mouseup", this.handleMouseUp.bind(this), true);
    document.addEventListener("wheel", this.handleWheel.bind(this), {
      passive: false,
    });
    document.addEventListener("keydown", this.handleArrowKeys.bind(this));

    document.addEventListener("keydown", this.handleShiftDown.bind(this));
    document.addEventListener("keyup", this.handleShiftUp.bind(this));

    console.log("🎧 Listeners zones invisibles configurés");
  }

  // === GESTION DES ZONES INVISIBLES ÉTENDUES ===

  getInteractionZone(element, clientX, clientY) {
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Zones étendues : débordent À L'EXTÉRIEUR ET À L'INTÉRIEUR du bloc
    const isNearLeft = x >= -this.zones.corner && x <= this.zones.corner;
    const isNearRight =
      x >= rect.width - this.zones.corner &&
      x <= rect.width + this.zones.corner;
    const isNearTop = y >= -this.zones.corner && y <= this.zones.corner;
    const isNearBottom =
      y >= rect.height - this.zones.corner &&
      y <= rect.height + this.zones.corner;

    const isEdgeLeft = x >= -this.zones.edge && x <= this.zones.edge;
    const isEdgeRight =
      x >= rect.width - this.zones.edge && x <= rect.width + this.zones.edge;
    const isEdgeTop = y >= -this.zones.edge && y <= this.zones.edge;
    const isEdgeBottom =
      y >= rect.height - this.zones.edge && y <= rect.height + this.zones.edge;

    // Coins (priorité maximale) - zones 50×50px centrées sur les coins
    if (isNearLeft && isNearTop) return "nw-resize";
    if (isNearRight && isNearTop) return "ne-resize";
    if (isNearLeft && isNearBottom) return "sw-resize";
    if (isNearRight && isNearBottom) return "se-resize";

    // Bords - zones 40px de large centrées sur les bords
    if (isEdgeLeft) return "w-resize";
    if (isEdgeRight) return "e-resize";
    if (isEdgeTop) return "n-resize";
    if (isEdgeBottom) return "s-resize";

    // Centre = pas de redimensionnement
    return null;
  }

  updateCursor(element, clientX, clientY) {
    const zone = this.getInteractionZone(element, clientX, clientY);

    const cursors = {
      "n-resize": "ns-resize",
      "s-resize": "ns-resize",
      "e-resize": "ew-resize",
      "w-resize": "ew-resize",
      "ne-resize": "nesw-resize",
      "nw-resize": "nwse-resize",
      "se-resize": "nwse-resize",
      "sw-resize": "nesw-resize",
    };

    element.style.cursor = zone ? cursors[zone] : "default";
    element.style.setProperty('cursor', cursors, 'important');
    element.dataset.resizeMode = zone || "hover";
  }

  handleMouseDown(e) {
    if (!document.body.classList.contains("layout") || this.isResizing) return;



    let resizeMode = null;
    let targetElement = null;

    // Clic sur le bouton de déplacement
    if (e.target.classList.contains("move-button")) {
      resizeMode = "move";
      targetElement = e.target.closest(".resize, .figure, .insert");
    }
    // Clic dans une zone de redimensionnement
    else if (this.hoveredElement) {
      const zone = this.getInteractionZone(
        this.hoveredElement,
        e.clientX,
        e.clientY
      );
      if (zone) {
        resizeMode = zone;
        targetElement = this.hoveredElement;
      }
    }

    if (!resizeMode || !targetElement) return;
    if (!this.isInModularGrid(targetElement)) return;

    e.preventDefault();
    e.stopPropagation();

    this.startResize(targetElement, resizeMode, e);
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

    this.ensureGridProperties();

    // États visuels
    document.body.classList.add("grid-resizing");
    element.classList.add("resizing", "resizable");
    element.dataset.resizeMode = mode;
  }

  ensureGridProperties() {
    const props = [
      ["--print-col", this.startCol],
      ["--print-row", this.startRow],
      ["--print-width", this.startWidth],
      ["--print-height", this.startHeight],
    ];

    props.forEach(([prop, value]) => {
      if (!this.currentElement.style.getPropertyValue(prop)) {
        this.currentElement.style.setProperty(prop, value);
      }
    });
  }

  handleMouseMove(e) {
    if (this.isResizing) {
      this.handleResizeMove(e);
      return;
    }

    if (!this.hoveredElement) return;
    this.updateCursor(this.hoveredElement, e.clientX, e.clientY);
  }

  handleResizeMove(e) {
    if (!this.isResizing || !this.currentElement) return;

    e.preventDefault();

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    const { newWidth, newHeight, newCol, newRow } = this.calculateNewValues(
      deltaX,
      deltaY
    );
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
        const heightDeltaN = -deltaRow;
        newHeight = Math.max(1, this.startHeight + heightDeltaN);
        newRow = Math.max(1, this.startRow + deltaRow);
        if (newRow + newHeight - 1 > gridRows) {
          newHeight = gridRows - newRow + 1;
        }
        break;

      case "s-resize":
        newHeight = Math.max(
          1,
          Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow)
        );
        break;

      case "e-resize":
        newWidth = Math.max(
          1,
          Math.min(gridCols - this.startCol + 1, this.startWidth + deltaCol)
        );
        break;

      case "w-resize":
        const widthDeltaW = -deltaCol;
        newWidth = Math.max(1, this.startWidth + widthDeltaW);
        newCol = Math.max(1, this.startCol + deltaCol);
        if (newCol + newWidth - 1 > gridCols) {
          newWidth = gridCols - newCol + 1;
        }
        break;

      case "ne-resize":
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
        const heightDeltaNW = -deltaRow;
        const widthDeltaNW = -deltaCol;
        newHeight = Math.max(1, this.startHeight + heightDeltaNW);
        newRow = Math.max(1, this.startRow + deltaRow);
        newWidth = Math.max(1, this.startWidth + widthDeltaNW);
        newCol = Math.max(1, this.startCol + deltaCol);
        break;

      case "se-resize":
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
        newHeight = Math.max(
          1,
          Math.min(gridRows - this.startRow + 1, this.startHeight + deltaRow)
        );
        const widthDeltaSW = -deltaCol;
        newWidth = Math.max(1, this.startWidth + widthDeltaSW);
        newCol = Math.max(1, this.startCol + deltaCol);
        break;
    }

    return { newWidth, newHeight, newCol, newRow };
  }

  applyGridChanges(newWidth, newHeight, newCol, newRow) {
    const updates = [];

    if (this.resizeMode === "move") {
      updates.push(["--print-col", newCol], ["--print-row", newRow]);
    } else {
      updates.push(
        ["--print-col", newCol],
        ["--print-row", newRow],
        ["--print-width", newWidth],
        ["--print-height", newHeight]
      );
    }

    // Appliquer sur l'élément principal
    updates.forEach(([prop, value]) => {
      this.currentElement.style.setProperty(prop, value);
    });

    // Synchroniser figcaption
    const figcaption = this.currentElement.nextElementSibling;
    if (figcaption && figcaption.tagName.toLowerCase() === "figcaption") {
      updates.forEach(([prop, value]) => {
        if (prop === "--print-row") {
          figcaption.style.setProperty(prop, value + newHeight);
        } else {
          figcaption.style.setProperty(prop, value);
        }
      });
    }
  }

  handleMouseUp(e) {
    if (!this.isResizing) return;

    const currentElement = this.currentElement;

    // Nettoyer les états
    document.body.classList.remove("grid-resizing");
    if (currentElement) {
      currentElement.classList.remove("resizing");
      currentElement.style.cursor = "default";
      currentElement.dataset.resizeMode = "hover";

      this.generateCode();

      setTimeout(() => {
        if (currentElement && !currentElement.matches(":hover")) {
          currentElement.classList.remove("resizable");
          const moveButton = currentElement.querySelector(".move-button");
          if (moveButton) moveButton.remove();
        }
      }, 300);
    }

    // Reset
    this.isResizing = false;
    this.currentElement = null;
    this.resizeMode = null;
  }

  // === ZOOM ET DÉPLACEMENT D'IMAGES ===

handleWheel(e) {
  if (
    !e.shiftKey ||
    !e.target.tagName ||
    e.target.tagName.toLowerCase() !== "img"
  )
    return;

  e.preventDefault();

  const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
  const scaleAmount = 1.0 + (delta * 5) / 90.0;
  const parent = e.target.closest(".resize, .figure, .insert");

  this.zoomImage(
    e.target,
    scaleAmount,
    e.layerX / e.target.width,
    e.layerY / e.target.height
  );

  // Curseur de zoom temporaire sur l'IMAGE seulement, pas sur le parent
  if (parent) {
    e.target.style.cursor = delta > 0 ? "zoom-in" : "zoom-out";
    // Marquer qu'on est en mode zoom pour éviter les conflits
    parent.dataset.isZooming = "true";
  }

  clearTimeout(this.resetCursorTimeout);
  this.resetCursorTimeout = setTimeout(() => {
    if (parent) {
      // Enlever le flag de zoom et le curseur de l'image
      delete parent.dataset.isZooming;
      e.target.style.cursor = "";
      
      // Si l'élément est toujours survolé, recalculer le curseur approprié
      if (this.hoveredElement === parent) {
        // Obtenir la position actuelle de la souris via l'événement mousemove
        // ou utiliser le centre comme fallback
        const rect = parent.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        this.updateCursor(parent, centerX, centerY);
      }
    }
    
    const parentForCode = e.target.closest("figure, .resize, .image");
    if (parentForCode) {
      this.generateCodeForElement(parentForCode);
    }
  }, 300); // Délai réduit
}

refreshCursor(element, clientX = null, clientY = null) {
  if (!element || !this.isInModularGrid(element)) return;
  
  if (clientX === null || clientY === null) {
    // Utiliser le centre de l'élément comme position par défaut
    const rect = element.getBoundingClientRect();
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }
  
  this.updateCursor(element, clientX, clientY);
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

    const newLeftPercentage =
      ((-oldWidth * resizeFract * relX + img.offsetLeft) / parentWidth) * 100;
    const newTopPercentage =
      ((-oldHeight * resizeFract * relY + img.offsetTop) / parentHeight) * 100;

    parent.style.setProperty("--img-x", newLeftPercentage);
    parent.style.setProperty("--img-y", newTopPercentage);
  }

  handleArrowKeys(e) {
    if (!e.shiftKey) return;

    const targetElement = this.hoveredElement || this.currentElement;
    if (!targetElement) return;

    const img = targetElement.querySelector("img");
    if (!img) return;

    const moves = {
      ArrowUp: [0, -2],
      ArrowDown: [0, 2],
      ArrowLeft: [-2, 0],
      ArrowRight: [2, 0],
    };

    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.translateImage(img, ...move);
      this.generateCodeForElement(targetElement);
    }
  }

  translateImage(img, deltaX, deltaY) {
    const parent = img.parentElement;
    const parentWidth = parent.offsetWidth;
    const parentHeight = parent.offsetHeight;

    const currentX =
      parseFloat(getComputedStyle(parent).getPropertyValue("--img-x")) || 0;
    const currentY =
      parseFloat(getComputedStyle(parent).getPropertyValue("--img-y")) || 0;

    const newX = currentX + (deltaX / parentWidth) * 100;
    const newY = currentY + (deltaY / parentHeight) * 100;

    parent.style.setProperty("--img-x", newX);
    parent.style.setProperty("--img-y", newY);
  }

  // === GÉNÉRATION DE CODE ===

  generateCode() {
    if (!this.currentElement) return;
    this.generateCodeForElement(this.currentElement);
  }

  generateCodeForElement(element) {
    const manipulator = new ImageManipulator();
    manipulator.generateCode(element, true);
  }

  cleanup() {
    document.removeEventListener("mousedown", this.handleMouseDown, true);
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    document.removeEventListener("mouseup", this.handleMouseUp, true);
    document.removeEventListener("wheel", this.handleWheel, { passive: false });
    document.removeEventListener("keydown", this.handleArrowKeys);
    document.removeEventListener("keydown", this.handleShiftDown);
    document.removeEventListener("keyup", this.handleShiftUp);

    if (this.resetCursorTimeout) {
      clearTimeout(this.resetCursorTimeout);
    }

    if (this.hoveredElement) {
      this.cleanupElement(this.hoveredElement);
      this.hoveredElement = null;
    }

    document.querySelectorAll(".resizable").forEach((el) => {
      el.classList.remove("resizable");
      const moveButton = el.querySelector(".move-button");
      if (moveButton) moveButton.remove();
    });

    document.body.classList.remove("grid-resizing");

    this.isInitialized = false;
    console.log("🧹 GridDragDropHandler zones invisibles nettoyé");
  }

  destroy() {
    this.cleanup();
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

    afterRendered(pages) {
      // Rien à faire ici
    }
  }

  Paged.registerHandlers(GridResizeHandler);
} else {
  // Mode écran
  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.classList.contains("layout")) {
      const gridHandler = new GridDragDropHandler();
      gridHandler.initializeDragDrop();
    }
  });
}
