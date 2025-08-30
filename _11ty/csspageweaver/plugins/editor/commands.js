import { UNICODE_CHARS } from "./unicode.js";

export class Commands {
  constructor(editor) {
    this.editor = editor;
  }

  // ====== COMMANDES DE FORMATAGE DE BASE ======

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

  toggleLetterSpacing() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const input = document.querySelector(".ls-input");
    if (!input) return;

    console.log("input.value = " + input.value);

    const value = parseInt(input.value) || 0;

    // Vérifier si la sélection est déjà dans un span avec --ls
    const existingSpan = this.findParentWithLetterSpacing(range);

    if (existingSpan) {
      // Mettre à jour le span existant avec CSS variable
      existingSpan.style.setProperty("--ls", value);
      console.log("value = " + value);
    } else {
      // Créer un nouveau span avec CSS variable
      this.wrapSelectionWithCSSVariable(range, "--ls", value);
      console.log("value else = " + value);
    }

    this.triggerAutoCopy();
  }

  findParentWithLetterSpacing(range) {
    let node = range.commonAncestorContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    while (node && node !== document.body) {
      if (
        node.tagName === "SPAN" &&
        (node.style.getPropertyValue("--ls") !== "" ||
          node.getAttribute("style")?.includes("--ls"))
      ) {
        return node;
      }
      node = node.parentElement;
    }

    return null;
  }

  wrapSelectionWithCSSVariable(range, cssVar, value) {
    const span = document.createElement("span");
    span.style.setProperty(cssVar, value);
//     console.log("value wrap = " + value);

    try {
      range.surroundContents(span);
    } catch (e) {
      // Si surroundContents échoue, utiliser une approche alternative
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
  }

  // ====== MÉTHODES POUR GUILLEMETS ======

toggleFrenchQuotes() {
  const selection = this.editor.selection.getCurrentSelection();
  if (!selection?.isValid) return;

  const range = selection.range;
  const text = range.toString();

  if (text) {
    range.deleteContents();

    const fragment = document.createDocumentFragment();

    // Utilisation de createElement pour simplifier
    const openQuoteSpan = this.createElement('span', 'french-quote-open');
    openQuoteSpan.textContent = UNICODE_CHARS.LAQUO;

    const openSpaceSpan = this.createElement('span', 'i_space narrow-no-break-space');
    openSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

    const textNode = document.createTextNode(text);

    const closeSpaceSpan = this.createElement('span', 'i_space narrow-no-break-space');
    closeSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

    const closeQuoteSpan = this.createElement('span', 'french-quote-close');
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


  toggleEnglishQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const text = range.toString();

    if (text) {
      range.deleteContents();

      const openSpan = document.createElement("span");
      openSpan.className = "english-quote-open";
      openSpan.textContent = UNICODE_CHARS.LDQUO;

      const textNode = document.createTextNode(text);

      const closeSpan = document.createElement("span");
      closeSpan.className = "english-quote-close";
      closeSpan.textContent = UNICODE_CHARS.RDQUO;

      range.insertNode(openSpan);
      range.insertNode(textNode);
      range.insertNode(closeSpan);

      range.setStartBefore(openSpan);
      range.setEndAfter(closeSpan);
    }

    this.triggerAutoCopy();
  }



  // ====== INSERTION DE TEXTE ======

insertText(text) {
  const selection = this.editor.selection.getCurrentSelection();
  if (!selection || !selection.isValid) return;

  const range = selection.range;
  
  // Créer un span avec les attributs requis
  const span = document.createElement('span');
  span.classList.add('editor-add');
  span.setAttribute('data-timestamp', Date.now().toString());
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

  // ====== UTILITAIRES DE FORMATAGE ======

wrapSelection(range, tagName, className = null, attributes = {}) {
  const element = document.createElement(tagName);
  
  // Ajout automatique de la classe editor-add et data-timestamp
  element.classList.add('editor-add');
  element.setAttribute('data-timestamp', Date.now().toString());
  
  // Ajout de la classe personnalisée si fournie
  if (className) {
    element.classList.add(className);
  }
  
  // Ajout des attributs personnalisés
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  try {
    range.surroundContents(element);
  } catch (e) {
    // Fallback si surroundContents échoue
    element.appendChild(range.extractContents());
    range.insertNode(element);
  }
  
  this.triggerAutoCopy();
}

createElement(tagName, className = null, attributes = {}) {
  const element = document.createElement(tagName);
  
  // Ajout automatique de la classe editor-add et data-timestamp
  element.classList.add('editor-add');
  element.setAttribute('data-timestamp', Date.now().toString());
  
  // Ajout de la classe personnalisée si fournie
  if (className) {
    element.classList.add(className);
  }
  
  // Ajout des attributs personnalisés
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  return element;
}


  unwrapTag(range, tagNames, className = null) {
    let element = range.commonAncestorContainer;

    while (element && element !== document.body) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const tagMatches = tagNames.includes(element.tagName);
        const classMatches =
          !className || element.classList.contains(className);

        if (tagMatches && classMatches) {
          const parent = element.parentNode;
          while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
          }
          parent.removeChild(element);
          break;
        }
      }
      element = element.parentElement;
    }
  }

  isWrappedInTag(range, tagNames, className = null) {
    let element = range.commonAncestorContainer;

    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    while (element && element !== document.body) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const tagMatches = tagNames.includes(element.tagName);
        const classMatches =
          !className || element.classList.contains(className);

        if (tagMatches && classMatches) {
          return true;
        }
      }
      element = element.parentElement;
    }

    return false;
  }

  // ====== ACTIONS UTILITAIRES ======

  resetTransformations() {
    const editableElement = this.editor.getCurrentElement();
    if (!editableElement) return;

    const addedElements = editableElement.querySelectorAll("[data-timestamp]");
    addedElements.forEach((element) => {
      element.parentNode?.removeChild(element);
    });

    const spans = editableElement.querySelectorAll("span.editor-add");
    spans.forEach((span) => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });

    this.triggerAutoCopy();
  }

  copyElementAsMarkdown() {
    const element = this.editor.getCurrentElement();
    if (!element) return;

    if (this.editor.toolbar.turndown) {
      const markdown = this.editor.toolbar.turndown.turndown(element.innerHTML);

      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          console.log("Élément copié en Markdown");
          this.showFeedback("Copié !");
        })
        .catch((err) => {
          console.error("Erreur lors de la copie:", err);
        });
    }
  }

  exportMarkdownByRange() {
    if (this.editor.toolbar.recovery) {
      this.editor.toolbar.recovery.showExportDialog();
    }
  }

  // ====== MÉTHODES UTILITAIRES ======

  showFeedback(message) {
    // Affiche un feedback temporaire à l'utilisateur
    const feedback = document.createElement("div");
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
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

  triggerAutoCopy() {
    // Déclenche automatiquement la copie si activée
    if (this.editor.options?.autoCopy) {
      setTimeout(() => this.copyElementAsMarkdown(), 100);
    }
  }

  getCurrentElement() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return null;

    let element = selection.range.commonAncestorContainer;
    while (element && !element.hasAttribute?.("data-editable")) {
      element = element.parentElement;
    }

    return element;
  }

  /**
   * Méthode manquante - performAutoCopy
   * Effectue une copie automatique si l'option est activée
   */
  performAutoCopy() {
    if (!this.editor.options?.autoCopy) return;

    const element = this.getCurrentElement();
    if (!element) return;

    // Utilise la logique existante de copyElementAsMarkdown
    if (this.editor.toolbar.turndown) {
      const markdown = this.editor.toolbar.turndown.turndown(element.innerHTML);

      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          // Feedback discret pour l'auto-copie
          console.log("Auto-copie effectuée");
        })
        .catch((err) => {
          console.error("Erreur lors de l'auto-copie:", err);
        });
    }
  }

  /**
   * Correction de la méthode getCurrentElement dans Commands
   * (utilise maintenant la méthode de l'éditeur)
   */
  getCurrentElement() {
    return this.editor.getCurrentElement();
  }
}
