## Eleventy (11ty) pour pagedjs

Je génère 2 sites statiques
- une version web (ou les images sont transformées (adaptées))
- une version `print/`  (ou les images ne sont transformées)

Il y a donc 2 configurations `eleventy.js` et `eleventyPrin.js`


Les ressources sont copiees à la racine `images + assets + csspageweaver` à la racine du site.

```js
  eleventyConfig.addPassthroughCopy({
     [`${config.publicFolder}/images`]: "images"  ,
    "_11ty/assets": "assets",
    "_11ty/assets/modes": "assets/modes",
    "_11ty/csspageweaver": "csspageweaver"
  });
```

Les images en version `print`, ont besoin d'une url absolue

```js
eleventyConfig.addTransform("fixImagePaths", function(content, outputPath) {
  if (outputPath && outputPath.endsWith(".html")) {
    // Transformer les chemins relatifs en chemins absolus
    content = content.replace(
      /src="images\//g, 
      'src="/images/'
    );
    return content;
  }
  return content;
});
```


Il y a 2 scripts principaux

`npm run start` génère 2 sites ou les images ne sont pas transformées

```json
start": "npm run clean && npx eleventy --serve --config=.eleventyStart.js
```

`npm run build` génère 2 sites ou les images sont transformées

```json
build": "npm run clean && npm run build:screen && npm run build:print
```

Prends en compte les écritures spécifiques à Obsidian

https://help.obsidian.md/embeds

🤱 