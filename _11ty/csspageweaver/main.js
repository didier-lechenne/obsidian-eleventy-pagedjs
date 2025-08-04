/**
 * @author Benjamin G. <ecrire@bnjm.eu>, Julie Blanc <contact@julie-blanc.fr>
 * @tutorial https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home
 * Credit: This global tool is based on an original idea from Julie Blanc 
 */

import CssPageWeaver_Dict from './modules/dict.js';
import CssPageWeaver_GUI from './modules/gui.js';
import CssPageWeaver_SimpleRender from './modules/render.js';
import CssPageWeaver_FrameRender from './modules/frame_render.js';

import * as csstree from './lib/csstree.min.js';

/**
 * This script manage the way CSS Page Weaver
 * With or without GUI, with or without common dictionary
 * With simple render or framed render
 * Call instances on purpose
 */

//👋 HERE - Edit method here or from you own script
if(typeof cssPageWeaver_method == "undefined"){
    window.cssPageWeaver_method = {
        gui: true,
        dict: true,
        render: "simple",
    }
}



// Dict
if(cssPageWeaver_method.dict){
    window.cssPageWeaver_dict = new CssPageWeaver_Dict()
}

// GUI
if(cssPageWeaver_method.gui){
    document.addEventListener("DOMContentLoaded", (event) => {
        customElements.define('csspageweaver-gui', CssPageWeaver_GUI)
        window.cssPageWeaver_gui = document.createElement('csspageweaver-gui');
        cssPageWeaver_gui.classList.add("pagedjs-ignore");
        document.body.insertAdjacentElement('afterbegin', cssPageWeaver_gui)
    })
}

// SIMPLE RENDER
if(cssPageWeaver_method.dict && cssPageWeaver_method.render == "simple"){
    // If pagedjs is defined, wait for the 'cssPageWeaver_dictInit' event to initialize
    document.addEventListener('cssPageWeaver-dictInit', () => {

        window.cssPageWeaver_simpleRender = new CssPageWeaver_SimpleRender()

        cssPageWeaver_simpleRender.interface = `${cssPageWeaver.directory.root}/interface/css/interface.css`

        cssPageWeaver_simpleRender.hook = [
            ...cssPageWeaver_dict.getFeaturesHookAsArray(),
            ...cssPageWeaver.user?.hook
        ]

        cssPageWeaver_simpleRender.css = [
            ...cssPageWeaver.user?.css,
            ...cssPageWeaver_dict.getFeaturesStyleAsArray()
        ]
        
        cssPageWeaver_simpleRender.setup()
    });
}

// FRAMED RENDER
if(cssPageWeaver_method.dict && cssPageWeaver_method.render == "frame"){
    /* Using with shadow */
    document.addEventListener('cssPageWeaver-dictInit', () => {

        customElements.define('csspageweaver-frame', CssPageWeaver_FrameRender);
        window.cssPageWeaver_frame = document.createElement('csspageweaver-frame');

        cssPageWeaver_frame.interface = `${cssPageWeaver.directory.root}/interface/css/interface.css`

        cssPageWeaver_frame.hook = [
            ...cssPageWeaver_dict.getFeaturesHookAsArray(),
            ...cssPageWeaver.user?.hook
        ]

        cssPageWeaver_frame.css = [
            ...cssPageWeaver.user?.css,
            ...cssPageWeaver.stylesheet.features
        ]
            
        document.body.insertAdjacentElement('afterbegin', cssPageWeaver_frame)

        // Simulate Change
        /*
        setTimeout( async () => {
            cssPageWeaver_frame.css.push('/css/style-2.css')
            cssPageWeaver_frame.reloadDocument('/')
        }, 2000)
        */

    })
}

 
/* Using without GUI or Dict */
if( !cssPageWeaver_method.dict && !cssPageWeaver_method.dict){
    if(cssPageWeaver_method.render == "frame"){
        customElements.define('csspageweaver-frame', CssPageWeaver_FrameRender);
        window.cssPageWeaver_frame = document.createElement('csspageweaver-frame');
        cssPageWeaver_frame.interface = `csspageweaver/interface/css/interface.css`
        cssPageWeaver_frame.css = ['/css/style.css']
        document.body.insertAdjacentElement('afterbegin', cssPageWeaver_frame)
    } else {
        window.cssPageWeaver_simpleRender = new CssPageWeaver_SimpleRender()
        cssPageWeaver_simpleRender.interface = `csspageweaver/interface/css/interface.css`
        cssPageWeaver_simpleRender.hook = []
        cssPageWeaver_simpleRender.css.push('/css/style.css')
        cssPageWeaver_simpleRender.setup()
    }
}


