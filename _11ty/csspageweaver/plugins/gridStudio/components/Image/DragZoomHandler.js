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




}

export { DragZoomHandler };