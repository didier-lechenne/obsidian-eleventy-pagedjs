// Classe pour la gestion des contrôles d'image
class ImageControls {
    constructor(parent, img, onUpdate) {
        console.log('ImageControls constructor:', {parent, img, onUpdate});
        this.parent = parent;
        this.img = img;
        this.onUpdate = onUpdate;
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

    init() {
        this.setupPositionControls();
        this.setupActionControls();
    }

    setupPositionControls() {
        this.positions.forEach(pos => {
            const element = document.querySelector(`#${pos.id}`);
            if (element) {
                element.onclick = () => this.positionImage(pos.x, pos.y);
            }
        });
    }

    setupActionControls() {
        const fillBlock = document.querySelector("#remplir_bloc");
        const adjustContent = document.querySelector("#ajuster_contenu");

        if (fillBlock) {
            fillBlock.onclick = () => this.fillBlock();
        }
        if (adjustContent) {
            adjustContent.onclick = () => this.adjustContent();
        }
    }

    positionImage(alignX, alignY) {
        if (!this.img) return;
        
        const parentWidth = this.parent.offsetWidth;
        const parentHeight = this.parent.offsetHeight;
        const imgWidth = this.img.offsetWidth;
        const imgHeight = this.img.offsetHeight;

        const imgX = (parentWidth - imgWidth) * alignX / parentWidth * 100;
        const imgY = (parentHeight - imgHeight) * alignY / parentHeight * 100;

        this.parent.style.setProperty('--img-x', imgX);
        this.parent.style.setProperty('--img-y', imgY);
        this.onUpdate();
    }

    fillBlock() {
        this.parent.style.setProperty('--img-w', 100);
        this.positionImage(0.5, 0.5);
    }

    adjustContent() {
        if (!this.img || !this.img.naturalWidth || !this.img.naturalHeight) return;

        const parentWidth = this.parent.offsetWidth;
        const parentHeight = this.parent.offsetHeight;
        const aspectRatio = this.img.naturalWidth / this.img.naturalHeight;
        
        const newWidth = aspectRatio * parentHeight;
        const imgW = (newWidth / parentWidth) * 100;
        
        this.parent.style.setProperty('--img-w', imgW);
        this.parent.style.setProperty('--img-y', 0);
        
        // Centre horizontalement
        const imgWidth = (parentWidth * imgW / 100);
        const imgX = (parentWidth - imgWidth) / 2 / parentWidth * 100;
        this.parent.style.setProperty('--img-x', imgX);
        
        this.onUpdate();
    }
}

export { ImageControls };