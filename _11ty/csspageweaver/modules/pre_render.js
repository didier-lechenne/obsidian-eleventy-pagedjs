/**
 * @classdesc This are methods shared between render.js and frame_render.js
 * @author Benjamin G. <ecrire@bnjm.eu>, Julie Blanc <contact@julie-blanc.fr>
 * @tutorial https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home
 */

import { Handler } from '../lib/paged.esm.js';

class CssPageWeaver_PreRender{
	constructor(){
		// Object of container shortcut
		this.container = {
			origin: document.body
		}
	}


	/*-- CSS 		--*/
    
    /**
	 * Append CSS Style as link
	 * @param {string} path 		CSS rules to append
	 * @param {string} destination 	destination elementto append style element
	 * @param {string} name 		name to append as a data-attribute
	 */	
   	appendStyleLink(path, destination, name) {

   		if(!path){
   			return
   		}

		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = path;
		link.media = 'screen';
		link.setAttribute(name ? name : 'data-csspageweaver-frame', true)

		destination.appendChild(link);
	}

	/**
	 * Append CSS Style as style element
	 * @param {string} style 		CSS rules to append
	 * @param {string} destination 	destination elementto append style element
	 * @param {string} name 		name to append as a data-attribute
	 */
   	appendStyleElement(style, destination, name) {
	    const styleElement = document.createElement('style');
	    styleElement.textContent = style;
		styleElement.setAttribute(name ? name : 'data-csspageweaver-frame', true)
	    destination.appendChild(styleElement);
	} 

	/*-- DOM 		--*/

	clearElement(container){
		container.innerHTML = ""
	}

	removeElements(query, container){
	    const headStyles = container.querySelectorAll(query)
	    headStyles.forEach(style => style.remove());
	}

	cloneElements(query, container, destination){
	    const els = container.querySelectorAll(query);

	    els.forEach(el => {
	        const _el = el.cloneNode(true);
	        destination.appendChild(_el);
	    });
	}

	/**
	 * Store a copy of within a container to a document fragment, optionally keeping the original elements.
	 *
	 * @param {Element} container - The container whose child elements need to be cloned.
	 * @param {boolean} keep - Flag indicating whether to keep the original elements.
	 * @returns {DocumentFragment} A document fragment containing the cloned elements.
	 */
	storeElements(container, keep) {
	    // Create a document fragment
	    let content = document.createDocumentFragment();
	    // Clone content
	    container.childNodes.forEach(child => {
	        if (child.nodeType === 1 && (child.tagName !== 'SCRIPT' && !child.tagName.includes('CSSPAGEWEAVER'))) {
	            const clonedChild = child.cloneNode(true);
	            content.appendChild(clonedChild);

	            if (!keep) {
	                child.remove();
	            }
	        }
	    });

	    return content;
	}

	/**
	 * Sets a unique identifier for each element within a container.
	 *
	 * @param {Element} container - The container whose elements need unique identifiers.
	 * @returns {void}
	 */
	setUniqueIdentfier(container) {
	    const elements = container.querySelectorAll('*');
	    let parentCount = -1;
	    // Iterate over each element and assign a unique identifier using the index
	    elements.forEach((el, i) => {
	        parentCount = (el.tagName === 'SECTION' || el.tagName === 'ARTICLE') ? parentCount + 1 : parentCount;
	        let prefix = el.closest('article, section') ? String.fromCharCode(65 + parentCount) : '';
	        el.setAttribute('data-unique-identifier', `${prefix}-${i}`);
	    });
	}

	/* Paged JS */

    /**
     * Registers all hook features
     *
     * @param {Object} data - Dataset to loop for registration.
     * @param {Object} previewer - PagedJs instance to register
     * @returns {Promise<void>} - A promise that resolves when all features of the specified type are registered.
     */
    async registerAllHook(hooks, previewer) {

        /**
         * Register features pagedJs custom hook.
         * Hook are function happening at certain time of PagedJs workflow
         * @param {Object} hookPromise - The import object for the feature.
         * @param {string} id - The feature Id for debugging
         */
        async function registerHook(hookPromise, id) {
            const hook = await hookPromise;

            if (!hook) {
                return;
            }

            const handlerClass = hook.default || Object.values(hook)[0];

            // Ensure the handlerClass is a valid Handler class
			if (handlerClass.prototype instanceof Handler) {
				try {
				    previewer.registerHandlers(handlerClass);
				} catch (error) {
				    console.error(`An error occurred while registering the handler ${id ? `for ${id}` : ``}:`, error);
				}
			}
        }

        for (const hookPromise of hooks) {
            await registerHook(hookPromise);
        }
    }

}

export default CssPageWeaver_PreRender