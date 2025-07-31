# Marker

---
## Display layout structure.

Plugin for **CSSPageWeaver**.  
https://gitlab.com/csspageweaver/plugins


```yaml
# FrontMatter configuration
---
title: "title"
template: modularGrid
gridCol: 12
gridRow: 36
gridColGutter: 3mm
gridRowGutter: 0mm
---
```

```css
.container {
  style="--grid-col:12; --grid-row:36; --grid-col-gutter:3mm; --grid-row-gutter:0mm;"
  
  --g-column-count: var(--grid-col);
  --g-row-count: var(--grid-row);
  --g-column-gutter: var(--grid-col-gutter);
  --g-row-gutter: var(--grid-row-gutter);
}
```


---
### Source
Andreas Larsen
- **Code source** : https://github.com/larsenwork/CSS-Responsive-Grid-Overlay
- **Article Medium** : https://medium.com/larsenwork-andreas-larsen/pure-css-responsive-grid-overlay-9f3a961d0911
