# Audit code du jeu (build 1260) contre le moteur SOREAL : groupe « economie »

Méthode : IL de `Assembly-CSharp.dll` désassemblé (`d.mjs`), comparé au code de `cloudflare/src/*.js`. Aucune lecture de `level0`
(constantes de scène non lues : elles sont signalées « NON VÉRIFIÉ »). Rien n'a été modifié dans le dépôt hors ce rapport.
Légende : CONFORME / ÉCART / ABSENT / NON VÉRIFIÉ. « (calc.) » = vérifié par recalcul numérique des deux côtés.

## 1. Tableaux

### 1.1 DailyRewardController (roue journalière)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `currentTier` (2992) | `dailySpinTierV48_` idle-ngu-snapshot.js:1118 | CONFORME | totalSpins <7→0, <14→1, <30→2, <60→3, <120→4, <180→5, <365→6, sinon 7 ; SOREAL seuils [0,7,14,30,60,120,180,365], `>=` identique |
| `spinsToNextTier` (3008) | affichage seulement | NON VÉRIFIÉ | simple compte à rebours (7,14,30,60,120,180,365 − totalSpins), pas de gameplay |
| `getTier0RewardIndex` + `tier0Reward` (2975/2976) | `IDLE_DAILY_SPIN_REWARDS_V1[0]` idle-ngu-snapshot.js:1091 | CONFORME (calc.) | r<0,6→idx0 ; <0,9→idx1 ; (r<0,1→idx2 inatteignable) ; sinon idx0 : 70 % AP50 / 30 % AP100 ; SOREAL 70/30 |
| `getTier1RewardIndex` + `tier1Reward` (2977/2978) | `[1]` | CONFORME (calc.) | seuils 0,5/0,85/0,95/0,96/0,97, sinon idx0 : AP100 53 %, AP200 35 %, AP1000 10 %, potion Énergie1 1 %, potion Magie1 1 % ; SOREAL identique |
| `getTier2…`/`tier2Reward` (2979/2980) | `[2]` | CONFORME (calc.) | AP200 53 (45+8 du « sinon »), AP400 30, AP2000 10, puis 7 lots à 1 % (Énergie1, Magie1, Énergie2, Magie2, LootCharm1, EnergyBarBar, MagicBarBar) ; identique |
| `getTier3…`/`tier3Reward` (2981/2982) | `[3]` | CONFORME (calc.) | AP300 37, AP600 25, AP3000 10, Én1 2, Mag1 2, Én2 1, Mag2 1, Charm 2, EBB 2, MBB 2, 20 graines 10, 2 Poop 5, Jackpot 0,5, AP50000 0,5 ; jackpot = 1 de chaque conso + 2 Poop ; identique |
| `getTier4…`/`tier4Reward` (2983/2984) | `[4]` | CONFORME (calc.) | AP500 50, AP1000 25, AP5000 10, 7 lots à 1, 100 graines 5, 5 Poop 1, Jackpot 0,5 (Én1-3, Mag1-3, Charm1, EBB, MBB, 5 Poop, Charm2, +1000 `buffedKills`), AP75000 0,5, Énergie3 0,5, Magie3 0,5 ; identique (`littleBluePill1000` = 1000 kills bufés) |
| `…tier5…` (2985/2986) | `[5]` | CONFORME (calc.) | AP800 36, AP1600 25, AP8000 10, lots 2/2/1/1/2/2/2, 400 graines 10, 10 Poop 5, Jackpot 0,5 (Én1×2, Én2×2, Én3×1, idem Magie, Charm1×2, EBB×2, MBB×2, 10 Poop, Charm2×1, +2000 kills, Beast Butter×1, MacGuffin Booster×1), AP100000 0,5, Én3 0,5, Mag3 0,5 ; identique |
| `…tier6…` (2987/2988) | `[6]` | CONFORME (calc.) | AP1200 35, AP2400 25, AP12000 10, lots ×2 (poids 2/2/1/1/2/2/2), 2000 graines 10, 25 Poop 5, Én3 1, Mag3 1, Jackpot 0,5, AP150000 0,5 ; identique |
| `…tier7…` (2989/2990) | `[7]` | CONFORME (calc.) | idem tier 6 avec AP1500/3000/15000, 5000 graines, AP175000, Jackpot ×3 ; identique |
| `startNoBullshitSpin` / `startSpin` (2999/2998) | `spinDaily` idle-ngu-snapshot.js:1128 | CONFORME | totalSpins+1, tirage uniforme sur la table du palier courant, AP via `addAP` (voir 1.2) ; le jeu attend 5 s d'animation avant de donner, SOREAL immédiat (UI) |
| `Character::addAP` (2225) | `apWithBonusV1` idle-ngu-bonus.js:272 | CONFORME (partiel) | jeu : floor(base × bonusAP succès × (objet 129 maxé ? 1,2 : 1+bonus inventaire[25]) × (perk ITOPOD[94]≥89 ? 1,02 : 1)) ; SOREAL : succès × Heart × perk Fibonacci 89. Le mapping Heart = objet 129 / bonus[25] n'a pas été relu côté SOREAL (NON VÉRIFIÉ pour ce détail) |
| `canSpin` (3000), `maxSpinTime` (2971), `targetSpinTime` (2972) | `spinDaily` bankCapMs | CONFORME | prêt si temps cumulé ≥ 86400 s ; plafond du cumul 129600 s (36 h), 604800 s (7 j) avec `hasExtendedSpinBank` ; SOREAL : cadence 24 h, retard banqué ≤ 12 h (ou 144 h) = même dynamique |
| `DailyReward::.ctor` (2968) | `advanceMoneyPitAndDaily` idle-ngu-systemes.js:310 | ÉCART mineur | jeu : `spinTime` initial = 82800 s (23 h), et le chrono tourne depuis la création du personnage (plafonné à 36 h) ; SOREAL : `readyAt = now` au déblocage, donc pas de retard banqué au 1er tour |
| `freeSpins` (consommé dans `startSpin`) | aucun | ABSENT | tours gratuits (promos) : ne coûtent pas de temps ; alimentés par `InfonStuffController::claimKartPromo/claimSteamPromo`, hors périmètre SOREAL |
| `newSpinOutcome` (2997) | aucun | NON VÉRIFIÉ | ne sert qu'à l'animation (compteur de tours, plis à 60/90/120/180/240), aucune valeur de gameplay |
| `updateSpinLoop` (2993), `Update` (2991) | aucun | CONFORME | l'avance du chrono (`advanceTime(deltaTime)` tant que < max) = temps réel ; la récompense est tirée via `Random.state` sauvegardé : sans effet de gameplay hors reproductibilité |

### 1.2 Rebirth (65)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `calculateTimeMulti` (2721) | `idleNguRebirthTimeFactor` idle-ngu-ressources.js:21 | CONFORME (calc.) | t/2^35/3600 (<60 s), t/2^25/3600 (<120), t/518144/3600 (<180), /16192 (<240), /2048 (<300), /512 (<420), /128 (<600), /32 (<720), /8 (<900), /4 (<1800), /2 (<3600), sinon 1 + t/172800 ; SOREAL équivalent en minutes, toutes les constantes recoupées |
| `calculateNextMultis` (2722) | `calculateIdleNguNextNumber` idle-ngu-ressources.js:35 | CONFORME | nextAttack = nextDefense = 1 + bossMulti × oldBossMulti × oldTimeMulti × (1 + ⌊totalAttackLevels/10000⌋) × macguffin[17] × timeMulti × Ygg.permNumber × blood.rebirthPower × beards.number × NGU.number × hacks.number ; SOREAL : même produit (1 + produit de 11 facteurs) |
| `setNewMultis` (2710) | `rebirthIdleNguState`/`applyRebirthResetV56_` | CONFORME | attackMulti = nextAttackMulti, oldBossMulti = bossMulti, oldTimeMulti = timeMulti, lastBlood = rebirthPower |
| `hardResetMultis` (2705) | `forceNumber:1` idle-ngu-actions.js:597 | CONFORME | tout à 1 (NUMBER, boss, temps) sur changement de difficulté / démarrage de défi |
| `awardAP` (2678) | idle-ngu-actions.js:601 | **ÉCART** | jeu : `loc0 = (long)rebirthSeconds − 3600` (≥0), AP = loc0 / 500 (division entière) puis `addAP` ; SOREAL : `floor(runSeconds/500)` dès 3600 s. Ex. 7200 s : jeu 7 AP, SOREAL 14. De plus le jeu appelle `awardAP` dans CHAQUE `engage` (Rebirth, changement de difficulté, début de défi), SOREAL le saute pour un défi |
| `minRebirthTime` (2681) | `minRebirthSecondsV1` idle-ngu-snapshot.js:1497 | CONFORME | clamp(180 − 10 × niveau du souhait 20, 120, 180) ; SOREAL 180 − 10 × min(6, niveau) |
| `rebirth` (2667) conditions | `rebirthIdleNguState` idle-ngu-actions.js:1267 | CONFORME (partiel) | refus pendant nuke/combat de boss, défi No Rebirth, temps < min ; le jeu exige `bossID > 0` (au moins un boss) alors que SOREAL exige `REBIRTH_UNLOCK_BOSS_V1` = 4 : le palier d'apparition du bouton est dans `ButtonShower` (NON VÉRIFIÉ) |
| `engage` (2674) ordre des opérations | `applyRebirthResetV56_` | CONFORME (partiel) | jeu : checkSpecial → awardAP → convertBeardTrimmings → applyAllMacguffinBonuses → checkSecrets → setNewMultis → reset(énergie, magie, R3, training, boss, temps, tout, or, stats, Yggdrasil) → rebirthNumber+1 → instaTrain → (si défi) hardResetMultis + challengeReset(AT, barbes, TM) → addBankedLevels barbes (si pas défi et barbes actives) ; SOREAL suit le même ordre logique |
| `checkSpeedrunSecret` (2680) | idle-ngu-actions.js:613 | ÉCART mineur | jeu : bossID ≥ 37 et temps **≤ 1800 s** (`bgt.un` saute si > 1800), compteur remis à 0 sinon, bonus 200 EXP + 1 énergie power une seule fois à 3 ; SOREAL : `runSeconds < 30*60` (strict) |
| `checkSpecial` (2675) | aucun | ABSENT / NON VÉRIFIÉ | secret : les 4 indices terminés, temps de Rebirth entre 2585 et 2615 s, Titan 6 non débloqué ⇒ `titan6Unlocked = true`. Aucun équivalent trouvé (grep `clue`/`2585`) ; le Titan 6 SOREAL passe par un autre mécanisme (`hiddenPanel`) non comparé |
| `resetEnergy` (2711) | `applyNaturalEnergyCapGrowthOnRebirth` idle-ngu-actions.js:578 | CONFORME | si cap ≤ 100000 : cap = min(100000, ⌊énergie obtenue/20 + 500⌋) ; curEnergy = idleEnergy = 0 |
| `resetTraining` (2715) | idle-basic-training.js:290 | CONFORME | r = ⌊1 + (n − 500·i)^1,2 / 500 × cap/1000⌋, r ≥ 1, r ≤ cap/10+1, cap−r si > 1 sinon 1 ; niveaux, énergie, barres à 0 |
| `resetBoss` (2716) | `applyRebirthResetV56_` | CONFORME (partiel) | bossID=0, bossMulti=1 ; **nukeTimer remis à 50 s** : non relu côté SOREAL (NON VÉRIFIÉ) |
| `resetTime` (2717), `resetGold` (2718), `resetStats` (2723), `resetMagic/Res3/AdvancedTraining/Augments` (2713,2714,2719,2720) | idem | CONFORME (partiel) | attaque/défense de base remises à 100, or à 0, Pit tossedGold/tossCount à 0 ; les sous-resets sont des appels (corps dans d'autres classes) |
| `instaTrain` (2676) | `instaTrainingCapSorealIdle_` idle-runtime-actions.js:1349 | ÉCART probable | jeu : si capEnergy ≥ 12 : `curEnergy += 12`, `attackEnergy[0] = 6`, `defenseEnergy[0] = 6` (inconditionnel) ; SOREAL : 6 sur attaque, 6 sur blocage seulement avec la synchro Basic Training, et sans l'ajout de 12 à l'énergie libre. Sémantique exacte du `+12` non tranchée (énergie créée ?) : à confirmer en jeu |
| `rebirthDifficultySwitch` / `setEvilNextRebirth` / `setSadisticNextRebirth` (2668/2670/2671) | `idleNguDifficultyUnlockRequirementsV1` idle-ngu-actions.js:947 | ÉCART | Evil : `highestBoss ≥ 300` + succès 151 (Bête v4) + `attackBoost × bonus ITOPOD ≥ 10000` ; Sadistic : `highestHardBoss ≥ 300` + Exile v4 vaincu : conforme. MAIS le jeu saute TOUS les tests Evil si le succès 152 (déjà passé en Evil) est obtenu ; SOREAL les ré-exige à chaque entrée |
| `startHardRebirth` (2707) | `difficultyAction` | CONFORME | succès 152 marqué complet à l'entrée en Evil ; engage(true) + hardResetMultis |
| `startNormalRebirth` (2706) | idem | CONFORME | difficulté 0, nguLevelTrack ramené à 0 s'il > 0 |
| `verifyChallengeStatus` (2682) + `start/engage*Challenge` (2683-2704) | module défis (hors groupe) | NON VÉRIFIÉ | seule la garde commune a été lue : temps min, pas déjà en défi, bossID > 0 ; chaque défi appelle `engage(true)` (donc AP + conversion de barbes) |
| `Rebirth::Update/refreshMenus/checkSecrets/updateDifficultyButtons/rebirthTime/cancel/tryHardReset*/doHardReset/hardReset` | — | NON VÉRIFIÉ | UI, confirmations, suppression de sauvegarde |

### 1.3 Garderie (DaycareItemController, AllDaycareController)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `AllDaycareController::daycareTime` (3293) | `idleDaycareFactorsV1` timeParts, idle-daycare-v1.js:~403 | CONFORME | durée par niveau = `daycareRate[id]` × facteur Blind (1 − 0,05 si ≥1 complétion, − 0,01 × complétions, plancher 0,85) × (1 − niveau perk27 × effet) × (1 − niveau perk28 × effet) × (0,9 si `hasDaycareSpeed`) ; SOREAL : blindNormal ≥1 ? 1−0,05−0,01n : 1 ; perkTimeMultiplier ; sellout 0,9. L'effet par niveau des perks 27/28 (scène `ItopodPerkController.effectPerLevel`) et la table `daycareRate` (scène) : NON VÉRIFIÉS |
| `DaycareItemController::updateDaycareTimer` (3329) | `advanceIdleDaycareV1` idle-daycare-v1.js:~490 | CONFORME (partiel) | le timer avance de `deltaTime × totalDaycareBonus()` tant que l'objet existe et (niveau < 100 ou type = 11) ; SOREAL : `secs × speedMultiplier`. ÉCART de bord : le jeu exempte le **type 11** du plafond 100 (voir `levelsAdded`) ; SOREAL plafonne tout à 100 (`IDLE_DAYCARE_MAX_LEVEL_V1`). Le type 11 n'a pas été identifié (NON VÉRIFIÉ) |
| `levelsAdded` (3338) | `levelFromHoursV1` | CONFORME (partiel) | ⌊temps cumulé / daycareRate⌋, plafonné à (100 − niveau) sauf type 11 ; SOREAL ⌊heures/ (base × facteur)⌋ plafonné à 100 |
| `AllGoldDiggerController::totalDaycareBonus` (3123/3124) | `daycareFactorsV1` idle-ngu-actions.js:1210 | CONFORME | vitesse = digger[9] × (1 + bonus inventaire[44]) × (1 + 0,02 × Blind Evil) × (1 + 0,01 × Blind Sadistic) × hacks.totalDaycareSpeed × wishes.totalDaycareSpeed (1 + 0,01 × niveau, souhait 27) × cartes[12] × (1,05 si perk 94-index ≥ 55), plancher 1 ; SOREAL : gear, fibonacci 1,05, souhait 27 (borné 10), blindEvil, blindSadistic, digger, hack, cartes |
| `kiityTooltip`, `updateKitty`, `advanceKitty`, `showPanel/hidePanel`, `equip`, `daycareID`, `OnDrop/OnBeginDrag/endDragAction` | — | NON VÉRIFIÉ | habillage du chat / glisser-déposer, pas de valeur de jeu |
| Nombre d'emplacements | `idleDaycareFactorsV1.slots` | NON VÉRIFIÉ | la logique d'achat des emplacements n'est pas dans les deux classes lues |

### 1.4 Barbes (AllBeardsController, BeardController)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `beardProgressPerTick` (1133) | `advanceBeardTrack` idle-ngu-pistes.js:192 | CONFORME | 0 si la ressource n'est pas PLEINE ; sinon totalBar × √totalPower × (1 + inv[26] + inv[42]) / speedDivider[id] / (niveau+1) / beardCountDivider × digger × BeastQuest.totalBeardSpeed × (1,1 si objet « uug ») ; SOREAL le reproduit (la division par (niveau+1) via `ticksDe`), diviseur et items inclus |
| `beardCountDivider` (1138) | idle-ngu-systemes.js:566-570 | CONFORME | max(compte,1) ; avec Beardverse et ≥ 1,9 : × 0,9 ; plancher 1 ; SOREAL `max(1, count × 0,9)` équivalent |
| `advanceBeard` (1142) | `niveauxEnTicksV1` | CONFORME | progress += rate ; ≥1 → progress = 0 (sans report), +1 niveau seulement si `canLevel`, rebirthLevels+1 (défi 100 niveaux) |
| `capBeards` (1132) / `beardSize` | `beardSlotsV1` idle-ngu-pistes.js:29 | CONFORME | 1 + `hasBeardSlot1` + (Troll ≥ 4 complétions) + `arbitrary.beardSlots`, borné à la taille de la liste (7) |
| `timeFactor` (1147) | `beardRebirthTimeFactor` idle-ngu-bonus.js:514 | **ÉCART** | jeu : 0 si t < 3600 s, sinon `t / 10800 × 24 / (24 − niveau perk21)` = t/(450 × (24−L)), plafond 8 (CONTINU en secondes) ; SOREAL : `clamp(⌊t/3600⌋ × 8/(24−L), 0, 8)` (heures ENTIÈRES). Ex. 1 h 59 : jeu 0,66 / SOREAL 0,33 |
| `addedTrimmings` + `convertToTrimmings` (1149/1150) | `convertActiveBeardOnRebirth` idle-ngu-bonus.js:521 | CONFORME | gain = min(niveau, ⌊√niveau × timeFactor⌋) ajouté à `permLevel`, pour chaque barbe ACTIVE |
| `convertBeardTrimmings` (1148) | idem | CONFORME | boucle sur les barbes actives |
| `reset` (1144) (banque Rebirth) | `applyRebirthResetV56_` idle-ngu-actions.js:668 | **ÉCART** | jeu : POUR CHAQUE barbe (actives ou non) `bankedLevel = (long)(beardLevel × ItopodPerk.totalBankedBeardTemp)`, niveau et barre remis à 0 ; SOREAL : un seul nombre `state.bank.beards` calculé sur la 1re barbe active |
| `addBankedLevels` (1146) | restitution de banque | ÉCART (conséquence) | jeu : une seule fois par Rebirth (`transferredBankedLevels`), `beardLevel = bankedLevel` pour chaque barbe |
| `challengeReset` (1145) | `clearBanks:true` | CONFORME | banque à 0 |
| `statBonus/tempStatBonus/permStatBonus` (1151-1155) | `beardBonusMultiplier(..."attackDefense")` | CONFORME | temp = 1 + niveau × 0,05 ; perm = 1 + (permLevel) × 0,01 ; produit ; plancher 1 |
| `lootBonus…` (1156-1160) | `role "drop"` | CONFORME | temp : ≤1000 → 1 + L×0,0005 ; > 1000 → 1 + L^0,3 × 125,9 × 0,0005 ; perm : ≤1000 → L×0,0005 ; > 1000 → L^0,33 × 102,4 × 0,0005 |
| `numberBonus…` (1161-1165) | `role "number"` | CONFORME | temp ×0,01 (L^0,5 × 31,7), perm ×0,001 (même soft-cap) |
| `nguBonus…` (1166-1170) | `role "ngu"` | CONFORME | temp 0,0001 (L^0,3 × 125,9), perm 0,0002 (idem) |
| `wandoosBonus…` (1171-1175) | `role "wandoos"` | CONFORME | temp 0,001 (L^0,5 × 31,7), perm 0,002 |
| `adventureBonus…` (1176-1180) | `role "adventure"` | CONFORME | temp 0,001 (L^0,3 × 125,9), perm 0,0005 (L^0,5 × 31,7) |
| `goldBonus…` (1181-1185) | `role "gold"` | CONFORME | temp 0,002, perm 0,005 (L^0,5 × 31,7) |
| `energyBeardSpeedFactor` / `magicBeardSpeedFactor` (1134/1135) | non utilisés | CONFORME | ne servent qu'à l'affichage (StatsDisplay::displayBeards) ; le facteur MacGuffin[8/9] n'entre pas dans `beardProgressPerTick` |
| `activateBeard` (1137) | `beardActiveIdsV1` | CONFORME | refuse au-delà de `capBeards` |
| `tallyEnergyMagicBeards`, `deactivateBeard`, `clearActiveBeards`, `wipeTempBeards`, `refreshMenu`, `updateBeardDisplay`, `BeardController::*` | — | NON VÉRIFIÉ | UI et tenue de listes |

### 1.5 Mineurs d'or (AllGoldDiggerController)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `upgradeCost` (3090) | `diggerCostAtLevel` idle-ngu-systemes.js:620 | CONFORME | base × croissance^maxLevel ; SOREAL unlockCost × growth^(cible−1) avec cible = maxLevel+1. Les bases (1e16, 1e19, 1e22, 1e25, 1e28) et croissances (1,5 / 1,75) sont confirmées indirectement par `hardCapLevel` (calc.) ; non lues directement dans la scène |
| `hardCapLevel` (3082) | `cap:` de `IDLE_NGU_DIGGERS` idle-ngu-catalogues.js:571 | CONFORME (calc.) | ⌊log_croissance(DBL_MAX / (2 × base))⌋ = 1657 / 1188 / 1176 / 1164 / 1151, recalculé : identique aux 12 plafonds SOREAL |
| `drain` (3086-3089) | `diggerDrainAtLevel` | CONFORME | baseGPSDrain × croissance^(niveau−1) si actif et niveau > 0 ; (valeurs de drain en scène : NON VÉRIFIÉ ; SOREAL 1e12…1e24) |
| `totalGPSDrain` (3098) | `diggerDrainTotal` | CONFORME (partiel) | somme sur actifs avec `consumesGPS[i]` ; SOREAL somme tous les actifs (le tableau `consumesGPS` est en scène : NON VÉRIFIÉ) |
| `activateDigger` (3099) | `toggleDigger` | CONFORME | refus si slots pleins, niveau < 1, ou `totalGPSDrain > grossGoldPerSecond` après activation |
| `maxDiggerSlots` (3104) | `availableDiggerSlots` idle-ngu-systemes.js:656 | CONFORME (partiel) | 1 + `hasDiggerSlot1` + ITOPOD + `arbitrary.diggerSlots` + `jakeNoteComplete` + (Défi No TM ≥ 5) borné à 12 ; SOREAL : slots + set + défi + perks + boutique Sellout (≤6) + EXP, borné 12. Les deux sources non défi (jakeNote, hasDiggerSlot1) = `setRewards.diggerSlot`/`expShop` non recoupées |
| `sumOfAllLevels` (3130) + `totalLevelBonus` (3131) | `diggerGlobalBonus` idle-ngu-systemes.js:618 | CONFORME | somme des `maxLevel` ; 1 + 0,0005 × S si S ≤ 500, sinon 1,25 + 0,0005 × (S−500)^0,7 ; +0,05 (Défi No TM ≥ 1) ; +0,05 (set Party) ; ADDITIFS ; identique |
| `totalXBonus` (3105-3128) | `diggerBonuses`/`diggerPctAtLevel` | CONFORME (structure) | valeur = max(1, (1 + départ + niveau × palier) × totalLevelBonus) ; Stat : 1 + départ + niveau^3 × palier ; SOREAL 150+L, 200+L³, 110+0,5L, 120+L, 110+L, 105+0,1L, 105+0,5L (%) : valeurs `startingBoost`/`boostPerLevel` en scène, NON VÉRIFIÉES |
| `setLevelMaxAffordable` (3102) | `niveauMaxSupporteDiggerV1` | ÉCART mineur | jeu : niveau = ⌊ln(GPS net / baseDrain) / ln(croissance)⌋ (donc un niveau en dessous du plus haut abordable), plafonné à `maxLevel` ; SOREAL : plus haut niveau dont le drain tient (= ⌊log⌋ + 1) |
| `upgradeMaxLevel` / `upgradeMaxLevelFully` (3100/3101) | `upgradeDigger` | CONFORME | maxLevel +1 contre `upgradeCost`, refusé à `hardCapLevel`, payé en `realGold` |
| `reset`, `clearAllActiveDiggers`, `changePage`, `pageUp/Down`, `setDiggerLoadout`, `applyDiggerLoadout`, `refreshMenu`, `showTooltip`, `updateText`, `bonusString` | — | NON VÉRIFIÉ | UI |

### 1.6 Hacks (HacksController)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `progressPerTick` (3186) | `advanceHackTrack` idle-ngu-pistes.js:289 | CONFORME | R3 alloué × puissance R3 totale × `totalHackSpeedBonus` / (baseDivider × levelDivider) ; SOREAL : débit r3 × power × hackSpeed, durée = divider × 1,0078^L × (L+1) ; sans les barres de R3, comme le jeu |
| `levelDivider` (3188) | idem | CONFORME | 1,0078^niveau × (niveau+1) |
| `hardCapLevel` (3199) | `HACK_HARD_CAP_V1` idle-ngu-pistes.js:285 | CONFORME (calc.) | L0 = ⌊log_{1,0078}(1e38/base) + 1⌋ ; cap = ⌊log_{1,0078}(1e38 / base / L0)⌋ : recalculé pour les 15 hacks, identique (7720, 7632, 7544, 7544, 7456, 7340, 7340, 7252, 7164, 7048, 6960, 6873, 6757, 6757, 6262) |
| `hackBonus` (3203) | `hackFxV1` idle-ngu-bonus.js:200 | CONFORME | (1 + (niveau+arg) × effetParNiveau) × milestoneEffet^⌊niveau/seuil⌋ ; neutre si difficulté Normal ou hacks `disabled` |
| `milestoneThreshold` (3208) | idem, mapping perks/quirks/souhaits | CONFORME | seuil − niveau de : quirk 57 (Att/Déf), perk 113 (Aventure), quirk 175 (TM), perk 217 (Drop), perk 218 (Augments), quirk 174 (Énergie NGU), perk 219 (Magie NGU), perk 114 (Sang), souhait 76 (QP), perk 115 (Garderie), quirk 59 (EXP), souhait 77 (Number), quirk 58 (PP), souhait 78 (Hack), quirk 60 (Souhaits) ; vérifié contre idle-perks/quirks et `hackFxV1` |
| `numMilestonesReached`, `levelsToNextMilestone`, `nextMilestoneTarget`, `setToNextMilestone` (3204-3210) | cibles de hack (Target / avancer) | NON VÉRIFIÉ | logique de cible (arrondi au multiple suivant du seuil) ; SOREAL gère un « Target » générique (règle propre à SOREAL, documentée) |
| `totalHackSpeedBonus` (3226) | `hackSpeedMultiplier` idle-ngu-bonus.js:1103 | CONFORME (partiel) | hackHack × souhaits(18,42,63) × cartes[6] × (1 + inv[50] + cube) × (objet 297 maxé : ×1,25) × (1 + 0,2 × NGU-Evil) × (Troll Evil ≥ 5 : ×1,25), plancher 1 ; SOREAL : mêmes termes ; le terme « cartes[6] » passe par idle-cards (non relu) |
| `totalStatBonus…totalPPGainBonus` (3211-3225) | `hackFxV1` | CONFORME | chacun = `hackBonus(id)` neutre si Normal ou `disabled` |
| `endHackAvailable` (3192) + `endHackSpeed` (3193) + `updateAllHacks` (3194) | `IDLE_THE_END_FINAL_HACK_SECONDS_V1` idle-the-end-v1.js:51 | CONFORME (calc.) | le 16e hack s'ouvre quand les 15 autres sont à leur cap ; +1e-7 de barre par tick (50/s) = 200 000 s ; SOREAL 200 000 s |
| `addR3/removeR3/removeAllR3/autoAdvance/hitTarget` (3189-3196) | allocation R3 | NON VÉRIFIÉ | répartition des points et avance automatique |
| `progressPerTickCap`, `timeLeft`, `checkBarUpdate`, `checkTextUpdate`, `changePage`, `initializePage`, `showTooltip` | — | NON VÉRIFIÉ | affichage |

### 1.7 Yggdrasil et fruits (AllYggdrasil, FruitController et sous-classes)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `AllYggdrasil::capTier` (5012) | `yggMaxTier` idle-ngu-systemes.js:315 | CONFORME | 10, ou 24 si Troll ≥ 3 complétions |
| `FruitController::tierThreshold` (5040) | `idleYggTierSecondsV1` idle-yggdrasil-extra-v1.js:272 | CONFORME | 3600 − min(60 × niveau quirk 13, 180) s par tier |
| `harvestTier` (5041) + `Fruit::addTime` (5033) + `updateFruitTimers` (5007) | `advanceYggdrasil` idle-ngu-systemes.js:~585 | CONFORME | tier = min(⌊secondes/seuil⌋, maxTier), temps plafonné à maxTier × seuil ; activation auto si `permCostPaid` |
| `FruitController::upgrade` (5046) | `upgradeYggFruit` / `yggTierUpgradeCost` | CONFORME (partiel) | coût = `baseSeedCost[id]` × ⌈(maxTier+1)²⌉ ; SOREAL `tierCost × t²` (les valeurs de `baseSeedCost` sont en scène : NON VÉRIFIÉES) |
| Conditions de déblocage dans `upgrade` (5046) | `idleYggFruitUnlockedV1` idle-yggdrasil-extra-v1.js:299 | **ÉCART** | jeu : fruit 8 (Numbers) = Troll complétion 5 ; fruit 9 (Rage) = ITOPOD débloqué ; fruit 10 (MacGuffin α) = succès 145 (« vaincre un Titan précis ») ; fruit 14 (Quirks) = Bête/Titan 6 vaincu ; fruits 15-20 (mayo) = Cartes actives. SOREAL : Numbers ✓, Mayo (Cartes) ✓, tous les autres `true` |
| `activate` (5044) | `activateYggFruit` | CONFORME | coût `activationCost[id]` payé en énergie/magie « idle » ; refus si verrouillé (tier 0) |
| `seedReward` (5056) / `harvestSeedReward` (5057) | `yggSeedGain` idle-ngu-systemes.js:391 | CONFORME | ⌈ base[id] × facteur × (×2 pour la récolte) × Poop × perks graines × quête graines × (1 + inv[15]) × NGU Ygg × bonus de première récolte ⌉ ; SOREAL : mêmes termes (seedYield perks × quirks × NGU × gear × firstHarvest × poop), `ceil`. Pomegranate/Watermelon (récolte même en mangeant) ✓ ; Quirks mangé : tier linéaire ✓ |
| `tierFactor` (5086) | `Math.ceil(Math.pow(tier,1.5))` | CONFORME | ⌈tier^1,5⌉ |
| `usePoop` (5085) | `idleYggUsePoopV1` idle-yggdrasil-extra-v1.js:~84 | ÉCART mineur | jeu : avec l'objet 162 (Brown Heart) maxé, le compteur `poopUsed` est testé AVANT incrément : `poopUsed % 10 == 0` ⇒ utilisation gratuite (la 1re, la 11e, la 21e…), et même sans Poop en stock ; sinon consomme 1 ; facteur de Poop (`poopModifier`) borné à [1 ; 1,65] ; SOREAL : incrémente d'abord puis teste `% 10 === 0` (10e, 20e…), refuse sans stock |
| `consumeGoldFruit` (5060) | useYggFruit effet « gold » | ÉCART mineur | jeu : or = tierFactor × poop × **1800** × grossGPS × récolte[0], sans arrondi ; SOREAL : `ceil(factor × 30 × firstHarvest) × 60 × grossGPS` (arrondi de minutes) |
| `consumePowerFruit` (5061) | « powerAlpha » | CONFORME | totalLevels += ⌈tierFactor × poop × NGU Ygg × yggYield × récolte[1]⌉ ; bonus d'attaque/défense = 1 + totalLevels^1,5 |
| `consumeAdventureFruit` (5062) | « adventure » | CONFORME (partiel) | gain = trunc(Adventure.defense^0,2 × tf × poop × NGU × yield × récolte) ; Power +g, Toughness +g, MaxHP +3g, Regen +0,03g ; SOREAL ✓ (utilise `toughness` du calcul d'équipement : égal à `Adventure.defense` du jeu non confirmé) |
| `consumeKnowledgeFruit` (5063) | « experience » | CONFORME | ⌈5 × tf × poop × NGU × yield × récolte[3]⌉ × 3 (perk 19) × 3 (perk 20) → `addExp` ; borne int32 côté jeu (`conv.i4`) non reprise |
| `consumePomegranate` (5064) / `consumeWatermelon` (5073) | « seeds » | CONFORME | seulement `harvestSeedReward` |
| `consumeLuckFruit` (5066) | « luck » | CONFORME | totalLuck += ⌈base[5] × 0,7 × tf × poop × NGU × yield × récolte⌉ ; bonus = 1 + totalLuck × 0,0005 ; SOREAL `ceil(factor×0,7×yield) × 0,05 %` |
| `consumePermStatFruit` (5067) | « powerBeta » | CONFORME | totalPermStat += ⌈base[6] × tf × …⌉ ; bonus = 1 + total² × 0,0005, actif seulement après avoir mangé ce Rebirth (`permBonusOn`) ; SOREAL ✓ |
| `consumeAPFruit` (5068) | « ap » | CONFORME | AP = `addAP`(⌈15 × tf × poop × récolte[7]⌉) |
| `consumePermNumberFruit` (5069) | « numbers » | CONFORME | total += ⌈base[8] × tf × …⌉ (base 3) ; bonus 1 + total^1,3 × 0,0005 si actif ce Rebirth |
| `consumePPFruit` (5070) | « pp » | CONFORME | ⌈60000 × tf × poop × yggYield × bonus PP ITOPOD × récolte[9]⌉ en progression de PP |
| `consumeMacguffinFruit` (5071) | « macguffinAlpha » | ÉCART | jeu : ⌈tf × 0,5 × poop × yggYield × récolte[10] × **`wishes.totalFruitGuffbonus`**⌉ (souhait 60 : `wishEffect(60) = 1 + niveau × effetParNiveau`, texte « +20 % par niveau »), borné à 2^31−1 ; niveaux sur le 1er slot si souhait 25 sinon aléatoire ; SOREAL : 0,5 ✓, souhait 25 ✓, mais le souhait 60 n'est pas appliqué (ABSENT, signalé « non implémenté » dans idle-yggdrasil-extra-v1.js) |
| `consumeMacguffinFruit2` (5074) | « macguffinBeta » | CONFORME | ⌈tf × 0,1 × poop × yggYield × récolte[13]⌉, tous les MacGuffins ; SOREAL factor beta = 0,1 |
| `consumePermStatFruit2` (5072) | « powerDelta » | CONFORME | total += ⌈base[11] × tf × …⌉ (base 7) ; bonus 1 + total^1,3 × 1e-6, toujours actif ; SOREAL ✓ |
| `consumeQPFruit` (5075) | « quirks » | ÉCART (documenté) | jeu : ⌈3 × tier × poop × yggYield × `questRewardFactor` (÷ `butterModifier` si beurre utilisé) × récolte[14]⌉ ajoutés aux QP ; SOREAL : `QPRewardModifier = 1` (non publié). Les deux facteurs sont lisibles dans `BeastQuestController::questRewardFactor` et `AllArbitraryController::butterModifier` |
| `consumeMayoFruit1..6` (5076-5081) | « mayo » | CONFORME | progression de mana = tier^1,1 × 0,025 × `cards.totalMayoSpeed` × poop, partie entière → montant, reste → progression ; seeds via `seedReward` |
| `awardPartialPomegranate` (5065) | `pitGrainesGrenadeV1` idle-ngu-systemes.js:420 | CONFORME | ⌊harvestSeedReward(grenade, tier 24, poop 1) × fraction⌋ × multiple |
| `AllYggdrasil::permNumberBonus` (5018/5019) | idle-ngu-ressources.js:`yggFruitNumbersMultiplierV1` | CONFORME | 1 + total^1,3 × 0,0005 |
| `AllYggdrasil::permStatBonus` (5015/5016), `permStatBonus2` (5017), `luckBonus` (5014), `totalStatBonus` (5013/5182) | idle-ngu-bonus.js:720-722, 942 | CONFORME | β : 1 + total² × 0,0005 ; δ : 1 + total^1,3 × 1e-6 ; luck : 1 + total × 0,0005 ; α : 1 + total^1,5 (le jeu additionne 1 dans `Character::totalAttack`) |
| `Yggdrasil::reset`/`Fruit::reset` (5181/5028/5029) | `applyRebirthResetV56_` | CONFORME (partiel) | à chaque Rebirth : fruits désactivés, temps/total de niveaux/récoltes à 0 (donc « première récolte » à nouveau disponible) ; le jeu garde une fraction (`resetFactor`, multiplicateur entier du temps) si ce facteur vaut 1 : non modélisé (NON VÉRIFIÉ où il est posé) |
| `consumeAll` (5022) | action « tout manger/récolter » | NON VÉRIFIÉ | appelle `consumeFruit` ou `harvest` selon `eatFruit` pour chaque fruit prêt |
| `maxPomSeedReward` (5025) | `pitGrainesGrenadeV1` | CONFORME | harvestSeedReward(pomegranate, tierFactor(maxTier), 1) |
| `FruitController::Start/doAction/cancel/toggle*/updateFruitDisplay/updateButton/showTooltip/timeToNextTier/fruitMaxxed/validID/unlockInfo` | — | NON VÉRIFIÉ | UI et orchestrations |

## 2. Liste priorisée des écarts et corrections proposées

1. **Rebirth, AP (awardAP)** (impact : toute la progression d'AP des longs Rebirth, jusqu'à 2×). Le jeu retire 3600 s avant la division. Correction dans `idle-ngu-actions.js` ligne ~601 :
   ```js
   // lu dans le jeu (Rebirth::awardAP, build 1260) : AP = ((long)secondes - 3600, plancher 0) / 500, division entière ; appelé à chaque engage (Rebirth, difficulté ET début de défi)
   const secEntieres = Math.floor(runSeconds);
   const baseAp = Math.floor(Math.max(0, secEntieres - 3600) / 500);
   if (baseAp > 0) state.currencies.ap += apWithBonusV1(state, baseAp);
   ```
   Retirer la condition `!options.challengeId` si la décision d'origine ne repose que sur le wiki (le jeu paie aussi à un début de défi) ; à valider par Norman car ce choix a pu être volontaire.

2. **Barbes, facteur de temps** (`beardRebirthTimeFactor`, idle-ngu-bonus.js:514). Le jeu est continu : 0 sous 3600 s, puis `min(8, t / (450 × (24 − L)))`. Correction :
   ```js
   function beardRebirthTimeFactor(seconds, shadowLevel = 0) {
     const t = Math.max(0, num(seconds, 0));
     if (t < 3600) return 0;
     return Math.min(8, t / 450 / (24 - Math.max(0, int(shadowLevel, 0))));   // Beards: AllBeardsController::timeFactor
   }
   ```
   (`clamp(shadowLevel,0,12)` conservé si le niveau maximal du perk est 12.)

3. **Barbes, banque de niveaux** (idle-ngu-actions.js:~668). Le jeu banque `⌊beardLevel × pct⌋` pour CHAQUE barbe (`Beard.bankedLevel`) puis restitue barbe par barbe. Remplacer le nombre unique `state.bank.beards` par un dictionnaire `{[idBarbe]: ⌊tempLevel × beardBankPct⌋}` pour toutes les barbes (et lire ce dictionnaire au Rebirth suivant).

4. **Fruits : conditions de déblocage** (`idleYggFruitUnlockedV1`). Ajouter : Rage (`pp`) = ITOPOD débloqué ; Fruit of Quirks (`quirks`) = Titan 6 (Bête) vaincu ; MacGuffin α = succès 145 (identifier le succès 145 dans `idle-achievements-v1.js`). Tous évalués seulement quand le fruit a tier 0, comme dans le jeu.

5. **Souhait 60, Fruit of MacGuffin α** : `levels = ⌈tierFactor × 0,5 × poop × yggYield × firstHarvest × (1 + niveauSouhait60 × effetParNiveau)⌉` (effet 0,2 d'après le texte du jeu ; la valeur `effectPerLevel` est en scène : choix à valider ou à relire dans `level0`), borné à 2 147 483 647.

6. **Mode « difficulté Evil déjà obtenue »** (`idleNguDifficultyUnlockRequirementsV1`) : si le succès 152 est obtenu, la difficulté Evil est sélectionnable sans retester boss/Bête v4/bonus (le jeu saute tous les tests). SOREAL ré-exige les trois conditions à chaque entrée.

7. **Poop et Brown Heart** (`idleYggUsePoopV1`) : tester `poopUsed % 10 === 0` AVANT l'incrément, autoriser l'usage gratuit sans stock, borner le facteur à [1 ; 1,65] :
   ```js
   const free = brownHeart && (Math.max(0, I(fx.poopUsed, 0)) % 10 === 0);
   if (!free && idleYggPoopCountV1(state) < 1) throw new Error("POOP_INSUFFISANTE");
   fx.poopUsed = Math.max(0, I(fx.poopUsed, 0)) + 1;
   if (!free) fx.poop = idleYggPoopCountV1(state) - 1;
   ```

8. **Roue journalière : 1er tour** : le chrono tourne depuis la création de la partie (23 h initiales, plafond 36 h/7 j) ; poser `readyAt = now − (jusqu'à 12 h)` au déblocage n'est pas justifié par le code lu seul (le déblocage SOREAL est lié au Money Pit) ; laisser tel quel sauf décision de Norman.

9. **Instant du speedrun** : `rapide = runSeconds <= 30*60` (le jeu accepte exactement 1800 s).

10. **Fruit d'Or** : supprimer l'arrondi de minutes : `gold = grossGPS × factor × firstHarvest × 1800` (jeu : float, pas de `Ceil`).

11. **Mineurs, « niveau maximum abordable »** : le jeu donne ⌊ln(GPS_net/drain_base)/ln(croissance)⌋ (un niveau sous le plus haut qui tient). Adopter cette marge de sécurité si on veut la parité, sinon documenter l'écart volontaire.

12. **Fruit of Quirks** : appliquer `questRewardFactor` (÷ `butterModifier` si beurre utilisé) ; la valeur est calculable dans `BeastQuestController::questRewardFactor` et `AllArbitraryController::butterModifier` (non disassemblés ici, hors groupe).

13. **Insta Training** : lever le doute en jeu sur le `+12` d'énergie libre ; en l'état SOREAL ne donne la défense que si la synchro Basic Training est achetée alors que le jeu pose 6 + 6 sans condition (et exige `capEnergy ≥ 12`).

14. **Garderie : type 11** exempté du plafond 100 niveaux dans le jeu : identifier ce type d'objet (`Equipment.type == 11`) et lever le plafond de niveau pour lui si c'est un objet jouable.

15. **Secret du Titan 6** (`checkSpecial`) : Rebirth entre 2585 et 2615 s avec 4 indices terminés débloque `titan6Unlocked`. À ajouter si le Titan 6 SOREAL n'a pas d'autre accès équivalent (vérifier le flag `beastOn`).

## 3. Non vérifié, et pourquoi

- Toutes les constantes de scène Unity (non lisibles dans l'IL, `level0` non ouvert) : `ItemNameDesc.daycareRate` (heures de base de chaque objet : le tableau n'est qu'un `newarr` de 600 `float` dans le constructeur, les valeurs viennent du fichier de scène), `baseGPSDrain`, `startingBoost`, `boostPerLevel`, `consumesGPS` (mineurs), `baseSeedReward`, `baseSeedCost`, `activationCost`, `usesEnergy` (Yggdrasil), `speedDivider` des barbes, `HackProperties` (`baseDivider`, `baseEffectPerLevel`, `milestoneEffect`, `milestoneThreshold`), `ItopodPerkController.effectPerLevel` (perks 27/28), `WishProperties.effectPerLevel`, bonus des cartes. Les plafonds de mineurs et de hacks ont pourtant été recoupés par calcul (ils dépendent de ces constantes), ce qui valide indirectement les bases 1e16…1e28 et les `baseDivider` 1e8…1e13.
- Méthodes d'autres classes appelées mais non désassemblées : `BeastQuestController::questRewardFactor`, `AllArbitraryController::poopModifier/butterModifier`, `InventoryController::levelFirst/Random/AllMacguffinsFruit`, `Character::grossGoldPerSecond/goldPerSecond`, `Resource3::reset`, `Magic::reset`, `Character::resetAll`, `AllNGUController::yggdrasilBonus`, `ItopodPerkController::seed1Bonus/harvest1/totalBankedBeardTemp`.
- Défis (`start*Challenge`/`engage*Challenge`) : seule la garde commune `verifyChallengeStatus` a été lue (groupe « défis » séparé).
- Hors ligne : `Character::beardOfflineProgress`, `hacksOfflineProgress` et la reprise hors ligne de la garderie/Yggdrasil n'ont pas été comparées.
- UI pure (tooltips, boutons, pages, glisser-déposer, habillage du chat de garderie) ignorée.
- Mapping Heart/objet 129 du bonus AP, nombre d'emplacements de garderie et d'emplacements de mineurs hors défi : non recoupés des deux côtés.
