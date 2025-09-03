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
      // Appliquer le formatage
      const element = this.createElement(tagName);
      try {
        range.surroundContents(element);
      } catch (e) {
        // Fallback si surroundContents échoue
        element.textContent = selectedText;
        range.deleteContents();
        range.insertNode(element);
      }
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

  // ====== GESTION DES BALISES SPÉCIFIQUES ======

  toggleSmallCaps() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const selectedText = range.toString();

    if (selectedText.length === 0) return;

    // Vérifier si déjà en petites capitales
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    if (container.classList && container.classList.contains("small-caps")) {
      // Supprimer les petites capitales
      this.unwrapElement(container);
    } else {
      // Appliquer les petites capitales
      const span = this.createElement("span", "small-caps");
      try {
        range.surroundContents(span);
      } catch (e) {
        span.textContent = selectedText;
        range.deleteContents();
        range.insertNode(span);
      }
    }

    this.triggerAutoCopy();
  }

  toggleSuperscript() {
    this.toggleFormatting("sup");
  }

  // ====== GUILLEMETS FRANÇAIS ======

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
      openQuoteSpan.textContent = UNICODE_CHARS.LAQUO; // Guillemet ouvrant français

      const openSpaceSpan = this.createElement(
        "span",
        "i_space no-break-narrow-space"
      );
      openQuoteSpan.setAttribute("data-timestamp", timestamp);
      openSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

      const textNode = document.createTextNode(text);

      const closeSpaceSpan = this.createElement(
        "span",
        "i_space no-break-narrow-space"
      );
      closeSpaceSpan.setAttribute("data-timestamp", timestamp);
      closeSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

      const closeQuoteSpan = this.createElement("span", "french-quote-close");
      closeQuoteSpan.setAttribute("data-timestamp", timestamp);
      closeQuoteSpan.textContent = UNICODE_CHARS.RAQUO; // Guillemet fermant français

      // Ordre correct : « [espace fine] texte [espace fine] »
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

  // ====== GUILLEMETS ANGLAIS ======

  toggleEnglishQuotes() {
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const text = range.toString();

    if (text) {
      range.deleteContents();

      const fragment = document.createDocumentFragment();

      const openQuoteSpan = this.createElement("span", "english-quote-open ");

      openQuoteSpan.textContent = UNICODE_CHARS.LDQUO;

      const textNode = document.createTextNode(text);

      const closeQuoteSpan = this.createElement(
        "span",
        "english-quote-close editor-add"
      );
      closeQuoteSpan.textContent = UNICODE_CHARS.RDQUO;

      fragment.appendChild(openQuoteSpan);
      fragment.appendChild(textNode);
      fragment.appendChild(closeQuoteSpan);

      range.insertNode(fragment);
      range.setStartBefore(openQuoteSpan);
      range.setEndAfter(closeQuoteSpan);
    }

    this.triggerAutoCopy();
  }

  toggleLetterSpacing() {
    const input = document.querySelector(".ls-input");
    const value = input?.value || "0";

    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const span = this.createElement("span", null);
    span.style.setProperty("--ls", value);
    span.setAttribute("tabindex", "0"); // Rendre focusable

    this.setupLetterSpacingControls(span);

    try {
      selection.range.surroundContents(span);
    } catch (e) {
      span.textContent = selection.range.toString();
      selection.range.deleteContents();
      selection.range.insertNode(span);
    }

    this.triggerAutoCopy();
  }

  setupLetterSpacingControls(span) {
    span.addEventListener("wheel", (e) => {
      e.preventDefault();

      let currentValue = parseInt(span.style.getPropertyValue("--ls")) || 0;
      const step = e.shiftKey ? 10 : 1;

      if (e.deltaY < 0) {
        // Molette vers le haut
        currentValue += step;
      } else {
        // Molette vers le bas
        currentValue -= step;
      }

      span.style.setProperty("--ls", currentValue.toString());
      this.triggerAutoCopy();
    });

    // Feedback visuel au survol
    span.addEventListener("mouseenter", () => {
      span.style.cursor = "ns-resize";
      span.title = "Molette pour ajuster le letter-spacing";
    });
  }

  // ====== VÉRIFICATIONS ======

  hasParentWithTag(element, tagNames, className = null) {
    if (!Array.isArray(tagNames)) {
      tagNames = [tagNames];
    }
    tagNames = tagNames.map((tag) => tag.toUpperCase());

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

  // ====== INSERTION D'ESPACES ======

  insertSpace(className, content) {
    const selection = window.getSelection();

    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const span = this.createElement("span", `i_space ${className} editor-add`);
    span.setAttribute("data-timestamp", Date.now());
    span.textContent = content;

    // Supprimer sélection si elle existe
    if (!range.collapsed) {
      range.deleteContents();
    }

    range.insertNode(span);
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    this.triggerAutoCopy();
  }

  // ====== ACTIONS UTILITAIRES ======

  undoLastTransformation() {
    let editableElement = document.activeElement;

    if (!editableElement || !editableElement.hasAttribute("data-editable")) {
      //       console.log("Aucun élément éditable en focus");
      return;
    }

    console.log("Element en focus:", editableElement);

    // 1. Récupérer TOUS les éléments avec timestamp
    const timestampedElements = Array.from(
      editableElement.querySelectorAll("[data-timestamp]")
    );

    console.log("Éléments avec timestamp trouvés:", timestampedElements);
    timestampedElements.forEach((el) =>
      console.log("Timestamp:", el.getAttribute("data-timestamp"))
    );

    if (timestampedElements.length === 0) {
      console.log("Aucune transformation à annuler");
      return;
    }

    // 2. Trier par timestamp (le plus récent en premier)
    timestampedElements.sort((a, b) => {
      const timestampA = parseInt(a.getAttribute("data-timestamp"));
      const timestampB = parseInt(b.getAttribute("data-timestamp"));
      return timestampB - timestampA;
    });

    // 3. Prendre le timestamp le plus récent
    const latestTimestamp =
      timestampedElements[0].getAttribute("data-timestamp");

    // 4. Supprimer TOUS les éléments qui ont ce timestamp
    const elementsToRemove = editableElement.querySelectorAll(
      `[data-timestamp="${latestTimestamp}"]`
    );

    console.log(
      `Annulation de ${elementsToRemove.length} élément(s) avec timestamp ${latestTimestamp}`
    );

    elementsToRemove.forEach((element) => {
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

  // ====== MÉTHODES UTILITAIRES ======

//   showFeedback(message) {
//     const feedback = document.createElement("div");
//     feedback.textContent = message;
//     feedback.style.cssText = `
//       position: fixed;
//       top: 20px;
//       right: 20px;
//       background: #ac4cafff;
//       color: white;
//       padding: 10px;
//       border-radius: 4px;
//       z-index: 10000;
//       opacity: 1;
//       transition: opacity 0.3s ease;
//     `;

//     document.body.appendChild(feedback);

//     setTimeout(() => {
//       feedback.style.opacity = "0";
//       setTimeout(() => {
//         document.body.removeChild(feedback);
//       }, 300);
//     }, 2000);
//   }



  exportMarkdownByRange() {
    if (this.editor.toolbar.recovery) {
      this.editor.toolbar.recovery.showPageRangeModal();
    }
  }

  getCurrentElement() {
    return this.editor.getCurrentElement();
  }
}
