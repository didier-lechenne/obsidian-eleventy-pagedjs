/**
 * @name Commands
 * @file Commandes d'édition et formatage
 *
 */

import { UNICODE_CHARS } from "./unicode.js";

export class Commands {
  constructor(editor) {
    this.editor = editor;
  }

  toggleBold() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    // Vérifier si déjà en gras
    if (this.isWrappedInTag(range, ["B", "STRONG"])) {
      this.unwrapTag(range, ["B", "STRONG"]);
    } else {
      this.wrapSelection(range, "strong");
    }
  }

  toggleItalic() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    if (this.isWrappedInTag(range, ["I", "EM"])) {
      this.unwrapTag(range, ["I", "EM"]);
    } else {
      this.wrapSelection(range, "em");
    }
  }

  toggleSmallCaps() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    if (this.isWrappedInTag(range, ["SPAN"], "small-caps")) {
      this.unwrapTag(range, ["SPAN"]);
    } else {
      this.wrapSelection(range, "span", "small-caps");
    }
  }

  toggleSuperscript() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    if (this.isWrappedInTag(range, ["SUP"])) {
      this.unwrapTag(range, ["SUP"]);
    } else {
      this.wrapSelection(range, "sup");
    }
  }

  toggleLetterSpacing() {
    // Déléguer à l'extension LetterSpacing via la toolbar
    const letterSpacingExt = this.editor.toolbar.extensions.find(
      (ext) => ext.constructor.name === "LetterSpacingExtension"
    );

    if (letterSpacingExt) {
      letterSpacingExt.handleLetterSpacingToggle();
    }
  }

  findLetterSpacingSpan(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    let current = container;
    while (current && current !== document.body) {
      if (
        current.tagName === "SPAN" &&
        current.style.getPropertyValue("--ls") !== ""
      ) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  wrapWithLetterSpacing(range) {
    const contents = range.extractContents();
    const span = document.createElement("span");
    span.style.setProperty("--ls", "0");
    span.className = "editor-add";
    span.appendChild(contents);

    range.insertNode(span);
    range.selectNodeContents(span);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    return span;
  }

  toggleFrenchQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
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
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection || !selection.isValid) return;

    const range = selection.range;

    if (this.isWrappedInEnglishQuotes(range)) {
      this.unwrapEnglishQuotes(range);
    } else {
      this.wrapWithEnglishQuotes(range);
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

    // Supprimer tous les formatages ajoutés par l'éditeur
    this.resetAllFormatting(element);
  }

  copyElementAsMarkdown(silent = false) {
    window.focus();
    document.body.focus();

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

    // Reconstituer l'élément complet si scindé par PagedJS
    const completeHTML = this.reconstructSplitElement(element);
    const markdown = this.editor.toolbar.turndown.turndown(completeHTML);

    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        if (!silent && this.editor.toolbar.showCopyFeedback) {
          this.editor.toolbar.showCopyFeedback();
        }
      })
      .catch((err) => {
        console.error("Erreur copie:", err);
      });
  }

  // ====== MÉTHODES UTILITAIRES POUR GUILLEMETS FRANÇAIS ======

  wrapWithFrenchQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemet ouvrant avec les constantes Unicode
    const openQuote = document.createElement("span");
    openQuote.className = "editor-add french-quote-open";
    openQuote.textContent = UNICODE_CHARS.LAQUO; // «
    wrapper.appendChild(openQuote);

    // Espace fine insécable selon les règles françaises
    const openSpace = document.createElement("span");
    openSpace.className = "i_space narrow-no-break-space editor-add";
    openSpace.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE; // \u202F
    wrapper.appendChild(openSpace);

    // Insérer le contenu sélectionné
    wrapper.appendChild(contents);

    // Espace fine insécable avant le guillemet fermant
    const closeSpace = document.createElement("span");
    closeSpace.className = "i_space narrow-no-break-space editor-add";
    closeSpace.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE; // \u202F
    wrapper.appendChild(closeSpace);

    // Guillemet fermant français
    const closeQuote = document.createElement("span");
    closeQuote.className = "editor-add french-quote-close";
    closeQuote.textContent = UNICODE_CHARS.RAQUO; // »
    wrapper.appendChild(closeQuote);

    range.insertNode(wrapper);

    // Réajuster la sélection sur le nouveau contenu avec gestion d'erreur
    try {
      range.selectNodeContents(wrapper);
      const selection = window.getSelection();
      selection.removeAllRanges();

      // Vérifier que le range est encore connecté au document
      if (range.startContainer.isConnected && range.endContainer.isConnected) {
        selection.addRange(range);
      }
    } catch (error) {
      console.warn(
        "Range invalide après insertion des guillemets français:",
        error
      );
    }
  }

  wrapWithEnglishQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemet ouvrant anglais - pas d'espace selon les règles anglaises
    const openQuote = document.createElement("span");
    openQuote.className = "editor-add english-quote-open";
    openQuote.textContent = UNICODE_CHARS.LDQUO; // "
    wrapper.appendChild(openQuote);

    // Contenu directement collé au guillemet (règle anglaise)
    wrapper.appendChild(contents);

    // Guillemet fermant anglais - directement collé au contenu
    const closeQuote = document.createElement("span");
    closeQuote.className = "editor-add english-quote-close";
    closeQuote.textContent = UNICODE_CHARS.RDQUO; // "
    wrapper.appendChild(closeQuote);

    range.insertNode(wrapper);

    // Réajuster la sélection avec gestion d'erreur
    try {
      range.selectNodeContents(wrapper);
      const selection = window.getSelection();
      selection.removeAllRanges();

      if (range.startContainer.isConnected && range.endContainer.isConnected) {
        selection.addRange(range);
      }
    } catch (error) {
      console.warn(
        "Range invalide après insertion des guillemets anglais:",
        error
      );
    }
  }

  // ====== MÉTHODES DE DÉTECTION DES GUILLEMETS ======

  isWrappedInFrenchQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Utiliser la méthode de détection spécialisée pour les guillemets français
    return this.hasAdjacentFrenchQuotes(parent, range);
  }

  isWrappedInEnglishQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Utiliser la méthode de détection spécialisée pour les guillemets anglais
    return this.hasAdjacentEnglishQuotes(parent, range);
  }

  hasAdjacentFrenchQuotes(element, range) {
    // Créer un TreeWalker pour parcourir efficacement les éléments
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let hasOpenQuote = false;
    let hasCloseQuote = false;
    let foundStart = false;

    // Parcourir tous les éléments pour trouver les guillemets français
    while (walker.nextNode()) {
      const node = walker.currentNode;

      // Chercher le guillemet ouvrant français avant la sélection
      if (
        node.classList?.contains("french-quote-open") &&
        node.textContent === UNICODE_CHARS.LAQUO
      ) {
        if (!foundStart) hasOpenQuote = true;
      }

      // Marquer le début de la zone de sélection
      if (range.intersectsNode(node)) {
        foundStart = true;
      }

      // Chercher le guillemet fermant français après la sélection
      if (
        foundStart &&
        node.classList?.contains("french-quote-close") &&
        node.textContent === UNICODE_CHARS.RAQUO
      ) {
        hasCloseQuote = true;
        break; // Arrêter la recherche une fois trouvé
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

    // Même logique que pour les guillemets français, mais avec les caractères anglais
    while (walker.nextNode()) {
      const node = walker.currentNode;

      // Guillemet ouvrant anglais
      if (
        node.classList?.contains("english-quote-open") &&
        node.textContent === UNICODE_CHARS.LDQUO
      ) {
        if (!foundStart) hasOpenQuote = true;
      }

      if (range.intersectsNode(node)) {
        foundStart = true;
      }

      // Guillemet fermant anglais
      if (
        foundStart &&
        node.classList?.contains("english-quote-close") &&
        node.textContent === UNICODE_CHARS.RDQUO
      ) {
        hasCloseQuote = true;
        break;
      }
    }

    return hasOpenQuote && hasCloseQuote;
  }

  // ====== MÉTHODES DE SUPPRESSION DES GUILLEMETS ======

  unwrapFrenchQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Identifier et supprimer tous les éléments des guillemets français
    const elementsToRemove = [];

    // Chercher tous les spans liés aux guillemets français dans la zone
    const allSpans = parent.querySelectorAll("span.editor-add");

    for (const span of allSpans) {
      const content = span.textContent;

      // Identifier les éléments des guillemets français
      if (
        content === UNICODE_CHARS.LAQUO ||
        content === UNICODE_CHARS.RAQUO ||
        content === UNICODE_CHARS.NO_BREAK_THIN_SPACE ||
        span.classList.contains("french-quote-open") ||
        span.classList.contains("french-quote-close") ||
        span.classList.contains("narrow-no-break-space")
      ) {
        elementsToRemove.push(span);
      }
    }

    // Supprimer les éléments identifiés
    elementsToRemove.forEach((span) => {
      if (span.parentNode) {
        span.parentNode.removeChild(span);
      }
    });

    // Normaliser les nœuds de texte après suppression
    parent.normalize();
  }

  unwrapEnglishQuotes(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    const elementsToRemove = [];
    const allSpans = parent.querySelectorAll("span.editor-add");

    for (const span of allSpans) {
      const content = span.textContent;

      // Identifier uniquement les guillemets anglais (pas d'espaces fines)
      if (
        content === UNICODE_CHARS.LDQUO ||
        content === UNICODE_CHARS.RDQUO ||
        span.classList.contains("english-quote-open") ||
        span.classList.contains("english-quote-close")
      ) {
        elementsToRemove.push(span);
      }
    }

    elementsToRemove.forEach((span) => {
      if (span.parentNode) {
        span.parentNode.removeChild(span);
      }
    });

    parent.normalize();
  }

  // ====== MÉTHODES DE RESET ET RECONSTRUCTION ======

  resetAllFormatting(element) {
    // Supprimer tous les formatages ajoutés par l'éditeur
    const selectorsToRemove = [
      "strong.editor-add",
      "b.editor-add",
      "em.editor-add",
      "i.editor-add",
      "span.small-caps.editor-add",
      "sup.editor-add",
      "br.editor-add",
      "span.editor-add", // Inclure tous les spans editor-add
    ];

    selectorsToRemove.forEach((selector) => {
      const elements = element.querySelectorAll(selector);
      elements.forEach((el) => {
        if (el.tagName === "BR") {
          // Supprimer les sauts de ligne ajoutés
          el.parentNode.removeChild(el);
        } else {
          // Pour les autres éléments, remplacer par leur contenu
          while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
          }
          el.parentNode.removeChild(el);
        }
      });
    });

    // Normaliser les nœuds de texte après toutes les suppressions
    element.normalize();
  }

  reconstructSplitElement(element) {
    // Vérifier si l'élément a été scindé par PagedJS
    const dataRef = element.getAttribute("data-ref");

    if (!dataRef) {
      // Pas d'attribut data-ref, retourner l'HTML tel quel
      return element.outerHTML;
    }

    // Chercher tous les fragments avec le même data-ref
    const fragments = document.querySelectorAll(`[data-ref="${dataRef}"]`);

    if (fragments.length <= 1) {
      // Un seul fragment, pas de scission
      return element.outerHTML;
    }

    // Plusieurs fragments détectés - reconstituer l'élément complet
    const firstFragment = fragments[0];
    let completeContent = "";

    // Concatener le contenu de tous les fragments dans l'ordre
    fragments.forEach((fragment) => {
      completeContent += fragment.innerHTML;
    });

    // Recréer l'élément complet avec la même balise que le premier fragment
    const tagName = firstFragment.tagName.toLowerCase();

    // Préserver les attributs importants du premier fragment (sauf data-split-*)
    let attributes = "";
    if (firstFragment.className) {
      attributes += ` class="${firstFragment.className}"`;
    }
    if (firstFragment.id) {
      attributes += ` id="${firstFragment.id}"`;
    }

    return `<${tagName}${attributes}>${completeContent}</${tagName}>`;
  }

  wrapSelection(range, tagName, className = null) {
    const contents = range.extractContents();
    const wrapper = document.createElement(tagName);
    wrapper.className = className ? `${className} editor-add` : "editor-add";
    wrapper.appendChild(contents);
    range.insertNode(wrapper);

    // Maintenir la sélection
    range.selectNodeContents(wrapper);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  unwrapTag(range, tagNames) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    // Trouver l'élément de formatage parent
    let formatElement = null;
    let current = container;

    while (current && current !== document.body) {
      if (tagNames.includes(current.tagName)) {
        formatElement = current;
        break;
      }
      current = current.parentElement;
    }

    if (formatElement) {
      // Remplacer l'élément par son contenu
      const parent = formatElement.parentNode;
      while (formatElement.firstChild) {
        parent.insertBefore(formatElement.firstChild, formatElement);
      }
      parent.removeChild(formatElement);

      // Normaliser les nœuds de texte adjacents
      parent.normalize();
    }
  }

  isWrappedInTag(range, tagNames, className = null) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    let current = container;
    while (current && current !== document.body) {
      if (tagNames.includes(current.tagName)) {
        if (className) {
          return current.classList.contains(className);
        }
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  insertText(text) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  insertHTML(html) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const fragment = range.createContextualFragment(html);
    range.insertNode(fragment);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  deleteSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
  }

  selectAll(element) {
    const range = document.createRange();
    range.selectNodeContents(element);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
