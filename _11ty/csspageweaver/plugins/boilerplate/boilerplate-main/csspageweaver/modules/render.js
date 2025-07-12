/**
 * @classdesc This take content, paginates it and return pages to DOM. Simple.
 * @author Benjamin G. <ecrire@bnjm.eu>, Julie Blanc <contact@julie-blanc.fr>
 * @tutorial https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home
 */

import { Previewer } from '../lib/paged.esm.js';
import CssPageWeaver_PreRender from './pre_render.js';

class CssPageWeaver_SimpleRender extends CssPageWeaver_PreRender{
	constructor(){
		super()

		// Futur Parsed HTML to store in order to paginate 
		this.content = null

		// Hook and CSS to pass to pagedJs. Can be edit.
		this.hook = []
		this.css = []

		this.interface = null
		console.log('CSS Page Weaver simple view initialized');
	}

	async setup(){
		// Clone the content elements
		this.content = this.storeElements(this.container.origin, false);

		// Unique Id
    	this.setUniqueIdentfier(this.content);

    	this.setView()
	}

	async setView(){
		// Set up the previewer
	    this.previewer = new Previewer();
	    await this.registerAllHook(this.hook, this.previewer);

	    if(typeof this.interface == 'string' && this.interface.length > 0){
	    	this.appendStyleLink(this.interface, document.head)
	    }

		try {
	        // Await the preview operation
	        const pages = await this.previewer.preview(this.content, this.css, this.destination);

	        // Log the result
	        console.log('Rendered', pages.total, 'pages.');

	    } catch (error) {
	        // Handle any errors that occur during the preview operation
	        console.error('Error during pagination:', error);
	    }
	}
}

export default CssPageWeaver_SimpleRender