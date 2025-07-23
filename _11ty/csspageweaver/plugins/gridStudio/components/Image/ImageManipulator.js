class ImageManipulator {
  constructor() {
    this.currentImage = null;
    this.isDragging = false;
    this.prevX = 0;
    this.prevY = 0;
    this.selectedElement = null;
    this.resetCursorTimeout = null;
    this.gridConfig = {
      cols: 12,
      rows: 1,
    };
  }

  // Trouve l'élément image dans la cible
  findImageElement(target) {
    if (target.tagName.toLowerCase() === "img") {
      return target;
    }

    const figure = target.closest("figure, .resize, .image");
    return figure ? figure.querySelector("img") : null;
  }

  // Obtient le type de shortcode de l'élément
  getShortcodeType(element) {
    const types = [
      { selector: ".resize", name: "resize" },
      { selector: ".image", name: "image" },
      { selector: ".figure", name: "figure" },
      { selector: ".insert", name: "insert" },
    ];

    for (const type of types) {
      const parent = element.closest(type.selector);
      if (parent) return { parent, type: type.name };
    }

    return null;
  }

  // Gère le survol de la souris
  handleMouseOver(e) {
    const shortcodeInfo = this.getShortcodeType(e.target);
    if (!shortcodeInfo) return;

    const { parent, type } = shortcodeInfo;
    parent.style.cursor = "help";

    if (!parent.classList.contains("selected")) {
      parent.classList.add("hover");
    }

    if (e.shiftKey) {
      this.selectElement(parent, type);
    }
  }

  // Gère la sortie de la souris
  handleMouseOut(e) {
    const shortcodeInfo = this.getShortcodeType(e.target);
    if (shortcodeInfo) {
      shortcodeInfo.parent.classList.remove("hover");
    }
  }

  // Sélectionne un élément
  selectElement(parent, type) {
    // Désélectionne tous les autres éléments de la section
    const section = parent.closest("section");
    if (section) {
      section.querySelectorAll(".selected").forEach((elem) => {
        elem.classList.remove("selected");
      });
    }

    parent.classList.remove("hover");
    parent.classList.add("selected");

    // Coche la checkbox
    const checkbox = document.querySelector("#rd1");
    if (checkbox) checkbox.checked = true;


    if (this.gridManager) {
        this.gridConfig = this.gridManager.getGridConfig(parent);
    }

    // Met à jour l'interface
    const cssProps = this.getCSSProperties(parent);
    const imgId = this.getImageId(parent);
    const img = this.findImageElement(parent);

    this.updateUI(imgId, cssProps, img, type, parent);

    // Génère le code ET le copie lors de la sélection
    this.generateCode(parent, false);
  }

  // Récupère les propriétés CSS
  getCSSProperties(parent) {
    const properties = [
      "col",
      "width",
      "printcol",
      "printwidth",
      "printrow",
      "printheight",
      "alignself",
      "figcaption_arrow",
      "imgX",
      "imgY",
      "imgW",
    ];

    const result = {};
    properties.forEach((prop) => {
      result[prop] = parent.style.getPropertyValue(`--${prop}`) || "";
    });

    return result;
  }

  // Récupère l'ID de l'image
  getImageId(parent) {
    const dataId = parent.getAttribute("data-id");
    if (!dataId) return "0";

    const match = dataId.match(/\d+$/);
    return match ? match[0] : "0";
  }

  // Gère le début du glisser
  handleDragStart(e) {
    if (!e.shiftKey) return;

    // Bloquer GridDragDropHandler pendant drag d'image
    e.stopImmediatePropagation();

    this.currentImage = this.findImageElement(e.target);
    if (!this.currentImage) return;

    this.isDragging = true;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    this.currentImage.style.cursor = "grab";

    e.preventDefault();
  }

  // Gère le déplacement
  handleDragMove(e) {
    if (!this.isDragging || !this.currentImage || !e.shiftKey) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const deltaX = e.clientX - this.prevX;
    const deltaY = e.clientY - this.prevY;

    this.translateImage(deltaX, deltaY);

    this.prevX = e.clientX;
    this.prevY = e.clientY;
  }

  // Translate l'image
  translateImage(deltaX, deltaY) {
    const parent = this.currentImage.parentElement;
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

  // Gère la fin du glisser
  handleDragEnd(e) {
    if (!this.isDragging) return;

    e.stopImmediatePropagation();

    this.isDragging = false;
    if (this.currentImage) {
      this.currentImage.style.cursor = "default";
      const parent = this.currentImage.closest("figure, .resize, .image");
      if (parent) {
        this.generateCode(parent);
      }
    }
  }

  // Gère le zoom avec la molette
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

    this.zoomImage(
      e.target,
      scaleAmount,
      e.layerX / e.target.width,
      e.layerY / e.target.height
    );

    // Curseur de zoom
    e.target.style.cursor = delta > 0 ? "zoom-in" : "zoom-out";

    // Reset du curseur après un délai
    clearTimeout(this.resetCursorTimeout);
    this.resetCursorTimeout = setTimeout(() => {
      e.target.style.cursor = "help";
      this.generateCode(e.target.closest("figure, .resize, .image"));
    }, 500);
  }

  // Zoom l'image
  zoomImage(img, scaleAmount, relX, relY) {
    const parent = img.parentElement;
    const oldWidth =
      parseFloat(parent.style.getPropertyValue("--img-w")) || 100;

    let newWidth = scaleAmount * oldWidth;
    newWidth = Math.max(10, Math.min(1000, newWidth));

    const resizeFract = (newWidth - oldWidth) / oldWidth;

    const currentX = parseFloat(parent.style.getPropertyValue("--img-x")) || 0;
    const currentY = parseFloat(parent.style.getPropertyValue("--img-y")) || 0;

    const newX = currentX - resizeFract * oldWidth * relX;
    const newY =
      currentY -
      resizeFract * oldWidth * relY * (img.naturalHeight / img.naturalWidth);

    parent.style.setProperty("--img-w", newWidth);
    parent.style.setProperty("--img-x", newX);
    parent.style.setProperty("--img-y", newY);

    // Mettre à jour l'input zoom
    const zoomInput = document.querySelector("#zoom-grid-studio");
    if (zoomInput) {
      zoomInput.value = newWidth;
    }
  }

  // Gère les touches fléchées
  handleArrowKeys(e) {
    if (!this.currentImage || !e.shiftKey) return;

    const moves = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };

    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.translateImage(...move);
      const parent = this.currentImage.closest("figure, .resize, .image");
      if (parent) {
        this.generateCode(parent);
      }
    }
  }

  // Met à jour l'interface utilisateur
  updateUI(imgId, img, shortcodeType, parent) {
    this.parent = parent;
    this.onUpdate = () => this.generateCode(parent, true);

    // Configuration des liaisons input ↔ CSS
    const bindings = [
      { inputId: "col", cssProperty: "--col" },
      { inputId: "width", cssProperty: "--width" },
      { inputId: "printcol", cssProperty: "--print-col" },
      { inputId: "printwidth", cssProperty: "--print-width" },
      { inputId: "printrow", cssProperty: "--print-row" },
      { inputId: "printheight", cssProperty: "--print-height" },
      { inputId: "align_self", cssProperty: "--align-self" },
      { inputId: "figcaption_arrow", cssProperty: "--figcaption_arrow" },
      { inputId: "zoom-grid-studio", cssProperty: "--img-w" },
    ];

    // Appliquer toutes les liaisons
    bindings.forEach(({ inputId, cssProperty }) => {
      this.setupBinding(inputId, cssProperty);
    });

    // Mettre à jour les labels
    const label = document.querySelector("#label_rd1");
    if (label) label.setAttribute("data-name", `#${shortcodeType}_${imgId}`);

    const position = document.querySelector("#position");
    if (position) position.setAttribute("data-shortcode", shortcodeType);

    // Dans updateUI()
    console.log("Creating ImageControls with:", { parent, img }); // DEBUG

    const controls = new ImageControls(parent, img, () =>
      this.generateCode(parent, true)
    );
    controls.init();
  }

  // Nouvelle méthode universelle
  setupBinding(inputId, cssProperty) {
    const input = document.querySelector(`#${inputId}`);
    if (!input) return;

    // Mettre à jour la valeur de l'input
    const currentValue =
      this.parent?.style?.getPropertyValue(cssProperty) || "";
    if (input.tagName === "SELECT") {
      input.value = currentValue || input.options[0].value;
    } else {
      input.value = currentValue || 0;
      input.step = "0.01"; // Décimales
    }

    // Cloner pour éviter les doublons d'event listeners
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    // Event listener
    newInput.addEventListener("change", (e) => {
      this.parent.style.setProperty(cssProperty, e.target.value);
      this.onUpdate();
      console.log(`✅ ${cssProperty}: ${e.target.value}`);
    });
  }

  // Génère le code pour l'élément
  generateCode(parent, shouldCopy = false) {
    const codeGenerator = new CodeGenerator();
    const code = codeGenerator.generate(parent);

    // Affiche le code
    const showCode = document.querySelector("#showCode");
    const cssOutput = document.querySelector(".cssoutput");

    if (showCode) showCode.value = code;
    if (cssOutput) cssOutput.textContent = code;

    console.log(code);

    // Ne copie que si explicitement demandé
    if (shouldCopy) {
      this.copyToClipboard(code);
    }
  }

  // Copie dans le presse-papier
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      const copyElement = document.querySelector(".copy");
      if (copyElement) {
        copyElement.classList.add("copied");
        setTimeout(() => copyElement.classList.remove("copied"), 1000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback pour les anciens navigateurs
      const input = document.querySelector("#showCode");
      if (input) {
        input.select();
        document.execCommand("copy");
      }
    }
  }
}

export { ImageManipulator };
