# Beau Drapeau

A interface to manually but easily handle line break and letterspacing of textuals elements, in the browser.

## How to install the plugin

Add this folder to `csspageweaver/plugins/`.

Call the plugin in `csspageweaver/manifest.json`:

```json
	"plugins": [
        "beauDrapeau",
        // other plugins ...
	],
```

## Configuration

In `manifest.json`, you can modify/add some parameters:

```json
    "plugins":{
        "beauDrapeau"
    },
    "pluginsParameters":{
        "beauDrapeau": {
			"data": "/csspageweaver/plugins/beauDrapeau/beauDrapeau-data.js"
        }
    },
 ```


## How to use it

Edits abilities are enable with a dumb on screen ON / Off Button.
When active, two actions can be performs :

+ Add forced lines breaks in text element. Just add it with `Shift` + `Enter`.

+ Increase or decrease element letter spacing. Just hover a element press `Shift` + Scroll Wheel

### Retrieve changes

When disable, script download an data file named `_beaudrapeau.js`. Placed on page folder, it'll allow script to retrieve current change on next session.

### Reset

Enable edition, mouse over an element and press `Shift` + `R`


## Script behavior

+ `beauDrapeau-hook.js` will extend `PagedJs` class
+ retrieve eventuals previous edits as a `_beaudrapeau.js` file in page folder 
+ act before PagedJs parse content.

## Licence

The MIT License (MIT)