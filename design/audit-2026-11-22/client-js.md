# Audit client JS (fluidité, rapidité, code mort) — 2026-11-22

Zone : `cloudflare/public/**/*.js`. Aucun commit, aucun push, pas de maj-pins / build-moteur-local / inventaire-visuels.

## Constat

Le client a déjà été audité plusieurs fois (IDLE-AUDIT-FE-007, audit du 2026-10-13, tm-bulles-canvas, alloc-pop, etc.) : presque toutes les
minuteries lisent `document.hidden` ou s'arrêtent seules, les boucles rAF récursives s'arrêtent quand leur cible quitte la page, les copies
profondes (`JSON.parse(JSON.stringify)`) ne sont que dans des chemins froids (admin, diagnostic, copie à l'envoi), `structuredClone` est préféré
dans l'inventaire. Gains restants : petits, sûrs.

## Mesures (dette du cliquet, `audit-architecture.mjs`)

| | avant | après |
|---|---|---|
| setInterval | 103 | 102 (plafond baissé à 102) |
| requestAnimationFrame | 106 | 106 |
| MutationObserver | 23 | 23 |
| createElement('style') | 98 | 98 |
| !important dans le JS | 348 | 348 |

Pas de mesure de banc avant/après : les corrections suppriment du travail uniquement en onglet caché, sans objet dans la page ou sur un
module non chargé en usage normal ; non mesurable par le banc Node (`banc-barres-hud-v1.js`), qui ne simule pas ces cas.

## Corrections

- `modules/valise-v1.js` : `pas()` (toutes les 250 ms) lisait la mise en page (`appliquer`, `aligner`, `getBoundingClientRect`) même onglet caché ;
  retour immédiat si `document.hidden`.
- `modules/borne-bandes-sync-v1.js` : le `setInterval` de 4 s balayait `document.getAnimations()` onglet caché ; il saute maintenant. Le rejeu après
  redessin (règle n°4) est inchangé.
- `modules/money-pit-page-v1.js` : l'observateur de TOUT le document (`surveillerYeuxIdleV1_`) lance un `querySelectorAll` à chaque lot de
  mutations ; retour immédiat par liste vivante (`getElementsByClassName('mp3-calques')`) quand aucune image du Money Pit n'est dans la page.
- `modules/textes-admin-v1.js` : l'observateur de TOUT le document (éditeur de textes admin, chargé pour tous) faisait un `closest` par mutation ;
  retour immédiat si l'éditeur n'existe pas.
- `modules/local-neural-piper-v1.js` : attente du phonémiseur par chaîne de `setTimeout` au lieu d'un `setInterval` (même cadence 50 ms, même
  délai 15 s) : dette setInterval -1.
- Essayé puis annulé : même conversion pour `purchase-sound-v1.js` (les tests lisent le code dans un bac à sable sans `setTimeout`).

## Code mort

Scripts (scratchpad, hors dépôt) : fichiers de modules jamais référencés ; fonctions déclarées jamais appelées ; `window.__X__` posées jamais lues ;
clés `localStorage` écrites jamais relues ; blocs commentés.

- Modules jamais chargés : AUCUN (les 260 sont dans `index.html`).
- `window.__X__` posées sans lecture : AUCUNE. Clés localStorage écrites sans lecture : AUCUNE.
- Blocs de code commenté en lignes `//` (4 lignes de code consécutives ou plus) : AUCUN.
- Fonctions jamais appelées, supprimées : `identifiantsPortes` et `identifiantsConfig` (`modules/inventory-configs-v1.js`, 6 lignes).
- Fonctions jamais appelées, CONSERVÉES (animations de la borne, catalogue des visuels, accord de Norman requis) : `meteores`, `chaineNuke`,
  `ultraNuke`, `pluieFusees`, `glitchNuke`, `armageddon`, `fissureBombardier` dans `modules/borne-led-v1.js`.
- Scènes de la borne désactivées volontairement le 2026-11-07 (egout, sweep, redroom, rire) : laissées, décision de Norman.

## Doutes / pistes non faites

- `textes-admin-v1.js` (127 Ko), `admin-histoires-v1.js` (82 Ko), `admin-tutoriel-v1.js` (40 Ko) sont chargés par `index.html` pour tout le monde :
  chargement à la demande pour l'administrateur seulement possible mais demande de modifier `index.html` (hors zone) ; gain au démarrage probable
  (~250 Ko de JS analysé en moins pour les joueurs). À décider avec le propriétaire d'index.html.
- `borne-bandes-sync-v1.js` : `document.getAnimations()` balaie tout le document à chaque redessin tant que la borne est là ; restreindre au sous-arbre
  de la borne risquerait de manquer les bandes du pupitre (SVG) : non fait.
- Heuristique « commentaire de code » : les gros blocs `/* ... */` du code sont de la documentation, pas du code désactivé.
- Les pins `?v=` des modules touchés sont à monter par `maj-pins.mjs` (non lancé, comme demandé).

## Tests

Nouveau : `cloudflare/tests/idle-audit-client-fluidite-2026-11-22-v1.test.mjs`. Tests de voisinage verts (anti-spoil-modules, coffre-sommeil,
money-pit-symetrie, fluidite-morph-traduction, redessin-invisible, baillements, phrases-coffre-valise, editeur-cadres-auto, inventory-configs-dessins,
garderie-etagere, purchase-*, piper-model-proxy). Le test `idle-audit-architecture-v1` ne passe que quand `maj-pins.mjs` est relancé (pins périmés
dus aux feuilles CSS modifiées par d'autres agents).
