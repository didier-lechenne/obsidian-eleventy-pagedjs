import { TurndownService } from "./turndown.js";
import * as turndownPlugins from "./turndown-plugins/index.js";

/**
 * @name PagedMarkdownRecovery
 * @file Hub centralisé pour toutes les conversions HTML→Markdown
 */
export class PagedMarkdownRecovery {
  constructor(editor = null) {
    this.editor = editor;
    this.turndownService = this.initializeTurndown();
  }

  initializeTurndown() {
    const turndown = new TurndownService({
      headingStyle: "atx",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
    });

    turndown.use(Object.values(turndownPlugins));
    return turndown;
  }

  // ====== CONVERSION ÉLÉMENTS INDIVIDUELS ======

  /**
   * Convertit un élément HTML en Markdown (ex-triggerAutoCopy)
   */
  convertElementToMarkdown(element) {
    if (!element) return null;

    const dataRef = element.getAttribute("data-ref");
    let content;

    if (dataRef) {
      // Fragment scindé - fusionner
      content = this.fusionFragments(dataRef);
    } else {
      // Élément normal
      content = element.innerHTML;
    }

    return this.turndownService.turndown(content);
  }

  /**
   * AutoCopy : convertit et copie dans le presse-papiers
   */
  async copyElementToClipboard(element = null) {
    if (!this.editor?.options?.autoCopy) return false;

    const targetElement = element || this.getCurrentElement();
    if (!targetElement) return false;

    const markdown = this.convertElementToMarkdown(targetElement);
    if (!markdown) return false;

    try {
      await navigator.clipboard.writeText(markdown);
      this.showFeedback("Copié !");
      return true;
    } catch (error) {
      console.error("Erreur copie:", error);
      return false;
    }
  }

  /**
   * Fusionne les fragments scindés par PagedJS (ex-fusionFragments)
   */
  fusionFragments(dataRef) {
    const allFragments = document.querySelectorAll(`[data-ref="${dataRef}"]`);
    
    let fullHTML = "";
    allFragments.forEach((fragment, index) => {
      let html = fragment.innerHTML;

      // Nettoyer les césures en fin de fragment
      if (index < allFragments.length - 1) {
        html = html.replace(/‑\s*$/, "");
      }

      fullHTML += html;
    });

    return fullHTML;
  }

  // ====== EXPORT PAR PLAGES ======

  exportPageRange(startPage, endPage, filename) {
    const pages = Array.from(document.querySelectorAll("[data-page-number]"));
    const selectedPages = pages
      .filter(page => {
        const pageNum = parseInt(page.getAttribute("data-page-number"));
        return pageNum >= startPage && pageNum <= endPage;
      })
      .map(page => page.cloneNode(true));

    if (selectedPages.length === 0) {
      console.warn(`Aucune page trouvée entre ${startPage} et ${endPage}`);
      return;
    }

    // Front matter basique
    const frontMatter = {
      title: `Pages ${startPage}-${endPage}`,
      date: new Date().toISOString().split('T')[0],
      layout: "valentine"
    };

    // Reconstituer le contenu
    const container = document.createElement("div");
    selectedPages.forEach(page => container.appendChild(page));
    this.reconstructSplitElements(container);

    // Convertir en Markdown
    let markdownContent = this.turndownService.turndown(container.innerHTML);

    markdownContent = markdownContent
      .replace(/<breakcolumn>(?!\s*\/)/g, "<breakcolumn />")
      .replace(/<breakpage>(?!\s*\/)/g, "<breakpage />");

    // Ajouter le front matter
    const frontMatterYaml = `---\n${Object.entries(frontMatter)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")}\n---\n`;
    
    const fullMarkdown = frontMatterYaml + markdownContent;

    // Télécharger
    this.downloadFile(fullMarkdown, filename, "text/markdown");
    return fullMarkdown;
  }

  showPageRangeModal() {
    const totalPages = this.getTotalPages();
    const input = prompt(
      `Pages à exporter (ex: 1-5 ou 3,7,9)\nTotal: ${totalPages} pages`
    );

    if (!input) return;

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

  // ====== RECONSTRUCTION CONTENUS SCINDÉS ======

  reconstructSplitElements(content) {
    // Trouve toutes les sections
    const sections = content.querySelectorAll("section");
    if (sections.length === 0) return;

    // Collecte tout le contenu
    let combinedContent = "";
    sections.forEach(section => {
      combinedContent += section.innerHTML;
    });

    // Une seule section avec tout le contenu
    content.innerHTML = `<section>${combinedContent}</section>`;

    // Réunit les paragraphes scindés
    const section = content.querySelector("section");
    const fragmentGroups = new Map();

    // Groupe les éléments par data-ref
    section.querySelectorAll("[data-ref]").forEach(element => {
      const ref = element.getAttribute("data-ref");
      if (!fragmentGroups.has(ref)) {
        fragmentGroups.set(ref, []);
      }
      fragmentGroups.get(ref).push(element);
    });

    // Réunit les fragments
    fragmentGroups.forEach(fragments => {
      if (fragments.length > 1) {
        const firstFragment = fragments[0];
        let completeContent = "";

        fragments.forEach(fragment => {
          completeContent += fragment.innerHTML;
        });

        firstFragment.innerHTML = completeContent;

        // Supprime les fragments suivants
        for (let i = 1; i < fragments.length; i++) {
          const parent = fragments[i].parentNode;
          if (parent) parent.removeChild(fragments[i]);
        }
      }
    });
  }

  // ====== UTILITAIRES ======

  getTurndownService() {
    return this.turndownService;
  }

  getCurrentElement() {
    return this.editor?.getCurrentElement?.() || null;
  }

  getTotalPages() {
    const pages = document.querySelectorAll("[data-page-number]");
    return pages.length;
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

  showFeedback(message) {
    const feedback = document.createElement("div");
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ac4cafff;
      color: white;
      padding: 10px;
      border-radius: 4px;
      z-index: 10000;
      opacity: 1;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 300);
    }, 2000);
  }
}