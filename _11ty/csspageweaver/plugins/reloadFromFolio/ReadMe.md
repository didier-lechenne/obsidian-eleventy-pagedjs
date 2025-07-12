# Reload from Folio

## How to use the plugin


Add this folder to `csspageweaver/plugins/`.

Call the plugin in `csspageweaver/manifest.json`:

```json
	"plugins": [
        "reloadFromFolio",
        // other plugins ...
	],
```

## Configuration


 In `main.js`, nous need to switch render method to `frame`

```js
if(typeof cssPageWeaver_method == "undefined"){
    window.cssPageWeaver_method = {
        render: "frame"   
    }
}

```

In `manifest.json`, you can modify/add some parameters:

```json
    "plugins":{
        "reloadFromFolio"
    },
    "pluginsParameters":{
        "reloadFromFolio": {
            "reloading": false,
            "singlePage": false,
            "fromFolio": 1,
            "excludeHookFromReload": ["reloadInPlace"],
            "excludeScriptFromReload": []
        }
    },
 ```
