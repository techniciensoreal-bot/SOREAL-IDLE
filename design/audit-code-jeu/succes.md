# Audit des succes (Achievements) : jeu NGU Idle build 1260 contre moteur SOREAL

Sources : IL de `AllAchievementsController` (`achievementCondition` id 27, `achievementHint` id 26, `markAchievementAsComplete` id 24, `checkAchievements` id 22, `bonusAP` id 14, `calcMaxBP`, `AchieveCount` = 153), tableau serialise `achievementBP` (long[153], `NGUIdle_Data/level0`, offset 2567960), sites d'appel de `markAchievementAsComplete`. Moteur : `cloudflare/src/idle-achievements-v1.js`, `idle-ngu-bonus.js` (`achievementMetricsV1`), `idle-ngu-actions.js` (Speedrun), `idle-adventure-combat.js` (drapeaux titans). Aucun fichier du depot modifie hormis ce rapport.

## 1. Mecanique du jeu (lue dans l'IL)

- 153 succes (ids 0 a 152). Ids 0-95 : 6 groupes de 16 (Energy Power, Magic Power, Energy Cap, Magic Cap, Energy Bars, Magic Bars) ; 96-125 : boss 10..300 ; 126-134 et 144-152 : les 18 secrets ; 135-143 : les 9 Rebirth.
- `checkAchievements` tourne toutes les 1 s (`InvokeRepeating("checkAchievements",0,1)` dans `Start`). Pour chaque succes non obtenu, `achievementCondition(i)` vrai => `achievementComplete[i]=true`. `totalBP` = somme des `achievementBP[i]` des succes obtenus. Les succes sont permanents.
- Conditions numeriques : toutes `valeur >= seuil` (le IL fait `clt` puis `ceq 0`).
  - `totalEnergyPower/MagicPower` : valeur effective avec bonus (ITOPOD, objets, MacGuffins, Beast Quest, souhaits, plafond dur, potions) ; `totalCapEnergy/Magic` : idem sans potion ; `totalEnergyBar/MagicBar` : avec potion de barre.
  - Boss : `Character.bossID >= N`. `bossID` est 0-base (remis a 0 par `resetBoss`, +1 par `advanceBoss`) : `bossID >= N` = « les N premiers boss sont vaincus » = « Defeat Boss N ». Toutes difficultes.
  - Rebirth : `stats.rebirthNumber >= N` ; ce compteur est +1 a chaque `Rebirth::engage` (toutes difficultes) et passe a 10000 au minimum via `LootDrop::zone45Drop` (traitor).
- **Seule recompense des succes : le bonus AP.** `bonusAP() = 1 + totalBP/10000`, applique dans `Character::addAP` (2 variantes) et `checkAPAdded` : `floor(base x bonusAP x (1,2 si itemMaxxed[129] sinon 1+bonus[25]) x (1,02 si perk ITOPOD 94 >= 89))`. Affiche dans `StatsDisplay` (« Achievements Modifier »). Il n'existe AUCUN bonus EXP : la methode `bonusEXP` evoquee dans la mission n'existe pas dans ce build (19 methodes, une seule `bonusAP`).
- Effets de deblocage portes par des succes : id 145 (Walderp forme finale) = deblocage des MacGuffins (lu par ~25 `LootDrop::zoneNDrop`, `Character::adventureOfflineProgress`, `FruitController::upgrade`, `ArbitraryController::startMacguffin*AP`, `InventoryController::updateMacguffinButton`, `InfoDisplay`, `ItopodPerkUIController`) ; id 129 (menu Yggdrasil) = condition de `TrollChallengeController::unlocked` ; ids 128/129/130/145 = affichage des minuteurs de titans (`ButtonShower::showTitanTimer`, tant que bossID < 58/66/100/116) ; ids 151 (Beast V4) et 152 (Evil) = entree en Evil (`Rebirth::setEvilNextRebirth` : 152 deja obtenu, OU highestBoss >= 300 ET 151 ET `attackBoost x itopod.totalStatBonus >= 10000`).
- Secret Speedrun (147) : `Rebirth::checkSpeedrunSecret` : si `bossID >= 37` ET `rebirthTime <= 1800 s` => `speedrunCount++` (sinon remis a 0) ; a 3 : `gotSpeedrunSecret=true`, +200 EXP, `energyPower += 1`.

## 2. Tableau complet des 153 succes

Statut : OK = nom/seuil/condition/BP identiques ; l'id SOREAL est celui de `IDLE_ACHIEVEMENTS_V1`.

| id jeu | Nom (jeu) | Condition exacte (IL) | BP jeu | id SOREAL | BP SOREAL | Statut |
|---|---|---|---|---|---|---|
| 0 | Obtain 10 or more Energy Power! | totalEnergyPower >= 10 | 5 | energyPower_10 | 5 | OK |
| 1 | Obtain 30 or more Energy Power! | totalEnergyPower >= 30 | 10 | energyPower_30 | 10 | OK |
| 2 | Obtain 100 or more Energy Power! | totalEnergyPower >= 100 | 15 | energyPower_100 | 15 | OK |
| 3 | Obtain 300 or more Energy Power! | totalEnergyPower >= 300 | 20 | energyPower_300 | 20 | OK |
| 4 | Obtain 1,000 or more Energy Power! | totalEnergyPower >= 1,000 | 25 | energyPower_1000 | 25 | OK |
| 5 | Obtain 3,000 or more Energy Power! | totalEnergyPower >= 3,000 | 30 | energyPower_3000 | 30 | OK |
| 6 | Obtain 10,000 or more Energy Power! | totalEnergyPower >= 10,000 | 35 | energyPower_10000 | 35 | OK |
| 7 | Obtain 30,000 or more Energy Power! | totalEnergyPower >= 30,000 | 35 | energyPower_30000 | 35 | OK |
| 8 | Obtain 100,000 or more Energy Power! | totalEnergyPower >= 100,000 | 40 | energyPower_100000 | 40 | OK |
| 9 | Obtain 300,000 or more Energy Power! | totalEnergyPower >= 300,000 | 40 | energyPower_300000 | 40 | OK |
| 10 | Obtain 1,000,000 or more Energy Power! | totalEnergyPower >= 1,000,000 | 40 | energyPower_1000000 | 40 | OK |
| 11 | Obtain 3,000,000 or more Energy Power! | totalEnergyPower >= 3,000,000 | 45 | energyPower_3000000 | 45 | OK |
| 12 | Obtain 10,000,000 or more Energy Power! | totalEnergyPower >= 10,000,000 | 45 | energyPower_10000000 | 45 | OK |
| 13 | Obtain 30,000,000 or more Energy Power! | totalEnergyPower >= 30,000,000 | 45 | energyPower_30000000 | 45 | OK |
| 14 | Obtain 100,000,000 or more Energy Power! | totalEnergyPower >= 100,000,000 | 50 | energyPower_100000000 | 50 | OK |
| 15 | Obtain 300,000,000 or more Energy Power! | totalEnergyPower >= 300,000,000 | 50 | energyPower_300000000 | 50 | OK |
| 16 | Obtain 3 or more Magic Power! | totalMagicPower >= 3 | 5 | magicPower_3 | 5 | OK |
| 17 | Obtain 10 or more Magic Power! | totalMagicPower >= 10 | 10 | magicPower_10 | 10 | OK |
| 18 | Obtain 30 or more Magic Power! | totalMagicPower >= 30 | 15 | magicPower_30 | 15 | OK |
| 19 | Obtain 100 or more Magic Power! | totalMagicPower >= 100 | 20 | magicPower_100 | 20 | OK |
| 20 | Obtain 300 or more Magic Power! | totalMagicPower >= 300 | 25 | magicPower_300 | 25 | OK |
| 21 | Obtain 1,000 or more Magic Power! | totalMagicPower >= 1,000 | 30 | magicPower_1000 | 30 | OK |
| 22 | Obtain 3,000 or more Magic Power! | totalMagicPower >= 3,000 | 35 | magicPower_3000 | 35 | OK |
| 23 | Obtain 10,000 or more Magic Power! | totalMagicPower >= 10,000 | 35 | magicPower_10000 | 35 | OK |
| 24 | Obtain 30,000 or more Magic Power! | totalMagicPower >= 30,000 | 40 | magicPower_30000 | 40 | OK |
| 25 | Obtain 100,000 or more Magic Power! | totalMagicPower >= 100,000 | 40 | magicPower_100000 | 40 | OK |
| 26 | Obtain 300,000 or more Magic Power! | totalMagicPower >= 300,000 | 40 | magicPower_300000 | 40 | OK |
| 27 | Obtain 1,000,000 or more Magic Power! | totalMagicPower >= 1,000,000 | 45 | magicPower_1000000 | 45 | OK |
| 28 | Obtain 3,000,000 or more Magic Power! | totalMagicPower >= 3,000,000 | 45 | magicPower_3000000 | 45 | OK |
| 29 | Obtain 10,000,000 or more Magic Power! | totalMagicPower >= 10,000,000 | 45 | magicPower_10000000 | 45 | OK |
| 30 | Obtain 30,000,000 or more Magic Power! | totalMagicPower >= 30,000,000 | 50 | magicPower_30000000 | 50 | OK |
| 31 | Obtain 100,000,000 or more Magic Power! | totalMagicPower >= 100,000,000 | 50 | magicPower_100000000 | 50 | OK |
| 32 | Obtain A Total Energy Cap of 10,000 or more! | totalCapEnergy >= 10,000 | 5 | energyCap_10000 | 5 | OK |
| 33 | Obtain A Total Energy Cap of 100,000 or more! | totalCapEnergy >= 100,000 | 10 | energyCap_100000 | 10 | OK |
| 34 | Obtain A Total Energy Cap of 300,000 or more! | totalCapEnergy >= 300,000 | 15 | energyCap_300000 | 15 | OK |
| 35 | Obtain A Total Energy Cap of 1,000,000 or more! | totalCapEnergy >= 1,000,000 | 20 | energyCap_1000000 | 20 | OK |
| 36 | Obtain A Total Energy Cap of 3,000,000 or more! | totalCapEnergy >= 3,000,000 | 25 | energyCap_3000000 | 25 | OK |
| 37 | Obtain A Total Energy Cap of 10,000,000 or more! | totalCapEnergy >= 10,000,000 | 30 | energyCap_10000000 | 30 | OK |
| 38 | Obtain A Total Energy Cap of 30,000,000 or more! | totalCapEnergy >= 30,000,000 | 35 | energyCap_30000000 | 35 | OK |
| 39 | Obtain A Total Energy Cap of 100,000,000 or more! | totalCapEnergy >= 100,000,000 | 35 | energyCap_100000000 | 35 | OK |
| 40 | Obtain A Total Energy Cap of 300,000,000 or more! | totalCapEnergy >= 300,000,000 | 40 | energyCap_300000000 | 40 | OK |
| 41 | Obtain A Total Energy Cap of 1,000,000,000 or more! | totalCapEnergy >= 1,000,000,000 | 40 | energyCap_1000000000 | 40 | OK |
| 42 | Obtain A Total Energy Cap of 3,000,000,000 or more! | totalCapEnergy >= 3,000,000,000 | 40 | energyCap_3000000000 | 40 | OK |
| 43 | Obtain A Total Energy Cap of 10,000,000,000 or more! | totalCapEnergy >= 10,000,000,000 | 45 | energyCap_10000000000 | 45 | OK |
| 44 | Obtain A Total Energy Cap of 30,000,000,000 or more! | totalCapEnergy >= 30,000,000,000 | 45 | energyCap_30000000000 | 45 | OK |
| 45 | Obtain A Total Energy Cap of 100,000,000,000 or more! | totalCapEnergy >= 100,000,000,000 | 45 | energyCap_100000000000 | 45 | OK |
| 46 | Obtain A Total Energy Cap of 300,000,000,000 or more! | totalCapEnergy >= 300,000,000,000 | 50 | energyCap_300000000000 | 50 | OK |
| 47 | Obtain A Total Energy Cap of 1,000,000,000,000 or more! | totalCapEnergy >= 1,000,000,000,000 | 50 | energyCap_1000000000000 | 50 | OK |
| 48 | Obtain A Total Magic Cap of 30,000 or more! | totalCapMagic >= 30,000 | 5 | magicCap_30000 | 5 | OK |
| 49 | Obtain A Total Magic Cap of 100,000 or more! | totalCapMagic >= 100,000 | 10 | magicCap_100000 | 10 | OK |
| 50 | Obtain A Total Magic Cap of 300,000 or more! | totalCapMagic >= 300,000 | 15 | magicCap_300000 | 15 | OK |
| 51 | Obtain A Total Magic Cap of 1,000,000 or more! | totalCapMagic >= 1,000,000 | 20 | magicCap_1000000 | 20 | OK |
| 52 | Obtain A Total Magic Cap of 3,000,000 or more! | totalCapMagic >= 3,000,000 | 25 | magicCap_3000000 | 25 | OK |
| 53 | Obtain A Total Magic Cap of 10,000,000 or more! | totalCapMagic >= 10,000,000 | 30 | magicCap_10000000 | 30 | OK |
| 54 | Obtain A Total Magic Cap of 30,000,000 or more! | totalCapMagic >= 30,000,000 | 35 | magicCap_30000000 | 35 | OK |
| 55 | Obtain A Total Magic Cap of 100,000,000 or more! | totalCapMagic >= 100,000,000 | 35 | magicCap_100000000 | 35 | OK |
| 56 | Obtain A Total Magic Cap of 300,000,000 or more! | totalCapMagic >= 300,000,000 | 40 | magicCap_300000000 | 40 | OK |
| 57 | Obtain A Total Magic Cap of 1,000,000,000 or more! | totalCapMagic >= 1,000,000,000 | 40 | magicCap_1000000000 | 40 | OK |
| 58 | Obtain A Total Magic Cap of 3,000,000,000 or more! | totalCapMagic >= 3,000,000,000 | 40 | magicCap_3000000000 | 40 | OK |
| 59 | Obtain A Total Magic Cap of 10,000,000,000 or more! | totalCapMagic >= 10,000,000,000 | 45 | magicCap_10000000000 | 45 | OK |
| 60 | Obtain A Total Magic Cap of 30,000,000,000 or more! | totalCapMagic >= 30,000,000,000 | 45 | magicCap_30000000000 | 45 | OK |
| 61 | Obtain A Total Magic Cap of 100,000,000,000 or more! | totalCapMagic >= 100,000,000,000 | 45 | magicCap_100000000000 | 45 | OK |
| 62 | Obtain A Total Magic Cap of 300,000,000,000 or more! | totalCapMagic >= 300,000,000,000 | 50 | magicCap_300000000000 | 50 | OK |
| 63 | Obtain A Total Magic Cap of 1,000,000,000,000 or more! | totalCapMagic >= 1,000,000,000,000 | 50 | magicCap_1000000000000 | 50 | OK |
| 64 | Obtain Total Energy Bars of 3 or more! | totalEnergyBar >= 3 | 5 | energyBars_3 | 5 | OK |
| 65 | Obtain Total Energy Bars of 10 or more! | totalEnergyBar >= 10 | 10 | energyBars_10 | 10 | OK |
| 66 | Obtain Total Energy Bars of 30 or more! | totalEnergyBar >= 30 | 15 | energyBars_30 | 15 | OK |
| 67 | Obtain Total Energy Bars of 100 or more! | totalEnergyBar >= 100 | 20 | energyBars_100 | 20 | OK |
| 68 | Obtain Total Energy Bars of 300 or more! | totalEnergyBar >= 300 | 25 | energyBars_300 | 25 | OK |
| 69 | Obtain Total Energy Bars of 1,000 or more! | totalEnergyBar >= 1,000 | 30 | energyBars_1000 | 30 | OK |
| 70 | Obtain Total Energy Bars of 3,000 or more! | totalEnergyBar >= 3,000 | 35 | energyBars_3000 | 35 | OK |
| 71 | Obtain Total Energy Bars of 10,000 or more! | totalEnergyBar >= 10,000 | 35 | energyBars_10000 | 35 | OK |
| 72 | Obtain Total Energy Bars of 30,000 or more! | totalEnergyBar >= 30,000 | 40 | energyBars_30000 | 40 | OK |
| 73 | Obtain Total Energy Bars of 100,000 or more! | totalEnergyBar >= 100,000 | 40 | energyBars_100000 | 40 | OK |
| 74 | Obtain Total Energy Bars of 300,000 or more! | totalEnergyBar >= 300,000 | 40 | energyBars_300000 | 40 | OK |
| 75 | Obtain Total Energy Bars of 1,000,000 or more! | totalEnergyBar >= 1,000,000 | 45 | energyBars_1000000 | 45 | OK |
| 76 | Obtain Total Energy Bars of 3,000,000 or more! | totalEnergyBar >= 3,000,000 | 45 | energyBars_3000000 | 45 | OK |
| 77 | Obtain Total Energy Bars of 10,000,000 or more! | totalEnergyBar >= 10,000,000 | 45 | energyBars_10000000 | 45 | OK |
| 78 | Obtain Total Energy Bars of 30,000,000 or more! | totalEnergyBar >= 30,000,000 | 50 | energyBars_30000000 | 50 | OK |
| 79 | Obtain Total Energy Bars of 100,000,000 or more! | totalEnergyBar >= 100,000,000 | 50 | energyBars_100000000 | 50 | OK |
| 80 | Obtain Total Magic Bars of 3 or more! | totalMagicBar >= 3 | 5 | magicBars_3 | 5 | OK |
| 81 | Obtain Total Magic Bars of 10 or more! | totalMagicBar >= 10 | 10 | magicBars_10 | 10 | OK |
| 82 | Obtain Total Magic Bars of 30 or more! | totalMagicBar >= 30 | 15 | magicBars_30 | 15 | OK |
| 83 | Obtain Total Magic Bars of 100 or more! | totalMagicBar >= 100 | 20 | magicBars_100 | 20 | OK |
| 84 | Obtain Total Magic Bars of 300 or more! | totalMagicBar >= 300 | 25 | magicBars_300 | 25 | OK |
| 85 | Obtain Total Magic Bars of 1,000 or more! | totalMagicBar >= 1,000 | 30 | magicBars_1000 | 30 | OK |
| 86 | Obtain Total Magic Bars of 3,000 or more! | totalMagicBar >= 3,000 | 35 | magicBars_3000 | 35 | OK |
| 87 | Obtain Total Magic Bars of 10,000 or more! | totalMagicBar >= 10,000 | 35 | magicBars_10000 | 35 | OK |
| 88 | Obtain Total Magic Bars of 30,000 or more! | totalMagicBar >= 30,000 | 40 | magicBars_30000 | 40 | OK |
| 89 | Obtain Total Magic Bars of 100,000 or more! | totalMagicBar >= 100,000 | 40 | magicBars_100000 | 40 | OK |
| 90 | Obtain Total Magic Bars of 300,000 or more! | totalMagicBar >= 300,000 | 40 | magicBars_300000 | 40 | OK |
| 91 | Obtain Total Magic Bars of 1,000,000 or more! | totalMagicBar >= 1,000,000 | 45 | magicBars_1000000 | 45 | OK |
| 92 | Obtain Total Magic Bars of 3,000,000 or more! | totalMagicBar >= 3,000,000 | 45 | magicBars_3000000 | 45 | OK |
| 93 | Obtain Total Magic Bars of 10,000,000 or more! | totalMagicBar >= 10,000,000 | 45 | magicBars_10000000 | 45 | OK |
| 94 | Obtain Total Magic Bars of 30,000,000 or more! | totalMagicBar >= 30,000,000 | 50 | magicBars_30000000 | 50 | OK |
| 95 | Obtain Total Magic Bars of 100,000,000 or more! | totalMagicBar >= 100,000,000 | 50 | magicBars_100000000 | 50 | OK |
| 96 | Defeat Boss 10! | bossID >= 10 | 5 | boss_10 | 5 | OK |
| 97 | Defeat Boss 20! | bossID >= 20 | 10 | boss_20 | 10 | OK |
| 98 | Defeat Boss 30! | bossID >= 30 | 15 | boss_30 | 15 | OK |
| 99 | Defeat Boss 40! | bossID >= 40 | 20 | boss_40 | 20 | OK |
| 100 | Defeat Boss 50! | bossID >= 50 | 25 | boss_50 | 25 | OK |
| 101 | Defeat Boss 60! | bossID >= 60 | 25 | boss_60 | 25 | OK |
| 102 | Defeat Boss 70! | bossID >= 70 | 30 | boss_70 | 30 | OK |
| 103 | Defeat Boss 80! | bossID >= 80 | 30 | boss_80 | 30 | OK |
| 104 | Defeat Boss 90! | bossID >= 90 | 35 | boss_90 | 35 | OK |
| 105 | Defeat Boss 100! | bossID >= 100 | 35 | boss_100 | 35 | OK |
| 106 | Defeat Boss 110! | bossID >= 110 | 35 | boss_110 | 35 | OK |
| 107 | Defeat Boss 120! | bossID >= 120 | 40 | boss_120 | 40 | OK |
| 108 | Defeat Boss 130! | bossID >= 130 | 40 | boss_130 | 40 | OK |
| 109 | Defeat Boss 140! | bossID >= 140 | 40 | boss_140 | 40 | OK |
| 110 | Defeat Boss 150! | bossID >= 150 | 45 | boss_150 | 45 | OK |
| 111 | Defeat Boss 160! | bossID >= 160 | 45 | boss_160 | 45 | OK |
| 112 | Defeat Boss 170! | bossID >= 170 | 45 | boss_170 | 45 | OK |
| 113 | Defeat Boss 180! | bossID >= 180 | 45 | boss_180 | 45 | OK |
| 114 | Defeat Boss 190! | bossID >= 190 | 50 | boss_190 | 45 | BP DIFFERENT |
| 115 | Defeat Boss 200! | bossID >= 200 | 50 | boss_200 | 50 | OK |
| 116 | Defeat Boss 210! | bossID >= 210 | 50 | boss_210 | 50 | OK |
| 117 | Defeat Boss 220! | bossID >= 220 | 50 | boss_220 | 50 | OK |
| 118 | Defeat Boss 230! | bossID >= 230 | 55 | boss_230 | 50 | BP DIFFERENT |
| 119 | Defeat Boss 240! | bossID >= 240 | 55 | boss_240 | 55 | OK |
| 120 | Defeat Boss 250! | bossID >= 250 | 55 | boss_250 | 55 | OK |
| 121 | Defeat Boss 260! | bossID >= 260 | 55 | boss_260 | 55 | OK |
| 122 | Defeat Boss 270! | bossID >= 270 | 60 | boss_270 | 60 | OK |
| 123 | Defeat Boss 280! | bossID >= 280 | 60 | boss_280 | 60 | OK |
| 124 | Defeat Boss 290! | bossID >= 290 | 60 | boss_290 | 60 | OK |
| 125 | Defeat Boss 300! | bossID >= 300 | 60 | boss_300 | 60 | OK |
| 126 | Survive an attack from an exploder enemy! | markAchievementAsComplete(126) dans EnemyAI::explode : si PV du joueur > 1 apres l'explosion (attaque x1000) | 30 | secretExploder | 30 | OK |
| 127 | Wear a set of Helmet, Chest, Legs, Boots, and Weapon, all at level 69 | all69() : head, chest, legs, boots, weapon, Equipment.level == 69 chacun | 30 | secretLevel69 | 30 | OK |
| 128 | Unlock the NGU menu! | settings.nguOn (pose en consommant l'objet de deblocage NGU, ItemController::consumeItem) | 100 | secretNguMenu | 100 | OK |
| 129 | Unlock the Yggdrasil menu! | settings.yggdrasilOn (consommation de l'objet Yggdrasil). Sert aussi de condition de deblocage du Troll Challenge | 100 | secretYggdrasilMenu | 100 | OK |
| 130 | Unlock the Beards menu! | settings.beardsOn (consommation de l'objet Beards) | 100 | secretBeardsMenu | 100 | OK |
| 131 | Defeat Gordon Ramsay Bolton before they can attack even once! | enemyDeath, zone 6 (titan 1) : EnemyAI.growCount <= 1 | 100 | secretNoHitGrb | 100 | OK (condition differente, voir E3) |
| 132 | Defeat Grand Corrupted Tree before they can attack even once! | enemyDeath, zone 8 (titan 2) : growCount <= 1 | 100 | secretNoHitGct | 100 | OK (condition differente, voir E3) |
| 133 | Defeat Jake From Accounting before they can attack even once! | enemyDeath, zone 11 (titan 3) : growCount <= 1 | 100 | secretNoHitJake | 100 | OK (condition differente, voir E3) |
| 134 | Defeat UUG, The Unmentionable before they can attack even once! | enemyDeath, zone 14 (titan 4) : growCount <= 1 | 100 | secretNoHitUug | 100 | OK (condition differente, voir E3) |
| 135 | Rebirth once! | stats.rebirthNumber >= 1 | 5 | rebirth_1 | 5 | OK |
| 136 | Rebirth 3 times | stats.rebirthNumber >= 3 | 10 | rebirth_3 | 10 | OK |
| 137 | Rebirth 10 times! | stats.rebirthNumber >= 10 | 15 | rebirth_10 | 15 | OK |
| 138 | Rebirth 30 times! | stats.rebirthNumber >= 30 | 20 | rebirth_30 | 20 | OK |
| 139 | Rebirth 100 times! | stats.rebirthNumber >= 100 | 25 | rebirth_100 | 25 | OK |
| 140 | Rebirth 300 times! | stats.rebirthNumber >= 300 | 30 | rebirth_300 | 30 | OK |
| 141 | Rebirth 1000 times! | stats.rebirthNumber >= 1000 | 40 | rebirth_1000 | 40 | OK |
| 142 | Rebirth 3000 times! | stats.rebirthNumber >= 3000 | 50 | rebirth_3000 | 50 | OK |
| 143 | Rebirth 10000 times! | stats.rebirthNumber >= 10000 | 60 | rebirth_10000 | 60 | OK |
| 144 | Clicked the bottom right corner of the advanced training menu. There, are you happy now? | appel de markAchievementAsComplete(144) non trouve dans l'IL : cable dans la scene (evenement UI Unity serialise) | 60 | secretAtCorner | 60 | OK |
| 145 | Defeat WALDERP's final form! | enemyDeath zone 16 avec waldoDefeats >= 4 (et manageFight, zone 16 ennemi index 4). Debloque aussi les MacGuffins | 100 | secretWalderpFinal | 100 | OK |
| 146 | Defeat WALDERP's final form before they can attack even once! | enemyDeath zone 16, forme finale, growCount <= 1 | 100 | secretNoHitWalderp | 100 | OK (condition differente, voir E3) |
| 147 | Speedrun 3 times in a row with rebirths under 30 minutes each, with boss 37 defeated! | settings.gotSpeedrunSecret (Rebirth::checkSpeedrunSecret) | 20 | secretSpeedrun | 20 | OK |
| 148 | Defeat THE BEAST V1! | enemyDeath zone 19, titan6Unlocked, enemyType 13 (aussi manageFight, zone 19 ennemi index 1) | 25 | secretBeastV1 | 25 | OK |
| 149 | Defeat THE BEAST V2! | enemyDeath zone 19, enemyType 15 (manageFight : ennemi index 2) | 25 | secretBeastV2 | 25 | OK |
| 150 | Defeat THE BEAST V3! | enemyDeath zone 19, enemyType 16 (manageFight : ennemi index 3) | 25 | secretBeastV3 | 25 | OK |
| 151 | Defeat THE BEAST V4! | enemyDeath zone 19, enemyType 17 (manageFight : ennemi index 4) | 25 | secretBeastV4 | 25 | OK |
| 152 | Enter Evil difficulty for the first time. | Rebirth::startHardRebirth (confirmation du passage en Evil) | 25 | secretEvil | 25 | OK |

Totaux : jeu = 5825 BP (somme du tableau serialise, egale au « maximum de 5825 » annonce par le wiki et par `calcMaxBP`). SOREAL = 5815 BP (le test `idle-achievements.test.mjs` l. 30 et 113 le verrouille a 5815).

## 3. Resultat de la comparaison

Identiques au jeu (verifie par script sur les 153) : le nombre de succes (153), les 126 premiers noms et seuils (aucun ecart sur les 96 ressources, les 30 boss, les 9 Rebirth), les 6 baremes de 16 BP, les BP Rebirth, les BP des 18 secrets (30,30,100x7,60,20,25x5), la formule `1 + BP/10000`, la serie Speedrun (<= 30 min, boss 37+, serie remise a 0, +200 EXP +1 Energy Power une seule fois, `idle-ngu-actions.js` l. 607-620), le deblocage des MacGuffins par la forme finale de Walderp, le plancher `totalRebirths = 10000` au traitor.

## 4. Ecarts, par priorite

### E1 (BP faux, 2 lignes) : Boss 190 et Boss 230
Le bareme `BP_BOSS` (`idle-achievements-v1.js` l. 71) a ete recopie d'une table du wiki fausse (le wiki annonce 5825 alors que ses lignes font 5815 ; le commentaire l. 18-20 constatait l'ecart sans le resoudre : c'est la table qui est fausse, le jeu fait bien 5825). Bareme du jeu, par pas de 10 boss : 5,10,15,20,25,25,30,30,35,35,35,40,40,40,45,45,45,45,**50**,50,50,50,**55**,55,55,55,60,60,60,60.
- Defeat Boss 190 : jeu 50, SOREAL 45.
- Defeat Boss 230 : jeu 55, SOREAL 50.
Correctif exact : remplacer la ligne 71 par
`const BP_BOSS = Object.freeze([5, 10, 15, 20, 25, 25, 30, 30, 35, 35, 35, 40, 40, 40, 45, 45, 45, 45, 50, 50, 50, 50, 55, 55, 55, 55, 60, 60, 60, 60]);`
puis : corriger le commentaire l. 18-20 ; dans `cloudflare/tests/idle-achievements.test.mjs` passer 5815 a 5825 (l. 29-30 et 113 ; l. 115 l'exemple `floor(9 x 1,5815)=14` reste 14 avec 1,5825) ; regenerer `cloudflare/tests/references/partie-reference-1.json` (le grep y trouve BP_BOSS/boss_190 ou 5815) ; relancer `build-moteur-local.mjs` puis `maj-pins.mjs` (regle n°7, moteur embarque dans la page). Effet joueur : +10 BP au total en fin de jeu, multiplicateur AP 1,5825 au lieu de 1,5815 ; les comptes qui ont deja ces deux succes sont mis a jour automatiquement (`idleAchievementsBpV1` recalcule la somme a chaque lecture).

### E2 (condition plus stricte que le jeu) : « Defeat <titan> before they can attack even once » (ids 131-134 et 146)
Le jeu accorde le succes si `EnemyAI.growCount <= 1` a la mort du titan (`AdventureController::enemyDeath` : `growCount > 1` => pas de succes). `growCount` augmente de 1 a chaque attaque du titan (`theButcherAI`, `corruptedTreeAI`, `jakeAI`, `uugAI`, `waldoAI` : `growCount = growCount + 1` au moment de l'attaque). Le jeu tolere donc UNE attaque du titan, malgre le texte « pas une seule ». SOREAL (`ui-aventure-1-v1.js` l. 2227 : `sansCoup = Boolean(fight.titanId) && !(REG.idleTitanAttaquesV1 > 0)`) exige 0 attaque. Correctif : remplacer `> 0` par `> 1` (au plus 1 attaque avant la mort du titan) ; pour Walderp, meme seuil sur le compteur de la forme finale (le jeu remet `growCount` a 0 dans `resetAI` ; verifier que le compteur client est remis a 0 a chaque forme). Puis relancer `idle-succes-audit-complet-v1`. Priorite moyenne : SOREAL est plus dur que le jeu (100 BP chacun), jamais plus facile. Note : UUG ajoute 400 a `growCount` dans une phase (invincible) ; apres elle le succes est impossible dans le jeu aussi.

### E3 (effet porte par un succes) : Yggdrasil -> Troll Challenge
Le jeu : `TrollChallengeController::unlocked` lit `achievementComplete[129]` (menu Yggdrasil debloque, c.-a-d. objet Yggdrasil consomme). SOREAL : le defi Troll se debloque par `unlock:{titan:"t2"}` (`idle-ngu-catalogues.js` l. 259), a la victoire sur le titan 2. Equivalent si SOREAL debloque Yggdrasil automatiquement a cette victoire ; sinon ajouter `state.systems.yggdrasil.unlocked` a la condition. A verifier avec le rapport des defis. Priorite basse.

### E4 (mesure des succes de ressources : non verifiable ici)
Le jeu evalue `totalEnergyPower/MagicPower/CapEnergy/CapMagic/EnergyBar/MagicBar` (IL ids 2142-2149). SOREAL utilise `idleNguEffectiveResourceStatV1` (`idle-ngu-ressources.js`) : bonus x plafond dur x potion pour power/bars, sans potion pour cap. Structure compatible, mais l'egalite exacte depend des audits des bonus (objets, MacGuffins, perks, souhaits) faits dans les autres rapports ; un ecart n'a d'effet que pres d'un seuil.

### E5 (conditions confiees au client ou hors IL)
- Exploder (126) : le jeu l'accorde si les PV du joueur restent > 1 apres l'explosion (attaque x1000, `EnemyAI::explode`). SOREAL accepte un drapeau client si le combat en cours est de type explosif (`idle-adventure-combat.js` l. 181). Equivalent par construction, non recalculable cote serveur.
- Coin d'Advanced Training (144) : aucun `markAchievementAsComplete(144)` dans l'IL ; le jeu le cable par un evenement UI serialise dans la scene. SOREAL : action `cornerClick`. Fonctionnellement equivalent, non verifiable ici.
- Beast V1-V4 (148-151) : le jeu marque a la mort de l'ennemi `enemyType` 13/15/16/17 de la zone 19 (avec `titan6Unlocked`) ; SOREAL mappe V1..V4 sur les paliers Easy/Normal/Hard/Brutal (`beastDefeated_*`, `idle-ngu-bonus.js` l. 58-61). A recouper avec `ia-ennemis-titans.md` : si le jeu a 4 ennemis distincts (V1 a V4) et non 4 paliers de difficulte, la correspondance est a revoir.
- Evil (152) : accorde a la confirmation du passage en Evil (`startHardRebirth`) ; entree exigee : highestBoss >= 300, Beast V4 tue (151) et `attackBoost x totalStatBonus ITOPOD >= 10000` (message « 1,000,000% bonus »), sauf si 152 deja obtenu. SOREAL : `evilEntered = difficulty difficile/extreme ou pic > 0` ; equivalent si la porte d'entree SOREAL applique ces trois conditions (non verifie ici).

### E6 (visibilite : choix SOREAL, pas un ecart de regle)
Le jeu affiche pour un secret non obtenu un indice (`achievementHint`) ; SOREAL affiche « ????? » et le boss a tuer (exception anti-spoil de Norman, 2026-10-10). Indices du jeu, pour memoire : exploder « You need to withstand a mighty blow. », set 69 « lol 69. », menus NGU/Ygg/Beards et Walderp final et Beasts « This will take a Titanic effort. », no-hit « Not even once. », coin « You know it bothers you. », Speedrun « It's mentioned in the WTF pages! » ; Evil : pas d'indice. Les boss d'apparition `BOSS_SECRETS` (58/66/82/100/116/132/300/37) sont des valeurs SOREAL, pas du jeu ; le commentaire l. 122-125 les signale mais sans les mots-cles du scanner `idle-constantes-soreal-registre-v1` (« choix SOREAL », « approximation documentee ») : a inscrire au registre si ce n'est pas fait.

### E7 (libelles, sans impact de jeu)
Le jeu dit « Obtain Total Energy **Bars** of 3 or more! » ; « Defeat Uug The Unmentionable » (indice) / « UUG, The Unmentionable » (nom) ; « Rebirth 3 times » sans point d'exclamation ; secret 144 : « Clicked the bottom right corner of the advanced training menu. There, are you happy now? » (SOREAL ne garde que la premiere phrase).

## 5. Ce qui n'a pas pu etre verifie
- Le cablage du clic du coin (144) : porte par la scene Unity.
- L'egalite exacte des valeurs `totalEnergyPower/...` avec `idleNguEffectiveResourceStatV1`.
- La correspondance Beast V1-V4 (types d'ennemi 13/15/16/17 contre paliers de difficulte).
- Les conditions d'entree en Evil cote SOREAL.
- Le comptage client des attaques de titan (`REG.idleTitanAttaquesV1`) et sa remise a zero par forme de Walderp.
- Les succes Steam (`SteamManager::checkAllAchievements`) : hors perimetre.
