
## Cover (Couverture)

```
---
template: cover
show: print
---

(imgfull : /images/nom-de-votre-image.png   page : cover)
```

## Blank page (Page vierge)

La valeur de `bgColor` permet de définir une couleur pour cette page vide.

```
---
template: blankpage
toc: ignore
show: print
bgColor: "rgba(255, 255, 255, 1)"
---
```

## Half title (faux-titre)

un faux-titre est la page qui précède la page de titre proprement dite, généralement placée en début d'ouvrage. Elle contient des informations réduites par rapport à la page de titre complète.
Dans cet exemple cette page utilise un gabarit de mise en page `modularGrid`

```
---
template: modularGrid
gridCol: 12
gridRow: 36
gridColGutter: 3mm
gridRowGutter: 3mm
toc: ignore
show: print
class: fauxtitre 
---
```

## modularGrid (Grille modulaire)

En typographie du livre, une **grille modulaire** (ou « modular grid » en anglais) est un système de mise en page basé sur une grille divisée en modules rectangulaires.   
Cette approche, popularisée par des typographes comme Josef Müller-Brockmann, permet une mise en page très structurée tout en offrant une grande liberté créative dans l'organisation des contenus.

```
---
template: modularGrid
gridCol: 12
gridRow: 36
gridColGutter: 3mm
gridRowGutter: 3mm
toc: ignore
show: print
class:  
---
```

## Table of content - toc (Table des matières)

La table des matières et sa numérotation sont générés automatiquement à partir des titres de chapitre. Il est également possible afficher les sous chapitres 

```
---
template: toc
show: print
---

<nav id="nav-toc"></nav>
```

## **Structure numérique :**

- **1** = Chapitre 1 (ou Section principale)
- **1.2** = Section 2 du chapitre 1
- **1.2.1** = Sous-section 1 de la section 1.2

## **En HTML/Markdown :**

- `## Chapitre 1` → **1**
- `### Section 2` → **1.2**
- `#### Sous-section 1` → **1.2.1**
- `##### Sous-sous-section 1` → **1.2.1.1**

## **Exemple concret :**

```
1. HÉRITAGE
  1.1 Transmission familiale
  1.2 Héritage collectif
    1.2.1 Les ressourceries
    1.2.2 Les bibliothèques d'objets
    1.2.3 Les plateformes numériques
  1.3 Fardeau de l'héritage
```




> [!NOTE]
> Ces éléments sont optionnels
> 
> toc: ignore
> show: print
> draft true
> class: 


