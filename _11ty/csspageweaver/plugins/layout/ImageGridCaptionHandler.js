// Extension pour gérer les légendes dans imagegrid lors du redimensionnement

class ImageGridCaptionHandler {
    constructor() {
        this.captionBehavior = 'fixed'; // 'fixed', 'follow', 'hide', 'external'
    }

    // Appelé lors du redimensionnement/repositionnement de l'image
    updateCaptionPosition(parent) {
        const figcaption = parent.querySelector('figcaption');
        if (!figcaption) return;

        const behavior = parent.dataset.captionBehavior || this.captionBehavior;

        switch (behavior) {
            case 'follow':
                this.makeCaptionFollowImage(parent, figcaption);
                break;
            case 'hide':
                this.hideCaptionDuringResize(parent, figcaption);
                break;
            case 'external':
                this.moveCaptionOutside(parent, figcaption);
                break;
            case 'fixed':
            default:
                // Légende reste fixe en bas du conteneur
                break;
        }
    }

    makeCaptionFollowImage(parent, figcaption) {
        const img = parent.querySelector('img');
        if (!img) return;

        // Récupérer les valeurs CSS
        const imgY = parseFloat(parent.style.getPropertyValue('--img-y') || 0);
        const imgW = parseFloat(parent.style.getPropertyValue('--img-w') || 100);
        const imgX = parseFloat(parent.style.getPropertyValue('--img-x') || 0);

        // Calculer la position de la légende
        const imgHeight = img.offsetHeight;
        const parentHeight = parent.offsetHeight;
        const imgHeightPercent = (imgHeight / parentHeight) * 100;

        // Positionner la légende juste sous l'image
        figcaption.style.position = 'absolute';
        figcaption.style.top = `${imgY + imgHeightPercent}%`;
        figcaption.style.left = `${imgX}%`;
        figcaption.style.width = `${imgW}%`;
        figcaption.style.transform = 'translateY(10px)';
    }

    hideCaptionDuringResize(parent, figcaption) {
        parent.classList.add('is-resizing');
        
        // Réafficher après un délai
        clearTimeout(this.showCaptionTimeout);
        this.showCaptionTimeout = setTimeout(() => {
            parent.classList.remove('is-resizing');
        }, 500);
    }

    moveCaptionOutside(parent, figcaption) {
        // Créer un conteneur wrapper si nécessaire
        if (!parent.parentElement.classList.contains('imagegrid-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'imagegrid-wrapper';
            parent.parentNode.insertBefore(wrapper, parent);
            wrapper.appendChild(parent);
            wrapper.appendChild(figcaption);
        }
    }
}