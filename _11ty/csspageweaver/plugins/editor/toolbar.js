import { UNICODE_CHARS } from "./unicode.js";

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
      const checkIcon = `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0ibTkgMTIgMiAyIDQtNCIvPjwvc3ZnPg==" style="width: 16px; height: 16px; filter: invert(1);" alt="Check">`;
      lsButton.innerHTML = checkIcon;
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
      new ToolbarButton(
        "quotes-fr",
        `${UNICODE_CHARS.LAQUO} ${UNICODE_CHARS.RAQUO}`,
        "Guillemets français",
        () => {
          this.toggleFrenchQuotes();
        }
      ),
      new ToolbarButton(
        "quotes-en",
        `${UNICODE_CHARS.LDQUO} ${UNICODE_CHARS.RDQUO}`,
        "Guillemets anglais",
        () => {
          this.toggleEnglishQuotes();
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
      span.textContent = UNICODE_CHARS.NO_BREAK_SPACE;

      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);

      selection.removeAllRanges();
      try {
        if (range.startContainer.isConnected) {
          selection.addRange(range);
        }
      } catch (error) {
        console.warn("Range invalide:", error);
      }
    }
  }

  insertNarrowNonBreakingSpace() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const span = document.createElement("span");
      span.className = "i_space narrow-no-break-space editor-add";
      span.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);

      selection.removeAllRanges();
      try {
        if (range.startContainer.isConnected) {
          selection.addRange(range);
        }
      } catch (error) {
        console.warn("Range invalide:", error);
      }
    }
  }

  toggleFrenchQuotes() {
    const selection = this.toolbar.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    // Vérifier si déjà entouré de guillemets français
    if (this.isWrappedInFrenchQuotes(range)) {
      this.unwrapFrenchQuotes(range);
    } else {
      this.wrapWithFrenchQuotes(range);
    }
  }

  toggleEnglishQuotes() {
    const selection = this.toolbar.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    // Vérifier si déjà entouré de guillemets anglais
    if (this.isWrappedInEnglishQuotes(range)) {
      this.unwrapEnglishQuotes(range);
    } else {
      this.wrapWithEnglishQuotes(range);
    }
  }

  wrapWithFrenchQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemet ouvrant
    const openQuote = document.createElement("span");
    openQuote.className = "editor-add french-quote-open";
    openQuote.textContent = UNICODE_CHARS.LAQUO;
    wrapper.appendChild(openQuote);

    // Espace fine
    const openSpace = document.createElement("span");
    openSpace.className = "i_space narrow-no-break-space editor-add";
    openSpace.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;
    wrapper.appendChild(openSpace);

    // Contenu
    wrapper.appendChild(contents);

    // Espace fine
    const closeSpace = document.createElement("span");
    closeSpace.className = "i_space narrow-no-break-space editor-add";
    closeSpace.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;
    wrapper.appendChild(closeSpace);

    // Guillemet fermant
    const closeQuote = document.createElement("span");
    closeQuote.className = "editor-add french-quote-close";
    closeQuote.textContent = UNICODE_CHARS.RAQUO;
    wrapper.appendChild(closeQuote);

    range.insertNode(wrapper);

    // Vérifier que le range est toujours valide avant de l'utiliser
    try {
      range.selectNodeContents(wrapper);
      const selection = window.getSelection();
      selection.removeAllRanges();

      // Vérifier que le range est dans le document
      if (range.startContainer.isConnected && range.endContainer.isConnected) {
        selection.addRange(range);
      }
    } catch (error) {
      console.warn("Range invalide après insertion:", error);
    }
  }

  wrapWithEnglishQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemet ouvrant anglais
    const openQuote = document.createElement("span");
    openQuote.className = "editor-add english-quote-open";
    openQuote.textContent = UNICODE_CHARS.LDQUO;
    wrapper.appendChild(openQuote);

    // Contenu
    wrapper.appendChild(contents);

    // Guillemet fermant anglais
    const closeQuote = document.createElement("span");
    closeQuote.className = "editor-add english-quote-close";
    closeQuote.textContent = UNICODE_CHARS.RDQUO;
    wrapper.appendChild(closeQuote);

    range.insertNode(wrapper);

    // Vérifier que le range est toujours valide avant de l'utiliser
    try {
      range.selectNodeContents(wrapper);
      const selection = window.getSelection();
      selection.removeAllRanges();

      // Vérifier que le range est dans le document
      if (range.startContainer.isConnected && range.endContainer.isConnected) {
        selection.addRange(range);
      }
    } catch (error) {
      console.warn("Range invalide après insertion:", error);
    }
  }

  isWrappedInFrenchQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Chercher les éléments précédents et suivants pour détecter les guillemets français
    return this.hasAdjacentFrenchQuotes(parent, range);
  }

  isWrappedInEnglishQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Chercher les éléments précédents et suivants pour détecter les guillemets anglais
    return this.hasAdjacentEnglishQuotes(parent, range);
  }

  hasAdjacentFrenchQuotes(element, range) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let hasOpenQuote = false;
    let hasCloseQuote = false;
    let foundStart = false;

    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (
        node.classList &&
        node.classList.contains("french-quote-open") &&
        node.textContent === UNICODE_CHARS.LAQUO
      ) {
        if (!foundStart) hasOpenQuote = true;
      }

      if (range.intersectsNode(node)) {
        foundStart = true;
      }

      if (
        foundStart &&
        node.classList &&
        node.classList.contains("french-quote-close") &&
        node.textContent === UNICODE_CHARS.RAQUO
      ) {
        hasCloseQuote = true;
        break;
      }
    }

    return hasOpenQuote && hasCloseQuote;
  }

  hasAdjacentEnglishQuotes(element, range) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let hasOpenQuote = false;
    let hasCloseQuote = false;
    let foundStart = false;

    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (
        node.classList &&
        node.classList.contains("english-quote-open") &&
        node.textContent === UNICODE_CHARS.LDQUO
      ) {
        if (!foundStart) hasOpenQuote = true;
      }

      if (range.intersectsNode(node)) {
        foundStart = true;
      }

      if (
        foundStart &&
        node.classList &&
        node.classList.contains("english-quote-close") &&
        node.textContent === UNICODE_CHARS.RDQUO
      ) {
        hasCloseQuote = true;
        break;
      }
    }

    return hasOpenQuote && hasCloseQuote;
  }

  unwrapFrenchQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Supprimer tous les éléments de guillemets français autour de la sélection
    const quotesToRemove = parent.querySelectorAll(
      ".french-quote-open, .french-quote-close, .i_space.editor-add"
    );
    quotesToRemove.forEach((quote) => {
      if (quote.parentNode) {
        quote.parentNode.removeChild(quote);
      }
    });

    parent.normalize();
  }

  unwrapEnglishQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Supprimer tous les éléments de guillemets anglais autour de la sélection
    const quotesToRemove = parent.querySelectorAll(
      ".english-quote-open, .english-quote-close"
    );
    quotesToRemove.forEach((quote) => {
      if (quote.parentNode) {
        quote.parentNode.removeChild(quote);
      }
    });

    parent.normalize();
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
      try {
        if (range.startContainer.isConnected) {
          selection.addRange(range);
        }
      } catch (error) {
        console.warn("Range invalide:", error);
      }
    }
  }

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

    // Supprimer les autres spans ajoutés par l'éditeur
    const otherSpans = element.querySelectorAll(
      "span.editor-add:not(.i_space)"
    );
    otherSpans.forEach((span) => {
      if (!this.isQuoteSpan(span)) {
        while (span.firstChild) {
          span.parentNode.insertBefore(span.firstChild, span);
        }
        span.parentNode.removeChild(span);
      }
    });

    // Supprimer formatage Bold/Italic/SmallCaps/Superscript/br ajoutés par l'éditeur
    [
      "strong.editor-add",
      "b.editor-add",
      "em.editor-add",
      "i.editor-add",
      "span.small-caps.editor-add",
      "sup.editor-add",
      "br.editor-add",
    ].forEach((selector) => {
      const elements = element.querySelectorAll(selector);
      elements.forEach((el) => {
        if (el.tagName === "BR") {
          el.parentNode.removeChild(el);
        } else {
          while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
          }
          el.parentNode.removeChild(el);
        }
      });
    });

    // Normaliser les nœuds de texte
    element.normalize();
  }

  resetAllQuotes(element) {
    // Approche globale pour nettoyer tous les guillemets
    const allEditorSpans = element.querySelectorAll("span.editor-add");
    const spansToRemove = [];

    for (let i = 0; i < allEditorSpans.length; i++) {
      const span = allEditorSpans[i];
      const content = span.textContent;

      // Identifier les guillemets et espaces typographiques en utilisant les constantes
      // ou par leurs classes
      if (
        content === UNICODE_CHARS.LAQUO ||
        content === UNICODE_CHARS.RAQUO ||
        content === UNICODE_CHARS.LDQUO ||
        content === UNICODE_CHARS.RDQUO ||
        content === UNICODE_CHARS.NO_BREAK_THIN_SPACE ||
        span.classList.contains("french-quote-open") ||
        span.classList.contains("french-quote-close") ||
        span.classList.contains("english-quote-open") ||
        span.classList.contains("english-quote-close")
      ) {
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
    return (
      text === UNICODE_CHARS.LAQUO ||
      text === UNICODE_CHARS.RAQUO ||
      text === UNICODE_CHARS.LDQUO ||
      text === UNICODE_CHARS.RDQUO ||
      span.classList.contains("french-quote-open") ||
      span.classList.contains("french-quote-close") ||
      span.classList.contains("english-quote-open") ||
      span.classList.contains("english-quote-close")
    );
  }
}
// Extension utilitaires
class UtilsExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
  }

  getButtons() {
    return [
      new ToolbarButton(
        "copy-md",
        `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNsaXBib2FyZC1jb3B5LWljb24gbHVjaWRlLWNsaXBib2FyZC1jb3B5Ij48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI0IiB4PSI4IiB5PSIyIiByeD0iMSIgcnk9IjEiLz48cGF0aCBkPSJNOCA0SDZhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTIiLz48cGF0aCBkPSJNMTYgNGgyYTIgMiAwIDAgMSAyIDJ2NCIvPjxwYXRoIGQ9Ik0yMSAxNEgxMSIvPjxwYXRoIGQ9Im0xNSAxMC00IDQgNCA0Ii8+PC9zdmc+" style="width: 16px; height: 16px; filter: invert(1);" alt="Copy">`,
        "Copier élément en Markdown",
        () => {
          this.copyElementAsMarkdown();
        }
      ),
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
    const checkIcon = `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0ibTkgMTIgMiAyIDQtNCIvPjwvc3ZnPg==" style="width: 16px; height: 16px; filter: invert(1);" alt="Check">`;
    button.innerHTML = checkIcon;
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
