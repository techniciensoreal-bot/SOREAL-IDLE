# Audit code du jeu (NGU Idle build 1260) vs moteur SOREAL : groupe « defis »

Périmètre : `AllChallengesController`, `Challenge`, `Challenges`, `Basic/NoAugs/Hour24/LevelChallenge10K/NoEquipment/NoRebirth/Troll/LaserSword/Blind/NGU/TimeMachine/YggdrasilChallengeController`, plus TOUS les consommateurs des complétions de défis dans le reste du jeu (Character, AllAugs, Augment, Inventory, Hacks, Diggers, Daycare, NGU, Wishes, Wandoos, BossController, AdventureController, Rebirth). Moteur : `cloudflare/src/idle-ngu-catalogues.js` (tables, `challengePermanentBonuses`), `idle-ngu-snapshot.js` (`challengeAction`, `challengeUnlocked`, `autoCompleteChallengeV1`), `idle-ngu-systemes.js` (Troll), `idle-ngu-actions.js`, `idle-ngu-pistes.js`, `idle-runtime-combat.js`.

Conventions de lecture (vérifiées dans l'IL) :
- `Character.bossID` démarre à 0 (`Character::hardReset`) et gagne 1 à chaque boss vaincu : `bossID` = nombre de boss vaincus. La condition de victoire `bossID > targetBoss_jeu` équivaut donc à « vaincus >= targetBoss_jeu + 1 ». Le `targetBoss` SOREAL (58, 59, 66...) est ce nombre « +1 » : CONFORME partout où il est comparé à `context.bosses` (= `BOSS_VAINCUS`).
- Difficulté : le jeu lit `PlayerSettings.rebirthDifficulty` (0 Normal, 1 Evil, 2 Sadistic). Chaque difficulté a son compteur (`curCompletions`, `curEvilCompletions`, `curSadisticCompletions`) ; `completions()/evilCompletions()/sadisticCompletions()` sont plafonnés à `maxCompletions`. SOREAL : `state.challenge.completions` (Normal) et `completionsTier.difficile` (Evil) / `.extreme` (Sadistic), plafonnés par `rewarded = before < max`.
- Récompense de tout défi (identique pour les 11) : si `cur <= max` après incrément, `Character::addExp(base * m)` et `Character::addAP(baseAP / d)` avec (Normal : m=1, d=1 ; Evil : m=10, d=5 ; Sadistic : m=100, d=5). Pour le 24 Hour : `base * completions()` (n = numéro de la complétion en cours) dans les trois difficultés.

---

## 1. Tableau méthode par méthode

### 1.1 Récompenses de base (valeurs `baseExpReward` / `baseAPReward` / `maxCompletions`, sérialisées dans la scène)

Source : lecture binaire de `NGUIdle_Data/level0` (recherche des triplets d'entiers sérialisés, donc « lecture binaire », voir §3). Les 9 premiers sont des triplets uniques trouvés, avec le bon quartet de contexte.

| Défi | Valeurs scène (EXP / AP / max) | SOREAL Normal (`idle-ngu-catalogues.js:254-264`) | Verdict |
|---|---|---|---|
| Basic | 1500 / 2500 / 5 | 1500 / 2500 / 5 | CONFORME |
| No Augs | 5000 / 10000 / 5 | 5000 / 10000 / 5 | CONFORME |
| 24 Hour | 400 / 5000 / 10 | 400 / 5000 / 10 (+ scaleByNumber) | CONFORME |
| Troll | 5000 / 10000 / 7 | 5000 / 10000 / 7 | CONFORME |
| No Rebirth | 10000 / 25000 / 10 | 10000 / 25000 / 10 | CONFORME |
| Laser Sword | 3000 / 3000 / 20 | 3000 / 3000 / 20 | CONFORME |
| Blind | 2500 / 3000 / 10 | 2500 / 3000 / 10 | CONFORME |
| No NGU | 3000 / 3000 / 10 | 3000 / 3000 / 10 | CONFORME |
| No Time Machine | 2000 / 2000 / 10 | 2000 / 2000 / 10 | CONFORME |
| **No Equipment** | 4000 / **12000** / 5 (offset 2741100) | 4000 / **3000** / 5 | **ÉCART** (AP). Le tableau Evil de SOREAL (2400 = 12000/5) est déjà cohérent avec 12000 : le Normal est incohérent avec son propre Evil. |
| **100 Levels** | **2000 / 6000** / 5 (offset 2815132) | **500 / 1500** / 5 | **ÉCART** (EXP et AP). Evil SOREAL (20000 EXP = 2000x10 ; 1200 AP = 6000/5) cohérent avec 2000/6000. |

Evil/Sadistic (`CHALLENGE_TIER_ROWS_V1`, lignes 274-287) : EXP = base x10 / x100, AP = base /5 (identique Evil et Sadistic) : CONFORME pour les 9 défis ci-dessus ; No Equipment et 100 Levels cohérents avec les bases 12000 et 2000/6000 ci-dessus (donc seul le Normal est faux).

### 1.2 AllChallengesController / Challenge / Challenges

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `AllChallengesController::adventureBonus` | `idle-ngu-catalogues.js:359` `adventureStatsMultiplier` | **ÉCART** | Jeu : `(1 + 0,05 x c + (c>=1 ? 0,10 : 0)) x (1 + 0,10 x evil)` (les deux facteurs se MULTIPLIENT, `mul` final). SOREAL : `1 + basic*0.05 + (basic>0?0.10:0) + evil*0.10` (ADDITION). À c=5, e=5 : jeu 1,35 x 1,5 = 2,025 ; SOREAL 1,85. |
| `AllChallengesController::wandoosBonus` | `:392` `wandoosSpeedChallengeMultiplier` | CONFORME | `1 + 0,2 x completions(100 Levels)` (plafonné). |
| `AllChallengesController::nguBonus` | `:386-389` `nguSpeedMultiplier` / `idle-ngu-bonus.js:283` | CONFORME | `max(1, 1 + 0,05 x completions(NGU))`. |
| `AllChallengesController::expFactor` | `idle-adventure-combat.js:306-307` (titans) | CONFORME pour les TITANS | `1 + 0,10 c + 0,04 e + 0,02 s` du 24 Hour, utilisé UNIQUEMENT par `AdventureController::boss1Exp..boss12Exp` (EXP des titans). SOREAL l'applique aux titans comme dans le jeu. Voir 1.4 pour les boss normaux. |
| `AllChallengesController::hasParalyze` | (rien) | **ABSENT** | `basic.completions() >= max` débloque la compétence PARALYZE du joueur (`Paralyze::Update`). Aucune compétence Paralyze joueur dans SOREAL (seul le type d'ennemi « paralyze » existe, `idle-adventure-zones.js`). |
| `AllChallengesController::quitChallenge / cancel / startQuitChallenge` | `challengeAction` mode `stop` (`idle-ngu-snapshot.js:1338-1347`) | CONFORME (+ 1 écart mineur) | Abandon sans pénalité. Blind : le jeu retarde l'abandon de 180 s (`Invoke("delayedBlindQuit",180)`, anti-triche) ; SOREAL abandonne tout de suite. ÉCART mineur. |
| `AllChallengesController::Update / checkChallengesForPortrait / delayedBlindQuit` | (UI/portrait) | IGNORÉ | Pure interface. |
| `Challenge::setChallengeStats / getPoints / initializeEvilStuff`, `Challenges::.ctor / updateAllChallenges` | état `state.challenge` | CONFORME / sans objet | `getPoints` et `curPoints/maxPoints` ne sont lus nulle part (code mort). `initializeEvilStuff` met à 0 les compteurs Evil/Sadistic d'un ancien fichier (migration), équivalent `createChallengeTiersV1`. |
| Compteur brut `curCompletions` (non plafonné) | `completions[id]` plafonné (`before < max`) | **ÉCART mineur** | Le jeu continue d'incrémenter `curCompletions` au-delà du max (message « you've hit your max ») ; quelques bonus lisent la valeur BRUTE : `Character::totalRecycleBonus` = `+ 0,1 x basic.curCompletions`, `totalLevelBonus` des Diggers (>= 1). SOREAL plafonne : `boostRecycleChance: clamp(basic*0.10,0,1)` ; au-delà de 5 complétions Basic le jeu donne plus de 50 % de recyclage. |

### 1.3 Contrôleurs de défi : condition d'entrée, objectif, récompense

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `BasicChallengeController::targetBoss` | `catalogues:254` targetBoss 58, step 0 | CONFORME | constante 57 (>57 = 58 vaincus). |
| `BasicChallengeController::unlocked` | `snapshot:1256` `highestBoss>=58` | CONFORME | Jeu : toujours vrai ; le menu Challenges lui-même s'ouvre à `bossID==58` (`BossController::advanceBoss`), SOREAL `unlock:{bosses:58}`. |
| `BasicChallengeController::complete / expectedEXP / expectedAPReward / specialRewards` | `snapshot:1365-1403` | CONFORME (hors EXP, voir 1.5) | Normal : +5 %/compl. aventure, +10 % de plus à la 1re, +10 % recyclage/compl., PARALYZE à la dernière. Evil : +10 % stats aventure/compl. Sadistic : mayo 1 de chaque (5 à la dernière) : `idleCardsGrantChallengeMayoV1` CONFORME. |
| `BasicChallengeController::Update/updateButton/completions/evil/sadistic/currentCompletions/maxedOut/failedChallenge` | idem | CONFORME | |
| `NoAugsChallengeController::targetBoss` (58) | 59 / step 0 | CONFORME | |
| `NoAugsChallengeController::unlocked` | `snapshot:1257` `highestBoss>=75` | CONFORME | `highestBoss >= 75`. |
| `NoAugsChallengeController::complete/specialRewards` + consommateurs `AllAugsController::updateTotalBonus/totalBonus`, `AugmentController::getAugProgressPerTick x4, getUpgradeProgressPerTick x2`, `Character::augDiscount` | `catalogues:362-368` | CONFORME | Puissance totale : `x (1 + 0,25 x c)` ; vitesse : `x (1 + 0,05 x evil)` PUIS `x 1,1` si c>=1 PUIS `x 1,25` si evil>=max (trois facteurs multipliés) = SOREAL `(1+noAugsEvil*0.05)*(noAugs>0?1.1:1)*(noAugsEvil>=5?1.25:1)` ; coût : `0,5` si c>=max = `augmentationCostMultiplier`. |
| `Hour24ChallengeController::targetBoss` | `challengeTargetBoss` (`snapshot:1276`) | CONFORME | `min(299, 26 x completions_difficulté + 57)` ; SOREAL 58 + 26 x complétions de la difficulté (le `min(299)` n'est pas reproduit : atteint seulement à 10 complétions, 57+260 = 317 > 299 ; **ÉCART mineur** pour les complétions >= 10 qui n'existent pas, max=10, 26x9+57=291 < 299, donc jamais atteint : sans effet). |
| `Hour24ChallengeController::unlocked` | `snapshot:1260` | **ÉCART mineur** | Jeu : `basic.bestTime < 86400` (strict, secondes de TEMPS DE JEU, toutes difficultés). SOREAL : `bestMs.basic <= 24*3600000` (large, temps mural, Normal seulement). |
| `Hour24ChallengeController::Update/challengeFailed` | `snapshot:1367` | **ÉCART** | Jeu : à `challengeTime >= 86400` s le défi ÉCHOUE tout seul (`challengeFailed` : sortie du défi, rien gagné). SOREAL : ne contrôle le temps qu'au moment de valider (`DEFI_ECHOUE_TEMPS`) ; le défi reste actif indéfiniment (restrictions hors-ligne incluses) jusqu'à abandon manuel. |
| `Hour24ChallengeController::complete / expectedEXP / expectedExpReward / expectedAPReward` | `snapshot:1374-1383` `scaleByNumber` | CONFORME | EXP `400 x n x {1,10,100}`, AP `5000 x n / {1,5,5}` (n = numéro de la complétion, `completions()+1` après incrément). Bonus : +1 d'EXP de boss 24+ à la 1re complétion, +10 %/+4 %/+2 % par complétion (voir 1.4). |
| `LevelChallenge10KController::targetBoss` (57) | 58 / 0 | CONFORME | |
| `LevelChallenge10KController::unlocked` -> `AllNGUController::unlocked100LevelChallenge` (4060) | `snapshot:1261` `nguTotalLevelsV1(state)>=10` | **ÉCART (à confirmer)** | Jeu : somme de `getLevel()` sur le tableau `AllNGUController.NGU` (NGU d'Énergie, un seul tableau) >= 10. SOREAL : total de TOUS les NGU (Énergie + Magie, 3 paliers). Plus laxiste. |
| `LevelChallenge10KController::complete / expected* / specialRewards` | `catalogues:392,395` | CONFORME (hors base 1.1) | Normal : +20 %/compl. vitesse Wandoos ; 1re : Boost Transformation (`idle-inventory-auto-v1.js:39`) ; Evil : -10 % temps de boot Wandoos par compl. (`Wandoos98Controller::wandoosBootupTime` = `3600 (3240 avec XL) x max(0,5, 1 - 0,1 x evil)`, SOREAL `idle-ngu-etat.js:363-364` identique). |
| `LevelChallenge10KController` restriction `Character::canLevel/levelsRemaining` (2229/2230) | `challengeHundredLevelsRemaining/Consume` (`snapshot:1234`) | CONFORME | `rebirthLevels < 100` par Rebirth ; compteur incrémenté par Augments, Upgrades, Beards, Blood Magic, TM (vitesse et or), Wandoos (énergie et magie) ET Advanced Training (`AdvancedTrainingController::updateAdvancedTraining`). SOREAL : 6 sites ; la prise en compte d'Advanced Training n'a pas été vérifiée de bout en bout (§3). |
| `NoEquipmentChallengeController::targetBoss` (65) | 66 | CONFORME | |
| `NoEquipmentChallengeController::unlocked` -> `ItemList::receivedGRBSet` (3430) | `snapshot:1263-1266` | CONFORME | Les 7 objets d'id 78..84 ont été LÂCHÉS (`itemDropped`) ; SOREAL : les 7 pièces `seen` (ou GRB complété). |
| `NoEquipmentChallengeController::complete` | `snapshot:1380-1403` | **ÉCART mineur** | Jeu : `Purchases.hasAutoBoost = 1` à CHAQUE complétion, toute difficulté ; SOREAL `autoBoost: noEquipment>0` (Normal seulement). Récompenses : Normal 8 emplacements/compl. +10 à la dernière, Evil 3/compl. +9 à la dernière + emplacement MacGuffin à la dernière, Sadistic +2 % idle attack/compl. +10 % à la dernière : `InventoryController::curSpaces` (3575), `macguffinSpaces` (3577), `Character::idleAttackPower` (2170) = SOREAL `catalogues:369-376` CONFORME. Auto Merge/Boost : `x (1 - 0,1 c)` (3585/3586) = `autoMergeTimeMultiplier` CONFORME. |
| `NoEquipmentChallengeController::expected*`/`AP` | | **ÉCART** | AP de base 12000 vs 3000 (§1.1). |
| `NoRebirthChallengeController::targetBoss` | `39 + 5 x completions_difficulté` | CONFORME | SOREAL 40 + 5 x compl. (mêmes pas par difficulté). |
| `NoRebirthChallengeController::unlocked` | `snapshot:1268` titan t3 vaincu | CONFORME | `Challenge.unlocked` posé à la mort de Jake (`AdventureController::enemyDeath`, `manageFight`). |
| `NoRebirthChallengeController::complete/expected/specialRewards` + `AdventureController::boss3SpawnTime..boss14SpawnTime` (89-100) | `idle-adventure-combat.js:831` | CONFORME | `temps = base - min(900 x C, cap)`, plancher 3600 s ; C = Normal pour les titans 3 à 6, Normal+Evil pour 7 à 9 (Greasy Nerd, Godmother, Exile), Normal+Evil+Sadistic pour 10 à 14. SOREAL : rangs >= 3 / >= 7 / >= 10 (`TITAN_RANK_V1`), plancher 3 600 000 ms : identique. Cooldowns de base 2 h/2 h/3 h/3,5 h/4,5 h/5 h/5,5 h/6,5 h/7 h/7,5 h : identiques. `LootDrop::titanLevelBonus` (486) : +1 niveau si c>0 = `titanLootLevelBonus` CONFORME. |
| `NoRebirthChallengeController::Start/Update/completeChallenge/challengeFailed` | `snapshot`, rebirth interdit `idle-ngu-actions.js:1270` | CONFORME | |
| `TrollChallengeController::targetBoss` | `68 + 15 x completions_difficulté` | CONFORME | SOREAL 69 + 15 x compl. |
| `TrollChallengeController::unlocked` | `snapshot:1267` titan t2 vaincu | CONFORME (indirect) | Jeu : `AchievementList.achievementComplete[129]`, dont la condition (`AllAchievementsController::achievementCondition`, cas 129) est `PlayerSettings.yggdrasilOn`, ouvert par le titan 2 (aussi `Challenges.trollUnlocked` posé à `titan2Kills`). |
| `TrollChallengeController::trollFactor` | `IDLE_TROLL_INTERVALS_S_V1` (`systemes:1242`) | CONFORME | switch sur les complétions DE LA DIFFICULTÉ : 120, 110, 100, 90, 85, 80, 75 (et 75 ensuite). |
| `TrollChallengeController::updateTroll` | `advanceTrollChallengeV1` (`systemes:1360`) | CONFORME | `InvokeRepeating("updateTroll",0,1)` : compteur +1 par seconde ; gros troll si `compteur % (5 x facteur) == 0`, petit si `% facteur == 0`. SOREAL : minuterie en secondes, `count % 5 === 0` : équivalent. |
| `doBigTroll` (6 cas, `Random.Range(1,7)`) | `IDLE_TROLL_BIG_V1` | CONFORME | NGU cassés, Beards cassés (si Beards actifs), menus (75 % de menu aléatoire), tout ruiner, Wandoos bleu, diviseur du multiplicateur de boss par `completions + 2` (une seule fois, sinon retirage). Le cas `disableEquipment` est inatteignable (Range(1,7) = 1..6) : SOREAL n'en a pas : CONFORME. |
| `doSmallTroll` (9 cas, `Range(1,10)`) | `IDLE_TROLL_SMALL_V1` | CONFORME (+ 2 variantes SOREAL) | Mêmes 9 effets, même ordre. SOREAL ajoute (décision Norman 2026-11-02, anti-spoil et alternance) : un troll n'est tiré que sur un système possédé (`trollPossibleV1`) et l'historique de 3 petits trolls évite les répétitions ; le jeu retire seulement si `bossID < 17 / 30 / 37` (Augments / Time Machine / Blood Magic) ou Wandoos éteint. Non issu du jeu, volontaire. |
| `halfAugs` (1058) | `applyTrollEffectV1` augments | CONFORME | `augLevel/2` et `upgradeLevel/2` (division entière) = `Math.floor(x/2)`. |
| `loseBlood` (1435) + `rebirthPower=1` | `blood` | CONFORME | `bloodPoints=0`, puissance de Rebirth Blood Magic = 1. |
| `wipeTimeMachine` (4288) + `clearAllActiveDiggers` | `timeMachine` | CONFORME | `levelSpeed=levelGoldMulti=0`, Diggers actifs coupés (SOREAL remet aussi les barres à 0 : sans effet visible). |
| `wipeGold / wipeEnergy / wipeMagic / wipeEnergyMagic / wipeWandoos / disableNGU / disableBeards / disableWandoos / divideBossMulti / multiTroll / trollMenus / trollBox / trollKitty* / resetTrolls / resetCounter` | `applyTrollEffectV1`, `fireTrollV1`, drapeaux `troll.flags` | CONFORME | `realGold=0` ; énergie/magie : tout retiré (`removeAllEnergy`) ; Wandoos : niveaux énergie/magie = 0 ; NGU/Beards/Wandoos « jusqu'au Rebirth » ; Beards et NGU coupent aussi les Diggers. `multiTroll` = tout ruiner (or, TM, augments, sang, énergie+magie, Wandoos). |
| `TrollChallengeController::complete` récompenses | `catalogues:379-398` etc. | CONFORME | Normal : 1 Magic NGU x3 (`NGUMagicController::progressPerTick` : `sadisticCompletions`... voir ci-dessous), 2 slot d'accessoire, 3 niveau max Yggdrasil 24 (`AllYggdrasil::capTier`, `systemes:315`), 4 slot de Beard (`beardSlotsV1`), 5 Fruit of Numbers, 6 rituel Blood Magic, 7 Golden Beard. Evil : 1 accessoire, 2 slot MacGuffin, 3 slot de garderie, 4/6 souhaits Dual Wielding (`WishesController::wishLocked` 28 si <4, 45 si <6 = `IDLE_WISH_TROLL_EVIL_V1`), 5 +25 % vitesse Hacks (`HacksController::totalHackSpeedBonus`), 7 slot de souhait. Sadistic : 1 NGU Énergie x3 (`NGUController::progressPerTick` et `AllNGUController::energyNGUCapAmount` : x3 des que `sadisticCompletions >= 1`), 2 plus de MacGuffins, 5/6 +10 % cartes/mayo, 7 accessoire. Tous présents. **Note** : `AllNGUController::energyNGUCapAmount` (4065) applique AUSSI le x3 au plafond des NGU d'Énergie ; non retrouvé côté SOREAL (§2, point 12). |
| `TrollChallengeController::expected*` | | CONFORME | Base 5000/10000 (§1.1). |
| `LaserSwordChallengeController::laserSwordTarget` | `snapshot:1331` `2 + done` | CONFORME | `completions_difficulté + 2` pour le niveau ET le niveau d'upgrade de l'Augment 6 (Laser Sword). |
| `LaserSwordChallengeController::Update` (win) | `autoCompleteChallengeV1` | CONFORME | `augLevel >= cible && upgradeLevel >= cible`. |
| `LaserSwordChallengeController::unlocked` | `snapshot:1269` `laserSwordPair(...) >= 1/1` | **ÉCART** | Jeu : drapeau `Challenges.laserSwordChallengeUnlocked`, posé UNE FOIS par `Update` quand `aug[6].augLevel>=1 && upgradeLevel>=1` et jamais retiré. SOREAL : relit le niveau COURANT ; après un Rebirth (niveaux d'Augments remis à 0) le défi se reverrouille (et disparaît du snapshot s'il n'a jamais été complété). |
| `AugmentController::augTierBonus` (laser) | `laserSwordStepV1` (`catalogues:329-335`) | CONFORME | `0,05 + 0,01 x c + (c>=max ? 0,05 : 0)` x rang de l'augment (déjà aligné le 2026-11-15). |
| `BlindChallengeController::targetBoss` | 57 + 10 x compl. | CONFORME | |
| `BlindChallengeController::unlocked` | `snapshot:1270` titan t4 vaincu | CONFORME (probable) | Jeu : `blindChallengeUnlocked` (posé par `LootDrop::zone14Drop`) OU `itemDropped[141]`. Mapping zone 14 = UUG non recoupé (§3). |
| `BlindChallengeController::complete` + consommateurs `AllDaycareController::daycareTime` (3293), `AllGoldDiggerController::totalDaycareBonus` (3123), `InventoryController::daycareSpaces` (3578) | `idle-daycare-v1.js:408-428`, `daycare:416` | CONFORME | Normal : temps x `(1 - 0,05 - 0,01 c)` plancher 0,85, slot de garderie à >= 10 ; Evil +2 %/compl., Sadistic +1 %/compl. (facteurs multipliés). |
| `NGUChallengeController::targetBoss` | 57 + 10 x compl. | CONFORME | |
| `NGUChallengeController::unlocked` -> `AllNGUController::nguChallengeUnlocked` (3978) | `snapshot:1271` `nguTotalLevelsV1 >= 10000` | **ÉCART (à confirmer)** | Jeu : somme des `NGU.level` des NGU d'Énergie >= 10000 OU somme des NGU de Magie >= 10000 (deux sommes séparées, niveaux de base). SOREAL : somme TOTALE (énergie + magie + niveaux Evil/Sadistic). |
| `NGUChallengeController::complete` (Normal +5 % NGU ; Evil +20 % Hacks/compl. ; Sadistic rien) | `catalogues:386-390` | CONFORME | `HacksController::totalHackSpeedBonus` : `x (1 + 0,2 x evil)` puis `x 1,25` si Troll Evil >= 5 = SOREAL. |
| `TimeMachineChallengeController::targetBoss` | 57 + 15 x compl. | CONFORME | |
| `TimeMachineChallengeController::unlocked` | `snapshot:1272` | CONFORME | `PlayerSettings.diggersOn`. |
| `TimeMachineChallengeController::totalGPSbonus` (2041) | `timeMachineGoldMultiplier` (`catalogues:383`) | **ÉCART** | Jeu : `1 + 1 x completions(Normal)` (Time Machine seulement, via `Character::grossGoldPerSecond`). SOREAL : `1 + noTimeMachine + (noTimeMachineEvil>=1 ? 1 : 0)` : SOREAL ajoute le « +100 % or » du 1er No TM Evil au GPS de la Time Machine. |
| `Character::totalGoldbonus` (2209) | `goldDropChallengeMultiplier` (`catalogues:385`, valeur 1) | **ÉCART** | Jeu : x 2 sur le bonus d'OR GLOBAL (butin d'or de l'aventure : `LootDrop::goldDrop`) si `timeMachineChallenge.evilCompletions >= 1`. SOREAL : constante 1 (le x2 est placé dans le GPS de la TM). |
| `TimeMachineChallengeController::TMSpeedBonus` (2042) | `timeMachineSpeedMultiplier` | CONFORME | `1 + 0,1 x evil` sur `speedProgressPerTick`. |
| `AllGoldDiggerController::totalLevelBonus` (3131) | `diggerGlobalBonus` (`systemes:620`) | CONFORME | +0,05 si `curCompletions >= 1` (donc +5 % additif). |
| `AllGoldDiggerController::maxDiggerSlots` (3104) | `diggerSlotBonus` | CONFORME | +1 slot à >= 5 complétions (Normal). |
| `TimeMachineChallengeController::complete / specialRewards` (Normal +100 % GPS/compl., +5 % Diggers, slot à 5 ; Evil +100 % or 1re, +10 % vitesse/compl.) | | voir lignes ci-dessus | |
| `YggdrasilChallengeController::*` (10 méthodes) | (rien) | **ABSENT : sans objet** | Copie morte du No Augs (utilise `noAugsChallenge`, cible 57), aucune référence ailleurs dans l'assembly. Rien à porter. |

### 1.4 EXP de boss du 24 Hour Challenge (consommateur : `BossController::rewardExp`, 1547)

| Méthode | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `BossController::rewardExp` (boss >= 24) | `idle-runtime-combat.js:492` `facteurExpBossPerkSorealIdle_` + `idle-ngu-bonus.js:1026` `bossExpMultiplierFromPerks = perks + bossExpPct` | **ÉCART (important)** | Jeu (bossID >= 23) : `base = max((bossID - 13) / 10, 1) + (h24.completions() >= 1 ? 1 : 0)` ; `exp = base x (1 + 0,02 x h24.completions()) x ItopodPerkController::totalBossExp` ; puis `Character::addExp`. Seules les complétions NORMALES comptent (+2 % chacune, pas d'Evil/Sadistic), plus +1 d'EXP de base dès la 1re. SOREAL : `bossExpPct = 0,10 c + 0,04 e + 0,02 s` ajouté EN ADDITION au facteur du perk ITOPOD (`1 + perk + 0,10 c + ...`), pas de +1. Le texte du jeu parle de « +10 % », mais le code applique 0,02 aux boss normaux ; 0,10/0,04/0,02 ne vaut que pour les TITANS (`expFactor`). |
| `AdventureController::boss1Exp..boss12Exp` (titans) | `idle-adventure-combat.js:306-307` | CONFORME | `ToInt64(base x expFactor)`. |

### 1.5 Récompense EXP : `Character::addExp` / `addAP`

| Méthode | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `Character::addExp(long|float)` (2221/2222), `checkExpAdded` | `idle-ngu-snapshot.js:1382` `state.currencies.experience+=rewardExperience` | **ÉCART (important)** | `addExp` multiplie par NGU EXP x (objet 119 maxé ? 1,1 : 1 + bonus équipement[24]) x (perk ITOPOD 94 >= 987 ? 1,05) x Digger EXP x Hacks EXP x Souhaits x Cuisine, puis `Math.Floor`. SOREAL crédite l'EXP des défis BRUTE (sans multiplicateur d'EXP), alors que le gain de boss/titans/Money Pit passe par `xpMultiplier` (`snapshot:1463`). Aussi : l'EXP annoncée au joueur (`expectedEXP` utilise `checkExpAdded`) est la valeur multipliée. |
| `Character::addAP` / `checkAPAdded` | `apWithBonusV1` (`snapshot:1383`) | CONFORME | `floor(AP x bonusAP succès x (objet 129 maxé ? 1,2 : 1+bonus[25]) x (perk 94 >= 89 ? 1,02))`. |

### 1.6 Démarrage / contrôle d'un défi (`Rebirth`)

| Méthode | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `Rebirth::verifyChallengeStatus` | `defiTropTotV1` (`snapshot:122`), `challengeAction` | CONFORME + 1 écart mineur | Temps minimum de run (180 s - 10 s x niveau du souhait 20, borné [120,180]) : SOREAL `minRebirthSecondsV1` identique. Pas déjà en défi : identique. **ÉCART mineur** : le jeu exige aussi `bossID > 0` (au moins un boss vaincu dans la run) ; SOREAL ne le vérifie pas. |
| `Rebirth::minRebirthTime` | `minRebirthSecondsV1` | CONFORME | |
| `Rebirth::start*/engage*Challenge` (11) -> `Rebirth::engage(true)` | `applyRebirthResetV56_(forceNumber:1, clearBanks:true)` | CONFORME (Laser Sword = Rebirth normal : `engage(false)`) | `hardResetMultis` (tous multiplicateurs à 1), `challengeReset` Advanced Training/Beards/TM, pas de `addBankedLevels`. Chaque `engageXChallenge` pose `inChallenge/curChallengeType`, le No NGU met `NGU.disabled`, etc. |
| `Rebirth::awardAP` (appelé dans `engage`, donc AUSSI au lancement d'un défi) | `idle-ngu-actions.js:~603` | **ÉCART (hors groupe, important)** | Jeu : `AP = max(0, rebirthTime - 3600) / 500` (division entière). SOREAL : `if(!options.challengeId && runSeconds>=3600) ap += floor(runSeconds/500)` : (a) ne retire pas les 3600 s (7 AP à 3600 s au lieu de 0), (b) saute le versement au lancement d'un défi alors que le jeu le fait. |
| `AllNGUController::energyNGUCapAmount` (x3 Troll Sadistic) | (non retrouvé) | NON VÉRIFIÉ | voir §3. |

---

## 2. Écarts priorisés et corrections proposées

1. **EXP des défis sans multiplicateur d'EXP (critique)** : `idle-ngu-snapshot.js:1380-1403`. Remplacer
   ```js
   state.currencies.experience+=rewardExperience;
   ```
   par
   ```js
   const expGagnee=Math.floor(rewardExperience*Math.max(0,num(idleNguBonusesLectureV1(state).xpMultiplier,1)));
   state.currencies.experience+=expGagnee;
   ```
   et renvoyer `reward:{experience:expGagnee,ap:...}` (et `expectedEXP` côté client si elle est calculée depuis la table). `idleNguBonusesLectureV1` est déjà importé dans ce fichier. (Les facteurs de `xpMultiplier` doivent rester ceux d'`addExp` : NGU, équipement/objet 119, Fibonacci 987, Diggers, Hacks, Souhait 61, Cuisine.)
2. **EXP de boss 24+ du 24 Hour (important)** : dans `idle-runtime-etat.js:1426/1452`, `idle-runtime-progression.js:1310/1360`, `idle-runtime-combat.js:770/800` remplacer le facteur `facteurExpBossPerkSorealIdle_(bonus, idx)` par la formule du jeu : `xp = (xpBaseBoss(idx) + (h24>=1 ? 1 : 0)) x (1 + 0,02 x h24) x facteurPerkITOPOD` (perk et défi MULTIPLIÉS, pas additionnés), avec `h24 = challenge.completions.twentyFourHours` (Normal uniquement, plafonné). Retirer `bossExpPct` de `bossExpMultiplierFromPerks` (`idle-ngu-bonus.js:1026`) mais le garder pour les TITANS (`titanExpChallengePct`, déjà correct : `1 + 0,10 c + 0,04 e + 0,02 s`). À trancher avec Norman : le texte du jeu affiche « +10 % » alors que le code applique +2 % aux boss normaux ; la règle du dépôt veut que le code gagne.
3. **Basic : produit, pas somme** : `idle-ngu-catalogues.js:359` :
   ```js
   adventureStatsMultiplier:(1+basic*0.05+(basic>0?0.10:0))*(1+k(e,"basic")*0.10),
   ```
4. **Or du défi No Time Machine** : `catalogues:383-385` :
   ```js
   timeMachineGoldMultiplier:1+noTimeMachine,
   goldDropChallengeMultiplier:noTimeMachineEvil>=1?2:1,
   ```
   (`goldDropChallengeMultiplier` est déjà multiplié dans `adventureGoldMultiplier`, `idle-ngu-bonus.js:972`.) Attention : le commentaire de SOREAL cite la page wiki Broken Time Machine (« 1100 % au total ») ; le code du jeu place le 1er Evil sur le bonus d'or de l'aventure, pas sur le GPS de la machine.
5. **Récompenses de base No Equipment (AP 12000) et 100 Levels (2000 EXP / 6000 AP)** : `catalogues:258` `reward:{experience:4000,ap:12000}` ; `catalogues:257` `reward:{experience:2000,ap:6000}`. Les tables Evil/Sadistic restent inchangées (déjà cohérentes avec ces bases).
6. **Laser Sword : déblocage mémorisé** : ajouter `state.challenge.laserUnlocked` (booléen) posé à vrai dès que `laserSwordPair(state)` a `level>=1 && upgradeLevel>=1` (dans `syncIdleNguState`/à la lecture de `challengeUnlocked`), jamais remis à faux, et dans `challengeUnlocked` : `return Boolean(state.challenge.laserUnlocked)||(pair.level>=1&&pair.upgradeLevel>=1)`.
7. **24 Hour : échec automatique** : dans `autoCompleteChallengeV1` (ou la passe de temps), si `active==="twentyFourHours"` et `now - startedAt >= 24*3600000` : appeler le mode `stop` (rien gagné) et mémoriser l'échec pour le client. Débloquer le 24 Hour avec `bestMs.basic < 86400000` (strict).
8. **Déblocages Evil/Sadistic** : `snapshot:1256` `if(def.tier&&def.tier!=="normal")return true;` fait sauter les conditions propres à chaque défi (Laser Sword sans l'augment, Troll sans titan 2, No NGU sans 10000 niveaux...). Dans le jeu les `unlocked()` ne dépendent pas de la difficulté. Appliquer les mêmes conditions que le Normal (c'est le chemin du joueur : il passe en Evil APRÈS les avoir remplies).
9. **Déblocage NGU / 100 Levels** : 100 Levels : somme des niveaux des NGU d'ÉNERGIE de base >= 10 ; No NGU : somme énergie seule >= 10000 OU somme magie seule >= 10000 (`AllNGUController::nguChallengeUnlocked`). À confirmer sur le sens exact de `NGU.level` (niveau « Normal » du NGU, pas Evil/Sadistic) avant de modifier `challengeNguLevels`.
10. **Recyclage Basic au-delà du max** : conserver un compteur brut `challenge.completionsRaw.basic` (incrémenté même au-delà de 5) et utiliser `boostRecycleChance: basicRaw*0.10` (le jeu ne plafonne pas à 5 x 10 %). Idem pour `TM >= 1` (sans effet car seuil).
11. **Auto Boost par n'importe quelle difficulté** : `autoBoost: noEquipment>0 || k(e,"noEquipment")>0 || k(s,"noEquipment")>0` (le jeu pose `hasAutoBoost` à chaque complétion, toutes difficultés).
12. **`AllNGUController::energyNGUCapAmount`** : x3 si Troll Sadistic >= 1 (comme la vitesse). Vérifier que le plafond d'énergie des NGU SOREAL reçoit ce x3 (la vitesse l'a : `nguSpeedEnergyChallengeMultiplier`).
13. **`Rebirth::awardAP`** (groupe Rebirth, constaté ici) : `ap = Math.floor(Math.max(0, runSeconds - 3600) / 500)`, versé AUSSI quand un défi est lancé (retirer `!options.challengeId`).
14. **Lancement d'un défi sans boss vaincu** : refuser si `bossID == 0` dans la run (`context.bosses <= 0`).
15. **Blind : abandon différé de 180 s** (anti-triche du jeu) : facultatif ; SOREAL abandonne immédiatement.
16. **PARALYZE (compétence du joueur)** : récompense de la dernière complétion Basic non implémentée (nécessite la compétence côté Aventure : hors groupe défis).

---

## 3. Ce qui n'a pas été vérifié, et pourquoi

- **Valeurs de scène** (§1.1) : lues en binaire dans `level0` (triplets d'entiers uniques cherchés par valeur attendue). Les 9 premières correspondent exactement ; les deux « ÉCART » (No Equipment 12000 AP, 100 Levels 2000/6000) sont des triplets uniques de même format (`exp, max, ap`, préfixe 21000) mais l'appartenance exacte de ces deux blocs à `NoEquipmentChallengeController` et `LevelChallenge10KController` repose sur la cohérence avec les tables Evil de SOREAL (qui impliquent 12000 et 2000/6000), pas sur une lecture de la hiérarchie de la scène. À confirmer avec le banc du vrai jeu (`cloudflare/tools/banc-vrai-jeu`) en terminant un défi.
- Le `maxCompletions` de chaque défi vient du même `level0` (5, 5, 10, 5, 5, 10, 7, 20, 10, 10, 10) : concordant avec SOREAL.
- **Multiplicateurs de `Character::addExp`** : j'ai supposé que `idleNguBonusesLectureV1(state).xpMultiplier` reproduit les 7 facteurs d'`addExp` (c'est ce qu'indique son commentaire, ligne 950) ; non rejoué numériquement.
- **Déblocage du Blind** : `LootDrop::zone14Drop` pose `blindChallengeUnlocked` ; j'ai supposé zone 14 = UUG (titan 4, `unlock:{titan:"t4"}`), sans désassembler l'appelant de `zone14Drop`. L'alternative `itemDropped[141]` n'est pas modélisée.
- **Déblocage du Troll** : cas 129 de `achievementCondition` lu comme `yggdrasilOn` en comptant les étiquettes du `switch` à partir de l'index 0 (peut être décalé d'un cran si l'index est `id - 1`).
- **Advanced Training dans le plafond des 100 niveaux** : le jeu l'inclut (`rebirthLevels` incrémenté dans `updateAdvancedTraining`) ; je n'ai pas confirmé que `advanceTrackSystem` SOREAL consomme le pool pour cette piste (6 sites de `challengeHundredLevelsConsume` : Beards, Wandoos, TM, Blood Magic, Augments, pistes génériques).
- **Effets des trolls au détail** : `trollBox`, `trollMenus`, `trollKitty` (affichage), ancre `trollMenuSwap` (75 % de menu aléatoire) : purement client, non audités. Les montants exacts des dialogues sont de l'UI.
- **MacGuffins / Cartes / Wishes** liés aux défis (Troll Sadistic 2, cartes Sadistic 5/6, slot de souhait Evil 7) : consommateurs lus côté jeu (`macGuffinBonusTimeFactor`, `curWishSlots`, `wishLocked`) et retrouvés dans SOREAL (`idle-macguffins-v1.js:287`, `idle-ngu-pistes.js:60`, `idle-difficulty-gates-v1.js:98`), mais leurs formules propres relèvent des groupes MacGuffins / Wishes.
- Le fichier `cache.json` du lecteur d'IL (cwd du dossier scratchpad) a servi aux recherches croisées (`g.mjs`) ; aucune modification du dépôt hors de ce rapport.
