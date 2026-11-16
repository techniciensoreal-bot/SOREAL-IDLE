# Chaîne secrète de la Bête (titan 6) : code du jeu, build 1260

Source : IL de Assembly-CSharp.dll (`cloudflare/tools/banc-vrai-jeu/lecteur-il.mjs`) + table d'objets du jeu (`ItemNameDesc::constructItemInfo`). Rien n'est tiré de la mémoire. Implémenté le 2026-11-16 : `cloudflare/src/idle-bete-secret-v1.js`.

## Règles lues
| Maillon | Méthode du jeu | Condition | Résultat |
|---|---|---|---|
| Skeleton Guardian | `AdventureController::spawnEnemy` (151), `createEnemyTable` (150), `LootDrop::zone19Drop` (507) | zone du 6e titan (zone 19) tant que `titan6Unlocked` est faux : l'ennemi d'indice 0 est SKELETON GUARDIAN (type 12 ; attaque 3, Power 3e7, Toughness 3e7, Regen 3e6, PV 3e9) ; sinon The Beast V1 à V4 (types 13, 15, 16, 17) | à chaque mort : objet 179 « A Crumpled Note » niveau 100, aucun or ni EXP ; sa mort relance le minuteur de zone (`boss6Spawn.reset`, `enemyDeath` 157) ; il ne compte pas dans `titansDefeated` |
| Indice 1 (180 « The First Clue ») | `checkUUGSecret` (542), fin de `zone14Drop` (UUG, type 5) | `apathyCheck == 69` (niveau du premier Ring of Apathy porté, id 135) ET `itemMaxxed[179]` (Note déjà au niveau 100) | objet 180 niveau 100 ; `clue1Complete` ; 2 messages |
| Indice 2 (181) | `checkTreeSecret` (543), fin de `zone8Drop` (Grand Corrupted Tree, type 3) | `clue1Complete` ET arme équipée d'id 75 (« A Stick », `training:weapon`) | objet 181 ; `clue2Complete` |
| Indice 3 (182) | `checkJakeSecret` (544), fin de `zone11Drop` (Jake, type 4) | `clue1`, `clue2` ; tête, torse, jambes, bottes, arme vides ; le Stapler (id 118) porté ; aucun autre accessoire | objet 182 ; `clue3Complete` |
| Indice 4 (183) | `checkITOPODSecret` (546), fin de `itopodDrop` (534) | `clue1..3` ; `checkNakedness` (545) ; `itopodLevel == 100` ; `Adventure.itopodStart == 0` ; `itopodKillCount == 1` ; `clue4Eligible` | objet 183 ; `clue4Complete` |
| `clue4Eligible` | `ZoneSelector::changeZone` (717), `checkNakedness` | mis à vrai à l'entrée dans l'ITOPOD si `clue3Complete` ; mis à faux dès qu'une pièce (tête, torse, jambes, bottes, arme) ou un accessoire est porté lors d'un butin | |
| Déblocage | `Rebirth::checkSpecial` (2675), appelée au début de `Rebirth::engage` (tout Rebirth, défis compris) | `clue1..4Complete` ET `rebirthTime.totalseconds` strictement entre 2585 et 2615 ET `titan6Unlocked` faux | `titan6Unlocked = true`, message « YOU HAVE RELEASED THE POWER OF THE BEAST! TREMBLE IN FEAR AT YOUR OWN STUPIDITY! » (5 s) |

Compteur ITOPOD : 10 kills par étage (`itopodKillCount` revient à 0 à 10 et l'étage monte) ; `itopodLevel` part de `itopodStart` (0) : « étage 100, premier kill » = le 1001e kill d'une visite qui a commencé à l'étage 0. La mort ne remet que l'étage à `itopodStart` (`playerDeath` 156), pas le compteur.
Les objets 180 à 183 n'ont aucun dédoublonnage : chaque victoire qui remplit la condition en redonne un. `markItemAsDropped` / `markItemAsMaxxed` sont posés avant l'ajout au sac (`makeLevelledLoot` 3813 : niveau 100 = maxé).

## Textes (descriptions, id du jeu)
179 « A Crumpled Note » : le poème des quatre quêtes (apathie, ombre de sa force, salarié, tour nu) ; 180 « What on earth does it mean? » ; 181 « You still don't get it. :| » ; 182 « Why the random numbers? Your brain hurts. » ; 183 « There must be some way to make sense of these clues... ». Les icônes `Items/Clue1..4` du jeu portent les nombres (« random numbers »).

## Dans SOREAL
- `titan6Unlocked`, `clue1Complete..clue4Complete` : `unlockFlags` de l'Aventure. Migration d'état 53 -> 54 : toute partie ayant atteint le boss 132 (ancienne règle) ou combattu la Bête garde l'accès ; les autres doivent trouver le secret.
- Titan « skeleton » (`hiddenWhenFlag: titan6Unlocked`, `remplacePar: t6`) calqué sur le Prêtre d'Exilé ; The Beast (`t6`) : `secret`, `requiresUnlock: titan6Unlocked`.
- ITOPOD : SOREAL calcule la Tour par lots, sans « entrée dans la zone » : une visite commence quand le joueur règle ses étages (`towerSetFloorsV1`, qui recommence déjà au premier ennemi de l'étage de départ). `d.beteElig` (données de la Tour) = `clue4Eligible`.
- Durée de la partie du Rebirth : `(instant - runStartedAt)` du moteur, mesuré avant toute remise à zéro (même valeur que le calcul des AP).
- Non fait : icônes `Clue2`, `Clue3`, `Clue4` (181 à 183) non extraites ; 180 réutilise `Clue1`. Le jeu les montre avec des nombres : à extraire de `sharedassets0.assets`.
