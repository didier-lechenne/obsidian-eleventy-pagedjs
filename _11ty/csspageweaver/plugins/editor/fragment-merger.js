/**
 * @name FragmentMerger
 * @file Fusion des éléments P scindés pour édition unifiée
 */
export class FragmentMerger {
  constructor(editor) {
    this.editor = editor;
    this.unifiedElements = new Map(); // ref -> unified element
  }

  // Vérifier si un élément P est fragmenté
  isFragmented(element) {
    if (element.tagName !== 'P') return false;
    
    const ref = element.dataset.ref;
    if (!ref) return false;
    
    // Compter les fragments avec même ref
    const fragments = document.querySelectorAll(`p[data-ref="${ref}"]`);
    return fragments.length > 1;
  }

  // Créer un élément unifié à partir des fragments
  createUnified(ref) {
    const fragments = Array.from(document.querySelectorAll(`p[data-ref="${ref}"]`))
      .sort((a, b) => {
        // Trier par ordre d'apparition dans le document
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

    if (fragments.length <= 1) return null;

    // Créer l'élément unifié invisible
    const unified = fragments[0].cloneNode(false);
    unified.id = `unified-${ref}`;
    unified.className = unified.className + ' unified-editor-element';
    unified.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      visibility: hidden;
      width: ${fragments[0].offsetWidth}px;
    `;

    // Fusionner le contenu HTML
    unified.innerHTML = fragments.map(f => f.innerHTML).join('');

    // Nettoyer les attributs de fragmentation
    unified.removeAttribute('data-split-from');
    unified.removeAttribute('data-split-to');
    unified.setAttribute('data-unified-for', ref);

    document.body.appendChild(unified);
    this.unifiedElements.set(ref, unified);

    return unified;
  }

  // Obtenir ou créer l'élément unifié
  getUnified(originalElement) {
    const ref = originalElement.closest('p[data-ref]')?.dataset.ref;
    if (!ref || !this.isFragmented(originalElement)) return null;

    let unified = this.unifiedElements.get(ref);
    if (!unified) {
      unified = this.createUnified(ref);
    }

    return unified;
  }

  // Trouver l'élément correspondant dans l'unifié
  findCorrespondingElement(originalElement, unified) {
    // Calculer la position relative dans les fragments originaux
    const ref = originalElement.closest('p[data-ref]').dataset.ref;
    const fragments = document.querySelectorAll(`p[data-ref="${ref}"]`);
    
    let totalOffset = 0;
    let found = false;

    for (const fragment of fragments) {
      const walker = document.createTreeWalker(
        fragment,
        NodeFilter.SHOW_ALL
      );

      let node;
      while (node = walker.nextNode()) {
        if (node === originalElement) {
          found = true;
          break;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          totalOffset++;
        }
      }

      if (found) break;
      
      // Compter les éléments dans ce fragment
      const elementsInFragment = fragment.querySelectorAll('*').length;
      totalOffset += elementsInFragment;
    }

    // Trouver l'élément correspondant dans l'unifié
    const allElements = unified.querySelectorAll('*');
    return allElements[totalOffset] || unified;
  }

  // Synchroniser les modifications vers les fragments source
  syncToSource(ref) {
    const unified = this.unifiedElements.get(ref);
    if (!unified) return;

    // Trouver l'élément source
    const sourceElement = this.editor.chunker?.source?.querySelector(`p[data-ref="${ref}"]`);
    if (sourceElement) {
      sourceElement.innerHTML = unified.innerHTML;
    }
  }

  // Appliquer et relancer la pagination
  applyAndReflow(ref) {
    this.syncToSource(ref);
    
    // Nettoyer l'élément unifié
    const unified = this.unifiedElements.get(ref);
    if (unified) {
      unified.remove();
      this.unifiedElements.delete(ref);
    }

    // Reflow asynchrone
    setTimeout(() => {
      if (this.editor.chunker && this.editor.chunker.render) {
        this.editor.chunker.render(this.editor.chunker.source);
      }
    }, 100);
  }

  // Nettoyer tous les éléments unifiés
  cleanup() {
    this.unifiedElements.forEach(unified => unified.remove());
    this.unifiedElements.clear();
  }
}