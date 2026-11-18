# Page Aventure vers Preact : cartographie et plan (2026-11-18)

Point de départ mesuré (aperçu, partie tout débloqué, page Aventure, ~45 Ko de HTML, ~500 nœuds) : `__rafraichirPageIdleV1__` médiane 5,1 ms ; 0 nœud recréé par redessin ; `__auditerRedessinIdleV1__('aventure')` : seulement `disabled` perdu x1. Le morph tient déjà la page ; le gain de Preact est structurel (plus de chaîne HTML de la partie A, plus de `patch*` impératifs qui doublent le rendu), pas une grosse baisse de temps.

## (A) Rendu par composants (candidats Preact)

Rendu actuel : chaînes HTML dans `pageAventureIdleV28_` (`ui-aventure-1-v1.js`) et `pageInventaireIdleV28_` (`ui-inventaire-v1.js`), `ui-aventure-2-v1.js` (cartes, fiches, coffre).

| Zone | Où | Migration |
|---|---|---|
| Bascule Aventure / Titans (+ bouton « ??? » fermé, exception règle n°2) | `pageAventureIdleV28_` | lot 1 (fait) : composant `Bascule` |
| Sélecteur de zone (flèches, déclencheur, liste filtrée `unlocked`, couleurs/icônes `zones-personnalite`) | `pageAventureIdleV28_`, `patchZoneAdventureSansReflowIdleV1_` | lot 1 (fait) : composant `SelecteurZone` ; le patch impératif devient « re-monter avec la zone choisie » |
| Section « Un objet t'attend » (déblocages) | `pageAventureIdleV28_` | lot 1 (fait) : composant `Deblocages` |
| Équipement (paperdoll, accessoires), cartes du sac, coffre, bonus | `ui-inventaire-v1.js`, `ui-aventure-2-v1.js`, patchs `patch*InventaireIdleV160_` | lot 2 (NON fait) : les cartes portent des gestes (glisser-déposer, ghost, popups) qui lisent le DOM, un système de mutations optimistes et des patchs par action ; à migrer carte par carte (clé = id d'objet) seulement avec un banc de gestes ; risque élevé |
| Commandes manuelles (boutons de compétence) | `rendreCommandesAdventureIdleV3_` | reste impératif : `rafraichirCommandesAdventureIdleV3_` réécrit texte/classes/disabled à chaque tick (c'est du B) |

## (B) Impératif à haute fréquence : jamais Preact

- Scène de combat : `adventure-scene-v79.js` (bloc `.soreal-idle-v79-adventure-scene`, `data-morph-garder`, créé une fois par zone, barres `#sorealIdleAdventureFightBarV1`, `#sorealIdleAdventureJoueurBarV1`, libellés PV, cartes de stats) ; observateur d'entrée.
- Tick de combat `mettreAJourJeuIdleLocalV7_` / `ui-combat-*` : barres de vie, nombres, `combat-effets-v1.js` (minuterie 100 ms), `fond-combat-v1.js`, projectiles, fonds de zone (`adventure-fond-zone-v1.js`).
- Journal `#sorealIdleAdventureLogV1` : incrémental (lignes ajoutées/retirées à la main, défilement, flèches).
- Note de combat (`.soreal-idle-adventure-fight-note-v1`), panneau joueur vide : écrits par `poserNoteCombatAdventureIdleV1_` au tick ; Preact ne les possède pas (restent dans la chaîne).
- Boutons de compétence et Idle Mode (cooldowns) : écrits au tick.

Règle : Preact ne crée que des conteneurs `data-vdom` stables ; aucun nœud de (B) n'est enfant d'un composant Preact. Les lots 1 ne contiennent aucun nœud de (B) : bascule, sélecteur, déblocages sont disjoints de la scène, du journal et des commandes.

## Risques

1. Les attributs posés à la main sur un élément Preact (`open` du sélecteur, ajouté par `toggleMenuZoneAdventureIdleV1_` et retiré au clic extérieur) : Preact ne réécrit la `class` que si son propre vdom change ; le sélecteur garde donc une classe constante et l'état `open` reste impératif. Test dédié.
2. CSS en `> ` direct ou `:nth-child` sur la racine de page : les conteneurs `data-vdom` sont `display:contents`, le DOM des éléments reste frère direct de la racine.
3. Traducteurs du DOM : Preact compare avec son propre dernier rendu (pont) ; aucun nouveau texte joueur.
4. Replis : si Preact n'est pas chargé, l'ancienne chaîne HTML est conservée (aucune page vide).
5. Ordre d'insertion de la scène (`root.insertBefore(block, panneauJoueur)`) : le panneau joueur reste dans la chaîne, juste après les conteneurs.

## Ordre de migration

1. (fait) bascule, sélecteur de zone, déblocages.
2. Équipement (paperdoll) puis cartes du sac, une par une, avec banc de gestes ; suppression des `patch*` correspondants.
3. Coffre (hauteur animée : conteneur persistant, animation impérative).
4. Bonus d'équipement, résumés.
Jamais : scène, barres, journal, commandes de tick.
