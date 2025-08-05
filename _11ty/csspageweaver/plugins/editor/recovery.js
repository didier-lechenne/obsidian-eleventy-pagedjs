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

  // === EXPORT DOCUMENT COMPLET ===
  exportFullDocument(filename = 'document-complete.md') {
    // Clone d'abord le document complet
    const mainContent = document.querySelector('.pagedjs_pages') || document.body;
    const clone = mainContent.cloneNode(true);
    
    // Nettoie les éléments PagedJS non-désirés
    this.cleanPagedJSElements(clone);
    
    // Reconstitue les éléments scindés dans le clone
    this.reconstructSplitElements(clone);
    
    // Conversion Turndown
    const markdown = this.getTurndownService().turndown(clone.innerHTML);
    
    this.downloadFile(markdown, filename, 'text/markdown');
    return markdown;
  }

  // === NETTOYAGE ELEMENTS PAGEDJS ===
  cleanPagedJSElements(clone) {
    // Supprime les éléments de structure PagedJS
    const toRemove = [
      '.pagedjs_bleed',
      '.pagedjs_margin', 
      '.pagedjs_marks-crop',
      '.pagedjs_marks-cross',
      '.pagedjs_sheet',
      '.pagedjs_pagebox'
    ];
    
    toRemove.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Garde seulement le contenu des pages
    const pageContents = clone.querySelectorAll('.pagedjs_page_content');
    if (pageContents.length > 0) {
      clone.innerHTML = '';
      pageContents.forEach(content => {
        clone.appendChild(content.cloneNode(true));
      });
    }
  }

  // === RECONSTITUTION ELEMENTS SCINDÉS ===
  reconstructSplitElements(clone) {
    const fragmentGroups = new Map();
    
    clone.querySelectorAll('[data-ref]').forEach(element => {
      const ref = element.getAttribute('data-ref');
      if (!fragmentGroups.has(ref)) {
        fragmentGroups.set(ref, []);
      }
      fragmentGroups.get(ref).push(element);
    });
    
    console.log('Fragment Groups:', fragmentGroups);
    
    fragmentGroups.forEach((fragments, ref) => {
      if (fragments.length > 1) {
        console.log(`Processing fragments for ref: ${ref}`);
        const firstFragment = fragments[0];
        const completeContent = this.reconstructWithTags(fragments);
        console.log('Complete Content:', completeContent);
        
        // Supprimer d'abord les autres fragments
        fragments.slice(1).forEach(frag => {
          if (frag.parentNode) {
            frag.parentNode.removeChild(frag);
          }
        });
        
        // Puis remplacer le premier par l'élément complet
        firstFragment.outerHTML = completeContent;
      }
    });
    
    console.log('Reconstruction completed');
  }
  
  reconstructWithTags(fragments) {
    const firstFragment = fragments[0];
    let completeContent = '';
    fragments.forEach(fragment => {
      completeContent += fragment.innerHTML;
    });
    
    const tagName = firstFragment.tagName.toLowerCase();
    
    // Copier tous les attributs du premier fragment
    const attributes = [];
    for (let attr of firstFragment.attributes) {
      if (!attr.name.startsWith('data-split')) {
        attributes.push(`${attr.name}="${attr.value}"`);
      }
    }
    
    const attrsStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    return `<${tagName}${attrsStr}>${completeContent}</${tagName}>`;
  }

  // === EXPORT PAR PLAGE DE PAGES ===
  exportPageRange(startPage, endPage, filename = 'pages-selection.md') {
    const selectedPages = [];
    
    // Collecte les pages sélectionnées
    for (let i = startPage; i <= endPage; i++) {
      const page = document.querySelector(`[data-page-number="${i}"] .pagedjs_page_content`);
      if (page) {
        selectedPages.push(page.cloneNode(true));
      }
    }
    
    if (selectedPages.length === 0) return;
    
    // Crée un container temporaire
    const container = document.createElement('div');
    selectedPages.forEach(page => container.appendChild(page));
    
    console.log("Contenu avant :", container.innerHTML);

    // Reconstitue les éléments scindés dans le container
    this.reconstructSplitElements(container);
    
    console.log("Contenu après :", container.innerHTML);

    // Conversion
    const markdown = this.getTurndownService().turndown(container.innerHTML);
    console.log("Markdown Content:", markdown);

    
    this.downloadFile(markdown, filename, 'text/markdown');
    return markdown;
  }

  // === INTERFACE UTILISATEUR ===
  showPageRangeModal() {
    const totalPages = this.getTotalPages();
    const input = prompt(
      `Pages à exporter (ex: 1-5 ou 3,7,9)\nTotal: ${totalPages} pages`
    );

    if (!input) return;

    // Parse l'input utilisateur
    if (input.includes("-")) {
      const [start, end] = input.split("-").map(n => parseInt(n.trim()));
      this.exportPageRange(start, end, `pages-${start}-${end}.md`);
    } else if (input.includes(",")) {
      const pages = input.split(",").map(n => parseInt(n.trim()));
      const start = Math.min(...pages);
      const end = Math.max(...pages);
      this.exportPageRange(start, end, `pages-selection.md`);
    } else {
      const page = parseInt(input);
      this.exportPageRange(page, page, `page-${page}.md`);
    }
  }

 
  // === UTILITAIRES ===
  getTotalPages() {
    const pages = document.querySelectorAll('[data-page-number]');
    return pages.length;
  }

  getTurndownService() {
    return window.mainTurndownService || this.turndownService;
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
}