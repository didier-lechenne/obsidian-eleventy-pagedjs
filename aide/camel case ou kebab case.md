### 1. **Frontmatter YAML** → **camelCase** (comme actuellement)

yaml

```yaml
---
title: "Introduction"
template: introduction
gridCol: 12
gridRow: 18  
gridColGutter: 3mm
printWidth: 12
printHeight: 8
---
```

### 2. **CSS Variables** → kebab-case

css

```css
--grid-col: 12;
--print-width: 12;
```

### 3. **Shortcodes** → kebab-case

markdown

```markdown
(imagegrid: images/intro.png print-col:1 print-width:12)
```

### 4. **JavaScript/Config** → camelCase

js

```js
const cssVarMapping = {
  printCol: "--print-col",
  printWidth: "--print-width"
};
```

Donc vous gardez vos frontmatters tels quels ! Le mélange vient surtout des shortcodes où vous avez `printcol` au lieu de `print-col` ou `printCol`.