import { UNICODE_CHARS } from "./unicode.js";

/**
 * @name ACTIONS_REGISTRY
 * @description Registre centralisé de toutes les actions disponibles dans l'éditeur
 * 
 * Chaque action contient :
 * - type: 'toggle' | 'insert' | 'select' | 'utility'
 * - icon: Icône affichée dans la toolbar
 * - title: Texte du tooltip
 * - execute: Fonction qui exécute l'action
 * - isActive: (optionnel) Fonction qui détermine si l'action est active
 * - options: (pour type 'select') Liste des options disponibles
 */

export const ACTIONS_REGISTRY = {
  
  // === ACTIONS DE FORMATAGE (TOGGLE) ===
  // Ces actions appliquent/retirent un formatage selon l'état actuel
  
  'smallcaps': {
    type: 'toggle',
    icon: 'ᴀᴀ',
    title: 'Petites capitales',
    execute: (editor) => editor.commands.toggleSmallCaps(),
    isActive: (element) => {
      // Recherche un span avec la classe small-caps dans les parents
      let current = element;
      while (current && current !== document.body) {
        if (current.tagName === 'SPAN' && current.classList.contains('small-caps')) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    }
  },

  'superscript': {
    type: 'toggle',
    icon: 'x²',
    title: 'Exposant',
    execute: (editor) => editor.commands.toggleSuperscript(),
    isActive: (element) => {
      // Recherche un élément SUP dans les parents
      return element.closest('sup') !== null;
    }
  },


'letter-spacing': {
 type: 'toggle',
 icon: 'A ↔ A <input type="number" class="ls-input" placeholder="0" min="-5" max="20" step="1" style="width:40px;margin-left:5px;">',
 title: 'Lettrage (Letter-spacing)',
 execute: (editor) => {
   const selection = editor.selection.getCurrentSelection();
   if (!selection?.isValid) return;
   
   editor.commands.createLetterSpacingSpan();
 },
 isActive: (element) => {
   let current = element;
   while (current && current !== document.body) {
     if (current.tagName === 'SPAN' && 
         current.style.getPropertyValue('--ls') !== '') {
       return true;
     }
     current = current.parentElement;
   }
   return false;
 }
},

  // === ACTIONS D'INSERTION D'ESPACES ===
  // Ces actions insèrent des caractères spéciaux typographiques
  
  'nbsp': {
    type: 'insert',
    icon: '⎵',
    title: 'Espace insécable',
    execute: (editor) => {
      // Insertion d'un span avec espace insécable pour le rendre visible
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const span = document.createElement("span");
        span.className = "i_space non-breaking-space editor-add";
        span.textContent = UNICODE_CHARS.NO_BREAK_SPACE;

        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  },

  'nnbsp': {
    type: 'insert',
    icon: '⸱',
    title: 'Espace insécable fine',
    execute: (editor) => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        const span = document.createElement("span");
        span.className = "i_space narrow-no-break-space editor-add";
        span.textContent = UNICODE_CHARS.NO_BREAK_THIN_SPACE;

        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  },

  // === ACTIONS DE GUILLEMETS ===
  // Ces actions encadrent la sélection avec des guillemets appropriés
  
  'quotes-fr': {
    type: 'toggle',
    icon: `${UNICODE_CHARS.LAQUO} ${UNICODE_CHARS.RAQUO}`,
    title: 'Guillemets français',
    execute: (editor) => {
      // Appel direct aux commandes de l'éditeur plutôt qu'aux extensions
      // Cette approche est plus cohérente avec notre architecture simplifiée
      if (editor.commands.toggleFrenchQuotes) {
        editor.commands.toggleFrenchQuotes();
      } else {
        console.warn('Méthode toggleFrenchQuotes non disponible dans commands.js');
      }
    },
    isActive: (element) => {
      // Vérifie la présence de guillemets français dans le parent
      const parent = element.closest('*');
      if (!parent) return false;
      
      const hasOpen = parent.querySelector('.french-quote-open');
      const hasClose = parent.querySelector('.french-quote-close');
      return hasOpen && hasClose;
    }
  },

  'quotes-en': {
    type: 'toggle',
    icon: `${UNICODE_CHARS.LDQUO} ${UNICODE_CHARS.RDQUO}`,
    title: 'Guillemets anglais',
    execute: (editor) => {
      // Appel direct aux commandes de l'éditeur
      if (editor.commands.toggleEnglishQuotes) {
        editor.commands.toggleEnglishQuotes();
      } else {
        console.warn('Méthode toggleEnglishQuotes non disponible dans commands.js');
      }
    },
    isActive: (element) => {
      const parent = element.closest('*');
      if (!parent) return false;
      
      const hasOpen = parent.querySelector('.english-quote-open');
      const hasClose = parent.querySelector('.english-quote-close');
      return hasOpen && hasClose;
    }
  },

  // === ACTION DE SAUT DE LIGNE ===
  
  'br': {
    type: 'insert',
    icon: '↵',
    title: 'Saut de ligne',
    execute: (editor) => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const br = document.createElement("br");
        br.className = "editor-add";
        
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  },

  // === ACTIONS UTILITAIRES ===
  // Ces actions effectuent des opérations sur le document
  
  'reset': {
    type: 'utility',
    icon: '⟲',
    title: 'Supprimer transformations',
    execute: (editor) => {
      // Appel direct aux commandes de l'éditeur pour la fonction de reset
      // Cette méthode centralise la logique de nettoyage
      if (editor.commands.resetTransformations) {
        editor.commands.resetTransformations();
      } else {
        console.warn('Méthode resetTransformations non disponible dans commands.js');
      }
    }
  },

  'copy-md': {
    type: 'utility',
    icon: `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNsaXBib2FyZC1jb3B5LWljb24gbHVjaWRlLWNsaXBib2FyZC1jb3B5Ij48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI0IiB4PSI4IiB5PSIyIiByeD0iMSIgcnk9IjEiLz48cGF0aCBkPSJNOCA0SDZhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTIiLz48cGF0aCBkPSJNMTYgNGgyYTIgMiAwIDAgMSAyIDJ2NCIvPjxwYXRoIGQ9Ik0yMSAxNEgxMSIvPjxwYXRoIGQ9Im0xNSAxMC00IDQgNCA0Ii8+PC9zdmc+" style="width: 16px; height: 16px; filter: invert(1);" alt="Copy">`,
    title: 'Copier l\'élément en Markdown',
    execute: (editor) => {
      // Appel direct aux commandes de l'éditeur pour la copie Markdown
      if (editor.commands.copyElementAsMarkdown) {
        editor.commands.copyElementAsMarkdown();
      } else {
        console.warn('Méthode copyElementAsMarkdown non disponible dans commands.js');
      }
    }
  },

  'export-md': {
    type: 'utility',
    icon: `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtZG93bi1pY29uIGx1Y2lkZS1maWxlLWRvd24iPjxwYXRoIGQ9Ik0xNSAySDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWN1oiLz48cGF0aCBkPSJNMTQgMnY0YTIgMiAwIDAgMCAyIDJoNCIvPjxwYXRoIGQ9Ik0xMiAxOHYtNiIvPjxwYXRoIGQ9Im05IDE1IDMgMyAzLTMiLz48L3N2Zz4=" style="width: 16px; height: 16px; filter: invert(1);" alt="Export">`,
    title: 'Télécharger le fichier markdown',
    execute: (editor) => {
      // Accès direct à l'instance de recovery via la toolbar
      // Cette approche est plus claire que l'ancienne méthode via les extensions
      if (editor.toolbar && editor.toolbar.recovery) {
        editor.toolbar.recovery.showPageRangeModal();
      } else {
        console.error('Service de recovery non disponible');
      }
    }
  },

  // === ACTIONS DE TYPE SELECT ===
  // Ces actions présentent un menu déroulant avec plusieurs choix
  
  'accented-caps': {
    type: 'select',
    icon: 'Á ⌄',
    title: 'Capitales accentuées',
    options: [
      { value: 'A_acute', label: 'Á - A accent aigu', char: 'Á' },
      { value: 'A_grave', label: 'À - A accent grave', char: 'À' },
      { value: 'A_circ', label: 'Â - A circonflexe', char: 'Â' },
      { value: 'A_uml', label: 'Ä - A tréma', char: 'Ä' },
      { value: 'A_tilde', label: 'Ã - A tilde', char: 'Ã' },
      { value: 'A_ring', label: 'Å - A rond', char: 'Å' },
      { value: 'AE', label: 'Æ - AE lié', char: 'Æ' },
      { value: 'C_cedilla', label: 'Ç - C cédille', char: 'Ç' },
      { value: 'E_acute', label: 'É - E accent aigu', char: 'É' },
      { value: 'E_grave', label: 'È - E accent grave', char: 'È' },
      { value: 'E_circ', label: 'Ê - E circonflexe', char: 'Ê' },
      { value: 'E_uml', label: 'Ë - E tréma', char: 'Ë' },
      { value: 'I_acute', label: 'Í - I accent aigu', char: 'Í' },
      { value: 'I_grave', label: 'Ì - I accent grave', char: 'Ì' },
      { value: 'I_circ', label: 'Î - I circonflexe', char: 'Î' },
      { value: 'I_uml', label: 'Ï - I tréma', char: 'Ï' },
      { value: 'O_acute', label: 'Ó - O accent aigu', char: 'Ó' },
      { value: 'O_grave', label: 'Ò - O accent grave', char: 'Ò' },
      { value: 'O_circ', label: 'Ô - O circonflexe', char: 'Ô' },
      { value: 'O_uml', label: 'Ö - O tréma', char: 'Ö' },
      { value: 'O_tilde', label: 'Õ - O tilde', char: 'Õ' },
      { value: 'U_acute', label: 'Ú - U accent aigu', char: 'Ú' },
      { value: 'U_grave', label: 'Ù - U accent grave', char: 'Ù' },
      { value: 'U_circ', label: 'Û - U circonflexe', char: 'Û' },
      { value: 'U_uml', label: 'Ü - U tréma', char: 'Ü' },
      { value: 'Y_acute', label: 'Ý - Y accent aigu', char: 'Ý' },
      { value: 'Y_uml', label: 'Ÿ - Y tréma', char: 'Ÿ' }
    ],
    execute: (editor, value) => {
      // Trouve l'option correspondante et insère le caractère
      const action = ACTIONS_REGISTRY['accented-caps'];
      const option = action.options.find(opt => opt.value === value);
      if (option?.char) {
        editor.commands.insertText(option.char);
//         editor.commands.insertTypographicSpan(option.char, "editor-add");
      }
    }
  }
};

/**
 * @name Helper functions
 * @description Fonctions utilitaires pour travailler avec le registre
 */

// Fonction pour obtenir toutes les actions d'un type donné
export function getActionsByType(type) {
  return Object.entries(ACTIONS_REGISTRY)
    .filter(([_, config]) => config.type === type)
    .reduce((acc, [id, config]) => ({ ...acc, [id]: config }), {});
}

// Fonction pour valider qu'une action existe
export function isValidAction(actionId) {
  return actionId in ACTIONS_REGISTRY;
}

// Fonction pour exécuter une action de manière sécurisée
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