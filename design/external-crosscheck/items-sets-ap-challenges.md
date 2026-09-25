# Contrôle croisé : objets, sets, boutique AP (4G's Sellout Shop), défis

Date : 2026-09-25. Lecture seule : aucun fichier du jeu modifié. Écarts détaillés en JSON dans `items-sets-ap-challenges.json` (même dossier). Scripts d'analyse sous `%LOCALAPPDATA%\Temp\claude\xc\` (hors dépôt, scripts `cmp_*` et `items_*`).

Sources confrontées :
- **Jeu** : `cloudflare/src/idle-adventure-v47.js` (SETS, SPECIALS, SETS_OBJETS_V1, catalogue, butin), `idle-adventure-set-specials-v1.js`, `idle-sellout-shop-v1.js`, `idle-ngu-progression.js` (défis, bonus permanents), `idle-achievements-v1.js`, `idle-daycare-v1.js`, `idle-sqlite-runtime.js` (NUKE), `public/soreal-idle-ui.js` (client : Auto Nuker, Ultimate/Parry/Charge, emplacements).
- **Wiki local** (référence n°1) : 427 pages d'objets (gabarit « Item data » : Id, type, set, drop, effectiveness, daycare, stats et specials Base / niveau 0 / niveau 100, points), 75 pages `(set)`, `4G's Sellout Shop`, `Challenges`, `Inventory`, `Boss Fights`, `Secrets and Spoilers`, `Skills`, `Augmentations`, `Wishes`, `THE END`.
- **Tierce** : `ngu-idle-calculators-ts` (`items.ts` 487 objets, `sets.ts` 73 sets (72 comparés), `apItems.ts` 75 objets AP, `challenges.ts` 33 défis).

Méthode : import direct des modules du jeu sous Node 24 (aucune re-saisie), extraction structurée des fiches wiki, appariement par identifiant d'objet du wiki (`wikiItemId`), comparaison exhaustive valeur par valeur ; les effets sont suivis dans le code (`setRewards`, `completedSets`, `purchases`, `completionsTier`) jusqu'à un lecteur réel. Des simulations (`addItem`, `equip`, `idleAdventureEquipmentStatsV47`) confirment deux comportements (C02, C04).

---

## (D) Résumé chiffré

| Catégorie | Entrées | Jeu = wiki | Jeu = source tierce | Remarques |
|---|---|---|---|---|
| Objets : appariement | 406 dans le jeu (284 pièces d'équipement, 122 accessoires/consommables/cube) ; 427 pages wiki | 406/406 par id | 406/406 (mêmes ids que `items.ts`) | 21 pages wiki sans équivalent : voir A1 |
| Objets : Power/Toughness | 2 136 valeurs (Base value, max niveau 0, max niveau 100) | 2 136/2 136 | 1 écart de nature wiki (Regular Tie) | base 82 > plafond 81,5 dans le wiki lui-même (B03) |
| Objets : Specials | 3 816 valeurs (type, base, max niv. 0, max niv. 100) | 3 816/3 816 | 1 écart réel (Battle Corgi) + 8 arrondis | B01, B05 |
| Objets : évolutions | 19 | 19/19 | n/a | Forest Pendant x9, Looties, Cane, Flubber, Gerbil |
| Objets : taux Daycare | 321 (les autres : « = ? » sur le wiki) | 321/321 | n/a | 106 objets sans taux publié, refusés par le jeu |
| Objets : noms | 406 | 388/406 | n/a | 12 noms français (Training, Sewers), 6 articles retirés (B10) |
| Objets : niveau de drop | 447 lignes du profil de butin (équipement et accessoires) | 447/447 (« lvl 0-1 » des pièces Edgy = niveau 1 de la page de zone) | n/a | B15 : Severed Unicorn's Head, deux pages du wiki se contredisent |
| Sets : présence | 71 pages `(set)` réelles (75 avec 4 redirections) | 68 sets modélisés + 3 à effet sans entité set | 70 sur 71 comparables (Duck erroné dans `sets.ts`) | 1 set du jeu sans page wiki (BOTH Edgy Boots) |
| Sets : composition | 68 | 68/68 (ids d'objets) | 70/71 | `sets.ts` : Duck (ids 450-453 en trop), Halloweenie (objets absents de `items.ts`) |
| Sets : Power/Toughness totaux | 44 sets d'équipement | 44/44 | n/a | somme des pièces = total de la page |
| Sets : Specials totaux | 43 | 43/43 | n/a | Training n'a aucun Special |
| Sets à portrait : bonus de complétion | 42 | 40 câblés, 1 non câblé (Exile), 1 ambigu (Western) | n/a | tableau plus bas |
| Boutique AP : lignes | 75 lignes wiki = 81 entrées jeu (lots x1/x10/x100 séparés) | 81/81 (nom, effet, coût, paliers, maximum) | 75/75 (noms) | 0 écart de prix ou de maximum ; 2 noms désambiguïsés (« (bis) », « (dernier) ») |
| Boutique AP : achetable | 81 | 67 achetables | n/a | 14 lignes sans effet (C11) |
| Défis : lignes | 33 (11 défis x Normal / Evil / Sadistic) | 33/33 (max, boss cible, pas par complétion, EXP, AP) | 12 effets modélisés par `challenges.ts`, 12/12 identiques | la source tierce ne modélise ni EXP, AP, ni cibles |
| Défis : récompenses permanentes | toutes les lignes de la page | câblées sauf 4 (C05 à C08) | n/a | Troll (effets périodiques), Blind (masquage), Laser Sword +0,05, 24 Hour +1 EXP |

**Conclusion du domaine** : les données brutes (stats, specials, sets, prix, cibles, EXP/AP) sont **identiques au wiki** sur tout le périmètre contrôlé. Les écarts qui comptent pour le gameplay ne sont pas des chiffres mais des **mécaniques** : Effectiveness, seconde arme, specials secondaires des accessoires qui ne montent pas avec le niveau, effets de Troll et de Blind, Laser Sword.

---

## (A) Manquants

### A1. Objets du wiki absents du jeu (21)

| Id | Nom | Type | Drop (wiki) | Stats (niveau 0 / niveau 100) |
|---|---|---|---|---|
| 342 | Blue Eyes Ultimate Chestplate | Chest | Exile (Easy+) niveau 0, chaîne secrète (0,0001 % depuis la Sack, selon WORKLOG) | Power 5 500 000 / 11 000 000 ; HP Max 16,5 M / 33 M ; Toughness 160 M / 320 M ; HP regen 4,8 M / 9,6 M. Specials : Hack Speed 20 % / 40 %, Resource 3 Cap 120 % / 240 %, Wish Speed 25 % / 50 %. Daycare 168 h par niveau. `items.ts` 342 : mêmes valeurs au niveau 0 |
| 335 | Seal of the Exile | Weapon | aucun | fiche vide |
| 336 | Face of the Exile | Consommable | Exile (Easy+), niveau 100 | aucune |
| 341 | Sack of the Exile | Consommable | Exile (Easy+), niveau 100 | aucune |
| 337, 338, 339, 340 | Tentacle / Antlers / Buster / Antennae of the Exile (Clue) | Consommable | aucun | aucune (les accessoires homonymes 330, 328, 334, 332 existent dans le jeu) |
| 179 | A Crumpled Note | Consommable | Skeleton Guardian (avant la Bête), niveau 100 | aucune |
| 180 à 183 | The First / Second / Third / Final Clue! | Consommable | Bête (First : Ring of Apathy niveau 69 équipé puis UUG) | aucune |
| 288 | The Death Note | Consommable | Godmother (Easy+), niveau 1 | aucune |
| 367 à 371 | A Well Done Steak With Ketchup, Pickle Ice Cream, A Can of Surstromming, A Jar of Marmite, Pizza With Pineapple | Consommable | niveau 1 : Beardverse, Clock Dimension, Chocolate World, Pretty Pink Princess Land, JRPGVille | aucune |
| 372, 387 | GLOP, GLOP Recipe | Consommable | recette | GLOP : Daycare 24 h par niveau |

Seul l'objet 342 porte des stats de combat. Le reste est de la mécanique de quête/cuisine sans chiffre publié, déjà classée « non fait » dans `docs/WORKLOG.md`. Non comptés comme manquants : les 16 pièces de THE END (fin du jeu), les 22 fragments MacGuffin (moteur `idle-macguffins-v1.js`), les 10 objets de quête (moteur `idle-questing-v1.js`), les 39 boosts.

### A2. Sets du wiki sans entité set dans le jeu (3, effets présents)

- **Tutorial Cube (set)** : 10 000 AP et déblocage de l'Infinity Cube. Câblé dans `record()` (`setRewards.ap += 10000`, `cube.unlocked`).
- **Red Liquid (set)** : -20 % du cooldown global et de l'idle attack. Câblé via `redLiquidMaxed` (client 800 ms, idle 0,8 s).
- **Purple Liquid (set)** : Beast Mode +50 % au lieu de +40 %. Câblé via `purpleLiquidMaxed` (client 1,5 / 1,4).

### A3. Boutique AP

Aucune ligne manquante. Exclue volontairement (décision de Norman, argent réel) : la section « Packs » (5 packs réguliers, Pack of Pissed Off Dudes, Resource 3 Pack, Sexy Player Fashion Pack 200 000 AP).

### A4. Défis

Aucun défi ni chiffre absent. Restrictions absentes : effets périodiques du Troll Challenge et masquage du Blind Challenge (C07, C08).

---

## (B) Écarts wiki / source tierce / jeu

Aucun écart de valeur entre le jeu et le wiki, hors les coquilles du wiki reprises telles quelles (B01, B02, B03) et quelques ambiguïtés de texte :

| Id | Objet / champ | Wiki | Source tierce | Jeu | Gravité |
|---|---|---|---|---|---|
| B01 | A Battle Corgi (`western:corgi`), NGU Speed niveau 0 | 500 % (points 6 000 000 = 600 % ; niveau 100 : 1 200 %) | 600 | `[500, 500, 1200]` | faible : niveau 0 sous-évalué de 100 points de % |
| B02 | StnaP s'rerednaW (`rerednaw:legs`), Magic Bars et Magic Cap, « Base value » | 1 600 % et 170 % alors que niveau 0 = 800 % et 85 % (base = niveau 100) | n/a | `[1600, 800, 1600]` et `[170, 85, 170]` | faible à moyenne : la valeur démarre AU-DESSUS du plafond du niveau 0 (formule `base + (cap - base) x fraction`) puis décroît avec les boosts jusqu'à 800 / 85 |
| B03 | A Regular Tie (`jake:tie`), Toughness et HP regen | base 82 > plafond niveau 0 81,5 ; 2,46 > 2,445 | 82 | base 82, plafond 81,5 | nulle |
| B04 | Heart Shaped Panties, max niveau 100 | 1 333 (2 x 667 = 1 334) | 666,6666 | 667 puis 1 334 | nulle (arrondi) |
| B05 | Source tierce : 9 valeurs de Specials, 1 de Toughness | valeurs arrondies | non arrondies (Beanie 185, Infinity Charm 888,8888, Panties 333,3333...) | = wiki | nulle |
| B06 | `sets.ts` Halloweenie | 8 objets 408-415 | le set les référence mais `items.ts` n'a AUCUN objet 408-415 | 8 pièces | lacune de la source tierce |
| B07 | `sets.ts` Duck | ids 496-503 | `[496,497,498,499,450,451,452,453]` (450-453 = Link Cable, Hand Cursor, Rad Mixtape, Hardhat) | correct | bug de la source tierce |
| B08 | Boost 5000 dans The Breadverse | présent (5000 et 10000) | seul le 10000 | 5000 et 10000 | le jeu suit le wiki |
| B09 | 6 objets dont la colonne Points contredit la colonne % (Battle Corgi, Cheap Plastic Amulet, Bearded Axe, LootzL...OOt, Slimy Chest, The Number 7) | coquilles de la colonne Points | % identiques | utilise les % | nulle |
| B10 | Noms | - | - | 388/406 identiques ; 12 français (Training, Sewers) ; 6 articles retirés (Tutorial Cube, Tuba of Time, Wandoos 98, Beard Comb, Shrunken Voodoo Doll, Wandoos XL) ; le catalogue exporté porte des noms génériques (« Sewers Set head ») | nulle |
| B11 | Evil No Equipment, total d'emplacements | Challenges : « 12 inventory spaces total » ; Inventory : 24 | n/a | 3 x 5 + 9 = 24 | le jeu suit la page Inventory |
| B12 | Emplacements d'accessoire de la boutique | Inventory : « last two require Evil difficulty » ; Shop : un seul verrou explicite | n/a | verrou sur Special 3 seulement | ambigu, voir E04 |
| B13 | Red Liquid (set) | set : « -20 % on the global cooldown timer, AND for idle attack speed » ; objet : « 20 % faster idle attack speed » | n/a | durées x0,8 (= +25 % de vitesse) | faible |
| B14 | Prix Resource 3 Potion δ | 40 000 AP (= β ; α = 4 000) | n/a | 40 000 | nulle (reproduit le wiki) |
| B15 | A Severed Unicorn's Head, niveau de drop | fiche : niveau 1 ; section Loot du titan : niveau 0 garanti | n/a | niveau 0 | faible (déjà documenté dans le code) |

Contrôles sans écart : les 406 objets (Power/Toughness/Specials), 43 totaux de Specials par set, 321 taux Daycare, 19 évolutions, paliers de boosts par zone (35 zones, seul Breadverse diffère de la source tierce, à raison), les 75 lignes de la boutique (dont le total de 1 411 500 AP des 166 emplacements d'inventaire et 560 000 AP des 7 loadouts), les 33 lignes de défis.

### Tableau des 42 sets à portrait

Pièces et totaux Power/Toughness identiques au wiki (colonne « = »), bonus wiki, état du bonus dans le jeu.

| Set | Pièces | Power total | Toughness total | = wiki | Bonus de complétion (wiki) | État du bonus dans le jeu |
|---|---|---|---|---|---|---|
| training | 5 | 6 | 8 | = | +2 Energy Speed, 10 EXP | OK |
| sewers | 7 | 52 | 52 | = | +5 P, +5 T, +15 HP, +0,2 regen, 20 EXP | OK |
| forest | 7 | 176 | 176 | = | 2 potions Energy α, 2 β, 2 Bar Bar, +5 Energy Power, 200 EXP | OK (potions et Bar Bar livrés via la boutique) |
| cave | 8 | 470 | 470 | = | +2 Magic Power, +2 Magic Bars, +40 000 Magic Cap, 300 EXP | OK |
| hsb | 7 | 1 090 | 1 090 | = | +3 MP, +3 MB, +30 000 Magic Cap, 500 EXP, potions Magic α/β, Bar Bar | OK |
| grb | 7 | 3 120 | 2 660 | = | 2 000 EXP, Safe Zone regen x10 (au lieu de x5) | OK |
| clock | 7 | 6 080 | 4 840 | = | 1 000 EXP, spawn des ennemis +5 % plus rapide | OK |
| 2d | 7 | 10 960 | 7 310 | = | 2 000 EXP, +7,43 % drop | OK |
| spoopy | 7 | 20 396 | 11 070 | = | 3 000 EXP, Idle attack = multiplicateur de l'attaque normale | OK |
| jake | 7 | 26 540 | 13 561 | = | 7 000 EXP, Wandoos MEH | OK |
| gaudy | 5 | 42 060 | 19 800 | = | 5 000 EXP, 2 Lucky Charms, +10 % de chance de +1 niveau au drop | OK |
| mega | 5 | 90 400 | 44 800 | = | 6 000 EXP, Charge x2,2 | OK (client) |
| beardverse | 5 | 175 000 | 111 000 | = | 8 000 EXP, pénalité de Beards multiples -10 % | OK (x0,9) |
| wanderer | 4 | 8 000 | 184 000 | = | 50k EXP, 10k AP, débloque Fanny Pack | OK |
| rerednaw | 4 | 8 000 | 180 000 | = | 50k EXP, 10k AP, débloque Dorky Glasses | OK (legs : coquille du wiki, B02) |
| badly | 5 | 1 000 000 | 530 000 | = | 30k EXP, 5k AP, boosts +20 % efficaces | OK |
| stealth | 5 | 2 040 000 | 1 054 000 | = | 50k EXP, 10k AP, débloque The Stealthiest Armour | OK |
| slimy | 5 | 4 484 000 | 2 154 000 | = | 100k EXP, 10k AP, Parry x3 | OK (Parry x3, client) |
| choco | 5 | 7 780 000 | 3 286 000 | = | MacGuffin Stat, Energy/Magic Bar Bar (accessoires), -10 % de kills par MacGuffin | OK |
| edgy | 5 | 11 700 000 | 4 094 000 | = | 250k EXP, +1 emplacement MacGuffin | OK |
| pinkprincess | 6 | 16 400 000 | 7 614 000 | = | +10 % PP | OK |
| greasynerd | 5 | 22 580 000 | 10 440 000 | = | MacGuffins +1 niveau au drop | OK |
| meta | 7 | 54 371 714 | 23 171 714 | = | +20 % NGU Speed | OK |
| party | 7 | 109 000 000 | 46 000 000 | = | +5 % Total Diggers Level Bonus | OK |
| mobster | 7 | 218 200 000 | 103 000 000 | = | +15 % QP | OK |
| typo | 7 | 362 133 332 | 172 333 332 | = | +20 % Wish Speed | OK |
| fad | 7 | 585 200 000 | 278 000 000 | = | Major Quests +10 % plus rapides, 3 Beast Butters | OK |
| jrpg | 7 | 913 800 000 | 442 000 000 | = | Ultimate Attack 5,01 -> 7,01 | OK (client) |
| exile | 5 | 1 257 800 000 | 518 000 000 | = | « Unlocks something secret! » | NON câblé (chaîne secrète Sack/Face absente, C09) |
| rad | 7 | 2 227 200 000 | 1 100 000 000 | = | +5 Max Deck Size | OK |
| backtoschool | 7 | 2 928 800 000 | 1 606 000 000 | = | +15 % NGU Speed | OK |
| western | 7 | 3 788 000 000 | 2 174 000 000 | = | « An Extra Drop in this zone! » | AMBIGU (seul A 9mm Beretta est câblé, C10) |
| space | 7 | 4 952 400 000 | 2 240 000 002 | = | +10 % Cooking EXP | OK |
| bread | 8 | 16 524 000 000 | 5 080 000 000 | = | Faster Cooks!! | OK |
| disco | 8 | 22 076 601 000 | 6 820 000 000 | = | Less crappy cards! (rareté minimale 0,85) | OK |
| halloweenie | 8 | 31 331 600 000 | 9 226 000 000 | = | +45 % PP | OK |
| rock | 8 | 45 340 800 000 | 13 328 000 000 | = | +1 tier à TOUTES les cartes | OK |
| construction | 8 | 87 119 800 000 | 23 276 000 000 | = | +20 % d'efficacité des boosts | OK |
| duck | 8 | 123 080 000 000 | 32 100 000 000 | = | +6 % vitesse Mayo et Cartes | OK |
| dutch | 8 | 166 160 000 000 | 45 680 000 000 | = | +25 % vitesse des rituels de Blood Magic | OK |
| amalgamate | 8 | 229 820 000 000 | 55 600 000 000 | = | +10 Max Deck Size | OK |
| pirate | 8 | 289 540 000 000 | 72 200 000 000 | = | « Pride and Accomplishment. » (texte, aucun chiffre) | OK |

Les 21 autres sets et objets-sets (Uug, Scrap of Paper, Edgy Boots, cœurs, Number, Seed, Armpit, Flubber, Wandoos, Wandoos XL, etc.) sont tous modélisés avec leur bonus.

---

## (C) Effets présents mais non branchés (ou branchés de façon divergente)

| Id | Effet | Constat | Gravité |
|---|---|---|---|
| C01 | **Effectiveness** des objets (« X is 100% effective when you've slayed Boss #N ») | 160 objets sur 427 ont un seuil > 0 : Boss 20 = 8 objets (série HSB + Magicite), 33 = 14 (GRB + Clock), 58 = 9 (2D, Forest Pendant, Ascended Forest Pendant), 67 = 1, 82 = 31 (Spoopy, Jake, Gaudy, Mega, Beard Comb, Stapler...), 100 = 97 (anneaux d'UUG, Beardverse et au-delà). 199 objets ont le seuil 0 (toujours 100 %), 68 n'ont pas de ligne. Aucune occurrence du mot dans le moteur : tout est à 100 % dès le niveau. Seule formule publiée : page HSB (set), « (Current Boss)/20 * 100 » | élevée (équilibrage de toute la progression) |
| C02 | **Seconde arme / Dual Wielding** (souhait 28 : +5 % des stats de la 2e arme par niveau ; souhait 45 : +5 % d'efficacité par niveau ; Evil Troll 4 débloque le souhait, Troll 6 « Improved Dual Wielding ») | 9 sets ont deux armes (Bread baguette, Disco vinylShard, Halloweenie apple, Construction hammer, Duck shotgun, Dutch tulip, Pirate cutlass, Rock rocket, Amalgamate deathstick), de type Weapon sur le wiki. `equip()` n'accepte que `slot === "weapon"` : par simulation la baguette donne SLOT_INVALIDE en `weapon` mais est acceptée en `accessory` (le client range tout slot hors cœur en accessoire). La 2e arme compte donc à **100 % de ses stats** en consommant un emplacement d'accessoire (ex. Pirate cutlass : 126 G de Power). Les souhaits 28 et 45 ont `bonus: {}`. Source tierce (`player.ts`) : `ratio = 0,05 x (niveau souhait 28 + niveau souhait 45)` appliqué à toutes les stats de la 2e arme | élevée à partir d'Evil/Sadistic |
| C03 | Left / Right Edgy Boot (type Boots sur le wiki) | slots `left`/`right` : SLOT_INVALIDE en `boots`, acceptées en accessoires, les deux à la fois | faible |
| C04 | **Specials secondaires des accessoires** (`SPECIALS` avec `sExtra`) | 102 objets, 258 specials secondaires : ils restent à leur « Base value » même au niveau 100 avec le special principal plein (moyenne 47 % du maximum niveau 100). Simulation : Small Gerbil niveau 100 et special principal 12 000 : `magicCapPct` 200 (maximum 1 200), `magicPowerPct` 2 000 (maximum 12 000). Les pièces de set, elles, montent proportionnellement (`idleAdventureSetSpecialsValuesV1`). Choix noté dans le code (mécanisme de répartition d'un Special Boost non documenté), jamais tranché | élevée (Power/Cap des accessoires tardifs) |
| C05 | Laser Sword Challenge, « +0,05 » à la 1re et à la dernière complétion | voir E02 | moyenne |
| C06 | 24 Hour Challenge, 1re complétion : « +1 EXP whenever you defeat boss 24 or higher » | non modélisé | faible |
| C07 | **Troll Challenge** : trolls périodiques (moitié des augments, sang, Time Machine, or, énergie, magie, niveaux de Wandoos, NGU/Beards/Wandoos coupés, boss multiplier divisé par 2 + complétions), toutes les 120 s (complétion 1) à 75 s (complétion 7) | seule restriction implémentée : offline désactivé. Le défi est donc beaucoup plus facile que dans NGU | moyenne |
| C08 | Blind Challenge : nombres masqués | aucun masquage côté client | faible |
| C09 | Exile (set) : « Unlocks something secret! » | chaîne Sack/Face/Seal, 4 indices, Blue Eyes Ultimate Chestplate absente | faible |
| C10 | Western (set) : « An Extra Drop in this zone! » | aucune magnitude publiée ; seul le drop A 9mm Beretta (« if Western (set) complete ») est câblé | faible |
| C11 | Boutique AP : 14 lignes sans effet (achat refusé `EFFET_BOUTIQUE_AP_INACTIF`) | Insta Training Cap (10 000), Custom Energy/Magic % (25 000), More Custom Energy/Magic % (80 000), Lazy ITOPOD Floor Shifter (225 000), Quest Reminder (50 000), Custom Idle Energy/Magic % (125 000), NGU Cap Modifier (100 000), Daycare Kitty Art (250 000), Custom Resource 3 % (50 000), Another Custom Resource 3 % (150 000), Custom Idle Resource 3 % (150 000), Resource 3 Name Randomizer (100 000), Adventure Light (75 000), Adventure Advancer (65 000). Seuls Insta Training Cap, Lazy ITOPOD Floor Shifter et Adventure Advancer auraient un effet de jeu, le reste est de l'interface ou du cosmétique | faible |
| C12 | Auto Nuker (65 000 AP) | minuterie `setInterval` du client (10 s après le début du run puis chaque minute), sans case à cocher et sans effet hors ligne. Le wiki (Secrets and Spoilers) dit « turn off auto-nuke » : un interrupteur existe dans le vrai jeu | faible |

Vérifié branché de bout en bout (pas d'écart) : tous les effets de complétion de sets hors Exile et Western (chaque clé de `reward` a un lecteur ou un contrôle `completedSets`), tous les bonus permanents de défis Normal/Evil/Sadistic hors C05 à C08 et hors Troll Evil 4 et 6 (Basic, No Augs, 100 Levels, No Equipment, Troll Normal 1 à 7, Troll Evil 1, 2, 3, 5, 7, Troll Sadistic, No Rebirth, Blind daycare, No NGU, No TM), les 29 types de Specials d'équipement (chacun a un lecteur), les potions/Bar Bar/Lucky Charm/Little Blue Pill/Beast Butter/Poop/Mayo Infuser/Black Pens/slots/cœurs de la boutique.

---

## Ambiguïtés connues

**E01. Effectiveness** : lectures possibles (a) `(Boss courant)/N x 100 %` pour chaque N (20, 33, 58, 67, 82, 100), généralisation de la seule formule publiée (HSB, N = 20) ; (b) « Boss courant » = plus haut boss battu de la run ou record ; (c) N = 100 concerne 97 objets tardifs, dont l'application en Normal les réduirait fortement. Jeu : 100 % partout. Recommandation : ne rien inventer (règle n°1), au plus traiter la formule HSB documentée (8 objets), le reste n'est ancré à aucune autre page.

**E02. Laser Sword +0,05** : wiki, Challenges : chaque complétion +0,01 pour Milk, +0,02 pour Cannon, et ainsi de suite jusqu'au Laser Sword ; « First Completion Reward: Same bonus, but increases by 0.05 » ; « Final Completion Reward: Same bonus, but increases by 0.05 ». Lectures : (A) 1re et dernière complétions comptent 0,05 par rang au lieu de 0,01 : 18 x 0,01 + 2 x 0,05 = 0,28 par rang à 20/20 ; (B) elles ajoutent 0,05 au 0,01 : 0,30 ; (C, jeu) 0,01 x complétions seulement : 0,20. Jeu : `laserSwordExponentStep = completions x 0,01`, exposant = base + pas x rang (rang 0 Scissors à 6 Laser Sword, `idle-ngu-progression.js:2603`). Impact à 20/20 : exposant + 0,08 x rang (A) ou + 0,10 x rang (B), donc pour le Laser Sword (rang 6) un facteur L^0,48 ou L^0,60 sur son multiplicateur (L = niveau de l'augment). Lecture A la plus littérale ; à trancher avec des valeurs de référence.

**E03. Règles du NUKE** : wiki (Boss Fights) : « You can instantly skip bosses with the nuke button, if you are strong enough to kill it - your defense must be at least 5x the attack of the boss » ; Secrets and Spoilers : « DO NOT nuke past the bosses » (le NUKE enchaîne) ; boutique : Auto Nuker toutes les minutes. Jeu (`idle-sqlite-runtime.js:11736-12012`) : Attack joueur / 5 > Defense boss ET Defense joueur / 5 > Attack boss, deux comparaisons strictes, enchaînement tant que vrai, arrêt au mur de Renaissance ; le commentaire cite `BossController.nukeBosses()` du jeu réel (non vérifiable ici). Écart : le wiki ne cite que la Defense (>= 5x) ; le jeu est plus restrictif. Recommandation : garder, signaler.

**E04. Emplacement « Sellout Evil slot » en Sadistic** : Shop (Special 3, 500 000 AP) : « arbitrarily locked buying this until you're in Evil difficulty » ; Advanced Guide : utilisable en Normal une fois acheté ; Inventory : « last two require Evil difficulty » (Special 3 ET Special 4). Jeu : achat refusé seulement en Normal (Evil et Sadistic autorisés), une fois acheté actif partout ; le slot Special 4 (750 000 AP) n'est pas verrouillé. Le calcul `bonusSlots.accessory` reprend les sources de la liste de la page Inventory (2 de base, 2 boutique EXP, 6 boutique AP, 3 Troll, perk, quirk, souhait 109 : 16 au total). Sadistic : aucune règle publiée, autorisé par cohérence. Recommandation : verrouiller aussi le slot Special 4 en Evil si la page Inventory prévaut.

**E05. 24 Hour, « rounded down »** : arrondi de l'EXP ou du pourcentage non tranché ; le jeu arrondit l'EXP finale à l'entier inférieur.

**E06. Beardverse (set)** : « 10 % reduced penalty » lu comme pénalité x0,9 (`idle-ngu-progression.js:3068`).

**E07. Red Liquid** : -20 % de durée (set) ou +20 % de vitesse (objet) : le jeu applique x0,8 sur la durée (= +25 % de vitesse).

---

## Résumé des écarts qui comptent pour le gameplay (10 lignes)

1. Données brutes (stats, specials, sets, prix, cibles de défis) identiques au wiki : 406/406 objets, 68 sets, 81 lignes de boutique, 33 défis.
2. Specials secondaires des accessoires (102 objets, 258 specials) figés à leur Base value : ils ne montent ni avec le niveau ni avec les boosts (C04).
3. Effectiveness absente : 160 objets devraient être partiellement efficaces avant leur boss (C01, seule formule : HSB).
4. Seconde arme absente : les 9 secondes armes des sets tardifs s'équipent comme accessoires à 100 % ; souhaits 28/45 sans effet (C02).
5. Troll Challenge sans ses trolls (et Blind sans masquage) : ces défis sont bien plus faciles que dans NGU (C07, C08).
6. Laser Sword +0,05 non appliqué : exposant du Laser Sword sous-évalué de 0,48 à 0,60 à 20/20 selon la lecture (E02).
7. NUKE plus restrictif que le texte du wiki ; Auto Nuker sans interrupteur ni effet hors ligne (E03, C12).
8. Emplacement d'accessoire Special 4 (750 000 AP) non verrouillé en Evil alors que la page Inventory le suggère (E04).
9. 14 lignes de la boutique AP sans effet, dont Insta Training Cap, Lazy ITOPOD Floor Shifter et Adventure Advancer (C11).
10. Coquilles du wiki reprises : Battle Corgi (NGU Speed 500 au lieu de 600 au niveau 0) et S'rerednaW pantalon (Magic Bars/Cap qui décroissent de 1 600/170 à 800/85) ; 21 objets de quête/cuisine absents dont Blue Eyes Ultimate Chestplate (seul avec stats).
