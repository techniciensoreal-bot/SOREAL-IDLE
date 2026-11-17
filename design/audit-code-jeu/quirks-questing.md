# Audit code du jeu (build 1260) : Quirks et Questing

Date : 2026-11-16. Côté jeu : IL de `Assembly-CSharp.dll` (BeastQuestPerkController 107 méthodes, BeastQuestController 59, BeastQuest 3) + consommateurs lus dans d'autres classes. Côté SOREAL : `cloudflare/src/idle-quirks-v1.js`, `idle-questing-v1.js`, `idle-difficulty-gates-v1.js`, `idle-ngu-snapshot.js` (`buyQuirkV1`), et leurs consommateurs.

Les tables des Quirks (coût, plafond, effet par niveau, difficulté exigée, type) ont été lues dans la scène du jeu (`level0`, listes de 186 entrées : plafonds @4011292, coûts @4012784, effets @4020296, difficulté @4037824, types @4040808) et comparées automatiquement aux 186 entrées de `IDLE_QUIRKS_CATALOG_V1` : **0 écart de coût, de plafond, d'effet par niveau ni de difficulté** sur les 186 quirks (seuls 28 noms diffèrent par la casse ou une coquille : ex. le jeu appelle les quirks 147 et 148 tous deux « Bigger Deck II » ; SOREAL a « III » pour 148 ; cosmétique). Le catalogue est donc CONFORME ; les écarts sont dans l'AGRÉGATION des effets et dans Questing.

## 1. Tableau méthode par méthode

### 1.1 BeastQuestPerkController (Quirks)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `quirkCost(i)` (1299) | `idleQuirkNextCostV1` idle-quirks-v1.js:207 | CONFORME | coût plat par niveau `cost[i]` (pas de courbe). |
| `capLevel(i)` (1293) | `quirk.cap` du catalogue | CONFORME | = `maxLevel[i]`. |
| `tryLevelUp` (1308) / `doLevelUp` (1309) / `addLevel` (1300) | `buyQuirkV1` idle-ngu-snapshot.js:1691 | ÉCART (mineur) | Le jeu refuse si : niveau max, QP < coût, difficulté < exigée, **et** (type 20 = quirks Resource 3 sans Resource 3 débloquée ; type 23 = quirks Cartes sans Cartes ; type 21 = quirks Souhaits sans Wishes). SOREAL ne contrôle que « système Quirks débloqué », difficulté, niveau max, QP. Un client forgé peut acheter un quirk Cartes/R3/Souhaits avant d'avoir le système. |
| `tryLevelAll` (1310) / `doLevelAll` (1311) | aucune (le client boucle sur `buyQuirk`) | CONFORME (équivalent) | « tout acheter » = boucle : QP ≥ coût et niveau < plafond, mêmes garde-fous que tryLevelUp. |
| `doEffect(i)` (1312) | `idleNgu...` (slots) | CONFORME | quirk 18 → emplacement d'accessoire, 19 et 50 → emplacements de MacGuffin, 90 → espace d'inventaire (recompte). |
| `quirkEffect(i)` (1314) | produit `1 + niveau x effet` dans `quirkBonusesV1` idle-quirks-v1.js:222 | CONFORME | `1` si difficulté < exigée sinon `max(1, 1 + niveau x effetParNiveau)` ; SOREAL retire les niveaux inactifs par `idleQuirkNiveauxV1` (idle-difficulty-gates-v1.js:56). |
| `statEffect/levelEffect/percentEffect*` (1304-1307) | — | HORS GAMEPLAY | affichage (tooltips). |
| `totalEnergyPowerBonus` (1315) = q0 x q35 x q41(Evil+) x q61 x q80 x q177, plancher 1 | `energyPowerMultiplier` :249 (clé `energyPowerPct`, produit) | CONFORME | mêmes 6 quirks (0, 35, 41, 61, 80, 177), produit. Mesuré dans le jeu le 2026-11-13. |
| `energyPower1/2/3Bonus` (1316-1318) | idem | CONFORME | q0, q35, q41 (Evil+). |
| `totalEnergyCapBonus` (1319) = q1 x q36 x q42 x q62 x q81 x q178 | `energyCapMultiplier` | CONFORME | ids identiques ; produit. |
| `energyCap1/2/3Bonus` (1320-1322) | idem | CONFORME | |
| `totalEnergyBarBonus` (1323) = q2 x q37 x q43 x q63 x q82 x q179 | `energyBarsMultiplier` | CONFORME | |
| `energyBar1/2/3Bonus` (1324-1326) | idem | CONFORME | |
| `totalMagicPowerBonus` (1327) = q3 x q38 x q44 x q64 x q83 x q180 | `magicPowerMultiplier` | CONFORME | |
| `magicPower1/2/3Bonus` (1328-1330) | idem | CONFORME | |
| `totalMagicCapBonus` (1331) = q4 x q39 x q45 x q65 x q84 x q181 | `magicCapMultiplier` | CONFORME | |
| `magicCap1/2/3Bonus` (1332-1334) | idem | CONFORME | |
| `totalMagicBarBonus` (1335) = q5 x q40 x q46 x q66 x q85 x q182 | `magicBarsMultiplier` | CONFORME | |
| `magicBar1/2/3Bonus` (1336-1338) | idem | CONFORME | |
| `totalRes3PowerBonus` (1339) = q47 x q67 x q86 x q183 (PRODUIT) | `r3PowerMultiplier` :276 = `1 + somme(r3PowerPct)` | **ÉCART** | Le jeu MULTIPLIE les 4 quirks, SOREAL les ADDITIONNE. Les 4 au niveau 50 : jeu 1,5 x 1,5 x 1,5 x 1,5 = **5,0625** ; SOREAL 1 + 0,5 + 0,5 + 0,5 + 0,5 = **3,0**. |
| `res3PowerBonus1` (1340) | idem | CONFORME | q47 (Evil+). |
| `totalRes3CapBonus` (1341) = q48 x q68 x q87 x q184 | `r3CapMultiplier` :277 additif | **ÉCART** | produit dans le jeu. Au max : 1,5 x 1,25 x 1,25 x 1,5 = **3,516** ; SOREAL 1 + 0,5 + 0,25 + 0,25 + 0,5 = **2,5**. |
| `res3CapBonus1` (1342) | idem | CONFORME | q48. |
| `totalRes3BarBonus` (1343) = q49 x q69 x q88 x q185 | `r3BarsMultiplier` :278 additif | **ÉCART** | idem (3,516 vs 2,5 au max). |
| `res3BarBonus1` (1344) | idem | CONFORME | q49. |
| `totalStatBonus` (1345) = q7 x q51(Evil+) x q76 x q78 x q170 x q172 | `statMultiplier` :256 (`statPct`, produit) | CONFORME | mêmes 6 quirks, produit (mesuré 2026-11-13). |
| `statBoost1Bonus` (1346) / `statBoost2Bonus` (1347) | idem | CONFORME | q7, q51 (Evil+). |
| `totalAdventureBonus` (1348) = q6 x q8 x q52(Evil+) x q77 x q79 x q171 x q173 | `adventureStatsMultiplier` :255 | CONFORME | mêmes 7 quirks, produit. |
| `adventure1/2/3Bonus` (1349-1351) | idem | CONFORME | q6, q8, q52 (Evil+). |
| `totalGoldBonus` / `gold1Bonus` (1352-1353) = 1 + 0,1 x niv(q9) | `adventureGoldMultiplier` :257 | CONFORME | un seul quirk. |
| `totalBeardSpeedBonus` / `beard1Bonus` (1354-1355) = 1 + 0,01 x niv(q10) | `beardSpeedMultiplier` :265 (consommé idle-ngu-pistes.js:232) | CONFORME | |
| `totalBoostBonus` (1356) = q11 x q53 x q72 x q73 (produit) ; `boost1/2Bonus` | `boostPowerMultiplier` :261 (`boostPowerProduct`) | CONFORME | même produit sur `boostPowerPct` (11, 53, 72, 73). |
| `totalSeedBonus` / `seed1Bonus` (1359-1360) = 1 + 0,01 x niv(q12) | `seedYieldMultiplier` :258 | CONFORME | |
| `totalEnergyWandoosBonus` / `energyWandoos1Bonus` (1361-1362) | `wandoosEnergySpeedPct` :271 (consommé idle-ngu-etat.js:421) | CONFORME | q15, +2 %/niv, Evil+ ; formule `1 + niv x 0,02`. |
| `totalMagicWandoosBonus` / `magicWandoos1Bonus` (1363-1364) | `wandoosMagicSpeedPct` :272 | CONFORME | q16. |
| `totalWishMinReduction` / `minWish1` (1365-1366) = 24 x niv(q54) (s) | `wishMinTimeReductionSeconds` :269 ; utilisé idle-ngu-pistes.js:360 | CONFORME (valeur) / NON VÉRIFIÉ (plancher) | 24 s/niveau ✓. Le jeu (`WishesController::minimumWishTime`, 4908) fait 14 400 − réduction Perks − réduction Quirks sans plancher visible ; SOREAL applique `max(3600, ...)` : plancher non lu dans le jeu (voir §3). |
| `totalBasePPBonus` / `basePP1` (1367-1368) = 10 x niv(q70), **seulement difficulté >= 2** | `itopodPppFlat` :279 ; idle-ngu-systemes.js:916 (seulement en `extreme`) | CONFORME | |
| `sadisticBossMultiplierBonus` (1369), `sadBoss1`/`sadBoss2` (1370-1371) | `sadisticBossMultiplierBonus` :266 ; idle-ngu-ressources.js:56 | CONFORME | 0,001/niv, chacun borné à 0,01 (= 10 niveaux max, donc bornage inatteignable), additif, difficulté Sadistic ; base 1,2 + ITOPOD + Quirks + Souhaits (BossController 1544). |
| `totalInventorySpaces` (1372) = min(niv(q90), 24) | `inventorySlotBonus` :268 ; idle-ngu-etat.js:1147 | CONFORME | |
| `totalYggYieldBonus` / `ygg1` (1373-1374) = quirkEffect(92) | `yggYieldMultiplier` :260 | CONFORME | |
| `totalBloodGainBonus` / `blood1` (1375-1376) = quirkEffect(91) | `bloodGainMultiplier` :288 ; idle-ngu-systemes.js:131, 413 | CONFORME | |
| `totalEnergyNGUSpeed` (1377) = q93 x q95 x q97 (PRODUIT) | `nguSpeedEnergyMultiplier` :274 = `1 + somme(nguSpeedEnergyPct)` ; idle-ngu-bonus.js:295 | **ÉCART** | produit dans le jeu. Niveaux 50 : 1,2 x 1,15 x 1,15 = **1,587** ; SOREAL 1 + 0,2 + 0,15 + 0,15 = **1,5**. |
| `totalMagicNGUSpeed` (1378) = q94 x q96 x q98 | `nguSpeedMagicMultiplier` :275 | **ÉCART** | idem. |
| `totalCardSpeed` (1379) = q138 x q140 x q142 x q144 ; `totalMayoSpeed` (1380) = q139 x q141 x q143 x q145 | `foldEntries` idle-cards-v1.js:459-470 (`cardSpeedPct`/`mayoSpeedPct` : `acc *= 1 + per x niv`) | CONFORME | produit, bien. |
| `totalDeckSizeBonus` (1381) = somme min(niv, plafond) de q146-148 | `cardDeckSize` (somme) idle-cards-v1.js:503 | CONFORME | |
| `totalCardTagBonus` (1382) = somme eff x niv de q152-155, plancher 0 | `cardTagEffectPct` ; borné [0,10 ; 0,25] idle-cards-v1.js:512 | CONFORME | le bornage [0,10 ; 0,25] est lu dans le jeu (CardsController). |
| `getEnergyNGUTier/... getPPTier` (CardsController 1667-1679) | `cardTier_*` quirks 99-137, 157-169 | CONFORME (sous-ensemble) | Pour chaque type, les 4 quirks de SOREAL (I, II, III, IV) sont bien parmi les identifiants lus par la méthode du jeu (script de comparaison ; les autres nombres de la méthode sont des indices de Perks/Souhaits). |
| `totalQPBonus` (1301/1302) | — | CONFORME | stub : renvoie 1 ; aucun quirk n'agit sur le QP (le seul quirk de Questing est q71). |
| `Start`, `constructList/FullList`, `orderList`, `filter*`, `toggle*`, `order*Cost`, `totalCost`, `refreshMenu`, `updateText/Filters/OrderTypeText`, `changePage`, `showTooltip`, `hideTooltip`, `onFilterChange/OrderChange`, `advanceOrderType`, `.ctor` (1277-1298, 1303, 1313, 1383) | — | HORS GAMEPLAY | tri, filtres, pages, tooltips ; `totalCost` = (plafond − niveau) x coût (affichage). |

### 1.2 Consommateurs des quirks lus dans d'autres classes (pour vérifier que l'effet agit comme dans le jeu)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `ItopodPerkController::totalBankedAdvTraining/TimeMachine/BeardTemp` (441-443) | idle-ngu-actions.js:681-700 ; quirks `atBankPct`/`tmBankPct`/`beardBankPct` | CONFORME | = somme (Perks 36-40 / 41-45 / 46-50 + Quirks 20-24 / 25-29 / 30-34, 22-24, 27-29 et 32-34 seulement Evil+), borné à 0,75. Max théorique 0,5 + 0,25 = 0,75 : le bornage est inatteignable donc l'absence de bornage dans SOREAL est sans effet. |
| `Character::totalAttack/Defense` (2133-2134) | idle-ngu-bonus.js:767-768 | CONFORME | quirk = facteur multiplicatif. |
| `Character::totalEnergyPower/Bar/Cap`, `Magic*`, `Res3*` (2142-2152) | idle-ngu-bonus.js:976-1013 | CONFORME | facteurs multiplicatifs. |
| `Character::totalAdv*` (2162-2165) | idle-ngu-bonus.js:873-915 | CONFORME | |
| `Character::totalGoldbonus` (2209) | idle-ngu-bonus.js:972 | CONFORME | |
| `Character::totalWandoos*Speed` (2211-2212) | idle-ngu-etat.js:421-422 | CONFORME (facteur) | |
| `Character::yggdrasilYieldBonus` (2220) = (1 + bonus équip. 43) x totalYggYieldBonus | idle-ngu-systemes.js:458-460 | CONFORME | |
| `FruitController::seedReward` (5056) | idle-ngu-systemes.js:425, 442 | CONFORME (quirk 12) | quirk graines multiplie ⌈base x tier x poop x ITOPOD x quirk x équip x NGU x récolte⌉. |
| `FruitController::tierThreshold` (5040) = 3600 − min(60 x niv(q13), 180) | `idleYggTierSecondsV1` idle-yggdrasil-extra-v1.js:272 | CONFORME | |
| `FruitController::consumeQPFruit` (5075) Fruit of Quirks = ⌈3 x tier x poop x yggYieldBonus x **questRewardFactor** (÷ butterModifier si beurre utilisé) x totalHarvestBonus⌉ | `idleYggFruitOfQuirksQpV1` idle-yggdrasil-extra-v1.js:334 ; idle-ngu-systemes.js:529-530 | **ÉCART** | SOREAL calcule ⌈T x 3 x Quirk_Ygg x Équip x PremièreRécolte⌉ : il manque la Poop (le commentaire la cite mais le code ne la passe pas : `factor` n'est pas utilisé) et le facteur de récompense QP complet (`questRewardFactor` : Godmother x1,15, 1,02^objets max, Perk QP, Hack QP, Souhait 47, Cartes QP, Orange Heart, Fibonacci 233). |
| `NGUController::progressPerTick` (4083), `AllNGUController::energyNGUCapAmount` (4065) | idle-ngu-bonus.js:294-295 | **ÉCART** (via `totalEnergyNGUSpeed`) | voir produit des quirks 93/95/97. |
| `NGUController/NGUMagicController::updateNGU` (4078, 4106) : quirks 14 et 89 | `grantNguLevelsV1` idle-ngu-bonus.js:301-307 | CONFORME (principe) | un niveau gagné d'un NGU Evil donne le même niveau au NGU normal si q14 ≥ 1 ; Sadistic → Evil si q89 ≥ 1. Le détail de l'ordre est dans le groupe NGU. |
| `DefenseTraining/OffenseTraining::levelUp` + `Character::trainingOfflineProgress` (4324, 4354, 2236) : quirk 17 | `basicTrainingExtraLevel` :273 ; idle-ngu-bonus.js:1039 | CONFORME | +1 niveau à chaque remplissage de la barre. |
| `HacksController::milestoneThreshold` (3208) : q57 (Atk/Def), q175 (TM), q174 (Energy NGU), q59 (EXP), q58 (PP), q60 (Wish) | `hackMilestoneReduction` :280 ; idle-ngu-bonus.js:204-215 | CONFORME | correspondance hack ↔ quirk relue dans l'ordre des cas du `switch` (0 = A/D, 2 = TM, 5 = Energy NGU, 10 = EXP, 12 = PP, 14 = Wish) : identique. Le jeu ne borne pas à 1 en bas ; SOREAL borne à 1 (sans effet : réductions max 5). |
| `InventoryController::accessorySpaces` (q18), `macguffinSpaces` (q19, q50), `totalInvMergeSlots` (q55), `curSpaces` (totalInventorySpaces) | idle-ngu-etat.js:1147-1148 ; idle-macguffins-v1.js:359 ; idle-inventory-auto-v1.js:243 | CONFORME | |
| `InventoryController::runEndItemChecker` (3780) : q176 ≥ 1 → objet 486 niveau 100 (Sadistic seulement) | `idleTheEndSyncV1` idle-ngu-etat.js:1241 | CONFORME (effet) / ÉCART mineur (garde) | SOREAL donne bien l'objet 486 (le commentaire du catalogue « aucun effet » est périmé mais le test est fait ailleurs). Le jeu exige en plus difficulté ≥ 2 (garde de tête de la méthode) ; SOREAL lit `levels[176]` brut, sans garde de difficulté. |
| `WishesController::curWishSlots` (4877) : q56 ≥ 1 | idle-ngu-pistes.js:62 | CONFORME | |
| `WishesController::minimumWishTime` (4908) | idle-ngu-pistes.js:360 | voir plancher | 14 400 s − Perks − Quirks, vitesse max = 1 / (durée x 50) par tick. |
| `AllBloodMagicController::bloodAdded` (1434/1444) | idle-ngu-systemes.js:131, 413 | CONFORME | |
| `AllItemListController::boostBonus` (3403) | idle-adventure-inventaire.js:394, 454 | CONFORME | `totalBoostBonus` multiplie la force du boost. |

### 1.3 BeastQuest (état)

| Méthode | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `BeastQuest::curSize` (1215) = 186 | catalogue 186 entrées | CONFORME | |
| `BeastQuest::updateBeastQuest` (1217) | normalisation des niveaux | CONFORME | complète le tableau des niveaux à 186. |
| `BeastQuest::.ctor` (1216) : curBankedQuests = **3**, maxBankedQuests = 10, allActive = true, QP = 0 | `normalizeIdleQuestingDataV1` idle-questing-v1.js:296 (`majorsBanked` = 0 par défaut) | **ÉCART** | Le jeu démarre avec **3 Major Quests en banque** ; SOREAL démarre à 0. |

### 1.4 BeastQuestController (Questing)

| Méthode du jeu | Équivalent SOREAL (fichier:ligne) | Verdict | Détail |
|---|---|---|---|
| `Update` (1220) | `advanceIdleQuestingV1` :450 | ÉCART (mineur) | Minuteur avancé tant que `beastOn` ; à `>= seuil` : retire le seuil puis ajoute 1 Major (plafonnée). **Le minuteur continue de tourner à la banque pleine** (il reboucle modulo le seuil). SOREAL remet `majorProgressSeconds = 0` banque pleine (:461-463, :471) : après une dépense, SOREAL repart de 0, le jeu d'une phase quelconque (jusqu'à 1 intervalle de différence). |
| `resolveDailyTimer` (1221) | idem (boucle `floor(progress / intervalle)`) :466-470 | CONFORME (hors plafond) | hors ligne : même nombre de Majors gagnées. |
| `Character::questingOfflineProgress` (2238) | idem + `advanceIdleQuestingV1` | ÉCART (mineur) | Hors ligne avec Perk 104 + case d'enchaînement automatique : le jeu simule les quêtes avec une taille fixe de **60** objets par quête (boucle `>= 60`, constante 60 lue dans l'IL) et non le vrai tirage 50-59 ; SOREAL simule de vraies quêtes (`guard` 2000). Le jeu exige aussi la case `idleQuestAutocycle` (réglage du joueur) en plus du Perk 104 ; SOREAL n'a pas cette case (Perk 104 seul). |
| `maxBankedQuests` (1222) = 10 (+40 si `hasExtendedQuestBank`) | `idleQuestBankCapV1` :232 | CONFORME | 10 → 50. |
| `dailyQuestsAdded` (1223) = 1 | `gained` unitaire | CONFORME | |
| `timerThreshold` (1224) = 28 200 s ; x0,8 (Faster Quests, tronqué en entier) puis x0,9 (Fad, tronqué) | `idleQuestMajorIntervalSecondsV1` :225 | CONFORME | 28 200 / 22 560 / 25 380 / 20 304 ; multiplicatifs ; SOREAL ne tronque pas à l'entier mais les produits tombent juste (28 200 x 0,8 = 22 560 ; x 0,9 = 20 304 exact). |
| `readyToHandIn` (1226) | `readyToComplete` :588 | CONFORME | en quête, id > 0, `curDrops >= targetDrops`. |
| `constructQuestList` (1237) | `idleQuestEligibleZonesV1` :350 | **ÉCART** | Le jeu : Sewers (278) **toujours** disponible (aucun set requis) ; 2D, Chocolate, Forest, Gaudy, HSB, Beardverse, Mega selon le set terminé ; **Evilverse (284) et Pretty Pink Princess (286) seulement en difficulté ≥ Evil ET set terminé**. SOREAL exige le set Sewers terminé et ne contrôle jamais la difficulté pour Evilverse/Pink Princess. |
| `startQuest` (1239) | `startQuestV1` :355 | ÉCART (mineur) | Tirage uniforme dans la liste, `Random.Range(50, 60)` objets (50 si Fibonacci niveau ≥ 610) : identique. Le jeu consomme une Major seulement si le réglage `useMajorQuests` est actif ET banque > 0, sinon c'est une Minor (`reducedRewards`) ; SOREAL prend l'intention en paramètre : équivalent. Mais le jeu n'accepte pas de lancer une quête si `inQuest` ; SOREAL idem (`QUETE_DEJA_ACTIVE`). |
| `clearQuest` (1238) | `d.quest = null` | **ÉCART** | `clearQuest` remet `idleMode = false`, `allActive = true`, `usedButter = false`, `idleProgress = 0`. SOREAL garde `d.idle` à true après une quête (completeQuest/questSkip) : la quête suivante démarre alors directement en mode idle ; dans le jeu, le joueur doit rallumer l'idle (sauf enchaînement automatique, qui rallume lui-même via `toggleIdleMode`). |
| `completeQuest` (1240) | `completeQuestV1` :371 | CONFORME | exige `curDrops >= targetDrops`. |
| `giveRewardsAndClear` (1241/1242) | `completeQuestV1` + `idleQuestRewardV1` :249 | **ÉCART** | Voir « arrondis » et « AP » ci-dessous ; plus l'objet secret (Antlers) ABSENT. |
| `giveRewardsAndClear` : Antlers of the Exile | — | **ABSENT** | Si terminé hors mode idle (`idleMode` faux), `allActive` vrai, `idleProgress` dans [0,9 ; 1] et l'objet 337 déjà obtenu : donne l'objet 338 (Antlers of the Exile) niveau 100. SOREAL ne connaît cet objet que comme butin de titan. Spoil possible : à ne pas afficher avant. |
| `toggleIdleMode` (1243), `updateIdleQuest` (1257) | `questIdle` :544 + `advanceIdleQuestingV1` | CONFORME (hors `clearQuest`) | La progression d'idle ne tourne que si `beastOn`, en quête, id > 0 et idle actif. À `idleProgress >= 1` : remise à 0, `allActive = false`, `curDrops + 1` (ce qui équivaut à `usedIdle = true` dès le premier objet). |
| `majorQuestReward` (1244) = 50 + `totalBaseQPBonusesMajor` | `idleQuestRewardV1` :252 | CONFORME | |
| `totalBaseQPBonusesMajor` (1245) : **difficulté >= 2 seulement** : Souhait 101 (niveau brut) + Perk 147 | `majorBaseBonus` :163 | CONFORME | |
| `minorQuestReward` (1246) = 10 ; +2 si Perk 87 > 0 (**toute difficulté**) ; difficulté >= 2 : + Perk 148 + Souhait 102 ; plafond 16 | `minorBaseBonus` :164 | **ÉCART** | SOREAL range le +2 du Perk 87 dans `questMinorBaseQp` puis tout `minorBaseBonus` n'est pris qu'en `extreme` : en Evil (difficulté 1), un joueur avec le Perk 87 a **12** dans le jeu et **10** dans SOREAL. Le plafond 16 est inatteignable (10 + 2 + 2 + 2). |
| `majorQuestAPReward` (1247) = **50 fixe** | `ap` :274 = `floor(base x ...)` avec `base` = 50 + bonus 101/147 | **ÉCART** | En Sadistic, SOREAL ajoute les bonus de QP de base (Perk 147, Souhait 101) aussi aux AP ; le jeu non (AP Major de base = 50 toujours). |
| `minorQuestAPReward` (1248) = 10, +2 si Perk 87, plafond 13 | idem | **ÉCART** | SOREAL utilise la base du QP (10 + 87 + 148 + 102, sans plafond 13) ; le jeu 10 (+2 si Perk 87, toute difficulté). |
| `allActiveModifier` (1249) = 2 x wishEffect(19) x wishEffect(62) (**produit**) | `activeFactor` x `activeWish` :254-255 = 2 x (1 + 0,02 a + 0,01 b) (**somme**) | **ÉCART** (faible) | Niveaux 10 + 10 : jeu 2 x 1,2 x 1,1 = **2,64** ; SOREAL 2 x 1,3 = **2,60**. (`wishEffect` renvoie 1 si difficulté < exigée sinon `max(1, 1 + niveau x effetParNiveau)` ; effets 0,02 et 0,01 lus dans le texte des souhaits, non vérifiés dans la scène.) |
| `questRewardFactor` (1250) = Godmother (set) x1,15 ; x 1,02^(objets de quête au niveau max) ; x ITOPOD `totalQPBonus` (Perk 89, plafond 1,1) ; x Hack QP (seulement difficulté ≥ Evil, hack désactivé = 1) ; x Souhait 47 ; x Cartes `getBonus(14)` ; x Orange Heart 1,2 ; x `butterModifier` si beurre (2, x1,1 avec Blue Heart) ; x1,1 si Perk 94 (Fibonacci) niveau ≥ 233 ; plancher 1 | `qpMultiplier` et `butterFactor` :258-272 | CONFORME (facteurs) | Tous les facteurs de SOREAL existent dans le jeu et inversement (Mobster = set Godmother : `source:"godmother"`). Mesuré le 2026-11-15 : Better QP x Fibonacci 233 se multiplient. |
| `currentQuestQPValue` (1251) | `rewardPreview` :609 | ÉCART (arrondi) | même formule que `giveRewardsAndClear`. |
| `giveRewardsAndClear`, formule d'arrondi : QP = `(long)((float)récompenseDeBase x questRewardFactor)` puis, si `allActive`, `(long)((float)QP x allActiveModifier)` ; AP = `(long)((float)AP x allActiveModifier)` puis `Character.addAP` (arrondi inférieur de AP x bonus) | `Math.floor(base x activeFactor x activeWish x qpMultiplier x butter)` :273 | **ÉCART** (arrondi) | Le jeu tronque **deux fois** (et en float32) ; SOREAL une seule fois à la fin : SOREAL peut donner jusqu'à `facteur actif` (~2) QP de plus. Ex. base 50 x facteur 1,21 = 60,5 → 60 → x2 = **120** dans le jeu, **121** dans SOREAL. |
| `questItemsMaxxed` (1252) | `maxedCount` :257 | CONFORME | compte `itemMaxxed[278..287]`. |
| `advanceQuest` (1253) | `q.progress += 1` | CONFORME | |
| `checkItemConsumed(id)` / `(id, level)` (1254-1255) | `handInV1` :390 | CONFORME / ÉCART (garde) | +1 par objet sans niveau ; avec niveau : `1 + niveau / ratio` (division entière), min 1, **niveau > 100 → 1**, cap = `targetDrops`. Garde (clic sur l'objet, `ItemController` 3793/3794) : Perk **145** > 0. SOREAL applique la valeur dès qu'UN des 9 niveaux (Perks 145-146, Quirk 71, Souhaits 80-81) est acquis : sans Perk 145 mais avec Quirk 71 ou Souhait 80, SOREAL compte `1 + niveau/ratio` alors que le jeu compte 1 par objet. |
| `InventoryController::dumpAllIntoQuest` (3769) | `questHandIn` | ÉCART (comportement du jeu) | Le bouton « tout déposer » teste le **Perk 66** (« A MacGuffin Slot! ») au lieu du Perk 145 pour choisir la version avec niveau (apparemment une coquille du jeu). Sans le Perk 66, « tout déposer » compte 1 par objet quel que soit son niveau. À décider avec Norman : reproduire ou non. |
| `questHandinRatio` (1256) = 10 ; **si difficulté >= 1** : − Perk 146 − niveau Quirk 71 − niveau Souhait 80 ; **si difficulté >= 2** : − Souhait 81 ; plancher 2 | `idleQuestHandInValueV1` :183 (`11 − b`, b = 145 + 146 + q71 + 80 + 81, max 9) | CONFORME | Avec le Perk 145 : b = 1 + autres, diviseur = 11 − b = 10 − autres ; même résultat que le jeu tant que le Perk 145 est possédé. Plancher 2 = 11 − 9. |
| `idleProgressPerTick` (1259) = 1 / (`expectedTimePerDrop` x `idleDropFactor`) / 50, 0 si pas en idle | `idleQuestIdleSecondsPerItemV1` :213 | CONFORME | temps par objet (s) = diviseur x (1 + respawn) / (0,05 x drop) ; 0,8 au lieu de 1 avec Red Liquid. |
| `idleDropFactor` (1260) = 8 − 2 (Perk 105) − 1 (106) − 1 (91) − 1 (92), plancher 3 | `idleQuestIdleDividerV1` :178 | CONFORME | niveaux ≥ 1 testés (pas de x niveau) ; caps de ces Perks à 1 donc équivalent. |
| `questDropChance` (1261) = 0,05 x `questDropBonuses` | `IDLE_QUEST_BASE_DROP_CHANCE_V1` :71 | CONFORME | |
| `questDropBonuses` (1262) = (1 + bonus d'équipement 45) x 1,1 (Heroic Sigil) x ITOPOD `totalQuestDropBonus` (1 + 0,5 %/niv x Perk 90) | `idleQuestDropMultiplierV1` :196 | CONFORME (structure) / NON VÉRIFIÉ (unité de `bonuses[45]`) | produit des 3 facteurs ✓ ; SOREAL divise le spécial d'équipement par 100 : je n'ai pas vérifié que `bonuses[45]` est une fraction (valeur lue comme `1 + b`). |
| `expectedTimePerDrop` (1263) = (1 + respawn) / chance ; (0,8 + respawn) si Red Liquid | :213-218 | CONFORME | respawn : groupe Aventure. |
| `LootDrop::zoneNDrop` (489, 490, 493, 497, 500, 501, 503, 508-510) | `idleQuestingOnZoneKillV1` :514 | CONFORME | `Random.value < chance` ; seulement en quête, bonne zone, **hors mode idle**, objet de niveau 0. Correspondance quête ↔ zone vérifiée par l'ordre : 278 zone 1, 281 zone 2, 283 zone 5, 279 zone 9, 282 zone 12, 287 zone 13, 285 zone 15, 280 zone 20, 284 zone 21, 286 zone 22 (même ordre que SOREAL). |
| `addMajorQuests(n)` (1264) | `majorsBanked = min(cap, ...)` :468 | CONFORME | |
| `startOrCompleteQuest` (1265), `skipQuest` (1268), `trySkipQuest` (1267) | `questStart`/`questComplete`/`questSkip` :531 | CONFORME | une Major passée est perdue (consommée au démarrage). |
| `tryUseButter` (1266) | `useButter` :375 | ÉCART (conception) | Dans le jeu le beurre se consomme à la main PENDANT la quête (une fois par quête, jamais hors quête) et son effet est « 2x le QP de la prochaine quête terminée ». SOREAL le consomme AUTOMATIQUEMENT à chaque fin de quête (case `useButter` vraie par défaut), y compris en enchaînement hors ligne. |
| `toggleMajorQuestUse` (1273), `goToQuestZone`/`curQuestZone` (1274-1275) | `preferMajor`, `goToQuestZone` | CONFORME (zones) | table quête → zone : 1, 9, 20, 2, 12, 5, 21, 15, 22, 13 pour les objets 278-287. |
| `startIdleModeTooltip`, `timeToNextFill` (1270) | `idleEtaSeconds` :589 | CONFORME | (1 − `idleProgress`) / progression par tick / 50. |
| `Start`, `cancel`, `refreshMenu`, `updateText`, `updateBar`, `updateButtons`, `updateButtonText`, `goodName`, `goodNameVowel`, `badName`, `questItemLocation`, `questItemName`, `flavourText`, `isQuestItem`, `show/hideTooltip`, `.ctor` (1218-1219, 1225, 1227-1236, 1258, 1269, 1271-1272, 1276) | — | HORS GAMEPLAY | textes et affichage ; `isQuestItem` = id dans 278-287. |

## 2. Écarts priorisés et corrections proposées

### P1 : écarts qui changent les nombres joués

1. **Quirks Resource 3 : somme au lieu de produit** (3 clés : puissance 47 / 67 / 86 / 183, cap 48 / 68 / 87 / 184, barres 49 / 69 / 88 / 185). Jeu `totalRes3PowerBonus/CapBonus/BarBonus` (1339, 1341, 1343) : produit. Max : puissance 5,0625 contre 3,0 ; cap et barres 3,516 contre 2,5.
   Correction dans `idle-quirks-v1.js` :
   - `QUIRK_CLES_PRODUIT_V1` : ajouter `"r3PowerPct","r3CapPct","r3BarsPct","nguSpeedEnergyPct","nguSpeedMagicPct"` ;
   - dans le retour de `quirkBonusesV1` : `nguSpeedEnergyMultiplier: produits.nguSpeedEnergyPct`, `nguSpeedMagicMultiplier: produits.nguSpeedMagicPct`, `r3PowerMultiplier: produits.r3PowerPct`, `r3CapMultiplier: produits.r3CapPct`, `r3BarsMultiplier: produits.r3BarsPct` (remplacer les `1 + (totals.xxx || 0)` des lignes 274-278).
2. **Quirks de vitesse NGU (93/95/97 Energy, 94/96/98 Magic) : somme au lieu de produit** (jeu `totalEnergyNGUSpeed/MagicNGUSpeed`, 1377-1378). Niveaux 50 : 1,587 contre 1,5. Même correction que ci-dessus (clés `nguSpeedEnergyPct` / `nguSpeedMagicPct`).
3. **QP des titans sans facteur de récompense QP** (jeu `AdventureController::boss6QP` à `boss12QP`, 125-131, et `LootDrop::zoneNDrop` ex. 507). Jeu : `(long)((long)(base x questRewardFactor ÷ butter) x higherVFactor)` (pour boss6QP et boss7QP, le beurre n'est PAS divisé), bases 1 / 1 / 2 / 3 / 4 / 5 / 6. SOREAL (`creditTitanRewardsV1`, idle-adventure-combat.js:312 puis idle-ngu-snapshot.js:1472) : `base x rewardMult x perks.qpEarningsMultiplier` seulement : manquent Godmother x1,15, objets de quête maxés, Hack QP, Souhait 47, Cartes QP, Orange Heart (et ses 2 troncatures). Correction : calculer `facteur = idleQuestRewardFactor(state, env)` (extraire de `idleQuestRewardV1` le produit `qpMultiplier`, sans le beurre), puis `qp = trunc(trunc(base x facteur) x higherVFactor)` et ne plus multiplier par `perks.qpEarningsMultiplier` au crédit.
4. **Quête mineure : +2 du Perk 87 perdu hors Sadistic ; AP mal calculés.**
   Dans `idleQuestBonusTotalsV1` (idle-questing-v1.js:130-173) : séparer le Perk 87 des bonus Sadistic. Proposition :
   ```js
   const p87 = idlePerkNiveauxV1(state)[87] > 0 ? 2 : 0;
   minorBaseBonus: p87 + (state?.difficulty === "extreme" ? (totals.questMinorBaseQp - p87) : 0)
   ```
   (retirer le +2 du Perk 87 de `questMinorBaseQp` ou le déduire comme ci-dessus), plafonner à 6 (base 16). Pour les AP (:274) : `apBase = major ? 50 : Math.min(13, 10 + p87)` (sans les bonus 101/102/147/148).
5. **Arrondis des récompenses** (:273-274). Reproduire le jeu :
   ```js
   const f = Math.fround;
   const facteur = f(qpMultiplier * butterFactor);      // questRewardFactor (butter inclus, plancher 1)
   let qp = Math.trunc(f(base) * facteur);               // (long)(float x float)
   if (!usedIdle) qp = Math.trunc(f(qp) * f(2 * w19 * w62));   // allActiveModifier (produit des 2 souhaits)
   let apBase = Math.trunc(f(apBaseValue) * (usedIdle ? 1 : f(2 * w19 * w62)));
   const ap = Math.floor(apBase * apEarningsMultiplier); // addAP : floor(AP x bonusAP)
   ```
   avec `w19 = 1 + 0,02 x niveau19`, `w62 = 1 + 0,01 x niveau62` (produit, pas somme).
6. **Liste des quêtes** (`idleQuestEligibleZonesV1`, :350-353) : la zone Sewers est toujours éligible ; `evilverse` et `pinkprincess` exigent difficulté ≥ `difficile` ET leur set :
   ```js
   return IDLE_QUEST_ITEMS_V1.filter(x => x.zone === "sewers" || (Boolean(done[x.set]) && (!["evilverse","pinkprincess"].includes(x.zone) || state.difficulty !== "normal"))).map(x => x.zone);
   ```
7. **3 Major Quests au départ** : `majorsBanked` initial = 3 à la création des données de Questing (`normalizeIdleQuestingDataV1` quand `src.majorsBanked === undefined`). Et ne pas remettre `majorProgressSeconds` à 0 banque pleine : continuer `progress %= intervalle` (supprimer :461-463 et :471, boucler avec la banque plafonnée).

### P2 : comportements

8. **Mode idle remis à faux à la fin d'une quête** (`clearQuest`) : dans `completeQuestV1` et `questSkip`, faire `d.idle = false` (sauf enchaînement automatique, qui le remet à vrai juste après `startQuest`). Ajouter la case `idleQuestAutocycle` (réglage joueur) exigée en plus du Perk 104.
9. **Garde de la remise avec niveau** : exiger `perkLevel[145] >= 1` (au lieu de « un des 9 niveaux ») dans `idleQuestHandInValueV1` ; le bouton « tout déposer » du jeu teste le Perk 66 (coquille ? à trancher avec Norman).
10. **Beurre** : le jeu le consomme à la main pendant la quête. Si on veut rester fidèle : action `questButter` qui pose `usedButter` (consomme 1 beurre, une fois par quête), et `completeQuestV1` n'applique le x2 que si `usedButter` ; sinon documenter « choix SOREAL » (case par défaut `useButter` vraie) au registre des constantes SOREAL.
11. **Achat de quirks** (`buyQuirkV1`) : refuser les quirks de type 20 (47-49, 67-69, 86-88) sans Resource 3 débloquée, de type 23 (ids 99-169) sans Cartes, de type 21 (54, 56) sans Wishes. Les types sont lus dans la scène : liste ci-dessous.
12. **Fruit of Quirks** : `⌈3 x tier x poop x yggdrasilYieldBonus x questRewardFactor (÷ beurre si utilisé) x harvestBonus⌉` ; SOREAL n'a ni la poop ni `questRewardFactor` (idle-ngu-systemes.js:529-530).
13. **Antlers of the Exile via Questing** : ABSENT ; à ajouter seulement avec l'accord de Norman (spoil) : fin de quête hors idle, `allActive`, `idleProgress` dans [0,9 ; 1], objet 337 obtenu → objet 338 niveau 100.
14. **Niveaux « bruts » dans le jeu** : le jeu lit directement `quirkLevel` (sans filtre de difficulté) pour les quirks 13, 14, 17, 18, 19, 50, 54, 55, 56, 57-60, 90, 174, 175 ; SOREAL filtre tout par `idleQuirkNiveauxV1`. Sans conséquence tant qu'on ne peut pas redescendre de difficulté ; à noter si le jeu le permet (non vérifié).

Types des quirks (scène, liste `quirkType`) pour le point 11 : 20 = ids 47-49, 67-69, 86-88 (les ids 183-185, aussi Resource 3, sont de type 22 : non gardés par le jeu) ; 21 = ids 54, 56 ; 23 = tous les ids 99 à 169.

## 3. Ce que je n'ai pas pu vérifier

- **Effet par niveau des Souhaits 19, 62 et 47** (`WishProperties.effectPerLevel`) et des Perks ITOPOD (87, 89, 90, 91-92, 104-106, 145-148, 66 : `effectPerLevel`, caps) : non lus dans la scène (hors périmètre ; supposés égaux aux valeurs des catalogues SOREAL). L'effet de `ItopodPerkController::questDrop1` (1 + niveau x effet, Perk 90) est confirmé dans sa forme, pas dans sa valeur.
- **Unité de `InventoryController.bonuses[45]`** (Quest Drops de l'équipement) : fraction ou pourcentage ? SOREAL divise par 100.
- **Plancher 3600 s du temps minimum de souhait** (`idle-ngu-pistes.js:360`) : aucun plancher n'apparaît dans `minimumWishTime` (4908) ; les réductions de `ItopodPerkController::totalWishMinReduction` (458) n'ont pas été chiffrées.
- **Formule de `CardsController::getBonus(14)`** (cartes QP) et table des `cardTier_*` au-delà du jeu d'identifiants : relues seulement comme sous-ensemble (groupe Cartes).
- **Respawn** (`AdventureController::respawnTime`) : utilisé par le temps d'idle ; non relu (groupe Aventure).
- **`bonuses[43]`, `bonuses[25]`, `Character.addAP` ajouts d'équipement** : seuls le plancher et le x1,2 / x1,02 d'`addAP` (2225) sont lus ; le groupe Boutiques/AP les couvre.
- **Interface de Questing** (zone « Go to quest » conditionnée par l'achat) : hors gameplay.


Mise a jour 2026-11-17 : corrige le 2026-11-17 : arrondis QP/AP en deux troncatures float32 (idle-questing-v1.js), garde d achat des quirks R3/Souhaits/Cartes (idle-ngu-snapshot.js buyQuirkV1). Les points P1 1, 2, 3, 4, 6, 7, 12, 13 etaient deja corriges.
