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
    const span = document.createElement("span");
    span.className = "editor-add";
    span.style.setProperty("--ls", "0");
    span.dataset.timestamp = Date.now();

    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);

    range.selectNodeContents(span);
    const windowSelection = window.getSelection();
    windowSelection.removeAllRanges();
    windowSelection.addRange(range);

    this.triggerAutoCopy();
  }

  applyLetterSpacing(value) {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    let container = selection.range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    while (container && !container.style.getPropertyValue("--ls")) {
      container = container.parentElement;
      if (container === document.body) break;
    }

    if (container && container.style.getPropertyValue("--ls") !== null) {
      container.style.setProperty("--ls", value + "px");
      container.dataset.timestamp = Date.now();
      this.triggerAutoCopy();
    }
  }

  // ====== INSERTION DE TEXTE ======

  insertText(text) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const span = document.createElement("span");
      span.className = "editor-add";
      span.textContent = text;
      span.dataset.timestamp = Date.now();
      
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.triggerAutoCopy();
    }
  }

  insertTypographicSpan(content, className) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const span = document.createElement("span");
      span.className = className;
      span.textContent = content;
      span.dataset.timestamp = Date.now();

      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      this.triggerAutoCopy();
    }
  }

  // ====== RESET PROGRESSIF AVEC TIMESTAMP ======

  resetTransformations() {
    const element = this.getEditableElementFromSelection();
    if (!element) return;

    // Récupérer TOUS les éléments avec timestamp
    const allElements = Array.from(element.querySelectorAll('.editor-add[data-timestamp]'));
    
    if (allElements.length === 0) {
      // Fallback : reset complet traditionnel
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

    // Tri par timestamp décroissant - le plus récent en premier
    allElements.sort((a, b) => parseInt(b.dataset.timestamp) - parseInt(a.dataset.timestamp));
    const mostRecent = allElements[0];
    
    // Supprimer uniquement l'élément le plus récent
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

  // ====== MÉTHODES UTILITAIRES ======

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

  unwrapLetterSpacing(span) {
    if (span && span.parentNode) {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      parent.normalize();
    }
  }

  getEditableElementFromSelection() {
    const element = this.editor.getActiveEditableElement();
    return element;
  }

  // ====== COPIE ET EXPORT ======

  performAutoCopy() {
    this.copyElementAsMarkdown({ auto: true, silent: true });
  }

  copyElementAsMarkdown(options = {}) {
    const config = { silent: false, auto: false, element: null, ...options };

    let element = config.element || this.getEditableElementFromSelection();
    if (!element) return;

    try {
      element = this.findContainerElement(element);
      const completeHTML = this.reconstructSplitElement(element);
      const markdown = this.editor.toolbar.turndown.turndown(completeHTML);

      navigator.clipboard.writeText(markdown).then(() => {
        if (!config.silent && !config.auto) {
          this.showCopyFeedback();
        }
      }).catch((err) => {
        this.copyToClipboardFallback(markdown);
      });
    } catch (error) {
      console.error("Erreur lors de la génération du markdown:", error);
    }
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

  reconstructSplitElement(element) {
    return element.outerHTML;
  }

  copyToClipboardFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
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

  triggerAutoCopy() {
    this.editor.debounce(() => {
      this.performAutoCopy();
    }, 300);
  }
}