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



	showPageRangeModal() {
	// Créer modal HTML
	const modal = document.createElement('div');
	modal.style.cssText = `
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0,0,0,0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	`;

	const dialog = document.createElement('div');
	dialog.style.cssText = `
	background: white;
	padding: 20px;
	border-radius: 8px;
	min-width: 300px;
	box-shadow: 0 4px 20px rgba(0,0,0,0.3);
	`;

	const totalPages = this.getTotalPages();
	
	dialog.innerHTML = `
	<h3 style="margin-top: 0;">Exporter pages spécifiques</h3>
	<p>Total: ${totalPages} pages</p>
	<label>
	Format d'export:<br>
	<input type="text" id="page-range" placeholder="ex: 1-5 ou 3,7,9 ou 2" style="width: 100%; padding: 8px; margin: 5px 0;">
	</label>
	<div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
	<button id="cancel-export" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Annuler</button>
	<button id="confirm-export" style="padding: 8px 16px; border: none; background: #663399; color: white; border-radius: 4px; cursor: pointer;">Exporter</button>
	</div>
	`;

	modal.appendChild(dialog);
	document.body.appendChild(modal);

	// Focus sur l'input
	const input = dialog.querySelector('#page-range');
	input.focus();

	// Gestion des événements
	const closeModal = () => {
	document.body.removeChild(modal);
	};

	const exportPages = () => {
	const inputValue = input.value.trim();
	if (!inputValue) return;

	try {
	if (inputValue.includes('-')) {
	// Plage de pages
	const [start, end] = inputValue.split('-').map(n => parseInt(n.trim()));
	this.exportPageRange(start, end, `pages-${start}-${end}.md`);
	} else if (inputValue.includes(',')) {
	// Pages individuelles - export simple en prenant min-max
	const pages = inputValue.split(',').map(n => parseInt(n.trim()));
	const start = Math.min(...pages);
	const end = Math.max(...pages);
	this.exportPageRange(start, end, `pages-selection.md`);
	} else {
	// Page unique
	const page = parseInt(inputValue);
	this.exportPageRange(page, page, `page-${page}.md`);
	}
	closeModal();
	} catch (error) {
	alert('Format invalide. Utilisez: 1-5 ou 3,7,9 ou 2');
	}
	};

	dialog.querySelector('#cancel-export').onclick = closeModal;
	dialog.querySelector('#confirm-export').onclick = exportPages;
	
	// Fermer avec Escape
	modal.onclick = (e) => {
	if (e.target === modal) closeModal();
	};
	
	// Valider avec Entrée
	input.onkeydown = (e) => {
	if (e.key === 'Enter') exportPages();
	if (e.key === 'Escape') closeModal();
	};
	}

getTotalPages() {
  const pages = document.querySelectorAll('.pagedjs_page');
  return pages.length;
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