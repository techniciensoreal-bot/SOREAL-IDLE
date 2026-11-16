# Audit code du jeu (build 1260) : tables de NGU, Hacks, Barbes, Mineurs d'or (et fruits d'Yggdrasil)

Date : 2026-11-16. Côté jeu : IL de `Assembly-CSharp.dll` (AllNGUController 100 méthodes, NGUController / NGUMagicController, HacksController, AllBeardsController, AllGoldDiggerController, AllYggdrasil) ET champs sérialisés de la scène `NGUIdle_Data/level0` (offsets ci-dessous). Côté SOREAL : `cloudflare/src/idle-ngu-catalog-v1.js` (PARAMS), `idle-ngu-catalogues.js` (hacks, barbes, mineurs, fruits), `idle-ngu-bonus.js` (`beardBonusMultiplier`, `hackFxV1`), `idle-ngu-systemes.js` (`diggerPctAtLevel`), `idle-ngu-ressources.js` (`calculateIdleNguNextNumber`).

Rien du dépôt n'a été modifié, hormis ce rapport. Les comparaisons ont été faites par script (valeur du jeu relue dans la scène ou dans l'IL, puis comparée champ par champ au catalogue SOREAL) : 0 écart de table. **Un seul écart de logique trouvé : le NUMBER des NGU est multiplié par `timeMulti` dans le jeu** (§1.4).

## 0. Méthode et offsets (reproductible)

Les champs publics des contrôleurs sont sérialisés dans `level0` dans l'ordre de déclaration (tableaux = compte int32 + éléments ; `float[]` 4 octets, `double[]`/`long[]` 8 octets, chaînes = longueur + octets alignés sur 4). Repérage : recherche des suites de valeurs connues, puis lecture des tableaux voisins. Scripts (scratchpad) : `sc.mjs` (suite de tableaux de floats), `hk2.mjs` (HackProperties), `dg.mjs`/`dg2.mjs` (mineurs), `yg.mjs` (fruits), `nguparse.mjs` + `ngu-bonus.txt` (formules NGU extraites de l'IL et comparées au PARAMS de SOREAL), `fl.mjs` (champs d'une classe).

| Donnée de la scène | Offset `level0` | Contenu |
|---|---|---|
| `AllNGUController.normal/evil/sadistic Energy/Magic NGUDividers` (6 tableaux) | 2584872 (puis 72 octets par paire) | diviseurs de vitesse |
| `AllNGUController.normal/evil/sadistic Energy/Magic BoostFactor` (6 tableaux) | 2585088 et suivants | effet par niveau (fraction) |
| `HacksController.properties` (15 `HackProperties`) | 3904128 … 3906224 | diviseur, effet/niveau, effet de palier, niveaux par palier |
| `AllBeardsController.speedDivider` / `usesEnergy` | 3040664 / 3040696 | 7 diviseurs / 7 booléens |
| `AllGoldDiggerController` : `baseGPSDrain`, `baseGoldCost`, `gpsGrowthRate`, `consumesGPS`, `startingBoost`, `boostPerLevel` | 2859920 (drain, 12 doubles), 2860020 (coût), 2860120 (croissance), puis suite | 12 mineurs |
| `AllYggdrasil` : `usesEnergy`, `baseSeedCost`, `baseSeedReward`, `activationCost` | 2504092 (booléens), 2504116, +172, +344 | 21 fruits |

Formules relues dans l'IL (toutes conformes aux audits précédents, rappel pour lire les tables) :
- progression d'un NGU par tick (`NGUController::progressPerTick`, `NGUMagicController::progressPerTick`) = puissance de ressource / diviseur(id) x allocation / (niveau + 1) x bonus ; en piste Sadistic, divisée en plus par `sadisticDivider` = **1e7** ; 50 ticks/s. Donc coût de base SOREAL (secondes pour le niveau 1) = diviseur / 50 en Normal et Evil, et diviseur x 1e7 / 50 en Sadistic ;
- bonus d'un NGU = `1 + niveau x facteur` jusqu'au palier (`bgt` sur 400 / 1000 / 2000 / 10000 selon le NGU), au-delà `1 + niveau^exposant x coefficientIL x facteur` ;
- Hack : `(1 + (niveau+arg) x effetParNiveau) x effetPalier^floor(niveau/seuil)` ; barbe : `(1 + temp) x (1 + perm)` ; mineur : `(1 + départ + (niveau+arg) x palier) x bonusGlobal` (Stat : `niveau^3`).

## 1. NGU (AllNGUController, NGUController, NGUMagicController)

### 1.1 Diviseurs de vitesse -> coût de base SOREAL (`PARAMS[tier][id].baseCost`)

Diviseur du jeu / 50 (x 1e7 pour Sadistic) = coût SOREAL, pour les 48 cases :

| Palier | Énergie (Augments, Wandoos, Respawn, Gold, Adventure α, Power α, Drop Chance, Magic NGU, PP) | Magie (Yggdrasil, EXP, Power β, Number, Time Machine, Energy NGU, Adventure β) | SOREAL | Verdict |
|---|---|---|---|---|
| Normal | 1e13 x6, 1e15, 2e16, 5e17 | 2e13, 6e13, 2e14, 6e14, 5e15, 5e16, 5e17 | 2e11 x6, 2e13, 4e14, 1e16 / 4e11, 1.2e12, 4e12, 1.2e13, 1e14, 1e15, 1e16 | CONFORME (16/16) |
| Evil | 1e22 x3, 1e23, 1e24, 1e25, 1e26, 1e27, 1,01e28 | 1e22, 1e23, 1e24, 1e25, 1e26, 1e27, 1,01e28 | 2e20 x3, 2e21, 2e22, 2e23, 2e24, 2e25, 2,02e26 / 2e20 … 2,02e26 | CONFORME (16/16) |
| Sadistic | 1e33 x4, 1e34, 1e35, 1e36, 1e37, 1e38 | 1e33, 1e33, 1e34, 1e35, 1e36, 1e37, 1e38 | 2e38 x4, 2e39, 2e40, 2e41, 2e42, 2e43 / 2e38, 2e38, 2e39 … 2e43 | CONFORME (16/16) |

Les coûts Sadistic « mesurés au banc » (commentaire de `idle-ngu-catalog-v1.js`) sont donc DÉMONTRÉS par le code : 1e33 x 1e7 / 50 = 2e38 (le 1e40 du wiki divisé par 50). Le 1,01e28 d'Evil (PP et Adventure β) est dans la scène (commentaire SOREAL « lu dans le jeu » exact). `hardCapNormalLevel` = 1 000 000 000 = `IDLE_NGU_MAX_LEVEL_V1` (même plafond pour les trois pistes).

### 1.2 Effet par niveau (`pct`) : facteurs de la scène x 100

48/48 CONFORMES. Détail (jeu = facteur ; SOREAL = pct) :
- Normal énergie : 0,01 / 0,001 / 0,0005 / 0,01 / 0,001 / 0,05 / 0,001 / 0,001 / 0,0005 ; magie : 0,001 / 0,0001 / 0,01 / 0,01 / 0,002 / 0,001 / 0,0003.
- Evil énergie : 0,005 / 0,001 / 0,000005 / 0,005 / 0,0005 / 0,02 / 0,0005 / 0,0005 / 0,0002 ; magie : 0,0005 / 0,00005 / 0,005 / 0,005 / 0,001 / 0,0005 / 0,00015.
- Sadistic énergie : 0,004 / 0,0006 / 0,000005 / 0,005 / 0,0004 / 0,016 / 0,0004 / 0,0004 / 0,00016 ; magie : 0,0004 / 0,00005 / 0,005 / 0,005 / 0,001 / 0,0005 / 0,00015.

### 1.3 Plafond (soft cap), exposant et coefficient (formule après plafond)

Extraits automatiquement de l'IL des 48 méthodes `...BonusNormal/Evil/Sadistic` (coefficient IL x facteur x 100 comparé au `coefficient` SOREAL, tolérance 0,2 %) : **0 écart** sur le plafond (400 / 1000 / 2000 ; aucun pour Augments, Power α/β, Gold normal et Evil, Wandoos normal), l'exposant et le coefficient des 31 NGU qui en ont un. Exemples vérifiés : Yggdrasil 0,33 x 55,4 (Normal), 0,1 x 109,854 (Evil), 0,08 x 99,076 (Sadistic) ; EXP 0,4 x 95,66 / 0,2 / 0,15 ; Time Machine 0,8 (3,981 x facteur) aux trois paliers ; Number 0,5 x 31,7 / 0,3 x 125,9 / 0,2 x 251,2 ; Adventure β 0,4 x 63,13 / 0,25 / 0,12.
Respawn (formule spéciale) : Normal `1 - niveau x 0,0005` jusqu'à 400 puis `1 - (L/(5L+200000) + 0,2)` ; Evil et Sadistic : jusqu'à 10000 puis `1 - (L/(20L+200000) + 0,05)` ; planchers du jeu (0,8 puis 0,6 ; 0,925 puis 0,9) jamais atteints par la formule : CONFORME (`respawnBase`, `respawnDivisor`, `softCap` 400 / 10000 / 10000).

### 1.4 ÉCART trouvé : le NUMBER des NGU est multiplié par `timeMulti`

| Système | Champ | Jeu | SOREAL | Verdict |
|---|---|---|---|---|
| NGU NUMBER (magie, id 3) | bonus utilisé dans `Rebirth::calculateNextMultis` | `AllNGUController::numberBonus()` SANS argument (IL 4029 -> `numberBonusNormal/Evil/Sadistic` sans argument, 4030-4032) : `1 + niveau x facteur x Character.timeMulti` (et, au-delà de 1000, `1 + niveau^e x coef x facteur x timeMulti`), pour chacun des trois paliers, puis produit des trois. La version à un argument (4033-4036, sans `timeMulti`) ne sert qu'à l'affichage (`RebirthPowerDisplay`, `NGUMagicController::displayTooltip`). | `nguFxV1(state).number` = `1 + pct/100` sans `timeMulti` (`idle-ngu-ressources.js:148`, `idle-ngu-catalog-v1.js` `nguEffectsV1`) | **ÉCART** |

`Character.timeMulti` est celui du Rebirth en cours (`Rebirth::calculateTimeMulti`, déjà identique côté SOREAL : `idleNguRebirthTimeFactor`) : moins de 1 pour un Rebirth de moins d'une heure (0,5 juste avant 1 h, 0,25 à 30 min, etc.), puis `1 + t/172800` (1,02 à 1 h, 1,5 à 24 h). Donc dans le jeu, l'effet NGU NUMBER est ATTÉNUÉ pour les Rebirths courts et légèrement amplifié pour les longs ; SOREAL applique l'effet plein. Le facteur `timeMulti` du produit (`1 + bossMulti x oldBossMulti x oldTimeMulti x ... x timeMulti x ...`) existe déjà séparément : c'est un second usage, DANS le NGU. L'audit `economie.md` (ligne `calculateNextMultis`) avait écrit « x NGU.number » sans voir cette multiplication interne.
Correctif exact : dans `calculateIdleNguNextNumber`, ne plus recevoir `nguNumberBonus` tout fait mais le calculer avec le temps du Rebirth : pour chaque palier actif t de `nguActiveTiersV1(difficulty)`, `Math.max(1, 1 + nguEffectPctV1(t, "number", niveau[t]) / 100 * currentTimeFactor)`, produit des trois (`currentTimeFactor` = `idleNguRebirthTimeFactor(runSeconds)`, déjà calculé dans la fonction). Passer `input.nguNumberLevels` (niveaux des 3 paliers) à la place de `nguFxV1(state).number` à `idle-ngu-ressources.js:148` ; garder `nguFxV1(...).number` pour les AFFICHAGES (comme la version à argument du jeu). À CONFIRMER par une mesure au banc (NUMBER avec un NGU Number de niveau > 0 à deux durées de Rebirth) avant correction, la lecture IL étant sans ambiguïté mais l'effet inattendu.

### 1.5 Autres points NGU relus (CONFORMES)

- `NGUController::updateNGU` : Quirk 14 (Evil donne +1 niveau Normal) et Quirk 89 (Sadistic donne +1 niveau Evil, et +1 Normal seulement si 14 ET 89) = `grantNguLevelsV1` (récursion équivalente).
- Troll : Normal complétion >= 1 -> x3 vitesse NGU magique ; Sadistic complétion >= 1 -> x3 vitesse NGU énergie (`nguSpeedMagicChallengeMultiplier`, `nguSpeedEnergyChallengeMultiplier`).
- Chaîne de vitesse (puissance de ressource / diviseur x bonus Character x perk ITOPOD x MacGuffin 4 / 5 x Energy NGU / Magic NGU x mineur x hack x quirks x souhaits x cartes) = `nguSpeedMultiplierV1`.
- `NGUController.baseTime` et `boostFactor` (champs par contrôleur) ne sont lus nulle part dans les formules (les facteurs viennent de `AllNGUController`) : rien à comparer.
- NGUChallenge (défi No NGU) : voir `defis.md` (cible de boss, récompenses, déblocage à confirmer, déjà documentés).

## 2. Hacks (HacksController, 15 `HackProperties`)

Lus dans la scène (diviseur, effet par niveau, effet de palier, niveaux par palier) et comparés à `IDLE_NGU_TRACKS.hacks` : **15/15 CONFORMES sur les quatre champs** (60 valeurs).

| # | Hack (nom du jeu) | Diviseur jeu / SOREAL | Effet/niveau | Effet de palier | Niveaux/palier | Verdict |
|---|---|---|---|---|---|---|
| 0 | Attack/Defense | 1e8 / 1e8 | 0,025 / 2,5 % | 1,025 / 102,5 | 10 / 10 | CONFORME |
| 1 | Adventure Stats | 2e8 / 2e8 | 0,001 / 0,1 % | 1,02 / 102 | 50 / 50 | CONFORME |
| 2 | Time Machine Speed | 4e8 / 4e8 | 0,002 / 0,2 % | 1,02 / 102 | 50 / 50 | CONFORME |
| 3 | Drop Chance | 4e8 / 4e8 | 0,0025 / 0,25 % | 1,03 / 103 | 40 / 40 | CONFORME |
| 4 | Augment Speed | 8e8 / 8e8 | 0,002 / 0,2 % | 1,01 / 101 | 20 / 20 | CONFORME |
| 5 | Energy NGU Speed | 2e9 / 2e9 | 0,001 / 0,1 % | 1,015 / 101,5 | 30 / 30 | CONFORME |
| 6 | Magic NGU Speed | 2e9 / 2e9 | 0,001 / 0,1 % | 1,015 / 101,5 | 30 / 30 | CONFORME |
| 7 | Blood Gain | 4e9 / 4e9 | 0,001 / 0,1 % | 1,04 / 104 | 50 / 50 | CONFORME |
| 8 | QP Gain | 8e9 / 8e9 | 0,0005 / 0,05 % | 1,008 / 100,8 | 50 / 50 | CONFORME |
| 9 | Daycare | 2e10 / 2e10 | 0,0002 / 0,02 % | 1,005 / 100,5 | 45 / 45 | CONFORME |
| 10 | EXP | 4e10 / 4e10 | 0,00025 / 0,025 % | 1,01 / 101 | 75 / 75 | CONFORME |
| 11 | Number | 8e10 / 8e10 | 0,05 / 5 % | 1,04 / 104 | 40 / 40 | CONFORME |
| 12 | PP | 2e11 / 2e11 | 0,0005 / 0,05 % | 1,005 / 100,5 | 25 / 25 | CONFORME |
| 13 | Hack Hack | 2e11 / 2e11 | 0,0005 / 0,05 % | 1,1 / 110 | 100 / 100 | CONFORME |
| 14 | Wish | 1e13 / 1e13 | 0,0001 / 0,01 % | 1,005 / 100,5 | 50 / 50 | CONFORME |

Noms : le jeu dit « Adventure Stats Hack », « Time Machine Speed Hack », « Blood Gain Hack », « QP Gain Hack » ; SOREAL « Adventure Hack », « Time Machine Hack », « Blood Hack », « QP Hack » (cosmétique, nom du wiki). L'ordre des ids est identique. Les plafonds de niveau (`hardCapLevel`, formule recalculée dans `economie.md` : 7720 … 6262) dépendant uniquement des diviseurs ci-dessus, ils restent CONFORMES. `HacksController::milestoneReduction` renvoie 0 (rien à reprendre). Le 16e « Hack » caché (`endHackAvailable`, `endHackSpeed` = 1e-7 par tick = 200 000 s, un seul niveau) existe côté SOREAL (`advanceTheEndFinalHackV1`, 200 000 s) : CONFORME.

## 3. Barbes (AllBeardsController, BeardController)

Constantes de scène : `speedDivider` = 1e7, 3e7, 3e7, 1e8, 1e8, 3e8, 3e8 ; `usesEnergy` = Magie, Énergie, Magie, Énergie, Magie, Énergie, Magie ; `beardSize` = 7 (constante du code). Noms de la scène : « The Fu Manchu », « The Neckbeard », « The Reverse Hitler », « The Beard Cage », « The LadyBeard », « The BEARd », « The Golden Beard ».

| Barbe | Champ | Jeu | SOREAL | Verdict |
|---|---|---|---|---|
| Toutes | diviseurs de vitesse | 1e7, 3e7, 3e7, 1e8, 1e8, 3e8, 3e8 | `speedDivider` idem | CONFORME |
| Toutes | ressource (énergie/magie) | 0,1,0,1,0,1,0 (1 = énergie) | resource magic, energy, magic, energy, magic, energy, magic | CONFORME |
| Fu Manchu (Att/Déf) | temp / perm | 1 + 0,05 x niv (sans plafond) / 1 + 0,01 x niv (sans plafond) | `tb = temp x 0,05`, `pb = perm x 0,01` | CONFORME |
| Neckbeard (Drop) | temp | 0,0005 par niveau jusqu'à 1000, au-delà niv^0,3 x 125,9 x 0,0005 | idem | CONFORME |
| Neckbeard (Drop) | perm | 0,0005 ; au-delà niv^0,33 x 102,4 x 0,0005 | idem | CONFORME |
| Reverse (NUMBER) | temp / perm | 0,01 / 0,001, au-delà niv^0,5 x 31,7 x facteur | idem | CONFORME |
| Beard Cage (vitesse NGU) | temp / perm | 0,0001 / 0,0002, au-delà niv^0,3 x 125,9 x facteur | idem | CONFORME |
| LadyBeard (vitesse Wandoos) | temp / perm | 0,001 / 0,002, au-delà niv^0,5 x 31,7 x facteur | idem | CONFORME |
| BEARd (Aventure) | temp | 0,001, au-delà niv^0,3 x 125,9 x 0,001 | idem | CONFORME |
| BEARd (Aventure) | perm | 0,0005, au-delà niv^0,5 x 31,7 x 0,0005 (exposant différent du temp) | idem (`beardSoftLevel(perm, .5, 31.7) x .0005`) | CONFORME |
| Golden Beard (Or) | temp / perm | 0,002 / 0,005, au-delà niv^0,5 x 31,7 x facteur | idem | CONFORME |
| Golden Beard | déblocage | texte du Troll (`specialRewards`) : complétion 7 « The Golden Beard » ; `activateBeard` ne teste rien d'autre | `unlockTroll: 7` | CONFORME |
| Toutes | emplacements | 1 + `hasBeardSlot1` + (Troll >= 4) + `arbitrary.beardSlots`, borné à 7 | `beardSlotsV1` | CONFORME (déjà audité) |
| Toutes | plafond de niveau | aucun (`advanceBeard` : +1 niveau, +1 `rebirthLevels` si `canLevel`) | aucun | CONFORME |

Bornes : chaque bonus final est `max(1, ...)` des deux côtés ; le seuil 1000 est `niveau > 1000` -> formule d'exposant, comme `beardSoftLevel`. Nom d'affichage : « Reverse Hitler » (jeu) / « Reverse Beard » (SOREAL, nom du wiki) : cosmétique. Formules de progression (`beardProgressPerTick`, `beardCountDivider`, `timeFactor`, banque, trimmings) : voir `economie.md` §1.4 (écarts de `timeFactor` et de banque déjà listés là, corrigés depuis).

## 4. Mineurs d'or (AllGoldDiggerController)

Valeurs de la scène (ordre = ordre SOREAL : Drop, Wandoos, Stat, Adventure, Energy NGU, Magic NGU, Energy Beard, Magic Beard, PP, Daycare, Blood, EXP) :

| Champ | Jeu | SOREAL | Verdict |
|---|---|---|---|
| `baseGoldCost` (`unlockCost`) | 1e16 x4, 1e19 x2, 1e22 x2, 1e25 x2, 1e28 x2 | idem | CONFORME (12/12) |
| `baseGPSDrain` (`drain`) | 1e12 x4, 1e15 x2, 1e18 x2, 1e21 x2, 1e24 x2 | idem | CONFORME (12/12) |
| `gpsGrowthRate` (`growth`) | 1,5 x4, 1,75 x8 | idem | CONFORME (12/12) |
| plafond de niveau | `hardCapLevel` = trunc(ln(DBL_MAX / (2 x base)) / ln(croissance)) avec les valeurs ci-dessus : 1657 x4, 1188 x2, 1176 x2, 1164 x2, 1151 x2 | `cap` idem | CONFORME (recalculé avec les VRAIES valeurs de scène) |
| `consumesGPS` | 1 pour les 12 | `diggerDrainTotal` somme tous les actifs | CONFORME (lève la réserve de l'audit précédent) |
| `startingBoost` | 0,5 / 0,5 / 1 / 0,1 / 0,2 / 0,2 / 0,2 / 0,2 / 0,1 / 0,05 / 0,5 / 0,05 | voir ci-dessous | CONFORME |
| `boostPerLevel` | 0,01 / 0,01 / 0,01 / 0,005 / 0,01 / 0,01 / 0,01 / 0,01 / 0,01 / 0,001 / 0,01 / 0,005 | voir ci-dessous | CONFORME |

Bonus en % du jeu = 100 x (1 + départ + (niveau + arg) x palier) x bonus global (`totalLevelBonus`), puis `max(1, ...)` : Drop 150 + L ; Wandoos 150 + L ; Stat 200 + L^3 (`Math.Pow(niveau, 3)` x palier 0,01) ; Adventure 110 + 0,5 L ; Energy NGU, Magic NGU, Energy Beard, Magic Beard 120 + L ; PP 110 + L ; Daycare 105 + 0,1 L ; Blood 150 + L ; EXP 105 + 0,5 L = `diggerPctAtLevel` (idle-ngu-systemes.js:741) exactement. Coût du niveau suivant `baseGoldCost x croissance^maxLevel` et drain `baseGPSDrain x croissance^(niveau-1)` : CONFORMES. Noms et libellés de bonus du jeu identiques (« DROP CHANCE DIGGER » ... « EXP DIGGER »).

## 5. Bonus : fruits d'Yggdrasil (tables de scène, hors périmètre demandé mais lues)

| Champ | Jeu (21 fruits) | SOREAL | Verdict |
|---|---|---|---|
| `baseSeedReward` (`baseSeeds`) | 1,1,1,1,5,1,1,3,3,5,6,7,30,8,7, puis 10 x6 (mayos) | idem | CONFORME |
| `baseSeedCost` (`tierCost`) | 1,10,25,40,60,100,150,170,200,2000,15000,30000,50000,100000,25000, puis 250000 x6 | idem | CONFORME |
| `activationCost` | 1e5, 2e5, 2e5, 1e6, 3e5, 5e6, 3e6, 2e7, 1e7, 5e8, 5e8, 5e9, 2e10, 1e11, 4e10, puis 1e16 x6 | idem (`IDLE_YGG_MAYO_ACTIVATION_COST_V1` = 1e16) | CONFORME |
| `usesEnergy` | E,E,E,E,M,E,M,E,M,E,M,E,M,E,M, puis E,M,E,M,E,M | idem | CONFORME |
| noms | « Fruit of Ayy Lmayo » | « Fruit of Ayyy LMayo » | cosmétique |

## 6. Résumé des écarts

| Gravité | Système | Écart | Correctif |
|---|---|---|---|
| ÉCART (logique, à confirmer au banc) | NGU NUMBER | multiplié par `Character.timeMulti` dans le NUMBER du prochain Rebirth | §1.4 : calculer le bonus NGU NUMBER avec `currentTimeFactor` dans `calculateIdleNguNextNumber` ; garder la version sans temps pour l'affichage |
| cosmétique | Hacks | 4 noms plus courts que le jeu (Adventure, Time Machine, Blood, QP) | libellés d'affichage seulement |
| cosmétique | Barbes | « Reverse Hitler » (jeu) / « Reverse Beard » | libellé seulement |
| cosmétique | Fruits | « Ayy Lmayo » (jeu) / « Ayyy LMayo » | libellé seulement |

Aucun écart sur les 48 diviseurs NGU, 48 facteurs NGU, 31 formules post-plafond, 16 respawn / plafonds, 60 constantes de Hacks, 7 diviseurs et 7 ressources de barbes, 14 formules de bonus de barbes (temp + perm), 72 constantes de mineurs, 84 constantes de fruits. Les commentaires SOREAL « lu dans le jeu » (1,01e28, 2e38 Sadistic) sont exacts.

## 7. Ce qui n'a pas pu être extrait / reste non vérifié

- Les noms et descriptions de scène des NGU (champ `NGUName` de chaque `NGUController`) : seuls les chiffres comptent ici, non comparés.
- Les paliers de réduction des Hacks (`milestoneThreshold`, switch par id) : la table des 15 sources (quirk 57, perk 113, quirk 175, perk 217, perk 218, quirk 174, perk 219, perk 114, souhait 76, perk 115, quirk 59, souhait 77, quirk 58, souhait 78, quirk 60) a été vérifiée dans `economie.md` ; l'effet par niveau des perks et souhaits qui réduisent ces paliers (`effectPerLevel`) reste hors périmètre (déjà noté NON VÉRIFIÉ).
- `HackUIController`, `BeardController` (UI), ponts d'affichage : non audités (sans effet de jeu).
- Le facteur exact de `timeMulti` à l'intérieur du NUMBER NGU (§1.4) n'a pas été mesuré en jeu : lecture IL seule.
