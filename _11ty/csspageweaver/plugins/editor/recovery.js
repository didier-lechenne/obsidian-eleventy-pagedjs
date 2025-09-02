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
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
      keepReplacement: function (content, node) {
        if (node.classList && node.classList.contains("breakcolumn")) {
          return "\n<breakcolumn>\n";
        }
        return node.outerHTML;
      },
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
      if (element.classList.contains("breakcolumn")) return;

      const ref = element.getAttribute("data-ref");
      if (!fragmentGroups.has(ref)) {
        fragmentGroups.set(ref, []);
      }
      fragmentGroups.get(ref).push(element);
    });

    console.log(
      "Breakcolumns AVANT fusion:",
      section.querySelectorAll(".breakcolumn").length
    );

    // Réunit les fragments
    fragmentGroups.forEach((fragments) => {
      if (fragments.length > 1) {
        console.log("Fusion de fragments:", fragments[0].className);
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
    console.log(
      "Breakcolumns APRÈS fusion:",
      section.querySelectorAll(".breakcolumn").length
    );

    const footnotesSep = section.querySelector("hr.footnotes-sep");
    if (footnotesSep) {
      footnotesSep.remove();
    }

    const footnotesSection = section.querySelector("section.footnotes");
    if (footnotesSection) {
      footnotesSection.remove();
    }

    //     console.log("HTML reconstruit:", content.innerHTML);
  }

  // === EXPORT PAR PLAGE DE PAGES ===
  //   exportPageRange(startPage, endPage, filename = "pages-selection.md") {
  //     // 1. Récupérer le data-template de la page de départ
  //     const startPageElement = document.querySelector(
  //       `[data-page-number="${startPage}"] section`
  //     );
  //     if (!startPageElement) {
  //       console.warn(`❌ Page ${startPage} introuvable`);
  //       return;
  //     }

  //     const targetTemplate = startPageElement.getAttribute("data-template");

  //     // 2. Collecter SEULEMENT les sections qui ont le même data-template
  //     const selectedPages = [];

  //     for (let i = startPage; i <= endPage; i++) {
  //       const page = document.querySelector(`[data-page-number="${i}"] section`);

  //       if (page) {
  //         const pageTemplate = page.getAttribute("data-template");

  //         // Ne collecter que si le data-template correspond
  //         if (pageTemplate === targetTemplate) {
  //           selectedPages.push(page.cloneNode(true));
  //           console.log(`✅ Page ${i} collectée (template: "${pageTemplate}")`);
  //         } else {
  //           console.log(
  //             `⏭️ Page ${i} ignorée (template: "${pageTemplate}" ≠ "${targetTemplate}")`
  //           );
  //         }
  //       } else {
  //         console.warn(`⚠️ Page ${i} introuvable`);
  //       }
  //     }

  //     // 3. Vérification qu'on a au moins une page
  //     if (selectedPages.length === 0) {
  //       console.error(
  //         `❌ Aucune page trouvée avec le template "${targetTemplate}"`
  //       );
  //       return;
  //     }

  //     // 4. Crée un container temporaire
  //     const container = document.createElement("div");
  //     selectedPages.forEach((page) => container.appendChild(page));

  //     //     console.log("📄 Contenu avant reconstitution:", container.innerHTML);

  //     // 5. Reconstitue les éléments scindés dans le container
  //     this.reconstructSplitElements(container);

  //     //     console.log("🔧 Contenu après reconstitution:", container.innerHTML);

  //     // 6. Conversion en Markdown
  //     const markdown = this.getTurndownService().turndown(container.innerHTML);
  //     //     console.log("📝 Markdown Content:", markdown);

  //     // 7. Téléchargement avec nom de fichier enrichi
  //     const templateSuffix = targetTemplate ? `-${targetTemplate}` : "";
  //     const enrichedFilename = filename.replace(".md", `${templateSuffix}.md`);

  //     this.downloadFile(markdown, enrichedFilename, "text/markdown");
  //     return markdown;
  //   }
  exportPageRange(startPage, endPage, filename = "pages-selection.md") {
    // 1. Récupérer le data-template et le front matter de la page de départ
    const startPageElement = document.querySelector(
      `[data-page-number="${startPage}"] section`
    );
    if (!startPageElement) {
      console.warn(`❌ Page ${startPage} introuvable`);
      return;
    }
    const targetTemplate = startPageElement.getAttribute("data-template");

    // 2. Extraire le front matter depuis les attributs frontmatter-* de la section
    const frontMatter = {};
    for (const attr of startPageElement.attributes) {
      if (attr.name.startsWith("frontmatter-")) {
        const key = attr.name.replace("frontmatter-", "").replace(/-/g, "_");
        frontMatter[key] = attr.value;
      }
    }

    // 3. Collecter les sections cibles
    const selectedPages = [];
    for (let i = startPage; i <= endPage; i++) {
      const page = document.querySelector(`[data-page-number="${i}"] section`);
      if (page && page.getAttribute("data-template") === targetTemplate) {
        selectedPages.push(page.cloneNode(true));
      }
    }

    // 4. Vérification
    if (selectedPages.length === 0) {
      console.error(
        `❌ Aucune page trouvée avec le template "${targetTemplate}"`
      );
      return;
    }

    // 5. Reconstituer le contenu
    const container = document.createElement("div");
    selectedPages.forEach((page) => container.appendChild(page));
    this.reconstructSplitElements(container);
    console.log("HTML avant turndown:", container.innerHTML);
    console.log(
      "Breakcolumns présents:",
      container.querySelectorAll(".breakcolumn").length
    );

    // 6. Convertir en Markdown
    const markdownContent = this.getTurndownService().turndown(
      container.innerHTML
    );

    // 7. Ajouter le front matter au Markdown
    const frontMatterYaml = `---
${Object.entries(frontMatter)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}
---
`;
    const fullMarkdown = frontMatterYaml + markdownContent;

    // 8. Télécharger le fichier
    const templateSuffix = targetTemplate ? `-${targetTemplate}` : "";
    const enrichedFilename = filename.replace(".md", `${templateSuffix}.md`);
    this.downloadFile(fullMarkdown, enrichedFilename, "text/markdown");

    return fullMarkdown;
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
