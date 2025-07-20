// markdown-break-plugin.js
function markdownBreakPlugin(md) {
  md.inline.ruler.after('emphasis', 'break-column', function(state, silent) {
    const marker = '|';
    const start = state.pos;
    
    if (state.src.substr(start, marker.length) !== marker) {
      return false;
    }
    
    if (silent) return true;
    
    const token = state.push('break_column', 'span', 0);
    token.attrSet('class', 'breakcolumn');
    
    state.pos += marker.length;
    return true;
  });
  
  md.renderer.rules.break_column = function() {
    return '<span class="breakcolumn"></span>';
  };
}

module.exports = markdownBreakPlugin;