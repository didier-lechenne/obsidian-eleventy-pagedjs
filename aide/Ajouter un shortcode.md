

## Comment ajouter un shortcode

1. **Utilisez `eleventyConfig.addShortcode()`** avec un nom unique
2. **Suivez le pattern existant** avec les deux formats d'appel
3. **Ajoutez un cas dans `generateHTML()`** pour votre type
4. **Définissez le HTML de sortie** dans le switch

**Étapes :**

- Placez le code après les shortcodes existants
- Adaptez le nom (`"monShortcode"`) et le type (`"monType"`)
- Personnalisez le HTML généré dans `generateHTML()`
- Testez avec les deux formats : `{% monShortcode "id" %}` ou `{% monShortcode "src", {...} %}`

L'exemple ci-dessus montre la structure complète à adapter selon vos besoins.

``` js
// 1. Ajoutez les compteurs globaux en haut
let globalImageCounter = 0;
let globalFigureCounter = 0;
let globalFigureGridCounter = 0;
let globalFullpageCounter = 0; // ← Nouveau compteur

// 2. Reset dans eleventy.before
eleventyConfig.on("eleventy.before", () => {
  globalFigureCounter = 0;
  globalFigureGridCounter = 0;
  globalImageCounter = 0;
  globalFullpageCounter = 0; // ← Reset du nouveau compteur
  // ... reste du code
});

// 3. Ajoutez le shortcode
eleventyConfig.addShortcode("fullpage", function (firstParam, options = {}) {
  let config, imageId;

  if (
    typeof firstParam === "string" &&
    !firstParam.includes("/") &&
    !firstParam.includes(".")
  ) {
    imageId = firstParam;
    config = getImageConfig(imageId, options);

    if (!config.src) {
      return `<!-- ERROR: Fullpage "${imageId}" non trouvée dans JSON -->`;
    }
  } else {
    imageId = options.id;
    const existingConfig = imageConfigs[imageId] || {};

    config = {
      ...existingConfig,
      ...options,
      src: firstParam,
    };

    if (
      imageId &&
      JSON.stringify(existingConfig) !== JSON.stringify(config)
    ) {
      imageConfigs[imageId] = { ...config };
      configHasChanged = true;
    }
  }

  return generateHTML("fullpage", config);
});

// 4. Ajoutez le cas dans generateHTML()
case "fullpage":
  globalFullpageCounter++;
  return `<figure id="figure-${globalFullpageCounter}" class="full-page${classAttr}"${styleAttr}>
    <img src="${config.src}" alt="${cleanAlt}">
  </figure>`;
```