// Gestionnaire pour manipulation d'images
class DragZoomHandler {
    constructor(chunker, polisher, caller) {
        // Compatibilité avec Paged.Handler si disponible
        if (typeof Paged !== 'undefined' && Paged.Handler) {
            Object.setPrototypeOf(this, Paged.Handler.prototype);
            Paged.Handler.call(this, chunker, polisher, caller);
        }
        this.manipulator = new ImageManipulator();
    }

    afterPreview(pages) {
        this.initializeManipulator();
    }

    afterRendered(pages) {
        this.createControlsUI();
    }

    initializeManipulator() {
        // Délégation d'événements sur document
        document.addEventListener('mouseover', (e) => this.manipulator.handleMouseOver(e));
        document.addEventListener('mouseout', (e) => this.manipulator.handleMouseOut(e));
        document.addEventListener('mousedown', (e) => this.manipulator.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.manipulator.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.manipulator.handleDragEnd(e));
        document.addEventListener('wheel', (e) => this.manipulator.handleWheel(e), { passive: false });
        document.addEventListener('keydown', (e) => this.manipulator.handleArrowKeys(e));

        const copyButton = document.querySelector('.copy .button');
        if (copyButton) {
            copyButton.addEventListener('click', () => this.handleCopyClick());
        }
    }

    handleCopyClick() {
        const content = document.querySelector('.cssoutput');
        if (content) {
            this.manipulator.copyToClipboard(content.textContent);
        }
    }

    createControlsUI() {
        const html = this.getControlsHTML();
        const interfaceHeader = document.querySelector("#interface-header");
        if (!interfaceHeader) return;

        const tabs = interfaceHeader.querySelectorAll(".tab");
        const lastTab = tabs[tabs.length - 1];
        if (lastTab) {
            lastTab.insertAdjacentHTML("afterend", html);
        }
    }

    getControlsHTML() {
        return `
        <div class="tab" id="position" data-shortCode="">
            <input type="checkbox" id="rd1" name="rd" class="input-pgjs_Img">
            <label class="tab-label" id="label_rd1" for="rd1" data-name="Layout"></label>
            <div class="gjs-sm-properties tab-content">
                <!-- Interface controls HTML -->
            </div>
        </div>`;
    }
}

export { DragZoomHandler };