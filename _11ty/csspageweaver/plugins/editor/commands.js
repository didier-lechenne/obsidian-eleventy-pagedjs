/**
 * @name Commands
 * @file Commandes d'édition et formatage 
 *
 * Cette version utilise une approche cohérente pour toutes les fonctionnalités :
 * - Toggle simple pour créer/supprimer des éléments
 * - Letter-spacing avec input intégré dans le DOM (pas d'interface flottante)
 * - Logique unifiée pour le reset des transformations
 */

import { UNICODE_CHARS } from "./unicode.js";

// Constante HTML pour l'input letter-spacing intégré
// Cette approche évite la complexité d'un input flottant en l'intégrant directement dans le document
const LETTERSPACING_INPUT_HTML = ``;

export class Commands {
  constructor(editor) {
    this.editor = editor;

    // Simplification du constructeur : plus besoin de gérer un input global
    // L'input est maintenant créé à la demande et intégré dans le DOM
    this.autoCopyTimeout = null;
  }

  // ====== COMMANDES DE FORMATAGE DE BASE ======
  // Ces méthodes restent identiques à votre version existante
  // Elles suivent le pattern : vérifier sélection → toggle état → déclencher copie

  toggleBold() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    if (this.isWrappedInTag(range, ["B", "STRONG"])) {
      this.unwrapTag(range, ["B", "STRONG"]);
    } else {
      this.wrapSelection(range, "strong");
    }
    this.triggerAutoCopy();
  }

  toggleItalic() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    if (this.isWrappedInTag(range, ["I", "EM"])) {
      this.unwrapTag(range, ["I", "EM"]);
    } else {
      this.wrapSelection(range, "em");
    }
    this.triggerAutoCopy();
  }

  toggleSmallCaps() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    if (this.isWrappedInTag(range, ["SPAN"], "small-caps")) {
      this.unwrapTag(range, ["SPAN"]);
    } else {
      this.wrapSelection(range, "span", "small-caps");
    }
    this.triggerAutoCopy();
  }

  toggleSuperscript() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    if (this.isWrappedInTag(range, ["SUP"])) {
      this.unwrapTag(range, ["SUP"]);
    } else {
      this.wrapSelection(range, "sup");
    }
    this.triggerAutoCopy();
  }

  // ====== NOUVELLE COMMANDE LETTER-SPACING SIMPLIFIÉE ======
  // Cette approche suit exactement le même pattern que toggleSmallCaps
  // mais avec un input intégré pour permettre l'ajustement de la valeur

  toggleLetterSpacing() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;

    // Chercher si on est déjà dans un span letter-spacing
    const existingSpan = this.findLetterSpacingSpan(range);

    if (existingSpan) {
      // Mode suppression : enlever le span et son input
      this.unwrapLetterSpacing(existingSpan);
    } else {
      // Mode création : créer un span avec input intégré
      this.wrapWithLetterSpacing(range);
    }
  }

  // Recherche d'un span letter-spacing existant dans la sélection
  // Cette méthode simplifie l'ancienne logique complexe de détection
  findLetterSpacingSpan(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    // Remonte dans l'arbre DOM pour trouver un span avec letter-spacing
    let current = container;
    while (current && current !== document.body) {
      if (
        current.tagName === "SPAN" &&
        current.style.getPropertyValue("--ls") &&
        current.classList.contains("editor-add")
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Création d'un nouveau span letter-spacing avec input intégré
  // L'avantage de cette approche : l'input fait partie du document, pas d'interface flottante
  wrapWithLetterSpacing(range) {
    const selectedText = range.toString();

    const span = document.createElement("span");
    span.className = "editor-add";
    span.dataset.timestamp = Date.now();
    span.style.setProperty("--ls", "0");
    span.setAttribute("data-ls-id", "ls-" + Date.now()); // ID unique
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);

    //     this.attachInputListener(span); // Garde cette méthode mais modifie-la
    //     this.triggerAutoCopy();
  }

  // Gestion des événements pour l'input letter-spacing
  // Cette méthode centralise toute la logique d'interaction avec l'input
  attachInputListener(span) {
    const input = this.editor.toolbar.element.querySelector(".ls-input");
    if (!input) return;

    input.value = span.style.getPropertyValue("--ls") || "2";
    input.addEventListener("input", (e) => {
      span.style.setProperty("--ls", e.target.value);
      this.triggerAutoCopy();
    });
  }

  // Suppression d'un span letter-spacing
  // Récupère seulement le texte, en excluant l'input de contrôle
  unwrapLetterSpacing(span) {
    // Parcourir les enfants pour récupérer uniquement le texte
    // Cette approche évite de récupérer l'input dans le contenu final
    let textContent = "";
    span.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += node.textContent;
      }
    });

    // Remplacer le span complexe par un simple nœud de texte
    const textNode = document.createTextNode(textContent);
    span.parentNode.replaceChild(textNode, span);

    this.triggerAutoCopy();
  }

  applyLetterSpacing(value) {
    const input = document.querySelector(".ls-input");
    const targetId = input.getAttribute("data-target-span");
    const span = document.querySelector(`[data-ls-id="${targetId}"]`);

    if (span) {
      span.style.setProperty("--ls", value);
      this.triggerAutoCopy();
    }
  }

  // ====== COMMANDES D'INSERTION SIMPLE ======
  // Ces méthodes restent identiques à votre version existante

insertText(text) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  
  // Créer un span au lieu d'un textNode
  const span = document.createElement('span');
  span.className = 'editor-add';
  span.dataset.timestamp = Date.now();
  span.textContent = text;
  
  range.insertNode(span);
  range.setStartAfter(span);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
  this.triggerAutoCopy();
}

  // Méthode utilitaire pour les espaces typographiques
  insertTypographicSpan(content, className) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const span = document.createElement("span");
    span.className = className;
    span.dataset.timestamp = Date.now();
    span.textContent = content;

    range.insertNode(span);
    range.setStartAfter(span);
    range.collapse(true);

    selection.removeAllRanges();
    if (range.startContainer.isConnected) {
      selection.addRange(range);
      this.triggerAutoCopy();
    }
  }

  // ====== COMMANDES DE GUILLEMETS ======
  // Ces méthodes restent identiques à votre version existante

  toggleFrenchQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    if (this.isWrappedInFrenchQuotes(range)) {
      this.unwrapFrenchQuotes(range);
    } else {
      this.wrapWithFrenchQuotes(range);
    }
  }

  toggleEnglishQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    if (this.isWrappedInEnglishQuotes(range)) {
      this.unwrapEnglishQuotes(range);
    } else {
      this.wrapWithEnglishQuotes(range);
    }
  }

  wrapWithFrenchQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemet ouvrant + espace fine
    wrapper.appendChild(
      this.createQuoteElement(
        "editor-add french-quote-open",
        UNICODE_CHARS.LAQUO
      )
    );
    wrapper.appendChild(
      this.createQuoteElement(
        "i_space narrow-no-break-space editor-add",
        UNICODE_CHARS.NO_BREAK_THIN_SPACE
      )
    );

    // Contenu
    wrapper.appendChild(contents);

    // Espace fine + guillemet fermant
    wrapper.appendChild(
      this.createQuoteElement(
        "i_space narrow-no-break-space editor-add",
        UNICODE_CHARS.NO_BREAK_THIN_SPACE
      )
    );
    wrapper.appendChild(
      this.createQuoteElement(
        "editor-add french-quote-close",
        UNICODE_CHARS.RAQUO
      )
    );

    range.insertNode(wrapper);
    this.selectAndTrigger(range, wrapper);
  }

  wrapWithEnglishQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemets anglais sans espaces
    wrapper.appendChild(
      this.createQuoteElement(
        "editor-add english-quote-open",
        UNICODE_CHARS.LDQUO
      )
    );
    wrapper.appendChild(contents);
    wrapper.appendChild(
      this.createQuoteElement(
        "editor-add english-quote-close",
        UNICODE_CHARS.RDQUO
      )
    );

    range.insertNode(wrapper);
    this.selectAndTrigger(range, wrapper);
  }

  createQuoteElement(className, content) {
    const span = document.createElement("span");
    span.className = className;
    span.dataset.timestamp = Date.now();
    span.textContent = content;
    return span;
  }

  selectAndTrigger(range, wrapper) {
    try {
      range.selectNodeContents(wrapper);
      const selection = window.getSelection();
      selection.removeAllRanges();

      if (range.startContainer.isConnected && range.endContainer.isConnected) {
        selection.addRange(range);
        this.triggerAutoCopy();
      }
    } catch (error) {
      console.warn("Range invalide après insertion des guillemets:", error);
    }
  }

  isWrappedInFrenchQuotes(range) {
    return this.hasAdjacentQuotes(
      range,
      "french-quote-open",
      "french-quote-close",
      UNICODE_CHARS.LAQUO,
      UNICODE_CHARS.RAQUO
    );
  }

  isWrappedInEnglishQuotes(range) {
    return this.hasAdjacentQuotes(
      range,
      "english-quote-open",
      "english-quote-close",
      UNICODE_CHARS.LDQUO,
      UNICODE_CHARS.RDQUO
    );
  }

  hasAdjacentQuotes(range, openClass, closeClass, openChar, closeChar) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    const walker = document.createTreeWalker(
      parent,
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
        node.classList?.contains(openClass) &&
        node.textContent === openChar
      ) {
        if (!foundStart) hasOpenQuote = true;
      }

      if (range.intersectsNode(node)) {
        foundStart = true;
      }

      if (
        foundStart &&
        node.classList?.contains(closeClass) &&
        node.textContent === closeChar
      ) {
        hasCloseQuote = true;
        break;
      }
    }

    return hasOpenQuote && hasCloseQuote;
  }

  unwrapFrenchQuotes(range) {
    this.removeQuoteSequences(this.getQuoteContainer(range), "french");
  }

  unwrapEnglishQuotes(range) {
    this.removeQuoteSequences(this.getQuoteContainer(range), "english");
  }

  getQuoteContainer(range) {
    const container = range.commonAncestorContainer;
    const parent =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;
    parent.normalize();
    this.triggerAutoCopy();
    return parent;
  }

  removeQuoteSequences(element, quoteType) {
    if (quoteType === "french") {
      // Supprimer tous les éléments des guillemets français
      element
        .querySelectorAll(
          ".french-quote-open.editor-add, .french-quote-close.editor-add, .narrow-no-break-space.editor-add"
        )
        .forEach((el) => el.remove());
    } else if (quoteType === "english") {
      // Supprimer tous les éléments des guillemets anglais
      element
        .querySelectorAll(
          ".english-quote-open.editor-add, .english-quote-close.editor-add"
        )
        .forEach((el) => el.remove());
    }
  }

  // ====== UTILITAIRES DE COPIE ET RESET ======

  copyElementAsMarkdown(options = {}) {
    const config = {
      silent: false,
      auto: false,
      element: null,
      ...options,
    };

    window.focus();
    document.body.focus();

    let element = config.element || this.getEditableElementFromSelection();
    if (!element) {
      console.warn("Aucun élément éditable trouvé pour la copie");
      return;
    }

    try {
      // Chercher conteneur parent approprié
      element = this.findContainerElement(element);

      // Reconstituer et convertir
      const completeHTML = this.reconstructSplitElement(element);
      const markdown = this.editor.toolbar.turndown.turndown(completeHTML);

      // Copier
      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          if (!config.silent && !config.auto) {
            this.showCopyFeedback();
          }
        })
        .catch((err) => {
          console.error("Erreur lors de la copie:", err);
          this.copyToClipboardFallback(markdown, config);
        });
    } catch (error) {
      console.error("Erreur lors de la génération du markdown:", error);
    }
  }

  getEditableElementFromSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;

    let element = selection.anchorNode;
    if (element?.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    while (element && !element.hasAttribute("data-editable")) {
      element = element.parentElement;
    }

    return element;
  }

  findContainerElement(element) {
    let containerElement = element.parentElement;
    while (containerElement && containerElement !== document.body) {
      if (
        ["BLOCKQUOTE", "UL", "OL", "FIGURE"].includes(containerElement.tagName)
      ) {
        return containerElement;
      }
      containerElement = containerElement.parentElement;
    }
    return element;
  }

  copyToClipboardFallback(text, config) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (fallbackError) {
      console.error("Échec de la copie même avec fallback:", fallbackError);
    }
  }

  showCopyFeedback() {
    const copyButton = this.editor.toolbar.element?.querySelector(
      '[data-command="copy-md"]'
    );

    if (copyButton) {
      const originalClass = copyButton.className;
      const originalContent = copyButton.innerHTML;

      copyButton.classList.add("success");
      copyButton.innerHTML = "✓";

      setTimeout(() => {
        copyButton.className = originalClass;
        copyButton.innerHTML = originalContent;
      }, 1000);
    }
  }

  // ====== RESET TRANSFORMATIONS SIMPLIFIÉ ======
  // Cette version intègre la gestion des spans letter-spacing dans la logique unifiée
 resetTransformations() {
  const element = this.getEditableElementFromSelection();
  if (!element) return;

  // Récupérer TOUS les éléments avec timestamp
  const allElements = Array.from(element.querySelectorAll('.editor-add[data-timestamp]'));
  
  if (allElements.length === 0) {
    // Fallback : votre code actuel complet
    element.querySelectorAll('span[style*="--ls"].editor-add').forEach((span) => {
      this.unwrapLetterSpacing(span);
    });

    element.querySelectorAll(".editor-add").forEach((el) => {
      if (!el.style.getPropertyValue("--ls")) {
        if (
          el.tagName === "BR" ||
          el.classList.contains("french-quote-open") ||
          el.classList.contains("french-quote-close") ||
          el.classList.contains("english-quote-open") ||
          el.classList.contains("english-quote-close") ||
          el.classList.contains("i_space")
        ) {
          el.remove();
        } else if (el.parentNode) {
          const textNode = document.createTextNode(el.textContent);
          el.parentNode.replaceChild(textNode, el);
        }
      }
    });
    
    element.normalize();
    this.triggerAutoCopy();
    return;
  }

  // Si timestamps présents : suppression progressive
  allElements.sort((a, b) => parseInt(b.dataset.timestamp) - parseInt(a.dataset.timestamp));
  const mostRecent = allElements[0];
  
  // Même logique que le fallback mais sur un seul élément
  if (mostRecent.style && mostRecent.style.getPropertyValue("--ls")) {
    this.unwrapLetterSpacing(mostRecent);
  } else if (
    mostRecent.tagName === "BR" ||
    mostRecent.classList.contains("french-quote-open") ||
    mostRecent.classList.contains("french-quote-close") ||
    mostRecent.classList.contains("english-quote-open") ||
    mostRecent.classList.contains("english-quote-close") ||
    mostRecent.classList.contains("i_space")
  ) {
    mostRecent.remove();
  } else if (mostRecent.parentNode) {
    const textNode = document.createTextNode(mostRecent.textContent);
    mostRecent.parentNode.replaceChild(textNode, mostRecent);
  }

  element.normalize();
  this.triggerAutoCopy();
}

  // ====== COPIE AUTOMATIQUE ======

  triggerAutoCopy() {
    clearTimeout(this.autoCopyTimeout);
    this.autoCopyTimeout = setTimeout(() => {
      this.performAutoCopy();
    }, 300);
  }

  performAutoCopy() {
    const element = this.getEditableElementFromSelection();
    if (!element) return;

    try {
      const completeHTML = this.reconstructSplitElement(element);
      const markdown = this.editor.toolbar.turndown.turndown(completeHTML);

      navigator.clipboard
        .writeText(markdown)
        .then(() => console.log("✓ Copie automatique effectuée"))
        .catch(() =>
          this.copyToClipboardFallback(markdown, { silent: true, auto: true })
        );
    } catch (error) {
      console.warn("Erreur lors de la copie automatique:", error);
    }
  }

  // ====== MÉTHODES UTILITAIRES DOM ======

  reconstructSplitElement(element) {
    const dataRef = element.getAttribute("data-ref");

    if (!dataRef) {
      return element.outerHTML;
    }

    const fragments = document.querySelectorAll(`[data-ref="${dataRef}"]`);

    if (fragments.length <= 1) {
      return element.outerHTML;
    }

    const firstFragment = fragments[0];
    let completeContent = "";

    fragments.forEach((fragment) => {
      completeContent += fragment.innerHTML;
    });

    const tagName = firstFragment.tagName.toLowerCase();
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
    wrapper.dataset.timestamp = Date.now();
    wrapper.appendChild(contents);
    range.insertNode(wrapper);

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
      const parent = formatElement.parentNode;
      while (formatElement.firstChild) {
        parent.insertBefore(formatElement.firstChild, formatElement);
      }
      parent.removeChild(formatElement);
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
        return className ? current.classList.contains(className) : true;
      }
      current = current.parentElement;
    }

    return false;
  }
}
