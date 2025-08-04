# Baseline documentation


Cette documentation propose des scripts et des tips sur la question de l’alignement sur une ligne de base dans pagedjs.


## Pré-requis / infos avant de commencer
- Avec Paged.js quand on commence à travailler sur un navigateur, on ne change plus de navigateur par la suite. Les navigateurs n'utilisent pas la même valeur dans le fichier font pour définir la ligne de base, ce qui peut entraîner des différences de rendus (voir l'[article de Vincent De Oliveira](https://iamvdo.me/en/blog/css-font-metrics-line-height-and-vertical-align) pour les explications). Pour les tests, nous avons travaillé sur Chromimum.
- Pour que tous les éléments soient calés correctement, nous allons travailler avec une unité de base: l'unité de la baseline. Il faut travailler en px (ou en mm ?) même pour les tailles de fontes. Le point aménera des décallage par rapport à la ligne de base car la conversion se fait mal: le point est plus précis que le pixel et avec l'arrondissement à l'écran, il y aura des décalages. 


## 1. Mise en place de la baseline 

### Définir l'unité de base 
On définit une variable, pour notre grille de ligne de base.
```
:: root{
  --baseline : 20px; 
}
```

### Afficher la baseline 

Pour afficher la baseline, on peut se servir de ce code en css. Attention, ce bout de code utilise des variables qui sont définie dans le fichier `interface.css` que l'on peut récupérer dans [ce repo](https://gitlab.pagedmedia.org/tools/interface-polyfill) et qu'il faut ajouter à son projet.

```--pagedjs-baseline-position``` permet d'ajuster la position de la baseline. La position de la baseline peut varier suivant les typographies. En effet, la hauteur d'une typographie varie suivant son dessin, ses ascendantes et ses descendantes. Une fois la typo de texte choisie, il faut ajuster ```--pagedjs-baseline-position``` afin de caler la grille sur la typographie.

```
    .pagedjs_pagebox {
        --pagedjs-baseline: var(--baseline);
        --pagedjs-baseline-position: -4px;
        --pagedjs-baseline-color: cyan;
        background: linear-gradient(var(--color-paper) 0%, var(--color-paper) calc(var(--pagedjs-baseline) - 1px), var(--pagedjs-baseline-color) calc(var(--pagedjs-baseline) - 1px), var(--pagedjs-baseline-color) var(--pagedjs-baseline)), transparent;
        background-size: 100% var(--pagedjs-baseline);
        background-repeat: repeat-y;
        background-position-y: var(--pagedjs-baseline-position);
    } 
```

### Ajuster les marges et configurer les paramètres du texte courant
Lorsqu'on définit les paramètres de la @page, veillez à choisir une marge propotionnelle à l'unité de base. 
Note: dans les ```@page``` il n'est pas possible d'utiliser des variables (ça ne fonctionne pas).

```
/* --baseline: 20px; soit mes marges = --baseline*3 */ 
@page{
  size: 15cm 21cm;
  margin: 60px;
}
```

Définir le line-height du document à la taille de mon unité de base 
```
body{
  line-height: var(--baseline);
}
```

Tous les éléments de la page doivent avoir un line-height qui est un multiple de l'unité de la baseline. On peut utiliser `calc()` pour cela.

```
h3 {
  line-height: calc(var(--baseline)*2);
}
```

Si les éléments ont des polices de cractères différentes, ils ne seront peut être pas aligné en eux-même sur la ligne de base (voir l'article de [article de Vincent De Oliveira](https://iamvdo.me/en/blog/css-font-metrics-line-height-and-vertical-align)). Il faut alors les déplacer manuellement avec une position relative pour rattraper la différence (mais ne pas ajouter de marge ou de padding car sinon on décalera les autres éléments).

```
h3 {
  line-height: calc(var(--baseline)*2);
  position: relative;
  top: 3px;
}
```

## 2. Scripts dans ce repo

`image-ratio.js` redimensionne les images pour qu'elles soient proportionnelles à la ligne de base

`baseline.js` cale les éléments sur la ligne de base. Si on ajoute certaines classes (`.random-base`, `.random-separate-words`), les éléments peuvent être disposés aléatoirement sur la page en restant calés sur la ligne de base.

