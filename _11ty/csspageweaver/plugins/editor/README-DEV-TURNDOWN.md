# Guide Turndown - Conversion HTML vers Markdown

Ce guide explique comment créer vos propres règles de conversion HTML vers Markdown dans l'éditeur PagedJS, même si vous n'êtes pas un expert en développement.

## 🎯 Comprendre Turndown

### Qu'est-ce que Turndown ?

Turndown est comme un traducteur automatique qui transforme du HTML (le langage des pages web) en Markdown (un format de texte simple). Imaginez que vous avez un texte écrit en français et que vous voulez le traduire en anglais automatiquement - Turndown fait la même chose, mais entre deux formats de texte.

**Exemple concret :**
- HTML : `<strong>Texte en gras</strong>`
- Markdown : `**Texte en gras**`

### Pourquoi créer ses propres règles ?

Par défaut, Turndown connaît les règles de base (gras, italique, titres...), mais votre éditeur utilise peut-être des éléments spéciaux comme des petites capitales ou des espacements personnalisés. Il faut alors lui apprendre comment les convertir.

C'est comme apprendre à un traducteur de nouveaux mots techniques spécifiques à votre domaine.

## 🔍 Anatomie d'une règle Turndown

Une règle Turndown ressemble à une recette de cuisine en trois étapes :

1. **Reconnaissance** : "Quels éléments HTML cette règle concerne-t-elle ?"
2. **Transformation** : "Comment les convertir en Markdown ?"
3. **Enregistrement** : "Comment dire au système d'utiliser cette règle ?"

### Structure de base d'une règle

```javascript
turndownService.addRule("nom-de-ma-regle", {
  // ÉTAPE 1 : Reconnaissance - À quoi cette règle s'applique-t-elle ?
  filter: function (node) {
    // Code qui détermine si cette règle s'applique à cet élément HTML
    return /* condition */;
  },
  
  // ÉTAPE 2 : Transformation - Comment convertir ?
  replacement: function (content, node) {
    // Code qui génère le Markdown final
    return /* markdown résultant */;
  }
});
```

## 📚 Exemples pratiques par niveau de difficulté

### Niveau 1 : Règle simple par balise

**Objectif :** Convertir `<mark>texte surligné</mark>` en `==texte surligné==`

```javascript
// Dans un nouveau fichier : highlight-plugin.js
export function highlightPlugin(turndownService) {
  turndownService.addRule("highlight", {
    // RECONNAISSANCE : Cette règle s'applique à toutes les balises <mark>
    filter: 'mark',  // Simple : juste le nom de la balise
    
    // TRANSFORMATION : Entourer le contenu de ==
    replacement: function(content) {
      return '==' + content + '==';
    }
  });
}
```

**Explication pas à pas :**
- `filter: 'mark'` signifie "cette règle s'applique à toutes les balises `<mark>`"
- `content` contient le texte à l'intérieur de la balise
- La fonction retourne le texte entouré de `==`

### Niveau 2 : Règle avec condition sur les classes CSS

**Objectif :** Convertir `<span class="important">texte</span>` en `!!! texte !!!`

```javascript
export function importantPlugin(turndownService) {
  turndownService.addRule("important", {
    // RECONNAISSANCE : Seulement les <span> qui ont la classe "important"
    filter: function (node) {
      return node.nodeName === 'SPAN' &&           // C'est un span ET
             node.classList.contains('important'); // Il a la classe "important"
    },
    
    // TRANSFORMATION : Entourer de points d'exclamation
    replacement: function(content) {
      return '!!! ' + content + ' !!!';
    }
  });
}
```

**Points clés à comprendre :**
- `node.nodeName` donne le nom de la balise HTML (SPAN, DIV, P...)
- `node.classList.contains()` vérifie si une classe CSS est présente
- La condition peut combiner plusieurs critères avec `&&` (ET) ou `||` (OU)

### Niveau 3 : Règle avec récupération d'attributs

**Objectif :** Convertir `<a href="https://example.com" title="Mon site">Lien</a>` en `[Lien](https://example.com "Mon site")`

```javascript
export function linkPlugin(turndownService) {
  turndownService.addRule("customLink", {
    // RECONNAISSANCE : Les balises <a> qui ont un attribut href
    filter: function (node) {
      return node.nodeName === 'A' && 
             node.getAttribute('href');  // Vérifie que l'attribut href existe
    },
    
    // TRANSFORMATION : Format Markdown des liens
    replacement: function(content, node) {
      const href = node.getAttribute('href');     // Récupère l'URL
      const title = node.getAttribute('title');   // Récupère le titre (optionnel)
      
      // Construction progressive du résultat
      let result = '[' + content + '](' + href;
      
      // Ajouter le titre s'il existe
      if (title) {
        result += ' "' + title + '"';
      }
      
      result += ')';
      return result;
    }
  });
}
```

**Nouveaux concepts :**
- `node.getAttribute('nom')` récupère la valeur d'un attribut HTML
- Les variables `href` et `title` stockent temporairement les valeurs récupérées
- La construction se fait étape par étape pour plus de clarté

### Niveau 4 : Règle complexe avec styles CSS

**Objectif :** Convertir `<span style="--ls:5">texte</span>` en `<span style="--ls:5">texte</span>` (garder tel quel)

```javascript
export function letterSpacingPlugin(turndownService) {
  turndownService.addRule("letterSpacing", {
    // RECONNAISSANCE : Spans avec la propriété CSS --ls
    filter: function (node) {
      return node.nodeName === 'SPAN' && 
             node.style.getPropertyValue('--ls') !== '';  // La propriété CSS existe et n'est pas vide
    },
    
    // TRANSFORMATION : Garder le HTML tel quel avec la valeur exacte
    replacement: function(content, node) {
      const lsValue = node.style.getPropertyValue('--ls');  // Récupère la valeur CSS
      return '<span style="--ls:' + lsValue + '">' + content + '</span>';
    }
  });
}
```

**Points avancés :**
- `node.style.getPropertyValue()` récupère une propriété CSS personnalisée
- Parfois on veut garder du HTML dans le Markdown final (c'est autorisé)
- La condition `!== ''` vérifie que la propriété n'est pas vide

## 🔧 Créer votre plugin personnalisé

### Étape 1 : Créer le fichier plugin

Créez un nouveau fichier dans `turndown-plugins/` (exemple : `mon-plugin.js`) :

```javascript
// turndown-plugins/mon-plugin.js
export function monPlugin(turndownService) {
  
  // Règle 1 : Vos citations personnalisées
  turndownService.addRule("mesCitations", {
    filter: function (node) {
      return node.nodeName === 'BLOCKQUOTE' && 
             node.classList.contains('citation-auteur');
    },
    replacement: function(content, node) {
      const auteur = node.getAttribute('data-auteur') || 'Anonyme';
      return '> ' + content + '\n>\n> — ' + auteur;
    }
  });
  
  // Règle 2 : Vos encadrés spéciaux
  turndownService.addRule("mesEncadres", {
    filter: function (node) {
      return node.nodeName === 'DIV' && 
             node.classList.contains('encadre-info');
    },
    replacement: function(content) {
      return '\n:::info\n' + content + '\n:::\n';
    }
  });
  
  // Ajoutez autant de règles que nécessaire...
}
```

### Étape 2 : Enregistrer le plugin

Ajoutez votre plugin dans `turndown-plugins/index.js` :

```javascript
// Ajoutez cette ligne avec les autres imports
export { monPlugin } from './mon-plugin.js';
```

**C'est tout !** Votre plugin sera automatiquement chargé avec les autres.

## 📋 Règles et bonnes pratiques

### Comment nommer ses règles

Utilisez des noms descriptifs qui expliquent ce que fait la règle :
- ✅ Bon : `"petitesCapitales"`, `"citationAvecAuteur"`, `"noteEnMarge"`
- ❌ Évitez : `"regle1"`, `"truc"`, `"machin"`

### Ordre des règles

Turndown applique les règles dans l'ordre où elles sont ajoutées. Si deux règles peuvent s'appliquer au même élément, la première ajoutée gagne.

**Conseil :** Mettez les règles les plus spécifiques en premier :

```javascript
// D'abord la règle spécifique
turndownService.addRule("spanSpecial", {
  filter: function (node) {
    return node.nodeName === 'SPAN' && node.classList.contains('special');
  },
  // ...
});

// Puis la règle générale
turndownService.addRule("spanGeneral", {
  filter: 'span',
  // ...
});
```

### Gestion des cas limites

Ajoutez des vérifications pour éviter les erreurs :

```javascript
replacement: function(content, node) {
  // Vérifier que l'attribut existe avant de l'utiliser
  const monAttribut = node.getAttribute('data-special');
  if (!monAttribut) {
    return content;  // Retourner le contenu tel quel si pas d'attribut
  }
  
  // Vérifier que le contenu n'est pas vide
  if (!content || !content.trim()) {
    return '';  // Retourner une chaîne vide
  }
  
  // Traitement normal
  return '[SPÉCIAL: ' + monAttribut + '] ' + content;
}
```

## 🚀 Exemples d'usage avancé

### Plugin pour notes en marge

```javascript
export function notesMargePlugin(turndownService) {
  turndownService.addRule("noteMarge", {
    filter: function (node) {
      return node.nodeName === 'ASIDE' && 
             node.classList.contains('note-marge');
    },
    replacement: function(content, node) {
      // Récupérer la position si elle existe
      const position = node.getAttribute('data-position') || 'droite';
      
      // Nettoyer le contenu (supprimer retours à la ligne multiples)
      const contenuNettoye = content.replace(/\n+/g, ' ').trim();
      
      return '[[MARGE-' + position.toUpperCase() + ': ' + contenuNettoye + ']]';
    }
  });
}
```

### Plugin pour tableaux personnalisés

```javascript
export function tableauxPlugin(turndownService) {
  turndownService.addRule("tableauSpecial", {
    filter: function (node) {
      return node.nodeName === 'TABLE' && 
             node.classList.contains('donnees-financieres');
    },
    replacement: function(content, node) {
      // Garder le HTML pour les tableaux complexes
      // (Markdown ne gère pas bien les tableaux avancés)
      return '\n' + node.outerHTML + '\n';
    }
  });
}
```

## 🐛 Débuggage et test de vos règles

### Vérifier qu'une règle fonctionne

Ajoutez des logs temporaires pour débugger :

```javascript
turndownService.addRule("maRegle", {
  filter: function (node) {
    const resultat = node.nodeName === 'SPAN' && node.classList.contains('test');
    
    // Log temporaire pour débugger (à supprimer après)
    if (resultat) {
      console.log('Règle appliquée à:', node);
    }
    
    return resultat;
  },
  replacement: function(content, node) {
    console.log('Conversion:', content, '→', resultat); // Autre log temporaire
    const resultat = '**' + content + '**';
    return resultat;
  }
});
```

### Tester vos règles

1. Activez l'éditeur sur votre document
2. Sélectionnez un élément qui devrait correspondre à votre règle
3. Cliquez sur le bouton de copie Markdown
4. Collez le résultat dans un éditeur de texte pour vérifier

### Erreurs courantes et solutions

**Ma règle ne s'applique jamais :**
- Vérifiez que votre condition `filter` correspond vraiment aux éléments HTML
- Ajoutez un `console.log` dans le `filter` pour voir quels éléments sont testés

**Ma règle produit du Markdown cassé :**
- Vérifiez les caractères spéciaux dans votre `replacement`
- Assurez-vous de retourner une chaîne de caractères valide

**Conflit entre mes règles :**
- L'ordre d'ajout des règles compte (première ajoutée = priorité)
- Rendez vos conditions `filter` plus spécifiques

## 💡 Conseils pour aller plus loin

### Étudier les plugins existants

Regardez les fichiers dans `turndown-plugins/` pour comprendre des techniques avancées. Par exemple, `footnotes-plugin.js` montre comment gérer des relations entre différents éléments HTML.

### Utiliser les ressources de Turndown

La documentation officielle de Turndown contient des exemples avancés : https://github.com/domchristie/turndown

### Penser à la réversibilité

Quand vous créez une règle de conversion, demandez-vous : "Si quelqu'un d'autre lit mon Markdown, comprendra-t-il ce que j'ai voulu dire ?" C'est le principe d'une bonne conversion.

### Tester avec du vrai contenu

N'hésitez pas à créer des exemples HTML complexes pour tester vos règles dans des situations réelles. Plus vous testez, plus vos règles seront robustes.

La création de règles Turndown demande de la pratique, mais c'est un excellent moyen de personnaliser votre éditeur selon vos besoins spécifiques. Commencez simple, puis ajoutez de la complexité au fur et à mesure de votre expérience !