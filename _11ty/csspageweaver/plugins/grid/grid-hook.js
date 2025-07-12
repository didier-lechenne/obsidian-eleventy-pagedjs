/**
 * @name Grid
 * @author Julie Blanc <contact@julie-blanc.fr>
 * @see { @link https://gitlab.com/csspageweaver/plugins/grid/ }
 */

import { Handler } from '/csspageweaver/lib/paged.esm.js';

export default class GridPage extends Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
      }

  
    afterPageLayout(pageElement, page, breakToken) {
        let pageBox = pageElement.querySelector(".pagedjs_pagebox");

        var div = document.createElement('div');
        div.classList.add("grid-page");
        div.innerHTML = '<div class="grid-column grid-column-0"></div>\
        <div class="grid-column grid-column-1"></div>\
        <div class="grid-column grid-column-2"></div>\
        <div class="grid-column grid-column-3"></div>\
        <div class="grid-column grid-column-4"></div>\
        <div class="grid-column grid-column-5"></div>\
        <div class="grid-column grid-column-6"></div>\
        <div class="grid-column grid-column-7"></div>\
        <div class="grid-column grid-column-8"></div>\
        <div class="grid-column grid-column-9"></div>\
        <div class="grid-column grid-column-10"></div>\
        <div class="grid-column grid-column-11"></div>\
        <div class="grid-column grid-column-12"></div>';
        pageBox.appendChild(div);
    }

}
