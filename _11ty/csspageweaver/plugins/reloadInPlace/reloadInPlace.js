/**
 * @name Reload-in-place v2.0
 * @desc A simple script to add to your pagedjs project. On reload, it will make the web browser scroll to the place it was before reload. 
 * Useful when styling or proof correcting your book. Multi docs compatible and doesn't wait for complete compilation to go.
 * @author Nicolas Taffin 
 * @author Sameh Chafik
 * @author (adapted by) Benjamin G. <ecrire@bnjm.eu>
 * @license MIT
 * @see { @link https://gitlab.com/csspageweaver/plugins/reloadInPlace }
 */


import { Handler } from "../../../lib/paged.esm.js";


export default class reloadInPlace extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.parameters = cssPageWeaver.features.reloadInPlace.parameters || {}
		this.isScrollBlured = this.parameters.blur || true;
		this.scrollBehavior = this.parameters.scrollBehavior || 'instant';

		// set a "unique" filename based on title element, in case several books are opened
		this.fileTitle = document.getElementsByTagName("title")[0].text.replace(/ /g, "");
	}

	beforeParsed() {
		// separate human / machine scroll
		this.parameters.machineScroll = false;

		// check pagedJS ended compilation
		this.parameters.cssPageWeaverEnd = false;

		// Make it blur if needed
		this.isBlur()
	}
	
	afterParsed() {
		this.moveFast();
	}

	afterRendered(pages) {

		this.parameters.cssPageWeaverEnd = true;

		
		
		// slow down a bit save position pace
		var slowSave = this.debounce(() => {
			if(!this.parameters.machineScroll) { 
				this.saveAmountScrolled();
			}
		}, 100); // save frequency

		setTimeout(function(){ 
			window.addEventListener('scroll', slowSave);
		}, 1000); // wait a bit before starting position save

	}

	getDocHeight() {
		var D = document;
		return Math.max(
			D.body.scrollHeight, D.documentElement.scrollHeight,
			D.body.offsetHeight, D.documentElement.offsetHeight,
			D.body.clientHeight, D.documentElement.clientHeight
		)
	}

	saveAmountScrolled(){
		var scrollArray = [];
		var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop
		if (!this.parameters.machineScroll) {
			var scrollLeft = window.pageXOffset || (document.documentElement || document.body.parentNode || document.body).scrollLeft
			scrollArray.push({ X: Math.round(scrollLeft), Y: Math.round(scrollTop) });
			//console.log("Saved ", scrollArray);
			localStorage['reloadInPlace-' + this.fileTitle] = JSON.stringify(scrollArray);
		}
	}

	isBlur(){
		// Apply a blur effect if scroll blurring is enabled
		if (this.isScrollBlured) {
			var styleEl = document.createElement('style');
			styleEl.setAttribute("data-reload-in-place", true)
			document.head.appendChild(styleEl);
			this.styleSheet = styleEl.sheet;
			this.styleSheet.insertRule('.pagedjs_pages { filter: blur(3px); }', 0);
			
		}
	}

	retrievePosition(){
		// Retrieve saved scroll data from localStorage
		var savedData = localStorage.getItem('reloadInPlace-' + this.fileTitle);

		if (savedData) {
			// Parse the saved data to get the scroll positions
			var scrollArray = JSON.parse(savedData);
			this.scrollTop = scrollArray[0].Y;
			this.scrollLeft = scrollArray[0].X;
		} else {
			// Default scroll positions if no saved data is found
			this.scrollTop = 0;
			this.scrollLeft = 0;
		}
	}


	/**
	 * Adjusts the scroll position of the window based on saved data.
	 * This function handles scrolling behavior when the document height changes,
	 * ensuring the view returns to a previously saved scroll position or the bottom of the document.
	 *
	 * @param {Object} _ - ReloadInPlace scope
	 */
	moveFast() {
		// Set the machine scroll flag to true
		this.parameters.machineScroll = true;

		this.retrievePosition()

		// Get the window height
		var winheight = window.innerHeight || (document.documentElement || document.body).clientHeight;

		let _ = this

		// Set up an interval to adjust the scroll position
		_.currentInterval = setInterval(() => {
			// Get the current document height
			_.docheight = _.getDocHeight();

			// Check if the saved scroll position is beyond the current document height
			if ( _.scrollTop > 0 && _.scrollTop > _.docheight - winheight && !_.parameters.cssPageWeaverEnd) {
				// Scroll to the bottom of the document
				window.scrollTo(_.scrollLeft, _.docheight, _.scrollBehavior);
			} else {
				// Scroll to the saved position
				window.scrollTo(_.scrollLeft, _.scrollTop, _.scrollBehavior);

				// Clear interval
				clearInterval(_.currentInterval);

				// set a timeout to finalize the scroll position
				setTimeout(function () {
					window.scrollTo(_.scrollLeft, _.scrollTop, _.scrollBehavior);

					// Reset the machine scroll flag
					_.parameters.machineScroll = false;

					// Remove the blur effect if it was applied
					if (_.isScrollBlured) {
						_.styleSheet.deleteRule(0);
					}
				}, 50); // Delay to start
			}
		}, 50); // Refresh frequency
	}

	debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};
}