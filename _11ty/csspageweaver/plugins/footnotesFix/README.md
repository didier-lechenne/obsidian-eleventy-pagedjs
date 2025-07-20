# Plugin to fix footnotes reset issue

This plugin fix the issue of footnote reset.

You can use the current method to declare footnotes:

```CSS
@page {
    @footnote {
      float: bottom;
    }
  }
  
.pagedjs_footnote { 
  float: footnote; 
}
```

This style is also added to the default stylesheet `footnotes.css` of this plugin. You can delete it if you have already declared footnotes in your own stylesheet (don't forget to remove it from the `config.json` as well).


## How to use the plugin

Add this folder to `csspageweaver/plugins/`.

Call the plugin in `csspageweaver/manifest.json`:

```json
	"plugins": [
        "footnotesFix",
        // other plugins ...
	],
```

## Configuration

In `manifest.json`, you can modify/add some parameters:

```json
    "plugins":{
        "footnotesFix"
    },
    "pluginsParameters":{
        "footnotesFix": {
            "tocContainer": "#toc_container",
            "tocTitles": ["h1", "h2"]
        }
    },
```

All the parameters are optional.

- `selector` → CSS selector for the note element (must be inline in the HTML), by default is `.footnote`
- `reset` → CSS selector where you want reset note counter. If you want to reset on the page: `page`


## Notes in HTML

In your HTML, the note must be a `<span>` inserted in the text, like this:

```HTML
Donec tincidunt, odio vel vestibulum sollicitudin, nibh dolor tempor sapien, ac laoreet 
sem felis ut purus.&#8239;<span class=".footnote">Vestibulum neque ex, ullamcorper sit 
amet diam sed, pharetra laoreet sem.</span> Morbi cursus bibendum consectetur. Nullam vel 
lacus congue nibh pulvinar maximus sit amet eu risus. Curabitur semper odio mauris, nec 
imperdiet velit pharetra non. Aenean accumsan nulla ac ex iaculis interdum.
```

You can use the [inline_notes` plugin](https://gitlab.com/csspageweaver/plugins/inline_notes) to create these span elements from listed notes, which are more common in conversion tools like Pandoc.

The inline_notes plugin should be called before the footnotes plugin in the `manifest.json`:


```json
	"plugins": [
        "inline_notes",
        "footnotes_fix",
        // other plugins ...
	],
```

## Styling call & footer

It's possible to change the styles of call notes and marker notes directly in your stylesheet like in the following code:

```CSS
::footnote-call{
    font-weight: bold;
}

::footnote-marker{
    font-weight: bold;
}
```

