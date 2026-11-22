# Audit CSS / HTML / statiques / outillage (2026-11-22)

## Code mort CSS
Outil : script d'analyse hors dépôt (parse des 44 feuilles, règles dont un nom de classe/id n'apparaît dans aucun JS/HTML/src, en tenant compte des préfixes construits dynamiquement).
Résultat : les feuilles sont très propres. 0 règle dupliquée à l'identique, 0 feuille chargée à tort, 1 feuille non liée (voir plus bas).
Supprimé (1,3 Ko, 14 règles) : `.alb-fermer`, `.alb-leger-dos` (album) ; `.or-manque-v1` (itopod) ; `.dfi-cadres/-sous/-objectif/-description/-restriction/-conseil/-liste` (themes) ; `#sorealIdleRestImageHostV43` (+ img) et `.selection-mode` (ui). Dont 8 `!important` en moins (dette 2517 -> 2508).
Plafonds baissés dans `audit-architecture.mjs` : !important 2508 ; lignes album 263, itopod 2121, themes 2356, ui 6271.
Laissé par prudence : règles `.soreal-idle-dome-v1` / `.dome-start|stop|nuke` (≈8,8 Ko dans itopod.css, plus aucun élément dans le JS mais des tests lisent la CSS : idle-itopod-style, idle-boutique-ap-anti-spoil) ; `.lp-roue/-nacelle/-etoile/-ballon/-fanion/-wagon` (portent des animations, catalogue des visuels) ; `soreal-idle-jeu-global.css` (12,7 Ko, jamais liée dans index.html ni créée par le JS ; un test affirme même qu'elle n'est pas chargée : candidate à suppression, décision de Norman, aucune @keyframes dedans).
Numéros ?v= : à monter (maj-pins.mjs non lancé) pour ui, themes, album, itopod css.

## Fichiers statiques
Aucun fichier de `public/` jamais référencé : les ~450 « sans nom de base » trouvés (magic/boss/N.webp, perks/N.webp, dos-cartes/boss-N|titan-N, cthulhu/*, voice-en/intro-NN) sont construits dynamiquement. Un seul douteux : `img/mineurs/labos/serpentin.webp` (17 Ko, cité seulement dans design/PROMPT-*.md) : laissé.

## Chargement
Au démarrage : 44 CSS = 2 498 Ko, 254 JS = 6 376 Ko (avant/après : CSS -1,3 Ko, rien d'autre ; pas de doublon de <link>/<script>, polices Bangers/Russo préchargées, tous les scripts `defer`, ordre intact).
`_headers` corrigé : `/moteur-local-worker-v1.js` (1,8 Mo) et `/sql-wasm-v1.wasm` (0,7 Mo) passent en `immutable` (adresses déjà versionnées par ?v=<hash>) ; `/items/*`, `/titans/*`, `/player/*` en 7 j + stale-while-revalidate (jamais remplacés sous le même nom dans git).
Pistes NON appliquées (risque) : rendre les ~40 feuilles hors cœur non bloquantes pour afficher l'écran de chargement plus tôt (les 2,5 Mo de CSS bloquent le premier rendu) ; `voice/*` et `voice-en/*` restent sans cache long (régénérés souvent).

## Outils jamais référencés (ni workflow, tests, scripts, docs) : signalés seulement
tools : balayer-animations-lourdes.mjs, build-cthulhu.py, decouper-machine-v3.mjs, deployer-local.mjs (cité en mémoire de Norman), detourer-machine-v2.mjs, essai-local-ngu-complet.mjs, gabarits-machine-v2.mjs, gen-pcb-puissance-v1.mjs, mesurer-skins-garderie.py, preparer-portes-ygg-v1.py, voix-en-intro-v1.py, voix-en-statiques-node-v1.mjs ; bench : banc-rendu-machine-v1.mjs, bench-copie-aventure-v1.mjs, bench-reponse-v1.mjs. Plus des dizaines de captures .png dans tools/banc-vrai-jeu/.
