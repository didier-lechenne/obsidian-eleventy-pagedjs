# Type Craft

## Fonctionnalités principales

**Édition typographique fine :**
- **Sauts de ligne manuels** : Shift + Entrée pour forcer des retours à la ligne
- **Espacement des lettres** : Shift + molette pour ajuster l'espacement en temps réel
- **Espaces insécables** : Shift + Espace (normal) ou Shift + Ctrl + Espace (fine)
- **Formatage** : Shift + B (gras), Shift + I (italique)
- **Guillemets français** : Remplacement automatique de `>>` et `<<` par `»` et `«` avec espaces fines

**Interface d'édition :**
- Mode édition activable/désactivable via un toggle
- Sélection visuelle des éléments éditables (surbrillance bleue)
- Système d'identifiants uniques pour chaque élément éditable
- Copie automatique du contenu modifié vers le presse-papier (HTML ou Markdown)

## Architecture modulaire

Le code est organisé en modules spécialisés :

- **StateManager** : Gestion de l'état global (mode édition, élément actuel)
- **FormattingModule** : Formatage gras/italique avec préservation du contenu original
- **LetterSpacingModule** : Contrôle de l'espacement via propriétés CSS custom
- **TextInputModule** : Gestion des caractères spéciaux et remplacements automatiques
- **EventsModule** : Centralisation de tous les événements clavier/souris
- **ClipboardModule** : Export vers le presse-papier avec conversion Markdown
- **CleanupModule** : Suppression sélective des modifications



```
typeCraft/
├── config.json
├── typeCraft-hook.js
├── typeCraft.js
└── modules/                      
    ├── state.js                   # Gestion de l'état global
    ├── formatting.js              # Formatage texte (gras, italique)
    ├── letterSpacing.js           # Espacement des lettres
    ├── textInput.js               # Saisies spéciales (espaces, guillemets)
    ├── clipboard.js               # Presse-papiers avec Markdown
    ├── events.js                  # Gestion événements clavier/souris
    └── cleanup.js                 # Nettoyage des éléments
```


## 🔗 **Interface avec cssPageWeaver**


```javascript
let toggleInput = cssPageWeaver.ui.typeCraft.toggleInput

toggleInput.addEventListener('input', () => {
  typeCraft().edit() 
})
```



## Licence

The MIT License (MIT)