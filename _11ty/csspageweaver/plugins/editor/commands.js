/**
 * @name Commands
 * @file Commandes d'édition et formatage
 */
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



  // Méthodes utilitaires pour le letter-spacing (déplacées depuis l'extension)
 findLetterSpacingSpan(range) {
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    // D'abord vérifier si on est dans un élément unifié
    const unified = container.closest('.unified-editor-element');
    if (unified) {
      // Chercher dans l'élément unifié
      let current = container;
      while (current && current !== unified) {
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

    // Logique normale pour éléments non fragmentés
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
