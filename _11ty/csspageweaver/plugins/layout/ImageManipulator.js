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
            rows: 1
        };
    }

    // Trouve l'élément image dans la cible
    findImageElement(target) {
        if (target.tagName.toLowerCase() === 'img') {
            return target;
        }
        
        const figure = target.closest('figure, .resize, .image');
        return figure ? figure.querySelector('img') : null;
    }

    // Obtient le type de shortcode de l'élément
    getShortcodeType(element) {
        const types = [
            { selector: '.resize', name: 'resize' },
            { selector: '.image', name: 'image' },
            { selector: '.figure', name: 'figure' },
            { selector: '.insert', name: 'insert' }
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
        // parent.style.cursor = 'help';

        if (!parent.classList.contains('selected')) {
            parent.classList.add('hover');
        }

        if (e.shiftKey) {
            this.selectElement(parent, type);
        }
    }

    // Gère la sortie de la souris
    handleMouseOut(e) {
        const shortcodeInfo = this.getShortcodeType(e.target);
        if (shortcodeInfo) {
            shortcodeInfo.parent.classList.remove('hover');
        }
    }

    // Sélectionne un élément
    selectElement(parent, type) {

        // console.log('Element sélectionné:', parent);
        // console.log('ID de l\'élément:', this.getImageId(parent));
        // console.log('Type:', type);

        // Désélectionne tous les autres éléments de la section
        const section = parent.closest('section');
        if (section) {
            section.querySelectorAll('.selected').forEach(elem => {
                elem.classList.remove('selected');
            });
        }

        parent.classList.remove('hover');
        parent.classList.add('selected');
        
        // Coche la checkbox
        const checkbox = document.querySelector("#rd1");
        if (checkbox) checkbox.checked = true;

        // Met à jour la configuration de la grille
        this.updateGridConfig(section);

        // Met à jour l'interface
        const cssProps = this.getCSSProperties(parent);
        const imgId = this.getImageId(parent);
        const img = this.findImageElement(parent);
        
        this.updateUI(imgId, cssProps, img, type);
        this.setupControlListeners(parent, imgId, img);
        
        // Génère le code ET le copie lors de la sélection
        this.generateCode(parent, false);
    }

    // Met à jour la configuration de la grille
    updateGridConfig(section) {
        if (!section) return;

        const computedStyle = getComputedStyle(section);
        let cols = computedStyle.getPropertyValue('--grid-col').trim();
        let rows = computedStyle.getPropertyValue('--grid-row').trim();

        // Valeurs par défaut si non définies
        cols = cols || '12';
        rows = rows || '1';

        this.gridConfig = { 
            cols: parseInt(cols), 
            rows: parseInt(rows) 
        };
        
        this.updateInputMaxValues();
    }

    // Met à jour les valeurs max des inputs
    updateInputMaxValues() {
        const inputs = [
            { id: '#col', max: this.gridConfig.cols },
            { id: '#width', max: this.gridConfig.cols },
            { id: '#printcol', max: this.gridConfig.cols },
            { id: '#printwidth', max: this.gridConfig.cols },
            { id: '#printrow', max: this.gridConfig.rows },
            { id: '#printheight', max: this.gridConfig.rows }
        ];

        inputs.forEach(input => {
            const element = document.querySelector(input.id);
            if (element) element.setAttribute('max', input.max);
        });
    }

    // Récupère les propriétés CSS
    getCSSProperties(parent) {
        const properties = [
            'col', 'width', 'printcol', 'printwidth', 
            'printrow', 'printheight', 'alignself', 
            'figcaption_arrow', 'imgX', 'imgY', 'imgW'
        ];

        const result = {};
        properties.forEach(prop => {
            result[prop] = parent.style.getPropertyValue(`--${prop}`) || '';
        });

        return result;
    }

    // Récupère l'ID de l'image
    getImageId(parent) {
        const dataId = parent.getAttribute('data-id');
        console.log("data-id: ", dataId);
        if (!dataId) return '0';
        
        const match = dataId.match(/\d+$/);
        return match ? match[0] : '0';
    }

    // Gère le début du glisser
    handleDragStart(e) {
        if (!e.shiftKey) return;

        this.currentImage = this.findImageElement(e.target);
        if (!this.currentImage) return;

        this.isDragging = true;
        this.prevX = e.clientX;
        this.prevY = e.clientY;
        this.currentImage.style.cursor = 'grab';
        
        e.preventDefault();
    }

    // Gère le déplacement
    handleDragMove(e) {
        if (!this.isDragging || !this.currentImage || !e.shiftKey) return;

        e.preventDefault();
        
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

        const currentX = parseFloat(getComputedStyle(parent).getPropertyValue("--img-x")) || 0;
        const currentY = parseFloat(getComputedStyle(parent).getPropertyValue("--img-y")) || 0;

        const newX = currentX + (deltaX / parentWidth * 100);
        const newY = currentY + (deltaY / parentHeight * 100);

        parent.style.setProperty("--img-x", newX);
        parent.style.setProperty("--img-y", newY);
    }

    // Gère la fin du glisser
    handleDragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        if (this.currentImage) {
            this.currentImage.style.cursor = 'default';
            const parent = this.currentImage.closest('figure, .resize, .image');
            if (parent) {
                this.generateCode(parent);
            }
        }
    }

    // Gère le zoom avec la molette
    handleWheel(e) {
        if (!e.shiftKey || !e.target.tagName || e.target.tagName.toLowerCase() !== 'img') return;

        e.preventDefault();
        
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        const scaleAmount = 1.0 + (delta * 5 / 90.0);
        
        this.zoomImage(e.target, scaleAmount, e.layerX / e.target.width, e.layerY / e.target.height);
        
        // Curseur de zoom
        e.target.style.cursor = delta > 0 ? 'zoom-in' : 'zoom-out';
        
        // Reset du curseur après un délai
        clearTimeout(this.resetCursorTimeout);
        this.resetCursorTimeout = setTimeout(() => {
            // e.target.style.cursor = 'help';
            this.generateCode(e.target.closest('figure, .resize, .image'));
        }, 500);
    }

    // Zoom l'image
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

    // Gère les touches fléchées
    handleArrowKeys(e) {
        if (!this.currentImage || !e.shiftKey) return;
        
        const moves = {
            'ArrowUp': [0, -1],
            'ArrowDown': [0, 1],
            'ArrowLeft': [-1, 0],
            'ArrowRight': [1, 0]
        };
        
        const move = moves[e.key];
        if (move) {
            e.preventDefault();
            this.translateImage(...move);
            const parent = this.currentImage.closest('figure, .resize, .image');
            if (parent) {
                this.generateCode(parent);
            }
        }
    }

    // Met à jour l'interface utilisateur
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

    // Configure les écouteurs pour les contrôles
    setupControlListeners(parent, imgId, img) {
        const controls = new ImageControls(parent, img, () => {
            // Génère le code ET le copie quand on utilise les contrôles
            this.generateCode(parent, true);
        });
        controls.init();
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
            console.error('Failed to copy:', err);
            // Fallback pour les anciens navigateurs
            const input = document.querySelector("#showCode");
            if (input) {
                input.select();
                document.execCommand('copy');
            }
        }
    }
}

export { ImageManipulator };
