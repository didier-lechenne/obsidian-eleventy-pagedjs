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
        this.parseCSS(pageElement, pageNumber);
        this.parseHTML(pageElement, pageNumber);
    }

    parseCSS(pageElement, pageNumber) {
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.style) {
                            const moveAfter = rule.style.getPropertyValue('--page-move-after');
                            const moveBefore = rule.style.getPropertyValue('--page-move-before');
                            
                            if ((moveAfter || moveBefore) && pageElement.querySelector(rule.selectorText)) {
                                if (moveAfter) {
                                    this.moveOperations.push({
                                        sourcePage: pageNumber,
                                        targetPage: parseInt(moveAfter) + 1
                                    });
                                }
                                if (moveBefore) {
                                    this.moveOperations.push({
                                        sourcePage: pageNumber,
                                        targetPage: parseInt(moveBefore)
                                    });
                                }
                            }
                        }
                    });
                } catch (e) {}
            });
        } catch (e) {}
    }

    parseHTML(pageElement, pageNumber) {
        // Attributs data-*
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

        // Styles inline
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
}