/**
 * @name Commands
 * @file Commandes d'édition et formatage - Version refactorisée
 * 
 * Cette version supprime les duplications et clarifie l'architecture :
 * - Séparation claire entre commandes de base et utilitaires complexes
 * - Suppression des méthodes obsolètes
 * - Interface cohérente avec le système actions/toolbar
 */

import { UNICODE_CHARS } from "./unicode.js";

export class Commands {
  constructor(editor) {
    this.editor = editor;
    
    // Interface letter-spacing réutilisable
    this.letterSpacingInput = null;
    
    // Debounce pour la copie automatique
    this.autoCopyTimeout = null;
  }

  // ====== COMMANDES DE FORMATAGE DE BASE ======
  // Ces méthodes implémentent les actions toggle simples

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

  // ====== COMMANDE LETTER-SPACING COMPLEXE ======
  // Cette commande nécessite une interface utilisateur

  toggleLetterSpacing() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const existingSpan = this.findLetterSpacingSpan(range);

    if (existingSpan) {
      this.showLetterSpacingInterface(existingSpan);
    } else {
      const newSpan = this.wrapWithLetterSpacing(range);
      this.showLetterSpacingInterface(newSpan);
    }
  }

  findLetterSpacingSpan(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    // Chercher dans les parents
    let current = container;
    while (current && current !== document.body) {
      if (current.tagName === "SPAN" && 
          current.style.getPropertyValue("--ls") && 
          current.classList.contains("editor-add")) {
        return current;
      }
      current = current.parentElement;
    }

    // Chercher dans les enfants
    const spans = container.querySelectorAll('span[style*="--ls"].editor-add');
    for (const span of spans) {
      if (range.intersectsNode(span)) {
        return span;
      }
    }

    return null;
  }

  wrapWithLetterSpacing(range) {
    const contents = range.extractContents();
    const span = document.createElement("span");
    
    span.className = "editor-add";
    span.style.setProperty("--ls", "0");
    span.appendChild(contents);

    range.insertNode(span);

    try {
      range.selectNodeContents(span);
      const selection = window.getSelection();
      selection.removeAllRanges();
      
      if (range.startContainer.isConnected && range.endContainer.isConnected) {
        selection.addRange(range);
      }
    } catch (error) {
      console.warn("Range invalide après création du span letter-spacing:", error);
    }

    return span;
  }

  showLetterSpacingInterface(span) {
    const lsButton = this.editor.toolbar.element?.querySelector('[data-command="letter-spacing"]');
    
    if (!lsButton) {
      console.warn("Bouton letter-spacing non trouvé dans la toolbar");
      return;
    }

    if (!this.letterSpacingInput) {
      this.createLetterSpacingInput();
    }

    const currentValue = span.style.getPropertyValue("--ls") || "0";
    this.letterSpacingInput.value = currentValue;
    this.letterSpacingInput.setAttribute('data-target-span-id', 
      span.getAttribute('data-ls-id') || this.generateSpanId(span));
    
    // Mode édition du bouton
    lsButton.innerHTML = '✓';
    lsButton.title = "Valider letter-spacing (Entrée)";
    lsButton.classList.add("editing");
    
    // Afficher l'input
    this.positionLetterSpacingInput();
    this.letterSpacingInput.style.display = "block";
    this.letterSpacingInput.focus();
    this.letterSpacingInput.select();
  }

  createLetterSpacingInput() {
    this.letterSpacingInput = document.createElement("input");
    this.letterSpacingInput.type = "number";
    this.letterSpacingInput.step = "1";
    this.letterSpacingInput.className = "letter-spacing-input";

    // Événements
    this.letterSpacingInput.addEventListener("input", (e) => {
      const spanId = e.target.getAttribute('data-target-span-id');
      const span = document.querySelector(`[data-ls-id="${spanId}"]`);
      
      if (span) {
        span.style.setProperty("--ls", e.target.value);
        this.triggerAutoCopy();
      }
    });

    this.letterSpacingInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        this.hideLetterSpacingInterface();
      }
    });

    this.letterSpacingInput.addEventListener("blur", () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement !== this.letterSpacingInput && 
            !this.editor.toolbar.element?.contains(activeElement)) {
          this.hideLetterSpacingInterface();
        }
      }, 200);
    });

    document.body.appendChild(this.letterSpacingInput);
  }

  positionLetterSpacingInput() {
    if (!this.editor.toolbar.element || !this.letterSpacingInput) return;

    const toolbarRect = this.editor.toolbar.element.getBoundingClientRect();
    this.letterSpacingInput.style.left = `${toolbarRect.right + 10 + window.scrollX}px`;
    this.letterSpacingInput.style.top = `${toolbarRect.top + window.scrollY}px`;
  }

  hideLetterSpacingInterface() {
    if (this.letterSpacingInput) {
      this.letterSpacingInput.style.display = "none";
    }

    const lsButton = this.editor.toolbar.element?.querySelector('[data-command="letter-spacing"]');
    if (lsButton) {
      lsButton.innerHTML = "A ↔ A";
      lsButton.title = "Lettrage (Letter-spacing)";
      lsButton.classList.remove("editing");
    }

    this.triggerAutoCopy();
  }

  generateSpanId(span) {
    const id = 'ls-' + Math.random().toString(36).substr(2, 9);
    span.setAttribute('data-ls-id', id);
    return id;
  }

  // ====== COMMANDES D'INSERTION SIMPLE ======
  // Ces méthodes insèrent des éléments ponctuels

  insertText(text) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);

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
  // Guillemets français et anglais avec logique spécifique

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
    wrapper.appendChild(this.createQuoteElement("editor-add french-quote-open", UNICODE_CHARS.LAQUO));
    wrapper.appendChild(this.createQuoteElement("i_space narrow-no-break-space editor-add", UNICODE_CHARS.NO_BREAK_THIN_SPACE));
    
    // Contenu
    wrapper.appendChild(contents);
    
    // Espace fine + guillemet fermant
    wrapper.appendChild(this.createQuoteElement("i_space narrow-no-break-space editor-add", UNICODE_CHARS.NO_BREAK_THIN_SPACE));
    wrapper.appendChild(this.createQuoteElement("editor-add french-quote-close", UNICODE_CHARS.RAQUO));

    range.insertNode(wrapper);
    this.selectAndTrigger(range, wrapper);
  }

  wrapWithEnglishQuotes(range) {
    const contents = range.extractContents();
    const wrapper = document.createDocumentFragment();

    // Guillemets anglais sans espaces
    wrapper.appendChild(this.createQuoteElement("editor-add english-quote-open", UNICODE_CHARS.LDQUO));
    wrapper.appendChild(contents);
    wrapper.appendChild(this.createQuoteElement("editor-add english-quote-close", UNICODE_CHARS.RDQUO));

    range.insertNode(wrapper);
    this.selectAndTrigger(range, wrapper);
  }

  createQuoteElement(className, content) {
    const span = document.createElement("span");
    span.className = className;
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
    return this.hasAdjacentQuotes(range, "french-quote-open", "french-quote-close", UNICODE_CHARS.LAQUO, UNICODE_CHARS.RAQUO);
  }

  isWrappedInEnglishQuotes(range) {
    return this.hasAdjacentQuotes(range, "english-quote-open", "english-quote-close", UNICODE_CHARS.LDQUO, UNICODE_CHARS.RDQUO);
  }

  hasAdjacentQuotes(range, openClass, closeClass, openChar, closeChar) {
    const container = range.commonAncestorContainer;
    const parent = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;

    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT, null, false);

    let hasOpenQuote = false;
    let hasCloseQuote = false;
    let foundStart = false;

    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (node.classList?.contains(openClass) && node.textContent === openChar) {
        if (!foundStart) hasOpenQuote = true;
      }

      if (range.intersectsNode(node)) {
        foundStart = true;
      }

      if (foundStart && node.classList?.contains(closeClass) && node.textContent === closeChar) {
        hasCloseQuote = true;
        break;
      }
    }

    return hasOpenQuote && hasCloseQuote;
  }

  unwrapFrenchQuotes(range) {
    this.removeQuoteSequences(this.getQuoteContainer(range), 'french');
  }

  unwrapEnglishQuotes(range) {
    this.removeQuoteSequences(this.getQuoteContainer(range), 'english');
  }

  getQuoteContainer(range) {
    const container = range.commonAncestorContainer;
    const parent = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    parent.normalize();
    this.triggerAutoCopy();
    return parent;
  }

  removeQuoteSequences(element, quoteType) {
    if (quoteType === 'french') {
      // Supprimer tous les éléments des guillemets français
      element.querySelectorAll('.french-quote-open.editor-add, .french-quote-close.editor-add, .narrow-no-break-space.editor-add').forEach(el => el.remove());
    } else if (quoteType === 'english') {
      // Supprimer tous les éléments des guillemets anglais
      element.querySelectorAll('.english-quote-open.editor-add, .english-quote-close.editor-add').forEach(el => el.remove());
    }
  }

  // ====== UTILITAIRES DE COPIE ET RESET ======
  // Ces méthodes gèrent les opérations complexes sur le document

  copyElementAsMarkdown(options = {}) {
    const config = {
      silent: false,
      auto: false,
      element: null,
      ...options
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
      navigator.clipboard.writeText(markdown)
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
      if (["BLOCKQUOTE", "UL", "OL", "FIGURE"].includes(containerElement.tagName)) {
        return containerElement;
      }
      containerElement = containerElement.parentElement;
    }
    return element;
  }

  copyToClipboardFallback(text, config) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (fallbackError) {
      console.error("Échec de la copie même avec fallback:", fallbackError);
    }
  }

  showCopyFeedback() {
    const copyButton = this.editor.toolbar.element?.querySelector('[data-command="copy-md"]');

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

  resetTransformations() {
    const element = this.getEditableElementFromSelection();
    if (!element) return;

    this.resetAllFormatting(element);
//     this.triggerAutoCopy();
  }

  resetAllFormatting(element) {
    const selectorsToRemove = [".editor-add"];

    selectorsToRemove.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.tagName === "BR" || 
            el.classList.contains("french-quote-open") ||
            el.classList.contains("french-quote-close") ||
            el.classList.contains("english-quote-open") ||
            el.classList.contains("english-quote-close") ||
            el.classList.contains("i_space")) {
          // Suppression pure pour BR, guillemets et espaces
          el.remove();
        } else if (el.parentNode) {
          // Remplacement par contenu textuel pour formatage (small-caps, sup, letter-spacing...)
          const textNode = document.createTextNode(el.textContent);
          el.parentNode.replaceChild(textNode, el);
        }
      });
    });

    element.normalize();
  }

  // ====== COPIE AUTOMATIQUE ======
  // Système de copie automatique avec debounce

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
      
      navigator.clipboard.writeText(markdown)
        .then(() => console.log('✓ Copie automatique effectuée'))
        .catch(() => this.copyToClipboardFallback(markdown, { silent: true, auto: true }));
    } catch (error) {
      console.warn("Erreur lors de la copie automatique:", error);
    }
  }

  // ====== MÉTHODES UTILITAIRES DOM ======
  // Méthodes de base pour la manipulation du DOM

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