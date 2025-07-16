/**
 * @file modules/clipboard.js
 * Gestion du presse-papiers avec conversion Markdown
 */

import { StateManager } from './state.js';

/**
 * Module de gestion du presse-papiers
 */
export const ClipboardModule = {
  /**
   * Copie le contenu de l'élément édité dans le presse-papier
   */
  async copyToClipboard() {
    if (!StateManager.currentEditingElement) {
      StateManager.log('No element currently being edited');
      return;
    }
    
    const htmlContent = StateManager.currentEditingElement.innerHTML;
    const blockId = StateManager.currentEditingElement.getAttribute('editable-id');
    
    if (!htmlContent) {
      StateManager.log('No content to copy');
      return;
    }
    
    let contentToCopy = htmlContent;
    let format = 'HTML';
    
    // Tentative de conversion Markdown si TurndownService est disponible
    if (typeof TurndownService !== 'undefined') {
      try {
        contentToCopy = this.convertToMarkdown(htmlContent);
        format = 'Markdown';
        StateManager.log(`Content converted to Markdown with inline footnotes:`, contentToCopy);
      } catch (err) {
        StateManager.log('Markdown conversion failed, using HTML:', err);
        contentToCopy = htmlContent;
        format = 'HTML (fallback)';
      }
    }
    
    try {
      await navigator.clipboard.writeText(contentToCopy);
      StateManager.log(`Block ${blockId} copied as ${format}:`, contentToCopy);
      
      this.showNotification(`✓ Block ${blockId} copied as ${format}`, 'success');
      
    } catch (err) {
      StateManager.log('Clipboard API failed, using fallback:', err);
      // Fallback pour les navigateurs plus anciens
      this.fallbackCopy(contentToCopy);
      this.showNotification(`✓ Block ${blockId} copied as ${format} (fallback)`, 'warning');
    }
  },

  /**
   * Convertit HTML en Markdown avec support des footnotes inline
   */
  convertToMarkdown(htmlContent) {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });

    // FONCTION HELPER: Convertir le HTML d'une note en Markdown
    function convertNoteContentToMarkdown(htmlElement) {
      const noteConverter = new TurndownService({
        headingStyle: 'atx',
        emDelimiter: '*',
        strongDelimiter: '**',
        linkStyle: 'inlined'
      });
      
      let markdown = noteConverter.turndown(htmlElement.innerHTML);
      markdown = markdown.replace(/\s+/g, ' ').trim();
      markdown = markdown.replace(/\]/g, '\\]');
      
      return markdown;
    }

    // Conversion des appels de footnote en inline
    turndownService.addRule('footnoteCall', {
      filter: function (node) {
        return node.nodeName === 'A' && 
               node.classList.contains('footnote') && 
               node.hasAttribute('data-footnote-call');
      },
      replacement: function (content, node) {
        const footnoteId = node.getAttribute('data-footnote-call') || node.getAttribute('data-ref');
        const footnoteContent = document.querySelector(`#note-${footnoteId}`);
        
        if (footnoteContent) {
          const noteMarkdown = convertNoteContentToMarkdown(footnoteContent);
          return `^[${noteMarkdown}]`;
        }
        
        return `^[Note ${footnoteId.substring(0, 8)}]`;
      }
    });

    // Supprimer les définitions de footnote (maintenant inline)
    turndownService.addRule('footnoteDefinition', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && 
               node.classList.contains('footnote') && 
               node.hasAttribute('id') && 
               node.id.startsWith('note-');
      },
      replacement: function (content, node) {
        return '';
      }
    });

    return turndownService.turndown(htmlContent);
  },

  /**
   * Méthode de copie de secours pour navigateurs anciens
   */
  fallbackCopy(content) {
    const textArea = document.createElement('textarea');
    textArea.value = content;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  },

  /**
   * Affiche une notification à l'utilisateur
   */
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `tc-notification tc-notification--${type}`;
    document.body.appendChild(notification);
    
    // Auto-suppression après 3 secondes
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('tc-notification--fade-out');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }
};