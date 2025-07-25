// Plugin PagedJS pour le réordonnancement de pages
// Permet à l'utilisateur de spécifier "page X avant/après page Y"

class PageReorderHandler extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.reorderRules = new Map(); // Stocke les règles de réordonnancement
        this.originalPageOrder = []; // Ordre original des pages
        this.newPageOrder = []; // Nouvel ordre calculé
        this.ui = null; // Interface utilisateur
    }

    // === HOOKS PAGEDJS ===

    // 1. Avant parsing : récupérer les règles CSS/HTML
    beforeParsed(content) {
        this.parseReorderRules(content);
    }

    // 2. Après rendu : manipuler l'ordre des pages
    afterRendered(pages) {
        console.log(`📄 Pages rendues : ${pages.length}`);
        this.originalPageOrder = this.capturePageOrder(pages);
        
        if (this.reorderRules.size > 0) {
            this.reorderPages();
        }
        
        // Activer l'interface utilisateur
        this.createReorderUI();
    }

    // === PARSING DES RÈGLES ===

    parseReorderRules(content) {
        // Méthode 1: CSS Custom Properties
        this.parseFromCSS();
        
        // Méthode 2: Attributs HTML data-*
        this.parseFromHTML(content);
        
        // Méthode 3: Configuration JavaScript
        this.parseFromConfig();
    }

    parseFromCSS() {
        // Rechercher des règles CSS comme :
        // .chapter-5 { --page-move-after: 2; }
        // .chapter-3 { --page-move-before: 7; }
        
        const sheets = document.styleSheets;
        for (let sheet of sheets) {
            try {
                for (let rule of sheet.cssRules) {
                    if (rule.style) {
                        const moveAfter = rule.style.getPropertyValue('--page-move-after');
                        const moveBefore = rule.style.getPropertyValue('--page-move-before');
                        
                        if (moveAfter) {
                            this.addReorderRule('after', rule.selectorText, parseInt(moveAfter));
                        }
                        if (moveBefore) {
                            this.addReorderRule('before', rule.selectorText, parseInt(moveBefore));
                        }
                    }
                }
            } catch (e) {
                // Ignorer les erreurs de CORS
            }
        }
    }

    parseFromHTML(content) {
        // Rechercher des attributs comme :
        // <section data-page-move-after="2">...</section>
        // <div data-page-move-before="5">...</div>
        
        if (typeof content === 'string') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            content = doc.body;
        }
        
        const elementsWithMoveAfter = content.querySelectorAll('[data-page-move-after]');
        const elementsWithMoveBefore = content.querySelectorAll('[data-page-move-before]');
        
        elementsWithMoveAfter.forEach(el => {
            const targetPage = parseInt(el.dataset.pageMoveAfter);
            this.addReorderRule('after', el, targetPage);
        });
        
        elementsWithMoveBefore.forEach(el => {
            const targetPage = parseInt(el.dataset.pageMoveBefore);
            this.addReorderRule('before', el, targetPage);
        });
    }

    parseFromConfig() {
        // Configuration JavaScript globale
        if (window.PageReorderConfig) {
            window.PageReorderConfig.forEach(rule => {
                this.addReorderRule(rule.direction, rule.selector, rule.targetPage);
            });
        }
    }

    addReorderRule(direction, selector, targetPage) {
        const rule = {
            direction, // 'after' ou 'before'
            selector,
            targetPage,
            sourceElement: typeof selector === 'string' ? null : selector
        };
        
        this.reorderRules.set(`${direction}-${targetPage}-${Date.now()}`, rule);
        console.log(`📝 Règle ajoutée : ${direction} page ${targetPage}`, rule);
    }

    // === CAPTURE ET MANIPULATION DES PAGES ===

    capturePageOrder(pages) {
        const pageOrder = [];
        
        pages.forEach((page, index) => {
            const pageElement = page.element || page;
            pageOrder.push({
                index: index + 1,
                id: pageElement.id,
                element: pageElement,
                content: this.getPageContent(pageElement)
            });
        });
        
        return pageOrder;
    }

    getPageContent(pageElement) {
        const contentArea = pageElement.querySelector('.pagedjs_area');
        return contentArea ? contentArea.innerHTML : '';
    }

    reorderPages() {
        // Identifier quelles pages doivent être déplacées
        const pagesToMove = this.identifyPagesToMove();
        
        // Calculer le nouvel ordre
        this.newPageOrder = this.calculateNewOrder(pagesToMove);
        
        // Appliquer le réordonnancement
        this.applyReordering();
    }

    identifyPagesToMove() {
        const pagesToMove = new Map();
        
        this.reorderRules.forEach((rule, key) => {
            let sourcePageIndex;
            
            if (rule.sourceElement) {
                // Trouver la page contenant cet élément
                sourcePageIndex = this.findPageContainingElement(rule.sourceElement);
            } else if (typeof rule.selector === 'string') {
                // Trouver la page contenant un élément matchant ce sélecteur
                sourcePageIndex = this.findPageContainingSelector(rule.selector);
            }
            
            if (sourcePageIndex !== -1) {
                pagesToMove.set(sourcePageIndex, {
                    ...rule,
                    sourcePageIndex
                });
            }
        });
        
        return pagesToMove;
    }

    findPageContainingElement(element) {
        for (let i = 0; i < this.originalPageOrder.length; i++) {
            const page = this.originalPageOrder[i];
            if (page.element.contains(element)) {
                return i;
            }
        }
        return -1;
    }

    findPageContainingSelector(selector) {
        for (let i = 0; i < this.originalPageOrder.length; i++) {
            const page = this.originalPageOrder[i];
            if (page.element.querySelector(selector)) {
                return i;
            }
        }
        return -1;
    }

    calculateNewOrder(pagesToMove) {
        const newOrder = [...this.originalPageOrder];
        
        // Trier les mouvements par ordre de priorité
        const sortedMoves = Array.from(pagesToMove.values()).sort((a, b) => {
            return a.targetPage - b.targetPage;
        });
        
        sortedMoves.forEach(move => {
            const sourcePage = newOrder[move.sourcePageIndex];
            
            // Retirer la page de sa position actuelle
            newOrder.splice(move.sourcePageIndex, 1);
            
            // Calculer la nouvelle position
            let insertIndex;
            if (move.direction === 'after') {
                insertIndex = Math.min(move.targetPage, newOrder.length);
            } else { // 'before'
                insertIndex = Math.max(0, move.targetPage - 1);
            }
            
            // Insérer à la nouvelle position
            newOrder.splice(insertIndex, 0, sourcePage);
        });
        
        return newOrder;
    }

    applyReordering() {
        const pagesContainer = document.querySelector('.pagedjs_pages');
        if (!pagesContainer) return;
        
        // Créer un fragment pour réorganiser
        const fragment = document.createDocumentFragment();
        
        // Ajouter les pages dans le nouvel ordre
        this.newPageOrder.forEach((pageInfo, newIndex) => {
            const pageElement = pageInfo.element;
            
            // Mettre à jour l'ID et les classes de page
            pageElement.id = `page-${newIndex + 1}`;
            pageElement.className = pageElement.className.replace(/pagedjs_\w+_page/g, '');
            pageElement.classList.add(`pagedjs_${this.getPageType(newIndex + 1)}_page`);
            
            fragment.appendChild(pageElement);
        });
        
        // Remplacer le contenu
        pagesContainer.innerHTML = '';
        pagesContainer.appendChild(fragment);
        
        console.log(`🔄 Pages réordonnées : ${this.newPageOrder.length} pages`);
        this.updatePageCounters();
    }

    getPageType(pageNumber) {
        if (pageNumber === 1) return 'first';
        if (pageNumber % 2 === 0) return 'left';
        return 'right';
    }

    updatePageCounters() {
        // Mettre à jour tous les compteurs de pages
        document.querySelectorAll('.pagedjs_page').forEach((page, index) => {
            const pageNumber = index + 1;
            
            // Mettre à jour les variables CSS
            page.style.setProperty('--pagedjs-page-counter', pageNumber);
            
            // Mettre à jour les éléments de compteur
            page.querySelectorAll('[data-page-counter]').forEach(counter => {
                counter.textContent = pageNumber;
            });
        });
    }

    // === INTERFACE UTILISATEUR ===

    createReorderUI() {
        if (this.ui) return; // Déjà créée
        
        this.ui = document.createElement('div');
        this.ui.id = 'page-reorder-ui';
        this.ui.innerHTML = `
            <div class="page-reorder-panel">
                <h3>🔄 Réordonnancement de Pages</h3>
                <div class="page-list" id="page-list"></div>
                <div class="actions">
                    <button id="apply-reorder">Appliquer</button>
                    <button id="reset-order">Réinitialiser</button>
                    <button id="export-config">Exporter Config</button>
                </div>
            </div>
        `;
        
        this.addUIStyles();
        document.body.appendChild(this.ui);
        this.setupUIEvents();
        this.renderPageList();
    }

    addUIStyles() {
        if (document.querySelector('#page-reorder-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'page-reorder-styles';
        style.textContent = `
            #page-reorder-ui {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: system-ui, sans-serif;
            }
            
            .page-reorder-panel {
                padding: 16px;
            }
            
            .page-reorder-panel h3 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .page-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 12px;
            }
            
            .page-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border: 1px solid #eee;
                border-radius: 4px;
                margin-bottom: 4px;
                cursor: grab;
                background: #f9f9f9;
            }
            
            .page-item:hover {
                background: #f0f0f0;
            }
            
            .page-item.dragging {
                opacity: 0.5;
            }
            
            .page-number {
                font-weight: bold;
                margin-right: 8px;
                min-width: 30px;
            }
            
            .page-content {
                flex: 1;
                font-size: 12px;
                color: #666;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .actions {
                display: flex;
                gap: 8px;
            }
            
            .actions button {
                flex: 1;
                padding: 6px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                font-size: 12px;
            }
            
            .actions button:hover {
                background: #f0f0f0;
            }
            
            .actions button:active {
                background: #e0e0e0;
            }
        `;
        
        document.head.appendChild(style);
    }

    setupUIEvents() {
        // Drag & Drop pour réordonner
        this.setupDragAndDrop();
        
        // Boutons d'action
        document.getElementById('apply-reorder').addEventListener('click', () => {
            this.applyUIReordering();
        });
        
        document.getElementById('reset-order').addEventListener('click', () => {
            this.resetToOriginalOrder();
        });
        
        document.getElementById('export-config').addEventListener('click', () => {
            this.exportConfiguration();
        });
    }

    setupDragAndDrop() {
        const pageList = document.getElementById('page-list');
        
        pageList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('page-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.pageIndex);
            }
        });
        
        pageList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        pageList.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const dropTarget = e.target.closest('.page-item');
            
            if (dropTarget && draggedIndex !== undefined) {
                const targetIndex = parseInt(dropTarget.dataset.pageIndex);
                this.movePageInUI(draggedIndex, targetIndex);
            }
        });
        
        pageList.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    }

    renderPageList() {
        const pageList = document.getElementById('page-list');
        const currentOrder = this.newPageOrder.length > 0 ? this.newPageOrder : this.originalPageOrder;
        
        pageList.innerHTML = currentOrder.map((page, index) => {
            const preview = this.getPagePreview(page);
            return `
                <div class="page-item" draggable="true" data-page-index="${index}">
                    <div class="page-number">${index + 1}</div>
                    <div class="page-content">${preview}</div>
                </div>
            `;
        }).join('');
    }

    getPagePreview(page) {
        const content = page.element.querySelector('.pagedjs_area');
        if (!content) return 'Page vide';
        
        const text = content.textContent.trim();
        const title = content.querySelector('h1, h2, h3');
        
        if (title) {
            return title.textContent.trim().substring(0, 40) + '...';
        }
        
        return text.substring(0, 40) + '...';
    }

    // === MÉTHODES D'ACTION ===

    movePageInUI(fromIndex, toIndex) {
        const currentOrder = this.newPageOrder.length > 0 ? this.newPageOrder : [...this.originalPageOrder];
        
        const movedPage = currentOrder.splice(fromIndex, 1)[0];
        currentOrder.splice(toIndex, 0, movedPage);
        
        this.newPageOrder = currentOrder;
        this.renderPageList();
    }

    applyUIReordering() {
        if (this.newPageOrder.length > 0) {
            this.applyReordering();
        }
    }

    resetToOriginalOrder() {
        this.newPageOrder = [];
        this.reorderRules.clear();
        
        // Restaurer l'ordre original dans le DOM
        const pagesContainer = document.querySelector('.pagedjs_pages');
        if (pagesContainer) {
            const fragment = document.createDocumentFragment();
            
            this.originalPageOrder.forEach((pageInfo, index) => {
                pageInfo.element.id = `page-${index + 1}`;
                fragment.appendChild(pageInfo.element);
            });
            
            pagesContainer.innerHTML = '';
            pagesContainer.appendChild(fragment);
            this.updatePageCounters();
        }
        
        this.renderPageList();
    }

    exportConfiguration() {
        const config = [];
        const currentOrder = this.newPageOrder.length > 0 ? this.newPageOrder : this.originalPageOrder;
        
        currentOrder.forEach((page, newIndex) => {
            const originalIndex = this.originalPageOrder.findIndex(p => p.id === page.id);
            if (originalIndex !== newIndex) {
                config.push({
                    direction: 'after',
                    sourcePageOriginal: originalIndex + 1,
                    targetPage: newIndex + 1,
                    selector: `#${page.id}` // ou un autre sélecteur plus approprié
                });
            }
        });
        
        const configText = `
// Configuration de réordonnancement PagedJS
window.PageReorderConfig = ${JSON.stringify(config, null, 2)};

// Ou en CSS :
${config.map(rule => `
/* Page ${rule.sourcePageOriginal} vers position ${rule.targetPage} */
${rule.selector} { --page-move-${rule.direction}: ${rule.targetPage}; }
`).join('')}
`;
        
        console.log('📋 Configuration exportée :', configText);
        
        // Copier dans le presse-papier si possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(configText);
            alert('Configuration copiée dans le presse-papier !');
        } else {
            // Fallback : afficher dans une modal
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 20000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
                        <h3>Configuration de réordonnancement</h3>
                        <textarea style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${configText}</textarea>
                        <button onclick="this.closest('div').parentElement.remove()">Fermer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }
}

// === UTILISATION ===

// Enregistrer le handler
Paged.registerHandlers(PageReorderHandler);

// Configuration globale (optionnelle)
window.PageReorderConfig = [
    {
        direction: 'after',
        selector: '.chapter-conclusion',
        targetPage: 2
    },
    {
        direction: 'before', 
        selector: '.chapter-intro',
        targetPage: 1
    }
];

console.log('🔄 Plugin PagedJS Reorder chargé !');