/**
 * @name Commands
 * @file Gestion des commandes d'édition pour l'éditeur
 * @author Editor Plugin
 */

import { UNICODE_CHARS } from "./unicode.js";

export class Commands {
  constructor(editor) {
    this.editor = editor;
  }

  // ====== CRÉATION D'ÉLÉMENTS ======

  createElement(tagName, className = null) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.classList.add("editor-add");
    element.setAttribute("data-timestamp", Date.now());
    return element;
  }

  // ====== GESTION DU TEXTE ======

  insertText(text) {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;

    // Créer un span avec timestamp et classe pour pouvoir annuler
    const span = this.createElement("span", "editor-add");
    span.textContent = text;

    range.deleteContents();
    range.insertNode(span);

    // Positionner le curseur après l'insertion
    range.setStartAfter(span);
    range.setEndAfter(span);
    selection.selection.removeAllRanges();
    selection.selection.addRange(range);

    this.triggerAutoCopy();
  }

  // ====== FORMATAGE ======

  toggleFormatting(tagName) {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const selectedText = range.toString();

    if (selectedText.length === 0) return;

    // Vérifier si le texte sélectionné est déjà formaté
    const parentElement = range.commonAncestorContainer.parentElement;
    if (
      parentElement &&
      parentElement.tagName.toLowerCase() === tagName.toLowerCase()
    ) {
      // Supprimer le formatage
      this.unwrapElement(parentElement);
    } else {
      // Ajouter le formatage
      const element = this.createElement(tagName);
      try {
        range.surroundContents(element);
      } catch (e) {
        // Si surroundContents échoue, utiliser une méthode alternative
        element.appendChild(range.extractContents());
        range.insertNode(element);
      }
      
      // Restaurer la sélection
      range.selectNodeContents(element);
      selection.selection.removeAllRanges();
      selection.selection.addRange(range);
    }

    this.triggerAutoCopy();
  }

  unwrapElement(element) {
    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  // ====== CARACTÈRES SPÉCIAUX ======

  insertUnicodeChar(type, variant = null) {
    const chars = UNICODE_CHARS[type];
    if (!chars) return;

    let char;
    if (variant && chars[variant]) {
      char = chars[variant];
    } else if (typeof chars === 'string') {
      char = chars;
    } else if (chars.default) {
      char = chars.default;
    } else {
      return;
    }

    this.insertText(char);
  }

  // ====== GUILLEMETS ======

  toggleFrenchQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const text = range.toString();

    if (text) {
      range.deleteContents();

      const timestamp = Date.now();

      const fragment = document.createDocumentFragment();

      const openQuoteSpan = this.createElement("span", "french-quote-open");
      openQuoteSpan.setAttribute("data-timestamp", timestamp);
      openQuoteSpan.textContent = UNICODE_CHARS.LAQUO;

      const openSpaceSpan = this.createElement("span", "i_space no-break-narrow-space");
      openSpaceSpan.setAttribute("data-timestamp", timestamp);
      openSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

      const textNode = document.createTextNode(text);

      const closeSpaceSpan = this.createElement("span", "i_space no-break-narrow-space");
      closeSpaceSpan.setAttribute("data-timestamp", timestamp);
      closeSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

      const closeQuoteSpan = this.createElement("span", "french-quote-close");
      closeQuoteSpan.setAttribute("data-timestamp", timestamp);
      closeQuoteSpan.textContent = UNICODE_CHARS.RAQUO;

      fragment.appendChild(openQuoteSpan);
      fragment.appendChild(openSpaceSpan);
      fragment.appendChild(textNode);
      fragment.appendChild(closeSpaceSpan);
      fragment.appendChild(closeQuoteSpan);

      range.insertNode(fragment);
      range.setStartBefore(openQuoteSpan);
      range.setEndAfter(closeQuoteSpan);
    }

    this.triggerAutoCopy();
  }

  insertEnglishQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const selectedText = range.toString();

    if (selectedText.length === 0) return;

    const openQuote = this.createElement("span", "english-quote");
    const closeQuote = this.createElement("span", "english-quote");

    openQuote.textContent = UNICODE_CHARS.LDQUO;
    closeQuote.textContent = UNICODE_CHARS.RDQUO;

    const container = this.createElement("span");
    container.appendChild(openQuote);
    container.appendChild(document.createTextNode(selectedText));
    container.appendChild(closeQuote);

    range.deleteContents();
    range.insertNode(container);

    range.setStartAfter(container);
    range.setEndAfter(container);
    selection.selection.removeAllRanges();
    selection.selection.addRange(range);

    this.triggerAutoCopy();
  }

  // ====== ESPACES ======

  insertSpace(className, unicodeChar) {
    const span = this.createElement("span", className);
    span.textContent = unicodeChar;

    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    range.deleteContents();
    range.insertNode(span);

    range.setStartAfter(span);
    range.setEndAfter(span);
    selection.selection.removeAllRanges();
    selection.selection.addRange(range);

    this.triggerAutoCopy();
  }

  insertLineBreak() {
    const br = this.createElement("br");
    
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    range.deleteContents();
    range.insertNode(br);

    range.setStartAfter(br);
    range.setEndAfter(br);
    selection.selection.removeAllRanges();
    selection.selection.addRange(range);

    this.triggerAutoCopy();
  }

  // ====== ANNULATION ======

  undoLastTransformation() {
    const editableElement = this.getCurrentElement();
    if (!editableElement) {
      console.warn("Aucun élément éditable trouvé");
      return;
    }

    const timestampedElements = Array.from(
      editableElement.querySelectorAll("[data-timestamp]")
    );

    if (timestampedElements.length === 0) {
      console.warn("Aucune transformation à annuler");
      return;
    }

    // Trier par timestamp décroissant
    timestampedElements.sort((a, b) => {
      const timestampA = parseInt(a.getAttribute("data-timestamp"));
      const timestampB = parseInt(b.getAttribute("data-timestamp"));
      return timestampB - timestampA;
    });

    // Prendre le timestamp le plus récent
    const latestTimestamp = timestampedElements[0].getAttribute("data-timestamp");

    // Supprimer TOUS les éléments qui ont ce timestamp
    const elementsToRemove = editableElement.querySelectorAll(
      `[data-timestamp="${latestTimestamp}"]`
    );

    console.log(
      `Annulation de ${elementsToRemove.length} élément(s) avec timestamp ${latestTimestamp}`
    );

    elementsToRemove.forEach(element => {
      const classes = element.className;

      // Supprimer complètement guillemets et espaces
      if (
        classes.includes("french-quote") ||
        classes.includes("english-quote") ||
        classes.includes("i_space") ||
        element.tagName === "BR"
      ) {
        element.parentNode?.removeChild(element);
      } else {
        // Préserver le contenu pour autres spans
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
    });

    this.triggerAutoCopy();
  }

  // ====== EXPORT & COPY ======

  copyElementAsMarkdown() {
    const element = this.getCurrentElement();
    if (!element) return;

    // Déléguer à recovery pour la conversion
    this.editor.toolbar.recovery.copyElementToClipboard(element);
  }

  exportMarkdownByRange() {
    if (this.editor.toolbar.recovery) {
      this.editor.toolbar.recovery.showPageRangeModal();
    }
  }

  // ====== UTILITAIRES ======

  getCurrentElement() {
    return this.editor.getCurrentElement();
  }

  // AutoCopy simplifié - délègue à recovery
  triggerAutoCopy(elementParam = null) {
    if (!this.editor.options.autoCopy) return;
    
    const element = elementParam || this.getCurrentElement();
    if (!element) return;

    // Déléguer à recovery (vérifier que toolbar et recovery existent)
    if (this.editor.toolbar?.recovery) {
      this.editor.toolbar.recovery.copyElementToClipboard(element);
    } else {
      console.warn("Recovery service non disponible pour autoCopy");
    }
  }
}