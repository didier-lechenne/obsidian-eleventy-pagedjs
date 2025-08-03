// turndown-plugins/annotations.js
export function annotationsPlugin(turndownService) {
  turndownService.addRule('mark', {
    filter: 'mark',
    replacement: function(content) {
      return '==' + content + '==';
    }
  });
  
  turndownService.addRule('del', {
    filter: 'del',
    replacement: function(content) {
      return '~~' + content + '~~';
    }
  });
  
  turndownService.addRule('ins', {
    filter: 'ins',
    replacement: function(content) {
      return '++' + content + '++';
    }
  });

// turndownService.addRule('cite', {
//   filter: 'cite',
//   replacement: function(content) {
//     return '*' + content + '*';  // En italique
//   }
// });

}
