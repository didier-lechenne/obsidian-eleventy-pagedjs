/**
 * @classdesc This provides a common dictionnary for a Paged.js tools.
 * 
 * Web Component will fetch the list of features. For each one a class will be instantiated. 
 * This class groups all the key data. From this list of instances 
 * the component will refine the data, import all necessary scripts, hooks and stylesheet. 
 * 
 * This very logic can be observed at the end of the component in the setup() function.
 * 
 * @author Benjamin G. <ecrire@bnjm.eu>
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @tutorial https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home
 */

class CssPageWeaver_Dict {
	constructor(){
		console.log('CSS Page Weaver Dict initialized');

		// Define a Feature class to manage individual features
		this.Feature = class {
		  constructor(featureConfig, id, directory, config) {
			this.id = id
			this.directory = directory
			this.ui = featureConfig.ui
			this.parameters = featureConfig.parameters
			this.hook = featureConfig.hook
			this.script = featureConfig.script
			this.stylesheet = featureConfig.stylesheet
			this.globalParameters = config
		  }
		}

		this.setup()
	}

	/*-- Generics functions --*/
	
	/**
	 * Clear and split feature directory path to define an unique ID
	 * @param {string} path - Feature folder path.
	 * @returns {string} - Feature ID.
	 */
	getIdFromPath(path){
		return path.trim().split("/").filter(segment => segment.trim() !== '').pop()
	}

	/*-- Dict 		--*/

	setSharedDictionnary(){

		window.cssPageWeaver = {}
		// Get the document title and remove spaces for use as a variable
		cssPageWeaver.docTitle =  document.getElementsByTagName("title")[0].text.replace(/ /g, "");

		// Set path & directory
		cssPageWeaver.directory = {}
		cssPageWeaver.directory.root = `${window.location.origin}/csspageweaver`
		cssPageWeaver.directory.plugins = `${cssPageWeaver.directory.root}/plugins`

		// Initialise user custom files
		cssPageWeaver.user = {}

		// Object to hold all features
		cssPageWeaver.features = {}
	}

	/*-- Import or list files   --*/

	/**
	 * Import the list of feature names from the manifest file or directory.
	 *
	 * This method attempts to import the feature names from a manifest.json file.
	 * If the manifest is not found, it falls back to listing the feature names
	 * from the plugin directory.
	 *
	 * @returns {Promise<Array>} A promise that resolves to an array of feature names.
	 */
	async importManifest(){
		
		try{
			// Attempt to read the manifest file to get the list of features
			return await this.importJson(`${cssPageWeaver.directory.root}`,`manifest.json`);
		} catch(error){
			console.log('Manifest not found, trying alternative method.');
			// If the manifest is not found, list feature names from the plugin directory
			let featuresNamesList = await this.listDir(cssPageWeaver.directory.plugins);
			// Return object
			return {"plugins": featuresNamesList }
		}

	}

	/**
	 * Imports an HTML template file from a given directory and file name.
	 * @param {string} dir - The directory where the template file is located.
	 * @param {string} file - The name of the template file.
	 * @returns {Promise<string>} - A promise that resolves to the contents of the template file.
	 */
	async importTemplate(dir, file) {
		const response = await fetch(`${dir}/${file}`);
		const template = await response.text();
		return template;
	}

	/**
	 * Imports a Javascript file from a specified directory.
	 * 
	 * @param {string} path - The path path where the JS file is located.
	 * @returns {Promise<Object>} A promise that resolves to the JS content of the file.
	 * @throws {Error} Throws an error if the fetch request fails or if the file is not found.
	 */
	async importJs(path) {
		try {
			return await import(path)
		} catch (error) {
			console.error(`Error loading JS for ${path}:`, error);
		}
	}

	/**
	 * Imports a JSON file from a specified directory.
	 *
	 * @param {string} dir - The directory path where the JSON file is located.
	 * @param {string} file - The name of the JSON file to import.
	 * @returns {Promise<Object>} A promise that resolves to the JSON content of the file.
	 * @throws {Error} Throws an error if the fetch request fails or if the file is not found.
	 */
	async importJson(dir, file) {

		try {
			const response = await fetch(`${dir}/${file}`);
			if (!response.ok) {
				throw new Error(`🚨 Oups. Can't find ${file} in ${this.getIdFromPath(dir)}`);
			}
			const json = await response.json();
			return json;
		} catch (error) {
			console.error(`Error fetching json file in ${this.getIdFromPath(dir)}:`, error);
			throw error; // Re-throw the error to be caught in importJson
		}
	}

	/**
	 * Lists the directories within a specified directory by fetching and parsing its HTML content.
	 *
	 * This method fetches the automatically generated HTML page listing content of a directory, 
	 * parses it to find links, and extracts directory names based on a date pattern.
	 * 
	 * Server must allow listing directory.
	 * Yes. It's dirty.
	 *
	 * @param {string} dir - The URL of the directory to list.
	 * @returns {Promise<Array<string>>} A promise that resolves to an array of directory names.
	 * @throws {Error} Throws an error if the fetch request fails or if there is an issue parsing the content.
	 */
	async listDir(dir) {
	  try {
		const response = await fetch(dir);
		if (!response.ok) {
		  throw new Error('Failed to fetch plugin directory');    }
		const text = await response.text();

		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/html');
		const links = doc.querySelectorAll('a');

		const directories = [];
		const datePattern = /\d+\//; // Matches the first number followed by a '/'

		links.forEach(link => {
			const name = link.textContent;
			if (name) {
				const match = name.match(datePattern);
				if (match) {
					// Remove everything from the date part onward
					const cleanedName = name.split(datePattern)[0].trim();
					directories.push(cleanedName);
				}
			}
		});

		return directories;
	  } catch (error) {
			console.error(`Error listing ${dir} items`, error);
		throw error
	  }
	}


	/*-- CSS 		--*/

	/**
	 * Compare declared and DOM loaded stylesheet. Warn user if he missed one.
	 * {array} - An array of stylesheet declared by user in manifest 
	 */
	lookForForgottenStylesheet(userStylesheets) {
		// Get all stylesheet (not for screen) already loaded
		const links = document.querySelectorAll(`link[rel="stylesheet"]:not([media="screen"])`)

		let domStylesheets = []

		// Iterate over each link element
		links.forEach(link => {
			// Exlude CSS Page Weaver stylesheet
			if(!link.href.includes('csspageweaver')){
				domStylesheets.push(link.href.split('?')[0])
			}
		});

		// We'll not retrieve already loaded CSS just warn user if he forget one stylesheet
		//return CSSArray

		let missedStylesheets = domStylesheets.filter(sheet => !userStylesheets.includes(sheet));

		if(missedStylesheets.length > 0){
			console.warn(`😶‍🌫️ Did you missed to include ${missedStylesheets.join(', ') } into csspageweaver/manifest.json? `)
		}
	}

	
	/*-- Features 	--*/
	
	/**
	 * Initializes features by loading their configurations and creating instances.
	 * 
	 * This method reads feature names from a manifest, imports their configurations,
	 * and sets up their UI, hooks and scripts if available.
	 */
	async initializeFeatures(featuresNamesList, featuresParameters) {

		// Loop all features
		for (const featureName of featuresNamesList) {
			const featureDir = `${cssPageWeaver.directory.plugins}/${featureName}/`

			const featureEmbedConfig =  await this.importJson(featureDir, `config.json`)
			const featureManifestConfig = featuresParameters[featureName] ? {"parameters": featuresParameters[featureName]} : {}
			const featureConfig = {...featureEmbedConfig, ...featureManifestConfig}

			// Create a new instance of the feature
			let feature = new this.Feature(featureConfig, featureName, featureDir, cssPageWeaver.parameters);

			// Import feature's HTML template if specified
			if(feature.ui){
				if(feature.ui.template){
					feature.ui.html = await this.importTemplate(featureDir, feature.ui.template);
				}
			}

			// Import the feature's script and hook if specified
			['script', 'hook'].forEach(property => {
				if (feature[property]) {
					let fileName = feature[property];
					feature[property] = this.importJs(`${featureDir}/${fileName}`);
				}
			});
			
			// Store the initialized feature			
			cssPageWeaver.features[featureName] = feature

		}
	}

	async initializeUserHook(handlerList = []) {
		cssPageWeaver.user.hook = await Promise.all(
			handlerList.map(async path => {
			    return await this.importJs(path) // Return the promise from importJs
			})
		)
	}

	/**
	 * Retrieves features that have a hook from the `cssPageWeaver` object.
	 * @returns {Array} An array of features that have a hook. Returns an empty array if `cssPageWeaver` is undefined or does not have features.
	 */
	getFeaturesHookAsArray(){
	    // Convert the features object to an array
	    const featuresArray = Object.values(cssPageWeaver.features);
	    // Filter to only features with a hook
	    return featuresArray
	        .filter(feature => feature.hook)
	        .map(feature => feature.hook);
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

	/*-- Setup 		--*/

	async setup(){

		// Set Shared dict		
		this.setSharedDictionnary()

		// Import Manifest
		let manifest = await this.importManifest()

		// Get features list as an array of class for each
		await this.initializeFeatures(manifest.plugins, manifest.pluginsParameters)
		
		// list user stylesheets
		cssPageWeaver.user.css = manifest.css || []

		// list stylesheets as convenient object
		cssPageWeaver.stylesheet = {
			features: this.getFeaturesStyleAsArray(),
			user: cssPageWeaver.user.css
		}

		// Warn user if he missed a stylesheet
		this.lookForForgottenStylesheet(cssPageWeaver.user.css)

		// Import User handlers
		await this.initializeUserHook(manifest.hook)

        // Dispatch an event to signal that features are loaded
        const event = new Event('cssPageWeaver-dictInit');
        document.dispatchEvent(event)

	}

}

export default CssPageWeaver_Dict