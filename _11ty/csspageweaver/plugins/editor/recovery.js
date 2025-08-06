import { TurndownService } from "./turndown.js";
import * as turndownPlugins from "./turndown-plugins/index.js";

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

	
	turndown.use(Object.values(turndownPlugins));


    return turndown;
  }

  // === RECONSTITUTION ELEMENTS SCINDÉS ===

  reconstructSplitElements(content) {
    // Trouve toutes les sections
    const sections = content.querySelectorAll("section");

    if (sections.length === 0) {
      return; // Aucune section trouvée
    }

    // Collecte tout le contenu de toutes les sections
    let combinedContent = "";
    sections.forEach((section) => {
      combinedContent += section.innerHTML;
    });

    // Vide le contenu principal et ne garde qu'une seule section avec tout le contenu
    content.innerHTML = `<section>${combinedContent}</section>`;

    // Maintenant réunit les paragraphes scindés
    const section = content.querySelector("section");
    const fragmentGroups = new Map();

    // Groupe les éléments par data-ref
    section.querySelectorAll("[data-ref]").forEach((element) => {
      const ref = element.getAttribute("data-ref");
      if (!fragmentGroups.has(ref)) {
        fragmentGroups.set(ref, []);
      }
      fragmentGroups.get(ref).push(element);
    });

    // Réunit les fragments
    fragmentGroups.forEach((fragments) => {
      if (fragments.length > 1) {
        const firstFragment = fragments[0];
        let completeContent = "";

        fragments.forEach((fragment) => {
          completeContent += fragment.innerHTML;
        });

        firstFragment.innerHTML = completeContent;

        // Supprime les fragments suivants
        for (let i = 1; i < fragments.length; i++) {
          fragments[i].remove();
        }
      }
    });


  const footnotesSep = section.querySelector('hr.footnotes-sep');
  if (footnotesSep) {
    footnotesSep.remove();
  }

  const footnotesSection = section.querySelector('section.footnotes');
  if (footnotesSection) {
    footnotesSection.remove();
  }


  }

  // === EXPORT PAR PLAGE DE PAGES ===
exportPageRange(startPage, endPage, filename = "pages-selection.md") {
  // 1. Récupérer le data-template de la page de départ
  const startPageElement = document.querySelector(`[data-page-number="${startPage}"] section`);
  if (!startPageElement) {
    console.warn(`❌ Page ${startPage} introuvable`);
    return;
  }

  const targetTemplate = startPageElement.getAttribute('data-template');
  console.log(`🎯 Template cible: "${targetTemplate}" (depuis page ${startPage})`);

  // 2. Collecter SEULEMENT les sections qui ont le même data-template
  const selectedPages = [];

  for (let i = startPage; i <= endPage; i++) {
    const page = document.querySelector(`[data-page-number="${i}"] section`);
    
    if (page) {
      const pageTemplate = page.getAttribute('data-template');
      
      // Ne collecter que si le data-template correspond
      if (pageTemplate === targetTemplate) {
        selectedPages.push(page.cloneNode(true));
        console.log(`✅ Page ${i} collectée (template: "${pageTemplate}")`);
      } else {
        console.log(`⏭️ Page ${i} ignorée (template: "${pageTemplate}" ≠ "${targetTemplate}")`);
      }
    } else {
      console.warn(`⚠️ Page ${i} introuvable`);
    }
  }

  console.log(`📊 Résultat: ${selectedPages.length} pages collectées avec le template "${targetTemplate}"`);

  // 3. Vérification qu'on a au moins une page
  if (selectedPages.length === 0) {
    console.error(`❌ Aucune page trouvée avec le template "${targetTemplate}"`);
    return;
  }

  // 4. Crée un container temporaire
  const container = document.createElement("div");
  selectedPages.forEach((page) => container.appendChild(page));

  console.log("📄 Contenu avant reconstitution:", container.innerHTML);

  // 5. Reconstitue les éléments scindés dans le container
  this.reconstructSplitElements(container);

  console.log("🔧 Contenu après reconstitution:", container.innerHTML);

  // 6. Conversion en Markdown
  const markdown = this.getTurndownService().turndown(container.innerHTML);
  console.log("📝 Markdown Content:", markdown);

  // 7. Téléchargement avec nom de fichier enrichi
  const templateSuffix = targetTemplate ? `-${targetTemplate}` : '';
  const enrichedFilename = filename.replace('.md', `${templateSuffix}.md`);
  
  this.downloadFile(markdown, enrichedFilename, "text/markdown");
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
