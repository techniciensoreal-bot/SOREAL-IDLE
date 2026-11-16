# Audit code du jeu (build 1260) vs moteur SOREAL : groupe « perks »

Sources lues : `ItopodPerkController` (ids 299 à 472, 174 méthodes, toutes désassemblées), `ITOPOD` (296 à 298), et les consommateurs externes des perks (Character::total*, NGUController::progressPerTick, AugmentController, BeastQuestController, FruitController, LootDrop, AllDaycareController, AllBeardsController, AllAdvancedTraining::reset, WishesController, etc.).
Moteur : `cloudflare/src/idle-perks-v1.js` (catalogue + `perkBonusesV1`), `idle-difficulty-gates-v1.js`, `idle-ngu-bonus.js`, `idle-ngu-systemes.js` (advanceTowerV1), `idle-ngu-actions.js` (banques), `idle-questing-v1.js`, `idle-macguffins-v1.js`, `idle-yggdrasil-extra-v1.js`.
ItopodPerkUIController : uniquement UI (filtres, clics, tooltips) : non repris.

Convention : `EPL[i]` = liste `effectPerLevel` du contrôleur, `cost[i]` = `cost`, `maxLevel[i]` = `maxLevel`. Ces trois listes sont des champs sérialisés de la scène (level0), absents de l'IL : voir section 3.

## 1. Tableau méthode du jeu / équivalent SOREAL

### Structure, coûts, PP

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| ITOPOD::curSize (296) | `IDLE_PERKS_CATALOG_V1` (ids 0 à 231) | CONFORME | 232 emplacements (ids 0 à 231). SOREAL : 231 entrées, id 56 absent (voir ABSENT plus bas). |
| ITOPOD::.ctor / updateItopod (297, 298) | état `systems.perks.data.levels` | CONFORME | niveaux à 0, PP à 0. |
| ItopodPerkController::perkCost (323) | `idlePerkNextCostV1` idle-perks-v1.js:367 | CONFORME (forme) | coût PLAT par niveau `cost[i]` (pas de courbe). Valeurs de `cost[]` : NON VÉRIFIÉ (scène). |
| capLevel (311) | `perk.cap` | ÉCART mineur | `maxLevel[i] == 0` veut dire « illimité » (long.Max), sinon `maxLevel[i]`. SOREAL a un cap fini partout (1000 pour Rich Perks, 1597 Fibonacci). Valeurs : NON VÉRIFIÉ. |
| tryLevelUp / doLevelUp (342, 343) | action d'achat perks | CONFORME | refus si niveau >= cap, si difficulté < `perkDifficultyReq[i]`, si PP < coût ; sinon PP -= coût, niveau +1. Pas d'ordre particulier. |
| tryLevelAll / doLevelAll (344, 345) | achat « tout » | CONFORME | boucle `tant que PP >= coût et niveau < cap` ; même règle de difficulté. |
| doEffect (346) | effets à l'achat | CONFORME / NON VÉRIFIÉ | switch par id : 0 (+3 puissance et +3 barres d'énergie, FLAT sur le personnage), 1 (+1 puissance magie, +1 magie/barre, +10 000 cap), 2 (+100 attaque, +100 défense d'Aventure), 29 (slot accessoire), 31/32 (inventaire), 66/67/88 (slots MacGuffin), 72/73 (temps de sort), 86 (slot garderie), 94 niveau 1597 (art). SOREAL : `energyPowerFlat 3, energyBarsFlat 3` / `magicPowerFlat 1, magicBarsFlat 1, magicCapFlat 10000` / `adventurePowerFlat 100, adventureToughnessFlat 100` : mêmes nombres. |
| pointThreshold (309) | `idle-ngu-snapshot.js:1437` | CONFORME | 1 000 000 de progression = 1 PP. |
| poopThreshold (310) | `IDLE_YGG_ITOPOD_POOP_KILLS_V1 = 9000` idle-yggdrasil-extra-v1.js:102 | CONFORME | 9 000 kills. |
| addPoopProgress (334) | idle-yggdrasil-extra-v1.js:110-120 | CONFORME | +1 par kill, 1 poop par tranche de 9 000. |
| addProgress / progressToPP / progressToRemainder (331 à 333) | `d.ppProgress` idle-ngu-systemes.js:~985 | CONFORME | PP = progrès div 1e6, reste = modulo. |
| progressGained (326) | idle-ngu-systemes.js:916 | CONFORME | Normal `(200 + étage) x PPBonus` ; Evil `(700 + étage) x PPBonus` ; Sadistic `(2000 + étage + totalBasePPBonus) x PPBonus`. SOREAL : 200 / 700 / 2000 + quirks.itopodPppFlat + 50 x souhait 79, puis `(base + étage) x ppMultiplier` : identique. |
| baseProgressGained (327) | idem | CONFORME | même base sans multiplicateur. |
| totalBasePPBonus (328) | `quirks.itopodPppFlat + 50 x wishLevel(79)` | CONFORME (à valider pour la partie quirks) | le jeu additionne `BeastQuestPerkController::totalBasePPBonus` et `WishesController::totalBasePPBonus` ; seul Sadistic l'utilise. |
| totalPPBonus (329, 330) | `bonuses.ppMultiplier` idle-ngu-bonus.js:1083 | CONFORME avec réserves | jeu : NGU.PPBonus x (cœur vert 1,2) x (clé itopod 1,1) x (pretty 1,1) x (halloweenies 1,45) x [si pilule : pillModifier] x Diggers x Hacks x Cartes(13) x Fibonacci 13 (1,05) ; puis `si < 1 alors 1`. SOREAL : sets `itopodPpPct` x ngu.pp x hacks.pp x perks.ppEarnings (Fibonacci 13, 1,05) x diggers.pp ; cartes PP via `mul("ppMultiplier")` idle-cards-v1.js:671. Pas de plancher à 1 dans `advanceTowerV1` (il y en a un dans le calcul Yggdrasil). La pilule est modélisée à part (`pillFactor`). Je n'ai pas relu les facteurs d'objets 1,2 / 1,1 / 1,1 / 1,45 (NON VÉRIFIÉ qu'ils sont dans `itopodPpPct`). |
| awardHighestLevelPP (325) | `towerMilestonePpV1` idle-ngu-systemes.js:850 | CONFORME | jeu : si étage % 10 != 0 rien ; a = étage/10 ; PP = ceil(a/10) ; si a % 10 == 0 alors PP x 10. SOREAL : % 100 == 0 -> étage/10 sinon 1 + floor(étage/100). Identiques pour tout étage multiple de 10 (vérifié à la main : 10 -> 1, 100 -> 10, 110 -> 2, 190 -> 2, 200 -> 20). |
| boss6PP à boss12PP (AdventureController 118 à 124) | titans | NON VÉRIFIÉ | `250000 x totalPPBonus(false)` pour le premier ; hors du groupe (titans). |
| constructList / orderList / filter* / updateText / changePage / toggle* / tooltips | n/a | UI pure | ignorées. |

### Bonus par catégorie (total*Bonus et sous-méthodes)

Règle générale du jeu : chaque `total*Bonus` est le PRODUIT de ses sous-méthodes, chacune valant `1 + niveau x EPL[i]` (une par perk), sous un plancher à 1. Un perk dont la difficulté exigée n'est pas atteinte vaut 1.

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| totalEnergyPowerBonus (349) + energyPower1 à 5 (350 à 354) | `energyPowerMultiplier` idle-perks-v1.js:447 (clé produit) | CONFORME | produit de : perk 6 (1 + niv x 0,01), 57 (Evil), 74 (Evil), Fibonacci niveau >= 1 (x1,10), 116 (Evil), puis perkEffect 126, 135, 220 (Sadistic pour 126/135). SOREAL multiplie chaque perk séparément (`PERK_CLES_PRODUIT_V1`). Valeurs EPL de 57, 74, 116, 126, 135, 220 : NON VÉRIFIÉ (scène). |
| totalEnergyBarBonus (355 à 360) | `energyBarsMultiplier` | CONFORME | perks 7, 58, 75, Fibonacci niveau >= 21 (x1,10), 117, 127, 136, 221. |
| totalEnergyCapBonus (361 à 366) | `energyCapMultiplier` | CONFORME | perks 8, 59, 76, Fibonacci niveau >= 2 (x1,10), 118, 128, 137, 222. |
| totalMagicPowerBonus (367 à 372) | `magicPowerMultiplier` | CONFORME | perks 9, 60, 77, Fibonacci niveau >= 1 (x1,10), 119, 129, 138, 223. |
| totalMagicBarBonus (373 à 377) | `magicBarsMultiplier` | CONFORME | perks 10, 61, 78, Fibonacci niveau >= 21 (x1,10), 120, 130, 139, 224. |
| totalMagicCapBonus (378 à 383) | `magicCapMultiplier` | CONFORME | perks 11, 62, 79, Fibonacci niveau >= 3 (x1,10), 121 (via magicCap5Bonus = perkEffect(121)), 131, 140, 225. |
| totalRes3PowerBonus (384 à 388) | `r3PowerMultiplier` (`1 + somme`) | ÉCART | jeu : PRODUIT de perks 95, 98, 101, 122, 132, 141, 226 (chacun `1 + niv x EPL`). SOREAL : `1 + totals.r3PowerPct` (SOMME). Avec tous les perks au maximum à +1 % x 100 niveaux (= x2 chacun) : jeu x2^7 = x128 ; SOREAL 1 + 7 = x8. |
| totalRes3BarBonus (389 à 393) | `r3BarsMultiplier` (`1 + somme`) | ÉCART | même défaut : produit de 96, 99, 102, 123, 133, 142, 227. |
| totalRes3CapBonus (394 à 398) | `r3CapMultiplier` (`1 + somme`) | ÉCART | même défaut : produit de 97, 100, 103, 124, 134, 143, 228. |
| totalBoostBonus (399 à 402) | `boostPowerMultiplier` (produit) | CONFORME | produit de perks 12, 33, 107, 229, 230 ; `boostPowerProduct *= 1 + pct x niveau` idle-perks-v1.js:419. |
| totalStatBonus (403) + newbie / stat1 à 6 (404 à 410) | `statMultiplier` (clé produit) | ÉCART (perk 144) | jeu : produit de newbie (perk 4 niveau >= 1 -> x2), stat1 (perk 5, 1 + niv x EPL), stat2 (54), stat3 (82, Evil), stat4 (Fibonacci niveau >= 377 -> x3,77), stat5 (perk 125 niveau >= 1, Evil -> x3), stat6 (perk 144 niveau >= 1, Sadistic -> **x10**), puis perkEffect 149, 151, 153. SOREAL : 144 en `statPct: 10.0` -> `1 + 10 = x11`. Les autres (4 -> 1 + 1,0 = 2 ; 125 -> 1 + 2,0 = 3 ; Fib 377 -> 1 + 2,77 = 3,77) sont conformes. |
| totalEnergyNGUBonus (411 à 415) | `nguSpeedEnergyMultiplier = 1 + somme` idle-perks-v1.js:454 | ÉCART | jeu : PRODUIT de perk 13 (1 + niv x EPL), 63 (Evil), 80 (Evil), Fibonacci niveau >= 5 (x1,05). SOREAL : tout additionné en une somme (13, 63, 80, Fib 5, et 144 = +0,2). Au maximum (EPL 0,025 / 0,02 / 0,003 comme dans SOREAL) : jeu 1,5 x 3 x 1,3 x 1,05 = 6,14 (x1,2 de 144 = 7,37) ; SOREAL 1 + 0,5 + 2 + 0,3 + 0,05 + 0,2 = 4,05. |
| totalMagicNGUBonus (416 à 420) | `nguSpeedMagicMultiplier = 1 + somme` | ÉCART | même défaut : produit de 14, 64, 81, Fibonacci niveau >= 8 (x1,05). |
| totalBothNGUSpeedBonus / ngu1 (464, 465) | `nguSpeedEnergyPct/MagicPct += 0,2` (perk 144) | ÉCART | le jeu applique x1,2 comme FACTEUR séparé dans `Character::totalNGUSpeedBonus` (2215) (Sadistic, perk 144 niveau >= 1), multiplicatif avec les deux produits ci-dessus ; SOREAL l'additionne dans la somme. |
| totalAugSpeedBonus / aug1 (466, 467) | `augmentSpeedMultiplier = 1 + augmentSpeedPct` | CONFORME | x1,2 unique (perk 144, Sadistic). Un seul facteur : somme = produit. |
| totalSeedBonus / seed1 (421, 422) | `seedYieldMultiplier` | CONFORME | 1 + niv x EPL[24] ; un seul facteur. |
| totalHarvestBonus / harvest1 (444 à 446) | `firstHarvestMultiplier` | CONFORME | applique seulement si `fruits[i].harvests == 0` ; plafonné à x1,5 (5 niveaux x 0,10) ; SOREAL 1 + 0,10 x niv, cap 5. |
| totalDropChanceBonus (423 à 425) | `dropChanceMultiplier = 1 + (0,10 + 0,50)` | ÉCART | jeu : `newbieDropChanceBonus` (perk 3 niveau >= 1 -> x1,1) **x** `drop2` (perk 125, Evil, niveau >= 1 -> x1,5) = x1,65. SOREAL additionne 0,10 + 0,50 -> x1,60. |
| totalOSLevelBonus / OS1Bonus (426, 427) | `wandoosOsLevelBonus` | CONFORME | niv x EPL[22] (SOREAL 2 par niveau) ajouté plat à l'OS level (avec plancher 0). |
| totalGoldDropBonus / goldDrop1Bonus (428, 429) | `adventureGoldMultiplier` | CONFORME | 1 + niv x EPL[23] (SOREAL 0,05). |
| totalInvSpaces / invSpace1, 2 (430 à 432) | `inventorySlots` | CONFORME | min(niveau, 12) chacun (perks 31 et 32) : SOREAL cap 12 chacun, +1 par niveau. |
| totalBossExp / bossExp1 (433, 434) | `bossExpMultiplier` | CONFORME | 1 + niv x EPL[35] (SOREAL 0,02). |
| totalAdventureBonus + adventureStats1 à 5 (435 à 440) | `adventureStatsMultiplier` | CONFORME | produit de perk 2 (niveau >= 1 -> x1,1), 55, 83, Fibonacci niveau >= 34 (x1,13), perk 144 (Sadistic, x1,15), perkEffect 150, 152, 154. Appliqué à attaque, PV ET régénération d'Aventure (Character::totalAdvAttack 2162, totalAdvHP 2164, totalAdvHPRegen 2165). |
| totalBankedAdvTraining (441) | `atBankMultiplier` idle-ngu-actions.js:695 | ÉCART mineur | jeu : somme des niv x EPL (perks 36 à 40) + quirks 20, 21 (+ 22, 23, 24 si difficulté >= Evil), **plafonnée à 0,75**. SOREAL : somme des pourcentages perks + quirks, sans plafond 0,75. Perks seuls : max 0,50 ; le plafond ne joue qu'avec les quirks (valeurs de quirks : hors groupe). |
| totalBankedTimeMachine (442) | `tmBankMultiplier` idle-ngu-actions.js:682 | ÉCART mineur | idem : perks 41 à 45 + quirks 25 à 29 (27 à 29 en Evil), plafond 0,75 absent dans SOREAL. |
| totalBankedBeardTemp (443) | `beardBankMultiplier` idle-ngu-actions.js:683 | ÉCART mineur | idem : perks 46 à 50 + quirks 30 à 34, plafond 0,75 absent. |
| AllAdvancedTraining::reset (61) | idle-ngu-actions.js:696-700 | CONFORME | banque = `floor(niveau d'AT x bonus)` par compétence (troncature `conv.i8`) ; SOREAL `Math.floor(... + 1e-9)`. |
| totalDiggerSlots (447) | `diggerSlotBonus` | CONFORME | +1 si perk 52 niveau >= 1, +1 si perk 53 niveau >= 1. |
| ironPillBonus (448) | `ironPillMultiplier` | CONFORME | `(1 + niv84 x EPL[84]) x (1 + niv85 x EPL[85])` ; SOREAL `(1 + 5 x niv84) x (1 + niv85)` : EPL[84] = 5 et EPL[85] = 1 attendus (cohérent avec les textes « 26x au niveau 5 », « 4x au niveau 3 ») ; valeurs : NON VÉRIFIÉ. |
| totalQPBonus / QP1 (449, 450) | `qpEarningsMultiplier` (produit) | CONFORME | `min(1 + niv x EPL[89], 1,1)` ; SOREAL 0,002 x 50 = 0,1 max. Facteur séparé de Fibonacci 233 (x1,1 dans `questRewardFactor` 1250) : produit, conforme. |
| totalQuestDropBonus / questDrop1 (451, 452) | `questDropsPct` idle-questing-v1.js:202 | CONFORME | 1 + niv x EPL[90], sans plafond (SOREAL : 0,5 % par niveau, produit avec l'équipement). |
| totalRespawnBonus / respawn1Bonus (453, 454) | `respawnRemaining` | CONFORME | `1 - niv x EPL[93]` (0,001), s'applique seulement si niveau >= 1 (`AdventureController::respawnTime` 140). |
| fibPerkUnlocks (455) | `fibonacciMilestones` idle-perks-v1.js:286 | CONFORME | paliers 1 (+10 % énergie et magie, puissance), 2 (cap énergie +10 %), 3 (cap magie +10 %), 5 (+5 % NGU énergie), 8 (+5 % NGU magie), 13 (+5 % PP), 21 (+10 % barres), 34 (13 % Aventure), 55 (+5 % garderie), 89 (+2 % AP), 144 (+5 % de chance de +1 niveau de butin), 233 (+10 % QP), 377 (x3,77 attaque et défense), 610 (quêtes à 50 objets fixes), 987 (+5 % EXP), 1597 (cosmétique). Les textes et les facteurs lus dans l'IL (1,10 / 1,05 / 1,13 / 3,77) sont identiques. |
| totalWishSpeedBonus / wish1 (456, 457) | `wishSpeedMultiplier = 1 + somme` | ÉCART | jeu : PRODUIT de wish1 (perk 108, Evil) x perkEffect 155 x 156 x 159 x 160. SOREAL : 1 + somme. Au maximum (EPL 0,002 / 0,001 comme dans SOREAL) : jeu 1,1^5 = 1,61 ; SOREAL 1 + 0,1 + 4 x 0,1 = 1,5. |
| totalWishMinReduction / minWish1, 2 (458 à 460) | `wishMinTimeReductionSeconds` | CONFORME | additif : niv109 x 24 + niv110 x 24 secondes, retirées des 14 400 s de base (WishesController::minimumWishTime 4908). |
| sadisticBossMultiplierBonus / sadBoss1, 2 (461 à 463) | `sadisticBossMultiplierBonus` | CONFORME | `min(niv x 0,0005, 0,005)` pour 157 et 158 (Sadistic) ; additif à la base 1,2 avec les quirks et souhaits (BossController::sadisticBossMultiplier 1544). SOREAL 0,0005 x cap 10 = 0,005. |
| totalCardSpeed / totalMayoSpeed (468, 469) | idle-cards-v1.js | NON VÉRIFIÉ | produit de perkEffect(200, 202, 204, 206) et (201, 203, 205, 207) ; non relu côté SOREAL (agrégé dans idle-cards-v1.js, hors perks-v1). |
| totalDeckSizeBonus (470) | idle-cards-v1.js | NON VÉRIFIÉ | somme `min(niveau, maxLevel)` des perks 208, 209, 210 (base 10 : `CardsController::maxDeckSize` 1644). |
| totalCardTagBonus (471) | idle-cards-v1.js | NON VÉRIFIÉ | somme niv x EPL des perks 212 à 215. |
| perkEffect (348) | générique | CONFORME (forme) | `1 + niv x EPL[i]`, `1` si difficulté < `perkDifficultyReq[i]`, plancher 1 ; SOREAL fait la même chose via `idleNiveauxActifsV1` (niveau inactif exclu). |
| percentEffect / statEffect / levelEffect (337 à 341) | affichage | UI pure | ignorées. |

### Effets de perks consommés hors du contrôleur

| Perk (consommateur du jeu) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| 15 Double Basic Training (OffenseTraining::levelUp 4354 ; DefenseTraining::levelUp 4324) | `doubleBasicTraining` | CONFORME | +1 niveau supplémentaire à chaque remplissage de barre. |
| 18 Instant AT (AllAdvancedTraining::reset 61) | `advancedTrainingStartBonus` | CONFORME | niveau d'AT de départ = niveau du perk. |
| 16, 17 Quicker Fruit activation (TimerUp::checkTriggers 4718) | idle-yggdrasil-extra-v1.js | CONFORME | auto-activation après 1 800 s depuis le rebirth (le jeu teste aussi `Fruit.maxTier >= 1`). |
| 19, 20 Fruit of Knowledge (FruitController::consumeKnowledgeFruit 5063) | `fruitKnowledgeExpMultiplier = 3^n` | CONFORME | x3 par perk, appliqué après `ceil`. |
| 21 Five O'Clock Shadow (AllBeardsController::timeFactor 1147) | `beardRebirthTimeFactor` idle-ngu-bonus.js:525 | NON VÉRIFIÉ | jeu : 0 si temps de rebirth < 3 600 s ; sinon `min(8, (secondes / 10 800) x 24 / (24 - niveau perk 21))`. Non relu côté SOREAL (la fonction `beardRebirthTimeFactor` n'a pas été ouverte). |
| 25 Loot Goblin (ItemNameDesc::bonusLootLevels 3810) | `lootGoblinChance` | CONFORME | chance additive : niv x 0,01 + Gaudy 0,10 + Fibonacci 144 (0,05). SOREAL : `min(1, extraDropLevelChance + lootGoblin + lootLevel)`. |
| 26 Improved Cube Boosting (InventoryController::infinityCubeBoost 3688) | `cubeBoostRate = 0,01 + 0,01` | CONFORME | diviseur 100 -> 50 (taux de 1 % -> 2 %). |
| 27, 28 Daycare Kitty (AllDaycareController::daycareTime 3293) | `daycareTimeMultiplier` | CONFORME | deux facteurs `(1 - niv x EPL)` multipliés. |
| 29 Accessory slot (InventoryController::accessorySpaces 3576) | `accessorySlotBonus` | CONFORME | +1. |
| 30 Poop (AdventureController::enemyDeath 157, LootDrop::itopodDrop 534) | idle-yggdrasil-extra-v1.js:101-120 | CONFORME avec réserve | 1 poop par tranche de 9 000 kills + tirage `Random < EPL[30]` par kill. SOREAL : chance 0,0001 : valeur EPL[30] NON VÉRIFIÉE (scène). |
| 34 Bonus Titan EXP | idle-adventure-combat.js:300 | NON VÉRIFIÉ | je n'ai pas trouvé le site d'appel de `perkLevel[34]` par la recherche `ITOPOD.perkLevel` hors contrôleur ; peut passer par une valeur de scène. |
| 35 Boss EXP (totalBossExp) | `bossExpMultiplier` | NON VÉRIFIÉ (consommateur) | l'agrégat est conforme ; je n'ai pas désassemblé `BossController::rewardExp` en entier (seules les 3 premières branches lues). |
| 36 à 50 Banks | voir ci-dessus | CONFORME / ÉCART mineur | plafond 0,75 manquant. |
| 51 Premier fruit (FruitController::seedReward 5056, harvestSeedReward 5057) | `firstHarvestMultiplier` | CONFORME | applique seulement à la première récolte du fruit. |
| 52, 53 Digger slot | `diggerSlotBonus` | CONFORME | |
| 65 MacGuffin base level (LootDrop::macguffinBaseLevelBonus 552) | idle-macguffins-v1.js | CONFORME | +niveau du perk 65 (+ Nerd set). |
| 68, 69, 70, 71 MacGuffin ITOPOD (LootDrop::itopodDrop 534, killsPerMacguffin 540) | idle-macguffins-v1.js:298-308 | CONFORME | 5 000 kills x 0,8 x 0,75 x 0,75 avec TRONCATURE entre chaque facteur (`conv.i4`) : 5 000 -> 4 000 -> 3 000 -> 2 250. SOREAL utilise `k *= ...` en flottant ; le résultat final est identique ici car les produits sont entiers (aucune différence de troncature pour ces valeurs). |
| 84, 85 Iron Pill | `ironPillMultiplier` | CONFORME | voir ci-dessus. |
| 86 Daycare slot (InventoryController::daycareSpaces 3578) | `daycareSlotBonus` | CONFORME | +1. |
| 87 Not So Minor (BeastQuestController::minorQuestReward 1246) | `idleQuestBonusTotalsV1` idle-questing-v1.js:164 | ÉCART | le jeu ajoute +2 à la base mineure DÈS QUE niveau > 0 (sans condition de difficulté) ; SOREAL ne l'ajoute que si `state.difficulty === "extreme"` (la ligne `minorBaseBonus` filtre tout le total). En Evil, le perk (achetable en Evil) ne donne donc rien. |
| 89, 90 | voir QP / Quest drop | CONFORME | |
| 91, 92, 105, 106 Idle divider (BeastQuestController::idleDropFactor 1260) | `idleQuestIdleDividerV1` | CONFORME | 8 - 2 (105) - 1 (106) - 1 (91) - 1 (92), plancher 3. |
| 93 Respawn (AdventureController::respawnTime 140) | `respawnReductionV1` idle-ngu-bonus.js:1123 | CONFORME | multiplicatif `1 - niv x 0,001`. |
| 104 Truly Idle Questing (updateIdleQuest 1257) | `questTrulyIdle` | CONFORME | auto-remise et nouvelle quête si case « autocycle » cochée et niveau >= 1. |
| 108 à 110, 155, 156, 159, 160 Wishes | voir ci-dessus | ÉCART (vitesse) / CONFORME (temps min) | |
| 113 à 115, 217 à 219 Hacks (HacksController::milestoneThreshold 3208) | `hackMilestoneReduction` | CONFORME | seuil de palier - niveau du perk. |
| 145 (consumeItem 3794, dumpAllIntoQuest 3769) | `questHandinReduction` | NON VÉRIFIÉ en détail | SOREAL traite 145 comme 1 niveau de la formule `11 - b` ; le jeu part d'une base de 10 (`questHandinRatio` 1256, perk 146 - quirk 71 - souhait 80 - souhait 81 Sadistic, plancher 2). Résultat identique : b = 1 -> diviseur 10, b = 9 -> 2. |
| 146 (questHandinRatio 1256) | idem | CONFORME | gaté Evil dans les deux. |
| 147, 148 (questMajor/Minor reward 1245, 1246) | `majorBaseBonus` / `minorBaseBonus` | CONFORME | majeure : souhait 101 (Sadistic) + perk 147 ; mineure : 10 + 2 (perk 87) + perk 148 (Sadistic) + souhait 102, plafonné à 16 (inatteignable en SOREAL sans le plafond). |
| Fibonacci 144 (bonusLootLevels), 89 (Character::addAP 2225), 987 (addExp 2221) | `lootLevelChance`, `apEarningsMultiplier`, `expEarningsMultiplier` | CONFORME | 89 : x1,02 sur les AP avant arrondi ; 987 : x1,05 sur l'EXP avant `floor`. |
| Fibonacci 233, 610 (BeastQuestController::questRewardFactor 1250, startQuest 1239) | `qpEarningsMultiplier`, `questFixedItems` | CONFORME | x1,1 QP ; 610 -> 50 objets exactement (sinon 50 à 59). |
| ABSENT : perk 56 « Macguffin Daycare! » | catalogue | ABSENT | aucun effet défini (le jeu a l'entrée 56 dans la liste de 232). Connu et documenté dans l'en-tête d'idle-perks-v1.js (vitesse de daycare des fragments non publiée). À lire dans le jeu : `InventoryController` / `AllDaycareController` n'utilisent pas `perkLevel[56]` dans les recherches faites (aucun résultat ; peut être sans effet dans le jeu). |

## 2. Écarts priorisés et corrections proposées

Les corrections supposent que les valeurs EPL de la scène sont celles du catalogue SOREAL (non vérifié, section 3).

1. **Ressource 3 : produit au lieu de somme (impact très fort).** `idle-perks-v1.js`, ajouter les trois clés à `PERK_CLES_PRODUIT_V1` et les exposer en produit :
   - `export const PERK_CLES_PRODUIT_V1 = Object.freeze([..., "qpEarningsPct", "r3PowerPct", "r3BarsPct", "r3CapPct"]);`
   - `r3PowerMultiplier: produits.r3PowerPct, r3BarsMultiplier: produits.r3BarsPct, r3CapMultiplier: produits.r3CapPct,` (au lieu de `1 + (totals.r3...Pct || 0)`).
   Ordre de grandeur au maximum : x128 au lieu de x8 sur la puissance de la ressource 3.
2. **Vitesse des NGU : produit au lieu de somme.** Dans `PERK_CLES_PRODUIT_V1` ajouter `"nguSpeedEnergyPct"` et `"nguSpeedMagicPct"`, et remplacer `nguSpeedEnergyMultiplier: 1 + (totals.nguSpeedEnergyPct || 0)` par `produits.nguSpeedEnergyPct` (idem magie). Le perk 144 (x1,2 sur les deux) deviendra automatiquement un facteur séparé de 1,2 (`nguSpeedEnergyPct: 0.2` dans le bonus de 144 reste correct comme facteur car `1 + 0.2`). Attention : les paliers Fibonacci 5 et 8 sont déjà en `tier.nguSpeedEnergyPct` : traités par la boucle de produit.
3. **Vitesse des Wishes : produit.** Ajouter `"wishSpeedPct"` à `PERK_CLES_PRODUIT_V1` et `wishSpeedMultiplier: produits.wishSpeedPct`.
4. **Perk 144 : attaque et défense x10 et non x11.** Dans le catalogue, id 144 : `statPct: 9.0` (le jeu applique 10 comme facteur ; avec `1 + statPct` il faut 9,0). Le texte du perk (« 1000% bonus ») reste inchangé. Les autres facteurs stats sont corrects (4 : x2 ; 125 : x3 ; Fibonacci 377 : x3,77).
5. **Drop chance : perk 125 multiplicatif avec le perk 3.** `dropChanceMultiplier: 1 + (totals.dropChancePct || 0)` donne 1,6 ; le jeu donne 1,1 x 1,5 = 1,65. Correction : produit de deux clés, par exemple ajouter `"dropChancePct"` à `PERK_CLES_PRODUIT_V1` et `dropChanceMultiplier: produits.dropChancePct` (perk 3 : `1 + 0,10` ; perk 125 : `1 + 0,50`). Vérifier qu'aucun autre perk n'écrit dans `dropChancePct`.
6. **Quête mineure : perk 87 sans condition de difficulté.** `idle-questing-v1.js:164` : séparer le bonus du perk 87 de celui de 148 et du souhait 102. Le jeu ajoute 2 si niveau du perk 87 > 0 (aucune condition), ajoute le perk 148 seulement si difficulté >= Sadistic ; le souhait 102 n'est pas gaté dans l'IL (le souhait est de toute façon Sadistic dans SOREAL). Plafond du total mineur : 16.
7. **Plafond 0,75 des banques (AT, Time Machine, Beard).** `idle-ngu-actions.js:682, 683, 695` : `Math.min(0.75, ...)` autour de `atBankPct`, `tmBankPct`, `beardBankPct`. Sans effet tant que perks (max 0,50) + quirks restent sous 0,75 (quirks non audités ici).
8. **Cap des perks `maxLevel == 0` (illimité).** Vérifier dans la scène quels perks ont `maxLevel[i] == 0` ; SOREAL les plafonne (Rich Perks à 1000, Fibonacci à 1597). À contrôler avec les valeurs de scène.
9. **Pas d'écart dans la formule de PP d'ITOPOD** : base, ordre et palier d'étage sont conformes ; seul le plancher `max(1, ppMultiplier)` manque dans `advanceTowerV1` (le jeu remonte à 1 si la valeur est inférieure), sans effet tant que le multiplicateur est >= 1.

## 3. Ce que je n'ai pas pu vérifier

- **Tous les nombres de scène** : `cost[]` (coût de chaque perk), `maxLevel[]` (cap), `effectPerLevel[]` (pourcentage par niveau), `perkDifficultyReq[]` (difficulté exigée par perk) sont des champs sérialisés Unity du `ItopodPerkController` (level0), absents de l'IL et non lus (lecture binaire trop risquée). Les coûts, caps et pourcentages du catalogue SOREAL (issus du wiki) sont donc NON VÉRIFIÉS contre le jeu. Ce que l'IL confirme : forme du coût (plat par niveau), structure (produit de facteurs `1 + niv x EPL`), et la difficulté exigée codée en dur dans certaines méthodes (Evil >= 1 pour 57/58/59/60/61/62, 74 à 79, 63/64, 80/81, 82, 95 à 103, 108, 116 à 124 selon `perkEffect`, 125 ; Sadistic >= 2 pour 144, 157, 158 selon la table) : cohérent avec `IDLE_PERK_DIFFICULTE_V1`.
- `perkDifficultyReq` pour les perks appelés via `perkEffect` (126 à 143, 149 à 160, 220 à 230, 200 à 207) : lu seulement par recoupement avec `idle-difficulty-gates-v1.js` (non confirmé dans le jeu).
- Perks de cartes 161 à 216 (Cards/Mayo/Tags/Deck) : seules les formules d'agrégation (468 à 471) ont été lues ; le côté SOREAL (`idle-cards-v1.js`) n'a pas été relu.
- Perk 34 (Bonus Titan EXP) : site d'appel non trouvé (`ITOPOD.perkLevel` hors contrôleur ne le liste pas). Perk 35 : agrégat conforme, consommateur `BossController::rewardExp` lu seulement en partie. Perk 21 : formule du jeu relevée mais `beardRebirthTimeFactor` non relu.
- Effets des MacGuffins (perks 65 à 73, 88 : sorts, slots) : seules les formules de drop ITOPOD (540) et le niveau de base (552) ont été relues.
- Facteurs d'objets de `totalPPBonus` (cœur vert x1,2, clé x1,1, pretty x1,1, halloweenies x1,45) : présence dans `itopodPpPct` non vérifiée.
- Quirks (utilisés dans les banques, le PP de base, la quête) : hors groupe.
- Sites d'appel plus lointains des perks (`Character::trainingOfflineProgress`, `adventureOfflineProgress`, `ImportExport::loadData`, `ButtonShower`, `StatsDisplay`) : non ouverts (affichage ou rejeu hors ligne).
