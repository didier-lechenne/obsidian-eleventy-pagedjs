import { UNICODE_CHARS } from "./unicode.js";

/**
 * @name ACTIONS_REGISTRY
 * @description Registre centralisé de toutes les actions disponibles dans l'éditeur
 */

export const ACTIONS_REGISTRY = {
  // === ACTIONS DE FORMATAGE (TOGGLE) ===

  smallcaps: {
    type: "toggle",
    icon: "ᴀᴀ",
    title: "Petites capitales",
    execute: (editor) => editor.commands.toggleSmallCaps(),
    isActive: (element) => {
      let current = element;
      while (current && current !== document.body) {
        if (
          current.tagName === "SPAN" &&
          current.classList.contains("small-caps")
        ) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    },
  },

  superscript: {
    type: "toggle",
    icon: "x²",
    title: "Exposant",
    execute: (editor) => editor.commands.toggleSuperscript(),
    isActive: (element) => element.closest("sup") !== null,
  },

"letter-spacing": {
  type: "toggle",
  icon: "A ↔ A", 
  title: "Lettrage (Letter-spacing)",
  execute: (editor) => {
    const input = document.querySelector(".ls-input");
    const button = document.querySelector('[data-command="letter-spacing"]');

    if (input.classList.contains("ls-hide")) {
      input.classList.remove("ls-hide");
      button.classList.add("active");
    } else {
      input.classList.add("ls-hide");
      button.classList.remove("active");
    }
  },
  isActive: (element) => {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === "SPAN" && 
          current.style.getPropertyValue("--ls") !== "") {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  },
},

  // === ACTIONS D'INSERTION ===

  "nbsp": {
    type: "insert",
    icon: "␣",
    title: "Espace insécable",
    execute: (editor) =>
      editor.commands.insertSpace(
        "no-break-space",
        UNICODE_CHARS.NO_BREAK_SPACE
      ),
  },

  "nnbsp": {
    type: "insert",
    icon: "⍽",
    title: "Espace insécable fine",
    execute: (editor) =>
      editor.commands.insertSpace(
        "no-break-narrow-space",
        UNICODE_CHARS.NO_BREAK_THIN_SPACE
      ),
  },

  "em-dash": {
    type: "insert",
    icon: "—",
    title: "Tiret cadratin",
    execute: (editor) => editor.commands.insertText(UNICODE_CHARS.EM_DASH),
  },

  "en-dash": {
    type: "insert",
    icon: "–",
    title: "Tiret demi-cadratin",
    execute: (editor) => editor.commands.insertText(UNICODE_CHARS.EN_DASH),
  },

  br: {
    type: "insert",
    icon: "↵",
    title: "Saut de ligne",
    execute: (editor) => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const br = editor.commands.createElement("br");

        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
  },

  "break-column": {
    type: "insert",
    icon: "⤋",
    title: "Saut de colonne",
    execute: (editor) => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const br = editor.commands.createElement("br", "break-column");

        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
  },

  "break-page": {
    type: "insert",
    icon: "⤓",
    title: "Saut de page",
    execute: (editor) => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const br = editor.commands.createElement("br", "break-column");

        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
  },

  // === ACTIONS DE GUILLEMETS ===
  // Ces actions encadrent la sélection avec des guillemets appropriés

  "quotes-fr": {
    type: "toggle",
    icon: `${UNICODE_CHARS.LAQUO} ${UNICODE_CHARS.RAQUO}`,
    title: "Guillemets français",
    execute: (editor) => {
      if (editor.commands.toggleFrenchQuotes) {
        editor.commands.toggleFrenchQuotes();
      } else {
        console.warn(
          "Méthode toggleFrenchQuotes non disponible dans commands.js"
        );
      }
    },
    isActive: (element) => {
      const parent = element.closest("*");
      if (!parent) return false;

      const hasOpen = parent.querySelector(".french-quote-open");
      const hasClose = parent.querySelector(".french-quote-close");
      return hasOpen && hasClose;
    },
  },

  "quotes-en": {
    type: "toggle",
    icon: `${UNICODE_CHARS.LDQUO} ${UNICODE_CHARS.RDQUO}`,
    title: "Guillemets anglais",
    execute: (editor) => {
      if (editor.commands.toggleEnglishQuotes) {
        editor.commands.toggleEnglishQuotes();
      } else {
        console.warn(
          "Méthode toggleEnglishQuotes non disponible dans commands.js"
        );
      }
    },
    isActive: (element) => {
      const parent = element.closest("*");
      if (!parent) return false;

      const hasOpen = parent.querySelector(".english-quote-open");
      const hasClose = parent.querySelector(".english-quote-close");
      return hasOpen && hasClose;
    },
  },

  // === MENUS DÉROULANTS (SELECT) ===

  "accented-caps": {
    type: "select",
    icon: "À",
    title: "Capitales accentuées",
    options: [
      { value: "A_grave", label: "À - A accent grave", char: "À" },
      { value: "A_acute", label: "Á - A accent aigu", char: "Á" },
      { value: "A_circ", label: "Â - A circonflexe", char: "Â" },
      { value: "A_uml", label: "Ä - A tréma", char: "Ä" },
      { value: "C_cedil", label: "Ç - C cédille", char: "Ç" },
      { value: "E_grave", label: "È - E accent grave", char: "È" },
      { value: "E_acute", label: "É - E accent aigu", char: "É" },
      { value: "E_circ", label: "Ê - E circonflexe", char: "Ê" },
      { value: "E_uml", label: "Ë - E tréma", char: "Ë" },
      { value: "I_grave", label: "Ì - I accent grave", char: "Ì" },
      { value: "I_acute", label: "Í - I accent aigu", char: "Í" },
      { value: "I_circ", label: "Î - I circonflexe", char: "Î" },
      { value: "I_uml", label: "Ï - I tréma", char: "Ï" },
      { value: "O_grave", label: "Ò - O accent grave", char: "Ò" },
      { value: "O_acute", label: "Ó - O accent aigu", char: "Ó" },
      { value: "O_circ", label: "Ô - O circonflexe", char: "Ô" },
      { value: "O_uml", label: "Ö - O tréma", char: "Ö" },
      { value: "U_grave", label: "Ù - U accent grave", char: "Ù" },
      { value: "U_acute", label: "Ú - U accent aigu", char: "Ú" },
      { value: "U_circ", label: "Û - U circonflexe", char: "Û" },
      { value: "U_uml", label: "Ü - U tréma", char: "Ü" },
    ],
    execute: (editor, value) => {
      const action = ACTIONS_REGISTRY["accented-caps"];
      const option = action.options.find((opt) => opt.value === value);
      if (option?.char) {
        editor.commands.insertText(option.char);
      }
    },
  },

  // === ACTIONS UTILITAIRES ===

reset: {
  type: "utility",
  icon: "⟲", 
  title: "Annuler dernière transformation",
  execute: (editor) => {
    console.log("Reset execute called");
    console.log("editor.commands:", editor.commands);
    console.log("undoLastTransformation exists:", typeof editor.commands.undoLastTransformation);
    
    if (editor.commands.undoLastTransformation) {
      console.log("Calling undoLastTransformation...");
      editor.commands.undoLastTransformation();
    } else {
      console.warn("Méthode undoLastTransformation non disponible dans commands.js");
    }
  },
},

  "copy-md": {
    type: "utility",
    icon: `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNsaXBib2FyZC1jb3B5LWljb24gbHVjaWRlLWNsaXBib2FyZC1jb3B5Ij48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI0IiB4PSI4IiB5PSIyIiByeD0iMSIgcnk9IjEiLz48cGF0aCBkPSJNOCA0SDZhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTIiLz48cGF0aCBkPSJNMTYgNGgyYTIgMiAwIDAgMSAyIDJ2NCIvPjxwYXRoIGQ9Ik0yMSAxNEgxMSIvPjxwYXRoIGQ9Im0xNSAxMC00IDQgNCA0Ii8+PC9zdmc+" style="width: 16px; height: 16px; filter: invert(1);" alt="Copy">`,
    title: "Copier l'élément en Markdown",
    execute: (editor) => {
      if (editor.commands.copyElementAsMarkdown) {
        editor.commands.copyElementAsMarkdown();
      } else {
        console.warn(
          "Méthode copyElementAsMarkdown non disponible dans commands.js"
        );
      }
    },
  },

  "export-md": {
    type: "utility",
    icon: `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWV4dGVybmFsLWxpbmstaWNvbiI+PHBhdGggZD0ibTE1IDNINWEyIDIgMCAwIDAtMiAydjE0YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMlY5Ii8+PHBhdGggZD0ibTEwIDE0IDItMm0yLTIgMi0yIDItMiIvPjxwYXRoIGQ9Im0xNSAzIDYgNi0xIDEtNi02IDEtMVoiLz48L3N2Zz4=" style="width: 16px; height: 16px; filter: invert(1);" alt="Export">`,
    title: "Exporter par plage de pages",
    execute: (editor) => {
      if (editor.commands.exportMarkdownByRange) {
        editor.commands.exportMarkdownByRange();
      } else {
        console.warn(
          "Méthode exportMarkdownByRange non disponible dans commands.js"
        );
      }
    },
  },
};

/**
 * Fonctions utilitaires
 */

export function getActionsByType(type) {
  return Object.entries(ACTIONS_REGISTRY)
    .filter(([_, config]) => config.type === type)
    .reduce((acc, [id, config]) => ({ ...acc, [id]: config }), {});
}

export function isValidAction(actionId) {
  return actionId in ACTIONS_REGISTRY;
}

export function executeAction(actionId, editor, value = null) {
  const action = ACTIONS_REGISTRY[actionId];
  if (!action) {
    console.warn(`Action inconnue: ${actionId}`);
    return false;
  }

  try {
    action.execute(editor, value);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de l'action ${actionId}:`, error);
    return false;
  }
}
