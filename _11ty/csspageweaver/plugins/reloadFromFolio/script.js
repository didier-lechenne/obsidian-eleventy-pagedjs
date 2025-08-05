/**
 * @name Reload From Folio
 * @author Benjamin G. <ecrire@bnjm.eu>
 * @see { @link https://gitlab.com/csspageweaver/plugins/reloadfromfolio/ }
 */

import { Previewer } from '/csspageweaver/lib/paged.esm.js';

export default function reloadFromFolio(){

	// Shortcut from CSS Page Weaver data
	let parameters = cssPageWeaver.features.reloadFromFolio.parameters
	let singlePage

	const docTitle = cssPageWeaver.docTitle
	let ui = cssPageWeaver.features.reloadFromFolio.ui

	let mouseX = 0;
	let mouseY = 0;

	// /*  Localstorage   */
	
	// // Retrieve the stored date from localStorage
	// const storedDate = localStorageAPI("getItem", "lastUpdatedDate")
	// const todayDate = getTodayDate();

	// // Retrieve local storage data
	// if (storedDate === todayDate) {
	// 	// If the stored date is today, update values from localStorage
	// 	const storageFolio = localStorageAPI("getItem", "fromFolio");
	// 	if (storageFolio !== null) {
	// 		cssPageWeaver_frame.range = storageFolio;
	// 	}

	// 	const storageSingle = localStorageAPI("getItem", "singlePage");
	// 	if (storageSingle !== null) {
	// 		singlePage = storageSingle;
	// 	}
	// } else {
	// 	// Update localStorage with current parameter values and today's date
	// 	localStorageAPI("setItem", "fromFolio", cssPageWeaver_frame.range.from);
	// 	localStorageAPI("setItem", "singlePage", parameters.singlePage);
	// }

	// // Update
	// localStorageAPI("setItem", "lastUpdatedDate", todayDate);

	/*  UI   */
	
	// Shortcut for GUI Panel - CORRECTION: utiliser document.querySelector au lieu de cssPageWeaver.querySelector
	ui.onlySelector = document.querySelector(`#toggle-reloadFromFolio-isOnly`)
	ui.folioSelector = document.querySelector(`#folio-reloadFromFolio`)
	ui.triggerSelector = document.querySelector(`#trigger-reloadFromFolio`)

	// Update ui | folio input
	if (ui.folioSelector) {
		ui.folioSelector.value = cssPageWeaver_frame?.range.from || undefined
	}
	
	// Update ui single page input
	if (ui.onlySelector) {
		ui.onlySelector.checked = singlePage
	}

	/*   Function     */

	// Function to get today's date in YYYY-MM-DD format
	function getTodayDate() {
		const today = new Date();
		return today.toISOString().split('T')[0];
	}

	/**
	 * Snippet to interact with localstorage
	 * 
	 * {string} action - Action to perform on localstorage
	 * {string} property - Properties to set
	 * {boolean|number} - If action is setIem, here is the value to set 
	 * @returns {boolean|number} - If action is getItem, here comes the value
	 */
	function localStorageAPI(action, property, value) {
		const key = `reloadFromFolio-${docTitle}-${property}`;
		if (action == "setItem") {
			localStorage.setItem(key, value);
		} else if (action == "getItem") {
			return localStorage.getItem(key);
		}
	}

    /**
	 * Finds the closest `.pagedjs_page` element under the cursor.
	 *
	 * @returns {number} The page number of the closest `.pagedjs_page` element, or 1 if none is found.
	 */    
    function findClosestPage() {
        // Get the element directly under the cursor using the current mouse position
        let element = document.elementFromPoint(mouseX, mouseY);

        // Traverse up the DOM tree to find the closest .pagedjs_page element
        while (element) {
            if (element.classList.contains('pagedjs_page')) {
                // Get the data-page-number attribute
                const pageNumber = parseInt(element.getAttribute('data-page-number'))
                return pageNumber;
            }
            element = element.parentElement;
        }

        // If no .pagedjs_page element is found
        console.log('No .pagedjs_page element found under the cursor.');
        return undefined;
    }
         
	function reload(findFolio = true){

		if(findFolio){
			// find clouses page under cursor
			let folio = findClosestPage()

			// Set folio if valid
			if(folio){
				cssPageWeaver_frame.range.from = folio
			}
		}

		// Loop through cssPageWeaver.features
		for (const featureKey in cssPageWeaver.features) {
		    if (cssPageWeaver.features.hasOwnProperty(featureKey)) {
		        const feature = cssPageWeaver.features[featureKey];
				// remove hooks based on the exclude list
		        if (parameters.excludeHookFromReload.includes(feature.id)) {
		            delete feature.hook;
		        }
				// remove script based on the exclude list
		        if (parameters.excludeScriptFromReload.includes(feature.id)) {
		            delete feature.script;
		        }
		    }
		}

		//
		if(cssPageWeaver.features.reloadInPlace){
			cssPageWeaver.features.reloadInPlace.parameters.cssPageWeaverEnd = false
		} 


		// If just One page		
		cssPageWeaver_frame.range.to = singlePage ? cssPageWeaver_frame.range.from : Infinity 

		cssPageWeaver_frame.css.push('/css/style-2.css')
		
		cssPageWeaver_frame.reloadDocument(window.location.pathname)
	}

	/*       Event      */

	// Add keydown listener based on configuration 
	if (ui.shortcut && Array.isArray(ui.shortcut)) {
		ui.shortcut.forEach( shortcut => {
			// if user do not have disable plugin 
			if(shortcut.active){
				// Get shortcut combinaison from config
				const keys = shortcut.keys
				// CSS Page Weaver has a simple function to help you register your keyboard shortcut
				cssPageWeaver.helpers.addKeydownListener(keys, reload)
			}
		})
	}

	/* Trigger event  */
	if (ui.triggerSelector) {
		ui.triggerSelector.addEventListener('click', function() {
			reload(false)
		});
	}

	// Global mousemove event listener to track mouse position
	document.addEventListener('mousemove', function(event) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	});

	/* Toggle event  */
	if (ui.onlySelector) {
		ui.onlySelector.addEventListener('change', function() {
			singlePage = this.checked
			console.log(singlePage)
			localStorageAPI("setItem", "singlePage", this.checked)
		});
	}

	if (ui.folioSelector) {
		ui.folioSelector.addEventListener("input", function() {
			cssPageWeaver_frame.range.from = parseInt(this.value)
			localStorageAPI("setItem", "fromFolio", this.value)
		});
	}

}