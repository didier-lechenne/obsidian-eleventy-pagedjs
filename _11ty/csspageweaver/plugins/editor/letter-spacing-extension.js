/**
 * Extension Letter-spacing pour l'éditeur
 * Input intégré dans la toolbar
 */



// Classe pour input intégré
class ToolbarInput {
  constructor(command, html, title) {
    this.command = command;
    this.html = html;
    this.title = title;
  }
  
  render() {
    return this.html;
  }
}

export class LetterSpacingExtension {
  constructor(toolbar) {
    this.toolbar = toolbar;
    this.targetParagraph = null;
    this.currentSpan = null;
  }
  
  getButtons() {
    return [
      new ToolbarInput('letter-spacing-input', 
        `<div class="toolbar-input-group" title="Espacement des lettres">
           <label>LS:</label>
           <input type="number" min="-200" max="200" step="1" value="0" data-command="letter-spacing-input" />
         </div>`, 
         'Espacement des lettres')
    ];
  }
  
handleInputChange(input) {
  console.log('handleInputChange called with value:', input.value);
  const value = parseFloat(input.value);
  if (isNaN(value)) {
    console.log('Value is NaN, returning');
    return;
  }
  
  const selection = window.getSelection();
  console.log('Selection:', selection, 'Range count:', selection.rangeCount);
  if (selection.rangeCount === 0) return;
  
  let element = selection.anchorNode;
  console.log('Anchor node:', element);
  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }
  
  // Trouver le paragraphe parent
  let paragraph = element;
  while (paragraph && paragraph.tagName !== 'P' && paragraph !== document.body) {
    paragraph = paragraph.parentElement;
  }
  
  console.log('Found paragraph:', paragraph);
  if (!paragraph || paragraph === document.body) return;
  
  if (value === 0) {
    console.log('Removing letter spacing');
    this.removeLetterSpacing(paragraph);
  } else {
    console.log('Applying letter spacing:', value);
    this.applyLetterSpacing(paragraph, value);
  }
}
  
  applyLetterSpacing(paragraph, value) {
    // Supprimer ancien span s'il existe
    const existingSpan = paragraph.querySelector('span[style*="--ls:"]');
    if (existingSpan) {
      this.unwrapSpan(existingSpan);
    }
    
    // Créer nouveau span
    const span = document.createElement('span');
    span.style.setProperty('--ls', value);
    span.className = 'editor-add letter-spacing';
    
    // Envelopper tout le contenu du paragraphe
    const content = paragraph.innerHTML;
    paragraph.innerHTML = '';
    span.innerHTML = content;
    paragraph.appendChild(span);
    
    this.currentSpan = span;
  }
  
  removeLetterSpacing(paragraph) {
    const existingSpan = paragraph.querySelector('span[style*="--ls:"]');
    if (existingSpan) {
      this.unwrapSpan(existingSpan);
    }
    this.currentSpan = null;
  }
  
  unwrapSpan(span) {
    const parent = span.parentNode;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
    parent.normalize();
  }
  
  updateInputValue(element) {
    const input = this.toolbar.element.querySelector('[data-command="letter-spacing-input"]');
    if (!input) return;
    
    let paragraph = element;
    while (paragraph && paragraph.tagName !== 'P' && paragraph !== document.body) {
      paragraph = paragraph.parentElement;
    }
    
    if (!paragraph || paragraph === document.body) {
      input.value = 0;
      return;
    }
    
    const existingSpan = paragraph.querySelector('span[style*="--ls:"]');
    if (existingSpan) {
      const currentValue = existingSpan.style.getPropertyValue('--ls') || '0';
      input.value = currentValue;
    } else {
      input.value = 0;
    }
  }
  
  isLetterSpacingActive(element) {
    let paragraph = element;
    while (paragraph && paragraph.tagName !== 'P' && paragraph !== document.body) {
      paragraph = paragraph.parentElement;
    }
    
    if (!paragraph || paragraph === document.body) return false;
    
    return paragraph.querySelector('span[style*="--ls:"]') !== null;
  }
}