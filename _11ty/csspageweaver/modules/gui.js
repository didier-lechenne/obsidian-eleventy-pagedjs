/**
 * @classdesc A web component that provides a GUI for a Paged.js previewer.
 * Web Component will compose (or import) a HTML template and attach event listener 
 * to allow front-end interactions. 
 * @extends HTMLElement
 * @author Benjamin G. <ecrire@bnjm.eu>, Julie Blanc <contact@julie-blanc.fr>
 * @tutorial https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home
 * Credit: This code is based on an original idea from Julie Blanc 
 */

class CssPageWeaver_GUI extends HTMLElement {

	constructor (){
		super()
		console.log('CSS Page Weaver GUI Component initialized');
	}

	/*-- Dict 		--*/

	extendSharedDict(){
		cssPageWeaver.directory.interface = `${cssPageWeaver.directory.root}/interface`

		// Initialize UI elements
		cssPageWeaver.ui = {}
		cssPageWeaver.ui.body = document.querySelector('body')
		cssPageWeaver.ui.shortcut_index = [] // For user convenience, store all keyboard shortcut

		// Initialize parameters and events
		cssPageWeaver.ui.event = {}

		// Set API
		cssPageWeaver.helpers = {
			addKeydownListener: this.addKeydownListener.bind(this)
		};
	}

	/*-- CSS 		--*/

	/**
	 * Loads a CSS file and appends it to the document head.
	 * @param {string} path - The path to the CSS file.
	 */
	appendCSStoDOM(path) {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = path;
		link.setAttribute('data-css-page-weaver-gui', true)

		document.head.appendChild(link);
	}


	/**
	 * Aggregates the CSS paths from all features that have a stylesheet.
	 * @returns {Array} An array of CSS file paths.
	 */
	getFeaturesStyleAsArray(){
		// Convert the features object to an array
		const featuresArray = Object.values(cssPageWeaver.features);
		// Filter to only features with a hook
		return featuresArray
			.filter(feature => feature.stylesheet)
			.map(feature => `${feature.directory}${feature.stylesheet}`);
	}

	/*-- DOM 		--*/

	/**
	 * Creates a panel for a feature with the specified UI configuration.
	 *
	 * This method constructs a form element for a feature, including a title,
	 * description, toggle switch, and additional HTML content if specified.
	 * It also handles shortcuts for the feature.
	 *
	 * @param {string} id - The ID of the feature.
	 * @param {Object} ui - The UI configuration object for the feature.
	 * @returns {HTMLElement} The created form element representing the feature's panel.
	 */
	createPanel(id, ui){
		function createTitle(){
			if(ui.title){
				// Create a title for this feature
				const title = document.createElement('h1');
				title.textContent = ui.title;

				if(ui.description){
					title.title = ui.description 
				}

				// Compose title container
				titleContainer.appendChild(title);
			}
		}

		function createDescription(){

			if(ui.description){
				// Create a details element for the description
				const details = document.createElement('details');
				const summary = document.createElement('summary');
				summary.textContent = '?'
				const p = document.createElement('p')
				p.textContent = ui.description

				// compose details container
				details.appendChild(summary)
				details.appendChild(p)

				// Append the details container to the title container
				titleContainer.appendChild(details)
			}
		}

		function createToggle(){
			//
			// If feature require a simple ON/OFF toggle, 
			if(ui.toggle){

				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.id = `${id}-toggle`;
				checkbox.name = `${id}-toggle`;

				const label = document.createElement('label');
				label.htmlFor = `${id}-toggle`;
				label.id = `label-${id}-toggle`;

				const seeSpan = document.createElement('span');
				seeSpan.className = 'button-see button-not-selected';
				seeSpan.textContent = 'see';

				const hideSpan = document.createElement('span');
				hideSpan.className = 'button-hide';
				hideSpan.textContent = 'hide';

				label.appendChild(seeSpan);
				label.insertAdjacentHTML('beforeEnd', ' '); // This little hack to preserve harmony with handmade template
				label.appendChild(hideSpan);

				// Append input & label to group-title
				titleContainer.appendChild(checkbox);
				titleContainer.appendChild(label);
				
				form.classList.add('button-toggle')

				// Add toggle to API
				cssPageWeaver.ui[id] = {
					toggleInput: checkbox,
					toggleLabel: label
				}
				cssPageWeaver.ui.event[id] = {
					toggleState: checkbox.checked
				}

			}
		}

		function displayShortcut(){
			if(ui.shortcut){
				
				// Function to convert key array to a human-readable string
				function keysToString(keyArray) {
					const keyMapping = {
						"shiftKey": "Shift",
						"ctrlKey": "Ctrl",
						"altKey": "Alt",
						"metaKey": "Meta"
					};

					// Transform the array to a string like 'Ctrl + Z'
					const humanReadableKeys = keyArray.map(key => keyMapping[key] || key);
					return humanReadableKeys.join(' + ');
				}

				const shortcutList = document.createElement('ul')
				shortcutList.className = "shortcut-list"

				ui.shortcut.forEach(item => {

					// If item disable shortcut display on panel
					if(item.tutorial == false){ 
						return
					}
					
					// Create a list item for the shortcut
					const li = document.createElement('li')
					li.textContent = Array.isArray(item.keys) ? keysToString(item.keys) : item.keys
					li.title = item.description;

					// Append the item to the shortcut list
					shortcutList.appendChild(li)
				})

				// Append Shortcut list to its feature panel
				form.appendChild(shortcutList)
			}
		}

		// Create a form for this feature
		const form = document.createElement('form');
		form.className = `panel-group`;
		form.id = `${id}-form`;

		// Create Title Container for this feature
		const titleContainer = document.createElement('div');
		titleContainer.className = 'panel-group-title';

		createTitle()
		createDescription()
		createToggle()

		// Append title group to form
		form.appendChild(titleContainer);


		// Append additional template to form
		if(ui.html){
			form.insertAdjacentHTML("beforeEnd", ui.html)
		}

		displayShortcut()

		// Return complete feature panel
		return form
	}

	/**
	 * Creates the panel container and subpanels for each feature.
	 *
	 * This method constructs a panel container and populates it with subpanels
	 * for features that have a UI. It also lists features without a UI in a
	 * separate section.
	 */
	createMainPanel() {
		// Create Panel container
		const formContainer = document.createElement('div');
		formContainer.id = 'cssPageWeaver_panel';

		// Create base input to toggle Menu
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = 'cssPageWeaver_toggle-panel';
		checkbox.name = 'toggle-panel';
		checkbox.checked = this.isPanelOpen()

		const label = document.createElement('label');
		label.htmlFor = 'cssPageWeaver_toggle-panel';

		const openSpan = document.createElement('span');
		openSpan.id = 'panel-open';
		openSpan.textContent = '−';

		const closedSpan = document.createElement('span');
		closedSpan.id = 'panel-closed';
		closedSpan.textContent = '≡';

		label.appendChild(openSpan);
		label.appendChild(closedSpan);

		this.appendChild(checkbox);
		this.appendChild(label);

		// Convert the features object to an array
		const featuresArray = Object.values(cssPageWeaver.features);

		// Lets filter to only features with control panel
		const featuresWithPanels = featuresArray.filter(feature => feature.ui && feature.ui.panel !== null && feature.ui.panel !== undefined);		

		// Append the panels to the panel container
		featuresWithPanels.forEach(feature => {
				formContainer.insertAdjacentElement('beforeEnd', feature.ui.panel);
		});

		// Create Hidden Feature Panel
		this.createHiddenFeaturePanel(featuresArray, formContainer)

		// Append panel container to main element
		this.appendChild(formContainer);

	}

	createHiddenFeaturePanel(featuresArray, formContainer){
		// Create a list of active Hook or script without UI
		const featuresWithoutPanels = featuresArray.filter(feature => !feature.ui);

		// List these elements on the interface if there are any
		if(featuresWithoutPanels.length > 0){
			const details = document.createElement('details');
			details.id = "hidden-features"

			// Create Summary with title
			const summary = document.createElement('summary');
			const title = document.createElement('h1');
			title.textContent = "Also active";
			const span = document.createElement('span');
			span.textContent = `${featuresWithoutPanels.length} plugin${featuresWithoutPanels.length > 1 ? 's' : ''}`
			
			// Append Title to summary
			summary.appendChild(title)
			summary.appendChild(span)

			// Create list
			const ul = document.createElement('ul');

			// Create a list of features without panels
			featuresWithoutPanels.forEach(feature => {
				const li = document.createElement('li');
				li.textContent = feature.id;
				ul.appendChild(li);
			});

			// Append elements to details container
			details.appendChild(summary)
			details.appendChild(ul)
			
			// Append unlisted features container to main container
			formContainer.insertAdjacentElement('beforeEnd', details);

		}
	}

	/*-- Features --*/

	/** 
	 */
	loopFeatures_attachPanel() {
		Object.values(cssPageWeaver.features).forEach(feature => {
			if(feature.ui){
				// Create a UI panel for the feature
				feature.ui.panel = this.createPanel(feature.id, feature.ui);
			}
		})
	}


	/*-- Script --*/


	/**
	 * Registers all script features
	 *
	 * @param {Object} data - Dataset to loop for registration.
	 * @returns {Promise<void>} - A promise that resolves when all features of the specified type are registered.
	 */
	async runAllScript(data){

		async function runScript(scriptPromise, parameters){

			// Await the script promise to get the script
			const script = await scriptPromise;

			// If the script or its default export is not available, exit the function
			if(!script || !script.default){
				return
			}

			new script.default(parameters)
		}

		if (Array.isArray(data)) {
			// If data is an array, iterate over each item directly
			for (const item of data) {
				await runScript(item);
			}
		} else {
			// If data is an object,
			for (const key in data) {
				if (data.hasOwnProperty(key) && data[key].script) {
					await runScript(data[key].script, data[key].id);
				}
			}
		}

	}


	/*-- Events 	--*/

	/**
	 * Connects the custom element to the DOM.
	 */
	async connectedCallback () {
		this.addEventListener('click', this);
		this.addEventListener('input', this);

        document.addEventListener('cssPageWeaver-dictInit', this.setup.bind(this));

	}

	/**
	 * Handles events for this Web Component.
	 * @param {Event} event - The event object.
	 */
	handleEvent (event) {
		let featureId = this.findParentID(event)
		this[`on${event.type}`](event, featureId);
	}

	/**
	 * Find subpanel ID targeted by event
	 * @param {event} - the event object
	 */
	findParentID(event){
		let parent = event.target.parentNode;
		while (parent) {
			if (parent.id && parent.id.includes('-form')) {
				const id = parent.id.split('-form')[0];
				return id
				break;
			}
			parent = parent.parentNode;
		}
	}


	/**
	 * Handles the click event for a feature.
	 *
	 * @param {Event} event - The click event object.
	 * @param {string} featureId - The ID of the feature being clicked.
	 */
	onclick (event, featureId) {
		this.togglePanel(event)
	}

	/**
	 * Handles the input event for a feature.
	 *
	 * @param {Event} event - The input event object.
	 * @param {string} featureId - The ID of the feature being interacted with.
	 */
	oninput (event, featureId) {
		// If the input event is for a toggle element
		if(cssPageWeaver.ui.event && event.target.id == `${featureId}-toggle` ){
			cssPageWeaver.ui.event[featureId].toggleState = event.target.checked
		}
	}

	/**
	 * Toggles the state of a panel based on the event target.
	 * @param {Event} event - The event object that triggered the toggle action.
	 */
	togglePanel(event){
		// Handle Toogle 
		if(event.target.id == "cssPageWeaver_toggle-panel"){
			let isOpen = this.isPanelOpen()
			localStorage.setItem('gui_toggle' + cssPageWeaver.docTitle, !isOpen)
		}
	}

	/**
	 * Checks whether the panel is open or not.
	 * @returns {boolean} - Whether the panel is open or not.
	 */
	isPanelOpen(){
		return localStorage.getItem('gui_toggle' + cssPageWeaver.docTitle) == 'true' || false
	}

	/*-- Helpers  		--*/

	/** 
	 * This function associate a keydown event to a function
	 * Important: scope is document wide, when above events are component specific 
	 * @param {array} keyArray - Keyboard keys combinaison to listen to
	 * @param {function} callback - Function to call when right selection is pressed
	 */
	addKeydownListener(keyArray, callback) {
		document.addEventListener('keydown', (event) => {
			const isKeyPressed = keyArray.every(key => {
				if (key === 'shiftKey') return event.shiftKey;
				if (key === 'ctrlKey') return event.ctrlKey;
				if (key === 'altKey') return event.altKey;
				if (key === 'metaKey') return event.metaKey;
				return event.key === key;
			});

			if (isKeyPressed) {
				callback();
			}
		});

		// Store shortcut information for convenience
		cssPageWeaver.ui.shortcut_index.push(`${keyArray.join(" + ")} is set for ${callback.name}`)
	}


	/*-- Setup component --*/
	setup (){

		this.extendSharedDict()

		// Load basic CSS assets
		this.appendCSStoDOM(`${cssPageWeaver.directory.interface}/css/panel.css`);

		// Load features CSS
		cssPageWeaver.stylesheet.features.forEach(path => this.appendCSStoDOM(path))
	
		// Create and populate main Panel
		this.loopFeatures_attachPanel()
		this.createMainPanel()

		// Register plugins scripts in a PagedJs after render event
		this.runAllScript(cssPageWeaver.features)
	
	}
}


export default CssPageWeaver_GUI