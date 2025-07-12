---
name: tableOfContent
tags: recommended, stable
description: A script to generate a table of content. 
---

# Table of content

A script to generate a table of content. 

See pagedjs.org post: [Build a Table of Contents from your HTML](https://pagedjs.org/post/toc/)

**tags**: recommended, stable

## Parameters

The plugin contain also a minimal stylesheet to add the corresponding page numbers with paged.js and add some style to the toc list.

In `manifest.json`, you can modify/add some parameters:

```json
    "plugins":{
        "tableOfContent"
    },
    "pluginsParameters":{
        "tableOfContent": {
            "tocContainer": "#toc_container",
            "tocTitles": ["h1", "h2"]
        }
    },
 ```

- `tocElement` → define the id element where the toc list will be create (by default: `#toc`)
- `titleElements` → array of the title element you want in the toc list. You can add as many as you want and the elements can be classes like `.title-1` or `.my-content h1:not(.unlisted)`. (by default: `["h1", "h2"]`) 
- `beforePageNumber` (optional) → if you want to add some text before the page number ("page ", "p. ", ...) 
- `position`  → put the page number before or after the toc element, create `::before` or `::after` pseudo-element (by default: `after`)


## Stylesheet

This plugin have a minimal stylesheet 

```CSS
#list-toc-generated{
    --before-page: ""; 
}
```

`--before-page` refers to the text before the page number ("page ", "p. ", ...), you can change it directly here or in the config.json 


If the page number is positionned after the toc element (`"position": "after"` in config.json), this style apply: 

```CSS
.toc-element a.toc-page-after::after{
    content: var(--before-page) target-counter(attr(href), page); /* This line create the page number */
    float: right;  /* put number at the right of the page */
}
```

If the page number is positionned before the toc element (`"position": "before"` in config.json), this style apply: 

```CSS
.toc-element a.toc-page-before::before{
    content: var(--before-page) target-counter(attr(href), page);
    margin-right: 1ch; /* space after number */
}

```



## How to install

### Download 

1. Download the ZIP archive via Code > Download ZIP.
2. Unzip the archive.
3. Rename the extracted folder by removing the branch name suffix: `tableOfContent-main` → `tableOfContent`
4. Move the folder into the `csspageweaver/plugins/` directory.
5. Add the required parameters to `manifest.json` (see above).


### Git clone 

1. Use git clone 
2. Move the folder into the `csspageweaver/plugins/` directory.
3. Add the required parameters to `manifest.json` (see above).


