# Contrôle croisé : formules du joueur et économie (source tierce contre SOREAL IDLE)

Date : 2026-09-25. Mode : lecture seule (aucun fichier du jeu modifié). Écarts détaillés en JSON : `player-formulas-economy.json` (même dossier, 22 écarts E01 à E22, 37 formules F01 à F37). Scripts d'analyse : `C:\Users\n0rma\AppData\Local\Temp\claude\xcheck\` (`spin.mjs`, `tower.mjs`).

Règle du projet respectée : le wiki reste la référence ; tout écart est listé, rien n'est appliqué.

## 0. Ce que la source contient réellement (limite majeure)

`player.ts` importe toutes ses formules de totaux depuis `@/helpers/calculators`, **fichier absent du miroir** : `totalPower`, `totalToughness`, `totalHealth`, `totalRegen`, `totalDropChance`, `totalExpBonus`, `totalAPBonus`, `totalPPBonus`, `totalQuestRewardBonus`, `totalQuestDropBonus`, `totalEnergy/Magic/Res3 Power/Cap`, `totalRespawnRate`, `totalWishSpeed`, `getIdleAttackModifier`, `boostRecyclying`. Donc :

- **Aucune formule Attack, Defense, HP, régénération, drop chance totale, EXP totale ou AP totale n'est vérifiable** avec ces fichiers (l'utilisateur les a déjà validées par captures : Attack = 100 + somme de Level^1.3 x baseValue, NUMBER).
- `player.ts` ne contient que des valeurs lues dans la sauvegarde et quelques formules d'import (section 2).
- `playerData.ts` donne les défauts et les plafonds `max` des totaux : Energy/Magic Power 1e18, Cap 9e18, `wishSlots` max 4, `hackXTarget` max = les plafonds de niveau des Hacks, et les caps des réductions de jalons (Adventure 5, Augment 2, Blood 5, Daycare 5, Drop 4, ENGU 3, Exp 5, Hack 10, MNGU 3, Number 5, PP 3, QP 5, Stat 2, TM 5, Wish 5).
- Les vraies formules exploitables sont dans les autres fichiers : `zones.ts` (ITOPOD), `enemy.ts` (Titans), `advTraining.ts`, `yggdrasil.ts`, `diggers.ts`, `hacks.ts`, `wish.ts`, `perks.ts` (Fibonacci), les deux feuilles CSV et `gear-optimizer-Augment.js`.
- Guide en ligne (WebFetch) : uniquement les modificateurs de difficulté, les plafonds de ressources et la cadence de 50 ticks/s (aucune formule d'or, d'EXP ou de boost).

## 1. Résumé chiffré (D)

| Résultat | Nombre |
|---|---|
| Formules de la source cataloguées | 37 |
| Identiques dans le jeu (OK) | 24 |
| Écart de formule (ECART) | 6 |
| Présent dans la source, absent du jeu (ABSENT) | 2 |
| Ambigu ou contradictoire (AMBIGU) | 5 |
| Écarts numérotés dans le JSON | 22 |
| Daily Spin : paliers identiques au wiki | 8 sur 8 |
| Daily Spin : paliers identiques à la feuille CSV | 7 sur 8 (palier 3 : coquille de la feuille) |

Éléments vérifiés et conformes (non exhaustif) : Advanced Training (Level^0.4 x 10 % sur Power/Toughness et aussi HP/Regen, Block (L+50)/(L+100)), EXP/AP/PP/QP/or de tous les Titans, EXP de Titan x défis 24 h (additif +10/+4/+2 %), recyclage des boosts (même espérance), formules et coûts des fruits d'Yggdrasil (sauf Quirks), Fibonacci, diggers, coûts d'augmentation, plafonds de niveau des Hacks, slots de souhaits, temps minimum des souhaits (24 s par niveau), racine cubique des drops à partir de Chocolate World, quêtes (base 50/10, diviseur 8 réduit jusqu'à 3, temps 20 x items x (respawn+cooldown)/drop), EXP par palier de l'ITOPOD, kills par récompense, force des boosts par palier, chance de boost 14 %.

## 2. Formules de `player.ts` (import) et comparaison

| Formule de la source (player.ts) | Jeu |
|---|---|
| `bloodMagicDropChance = ceil(log2(sang/10000))` (0 si sang nul) | wiki : `(log2(sang/1e4)+1) %` : écart E05 |
| `bloodMagicTimeMachine = ceil(log2(sang/1e6)^2)` | wiki : `(log2(sang/1e6)+1)^2 %` : écart E05 |
| `bonusPP = 10 x quirk70 + 50 x wish79` (PPP de base de l'ITOPOD) | OK (`idle-ngu-progression.js:3970`) |
| `yggdrasilDropChance = totalLuck/20 + 100` | OK (`luckDropPct += ceil(...) x 0.05`, ligne 3691) |
| `questIdleDivider = 8 - perk91 - perk92 - 2 x perk105 - perk106` | OK (plancher 3) |
| `questMinorQP = 10 + 2 x perk87 + perk148 + wish102` ; `questMajorQP = 50 + perk147 + wish101` | OK (`idle-questing-v1.js`) |
| `wishSlots = 1 + quirk56 + (troll Evil >= 7) + pinkHeart` | OK (`:2661`) |
| Ratio seconde arme `= 0.05 x wish28 + 0.05 x wish45` | ABSENT (E06) |
| Temps minimum des souhaits `4 h - 24 s x (perk109 + perk110 + quirk54)` | OK |
| `highestTitanKilledId` et déblocages : Barbes = Uug, Cartes = Exile, Cuisine = IT Hungers, Diggers = Jake, Hacks = Nerd, MacGuffins = Walderp, Quêtes = Beast, Wandoos = Gordon, Souhaits = Godmother, Yggdrasil = Grand Tree | non contrôlé (autre domaine) |
| Tiers de cartes `= 1 + rockLobster + perks + quirks + souhaits` (14 types, `player.ts:220-445`) | non contrôlé (domaine cartes) |
| Fibonacci 610 : `fibQuestRNG` (quêtes à 50 items) | OK |

## 3. (A) Formules présentes dans la source et absentes ou différentes dans le jeu

### E01 (gravité haute) : vitesse des Wishes, facteur 50 ticks/s manquant

- Source `wish.ts:46-50` : `vitesse = (Pe x Ae x Pm x Am x Pr x Ar)^0.17 x wishSpeed% / (100/50) / (diviseur x (niveau+1))`. Comme `wishSpeed` est en % (100 = x1), le progrès par seconde vaut `50 x P^0.17 x mult / (diviseur x (niveau+1))`. Temps par niveau = `diviseur x (niveau+1) / (50 x P^0.17 x mult)`, avec plancher 4 h (moins 24 s par niveau de perk/quirk).
- Jeu `idle-ngu-progression.js:3025` : `rawSeconds = diviseur x (niveau+1) / P^0.17 / mult` : **pas de /50**.
- Argument de cohérence : dans `advanceHackTrack` (ligne 2944) le jeu divise bien par 50 (ticks vers secondes), exactement comme le fait la source pour les Hacks (`ceil(... x 100 / ...)/100 x 2`). Le wiki précise aussi que le bug de précision flottante à 7 j 17 h 12 min est un effet de ticks. Le wiki (page Wishes) écrit la formule par tick.
- Effet : tout souhait dont le temps brut dépasse 4 h est 50 fois plus lent dans le jeu que dans la source. Les souhaits limités par le plancher de 4 h ne changent pas.
- Incertitude moyenne. À confirmer par une mesure dans le vrai NGU (temps d'un souhait, puissances et allocations connues).

### E02 (gravité moyenne) : ITOPOD, modèle de un-coup et étage optimal décalé de +5

- Source `zones.ts:238-244, 262-266` : `étage optimal = floor(log_1.05(power x idleMod / 765))` avec 765 = 612 / 0.8 (PV maximum, dégâts minimum) ; coups par kill `= max(1.05^(niveau - étageOptimalRéel), 1)`. `oneHitPower = PV / (0.8 x mod) + Toughness / 2`. La table du wiki (510 à l'étage 0 avec Spoopy) est exactement 765 / 1.5 : **le wiki et la source disent la même chose**.
- Jeu `idle-ngu-progression.js:3911-3927` : PV moyens 600 x 1.05^f, défense 10 x 1.05^f, dégâts moyens (facteur 1.0), un coup si `power >= 505 x 1.05^f` (idle 1.2), coups en `ceil` entier.
- Résultat mesuré (script `tower.mjs`, 27 cas de power 1e3 à 1e30, idle 1.2/1.5/1.8) : le jeu place l'étage optimal **4 à 5 étages plus haut** que la source, toujours en faveur du joueur. Exemple : power 1e6, idle 1.2 : source 150, jeu 155.
- Ce n'est pas une erreur de calcul : le wiki décrit un facteur aléatoire 0.8 à 1.2 et des PV 588-612 ; le jeu a choisi la moyenne. Le seuil du jeu (405 avec idle 1.5) tombe entre "0 % de un-coup" (331) et "100 % de un-coup" (515) du wiki.
- Effet : PPP par kill (200 + étage), palier d'EXP/AP et force des boosts atteints environ 10 % plus tôt.
- Détail secondaire (E22) : la source arrondit le respawn au centième supérieur avant `kills/h`.

### E03 (gravité moyenne) : QP des Titans, seul le bonus des perks est appliqué

- Source `enemy.ts:218-223` : `getQP = qpBonus x QP / 100`, avec le même `totalQuestRewardBonus` que les quêtes.
- Jeu `idle-ngu-progression.js:6011` : `qp += gain("qp") x perksGain.qpEarningsMultiplier`. Les quêtes (`idle-questing-v1.js:250-266`) ajoutent le souhait 47, Mobster, Orange Heart, objets de quête niveau 100, QP Hack et cartes QP.
- Incertitude moyenne : la formule complète de `totalQuestRewardBonus` n'est pas dans le miroir.

### E04 (gravité moyenne) : Fruit of Quirks, QPRewardModifier non appliqué

- Source `yggdrasil.ts` : `ceil(T x (1+FH/10) x poop x yieldSansNGU x qpRewardBonus/100 x 3)`.
- Jeu `idle-yggdrasil-extra-v1.js:295` : `ceil(T x 3 x multipliers)` avec le commentaire "QPRewardModifier non publié -> 1". La source le définit (le bonus QP total).

### E06 (gravité moyenne) : seconde arme (Dual Wielding) absente

- Source `player.ts:954` : `ratio = 0.05 x wish28 + 0.05 x wish45`.
- Jeu : pas de slot de seconde arme ; les souhaits 28 et 45 (20 niveaux) n'ont aucun effet (`idle-wishes-v1.js:80,97`).

### Autres écarts de la catégorie A (basse ou triviale)

- E13 : PPP par kill, la source arrondit `floor` à chaque kill ; le jeu cumule les fractions (+0.13 % à l'étage 1 avec 137 % de bonus).
- E16 : AP "sauvegarde manuelle" (200 AP par jour) sans équivalent.
- E17 : Money Pit, paliers 12 à 16 (souhait 4), "Equip +1 LVL" et le +10 Power/Toughness du seuil 1E8 non modélisés (déjà documentés dans le code).
- E20 : fruits de Mayo (6 fruits) absents (coût d'activation ambigu).
- E22 : arrondi du respawn (voir E02).

## 4. (B) Daily Spin : tiers, prix, chances, AP moyen

Seuils de spins : 0, 7, 14, 30, 60, 120, 180, 365 (jeu, wiki, feuille concordent). Le spin est gratuit, cadence 24 h, banque 36 h (7 jours avec le 7-Day Time Bank).

Résultat du script `spin.mjs` (espérance calculée sur la table du jeu, comparée à la feuille `sheet-daily-gains.csv`) :

| Palier | AP moyen jeu | AP moyen feuille | Avec jackpot 50k+ (jeu / feuille) | Valeur des consommables (jeu / feuille) |
|---|---|---|---|---|
| 0 | 65 | 65 | 65 / 65 | 0 / 0 |
| 1 | 223 | 223 | 223 / 223 | 100 / 100 |
| 2 | 426 | 426 | 426 / 426 | 550 / 550 |
| 3 | 561 | **461** | 811 / **711** | 900 / 900 |
| 4 | 1000 | 1000 | 1375 / 1375 | 1550 / 1550 |
| 5 | 1488 | 1488 | 1988 / 1988 | 1900 / 1900 |
| 6 | 2220 | 2220 | 2970 / 2970 | 3800 / 3800 |
| 7 | 2775 | 2775 | 3650 / 3650 | 3800 / 3800 |

- Les 8 tables du jeu totalisent 100 % et sont identiques à la page Daily Spin du wiki (lots, quantités, chances, contenu des jackpots par palier, bug des 5000 graines au palier 7 repris).
- Palier 3 : la feuille donne 461 = 0.37 x 300 + 0.25 x 600 + 0.10 x **2000**. Le wiki et le jeu ont 3000 pour le lot à 10 % (les paliers 1, 2, 3 suivent 1000, 2000, 3000). Lecture : coquille de la feuille (E10).
- Prix des consommables : identiques à la feuille (potions alpha 5000, beta 10000, delta 100000, Charm 5000, Super Charm 50000, Bar Bar 10000, Muffin 50000) sauf Beast Butter 8000 (prix unitaire du lot de 100 ; le jeu vend 10000 à l'unité) et Little Blue Pill 2250 (le jeu 2500 les 1000, aucun lot actuel à 2250) : E11. Poop et graines sont valorisées 0 par la feuille.
- Jackpot au palier 7 : 1 107 500 AP de consommables dans le jeu contre 1 100 250 dans la feuille. Le "5501.25" de la feuille est 0.5 % x 1 100 250.
- Les AP du Daily Spin reçoivent le bonus AP commun (succès, Yellow Heart, Fibonacci 89), arrondi inférieur : conforme à la page Arbitrary Points.
- AP moyen par jour = AP moyen du palier (un spin par jour) : 65 au palier 0 jusqu'à 2775 (3650 avec les gros lots).

## 5. (C) Ambiguïtés et contradictions

| Id | Sujet | Contradiction |
|---|---|---|
| E05 | Blood Spaghetti / Counterfeit Gold | source `ceil(log2(sang/1e4))` et `ceil(log2(sang/1e6)^2)` contre wiki (`log2 + 1`, carré du `+1`). Le jeu suit le wiki. À sang = 1e9, Counterfeit Gold : 120.3 % (wiki) contre 100 % (source). |
| E07 | Cooldown d'Amalgamate | source 7.45 h, wiki et jeu 7 h 13 min 20 s |
| E08 | PPP d'IT HUNGERS et Rock Lobster | la page ITOPOD dit 600 000 et 800 000 ; pages Titans, IT HUNGERS, ROCK LOBSTER, source et jeu : 500 000 et 700 000 (coquille de la page ITOPOD) |
| E09 | Diviseur Sadistic des augmentations | wiki et jeu 2.5e27, source 5e34/1.2 sur 2e7 = 2.083e27 (commentaire de l'auteur "HACK: why do we need to divide by 1.2") |
| E10 | Daily Spin palier 3 | feuille 2000 contre wiki 3000 |
| E12 | Idle attack modifier | wiki : 1.5 Spoopy, 1.8 avec SNEC ; jeu : 1.5 x 1.2 = 1.8 avec les deux, mais 1.44 avec SNEC seul ; `getIdleAttackModifier` absent |
| E14 | Titans v2/v3/v4 | commentaire de la source : x1.1/1.2/1.3 systématique ; wiki : uniquement si le souhait 3 est étudié |
| E15 | Perk "Bonus Titan EXP!" | wiki et feuille (facteur 1.024) documentent un bug (chaque Auto-Kill en ligne profite du bonus) ; le jeu applique le comportement documenté |
| E18 | Plafonds de Resource 3 | absents de `playerData.ts`, présents sur le wiki (1E18 / 9E18 / 1E18) ; le jeu les applique |
| E19 | Fruit of Adventure | `BaseToughness` : "visible dans Spend EXP" (wiki) ; le jeu prend la Toughness avec équipement et permanents |
| E21 | Titans, réduction No Rebirth | source sans restriction, wiki et jeu par rang de titan |
| E01 | Wishes | voir section 3 (ambigu pour l'unité de temps de la formule du wiki) |

## 6. Détail de ce qui a été vérifié ligne à ligne

- ITOPOD : EXP 1, 2, puis `(palier-1)(palier-2)+2` ; kills par récompense `40 - palier` (20 à partir du palier 20) ; forces de boost 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 (paliers 10-14), 2000 (15-17), 5000 (18-23), 10000 ; jalons de PP à l'étage multiple de 10 (`1 + floor(f/100)`, `f/10` aux centaines) ; PPP `200/700/2000 + étage`, Little Blue Pill x2 (x2.2 avec Blue Heart). Feuille : 17 280 kills/jour à l'étage 1 (respawn 4 + 1 s), 443 EXP et 443 AP par jour.
- Titans : les 12 lignes EXP/AP/PPP/QP/or et les 7 souhaits de QP (73, 74, 40, 41, 100, 187, 204) sont identiques. La feuille exprime EXP et PPP par heure (`35/1`, `750/3.5 = 214.3`, `250000/3.5 = 71 428`).
- Quêtes : feuille 5450 s par major (54.5 items x 20 x 5 s), 3.06 majors par jour (28 200 s), 800 s par item en idle (`8 x 5 x 20`), tous égaux à la formule du jeu.
- Augmentations : or `1e4 x 20^i`, `1e7 x 50^i`, énergie `400 x 17^i` et `400 x 12^i`, valeurs du jeu identiques jusqu'aux 6 premiers niveaux (dont 1.8e16, 3.125e18, 46 771 760 000 s).
- Hacks : plafonds 7720, 7632, 7544, 7544, 7456, 7340, 7340, 7252, 7164, 7048, 6960, 6873, 6757, 6757, 6262 identiques ; temps par niveau `base x 1.0078^L x (L+1) / 50 / (R3 x puissance x vitesse)`.
- Ressources : Power 1e18, Bars 1e18, Cap 9e18 appliqués à l'énergie, la magie et la Resource 3 (`idle-ngu-progression.js:2318`).
- Respawn : les facteurs du wiki (Clock 5 %, NGU 40 %, perks 10 %, Evil NGU 10 %, Sadistic NGU 10 %, souhait 10 %, objets plafonnés 48/58/78 %) donnent 1.496 s sans objet et 0.329 s avec, plancher 0.34 s : le jeu est multiplicatif avec somme des objets plafonnée (`respawnReductionV1`).
- Money Pit : les 11 paliers et leurs récompenses correspondent au tableau du wiki ; AP `floor(log10(or))` ; cooldown `1 h + 1 h par jet` ; seuils d'or 1e5, 1e7, 1e9, 1e11, 1e13, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30.
- AP des défis (Basic 2500, No Augs 10 000, 100 Levels 1500, No Equipment 3000, 24 h 5000 x n, No Rebirth 25 000, Laser 3000, Blind 3000, No NGU 3000, No TM 2000) et 1 AP par 500 s de rebirth au-delà d'1 h : conformes à la page Arbitrary Points.

## 7. Non vérifiable ou hors périmètre

- Toutes les stats totales du joueur (voir section 0) : source absente.
- Bonus de la Beast Butter et Lucky Charm au-delà du x2 : non couverts par la source.
- Cartes, mayo, cuisine, MacGuffins, sets, NGU : hors de ce périmètre (`cards.ts`, `cooking.ts`, `macguffins.ts`, `sets.ts`, `ngus.ts`).
- Tables de drop des zones (feuille `sheet-boost-exp-zones.csv`, 1.220) : hors périmètre (domaine zones/ennemis).

## 8. Écarts qui comptent pour le gameplay (10 lignes)

1. E01 (haute) : vitesse des Wishes probablement 50 fois trop lente dans le jeu au-delà du plancher de 4 h (facteur ticks manquant, `idle-ngu-progression.js:3025`) : à confirmer par une mesure.
2. E02 : étage optimal de l'ITOPOD 4 à 5 étages plus haut que le wiki/la source (modèle moyen contre pire cas), donc plus de PPP, d'EXP, d'AP et de boosts.
3. E03 : QP des Titans sans les bonus QP autres que les perks (souhait 47, Mobster, Orange Heart, objets de quête, hack et cartes QP).
4. E04 : Fruit of Quirks sans le bonus QP total.
5. E05 : Blood Spaghetti et Counterfeit Gold suivent le wiki ; la source (issue du code) donne des valeurs plus faibles (jusqu'à -17 % à 1e9 de sang).
6. E06 : seconde arme absente, donc 20 niveaux de souhaits (28, 45) sans effet.
7. E09 : diviseur d'augmentation Sadistic possiblement 1.2 fois trop lent (wiki 2.5e27 contre source 2.08e27).
8. E12 : Idle attack en Sadistic sans Spoopy : 1.44 dans le jeu, incertain (1.8 possible).
9. Daily Spin : conforme au wiki sur les 8 paliers ; la feuille a une coquille au palier 3 (461 au lieu de 561).
10. Le reste des formules de la source (Titans, quêtes, fruits, Fibonacci, diggers, hacks, augmentations, plafonds, recyclage) est identique au jeu.
