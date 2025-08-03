/**
 * @name Toolbar
 * @file Barre d'outils avec système d'extensions
 */
import {
  textColPlugin,
  breakColumnPlugin,
  typographyPlugin,
  footnotesPlugin,
  spacesPlugin,
  coreRulesPlugin,
  annotationsPlugin,
} from "./turndown-plugins/index.js";

// Classe de base pour les boutons
class ToolbarButton {
  constructor(command, icon, title, action) {
    this.command = command;
    this.icon = icon;
    this.title = title;
    this.action = action;
  }

  render() {
    return `<button data-command="${this.command}" data-tooltip="${this.title}">${this.icon}</button>`;
  }
}

// Extension pour formatage de base
class FormattingExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }

  getButtons() {
    return [
      new ToolbarButton("smallcaps", "ᴀᴀ", "Petites capitales", () => {
        this.toolbar.editor.commands.toggleSmallCaps();
      }),
      new ToolbarButton("superscript", "x²", "Exposant", () => {
        this.toolbar.editor.commands.toggleSuperscript();
      }),
    ];
  }
}

// Extension pour le lettrage (letter-spacing)
class LetterSpacingExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
    this.currentSpan = null;
    this.input = null;
    this.autoCopyTimeout = null;
  }

  getButtons() {
    return [
      new ToolbarButton(
        "letter-spacing",
        "A ↔ A",
        "Lettrage (Letter-spacing)",
        () => {
          this.handleLetterSpacingToggle();
        }
      ),
    ];
  }

  handleLetterSpacingToggle() {
    // Si input actif, valider et fermer
    if (this.input && this.input.style.display !== "none") {
      this.hideLetterSpacingInput();
      return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Vérifier si déjà dans un span avec --ls
    const existingSpan =
      this.toolbar.editor.commands.findLetterSpacingSpan(range);

    if (existingSpan) {
      this.showLetterSpacingInput(existingSpan);
    } else {
      const newSpan = this.toolbar.editor.commands.wrapWithLetterSpacing(range);
      this.showLetterSpacingInput(newSpan);
    }
  }

  findLetterSpacingSpan(range) {
    return this.toolbar.editor.commands.findLetterSpacingSpan(range);
  }

  showLetterSpacingInput(span) {
    this.currentSpan = span;

    // Créer ou réutiliser l'input
    if (!this.input) {
      this.createLetterSpacingInput();
    }

    // Récupérer la valeur actuelle
    const currentValue = span.style.getPropertyValue("--ls") || "0";
    this.input.value = currentValue;

    // Changer le bouton LS en validation
    const lsButton = this.toolbar.element.querySelector(
      '[data-command="letter-spacing"]'
    );
    if (lsButton) {
      lsButton.innerHTML = "✓";
      lsButton.title = "Valider letter-spacing (Entrée)";
      lsButton.classList.add("editing");
    }

    // Positionner l'input près de la toolbar
    this.positionInput();
    this.input.style.display = "block";
    this.input.focus();
    this.input.select();
  }

  createLetterSpacingInput() {
    this.input = document.createElement("input");
    this.input.type = "number";
    this.input.step = "1";
    this.input.className = "letter-spacing-input";

    // Events
    this.input.addEventListener("input", (e) => {
      if (this.currentSpan) {
        const value = e.target.value;
        this.currentSpan.style.setProperty("--ls", value);
        this.triggerAutoCopy();
      }
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        this.hideLetterSpacingInput();
      }
    });

    this.input.addEventListener("blur", () => {
      // Délai plus long et vérifier si on reste dans la toolbar/input
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (
          activeElement !== this.input &&
          !this.toolbar.element.contains(activeElement)
        ) {
          this.hideLetterSpacingInput();
        }
      }, 200);
    });

    document.body.appendChild(this.input);
  }

  positionInput() {
    if (!this.toolbar.element || !this.input) return;

    const toolbarRect = this.toolbar.element.getBoundingClientRect();
    this.input.style.left = `${toolbarRect.right + 10 + window.scrollX}px`;
    this.input.style.top = `${toolbarRect.top + window.scrollY}px`;
  }

  hideLetterSpacingInput() {
    if (this.input) {
      this.input.style.display = "none";
    }
    this.triggerAutoCopy();

    // Restaurer le bouton LS
    const lsButton = this.toolbar.element.querySelector(
      '[data-command="letter-spacing"]'
    );
    if (lsButton) {
      lsButton.innerHTML = "A ↔ A";
      lsButton.title = "Lettrage (Letter-spacing)";
      lsButton.classList.remove("editing");
    }

    this.currentSpan = null;

    // Masquer la toolbar maintenant
    this.toolbar.isVisible = false;
    this.toolbar.element.classList.remove("visible");
  }

  triggerAutoCopy() {
    clearTimeout(this.autoCopyTimeout);
    this.autoCopyTimeout = setTimeout(() => {
      const utilsExt = this.toolbar.extensions.find(
        (ext) => ext.constructor.name === "UtilsExtension"
      );
      if (utilsExt) {
        utilsExt.copyElementAsMarkdown(true);
      }
    }, 300);
  }

  // Méthode pour nettoyer lors du reset
  resetLetterSpacing(element) {
    const letterSpacingSpans = element.querySelectorAll('span[style*="--ls"]');
    letterSpacingSpans.forEach((span) => {
      if (span.classList.contains("editor-add")) {
        // Remplacer par le contenu
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
      }
    });
  }
}

// Extension pour espaces typographiques
class SpacingExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }

  getButtons() {
    return [
      new ToolbarButton("nbsp", "⎵", "Espace insécable", () => {
        this.insertNonBreakingSpace();
      }),
      new ToolbarButton("nnbsp", "⸱", "Espace insécable fine", () => {
        this.insertNarrowNonBreakingSpace();
      }),
      new ToolbarButton("quote-open", "«", "Guillemet ouvrant", () => {
        this.insertOpeningQuote();
      }),
      new ToolbarButton("quote-close", "»", "Guillemet fermant", () => {
        this.insertClosingQuote();
      }),
      new ToolbarButton(
        "quote-en-open",
        '"',
        "Guillemet ouvrant anglais",
        () => {
          this.insertEnglishOpeningQuote();
        }
      ),
      new ToolbarButton(
        "quote-en-close",
        '"',
        "Guillemet fermant anglais",
        () => {
          this.insertEnglishClosingQuote();
        }
      ),
      new ToolbarButton("br", "↵", "Saut de ligne", () => {
        this.insertBreak();
      }),
      new ToolbarButton("reset", "⟲", "Supprimer transformations", () => {
        this.resetTransformations();
      }),
    ];
  }

  insertNonBreakingSpace() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const span = document.createElement("span");
      span.className = "i_space non-breaking-space editor-add";
      span.textContent = "\u00A0";

      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertNarrowNonBreakingSpace() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const span = document.createElement("span");
      span.className = "i_space narrow-no-break-space editor-add";
      span.textContent = "\u202F";

      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertOpeningQuote() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Créer « + espace fine insécable avec span
      const fragment = document.createDocumentFragment();
      const quote = document.createElement("span");
      quote.className = "editor-add";
      quote.textContent = "«";
      fragment.appendChild(quote);

      const span = document.createElement("span");
      span.className = "i_space narrow-no-break-space editor-add";
      span.textContent = "\u202F";
      fragment.appendChild(span);

      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertClosingQuote() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Créer espace fine insécable + » avec span
      const fragment = document.createDocumentFragment();

      const span = document.createElement("span");
      span.className = "i_space narrow-no-break-space editor-add";
      span.textContent = "\u202F";
      fragment.appendChild(span);

      const quote = document.createElement("span");
      quote.className = "editor-add";
      quote.textContent = "»";
      fragment.appendChild(quote);

      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertBreak() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const br = document.createElement("br");
      br.className = "editor-add";
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertEnglishOpeningQuote() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const quote = document.createElement("span");
      quote.className = "editor-add";
      quote.textContent = "“";

      range.insertNode(quote);
      range.setStartAfter(quote);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertEnglishClosingQuote() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const quote = document.createElement("span");
      quote.className = "editor-add";
      quote.textContent = "”";

      range.insertNode(quote);
      range.setStartAfter(quote);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // Dans toolbar.js, classe SpacingExtension

  resetTransformations() {

    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    let element = selection.anchorNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    // Trouver l'élément éditable parent
    while (element && !element.hasAttribute("data-editable")) {
      element = element.parentElement;
    }

    if (!element) return;

    // Nettoyer letter-spacing
    const letterSpacingExt = this.toolbar.extensions.find(
      (ext) => ext instanceof LetterSpacingExtension
    );
    if (letterSpacingExt) {
      letterSpacingExt.resetLetterSpacing(element);
    }

    this.resetAllQuotes(element);

    const remainingSpaceSpans = element.querySelectorAll(
      "span.i_space.editor-add"
    );
    remainingSpaceSpans.forEach((span) => {
      const textNode = document.createTextNode(" ");
      span.parentNode.replaceChild(textNode, span);
    });

    // 4. Supprimer les autres spans ajoutés par l'éditeur (mais pas les guillemets déjà traités)
    const otherSpans = element.querySelectorAll(
      "span.editor-add:not(.i_space)"
    );
    otherSpans.forEach((span) => {
      // Vérifier que ce n'est pas un guillemet déjà traité
      if (!this.isQuoteSpan(span)) {
        while (span.firstChild) {
          span.parentNode.insertBefore(span.firstChild, span);
        }
        span.parentNode.removeChild(span);
      }
    });

    // 5. Supprimer formatage Bold/Italic ajouté par l'éditeur uniquement
    const boldElements = element.querySelectorAll(
      "strong.editor-add, b.editor-add"
    );
    boldElements.forEach((el) => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });

    const italicElements = element.querySelectorAll(
      "em.editor-add, i.editor-add"
    );
    italicElements.forEach((el) => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });

    // 6. Supprimer SmallCaps ajoutés par l'éditeur uniquement
    const smallCapsElements = element.querySelectorAll(
      "span.small-caps.editor-add"
    );
    smallCapsElements.forEach((el) => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });

    // 7. Supprimer Superscript ajoutés par l'éditeur uniquement
    const supElements = element.querySelectorAll("sup.editor-add");
    supElements.forEach((el) => {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    });

    // 8. Supprimer les <br> ajoutés par l'éditeur
    const brElements = element.querySelectorAll("br.editor-add");
    brElements.forEach((br) => {
      br.parentNode.removeChild(br);
    });

    // 9. Normaliser les nœuds de texte
    element.normalize();
  }

  resetFrenchQuotes(element) {
    // Rechercher tous les patterns de guillemets français
    // Pattern 1: « + espace fine (guillemet ouvrant)
    this.removeFrenchQuotePattern(element, "«", "\u202F");

    // Pattern 2: espace fine + » (guillemet fermant)
    this.removeFrenchQuotePattern(element, "\u202F", "»");
  }

  removeFrenchQuotePattern(element, firstChar, secondChar) {
    // Approche plus simple et robuste
    const allSpans = element.querySelectorAll("span.editor-add");
    const spansToRemove = [];

    for (let i = 0; i < allSpans.length - 1; i++) {
      const currentSpan = allSpans[i];
      const nextSpan = allSpans[i + 1];

      // Vérifier si les spans sont adjacents (frères directs)
      if (currentSpan.nextSibling === nextSpan) {
        // Pattern « + espace fine
        if (
          currentSpan.textContent === firstChar &&
          nextSpan.textContent === secondChar
        ) {
          spansToRemove.push(currentSpan);
          spansToRemove.push(nextSpan);
        }
      }
    }

    // Supprimer les spans identifiés
    spansToRemove.forEach((span) => {
      if (span.parentNode) {
        span.parentNode.removeChild(span);
      }
    });
  }

  resetEnglishQuotes(element) {
    // Supprimer les guillemets anglais ajoutés par l'éditeur
    const englishQuoteSpans = element.querySelectorAll("span.editor-add");
    englishQuoteSpans.forEach((span) => {
      if (span.textContent === '"' || span.textContent === '"') {
        span.parentNode.removeChild(span);
      }
    });
  }

  resetAllQuotes(element) {
    // Approche globale pour nettoyer tous les guillemets
    const allEditorSpans = element.querySelectorAll("span.editor-add");
    const spansToRemove = [];

    for (let i = 0; i < allEditorSpans.length; i++) {
      const span = allEditorSpans[i];
      const content = span.textContent;

      // Identifier les guillemets et espaces typographiques
      if (
        content === "«" ||
        content === "»" ||
        content === '“' ||
        content === '”' ||
        content === "\u202F"
      ) {
        // espace fine insécable
        spansToRemove.push(span);
      }
    }

    // Supprimer tous les spans identifiés
    spansToRemove.forEach((span) => {
      if (span.parentNode) {
        span.parentNode.removeChild(span);
      }
    });
  }

  isQuoteSpan(span) {
    const text = span.textContent;
    return text === "«" || text === "»" || text === '"' || text === '"';
  }
}

// Extension utilitaires
class UtilsExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }

  getButtons() {
    return [
      new ToolbarButton("copy-md", "📋", "Copier élément en Markdown", () => {
        this.copyElementAsMarkdown();
      }),
    ];
  }

  copyElementAsMarkdown(silent) {
    // Focus le document avant copie
    window.focus();
    document.body.focus();

    if (typeof silent === "undefined") silent = false;
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    let element = selection.anchorNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    // Chercher l'élément éditable
    while (element && !element.hasAttribute("data-editable")) {
      element = element.parentElement;
    }

    if (!element) return;

    // Trouver le parent blockquote/figure/etc si existe
	let containerElement = element.parentElement;
	while (containerElement && containerElement !== document.body) {
	if (["BLOCKQUOTE", "UL", "OL"].includes(containerElement.tagName)) {
	element = containerElement;
	break;
	}
	containerElement = containerElement.parentElement;
	}

    // Reconstituer l'élément complet si scindé par PagedJS
    const completeHTML = this.reconstructSplitElement(element);
    const markdown = this.toolbar.turndown.turndown(completeHTML);

    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        if (!silent) {
          this.toolbar.showCopyFeedback();
        }
      })
      .catch((err) => {
        console.error("Erreur copie:", err);
      });
  }

  reconstructSplitElement(element) {
    const dataRef = element.getAttribute("data-ref");

    if (!dataRef) {
      return element.outerHTML;
    }

    const fragments = document.querySelectorAll(`[data-ref="${dataRef}"]`);

    if (fragments.length <= 1) {
      return element.outerHTML;
    }

    // Pour éléments scindés, reconstituer avec balises
    const firstFragment = fragments[0];
    let completeContent = "";
    fragments.forEach((fragment) => {
      completeContent += fragment.innerHTML;
    });

    const tagName = firstFragment.tagName.toLowerCase();
    return `<${tagName}>${completeContent}</${tagName}>`;
  }
}

export class Toolbar {
  constructor(editor) {
    this.editor = editor;
    this.element = null;
    this.isVisible = false;
    this.buttons = new Map();
    this.extensions = [];

    this.setupTurndown();
    this.registerExtensions();
    this.createToolbar();
  }

  setupTurndown() {
    this.turndown = new window.TurndownService({
      headingStyle: "atx",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
    });

    // Utiliser les plugins modulaires
    this.turndown.use([
      coreRulesPlugin,
      textColPlugin,
      breakColumnPlugin,
      typographyPlugin,
      footnotesPlugin,
      spacesPlugin,
      annotationsPlugin,
    ]);

    window.mainTurndownService = this.turndown;
  }

  registerExtensions() {
    this.extensions = [
      new FormattingExtension(this),
      new LetterSpacingExtension(this),
      new SpacingExtension(this),
      new UtilsExtension(this),
    ];
  }

  createToolbar() {
    this.element = document.createElement("div");
    this.element.className = "paged-editor-toolbar";

    // Générer boutons depuis extensions
    let buttonsHTML = "";
    this.extensions.forEach((extension) => {
      extension.getButtons().forEach((button) => {
        this.buttons.set(button.command, button);
        buttonsHTML += button.render();
      });
    });

    this.element.innerHTML = buttonsHTML;
    document.body.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    this.element.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      const command = button.dataset.command;
      const buttonObj = this.buttons.get(command);
      if (buttonObj && buttonObj.action) {
        buttonObj.action();
        this.updateButtonStates();
      }
    });

    // Event listener spécial pour copy-md pendant letter-spacing
    document.addEventListener("click", (e) => {
      const button = e.target.closest('button[data-command="copy-md"]');
      if (button && this.element.contains(button)) {
        const buttonObj = this.buttons.get("copy-md");
        if (buttonObj && buttonObj.action) {
          buttonObj.action();
        }
      }
    });
  }

  show(selection) {
    if (!selection || !selection.range) return;

    this.isVisible = true;
    this.element.classList.add("visible");

    this.positionToolbar(selection.range);
    this.updateButtonStates();
  }

  hide() {
    // Ne pas masquer si l'input letter-spacing est actif
    const letterSpacingExt = this.extensions.find(
      (ext) => ext instanceof LetterSpacingExtension
    );
    if (
      letterSpacingExt &&
      letterSpacingExt.input &&
      letterSpacingExt.input.style.display !== "none"
    ) {
      return;
    }

    this.isVisible = false;
    this.element.classList.remove("visible");
  }

  positionToolbar(range) {
    const rect = range.getBoundingClientRect();

    // Vérifier si les coordonnées sont valides
    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }

    const toolbarRect = this.element.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
    let top = rect.top - toolbarRect.height - 50;

    const margin = 10;
    if (left < margin) left = margin;
    if (left + toolbarRect.width > window.innerWidth - margin) {
      left = window.innerWidth - toolbarRect.width - margin;
    }

    if (top < margin) {
      top = rect.bottom + 20;
    }

    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${top + window.scrollY}px`;
  }

  updateButtonStates() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const element =
      ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor;

    const isBold = this.isFormatActive("bold", element);
    const isItalic = this.isFormatActive("italic", element);
    const isSmallCaps = this.isFormatActive("smallcaps", element);
    const isSuperscript = this.isFormatActive("superscript", element);
    const hasLetterSpacing = this.hasLetterSpacing(element);

    this.element
      .querySelector('[data-command="smallcaps"]')
      ?.classList.toggle("active", isSmallCaps);
    this.element
      .querySelector('[data-command="superscript"]')
      ?.classList.toggle("active", isSuperscript);
    this.element
      .querySelector('[data-command="letter-spacing"]')
      ?.classList.toggle("active", hasLetterSpacing);
  }

  isFormatActive(format, element) {
    const tags = {
      bold: ["B", "STRONG"],
      italic: ["I", "EM"],
      smallcaps: ["SPAN"],
      superscript: ["SUP"],
    };

    let current = element;
    while (current && current !== document.body) {
      if (format === "smallcaps") {
        if (
          current.tagName === "SPAN" &&
          current.classList.contains("small-caps")
        ) {
          return true;
        }
      } else if (format === "superscript") {
        if (current.tagName === "SUP") {
          return true;
        }
      } else if (tags[format] && tags[format].includes(current.tagName)) {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  hasLetterSpacing(element) {
    let current = element;
    while (current && current !== document.body) {
      if (
        current.tagName === "SPAN" &&
        current.style.getPropertyValue("--ls") !== ""
      ) {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  showCopyFeedback() {
    const button = this.element.querySelector('[data-command="copy-md"]');
    const originalText = button.innerHTML;
    button.innerHTML = "✓";
    button.classList.add("success");

    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove("success");
    }, 1000);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
