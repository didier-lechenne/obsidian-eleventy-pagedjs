
function inlinizeNotes(content, selector, parentSelector = '#list-footnote'){
	let notesCall = content.querySelectorAll(selector);

	for(let i = 0; i < notesCall.length; ++i){
			let noteCall = notesCall[i];
			let idNote = noteCall.href.split("#").pop();
			
			let span = document.createElement("span");
			span.className = 'pagedjs_note';
			span.id = 'span-' + idNote;
			noteCall.className = "pagedjs_callnote";
			noteCall.parentNode.insertBefore(span, noteCall);
			// noteCall.innerHTML = '';
			noteCall.innerHTML = i + 1; // ← delete later (write callNote)
			
			let noteMarker = content.querySelector(`#${idNote}`);
			if (noteMarker) {
				// let noteContent = noteMarker.parentNode.innerHTML;
				let num = i + 1;
				let noteContent = '<span class="temp-marker">' + num + '</span>' + noteMarker.parentNode.innerHTML; // ← delete later (write Marker)
				span.innerHTML = noteContent;

				let noteMarkerSpan = content.getElementById(idNote);
				content.getElementById(idNote).parentNode.removeChild(noteMarkerSpan);
			}
	}
	let listNote = content.querySelector(parentSelector);
	listNote.parentNode.removeChild(listNote);
}

class MoveNotesToInlinePosition extends Paged.Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	beforeParsed(content) {
		inlinizeNotes(content, '.afnanch')
	}
}
Paged.registerHandlers(MoveNotesToInlinePosition);