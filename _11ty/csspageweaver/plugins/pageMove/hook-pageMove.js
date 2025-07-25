// Plugin PagedJS - Déplacement de pages

import { Handler } from '/csspageweaver/lib/paged.esm.js';


class pageMove extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
        this.moveRules = [];
    }

    beforeParsed(content) {
        this.collectMoveRules(content);
    }

    afterRendered(pages) {
        if (this.moveRules.length > 0) {
            this.movePages();
        }
    }

    collectMoveRules(content) {
        // CSS: .class { --page-move-after: 3; }
        this.parseCSS();
        
        // HTML: data-page-move-after="2"
        this.parseHTML(content);
        
        // JS: window.PageMoveConfig
        if (window.PageMoveConfig) {
            this.moveRules.push(...window.PageMoveConfig);
        }
    }

    parseCSS() {
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                Array.from(sheet.cssRules).forEach(rule => {
                    if (rule.style) {
                        const moveAfter = rule.style.getPropertyValue('--page-move-after');
                        const moveBefore = rule.style.getPropertyValue('--page-move-before');
                        
                        if (moveAfter) {
                            this.moveRules.push({
                                selector: rule.selectorText,
                                direction: 'after',
                                targetPage: parseInt(moveAfter)
                            });
                        }
                        if (moveBefore) {
                            this.moveRules.push({
                                selector: rule.selectorText,
                                direction: 'before',
                                targetPage: parseInt(moveBefore)
                            });
                        }
                    }
                });
            });
        } catch (e) {}
    }

    parseHTML(content) {
        const doc = typeof content === 'string' ? 
            new DOMParser().parseFromString(content, 'text/html') : document;
            
        doc.querySelectorAll('[data-page-move-after]').forEach(el => {
            this.moveRules.push({
                element: el,
                direction: 'after',
                targetPage: parseInt(el.dataset.pageMoveAfter)
            });
        });
        
        doc.querySelectorAll('[data-page-move-before]').forEach(el => {
            this.moveRules.push({
                element: el,
                direction: 'before',
                targetPage: parseInt(el.dataset.pageMoveBefore)
            });
        });
    }

    movePages() {
        const pages = Array.from(document.querySelectorAll('.pagedjs_page'));
        const moves = this.calculateMoves(pages);
        
        if (moves.length === 0) return;
        
        const movedPages = this.applyMoves(pages, moves);
        this.updateDOM(movedPages);
        this.updatePageNumbers();
    }

    calculateMoves(pages) {
        const moves = [];
        
        this.moveRules.forEach(rule => {
            const sourcePageIndex = this.findPageIndex(pages, rule);
            
            if (sourcePageIndex !== -1) {
                moves.push({
                    sourceIndex: sourcePageIndex,
                    targetPage: rule.targetPage,
                    direction: rule.direction
                });
            }
        });
        
        return moves.sort((a, b) => a.targetPage - b.targetPage);
    }

    findPageIndex(pages, rule) {
        if (rule.element) {
            return pages.findIndex(page => page.contains(rule.element));
        } else if (rule.selector) {
            return pages.findIndex(page => page.querySelector(rule.selector));
        }
        return -1;
    }

    applyMoves(pages, moves) {
        const moved = [...pages];
        
        moves.forEach(move => {
            const page = moved.splice(move.sourceIndex, 1)[0];
            
            let insertIndex;
            if (move.direction === 'after') {
                insertIndex = Math.min(move.targetPage, moved.length);
            } else {
                insertIndex = Math.max(0, move.targetPage - 1);
            }
            
            moved.splice(insertIndex, 0, page);
        });
        
        return moved;
    }

    updateDOM(movedPages) {
        const container = document.querySelector('.pagedjs_pages');
        const fragment = document.createDocumentFragment();
        
        movedPages.forEach((page, index) => {
            page.id = `page-${index + 1}`;
            page.className = page.className.replace(/pagedjs_\w+_page/g, '');
            
            if (index === 0) page.classList.add('pagedjs_first_page');
            page.classList.add(index % 2 === 0 ? 'pagedjs_right_page' : 'pagedjs_left_page');
            
            fragment.appendChild(page);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    updatePageNumbers() {
        document.querySelectorAll('.pagedjs_page').forEach((page, index) => {
            page.style.setProperty('--pagedjs-page-counter', index + 1);
        });
    }
}

// Enregistrement
Paged.registerHandlers(pageMove);