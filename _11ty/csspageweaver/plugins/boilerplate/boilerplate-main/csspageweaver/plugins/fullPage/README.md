---
name: fullPage
tags: recommended, stable
description: Create full page elements and full spread elements in the flow of your book.

---


# Full page elements (paged.js)

This script help you to create full page elements and full spread elements in the flow of your book. 

You need to use [csstree.js](https://github.com/csstree/csstree) in order to transform custom properties. 
If you use CSS Page Maker is inclued by default


## How to install

**With CSS Page Marker**

Make sure the csstree library is included in the `<head>` of your HTML:


```html
<script src="/csspageweaver/lib/csstree.min.js"></script>
```


Register the `fullPage` plugin in your `manifest.json`:

```json
[
    "fullPage",
    // other plugins

]

```


**Without CSS Page Maker**

Include both csstree and the fullPage script in your HTML `<head>`:

```html
<script src="js/csstree.min.js"></script>
<script src="path/to/fullPage/fullPage.js"></script>
```



## How to use it

In the CSS, on the element(s) you want in full page add the following custom property(works with id and classes):

```css
elem{
    --pagedjs-full-page: page
}
```

You have multiple keywords for the custom property:
- `--pagedjs-full-page: page` → The element will be remove from flow and put in the next page.
- `--pagedjs-full-page: left` → The element will be remove from flow and put in the next left page.
- `--pagedjs-full-page: right` → The element will be remove from flow and put in the next right page.
- `--pagedjs-full-page: spread` → The element will be remove from flow and put in the next spread.
- `--pagedjs-full-page: <number>` → The element will be remove from flow and put in the page you specify (with `--pagedjs-full-page: 4`, the element is put on page number 4).

Note that this script works on any elements, even if the element contains several child elements. 


### Images in full page

If you want an image in full page, we advise you to use the usual `objet-fit` properties.

```css
#figure{
  --pagedjs-full-page: page;
  width: 100%;
  height: 100%;
  margin: 0px;
}
img {
    object-fit: cover;
    object-position: 0px 0px;
    width: 100%;
    height: 100%;
}
```

- To change the size of you image, use `width` and `height`.
- To change the position of your image, use `object-position`.
- In the case of the `spread` option, all the spread will be considered, i.e. `width: 100%` cover all the spread. 
  

### Spread and central fold

Sometimes, when a book is binding, the elements that cover the spread need to be offset from the central fold. A custom value can be added to the page to take it into account.

```css
@page {
    --pagedjs-fold: 10mm;
}
```

### Bleeds of full page and full spread elements

In order to avoid that your elements moves when you change the bleeds and the crop marks of your document, the bleeds of full page elements was set up to `6mm`. This is due to the way Paged.js modifies the DOM (full page elements are contained in the page sheet and depend on the dimensions of this page sheet). 
If you want to change the dimensions of these specific bleeds, you just have to change the value of the `bleedFull` variable in the first line of the `full-page.js` file


### Examples

You can find examples of use in `css/full-page.css`.

![](images/full-page-example.png)


## Credits

- [pagedjs.org](https://www.pagedjs.org/)
- [csstree.js](https://github.com/csstree/csstree)

MIT licence, Julie Blanc, 2021


