// === FICHIER: _11ty/csspageweaver/plugins/editor/recovery.js ===

import { TurndownService } from './turndown.js';
import {
  textColPlugin,
  breakColumnPlugin,
  typographyPlugin,
  footnotesPlugin,
  spacesPlugin,
  coreRulesPlugin,
  annotationsPlugin,
} from "./turndown-plugins/index.js";

/**
 * @name PagedMarkdownRecovery
 * @file Récupération du Markdown original depuis un contenu paginé PagedJS
 */
export class PagedMarkdownRecovery {
  
  constructor() {
    this.turndownService = this.initializeTurndown();
  }

  initializeTurndown() {
    const turndown = new TurndownService({
      headingStyle: 'atx',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
    });

    // Appliquer les plugins existants
    turndown.use([
      coreRulesPlugin,
      textColPlugin,
      breakColumnPlugin,
      typographyPlugin,
      footnotesPlugin,
      spacesPlugin,
      annotationsPlugin,
    ]);

    return turndown;
  }

  // === MÉTHODE PRINCIPALE ===
reconstructOriginalMarkdown() {
  const fragments = this.collectAllFragments();
  const reconstructed = this.mergeFragments(fragments);
  const markdown = this.convertToMarkdown(reconstructed); // Utiliser convertToMarkdown()
  
  return {
    markdown: markdown,
    elements: reconstructed,
    fragmentsCount: fragments.size,
    totalPages: this.getTotalPages()
  };
}

  // === COLLECTE DES FRAGMENTS SCINDÉS ===
  collectAllFragments() {
    const fragments = new Map();
    const processedRefs = new Set();
    
    // Collecter uniquement les éléments éditables
    const editableElements = document.querySelectorAll('[data-ref]');
    
    editableElements.forEach(element => {
      const ref = element.getAttribute('data-ref');
      
      if (ref) {
        // Élément avec data-ref (potentiellement scindé)
        if (!processedRefs.has(ref)) {
          const allFragments = document.querySelectorAll(`[data-ref="${ref}"][data-editable]`);
          
          const fragmentGroup = Array.from(allFragments).map(frag => ({
            element: frag,
            splitFrom: frag.getAttribute('data-split-from'),
            splitTo: frag.getAttribute('data-split-to'),
            pageNumber: this.getPageNumber(frag)
          }));
          
          // Trier par page
          fragmentGroup.sort((a, b) => a.pageNumber - b.pageNumber);
          
          fragments.set(ref, fragmentGroup);
          processedRefs.add(ref);
        }
      } else {
        // Élément sans data-ref (non scindé)
        const uniqueRef = `single-${element.getAttribute('editable-id') || Date.now()}-${Math.random()}`;
        fragments.set(uniqueRef, [{
          element: element,
          pageNumber: this.getPageNumber(element)
        }]);
      }
    });
    
    return fragments;
  }

  // === FUSION DES FRAGMENTS ===
  mergeFragments(fragments) {
    const reconstructedElements = [];
    
    fragments.forEach((elementGroup, ref) => {
      if (elementGroup.length === 1) {
        // Élément non scindé
        reconstructedElements.push({
          ref: ref,
          element: elementGroup[0].element,
          isReconstructed: false,
          pageNumber: elementGroup[0].pageNumber
        });
      } else {
        // Élément scindé - reconstitution
        const mergedElement = this.createMergedElement(elementGroup);
        reconstructedElements.push({
          ref: ref,
          element: mergedElement,
          isReconstructed: true,
          fragmentCount: elementGroup.length,
          pageNumber: elementGroup[0].pageNumber
        });
      }
    });
    
    // Trier par ordre d'apparition dans le document
    reconstructedElements.sort((a, b) => {
      const aOrder = this.getDocumentOrder(a.element);
      const bOrder = this.getDocumentOrder(b.element);
      return aOrder - bOrder;
    });
    
    return reconstructedElements;
  }

  createMergedElement(elementGroup) {
    const firstElement = elementGroup[0].element;
    const mergedElement = firstElement.cloneNode(false);
    
    // Combiner le contenu de tous les fragments
    let combinedHTML = '';
    elementGroup.forEach(fragment => {
      combinedHTML += fragment.element.innerHTML;
    });
    
    mergedElement.innerHTML = combinedHTML;
    
    // Nettoyer les attributs de scission
    mergedElement.removeAttribute('data-split-from');
    mergedElement.removeAttribute('data-split-to');
    
    return mergedElement;
  }

  // === CONVERSION EN MARKDOWN ===
  convertToMarkdown(reconstructedElements) {
    const turndownService = this.getTurndownService();
    let fullMarkdown = '';
    
    reconstructedElements.forEach((item, index) => {
      const markdown = this.getTurndownService().turndown(item.element.outerHTML);
      
      
      if (index > 0) fullMarkdown += '\n\n';
      fullMarkdown += markdown;
    });
    
    return fullMarkdown;
  }

  getTurndownService() {
    // Réutilise l'instance Turndown existante du plugin editor
    if (window.mainTurndownService) {
      return window.mainTurndownService;
    }
    
    // Fallback si pas disponible
    return this.turndownService;
  }

  // === UTILITAIRES ===
  getPageNumber(element) {
    const page = element.closest('.pagedjs_page');
    if (!page) return 0;
    
    const pageNumber = page.getAttribute('data-page-number');
    return pageNumber ? parseInt(pageNumber) : 0;
  }

  getDocumentOrder(element) {
    // Utilise l'ID éditable pour l'ordre
    const editableId = element.getAttribute('editable-id');
    if (editableId) {
      // Parse l'ID type "j21" = lettre + nombre
      const match = editableId.match(/([a-z])(\d+)/);
      if (match) {
        const sectionCode = match[1].charCodeAt(0) - 97; // a=0, b=1, etc
        const elementNumber = parseInt(match[2]);
        return (sectionCode * 1000) + elementNumber;
      }
    }
    
    // Fallback: position dans le DOM + page
    let order = 0;
    let current = element;
    
    while (current.previousElementSibling) {
      current = current.previousElementSibling;
      order++;
    }
    
    const pageNumber = this.getPageNumber(element);
    return (pageNumber * 10000) + order;
  }

  getTotalPages() {
    return document.querySelectorAll('.pagedjs_page').length;
  }

  // === OPTIONS D'EXPORT ===
  
  // Export complet (toutes les pages)
  exportOriginalMarkdown(filename = 'document-original.md') {
    const result = this.reconstructOriginalMarkdown();
    this.downloadFile(result.markdown, filename, 'text/markdown');
    console.log(`✅ Document complet exporté: ${result.fragmentsCount} fragments sur ${result.totalPages} pages`);
    return result;
  }

  // Export pages spécifiques
exportPageRange(startPage, endPage, filename = 'document-partial.md') {
  const fragments = this.collectAllFragments();
  const filteredFragments = new Map();
  
  fragments.forEach((elementGroup, ref) => {
    const filteredGroup = elementGroup.filter(fragment => 
      fragment.pageNumber >= startPage && fragment.pageNumber <= endPage
    );
    if (filteredGroup.length > 0) {
      filteredFragments.set(ref, filteredGroup);
    }
  });

  const reconstructed = this.mergeFragments(filteredFragments);
  const markdown = this.convertToMarkdown(reconstructed); // Utiliser convertToMarkdown()
  
  this.downloadFile(markdown, filename, 'text/markdown');
  console.log(`📄 Pages ${startPage}-${endPage} exportées`);
  return markdown;
}

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // === DIAGNOSTIC ===
  analyzeFragmentation() {
    const fragments = this.collectAllFragments();
    const analysis = {
      totalPages: this.getTotalPages(),
      totalFragments: 0,
      splitElements: 0,
      intactElements: 0,
      details: []
    };
    
    fragments.forEach((elementGroup, ref) => {
      analysis.totalFragments += elementGroup.length;
      
      if (elementGroup.length > 1) {
        analysis.splitElements++;
        analysis.details.push({
          ref: ref,
          tagName: elementGroup[0].element.tagName,
          fragmentCount: elementGroup.length,
          pages: elementGroup.map(f => f.pageNumber),
          preview: elementGroup[0].element.textContent.substring(0, 50) + '...'
        });
      } else {
        analysis.intactElements++;
      }
    });
    
    return analysis;
  }
}