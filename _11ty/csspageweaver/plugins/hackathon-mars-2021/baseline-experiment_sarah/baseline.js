class baselineMover extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  renderNode(node, sourceNode) {
    // on récupère la variable baseline
    var brutBaseline = getComputedStyle(document.body).getPropertyValue('--baseline');
    // on clean la variable baseline 
    var baseline = brutBaseline.replace('px', '');
    
    if(node.nodeType == 1 && node.previousElementSibling){
      if (node.tagName == "P") {
        if (["H2", "H3", "OL", "UL", "FIGURE"].includes(node.previousElementSibling.tagName)) {
          startBaseline(node, baseline);
        }
      }
      if (node.tagName == "H2") {
        if (["H2", "H3", "OL", "UL", "FIGURE"].includes(node.previousElementSibling.tagName)) {
          startBaseline(node, baseline);
        }
      }
      if (node.tagName == "H3") {
        if (["H2", "H3", "OL", "UL", "FIGURE"].includes(node.previousElementSibling.tagName)) {
          startBaseline(node, baseline);
        }
      }
    }
  }
}

Paged.registerHandlers(baselineMover);


class baselineRandom extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  renderNode(node, sourceNode) {
    if (
      node.nodeType == 1 &&
      node.classList.contains("random-base")
    ) {
        if (node) {
          const baseline = 20;
          const maxSpace = baseline * 10;
          let randomBaseline = Math.floor(Math.random()*maxSpace/baseline)*baseline+baseline;
          const elementOffset = node.offsetTop;
          const elementline = Math.floor(elementOffset / randomBaseline);
          const nextPline = (elementline + 1) * randomBaseline;
          node.style.paddingTop = `${nextPline - elementOffset}px`;

          const elementWidth = node.clientWidth;
          const pageWidth = document.querySelector('.pagedjs_area').clientWidth;
          const gridSize = pageWidth/5;
          let randomLeft = Math.floor(Math.random()*(pageWidth-elementWidth)/gridSize)*gridSize+gridSize;
          node.style.marginLeft = `${randomLeft}px`;
        }
      }
  }
}

Paged.registerHandlers(baselineRandom);


class baselineRandomWords extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  renderNode(node, sourceNode) {
    if (
      node.nodeType == 1 &&
      node.classList.contains("random-separate-words")
    ) {
        if(node) {
          // séparer le paragraphe en mots
          let words = node.textContent.split(" ");
          node.innerHTML = "";

          const baseline = 20;
          const maxSpace = baseline*2;
          let randomBaseline = Math.floor(Math.random()*maxSpace/baseline)*baseline+baseline;

          // itérer sur tous les mots 
          for(let i=0; i<words.length; i++){
            let newSpan = document.createElement('span');
            newSpan.innerHTML = words[i];
            newSpan.style.display = "inline-block";
            node.appendChild(newSpan);
        
          const elementOffset = newSpan.offsetTop;
          const elementline = Math.floor(elementOffset / randomBaseline);
          const nextPline = (elementline + 1) * randomBaseline;
          newSpan.style.paddingTop = `${nextPline - elementOffset}px`;

          const elementWidth = newSpan.clientWidth;
          const pageWidth = document.querySelector('.pagedjs_area').clientWidth;
          const gridSize = pageWidth/18;
          let randomLeft = Math.floor(Math.random()*(pageWidth-elementWidth)/gridSize)*gridSize+gridSize;
          newSpan.style.marginLeft = `${randomLeft}px`;
          }
        }
      }
  }
}

Paged.registerHandlers(baselineRandomWords);

function startBaseline(element, baseline) {
  // snap element after specific element on the baseline grid.
  //   baseline = 20;

  if (element) {
    const elementOffset = element.offsetTop;
    const elementline = Math.floor(elementOffset / baseline);

    if (elementline != baseline) {
      const nextPline = (elementline + 1) * baseline;

      if (!(nextPline - elementOffset == baseline)) {
        element.style.paddingTop = `${nextPline - elementOffset}px`;
      }
    }
  }
}
