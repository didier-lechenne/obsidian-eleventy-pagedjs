const NOTE_CLASS = 'pagedjs_note';


/* createNoteElement _______________________________________________________________
____________________________________________________________________________________*/
function createNoteElements(elem){
    let notes = document.getElementsByClassName(elem); 
  
    for(let i = 0; i < notes.length; i++) {
      let note = notes[i];
      note.classList.add("pagedjs_note");
			note.style.position = "absolute";
			
			let callNote = document.createElement("span");
			callNote.className = 'pagedjs_callnote';
			note.parentNode.insertBefore(callNote, note);
    }
}


function addCSS(css){
	var head = document.getElementsByTagName('head')[0];
	var s = document.createElement('style');
	s.setAttribute('type', 'text/css');
	if (s.styleSheet) {   // IE
			s.styleSheet.cssText = css;
	} else {// the world
			s.appendChild(document.createTextNode(css));
	}
	head.appendChild(s);
}


/* addStyleNotesArea _______________________________________________________________
____________________________________________________________________________________*/

function addStyleNotesArea({width, positionLeft, positionRight}){
	const common = `width: ${width}px;
	clear: both; 
	shape-outside: content-box;`;
	const positionLeftParsed = positionLeft.split(' ')
	.map(pos => {
		if (pos === 'outside') {
			return 'left'
		} else if (pos === 'inside') {
			return 'right'
		} else return pos;
	});
	console.log("positionLeftParsed = " + positionLeftParsed);
	const positionRightParsed = positionRight.split(' ')
	.map(pos => {
		if (pos === 'outside') {
			return 'right'
		} else if (pos === 'inside') {
			return 'left'
		} else return pos;
	});
	console.log("positionRightParsed = " + positionRightParsed);

	let floatLeft;
	if(positionLeftParsed[0] == 'right' || positionLeftParsed[1] && positionLeftParsed[1] == 'right'){
		floatLeft = 'right';
	}else{
		floatLeft = 'left';
	}
	let floatRight;
	if(positionRightParsed[0] == 'right' || positionRightParsed[1] && positionRightParsed[1] == 'right'){
		floatRight = 'right';
	}else{
		floatRight = 'left';
	}

	const css = `
	.pagedjs_left_page .pagedjs_notes-area {
		${common}
		float: ${floatLeft};
	}
	.pagedjs_right_page .pagedjs_notes-area {
		${common}
		float: ${floatRight};
	}
	`
	addCSS(css);
	console.log(css);
}
class NotesFloat extends Paged.Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.notesId = [];
		this.notesHeight = 0; 
		this.marginBottomPrev = 0;
		this.pagesNotesOverflow = [];
		this.notesConfig = {
			positionLeft: 'top right',
			positionRight: 'bottom right',
			width: 150
		}
	}


	beforeParsed(content) {
		Array.prototype.forEach.call(
			content.querySelectorAll(`.${NOTE_CLASS}`), 
			elem => {
				elem.style.position = 'absolute';
			}
		)
		addStyleNotesArea(this.notesConfig);
	}



	afterParsed(parsed) {
		// add data-note: footnote
		Array.prototype.forEach.call(
			parsed.querySelectorAll(`.pagedjs_note`), 
			elem => {
				elem.setAttribute("data-note", "float-note");
				this.processFootnoteContainer(elem); // from paged.js footnote code
			}
		)
	}


	processFootnoteContainer(node) {
		// Find the container
		let element = node.parentElement;
		let prevElement;
		// Walk up the dom until we find a container element
		while (element) {
			if (isContainer(element)) {
				// Add flag to the previous non-container element that will render with children
				prevElement.setAttribute("data-has-notes", "true");
				break;
			}

			prevElement = element;
			element = element.parentElement;

			// If no containers were found and there are no further parents flag the last element
			if (!element) {
				prevElement.setAttribute("data-has-notes", "true");
			}
		}
	}

	renderNode(node) {
		if (node.nodeType == 1) {
			// Get all notes
			let notes;

			// Ingnore html element nodes, like mathml
			if (!node.dataset) {
				return;
			}

			if (node.dataset.note === "float-note") {
				notes = [node];
			} else if (node.dataset.hasNotes) {
				notes = node.querySelectorAll("[data-note='float-note']");
			}

			if (notes && notes.length) {
				this.findVisibleFootnotes(notes, node); // from paged.js footnote code
			}
		}
	}

	findVisibleFootnotes(notes, node) {
		let area, size, right;
		area = node.closest(".pagedjs_page_content");
		size = area.getBoundingClientRect();
		right = size.left + size.width;

		for (let i = 0; i < notes.length; ++i) {
			let currentNote = notes[i];
			let bounds = currentNote.getBoundingClientRect();
			let left = bounds.left;

			if (left < right) {
				// Add call for the note
				this.moveNote(currentNote, node.closest(".pagedjs_area"), true);
			}
		}
	}

	moveNote(node, pageArea, needsNoteCall) {
		const parent = pageArea.querySelectorAll('.pagedjs_page_content')[0];
		let notesArea = document.createElement('div');
		notesArea.className = 'pagedjs_notes-area';
		let marginTopFirst;
		// if page content has no notes area then create it
		if (parent.querySelector('.pagedjs_notes-area') === null) {
			parent.insertBefore(notesArea, parent.children[0]);
			notesArea.style.width = this.notesConfig.width;
			let notesContentArea = document.createElement('div');
			notesContentArea.className = 'pagedjs_notes-area_content';
			notesArea.appendChild(notesContentArea);
			// get margin-top of first note
			marginTopFirst = window.getComputedStyle(node, null).getPropertyValue("margin-top");
			
		} else {
			notesArea = parent.querySelector('.pagedjs_notes-area');
		}


		if (!isElement(node)) {
			return;
		}

		// store the data-id of the note in a set	
		let noteId = node.dataset.id;			
		if(!this.notesId.includes(noteId)){
			this.notesId.push(noteId);
		}

		// to check if it has already added to a previous note-area
		if(!document.querySelectorAll('.pagedjs_notes-area [data-id="' + noteId + '"]').length >= 1){

			// Check if note already exists for overflow
			let existing =  notesArea.querySelector(`[data-ref="${node.dataset.ref}"]`);
			if (existing) {
				// Remove the note from the flow but no need to render it again
				node.remove();
				return;
			}

			// Add the note node
			let noteContainer = parent.querySelector('.pagedjs_notes-area_content');
			noteContainer.appendChild(node);
			// change the positionning of the note
			node.style.position = 'relative';
			node.style.display = 'block';
			// find if we are on the left or right page
			const page = node.closest('.pagedjs_page');
			const isLeft = page.className.includes('pagedjs_left_page');
			// find if this page has position bottom
			const pageConf = isLeft ? this.notesConfig['positionLeft'] : this.notesConfig['positionRight'];
			
			// if so displace the height of the element
	
			// get margin of note
			this.marginBottomPrev = window.getComputedStyle(node).marginBottom;
			let marginTop = window.getComputedStyle(node).marginTop;
			let marginNote; 
			if(this.marginBottomPrev > marginTop){
				marginNote = this.marginBottomPrev;
			}else {
				marginNote = marginTop;
			}
			//  get the height of page note area 
			this.notesHeight = this.notesHeight + parseInt(node.offsetHeight, 10) + parseInt(marginNote, 10); 
			let noteAreaHeight = this.notesHeight;

			// get the height of page content area
			let pageContentArea = parent.offsetHeight;

			// if note area overflow
			if(noteAreaHeight >= pageContentArea){
				let numPage =  node.closest('.pagedjs_page').getAttribute('data-page-number');
				console.log(noteId + " overflow on page " + numPage);
				if(!this.pagesNotesOverflow.includes(numPage)){
					this.pagesNotesOverflow.push(numPage);
				}
				console.log(this.pagesNotesOverflow);
			}

			if (pageConf.includes('bottom')) {
				notesArea.style.marginTop = pageContentArea - noteAreaHeight - 1 + 'px'; // subtract 1px to avoid overflow 
				notesArea.style.top = "1px";
			}

		}else{
			// remove the note if already exist in a previous note area
			node.remove();
		}

	}
	


	afterPageLayout(pages) {
		// reset page area values
		this.notesHeight = 0;	
		this.marginBottomPrev = 0;
	}

	afterRendered(pages){
		let pagesText = this.pagesNotesOverflow[0];
		console.log(pagesText);
		for (let i = 1; i < this.pagesNotesOverflow.length; i++) {
			pagesText = pagesText + ', ' + this.pagesNotesOverflow[i]; 
		}
		alert('Note(s) overflows on pages ' + pagesText);
	}
}
Paged.registerHandlers(NotesFloat);





/* PAGED.JS / import { isContainer, isElement } from "../../utils/dom"; */

function isContainer(node) {
	let container;

	if (typeof node.tagName === "undefined") {
		return true;
	}

	if (node.style && node.style.display === "none") {
		return false;
	}

	switch (node.tagName) {
		// Inline
		case "A":
		case "ABBR":
		case "ACRONYM":
		case "B":
		case "BDO":
		case "BIG":
		case "BR":
		case "BUTTON":
		case "CITE":
		case "CODE":
		case "DFN":
		case "EM":
		case "I":
		case "IMG":
		case "INPUT":
		case "KBD":
		case "LABEL":
		case "MAP":
		case "OBJECT":
		case "Q":
		case "SAMP":
		case "SCRIPT":
		case "SELECT":
		case "SMALL":
		case "SPAN":
		case "STRONG":
		case "SUB":
		case "SUP":
		case "TEXTAREA":
		case "TIME":
		case "TT":
		case "VAR":
		case "P":
		case "H1":
		case "H2":
		case "H3":
		case "H4":
		case "H5":
		case "H6":
		case "FIGCAPTION":
		case "BLOCKQUOTE":
		case "PRE":
		case "LI":
		case "TR":
		case "DT":
		case "DD":
		case "VIDEO":
		case "CANVAS":
			container = false;
			break;
		default:
			container = true;
	}

	return container;
}

function isElement(node) {
	return node && node.nodeType === 1;
}