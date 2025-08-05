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

  // === APPROCHE WEBCLIPPER ===
  exportFullDocument(filename = 'document-complete.md') {
    // Récupère tout le contenu de la zone principale
    const mainContent = document.querySelector('.pagedjs_pages') || document.body;
    
    // Clone pour manipulation sans affecter l'original
    const clone = mainContent.cloneNode(true);
    
    // Nettoie les éléments PagedJS non-désirés
    this.cleanPagedJSElements(clone);
    
    // Reconstitue les éléments scindés
    this.reconstructSplitElements(clone);
    
    // Conversion Turndown
    const markdown = this.getTurndownService().turndown(clone.innerHTML);
    
    this.downloadFile(markdown, filename, 'text/markdown');
    return markdown;
  }

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
      // Remplace tout par le contenu des pages concaténé
      clone.innerHTML = '';
      pageContents.forEach(content => {
        clone.appendChild(content.cloneNode(true));
      });
    }
  }

  reconstructSplitElements(clone) {
    const fragmentGroups = new Map();
    
    // Groupe par data-ref
    clone.querySelectorAll('[data-ref]').forEach(element => {
      const ref = element.getAttribute('data-ref');
      if (!fragmentGroups.has(ref)) {
        fragmentGroups.set(ref, []);
      }
      fragmentGroups.get(ref).push(element);
    });
    
    // Reconstitue chaque groupe
    fragmentGroups.forEach((fragments, ref) => {
      if (fragments.length > 1) {
        const firstFragment = fragments[0];
        
        // Combine le contenu
        let combinedHTML = '';
        fragments.forEach(frag => {
          combinedHTML += frag.innerHTML;
        });
        
        // Remplace le premier par le contenu combiné
        firstFragment.innerHTML = combinedHTML;
        
        // Supprime les autres fragments
        fragments.slice(1).forEach(frag => frag.remove());
        
        // Nettoie les attributs de scission
        firstFragment.removeAttribute('data-split-from');
        firstFragment.removeAttribute('data-split-to');
      }
    });
  }

  // === EXPORT PAR PLAGE DE PAGES ===
  exportPageRange(startPage, endPage, filename = 'pages-selection.md') {
    const selectedPages = [];
    
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
    
    // Reconstitue et nettoie
    this.reconstructSplitElements(container);
    
    // Conversion
    const markdown = this.getTurndownService().turndown(container.innerHTML);
    
    this.downloadFile(markdown, filename, 'text/markdown');
    return markdown;
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