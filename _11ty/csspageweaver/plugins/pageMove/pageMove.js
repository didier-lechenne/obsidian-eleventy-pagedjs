import { Handler } from "/csspageweaver/lib/paged.esm.js";

export default class pageMove extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.moveOperations = [];
        this.hasProcessed = false;
    }

    afterPageLayout(pageElement, page, breakToken) {
        const pageNumber = parseInt(pageElement.getAttribute("data-page-number"));
        this.collectMoveRules(pageElement, pageNumber);
    }

    collectMoveRules(pageElement, pageNumber) {
        this.parseHTML(pageElement, pageNumber);
    }

    parseHTML(pageElement, pageNumber) {
        const elementsToMoveAfter = pageElement.querySelectorAll('[data-page-move-after]');
        elementsToMoveAfter.forEach(element => {
            const targetPageNum = parseInt(element.getAttribute('data-page-move-after'));
            this.moveOperations.push({
                sourcePage: pageNumber,
                targetPage: targetPageNum + 1
            });
        });

        const elementsToMoveBefore = pageElement.querySelectorAll('[data-page-move-before]');
        elementsToMoveBefore.forEach(element => {
            const targetPageNum = parseInt(element.getAttribute('data-page-move-before'));
            this.moveOperations.push({
                sourcePage: pageNumber,
                targetPage: targetPageNum
            });
        });

        pageElement.querySelectorAll('[style*="--page-move-"]').forEach(element => {
            const style = element.getAttribute('style');
            const moveAfter = style.match(/--page-move-after:\s*(\d+)/);
            const moveBefore = style.match(/--page-move-before:\s*(\d+)/);
            
            if (moveAfter) {
                this.moveOperations.push({
                    sourcePage: pageNumber,
                    targetPage: parseInt(moveAfter[1]) + 1
                });
            }
            if (moveBefore) {
                this.moveOperations.push({
                    sourcePage: pageNumber,
                    targetPage: parseInt(moveBefore[1])
                });
            }
        });
    }

    afterRendered(pages) {
        if (this.moveOperations.length > 0 && !this.hasProcessed) {
            this.performMoves();
            // this.regenerateTOC();
            this.hasProcessed = true;
        }
    }

    performMoves() {
        const groups = {};
        this.moveOperations.forEach(op => {
            if (!groups[op.targetPage]) groups[op.targetPage] = [];
            groups[op.targetPage].push(op.sourcePage);
        });

        Object.entries(groups).forEach(([targetStart, sourcePages]) => {
            const target = parseInt(targetStart);
            sourcePages.sort((a, b) => a - b);
            this.moveContentBlock(sourcePages, target);
        });
    }

    moveContentBlock(sourcePages, targetStart) {
        const savedContent = sourcePages.map(pageNum => {
            const page = document.getElementById(`page-${pageNum}`);
            const area = page?.querySelector('.pagedjs_area');
            return area ? area.innerHTML : '';
        });

        const blockSize = sourcePages.length;
        const minSource = Math.min(...sourcePages);
        
        const contentToShift = [];
        for (let i = targetStart; i < minSource; i++) {
            const page = document.getElementById(`page-${i}`);
            const area = page?.querySelector('.pagedjs_area');
            if (area) {
                contentToShift.push(area.innerHTML);
            }
        }
        
        contentToShift.forEach((content, index) => {
            const newPosition = targetStart + blockSize + index;
            const page = document.getElementById(`page-${newPosition}`);
            const area = page?.querySelector('.pagedjs_area');
            if (area) {
                area.innerHTML = content;
            }
        });

        savedContent.forEach((content, index) => {
            const targetPageNum = targetStart + index;
            const page = document.getElementById(`page-${targetPageNum}`);
            const area = page?.querySelector('.pagedjs_area');
            if (area) {
                area.innerHTML = content;
            }
        });
    }

    // regenerateTOC() {
    //     setTimeout(() => {
    //         const tocLinks = document.querySelectorAll('#list-toc-generated a[href^="#"]');
            
    //         tocLinks.forEach(link => {
    //             const href = link.getAttribute('href');
    //             const target = document.querySelector(href);
                
    //             if (target) {
    //                 // Trouver dans quelle page est l'élément
    //                 const page = target.closest('.pagedjs_page');
    //                 if (page) {
    //                     const pageNumber = page.getAttribute('data-page-number');
                        
    //                     // Remplacer target-counter par numéro réel
    //                     const existingSpan = link.querySelector('.page-number');
    //                     if (existingSpan) {
    //                         existingSpan.textContent = pageNumber;
    //                     } else {
    //                         const span = document.createElement('span');
    //                         span.className = 'page-number';
    //                         span.textContent = pageNumber;
    //                         span.style.float = 'right';
    //                         link.appendChild(span);
    //                     }
    //                 }
    //             }
    //         });
            
    //         // Désactiver target-counter CSS
    //         const style = document.createElement('style');
    //         style.textContent = `
    //             .toc-element a.toc-page-after::after { content: none !important; }
    //             .toc-element a.toc-page-before::before { content: none !important; }
    //         `;
    //         document.head.appendChild(style);
    //     }, 100);
    // }
}