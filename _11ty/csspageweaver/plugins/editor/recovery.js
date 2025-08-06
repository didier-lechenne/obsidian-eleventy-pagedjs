import { TurndownService } from "./turndown.js";
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
      headingStyle: "atx",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
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



  // === RECONSTITUTION ELEMENTS SCINDÉS ===


reconstructSplitElements(content) {
  // Trouve toutes les sections
  const sections = content.querySelectorAll('section');
  
  if (sections.length === 0) {
    return; // Aucune section trouvée
  }
  
  // Collecte tout le contenu de toutes les sections
  let combinedContent = '';
  sections.forEach(section => {
    combinedContent += section.innerHTML;
  });
  
  // Vide le contenu principal et ne garde qu'une seule section avec tout le contenu
  content.innerHTML = `<section>${combinedContent}</section>`;
  
  // Maintenant réunit les paragraphes scindés
  const section = content.querySelector('section');
  const fragmentGroups = new Map();
  
  // Groupe les éléments par data-ref
  section.querySelectorAll('[data-ref]').forEach(element => {
    const ref = element.getAttribute('data-ref');
    if (!fragmentGroups.has(ref)) {
      fragmentGroups.set(ref, []);
    }
    fragmentGroups.get(ref).push(element);
  });
  
  // Réunit les fragments
  fragmentGroups.forEach((fragments) => {
    if (fragments.length > 1) {
      const firstFragment = fragments[0];
      let completeContent = '';
      
      fragments.forEach(fragment => {
        completeContent += fragment.innerHTML;
      });
      
      firstFragment.innerHTML = completeContent;
      
      // Supprime les fragments suivants
      for (let i = 1; i < fragments.length; i++) {
        fragments[i].remove();
      }
    }
  });
}


  // === EXPORT PAR PLAGE DE PAGES ===
  exportPageRange(startPage, endPage, filename = "pages-selection.md") {
    const selectedPages = [];

    // Collecte les pages sélectionnées
    for (let i = startPage; i <= endPage; i++) {
      const page = document.querySelector(
        `[data-page-number="${i}"] .pagedjs_page_content`
      );
      if (page) {
        selectedPages.push(page.cloneNode(true));
      }
    }

    if (selectedPages.length === 0) return;

    // Crée un container temporaire
    const container = document.createElement("div");
    selectedPages.forEach((page) => container.appendChild(page));

    console.log("Contenu avant :", container.innerHTML);

    // Reconstitue les éléments scindés dans le container
    this.reconstructSplitElements(container);

    console.log("Contenu après :", container.innerHTML);

    // Conversion
    const markdown = this.getTurndownService().turndown(container.innerHTML);
    console.log("Markdown Content:", markdown);

    this.downloadFile(markdown, filename, "text/markdown");
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
      const [start, end] = input.split("-").map((n) => parseInt(n.trim()));
      this.exportPageRange(start, end, `pages-${start}-${end}.md`);
    } else if (input.includes(",")) {
      const pages = input.split(",").map((n) => parseInt(n.trim()));
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
    const pages = document.querySelectorAll("[data-page-number]");
    return pages.length;
  }

  getTurndownService() {
    return window.mainTurndownService || this.turndownService;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
