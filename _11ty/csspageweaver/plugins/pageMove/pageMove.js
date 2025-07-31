import { Handler } from "/csspageweaver/lib/paged.esm.js";

export default class pageMove extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.elementsToMove = new Set();
        this.moveElementsClone = new Set();
        this.hasProcessed = false;
    }

    onDeclaration(declaration, dItem, dList, rule) {
        // Lire uniquement la propriété CSS --page-move-to
        if (declaration.property === "--page-move-to") {
            let selector = csstree.generate(rule.ruleNode.prelude);
            // console.log(`🎯 CSS Selector trouvé: ${selector} avec --page-move-to: ${declaration.value.value}`);
            
            this.elementsToMove.add(JSON.stringify({
                selector: selector,
                targetPage: parseInt(declaration.value.value)
            }));
        }
    }

    afterParsed(parsed) {
        // console.log("PageMove Plugin chargé - version simplifiée");
        
        // Traiter les éléments CSS
        for (let moveDataStr of this.elementsToMove) {
            const moveData = JSON.parse(moveDataStr);
            let elements = parsed.querySelectorAll(moveData.selector);
            // console.log(`Trouvé ${elements.length} éléments pour selector: ${moveData.selector}`);
            
            if (elements.length > 0) {
                const element = elements[0];
                element.classList.add("pagedjs_move-element");
                
                // Stocker la page d'origine en cherchant dans quelle page l'élément se trouve
                moveData.originalPage = this.findElementOriginalPage(element);
                
                const clone = element.cloneNode(true);
                moveData.elemClone = clone.outerHTML;
                
                element.remove();
                
                // console.log(`Élément retiré du flux de page ${moveData.originalPage} vers page ${moveData.targetPage}`);
            }
            
            this.moveElementsClone.add(JSON.stringify(moveData));
        }

        // Traiter les attributs HTML data-page-move-to
        const elementsWithData = parsed.querySelectorAll('[data-page-move-to]');
        elementsWithData.forEach(element => {
            const targetPage = parseInt(element.getAttribute('data-page-move-to'));
            
            const moveData = {
                targetPage: targetPage,
                originalPage: this.findElementOriginalPage(element),
                elemClone: element.cloneNode(true).outerHTML
            };
            
            element.remove();
            this.moveElementsClone.add(JSON.stringify(moveData));
            // console.log(`Élément HTML retiré du flux de page ${moveData.originalPage} vers page ${targetPage}`);
        });

        // Support des styles inline
        const inlineElements = parsed.querySelectorAll('[style*="--page-move-to"]');
        inlineElements.forEach(element => {
            const style = element.getAttribute('style');
            const match = style.match(/--page-move-to:\s*(\d+)/);
            
            if (match) {
                const targetPage = parseInt(match[1]);
                
                const moveData = {
                    targetPage: targetPage,
                    originalPage: this.findElementOriginalPage(element),
                    elemClone: element.cloneNode(true).outerHTML
                };
                
                element.remove();
                this.moveElementsClone.add(JSON.stringify(moveData));
                // console.log(`Élément style inline retiré du flux de page ${moveData.originalPage} vers page ${targetPage}`);
            }
        });
    }

    findElementOriginalPage(element) {
        // Essayer de déterminer dans quelle page l'élément était destiné à apparaître
        // En regardant sa position relative dans le contenu
        const allElements = document.querySelectorAll('section, article, div, p, h1, h2, h3, h4, h5, h6');
        const elementIndex = Array.from(allElements).indexOf(element);
        
        if (elementIndex === -1) return 'unknown';
        
        // Estimation approximative : 3-5 éléments par page
        const estimatedPage = Math.floor(elementIndex / 4) + 1;
        return estimatedPage;
    }

    renderNode(clone, node) {
        // Sécurité au cas où un élément échapperait au nettoyage
        if (node.nodeType === 1 && node.classList.contains("pagedjs_move-element")) {
            // console.log(`Masquage élément résiduel`);
            clone.style.display = "none";
        }
    }

    afterPageLayout(pageElement, page, breakToken, chunker) {
        let pageNum = pageElement.id.split('page-')[1];
        pageNum = parseInt(pageNum);
        
        // ✅ OPTIMISATION: Vérifier seulement s'il y a des éléments pour cette page
        const elementsForThisPage = [];
        this.moveElementsClone.forEach(entry => {
            const obj = JSON.parse(entry);
            let triggerPage = obj.targetPage - 1;
            
            if (triggerPage === pageNum) {
                elementsForThisPage.push(obj);
            }
        });
        
        // Ne traiter que s'il y a des éléments pour cette page
        if (elementsForThisPage.length === 0) {
            return; // Sortie rapide
        }
        
        // console.log(`Page ${pageNum}: ${elementsForThisPage.length} éléments à insérer`);
        
        elementsForThisPage.forEach(obj => {
            let targetedPage = obj.targetPage;
            let elem = obj.elemClone;
            
            // console.log(`TRIGGER! Création page ${targetedPage}`);
            
            let container = document.createElement("div");
            container.classList.add("pagedjs_moved-content");
            container.innerHTML = elem;
            
            let newPage = chunker.addPage();
            
            // Forcer l'attribution du folio
            newPage.element.setAttribute('data-page-number', targetedPage);
            newPage.element.id = `page-${targetedPage}`;
            // console.log(`Folio ${targetedPage} assigné`);
            
            // Activer les marges pour les folios
            this.enablePageMargins(newPage.element);
            
            newPage.element
                .querySelector(".pagedjs_page_content")
                .insertAdjacentElement("afterbegin", container);
            newPage.element.classList.add("pagedjs_page_moved");
            
            console.log(`Element deplace en page ${targetedPage}`);
        });
        
        // ✅ Renuméroter UNE SEULE FOIS à la fin si des pages ont été créées
        if (elementsForThisPage.length > 0) {
            setTimeout(() => {
                this.renumberAllPages();
            }, 0);
        }
    }

    renumberAllPages() {
        // console.log(`🔢 Renumérotation globale de toutes les pages`);
        
        const allPages = document.querySelectorAll('.pagedjs_page');
        
        allPages.forEach((page, index) => {
            const newPageNumber = index + 1;
            
            page.setAttribute('data-page-number', newPageNumber);
            page.dataset.pageNumber = newPageNumber;
            page.id = `page-${newPageNumber}`;
            
            // Réassigner les classes gauche/droite selon la nouvelle position
            page.classList.remove('pagedjs_left_page', 'pagedjs_right_page');
            if (newPageNumber % 2 === 1) {
                page.classList.add('pagedjs_right_page');
            } else {
                page.classList.add('pagedjs_left_page');
            }
        });
        
        const totalPages = allPages.length;
        document.documentElement.style.setProperty('--pagedjs-page-count', totalPages);
        
        // console.log(`✅ ${totalPages} pages renumérotées avec folios continus`);
    }

    enablePageMargins(pageElement) {
        // console.log(`👁️ Activation des marges pour affichage des folios`);
        
        // Ajouter hasContent à TOUTES les zones de marge
        const marginElements = pageElement.querySelectorAll('.pagedjs_margin');
        
        marginElements.forEach((margin, index) => {
            margin.classList.add('hasContent');
            // console.log(`📄 Marge ${index + 1} activée`);
        });
        
        // console.log(`✅ ${marginElements.length} marges activées pour folios`);
    }
}