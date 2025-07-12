# Inline notes (plugin for Css Page Weaver)

To move notes in the correct place in the page, Paged.js needs to have the note element in the flow. But in convert tools like Pandoc, it’s common to have the notes elements presented in a list with link elements in the flow pointing to the correponding note.

This script moves listed notes to inline elements at the place of the call.



## How to use

Add this folder in `csspageweaver/plugins/`.

Call the plugin in `csspageweaver/manifest.json`:

```json
	"plugins": [
        "inlineNotes",
        // other plugins ...
	],
```

## Config.json

In `config.json`, you can modify/add some parameters:

- `input` → CSS selector of the original call element (by default: `.footnote-ref`)
- `containerNotes` → CSS selector of the original container of the footnote list, this container is deleted after moving notes (by default: `#footnotes`)
- `newClass` → Class of the new span created for the note


## Exemple

Before :

```HTML
<p>Gutenberg  in 1439 was the first European to use movable type.
Among his many contributions to printing are: the invention of
a process for mass-producing movable type; the use of oil-based
ink for printing books; <a href="#fn1" class="footnote-ref" id="fnref1" role="doc-noteref"><sup>1</sup></a> adjustable molds; mechanical movable type; and the use  of a wooden printing press similar to the agricultural  screw presses of the period.</p>
<aside id="#footnotes">
    <hr>
    <ol>
        <li id="fn1">Soap, Sex, and Cigarettes: A Cultural History of American Advertising By Juliann Sivulka, page 5</li>
    </ol>
</aside>

```


After (wiht the plugin):

```HTML
<p>Gutenberg  in 1439 was the first European to use movable type.
Among his many contributions to printing are: the invention of
a process for mass-producing movable type; the use of oil-based
ink for printing books; <span class="inline-note" data-counter-note="1">Soap, Sex, and Cigarettes: A Cultural History of American Advertising By Juliann Sivulka, page 5</span>
adjustable molds; mechanical movable type; and the use 
of a wooden printing press similar to the agricultural 
screw presses of the period.</p>
```
