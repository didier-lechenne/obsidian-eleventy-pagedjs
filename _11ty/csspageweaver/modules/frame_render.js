/**
 * @classdsec Render paged through a shadow element and return desired pages
 * @author Benjamin G. <ecrire@bnjm.eu>
 * @tutorial https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home
 * Credit: This code is based on an original idea from Julien Taquet 
 */

import { Handler, Previewer } from '../lib/paged.esm.js';
import CssPageWeaver_PreRender from './pre_render.js';

// Define a custom web component
class CssPageWeaver_FrameRender extends HTMLElement {
	constructor() {
		super()

		// Attach a shadow root to the element
		this.attachShadow({ mode: 'open' });

		this.range = {
			from: 0,
			to: Infinity
		}

		this.container = {
			origin: {
				body: document.body,
				head: document.head
			},
			pages: null
		}

		this.hook = []
		this.css = []

		console.log('CSS Page Weaver Frame Render initialized');

	}

	/*-- CSS 		--*/

	hideFrame(){
		this.setAttribute("style", "position: absolute; left: 100vw; max-height: 0;  width: 100vw;  overflow: hidden;")
	}

	/**
	 * Copies the dimensions from the document body and applies them to the container inside the shadow DOM.
	 * This method ensures that the shadow DOM container matches the size and position of the document body.
	 */
	copyDimensionsFromBody() {
		// Get the offsetHeight and client rect of the body.
		const offsetHeight = this.container.origin.body.offsetHeight;
		const clientRect = this.container.origin.body.getBoundingClientRect();

		// Set the dimensions on the container inside the shadow DOM.
		this.container.shadow.body.style.width = `${clientRect.width}px`;
		this.container.shadow.body.style.height = `${clientRect.height}px`;
		this.container.shadow.body.style.top = `${clientRect.top}px`;
		this.container.shadow.body.style.left = `${clientRect.left}px`;

		// Optionally, log the dimensions for debugging.
		console.log('Body Dimensions:', { offsetHeight, clientRect });
		console.log('Container Dimensions:', {
		  height: this.container.shadow.body.style.height,
		  width: this.container.shadow.body.style.width
		})
	}

	/*-- DOM 		--*/
	
	/**
	 * Resets the shadow root by clearing its existing content and creating a new HTML structure.
	 * This method ensures that the shadow root is empty and ready for new content.
	 */
	resetShadowRoot() {
		// Clear existing content in the shadow root
		while (this.shadowRoot.firstChild) {
			this.shadowRoot.removeChild(this.shadowRoot.firstChild);
		}

		// Create new HTML structure
		const head = document.createElement('head');
		const body = document.createElement('body');

		// Append head and body to the shadow root
		this.shadowRoot.appendChild(head);
		this.shadowRoot.appendChild(body);

	   this.container.shadow = { head, body };
	}

	/**
	 * Passes elements to the light DOM, handling both individual elements and arrays of elements.
	 *
	 * @param {Element|Element[]} element - The element or array of elements to pass to the light DOM.
	 * @returns {void}
	 */
	passElementsToLightDom(element) {

		// Array means a slection of pages had been made

		if (Array.isArray(element)) {


			element.forEach(page => {
				if (page.getAttribute('data-page-number')) {
					let page_clone = page.cloneNode(true)
					let page_number = parseInt(page.getAttribute('data-page-number'));
					let page_ref = this.container.origin.body.querySelector(`[data-page-number="${page_number}"]`);

					page_ref?.remove();

					let previous = this.container.origin.pages.querySelector(`[data-page-number="${page_number - 1}"]`)
					previous.insertAdjacentElement('afterend', page_clone);

					// TODO Check if there are pages to remove

				}
			});

		} else {
			if (element.classList.contains('pagedjs_pages')) {
				this.container.origin.body.querySelector('.pagedjs_pages')?.remove();
				this.container.origin.body.appendChild(element);
			} else {
				let el_UI = parseInt(element.getAttribute('data-unique-identifier'));
				let elementOriginal = this.container.origin.body.querySelector(`[data-unique-identifier="${el_UI}"]`);

				elementOriginal?.replaceWith(element);

				// TODO Need to check if break token is still coherent.
			}
		}

		// Update pages container
		this.container.origin.pages = this.container.origin.body.querySelector('.pagedjs_pages')
	}

	/**
	 * Generates a unique CSS selector for a given HTML element.
	 * This method attempts to create a selector that uniquely identifies the element
	 * based on its attributes and position in the DOM hierarchy.
	 *
	 * @param {HTMLElement} element - The HTML element for which to generate a unique selector.
	 * @returns {string} - A CSS selector string that uniquely identifies the element.
	 */
	getUniqueSelector(element) {

		if(element.tagName == 'BODY'){
			return 'body'
		}

		if (element.getAttribute('data-unique-identifier')) {
			// If the element has data-unique-identifier, use it
			return `[data-unique-identidier='${element.getAttribute('data-unique-identifier')}]`;
		}

		if (element.id) {
			// If the element has an ID, use it
			return `#${element.id}`;
		}

		if (element.className && element.className.trim() !== '') {
			// If the element has a class, use it
			// Note: This might not be unique if other elements share the same class
			return `.${element.className.split(' ').join('.')}`;
		}

		// Fallback to using the tag name and its position in the hierarchy
		let selector = element.tagName.toLowerCase();
		let parent = element.parentElement;

		return selector;
	}

	/* Import & reload */

	/**
	 * Fetches a document from the specified path.
	 *
	 * @param {string} path - The URL or path to the document to be fetched.
	 * @returns {Promise<Document|Object>} - A promise that resolves to the fetched HTML document or JSON object.
	 * @throws {Error} - Throws an error if the network response is not ok or if there is a problem with the fetch operation.
	 */
	async fetchDocument(path) {
		try {
			const response = await fetch(path);

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			if (path.endsWith('.html') || path.endsWith('/')) {
				const text = await response.text();
				const parser = new DOMParser();

				// Parse the HTML content into a Document object
				const html = parser.parseFromString(text, "text/html");

			    // Get all script elements
			    //const scripts = html.querySelectorAll('script');

			    // Remove each script element
			    //scripts.forEach(script => script.remove());

				return html;
			} else if (path.endsWith('.json')) {
				// Parse the JSON response
				return await response.json();
			}

		} catch (error) {
			console.error('There was a problem with the fetch operation:', error);
			throw error; // Rethrow the error to handle it outside if needed
		}
	}

	/**
	 * Reloads a document from the specified path and updates the instance content.
	 *
	 * @param {string} path - The URL or path to the document to be reloaded.
	 * @returns {Promise<void>} - A promise that resolves when the document is reloaded and the content is updated.
	 */
	async reloadDocument(path) {
		let newDoc = await this.fetchDocument(path);
		
		let selector = this.getUniqueSelector(this.container.origin.body);

		let newContainer = await newDoc.querySelector(selector);

		this._render.setUniqueIdentfier(newContainer);

		// DEBUG
		const elements = newContainer.querySelectorAll('p');
		elements.forEach(el => {
		    el.textContent = el.textContent.replaceAll('e', '🙈');
		});	

		// Set instance content with new content
		this.content = this._render.storeElements(newContainer, true);

		// Show me!
		this.setView(false);
	}

	/* Paged JS */
 
	/**
	 * Determines which elements or pages within a document should be passed to the light DOM.
	 * Handles different scenarios for selecting elements or pages to pass, including specific
	 * elements, all pages, or a range of pages.
	 */
	defineElementsToPass() {

		let toPass;

		// Detect if we keep a page or an element
		if (this.range.element) {
			// Get element to pass
			toPass = this.container.pages.querySelector(`[data-unique-identifier="${this.range.element}"]`);
			// Append element to light DOM

			// Finally, delete the element property from the range
			delete this.range.element;
			console.log(`🔃 Update page ${this.range.to}`)

		} else if (this.range.from === 0 && this.range.to === Infinity) {
			// Just clone pagedjs_pages container
			toPass = this.container.pages.cloneNode(true);

			if(!this.firstTime){
				console.log(`🔃 Update full document `)
			}

		} else {
			// Array of pages to pass
			toPass = [];

			// Select all pages with the data-page-number attribute within the clone
			const pages = this.container.pages.querySelectorAll('[data-page-number]');

			// Iterate through the pages and remove those outside the range
			pages.forEach(page => {
				const pageNumber = parseInt(page.getAttribute('data-page-number'));
				if (pageNumber >= this.range.from && pageNumber <= this.range.to) {
					toPass.push(page.cloneNode(true));
				}
			});

			console.log(`🔃 Update ${toPass.length} page${toPass.length > 1 ? 's' : ''}, from page ${this.range.from}`)
		}

		this.passElementsToLightDom(toPass);
	}
	/**
	 * Pagedjs library append style on document head.
	 * Here we edit this very fucntion to append styles on head's shadow container
	 * Without this, page break is erratic. Pages are missing.
	 */
	redefineInsertFunction(){
		const polisherInstance = this.previewer.polisher;

		// Define the new insert function
		polisherInstance.insert = function(text) {
			let style = document.createElement("style");
			style.setAttribute("data-css-page-weaver-inserted-styles", "true");
			style.appendChild(document.createTextNode(text));
			cssPageWeaver_frame.container.shadow.head.appendChild(style);
			this.inserted.push(style);
		};
	}

	/**
	 * Appends Paged.js styles to the shadow DOM.
	 * This method creates a custom handler that clones styles from the document's head
	 * to the shadow DOM's head before the content is parsed.
	 * Without this, page break is erratic. Pages are missing.
	 */
	appendPagedJsStyle(){

		class appendPagedStyleToShadow extends Handler {
			constructor(chunker, polisher, caller) {
				super(chunker, polisher, caller);
			}

			beforeParsed(content){
				cssPageWeaver_frame._render.cloneElements('style[data-css-page-weaver-inserted-styles="true"]', cssPageWeaver_frame.container.shadow.head, document.head)

			}
		}
		this.hook.push({default: appendPagedStyleToShadow})

	}

	/* 	Setup	 */

	connectedCallback() {
		// Hide the entire frame
		this.hideFrame();

		// Initialize a new instance of CssPageWeaver_PreRender
		this._render = new CssPageWeaver_PreRender();

		// Append a style link to the document's head using the interface
		if (typeof this.interface === 'string' && this.interface.length > 0) {
			this._render.appendStyleLink(this.interface, this.container.origin.head);
		}

		// Store elements from the renderer's container origin into this.content
		this.content = this._render.storeElements(this._render.container.origin, false);

		// Set a unique identifier for the stored content
		this._render.setUniqueIdentfier(this.content);

		// Copy styles appended by Paged.js to the document's head into the shadow DOM's head
		this.appendPagedJsStyle();

		// Set up the view for rendering
		this.setView(true);
	}

	async setView(firstTime) {
		// Initialize a new instance of Previewer
		this.previewer = new Previewer();

		// TODO: This should register hook on fresh instance. It dont and duplicate hook. So I set a trick here. 
		if(firstTime){
			// Register all hooks with the renderer
			await this._render.registerAllHook(this.hook, this.previewer);
		}

		// Modify the Paged.js polisher insert function to append styles to the shadow DOM
		this.redefineInsertFunction();

		// Clear the shadow root
		this.resetShadowRoot();

		// Append style links to both the document's head and the shadow DOM's head if interface is a non-empty string
		if (typeof this.interface === 'string' && this.interface.length > 0) {
			this._render.appendStyleLink(this.interface, this.container.origin.head);
			this._render.appendStyleLink(this.interface, this.container.shadow.head);
		}

		try {
			// Preview the content and log the number of rendered pages
			const pages = await this.previewer.preview(
				this.content,
				this.css,
				this.container.shadow.body
			);

			this.container.pages = this.shadowRoot.querySelector('.pagedjs_pages');
			console.log('✅ Rendered', pages.total, 'pages');
		} catch (error) {
			// Handle any errors that occur during the preview operation
			console.error('Error during pagination:', error);
		}

		// Update stylesheet by removing and cloning elements with inserted styles
		let styles = 'style[data-css-page-weaver-inserted-styles="true"]';
		this._render.removeElements(styles, this.container.origin.head);
		this._render.cloneElements(styles, this.container.shadow.head, this.container.origin.head);

		// Define elements to pass
		this.defineElementsToPass();
	}

}

export default CssPageWeaver_FrameRender

