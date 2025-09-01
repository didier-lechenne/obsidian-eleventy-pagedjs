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
    span.setAttribute("data-timestamp", Date.now().toString());
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

    const fragment = document.createDocumentFragment();

    // Si createElement() a été modifié, ces éléments auront automatiquement
    // la classe 'editor-add' et l'attribut 'data-timestamp'
    const openQuoteSpan = this.createElement("span", "french-quote-open");
    openQuoteSpan.textContent = UNICODE_CHARS.LAQUO; // Guillemet ouvrant français

    const openSpaceSpan = this.createElement("span", "i_space no-break-narrow-space");
    openSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

    const textNode = document.createTextNode(text);

    const closeSpaceSpan = this.createElement("span", "i_space no-break-narrow-space");
    closeSpaceSpan.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

    const closeQuoteSpan = this.createElement("span", "french-quote-close");
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

      const openQuoteSpan = this.createElement(
        "span",
        "english-quote-open "
      );
     
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
    const selection = this.editor.selection.getCurrentSelection();
    if (!selection?.isValid) return;

    const range = selection.range;
    const span = this.createElement("span", `i_space ${className} editor-add`);
    span.setAttribute("data-timestamp", Date.now().toString());
    span.textContent = content;

    range.deleteContents();
    range.insertNode(span);
    range.setStartAfter(span);
    range.collapse(true);
    selection.selection.removeAllRanges();
    selection.selection.addRange(range);

    this.triggerAutoCopy();
  }

  // ====== ACTIONS UTILITAIRES ======


// resetTransformations() {
//   const editableElement = this.editor.getCurrentElement();
//   if (!editableElement) return;

//   // Supprimer tous les éléments avec timestamp (mécanisme existant)
//   const addedElements = editableElement.querySelectorAll("[data-timestamp]");
//   addedElements.forEach((element) => {
//     element.parentNode?.removeChild(element);
//   });

//   // Supprimer les spans .editor-add (mais préserver leur contenu)
//   const spans = editableElement.querySelectorAll("span.editor-add");
//   spans.forEach((span) => {
//     const parent = span.parentNode;
//     while (span.firstChild) {
//       parent.insertBefore(span.firstChild, span);
//     }
//     parent.removeChild(span);
//   });

//   this.triggerAutoCopy();

//   // SOLUTION : Forcer la toolbar à rester visible après reset
//   setTimeout(() => {
//     if (this.editor.toolbar.isVisible) {
//       // Créer une sélection factice pour maintenir la toolbar
//       const range = document.createRange();
//       range.selectNodeContents(editableElement);
//       range.collapse(true); // Curseur au début
      
//       const selection = window.getSelection();
//       selection.removeAllRanges();
//       selection.addRange(range);
      
//       // Utiliser les méthodes existantes
//       const currentSelection = this.editor.selection.getCurrentSelection();
//       if (currentSelection) {
//         this.editor.toolbar.show(currentSelection);
//       }
//     }
//   }, 10);
// }



undoLastTransformation() {
  const editableElement = this.editor.getCurrentElement();
  if (!editableElement) return;

  // 1. Récupérer TOUS les éléments avec timestamp
  const timestampedElements = Array.from(editableElement.querySelectorAll("[data-timestamp]"));
  
  if (timestampedElements.length === 0) {
    console.log("Aucune transformation à annuler");
    return;
  }

  // 2. Trier par timestamp (le plus récent en premier)
  timestampedElements.sort((a, b) => {
    const timestampA = parseInt(a.getAttribute("data-timestamp"));
    const timestampB = parseInt(b.getAttribute("data-timestamp"));
    return timestampB - timestampA; // Tri décroissant (plus récent d'abord)
  });

  // 3. Prendre le timestamp le plus récent (premier dans la liste triée)
  const latestTimestamp = timestampedElements[0].getAttribute("data-timestamp");
  
  // 4. Supprimer TOUS les éléments qui ont ce timestamp
  const elementsToRemove = editableElement.querySelectorAll(`[data-timestamp="${latestTimestamp}"]`);
  
  console.log(`Annulation de ${elementsToRemove.length} élément(s) avec timestamp ${latestTimestamp}`);
  
  elementsToRemove.forEach((element) => {
    // Si c'est un span avec contenu, on préserve le contenu
    if (element.tagName === 'SPAN' && element.hasChildNodes()) {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    } else {
      // Sinon, supprimer complètement l'élément
      element.parentNode?.removeChild(element);
    }
  });

  this.triggerAutoCopy();

  // 5. Maintenir la toolbar visible
  setTimeout(() => {
    const range = document.createRange();
    range.selectNodeContents(editableElement);
    range.collapse(true);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const currentSelection = this.editor.selection.getCurrentSelection();
    if (currentSelection) {
      this.editor.toolbar.show(currentSelection);
    }
  }, 10);
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
      this.editor.toolbar.recovery.showPageRangeModal();
    }
  }

  // ====== MÉTHODES UTILITAIRES ======

  showFeedback(message) {
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

  // CORRECTION: triggerAutoCopy corrigé
  triggerAutoCopy() {
    if (this.editor.options.autoCopy) {
      setTimeout(() => this.copyElementAsMarkdown(), 100);
    }
  }

  // CORRECTION: Une seule méthode getCurrentElement qui délègue à l'éditeur
  getCurrentElement() {
    return this.editor.getCurrentElement();
  }

  // CORRECTION: performAutoCopy corrigé
  performAutoCopy() {
    if (!this.editor.options.autoCopy) return;

    const element = this.getCurrentElement();
    if (!element) return;

    if (this.editor.toolbar.turndown) {
      const markdown = this.editor.toolbar.turndown.turndown(element.innerHTML);

      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          console.log("Auto-copie effectuée");
        })
        .catch((err) => {
          console.error("Erreur lors de l'auto-copie:", err);
        });
    }
  }
}
