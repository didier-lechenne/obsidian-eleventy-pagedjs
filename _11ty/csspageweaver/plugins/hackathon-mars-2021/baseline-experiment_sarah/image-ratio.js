class imageRatio extends Paged.Handler {
    constructor(chunker, polisher, caller) {
        super(chunker, polisher, caller);
    }

    afterParsed(parsed) {
        // create an array that will store the images data later on
        let imagePromises = [];
        // find all images parsed by paged.js
        let images = parsed.querySelectorAll("img");
        // for each image  
        images.forEach(image => {
            // load the image as an object
            let img = new Image();
            // test if the image is loaded
            let resolve, reject;
            let imageLoaded = new Promise(function (r, x) {
                resolve = r;
                reject = x;
            });
            // when the image loads
            img.onload = function () {
                // find its height
                let height = img.naturalHeight;
                
                // find its width
                let width = img.naturalWidth;

                // calculate the ratio
                let ratio = width / height;

                // if the ratio is superior than 1.4, set it as a lanscape adn add a class to the image (and to the parent figure)
                if (ratio >= 1.4) {
                    image.classList.add("landscape");
                    image.parentNode.classList.add("fig-landscape");
                } 
                // if the ratio is inferior than 0.8, set it as a portrait adn add a class to the image (and to the parent figure)

                else if (ratio <= 0.8) {
                    image.classList.add("portrait");
                    image.parentNode.classList.add("fig-portrait");
                } 
                // else, if it’s between 1.39 and 0.8, add a “square” class.
                else if (ratio < 1.39 || ratio > 0.8) {
                    image.classList.add("square");
                    image.parentNode.classList.add("fig-square");
                }
                // resolve the promise
                resolve();
            };
            // if there is an error, reject the promise
            img.onerror = function () {
                reject();
            };

            img.src = image.src;

            imagePromises.push(imageLoaded);
        });
        
        return Promise.all(imagePromises).catch(err => {
            console.warn(err);
        });
    }
}  

// and we register the handler

Paged.registerHandlers(imageRatio);