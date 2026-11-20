# Audit code du jeu (build 1260) contre moteur SOREAL : ITOPOD, stats du joueur d'Aventure, butin

Date : 2026-11-20. Lecture seule (seul ce rapport est ajouté). Source : IL de `Assembly-CSharp.dll` (outils `m.mjs`, `d.mjs`, plus un balayeur `sf.mjs` qui cherche une chaîne dans le corps de toutes les méthodes). Seuls des FAITS chiffrés sont repris. Périmètre : `ITOPOD`, `ItopodPerkController::progressGained/addProgress/awardHighestLevelPP`, `LootDrop::itopodDrop/killsPer*/itopodTier/itopodEXPAwarded/killsPerMacguffin/checkEndDrop`, `AdventureController::powerUp/enemyDeath/verifyItopodInputs/setOptimalFloor/activateLazyItopod/respawnTime`, `Character::adventureOfflineProgress/calculateBestItopodLevel/totalAdvAttack/Defense/HP/HPRegen/lootFactor`, `InventoryController::cubePower/cubeToughness/attackBonus`. Les données des zones d'Aventure (ennemis, butin, objets, Or/EXP) sont déjà auditées dans `aventure.md` (corrigées le 2026-11-17) : non refaites.

Conventions : CONFORME / ÉCART (jeu vs SOREAL, fichier:ligne) / NON VÉRIFIÉ.

## 1. Écarts réels (par impact)

### E1. PV et régénération du joueur d'Aventure : la part du Cube Infini manque (IMPORTANT)
- Jeu : `totalAdvHP` (2164) = (`Adventure.maxHP` + `adventureHPBonus` + **`cubePower` x 3**) x multiplicateurs ; `totalAdvHPRegen` (2165) = (`Adventure.regen` + `adventureHPRegenBonus` + **`cubeToughness` x 0,03**) x multiplicateurs (`cubePower`/`cubeToughness` = les valeurs après plafond mou, 3598 / 3600). `adventureHPBonus` = `attackBonus` x 3 et `adventureHPRegenBonus` = `defenseBonus` x 0,03 (3596, 3597) : seul l'équipement.
- SOREAL : `idle-adventure-v47.js:264-265` `hp: equippedHp + setRewards.adventureHp` et `regen: equippedRegen + setRewards.adventureRegen` : AUCUNE part du Cube (la Puissance et la Robustesse, elles, l'ont : lignes 260-261). Même constat dans `idle-ngu-bonus.js:1281-1286` (le détail HP/regen passe `cube = 0`).
- Effet : tout joueur qui a boosté son Cube a des PV max et une régénération trop bas (Cube x 3 en PV, x 0,03 en régén, avant multiplicateurs), donc plus de morts en ITOPOD (`idle-itopod-combat-v1.js`), en combat de zone et contre les titans.
- Correctif : ligne 264 `hp: equippedHp + 3 * cubePowerContribution + N(s.setRewards.adventureHp)` ; ligne 265 `regen: equippedRegen + 0.03 * cubeToughnessContribution + N(s.setRewards.adventureRegen)` ; dans `idle-ngu-bonus.js:1281-1286` passer `cubeP * 3` et `cubeT * 0.03` comme part « cube » du détail de `hp` et `regen`. Le défi sans équipement renvoie déjà 0 pour les deux contributions. Ne pas oublier `snap.statsEquipementBloque` (`idle-ngu-snapshot.js:~282`, `hp`/`regen` : retirer la part du Cube comme pour la Puissance).

### E2. Hors ligne, SOREAL tire les drops rares de l'ITOPOD que le jeu ne tire jamais hors ligne (IMPORTANT)
- Jeu : `Character::adventureOfflineProgress` (2239, bloc ITOPOD) n'appelle NI `itopodDrop`, NI `checkEndDrop`, NI `checkExileDrop`, NI `checkITOPODSecret` (balayage de tout l'assembly : ces quatre méthodes ne sont appelées que par `dropLoot` / `itopodDrop`, donc seulement en ligne, un kill à la fois). Hors ligne le jeu ne donne que : AP, EXP, PP, kills « buffés », poop, MacGuffins, et le gain direct du Cube (déjà aligné, `hors-ligne.md` E2).
- SOREAL : `idle-ngu-systemes.js:1005-1013` (`applyKills`, appelée aussi quand `horsLigneItopod` est vrai, ligne 980) : pièce 491 de THE END (p = 0,005 % x (étage - 1449) par kill dès l'étage 1450), Tentacule de l'Exilé (étages 950-999, `exileItopodV1`) et dernier indice de la Bête (`beteItopodV1`, qui n'exige que `d.startFloor === 0` et `killsAvant === 0`) sont tentés sur TOUS les kills hors ligne en un seul lot (`1 - (1-p)^n`).
- Effet : une absence de quelques heures à l'étage 1450+ donne la pièce 491 de façon quasi certaine (milliers de kills x 0,005 % à 0,0075 % par étage), pareil pour l'Exilé ; le jeu l'interdit.
- Correctif : entourer les trois blocs de `if (!horsLigneItopod)` (la constante est calculée avant `applyKills`, ligne 980).

### E3. Auto / Lazy ITOPOD Floor Shifter : l'étage de fin dépasse ce que fait le jeu
- Jeu : `setOptimalFloor` (179) : `best = calculateBestItopodLevel()` (déjà plafonné à `highestItopodLevel`), puis `si best > highest - 1 alors best = highest - 1` ; départ ET fin reçoivent la MÊME valeur ; `verifyItopodInputs` (172) la remet à `fin >= début` et `fin >= 1`. Le Shifter (`activateLazyItopod` 203) appelle `setOptimalFloor`. Conséquence : le bouton Auto et le Shifter ne font jamais monter à un étage jamais atteint ; départ = fin = `min(optimal, plus haut - 1)`.
- SOREAL : `towerAppliquerEtageOptimalV1` (`idle-ngu-systemes.js:1183`) : `start = min(opt, plus haut - 1)` mais `end = opt` (sans le plafond du jeu ; `towerOptimalFloorV1`, ligne ~904, ne plafonne pas non plus à `highestFloor`). Quand l'optimal est au-dessus de `plus haut - 1`, SOREAL fait « plus haut - 1 → optimal » et le joueur découvre de nouveaux étages (PP de première atteinte) sans régler lui-même la fin, ce que le jeu n'offre pas. Le commentaire (lignes 1176-1182, « 13 → 14, comme dans le jeu d'origine ») est contredit par l'IL.
- Correctif : `d.endFloor = Math.max(1, start)` avec `start = Math.min(opt, Math.max(0, plusHaut - 1))` (`opt` plafonné à `plusHaut`), et le même plafond pour `d.optimalFloor` affiché. À trancher avec Norman car la phrase du commentaire vient d'une observation de sa part (décision du 2026-10-12) : l'IL dit l'inverse pour le bouton et le Shifter.

### E4. Seuil du plafond mou du Cube : la base du jeu inclut `Adventure.attack` (modéré)
- Jeu : `cubePower` (3598) : `base = Adventure.attack + attackBonus` (10 de départ + tous les gains plats permanents : fruits, perks, pilule de fer, achats d'Aventure, Pit) ; si `Inventory.cubePower > base` : `base + sqrt(cube - base)`, sinon `cube`. Idem pour la Robustesse (`Adventure.defense` + `defenseBonus`).
- SOREAL : `idleAdventureCubeSoftcapV1(cube, basePower)` (`idle-adventure-inventaire.js:493`) avec `basePower` = équipement seul + `setRewards.adventurePower` (`idle-adventure-v47.js:257-258`) : la base (10) et les gains plats permanents n'entrent pas dans le seuil. Résultat : la contribution du Cube est sous-évaluée d'environ ce montant manquant.
- Correctif : ajouter `10 + permanent.adventurePower + flat.power` (resp. Robustesse) au seuil (plateau en deux temps : ces valeurs vivent dans `idleNguBonuses`, `adventureBaseFlat`, donc le seuil doit être calculé dans `idleAdventureCombatStatsV1`, pas dans l'équipement). Ce changement dépend de E1 (même fonction).

### E5. Étage de fin à 0 accepté (mineur)
- Jeu : `verifyItopodInputs` : `fin = max(1, fin)` (et `fin >= début`).
- SOREAL : `towerSetFloorsV1` (`idle-ngu-systemes.js:1288`) `clamp(int(payload.end, start), start, 1600)` accepte début = fin = 0. Correctif : borne basse `Math.max(1, start)`.

### E6. Hors ligne : fenêtre 650 à 700 de Puissance (mineur)
- Jeu : bloc ITOPOD exige `totalAdvAttack >= 650` PUIS `calculateBestItopodLevel > 0` (qui renvoie 0 sous 700) : entre 650 et 700 de Puissance, ou si `highestItopodLevel = 0`, le jeu ne fait RIEN hors ligne.
- SOREAL : `idle-ngu-systemes.js:958,982` accepte 650 et utilise `etageUnique = max(0, min(optimal, plus haut))` : l'étage 0 est joué (EXP, AP, PP) au lieu de rien. Correctif : `if (horsLigneItopod && etageUnique <= 0) return;`.

### E7. Troncatures du jeu non reproduites (cosmétique, jamais plus de 0,5 %)
- PP : chaque kill ajoute `conv.i8((200|700|2000 + étage [+ bonus de base]) x totalPPBonus)` (troncature par kill, `progressGained` 326) ; hors ligne `kills x progressGained`. SOREAL multiplie sans tronquer (`idle-ngu-systemes.js:1047`).
- Hors ligne : AP = `kills / killsPerAP` en division entière, EXP = `(kills / killsPerEXP)` entier `x itopodEXPAwarded` (puis conv.i8) ; SOREAL accumule des fractions (`d.apProgress`, `rewards`). Écart de moyenne : SOREAL légèrement plus généreux.
- Code mort contenant des constantes inventées : `rollLegacyZoneLootAdventureV2` (`idle-adventure-butin.js:795`, 22 % pièce de set, 12 % boost, 4 % spécial). Vérifié : les 32 zones de combat ont un profil `normal` ET `boss`, donc jamais appelée aujourd'hui ; à supprimer (règle n°1).

## 2. Points CONFORMES (vérifiés dans l'IL ET dans le code SOREAL)

| Point | Jeu (IL) | SOREAL | Verdict |
|---|---|---|---|
| Ennemis de l'ITOPOD (zone 1000) | 16 « Dude » : cadence 1,2, attaque 10, défense 10, régén 1, PV 600, IA dans l'ordre [0,2,1,5,6,3,2,0,0,1,5,6,1,0,2,3] (extrait de `createEnemyTable`), tirage uniforme `Random.Range(0,16)` (`spawnEnemy` 151) | `ITOPOD_ENEMY_BASE_V1`, `ITOPOD_DUDE_AI_V1` (`idle-itopod-combat-v1.js:19-20`) | CONFORME |
| `powerUp` (152) | attaque, défense, PV, régén x `1,05^étage` (étage borné à [0, 1600]) puis x aléa 0,98-1,02 par statistique | `itopodEnemyStatsV1` (moyenne, aléas remplacés par 1) ; `towerHitsV1` | CONFORME (moyenne) |
| `itopodTier` (538) | `<0 -> 0` ; `>= 2000 -> 40` ; sinon `1 + niveau/50` | `towerTierV1` | CONFORME (étage <= 1600) |
| `killsPerAP` (535) / `killsPerEXP` (537) | `max(40 - palier, 20)` | `towerKillsPerRewardV1` (`tier <= 20 ? 40 - tier : 20`) | CONFORME |
| `itopodEXPAwarded` (536) | `palier < 3 ? palier : (palier-1)(palier-2)+2`, appliquée seulement si palier >= 1, via `addExp` (donc tous les multiplicateurs d'EXP) | `towerExpForTierV1` x `xpMultiplier` | CONFORME |
| AP de l'ITOPOD | +1 direct (`curArbitraryPoints`), sans bonus d'AP | `d.apProgress` -> `currencies.ap`, sans bonus | CONFORME |
| Boosts d'ITOPOD | 14 % par kill (`Random < 0,14`), type Power/Toughness/Special uniforme (`Range(0,3)`), niveau 1, id = `min(palier,24)` ramené : 1 à 10 -> id, 11 à 14 -> 10, 15 à 17 -> 11, 18 à 23 -> 12, 24+ -> 13 ; forces 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000 | `towerBoostStrengthV1` (`idle-ngu-systemes.js:912`), cumul déterministe `n x 0,14` (moyenne identique), niveau 1 (+1 avec la chance de bonus de butin) | CONFORME |
| PP d'étage atteint (`awardHighestLevelPP` 325) | étage multiple de 10 : `q = étage/10` ; PP = `ceil(q/10)` ; si `q` multiple de 10 : `q` | `towerMilestonePpV1` (`floor%100===0 ? floor/10 : 1 + floor(floor/100)`) | CONFORME |
| PP par kill (`progressGained` 326/327, `pointThreshold` 309) | Normal `200 + étage`, Evil `700 + étage`, Sadistic `2000 + étage + totalBasePPBonus`, x `totalPPBonus` ; seuil 1 000 000 par PP ; 1 pilule consommée par kill buffé, facteur de pilule seulement si `buffedKills > 0` et réglage actif ; hors ligne : `min(kills, buffedKills)` kills au tarif pilule, le reste au tarif normal | `ppBase`, `d.ppProgress`, `1e6`, `pills` (`idle-ngu-systemes.js:996-1047`) | CONFORME (facteurs de `totalPPBonus` déjà dans `perks.md`/`sets-bonus.md`) |
| MacGuffins d'ITOPOD (`killsPerMacguffin` 540) | 5000 x 0,8 (perk 69) x 0,75 (70) x 0,75 (71) x 0,8 (Purple Heart), `conv.i4` après chaque réduction ; exige perk 68 et succès 145 | `macguffinKillsRequiredV1` (`idle-macguffins-v1.js:304-311`) | CONFORME (comble le « non comparé » de `hors-ligne.md:114`) |
| Pièce 491 (`checkEndDrop` 548) | étage >= 1450, pièce non possédée, p = `(étage - 1449) x 0,00005`, niveau 100 | `idle-ngu-systemes.js:1005-1010` | CONFORME en ligne (voir E2 pour hors ligne) |
| Étage optimal (`calculateBestItopodLevel` 2240) | 0 sous 700 de Puissance ; sinon `floor(log base 1,05 de (Puissance / 765 x idleAttackPower))`, minimum 1, plafonné à `highestItopodLevel` | `towerOptimalFloorV1` | CONFORME hors plafond (voir E3) |
| Étage unique hors ligne | `min(optimal, plus haut)`, kills = `floor(secondes / (1 + respawnTime))` (0,8 + respawnTime avec Red Liquid) | `idle-ngu-systemes.js:980-987`, `killTimeAt` | CONFORME |
| Montée d'étage en ligne | `itopodKillCount` : 10 kills -> +1 niveau ; `niveau > fin` -> retour au `début` ; nouvel étage > plus haut -> PP d'étage ; mort -> début, compteur de kills non remis à zéro | `applyKills`, `reachFloor`, `towerBoucleCombatV1` | CONFORME |
| Bornes des étages de départ | début dans [0, min(plus haut - 1, 1600)] | `towerSetFloorsV1` ligne 1287 | CONFORME (fin : voir E5) |
| `respawnTime` (140) | `baseRespawn x NGU x max(0,2 ; 1 - bonus[23]) x 0,95 (Horloge) x perk 93 x souhaits` | `respawnReductionV1` (`idle-ngu-bonus.js:1164`, plafond 80 %) | CONFORME (structure ; `baseRespawn` = valeur de scène, 4 s non lu) |
| `totalAdvAttack/Defense` (2162/2163) | (`Adventure.attack` + équipement + Cube) x (1 + bonus Entraînement avancé Puissance|Robustesse) x NGU x NGU2 x Barbes x Diggers x Défis x ITOPOD x Beast Quest x MacGuffin[19] x Hacks x Souhaits x Cartes[9] x 1,2 (Evil Bonus Acc) ; minimum 1 ; mode Bête x seulement sur l'attaque | `idleAdventureCombatStatsV1` (`idle-ngu-bonus.js:1214`) : `(10 + équipement + permanent + plats) x multPower` | CONFORME sauf E1/E4 ; Bête, MacGuffin[19] et Cartes[9] sont ajoutés par d'autres modules (NON VÉRIFIÉ ici) |
| Bases du joueur (`Adventure::.ctor`) | attaque 10, défense 10, régén 1, PV 50 | `Math.max(10, ...)`, `BASE_ADVENTURE_HP_V1 = 50`, régén min 1 | CONFORME |
| `totalAdvHP` / `totalAdvHPRegen` : bonus utilisés | HP : bonus Puissance ; régén : bonus Robustesse | `adventurePowerMultiplier` pour PV, `adventureToughnessMultiplier` pour régén | CONFORME |
| `lootFactor` (2153) | ITOPOD perk x MacGuffin[10] x (1 + bonus[5] + bonus[41] + Cube) x Blood x Ygg x NGU x Barbes x Diggers x Hacks x Cartes[10] ; x1,0743 (2D) ; x1,25 (Normal Bonus Acc) ; x potion | `dropMultiplier` (`idle-ngu-bonus.js:1060-1070`) : équipement et Cube additifs, sets 2D et Normal Acc en facteurs séparés | CONFORME (structure, valeurs déjà dans `sets-bonus.md`) |
| Mismatch déjà corrigé | dégâts du joueur sans plancher en ITOPOD | `towerHitsV1` (`idle-ngu-systemes.js:893`) | CONFORME (corrigé le 2026-11-17) |

## 3. NON VÉRIFIÉ

- Valeurs de scène (`level0`) : `baseRespawn`, `idleAttackMulti` 1,2 / `regAttackMulti` 1,5 sont lus dans `Adventure::updateBaseStats` (77) : **1,2 et 1,5 confirmés** ; les cooldowns de ce même constructeur (régulier 1, fort 4, perçant 5 ou 8, ultime 15, buffs 45, durées 15) y sont aussi : à comparer au client (`soreal-idle-ui.js:1533-1554`) dans un autre lot (la perçante : 5 s dans `updateBaseStats`, 8 s dans `resetAdventure`).
- Facteurs de `totalPPBonus`, mode Bête dans `totalAdvAttack`, `cardsController.getBonus(9/10)` et `macguffinBonuses[19/10]` : déjà couverts dans `perks.md`, `macguffins-sang-coeurs.md`, `cartes-cuisine.md`.
- `autoattacking` (régén x1,2 dans `manageFight`) : SOREAL l'applique toujours en ITOPOD (`ITOPOD_AUTOATTACK_REGEN_V1`) ; le jeu ne le fait que si le drapeau est actif. Non tranché (lecture du drapeau non faite).
- Mécanisme d'IA de l'ITOPOD (cycles poison, chargeur, paralysie...) : déjà `CONFORME` dans `aventure.md` 1.C.

## 4. Liste courte des écarts réels

1. **E1** PV et régénération : la part du Cube (x3 et x0,03) manque (`idle-adventure-v47.js:264-265`).
2. **E2** Hors ligne : pièce 491, Exilé et indice de la Bête tentés alors que le jeu ne les tire jamais hors ligne (`idle-ngu-systemes.js:1005-1013`).
3. **E3** Auto / Shifter : fin = optimal sans le plafond `plus haut - 1` du jeu (`idle-ngu-systemes.js:1183`, `towerOptimalFloorV1`).
4. **E4** Plafond mou du Cube : base sans `Adventure.attack` (10 + gains plats) (`idle-adventure-v47.js:257-258`).
5. **E5** Fin d'étage à 0 acceptée (`idle-ngu-systemes.js:1288`).
6. **E6** Hors ligne 650-700 de Puissance : joue l'étage 0 au lieu de rien (`idle-ngu-systemes.js:958,982`).
7. **E7** Troncatures et code mort `rollLegacyZoneLootAdventureV2` (constantes inventées, jamais appelé).
