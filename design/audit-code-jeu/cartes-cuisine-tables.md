# Audit code du jeu (build 1260) : tables de scène des Cartes et de la Cuisine

Date : 2026-11-16. Complète `cartes-cuisine.md` (qui laissait ces tables « NON VÉRIFIÉES »). Source jeu : champs sérialisés de `NGUIdle_Data/level0` (scène), extraits et comparés par script au code SOREAL réellement importé (`idle-cards-v1.js`, `idle-perks-v1.js`, `idle-quirks-v1.js`, `idle-wishes-v1.js`, `idle-difficulty-gates-v1.js`, `idle-cooking-v1.js`, `idle-adventure-v47.js`). Aucun fichier du moteur n'a été modifié.

## Verdict

**Aucun écart de gameplay sur les Cartes** : coûts, niveaux max, effet par niveau et difficulté exigée des 56 perks Itopod 161-216, des 71 quirks de type Cartes (99-169) et des 95 souhaits liés aux Cartes (115-186, 205-230, vitesse, deck, tags, générateur, BEEFY/WIMPY, Chonkers) sont **identiques** au jeu. Idem pour les 14 types de cartes (ordre, codes, noms), les paliers de rareté, les bornes de variance, et les 10 sets (cartes/cuisine). La Cuisine n'a aucune table de scène qui agisse sur le gameplay (ingrédients et plats = noms et textes seulement).

Écarts trouvés (tous hors gameplay des Cartes, un seul numérique) : 1 diviseur de souhait, 1 perk absent du catalogue, des noms cosmétiques.

## 1. Méthode (reproductible)

Les listes de la scène sont des tableaux Unity (compte `int32` puis éléments), `long[]` pour coûts et niveaux max, `float[]` pour les effets, `int[]` pour la difficulté. Retrouvées en cherchant dans `level0` des suites connues (coût du perk 161 = 150 000, etc.), puis validées par un contrôle croisé (232 perks, 186 quirks, 231 souhaits : 0 écart de coût / plafond / difficulté sur tout le catalogue hors les points ci-dessous, ce qui prouve que le décodage est le bon).

| Table | Position dans `level0` | Contenu |
|---|---|---|
| Perks (ItopodPerkController), 232 entrées | plafonds `long[]` @1987884 ; coûts `long[]` @1989744 ; noms `string[]` @1991600 ; effet par niveau `float[]` @1999044 ; descriptions @1999972 ; difficulté exigée `int[]` @2021456 | 0 = Normal, 1 = Evil, 2 = Sadistic |
| Quirks (BeastQuestPerkController), 186 entrées | plafonds @4011292 ; coûts @4012784 ; noms @4014272 ; effets `float[]` @4020296 ; difficulté @4037824 ; type @4040808 (23 = Cartes pour 99-169) | déjà extraits dans `quirks-questing.md` |
| Souhaits (WishesController.properties), 231 structures contiguës à partir de @2920300 | par élément : `maxLevel` (int64), `wishName`, `WishDesc`, `wishSpeedDivider` (float), `effectPerLevel` (float), `difficultyRequirement` (int : 1 Evil, 2 Sadistic ; 95 Evil + 136 Sadistic, **aucun Normal**, comme `idle-difficulty-gates-v1.js`), puis 3, sprite, 0 | |
| Ingrédients de cuisine (`IngredientProperty`), 20 entrées | @3721544 | multiplicateur d'unité (int), nom d'unité, nom, description, 3, sprite, 0 |
| Plats (`DishProperty`), 20 entrées | juste après | nom, description, 3, sprite, 0 |

Le champ de difficulté des souhaits est confirmé par `WishesController::wishEffect` (4938 : `rebirthDifficulty >= difficultyRequirement`, sinon renvoie 1) et `filterDifficulty` (4859).

## 2. Tableau des écarts (élément / champ / jeu / SOREAL)

### 2.1 Numériques

| Élément | Champ | Jeu | SOREAL | Gravité |
|---|---|---|---|---|
| Souhait 192 « I wish I could beat up more Bosses VII » | `wishSpeedDivider` | **6,0e25** (float 5,99999997e25 ; le VI vaut 2,0e25) | 4,00e26 (`idle-wishes-v1.js:245`, valeur du wiki) | Réel : ce souhait est 6,7 fois trop lent chez SOREAL (levels 20, effet 1 identique). Hors Cartes. |
| Perk 56 « MacGuffin Daycare! » | présence | existe : coût 5 000, plafond 1, difficulté Evil (1), `effectPerLevel` 0 (effet codé en dur) | **absent** du catalogue (`IDLE_PERKS_CATALOG_V1` saute de 55 à 57) | À traiter par le groupe MacGuffins/Daycare : l'effet du perk n'est pas lu ici. Hors Cartes. |

Aucun autre écart de coût, plafond, difficulté ou diviseur sur 232 perks, 186 quirks et 231 souhaits.

### 2.2 Valeurs de la scène lues pour les Cartes (toutes CONFORMES)

| Famille | Ids | Coût (jeu = SOREAL) | Plafond | Effet par niveau | Difficulté |
|---|---|---|---|---|---|
| Perks Tier Up I / II / III (13 types chacun) | 161-173 / 174-186 / 187-199 | 150 000 … 3 000 000 / ×10 / ×100 (identique ligne par ligne) | 1 | 1 (tier) | Evil (I), Sadistic (II, III) : table `IDLE_PERK_DIFFICULTE_V1` identique |
| Perks Faster Card/Mayo Generation I-IV | 200-207 | 200 000 / 2 000 000 / 20 000 000 / 200 000 000 | 10 | 0,005 / 0,004 / 0,003 / 0,003 | I Evil, II-IV Sadistic |
| Perks Bigger Deck I-III | 208-210 | 500 000 / 5 000 000 / 50 000 000 | 5 | 1 | Evil, Sadistic, Sadistic |
| Perk Extra Mayo Generator | 211 | 750 000 | 1 | 1 | Evil |
| Perks Better Tags I-IV | 212-215 | 200 000 / 1 000 000 / 5 000 000 / 20 000 000 | 10 | 0,0005 / 0,0004 / 0,0004 / 0,0004 | Evil, puis Sadistic |
| Perk Card Recycling: Card Spawn | 216 | 3 000 000 | 1 | 1 | Sadistic |
| Quirks Faster Card/Mayo I-IV | 138-145 | 2 000 / 6 000 / 15 000 / 40 000 | 10 | 0,005 / 0,004 / 0,003 / 0,003 | I Evil, II-IV Sadistic |
| Quirks Bigger Deck I-III | 146-148 | 5 000 / 14 000 / 42 000 | 5 | 1 | Evil, Sadistic, Sadistic |
| Quirks BIG CHONKER / Extra Mayo Generator / Extra Tag Slot | 149 / 150 / 151 | 38 888 / 25 000 / 20 000 | 1 | 1 | **Sadistic / Sadistic / Evil** (identique SOREAL) |
| Quirks Better Tags I-IV | 152-155 | 4 000 / 13 000 / 40 000 / 125 000 | 10 | 0,0005 / 0,0004 / 0,0004 / 0,0004 | Evil, puis Sadistic |
| Quirk Card Recycling: Mayo | 156 | 40 000 | 1 | 1 | Sadistic |
| Quirks Tier Up I-IV (types) | 99-137, 157-169 | identiques (ex. 99 = 5 000, 161 = 200 000) | 1 (I-III), 2 (IV) | 1 | identique |
| Souhaits Tier Up I-V | 115-153, 174-186, 205-217 | niveaux 1 / 1 / 1 / 2 / 2 (148 et 152 : 2) | idem | 1 | Evil / Sadistic identique (115-120 Evil, le reste Sadistic) |
| Souhaits vitesse (Mayo I-VI, Cartes I-VI) | 154-161, 222-225 | niveaux 10 | 10 | 0,005 / 0,004 / 0,003 ×… (identique) | 154-155 Evil, autres Sadistic |
| Souhaits Deck I-III, Générateur, Tag | 164-168 | niveaux 5 / 5 / 5 / 1 / 1 | | 1 | |
| Souhaits Tags mieux I-V | 169-173 | niveaux 10 | | 0,0005 / 0,0004 ×4 | |
| Souhaits BEEFY I-III, WIMPY I-III, CHONKIER, LESS NOT CHONKIER | 162, 163, 220, 221, 227, 228, 229, 230 | niveaux 1 / 1 / 1 / 1 / 2 / 2 / 5 / 5 | | 1 | Sadistic (sauf 162-163 : Sadistic selon table identique) |

Bonus de base des 14 types (`calculate*Effect`, déjà CONFORMES dans `cartes-cuisine.md`) : non repris.

### 2.3 Types de cartes (`getBonusName` 1741 / `getShortBonusName` 1742, ordre de l'énumération `cardBonus`)

| Index jeu | Nom jeu | Code jeu | SOREAL (id, code) | Verdict |
|---|---|---|---|---|
| 0 | Energy NGU Speed | E-NGU | energyNgu, E-NGU | OK |
| 1 | Magic NGU Speed | M-NGU | magicNgu, M-NGU | OK |
| 2 | Wandoos Speed | Wandoos | wandoos, WANDOOS | OK |
| 3 | Augment Speed | Augs | augments, AUGS | OK |
| 4 | Time Machine Speed | TM | timeMachine, TM | OK |
| 5 | Hack Speed | Hacks | hacks, HACKS | OK |
| 6 | Wish Speed | Wishes | wishes, WISHES | OK |
| 7 | Attack/Defense | A/D | stats, A/D | OK |
| 8 | Adventure Stats | Adv | adventure, ADV | OK |
| 9 | Drop Chance | Drops | drop, DROPS | OK |
| 10 | Gold Drops | Gold | gold, GOLD | OK |
| 11 | Daycare Speed | Daycare | daycare, DAYCARE | OK |
| 12 | PP Gain | PP | pp, PP | OK |
| 13 | QP Gain | QP | qp, QP | OK |

Ordre identique à `IDLE_CARDS_TYPES_V1`. Les 4 niveaux de rareté ressortent de `generateRarity` (1684) : bornes 0,90 / 1,00 / 1,08 / 1,14 / 1,17 / 1,19, 7 = Chonker (« BIG CHONKER » dans `getRarityName`), variance min 0,80 (0,85 avec `that70sComplete`), max 1,20 : toutes identiques à `IDLE_CARDS_RARITY_BANDS_V1` et `rarityMin/rarityMax`. Le type de chaque perk/quirk/souhait de tier a été recalculé depuis le NOM du jeu et comparé à la clé `cardTier_*` de SOREAL : 0 écart sur 56 perks / 71 quirks / 95 souhaits.

### 2.4 Cuisine : tables de scène (cosmétiques)

`CookingController.ingredientProperties` (20 entrées) et `dishProperties` (20 entrées) ne contiennent que : nom, description, nom d'unité, multiplicateur d'unité (affichage de `getIngredientAmount`), sprite. Chaque nouveau plat (`assignNewDish`, 2942) tire un plat au hasard (`Range(0,20)`) et **8 noms d'ingrédients DISTINCTS** au hasard parmi les 20 (retirés d'une liste au fur et à mesure). Les noms ne sont donc liés ni au slot ni au score : l'« absence de noms d'ingrédients » de SOREAL (slots numérotés) n'a aucun effet de gameplay. Noms, unités et multiplicateur d'affichage lus (index : nom (unité x multiplicateur)) : 0 Hot Sauce (ml x50), 1 Lobster (Kg), 2 Toothpaste (Tubes), 3 Rice (Cups x2), 4 MALK (Cartons), 5 Snake Oil (Bottle), 6 Mystery Meat (Handfuls), 7 A Pretzel (Pretzel), 8 Candy Canes (Canes), 9 Carrot (Carats), 10 Coconut Milk (ml x50), 11 Dry Spaghetti (Handfuls), 12 Eggs (Egg), 13 Flour (Cups), 14 Garlic (Cloves), 15 Lemon Juice (ml x50), 16 Onion (Onions), 17 Tomato (Tomatoes), 18 Bread (Loaves), 19 Coffee Grounds (Tbsp). Plats : A Rock., Apple Pie, Beans on Toast, Chocolate Fondue, East Dakota, Filet Mignon, Fried Cockroach, Fruit Bowl, Gagh, Jello, Kebabs, Korft Denner, MacGuffin Stew, An Entire Merry-Go-Round, An MRE, Nutri-paste, A Pie-ish, Cake-ish Thing., Ramen Noodles, Sushi! (les derniers éléments de la liste sont partiellement décodés ; texte seul, aucun effet). Les cibles, poids, durées, plafonds de la cuisine sont des constantes de l'IL (déjà CONFORMES, sauf les écarts listés dans `cartes-cuisine.md` §1.1).

### 2.5 Correspondance sets ↔ champs `ItemList` (`ItemList::maxxed*`, ids d'objets)

Les drapeaux « set complet » sont posés par `AllItemListController` (3406) via les méthodes `ItemList::maxxed*` ; ids d'objets du jeu = `wikiItemId` de SOREAL :

| Champ jeu | Méthode | Ids d'objets jeu | Set SOREAL | Verdict |
|---|---|---|---|---|
| `rockLobsterComplete` | maxxedRockLobster (3478) | 416-423 (8) | rock | identique (même 8 ids, 8 pièces) |
| `radComplete` | maxxedRad (3469) | 345-351 (7) | rad | identique |
| `amalgamateComplete` | maxxedAmalgamate (3482) | 469-476 (8) | amalgamate | identique |
| `duckComplete` | maxxedDuck (3480) | 496-503 (8) | duck | identique |
| `that70sComplete` | maxxed70sZone (3476) | 400-407 (8) | disco | identique |
| `spaceComplete` | maxxedSpace (3472) | 373-379 (7) | space | identique |
| `breadverseComplete` | maxxedBread (3475) | 392-399 (8) | bread | identique |
| `blueHeartComplete` | maxxedBlueHeart (3449) | 196 (heartBlue) | Blue Heart | identique |
| `rainbowHeartComplete` | maxxedRainbowHeart (3473) | 390 (heartRainbow) | Rainbow Heart | identique |
| `beatingHeartComplete` | maxxedBeatingHeart (3474) | 391 (stillBeatingHeart) | Still-Beating Heart | identique |

La correspondance supposée dans `cartes-cuisine.md` §3 est donc confirmée.

## 3. Correctifs exacts

### 3.1 À faire (gameplay)

1. `cloudflare/src/idle-wishes-v1.js` ligne 245 (souhait 192) : `speedDivider: 4.00e26` devient `speedDivider: 6.00e25`, avec commentaire « lu dans la scène du jeu (build 1260, WishProperties.wishSpeedDivider) ». Vérifier ensuite si un test fixe 4e26 (`grep -rn "4e+26\|4.00e26" cloudflare/tests`) et si les `parties-reference` bougent (régénérer seulement si le changement est voulu).
2. (hors Cartes, à transmettre au groupe MacGuffins/Daycare) ajouter le perk 56 « MacGuffin Daycare! » (coût 5 000, plafond 1, difficulté Evil, `effectPerLevel` 0 : effet à lire dans l'IL) ou décider de l'omettre explicitement.

### 3.2 Optionnel (cosmétique : noms du jeu différents du wiki ; toucher un texte lu impose de régénérer les voix, voir la mémoire du projet)

| Élément | Nom du jeu | Nom SOREAL |
|---|---|---|
| Perks 165 / 178 / 191 | Magic NGU Speed Card Tier Up I / II / III | Magic NGU Card Tier Up I / II / III |
| Perks 169 / 182 / 195 | Energy NGU Speed Card Tier Up I / II / III | Energy NGU Card Tier Up I / II / III |
| Perks 36-40 | Adv. Training Level Bank I-V | Advanced Training Level Bank I-V |
| Perks 105-106 | Gooder Idle Questing! / Another Gooder Idle Questing! | sans « ! » |
| Perks 113-115 | … Hack Milestone Reducer I | … Milestone Reduces I |
| Perks 145-146 | Bonus Quest Handin Progress | Progess (coquille du wiki) |
| Souhait 56 | I wish I had more Resource 3 Bar III | … Bars III |
| Souhaits 155 / 157 / 159 / 161 | I wish Cards Spawned Faster I-IV | I wish my Cards Spawned Faster I-IV |
| Souhait 139 | I wish my QP Tier was higher II | … my QP Card Tier … |
| Souhait 215 | I wish my TM Speed Card Tier was higher V | I wish my TM Speed Tier was Higher V |
| Souhait 202 | I wish I was a sneak preview of 4G's next Idle game | texte SOREAL volontaire (Norman & Sébastien) : ne pas toucher |
| Quirks 147 / 148 | tous deux « Bigger Deck II » | « Bigger Deck III » pour 148 (déjà noté) |

## 4. Non extrait / limites

- **Effet par niveau des perks à effet codé en dur** : la table de scène donne `effectPerLevel` = 1 pour les perks 87 (« Not So Minor Anymore »), 105/106 (Gooder Idle Questing), 34 (Bonus Titan EXP) et 0,005 pour le 90 (Improved Quest Looting), alors que SOREAL stocke 2 / 2 / 3 / 0,5 (en %). Le jeu applique des multiplicateurs codés dans l'IL (`1246`, `1248`, `1260`: ex. « niveau x 2 » pour 105), donc ce n'est pas un écart avéré ; l'équivalence 87/105/34 n'a pas été re-dérivée ici (groupe Questing, voir `quirks-questing.md` §3). Idem perks 109/110 et quirk 54 (réduction de souhait : 24 s par niveau dans le code, la scène donne 1).
- **Souhait 0** (« wishes kicked ass », 10 bonus) : la scène donne `effectPerLevel` 1 ; les 100 % / 20 % / 5 % sont codés dans les consommateurs, non revérifiés.
- **Noms de cartes générés** (adjectifs, verbes, noms des `generateCardName` / `sentence1..15`) : textes seulement, non extraits.
- **Dernières entrées de la liste des plats** (indices ~17-19) : décodage partiel (stride différent), texte uniquement.
- Les `maxLevel` des souhaits sont lus d'une structure sérialisée dont le premier champ est le plafond de l'élément SUIVANT du flux binaire ; la cohérence a été validée sur 231 souhaits (aucun écart de niveaux avec le catalogue SOREAL, qui vient du wiki).
- Scripts de l'audit (non versionnés, dans le scratchpad de session) : `cc/lib.mjs`, `cc/cmp1.mjs`, `cc/cmp3.mjs` ; JSON extraits : `perks-jeu.json`, `quirks-jeu.json`, `wishes-jeu2.json`.
