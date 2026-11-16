# Audit code du jeu (build 1260) : Bestiaire, Portraits, récompenses quotidiennes, Garderie (Daycare), Yggdrasil

Date : 2026-11-16. Côté jeu : IL de `Assembly-CSharp.dll` (BestiaryController 22 méthodes + Bestiary / BestiaryIconController, PlayerPortraits, `AllChallengesController::checkChallengesForPortrait`, tous les écrivains de `PlayerPortraits.portraitUnlocked`, AllDaycareController 9, DaycareItemController 23, `InventoryController::updateKittyArtCount/daycareSpaces`, AllYggdrasil / FruitController) ET champs sérialisés de la scène `NGUIdle_Data/level0` (extraits par balayage binaire). Côté SOREAL : `cloudflare/src/idle-runtime-collection.js` (Collection/bestiaire), `idle-portraits-v1.js`, `idle-daycare-v1.js`, `idle-daycare-skins-v1.js`, `idle-ngu-actions.js` (`daycareFactorsV1`), `idle-ngu-catalogues.js` (`IDLE_NGU_YGG_FRUITS`), `idle-yggdrasil-extra-v1.js`.

Aucun fichier du dépôt n'a été modifié, sauf ce rapport. Les complètements de scène (tables lues) sont consignés en §6 pour pouvoir être relus.

## 0. Résumé

| Système | Verdict global |
|---|---|
| Bestiaire | Aucune récompense, aucun palier dans le jeu : compteur cosmétique. SOREAL (« Collection ») n'a donc rien à reproduire ; 2 divergences cosmétiques (kills vs rencontres, granularité des entrées). |
| Portraits | 69 portraits dans le jeu. SOREAL : 51 (dont 1 original SOREAL). **ÉCART** : seuil SEXY/SMART faux (250 % au lieu de +150 %), 3 portraits « tous les défis » absents (conditions exactes maintenant connues), 1 portrait offert à tous absent. |
| Récompenses quotidiennes | Le jeu n'a QUE la roue (déjà auditée, CONFORME) + promos de plateforme + menu Krissmuss. **Aucun calendrier de connexion dans le jeu** : celui de SOREAL (`idle-login-calendar-v1.js`) est une fonctionnalité originale. |
| Garderie | Mécanique CONFORME (temps, vitesse, slots, hors ligne, perks 27/28, souhait 27). **ÉCART MAJEUR** sur la table des taux `daycareRate` : 94 objets refusés par SOREAL (`TAUX_DAYCARE_INCONNU`) alors que le jeu a leur taux ; 3 valeurs fausses (objet 386 : 24 h au lieu de 72 h ; 504 et 505 : 278 h au lieu de 277,78 h). Le « type 11 » exempté du plafond 100 = les fragments de MacGuffin (2 h par niveau). Apparences du chat : l'achat « Daycare Kitty Art! » en donne 5 dans le jeu, 1 dans SOREAL. |
| Yggdrasil (constantes de scène) | **0 écart** : `baseSeedReward`, `baseSeedCost`, `activationCost`, `usesEnergy` des 21 fruits, noms et ordre identiques ; plafonds de tier et seuil de croissance identiques. Les autres écarts de Yggdrasil (conditions de déblocage, poop/Brown Heart, fruit d'or, MacGuffin α, Quirks) restent ceux de `economie.md` §1.7, inchangés. |

## 1. Bestiaire (BestiaryController, 22 méthodes)

Faits IL : le bestiaire du jeu = `Bestiary.enemies`, liste de `BestiaryInfo { int kills }` de longueur `Bestiary::bestiaryLength` = **379** : entrées 1 à 301 = les 301 boss (nom et histoire du boss), entrées 302 à 379 = les ennemis d'Aventure par ID de sprite (`AdventureController.enemySprites`). Aucune méthode ne donne d'EXP, d'AP, de bonus ou de palier à partir des kills : `BestiaryInfo.kills` n'est lu que par l'affichage (liste, « Enemies Defeated: n/379 », fiche « Kills: n »).

| Méthode du jeu | Ce qu'elle fait | Équivalent SOREAL | Verdict |
|---|---|---|---|
| `Start` (1398) | page 0, sélection de l'entrée 1 | aucun (UI) | HORS GAMEPLAY |
| `setPage`, `pageUp/Down`, `goToPageMin/Max` (1399, 1414-1417) | navigation | albums/pagination côté client | HORS GAMEPLAY |
| `updateMenu/updateIcons/updatePortrait/updateButtons/updatePageText` (1400-1404) | affichage | — | HORS GAMEPLAY |
| `updateEnemiesDefeatedText` / `enemiesDefeatedCount` (1405/1406) | nombre d'entrées avec `kills > 0` sur le total 379 | `decouvertes` sans dénominateur (règle n°2) | CONFORME (écart voulu : le total est caché) |
| `BestiaryIconController::unlocked` (1422) | entrée débloquée si `kills > 0`, OU (id 1-150 et `highestBoss >= id`), OU (id 151-200 et `highestHardBoss >= id`), OU (id 201-301 et `highestSadisticBoss >= id`) | `idle-runtime-collection.js:1275-1312` : boss découvert si `index < bossVaincus` (`max(boss du run, highestBossEver)`) ou trace de rencontre | ÉCART mineur / NON VÉRIFIÉ (correspondance 1-150 / 151-200 / 201-301 avec la difficulté) |
| `BestiaryIconController::selected` (1421) | entrée verrouillée : infobulle « You have to encounter and defeat whatever this is in Adventure » | texte client | HORS GAMEPLAY |
| `selectNewEnemy` (1409), `selectStory` (1407), `selectFlavour` (1408), `enemyMetaInfo` (1418) | fiche : nom, numéro, kills, histoire du boss (1-301), « Flavour Text » (sinon « To be added in a future patch! ») | fiche Collection (nom, stats wiki, rencontres) | HORS GAMEPLAY |
| `confirmedKill(id)` (1410) | `kills++` (borné à int.MaxValue), appelé par `AdventureController::enemyDeath` pour tout ennemi mort SAUF `enemyType == 11` (ITOPOD) | Collection compte les RENCONTRES (`mobEncountersByIndex`, `bossEncountersByIndex`) | ÉCART mineur (cosmétique), voir §1.1 |
| `confirmedItopodKill` (1411) | même corps que `confirmedKill` | — | CODE MORT dans le jeu (aucun appelant) |
| `addKills(id, n)` (1412) | `kills += n` ; appelé par `manageFight` (boss de zone 302, 303, 304, 305, 310, 312-314, 315…) et par `Character::adventureOfflineProgress` (kills hors ligne) | aucun compteur de kills par entrée | ÉCART mineur (cosmétique) |
| `forceUnlock(id)` (1413) | met `kills = 1` si 0 ; appelé 42 fois dans `manageFight` à l'apparition d'un titan (versions 1-4 de chaque titan), sans qu'il soit tué | la fiche du titan ne dépend pas de la Collection | NON VÉRIFIÉ (cosmétique) |
| `Bestiary::bestiaryLength` (1395) = 379 ; `.ctor/updateBestiary` (1396/1397) | taille de la liste | 283 fiches de mobs (wiki) + 301 boss | ÉCART de structure (cosmétique) |

### 1.1 Écarts du bestiaire (tous sans effet de jeu)

1. **Déblocage par rencontre au lieu de mort** (cosmétique, faible priorité). Le jeu révèle un ennemi d'Aventure seulement après l'avoir tué (`kills > 0`) ; SOREAL le révèle dès la première rencontre (« rencontres », y compris un combat perdu ou fui, voulu par Norman le 2026-09-15). Correctif exact si on veut l'aligner : ajouter dans `rollKill` (`idle-adventure-butin.js` / `idle-adventure-combat.js`) un compteur `zone.mobKillsByIndex[zone][index]` / `bossKillsByIndex` (même forme que `mobEncountersByIndex`) et tester `kills > 0` à la place de `rencontres > 0` dans `idle-runtime-collection.js` (lignes ~1472-1560). À ne faire que sur décision de Norman : cela retire une information que le joueur a aujourd'hui.
2. **Granularité** : le jeu suit 78 entrées d'ennemis d'Aventure (IDs de sprite 302-379), SOREAL 283 fiches issues de la liste wiki (nom + stats par ennemi). Sans conséquence mécanique ; NON RECOMMANDÉ de changer (la règle n°1 interdit d'inventer, et le wiki est la source des stats affichées).

## 2. Portraits (PlayerPortraits, `checkChallengesForPortrait`)

Faits IL : `PlayerPortraits.portraitUnlocked` = liste de booléens, `maxPortraits()` = **69** (index 0 à 68). `updatePortraits` met l'index 0 à vrai (portrait par défaut). Le choix du portrait est cosmétique (`BossController::advancePortrait/backPortrait/updatePlayerPortrait`).

### 2.1 Conditions de déblocage (toutes celles du code)

| Index jeu | Condition (méthode) | SOREAL (`idle-portraits-v1.js`) | Verdict |
|---|---|---|---|
| 0 | toujours | `default` | CONFORME |
| 1 à 10 | « Sexy Player Fashion Pack » (achat plateforme `consumeFashionPack1`, Steam/Kongregate/Kartridge) | absent | N/A (achat de plateforme ; +200 000 AP avec le pack) |
| 11 | set Training complet (`AllItemListController::checkforBonuses` 3406 ; relu au chargement `ImportExport::loadData`) | `training` | CONFORME |
| 12 | set Sewers | `sewers` | CONFORME |
| 13, 14, 15 | set Forest (les trois d'un coup) | `forest`, `forest-bonus-1`, `forest-bonus-2` | CONFORME (le déblocage manuel est bien à la complétion ; `minTier` ne sert qu'au portrait automatique) |
| 16 à 20 | sets Cave, HSB, GRB, Clock, 2D | `cave`, `hsb`, `grb`, `clock`, `2d` | CONFORME |
| 21 à 25 | sets Ghost (Spoopy), Jake, Gaudy, Mega, Beardverse | `spoopy`, `jake`, `gaudy`, `mega`, `beardverse` | CONFORME |
| 26, 27 | sets Waldo, Anti-Waldo | `wanderer`, `rerednaw` | CONFORME |
| 28 à 41 | sets Badly Drawn, Stealth, Beast1 (Slimy), Choco, Edgy, Pretty, Nerd (Greasy Nerd), Meta, Party, Godmother (Mobster), Typo, Fad, JRPG, Exile | `badly` … `exile` | CONFORME (14 sets, tous présents) |
| 42 | AUCUN écrivain dans le code | — | NON VÉRIFIÉ : portrait jamais débloquable dans ce build (ou débloqué par une voie hors IL) |
| 43 | souhait 26 niveau ≥ 1 (`WishesController::doLevelupEffect` 4876) | `wish-weiner` | CONFORME |
| 44 | souhait 75 niveau ≥ 1 | `wish-mayo` | CONFORME |
| 45, 46 | promo Steam (`InfonStuffController::claimSteamPromo` : +7 tours de roue gratuits) | absent | N/A (promo de plateforme) |
| 47 à 50 | sets Rad, Back to School, Western, Space | `rad`, `backtoschool`, `western`, `space` | CONFORME |
| 51 | **offert à tout le monde** : `ImportExport::finalTriggers` (4536), appelé à la fin de chaque chargement de partie | absent (SOREAL a `sleepyhollow`, original : fenêtre d'Halloween) | NON VÉRIFIÉ : l'image 51 est inconnue ; si c'est un portrait saisonnier, le vrai jeu le donne à tous en permanence |
| 52 à 55 | sets Bread, 70s (Disco), Halloweenies, Rock Lobster | `bread`, `disco`, `halloweenie`, `rock` | CONFORME |
| 56 | souhait 202 niveau ≥ 1 | `wish-sneak-preview` | CONFORME |
| 57, 58 | `Inventory.macguffinBonuses[8]` (SEXY) / `[9]` (SMART) **> 2,5** (`InventoryController::Update` 3573) | `sexy`/`smart` : `macguffinPermanentPctV1 >= 250` | **ÉCART** (§2.2) |
| 59 à 62 | sets Construction, Duck, Nether (Dutch), Amalgamate | `construction`, `duck`, `dutch`, `amalgamate` | CONFORME |
| 63 | TOUS les 11 défis Normal à leur maximum (`AllChallengesController::checkChallengesForPortrait` 1882) | absent | **ÉCART** (§2.3) |
| 64 | idem pour tous les défis en Evil (`curEvilCompletions`) | absent | **ÉCART** |
| 65 | idem pour tous les défis en Sadistic (`curSadisticCompletions`) | absent | **ÉCART** |
| 66 | set Pirate | `pirate` | CONFORME |
| 67, 68 | menu Krissmuss : 25 000 AP + portrait « nice » (67) ou « naughty » (68), UNE seule fois (`XmasController::pickPrize` 3970) | absent | N/A (événement passé) |

Bilan : les 44 portraits de sets + défaut + 3 souhaits = conformes ; SOREAL ajoute `sleepyhollow` (condition inventée par Norman, hors jeu).

### 2.2 ÉCART : seuil des portraits SEXY / SMART (priorité moyenne, correctif d'une ligne)

Le jeu teste `macguffinBonuses[8] > 2.5` (valeur initiale 1,0 ; c'est un MULTIPLICATEUR : `Character::totalEnergyPower` multiplie directement par `macguffinBonuses[0]`, et le jeu AFFICHE `valeur × 100 %`, d'où le « 250 % » du wiki). SOREAL stocke le bonus en pourcentage AU-DESSUS de 1 (`macguffinEffectMultipliersV1 : 1 + pct / 100`, formules `lin 0,001 / coef 0,03981` = 100 × (1e-5 / 3,981e-4 du jeu)). Le seuil équivalent est donc `pct > 150`, pas `pct >= 250` : SOREAL fait attendre un multiplicateur de 3,5 au lieu de 2,5 (il faut ~2,3 fois plus de niveaux de fragment).

Correctif exact (`idle-portraits-v1.js`) :
- lignes `["sexy", …, { type: MACGUFFIN, macguffin: "sexy", pct: 250 }]` et `["smart", …, pct: 250 }]` → `pct: 150` ;
- `idlePortraitUnlockedV1` : `Number(env.macguffinPct(u.macguffin)) >= u.pct` → `> u.pct` (strict, comme `ble.un` du jeu) ;
- `conditionTexteV1` : le texte dit « à 250 % » : afficher « multiplicateur ×2,5 » ou garder « 250 % » en précisant que c'est le multiplicateur (cohérent avec l'affichage du jeu `macguffinBonuses × 100`) ;
- mettre à jour les commentaires de `idle-macguffins-v1.js:78-96` (« portrait à 250 % ») et les tests `idle-portraits-v1`.
(Le jeu fait aussi lire ces deux fragments par `AllBeardsController::energyBeardSpeedFactor/magicBeardSpeedFactor` (affichage seulement : `StatsDisplay::displayBeards`), donc « aucun effet » de gameplay reste vrai.)

### 2.3 ÉCART : portraits « tous les défis » (priorité basse : cosmétique ; conditions maintenant exactes)

SOREAL les avait écartés faute de précision du wiki (« ni "complété" = une fois ou au maximum, ni la difficulté ne sont précisés »). Le jeu précise : pour CHAQUE difficulté séparément, les 11 défis (Basic, No Augs, No Equipment, 24 h, 100 niveaux, Troll, No Rebirth, Laser Sword, Blind, No NGU, Time Machine) doivent avoir `curCompletions` (Normal) / `curEvilCompletions` / `curSadisticCompletions` ≥ `maxCompletions` du défi ; vérification périodique dans `AllChallengesController::Update`. Chaque portrait est acquis pour toujours (index 63, 64, 65).

Correctif : ajouter à `TABLE_V1` trois lignes `["defis-normal"|"defis-evil"|"defis-sadistic", <fichier image>, <libellé>, { type: "defis", tier: "normal"|"difficile"|"extreme" }]`, un cas `u.type === "defis"` dans `idlePortraitUnlockedV1` (`env.defisTousMax(tier)`), et dans `portraitEnvV1` (`idle-ngu-snapshot.js`) : `defisTousMax: tier => CHALLENGE_TIERS[tier].every(c => completions(state, tier, c.id) >= c.max)` avec le `max` du TIER (déjà dans `CHALLENGE_TIER_ROWS_V1`). Le jeu n'a qu'un `maxCompletions` par défi, commun aux trois difficultés : si une ligne de tier SOREAL a un `max` différent du Normal, c'est un écart à traiter dans `defis.md`. Les images sont des fichiers à fournir par Norman (non lisibles dans l'IL). Anti-spoil : n'afficher que les portraits obtenus (déjà le cas, `list` filtre).

### 2.4 Autres points

- Condition 51 (offert à tous) : voir tableau ; à trancher avec Norman.
- `idle-portraits-v1.js:20` (commentaire « Non implémenté : conditions des défis imprécises ») sera à mettre à jour.

## 3. Récompenses quotidiennes / connexion

| Élément | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Roue journalière (`DailyRewardController`, 42 méthodes : paliers 0-7 par `totalSpins`, tables de gains, chrono 24 h, banque 36 h / 7 j) | `getTier0..7RewardIndex/tierNReward`, `currentTier`, `startSpin`, `canSpin`, `maxSpinTime` | `spinDaily` (`idle-ngu-snapshot.js`) | CONFORME : déjà audité intégralement (`economie.md` §1.1 ; 1 écart mineur connu : 1er tour avec 23 h d'avance dans le jeu) |
| Banque de roue étendue (`ArbitraryController::extendedSpinBankCost` 782) | 100 000 AP, 36 h → 7 j | `dailySpinTimeBank` | CONFORME (`boutiques.md` l.57) |
| Tours gratuits (`DailyReward.freeSpins`) | alimentés par les promos Steam/Kartridge (+7) | absent | N/A (promo de plateforme) |
| Calendrier / série de connexion | **n'existe pas** (aucune chaîne « login », « streak », « calendar » côté gameplay ; recherche dans les 5 300 méthodes) | `idle-login-calendar-v1.js` (déclaré « fonctionnalité SOREAL originale ») | HORS JEU : conservé tel quel (valeurs de Norman) |
| Special Prize (`SpecialController`, 50 000 AP une seule fois, ou « Pretty Kitty ») | `hasSpecialPrize1`, `choseKitty`, +50 000 AP dans les deux cas | `idle-ngu-actions.js:489`, `IDLE_SPECIAL_PRIZE_AP_V1 = 50000` | CONFORME |
| Menu Krissmuss (`XmasController`, menu 54) | 25 000 AP + portrait 67/68 (une fois) | absent | N/A (événement passé, hors périmètre) |
| Autres « quotidiens » du jeu | `BeastQuestController::resolveDailyTimer` (quêtes) | `idle-questing-v1.js` | traité dans `quirks-questing.md` |

## 4. Garderie (Daycare)

### 4.1 Mécanique (IL)

| Méthode du jeu | SOREAL | Verdict |
|---|---|---|
| `AllDaycareController::daycareTime` (3293) = `daycareRate[id]` (s) × [Blind Normal : 1 − 0,05 si ≥1 complétion − 0,01 × complétions, plancher 0,85] × (1 − niv.perk 27 × EPL) × (1 − niv.perk 28 × EPL) × (0,9 si `hasDaycareSpeed`) | `idleDaycareFactorsV1.timeParts` ; `perks.daycareTimeMultiplier` | CONFORME. EPL des perks 27 et 28 LUS en scène (`float[]` perks @1999044) : **0,01 et 0,01** = SOREAL (`daycareTimePct: 0.01`). |
| `DaycareItemController::updateDaycareTimer` (3329) : timer += `deltaTime × totalDaycareBonus()` tant que `niveau < 100` OU `type == 11` | `advanceIdleDaycareV1` | CONFORME (hors type 11, §4.3) |
| `levelsAdded` (3338) = `floor(timer / daycareTime)`, plafonné à `100 − niveau` sauf type 11 | `levelFromHoursV1` | CONFORME (hors type 11) |
| `AllGoldDiggerController::totalDaycareBonus()` (3123) = digger 9 (si actif) × (1 + `bonuses[44]`) × (1 + 0,02 × Blind Evil) × (1 + 0,01 × Blind Sadistic) × `hacks.totalDaycareSpeed` (**seulement difficulté ≥ Evil**, 3220) × souhait 27 (`wishEffect(27)`) × cartes[12] × (1,05 si perk [94] ≥ 55), plancher 1 | `daycareFactorsV1` (`idle-ngu-actions.js:1210`) ; `hackFxV1` renvoie 1 en Normal (`idle-ngu-bonus.js:202`) | CONFORME. Valeurs de scène recoupées : souhait 27 `effectPerLevel` 0,01, `maxLevel` 10, Evil (`souhaits.md` l.152) ; digger 9 `startingBoost` 0,05 et `boostPerLevel` 0,001 (= 105 % + 0,1 %/niveau, `ngu-hacks-barbes-mineurs-tables.md` §4) ; `totalLevelBonus` 3131 = `1 + somme × 0,0005` (≤500), `1,25 + (somme−500)^0,7 × 0,0005`, +0,05 (Time Machine ≥ 1), +0,05 (set Party) = `diggerGlobalBonus`. |
| `Character::inventoryOfflineProgress` (2241) : timer += secondes hors ligne × `totalDaycareBonus()` | `advanceIdleDaycareV1` (« en ligne comme hors ligne : même chemin ») | CONFORME |
| `InventoryController::daycareSpaces` (3578) = `hasDaycare` + `hasDaycareSlot2` + `hasDaycareSlot3` + (Blind Normal ≥ 10) + (Troll Evil ≥ 3) + (perk 86 ≥ 1) | `idleDaycareFactorsV1.slots` (3 achats EXP + Blind Normal 10 + Troll Evil 3 + perk 86, max 6) | CONFORME (lève la réserve « nombre d'emplacements » de `economie.md`) |
| `swapDaycare` (3643) / `OnDrop` / `equip` / `endDragAction` | `idleDaycarePlaceV1` : refus si équipé, doublon de définition, boost/consommable | NON VÉRIFIÉ (comportement de glisser-déposer) |
| `kiityTooltip`, `showPanel/hidePanel`, `updateKitty`, `advanceKitty`, `Update` | skins (voir §4.4) | HORS GAMEPLAY / voir §4.4 |

### 4.2 ÉCART MAJEUR : table des taux `daycareRate` (`IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1`)

Source du jeu : `ItemNameDesc.daycareRate`, `float[600]` en SECONDES, sérialisé dans la scène à l'offset **2 343 560** de `level0` (compteur 600 puis 600 `float32` ; l'indice est l'ID de l'objet = l'ID wiki de SOREAL ; les noms d'objets du jeu coïncident avec ceux de SOREAL aux 321 indices communs, sauf les « <3 » des Hearts et « (Accessory) »).

Comparaison automatique des 321 taux de SOREAL avec la scène : **318 identiques**, 3 écarts :

| ID | Objet | SOREAL | Jeu | Correctif |
|---|---|---|---|---|
| 386 | The Key | 24 | **72** h | `386: 72` |
| 504 | Ascended x9 Pendant | 278 | 277,7778 h (1 000 000 s) | `504: 1000000 / 3600` |
| 505 | LootzLrtozlOtZlOtTlooTTLoooLLLTTTToTlOOt | 278 | 277,7778 h | `505: 1000000 / 3600` |

**94 objets que SOREAL refuse (`TAUX_DAYCARE_INCONNU`) ont un taux dans le jeu** (même source). Ils sont dans `IDLE_ADVENTURE_WIKI_ITEM_IDS_V1` mais pas dans la table de garderie. Valeurs (heures de base par niveau) à ajouter à `IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1` (`// source : level0 @2343560 daycareRate[id] / 3600, build 1260`) :

- **24 h** (3) : 391 A Still-Beating Heart, 445 Edgy Magicite Crystal, 446 Creepy Doll.
- **48 h** (2) : 449 THRO, ODIGNSLUG ; 450 A Link Cable.
- **72 h** (8) : 335 Seal, 336 Face, 337 Tentacle, 338 Antlers, 339 Buster, 340 Antennae, 341 Sack (tous « of the Exile ») ; 451 A Hand Cursor.
- **96 h** (46) : 392 à 429 (sets Bread 392-399, Disco 400-407, Halloweenies 408-415, Rock 416-423 + accessoires de Rock 424-429 : A Skipping Stone, A Bed Rock, Rock Candy, A Broken Pair Of Scissors, Portable Stairway (To Heaven), Amplifier) ; 507 à 514 (set Pirate : Pirate Hat, Swashbuckler Chest, Piratey Pants, Piratey Peglegs, The Cutlass, A Giant's Eyepatch, A Compass!, The Flintlock).
- **120 h** (35) : 453 à 460 (Construction), 461 à 468 (Dutch), 469 à 476 (Amalgamate : Choffice Hat of Greed … UUG's Big Book of Insults), 477 Raw Slab of Wood, 478 Tie of Apathy, 479 The Titan Effigy, 496 à 503 (Duck : A Fake Duckbill … The Zapper).

Conséquence actuelle : un joueur ne peut pas mettre en garderie les objets de tous les sets récents (Bread, Disco, Halloweenies, Rock, Construction, Dutch, Amalgamate, Duck, Pirate, Exile) ni les 3 Hearts de fin de jeu cités, alors que le jeu le permet. C'est l'écart le plus pénalisant du rapport.

Valeurs NON présentes dans la table SOREAL et sans objet SOREAL équivalent (pour mémoire, indices du tableau du jeu) : 179-183 (indices de la chasse au trésor, 24 h), 278-288 (objets de quête : 48 h), 367-371 (objets de quête, 24 h), 387 (GLOP Recipe, 24 h), 480-495 (pièces « THE END » : 120 h pour 480, 96 h pour 481-495), 1-39 (boosts : 2 h par défaut, non éligibles). À utiliser si ces objets sont ajoutés.

La règle n°1 d'AGENTS.md est respectée : ces nombres viennent du code/scène du jeu (source plus fiable que les pages wiki « Daycare: »), pas d'une extrapolation. Citer la source dans le commentaire, comme ci-dessus.

### 4.3 ÉCART : le « type 11 » = les fragments de MacGuffin

`Equipment.type == 11` est exempté du plafond 100 (`updateDaycareTimer` et `levelsAdded`). Les types ont été extraits de `ItemNameDesc::constructItemInfo` (515 objets) : **type 11 = les 22 fragments de MacGuffin** (IDs 198-211, 228, 250, 289-291, 298-300). Le taux de scène est **2 h par niveau** pour tous (avant les facteurs de temps), sans plafond de niveau 100 ; le perk 56 « MacGuffin Daycare! » (5 000 PP, Evil ; `atouts-tables.md` §56) est le verrou d'accès (`InventoryController::swapDaycare` 3643). Le jeu ajoute ces niveaux au NIVEAU du fragment (`InventoryController.macGuffinLevel(id)`), qui alimente le gain de bonus à chaque Rebirth.
SOREAL : `idle-daycare-v1.js` refuse les consommables et les fragments (non éligibles) et le perk 56 est absent. Écart de FONCTIONNALITÉ, plus de blocage « magnitude non publiée » : le taux (2 h/niveau, mêmes facteurs de temps et de vitesse que les objets) est connu. À implémenter seulement si Norman le veut : lever `IDLE_DAYCARE_MAX_LEVEL_V1` pour les fragments, ajouter `idleDaycareBaseHoursV1` = 2 pour ces IDs, et relier le niveau gagné au niveau du fragment dans `idle-macguffins-v1.js`.

### 4.4 ÉCART : apparences du chat de la garderie (`updateKittyArtCount` 3581, `updateKitty/advanceKitty`)

Le jeu a **11 apparences** (`Inventory.kittyArtSize` = 11, indices 0-10) :

| Indice | Condition dans le jeu | SOREAL (`idle-daycare-skins-v1.js`) |
|---|---|---|
| 0 | toujours | `defaut` |
| 1 | « Pretty Kitty » choisi au Special Prize (`choseKitty`) | `noeud` : CONFORME |
| 2 | aucun écrivain | — |
| 3 | pack « Ascended Newbie 2 » (achat de plateforme) | absent (N/A) |
| 4, 5, 6, 7, 9 | **achat « Daycare Kitty Art! » (250 000 AP, `boughtDaycareArt`)** : CINQ apparences d'un coup | `matrix` seulement : **ÉCART** |
| 8 | perk Fibonacci [94] ≥ 1597 | `fibonacci` : CONFORME |
| 10 | souhait 44 niveau ≥ 1 | `arcenciel` : CONFORME |

Écarts : (a) l'achat donne 5 apparences dans le jeu (le wiki dit « plusieurs nouveaux designs » mais ne les nomme pas), SOREAL n'en rattache qu'une (`matrix`) ; les 4 autres existent seulement côté jeu (images non lisibles dans l'IL : à fournir par Norman) ; (b) `dore`, `chauvesouris`, `tchernobyl`, `pirate`, `noel`, `nega` n'existent PAS dans le jeu (6 skins originaux SOREAL, conditions décidées par Norman le 2026-10-31) : hors périmètre de fidélité, conservés. Priorité basse (cosmétique, dépend d'images).

## 5. Yggdrasil : constantes de scène

Source : `AllYggdrasil` sérialisé dans `level0` (tableaux de 21 éléments : booléens @2504088, `baseSeedCost` @2504120 `long[]`, `baseSeedReward` @2504292 `long[]`, `activationCost` @2504464 `long[]`, noms @2504632, puis descriptions). Ces mêmes tables ont été relevées indépendamment par `ngu-hacks-barbes-mineurs-tables.md` §5 : les deux relevés concordent.

| Champ de scène | Valeurs du jeu (21 fruits, ordre gold, Power α, Adventure, Knowledge, Pomegranate, Luck, Power β, Arbitrariness, Numbers, Rage, MacGuffin α, Power δ, Watermelon, MacGuffin β, Quirks, 6 Mayo) | SOREAL | Verdict |
|---|---|---|---|
| `baseSeedReward` | 1,1,1,1,5,1,1,3,3,5,6,7,30,8,7, puis 10 ×6 | `baseSeeds` (`idle-ngu-catalogues.js:547-571`) identique | CONFORME |
| `baseSeedCost` (palier T coûte `baseSeedCost × ⌈T²⌉`, `FruitController::upgrade` 5046) | 1,10,25,40,60,100,150,170,200,2000,15000,30000,50000,100000,25000, puis 250000 ×6 | `tierCost` identique ; coût `tierCost × t²` (`idle-ngu-systemes.js:327`) | CONFORME |
| `activationCost` (payé en énergie/magie « idle », `FruitController::activate` 5044) | 100 000 ; 200 000 ; 200 000 ; 1 M ; 300 000 ; 5 M ; 3 M ; 20 M ; 10 M ; 500 M ; 500 M ; 5 G ; 20 G ; 100 G ; 40 G ; 1e16 ×6 | `activationCost` identique (Mayo : `IDLE_YGG_MAYO_ACTIVATION_COST_V1 = 1e16`) | CONFORME |
| `usesEnergy` (ressource payée) | Énergie : Gold, Power α, Adventure, Knowledge, Luck, Arbitrariness, Rage, Power δ, MacGuffin β ; Magie : Pomegranate, Power β, Numbers, MacGuffin α, Watermelon, Quirks ; Mayo alternés Énergie/Magie/Énergie/Magie/Énergie/Magie | `resource` identique pour les 21 | CONFORME |
| Noms et ordre | Fruit of Gold … Fruit of Pretty Mayo | identiques (cosmétique : « Ayy Lmayo » dans le jeu, « Ayyy LMayo » dans SOREAL) | CONFORME |
| `AllYggdrasil::capTier` (5012) | 10 ; 24 si Troll (Normal) ≥ 3 | `yggMaxTier` | CONFORME |
| `FruitController::tierThreshold` (5040) / `Fruit::harvestTier` (5032) | 3600 − min(60 × niveau du quirk 13, 180) s par tier ; tier = min(⌊secondes / seuil⌋, `maxTier`) | `idleYggTierSecondsV1` | CONFORME |
| `FruitController::tierFactor` (5086) | `⌈T^1,5⌉` | `idleYggSeedUnitV1` (`⌈T^1,5⌉`) | CONFORME |
| `seedReward` / `harvestSeedReward` (5056/5057) | `⌈base × tierFactor × (×2 si récolte) × perk graines × quirk 12 × (1 + bonus[15]) × NGU Ygg × perk récolte⌉` | `yggSeedGain` | CONFORME (`economie.md` §1.7) |

Aucun écart de constante. Les écarts de Yggdrasil restent ceux de `economie.md` §1.7 (conditions de déblocage des fruits Rage / MacGuffin α / Quirks, `usePoop` avec Brown Heart, fruit d'or sans arrondi, MacGuffin α et souhait 60, Fruit of Quirks) : non repris ici.

## 6. Écarts priorisés (récapitulatif et correctifs)

| # | Priorité | Système | Écart | Correctif exact |
|---|---|---|---|---|
| 1 | HAUTE | Garderie | 94 objets (sets récents) refusés faute de taux (`TAUX_DAYCARE_INCONNU`) alors que le jeu les accepte | Ajouter à `IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1` (`idle-daycare-v1.js`) les 94 lignes du §4.2 (24 h : 391, 445, 446 ; 48 h : 449, 450 ; 72 h : 335-341, 451 ; 96 h : 392-429, 507-514 ; 120 h : 453-479, 496-503), avec commentaire de source `level0 @2343560` ; mettre à jour le test de couverture de la table (si un test compte 321 taux) et la phrase d'en-tête « 105 autres pages n'ont pas de ligne Daycare ». |
| 2 | HAUTE | Garderie | 3 taux faux | `386: 72` (The Key, au lieu de 24) ; `504` et `505` : `1000000 / 3600` (277,7778) au lieu de 278. |
| 3 | MOYENNE | Portraits | Seuil SEXY/SMART : le jeu veut un multiplicateur > 2,5 (soit +150 %), SOREAL attend +250 % | `idle-portraits-v1.js` : `pct: 250` → `pct: 150` pour `sexy` et `smart` ; `>= u.pct` → `> u.pct` ; adapter `conditionTexteV1` et les commentaires `idle-macguffins-v1.js:78-96` ; tests. |
| 4 | MOYENNE | Garderie | Fragments de MacGuffin en garderie (type 11, 2 h/niveau, sans plafond 100, perk 56) absents | Voir §4.3 ; à lancer sur décision de Norman (fonctionnalité, pas un simple correctif). |
| 5 | BASSE | Portraits | 3 portraits « tous les défis au maximum » (Normal / Evil / Sadistic) absents | Voir §2.3 (conditions exactes ; images à fournir). |
| 6 | BASSE | Portraits | Portrait 51 offert à tous les joueurs au chargement | À trancher avec Norman (image inconnue ; peut recouper `sleepyhollow`). |
| 7 | BASSE | Garderie (skins) | L'achat « Daycare Kitty Art! » donne 5 apparences dans le jeu (indices 4, 5, 6, 7, 9), 1 dans SOREAL | Ajouter 4 apparences rattachées à `daycareKittyArt` quand les images existent. |
| 8 | TRÈS BASSE | Bestiaire | Révélation à la rencontre au lieu de la mort | Voir §1.1 (décision de Norman, retire une information). |
| 9 | INFO | Calendrier de connexion | N'existe pas dans le jeu | Rien à corriger ; fonctionnalité SOREAL. |

## 7. Non vérifié

- **Correspondance difficulté ↔ plages du bestiaire (1-150 / 151-200 / 201-301)** : le jeu teste `highestBoss`, `highestHardBoss`, `highestSadisticBoss` selon l'indice ; l'alignement exact avec la numérotation des boss SOREAL (`bossVaincus`, `highestBossEver`) n'a pas été retracé. Sans effet de jeu.
- **Image du portrait 51 et du portrait 42** : les sprites (`BossController.playerPortraitSprites`) sont des références d'asset, non lisibles dans l'IL ; le rôle de l'indice 42 (aucun écrivain) est inconnu.
- **`maxCompletions` des 11 défis par difficulté** : le jeu n'en a qu'un par défi ; `defis.md` l.174 donne 5, 5, 10, 5, 5, 10, 7, 20, 10, 10, 10 « concordant avec SOREAL ». Je n'ai pas vérifié que les lignes `CHALLENGE_TIER_ROWS_V1` Evil/Sadistic ont le même `max` (nécessaire pour les portraits 64/65).
- **Mécanique de glisser-déposer de la garderie** (`OnDrop`, `swapDaycare` pour les objets : refus des objets équipés, doublons, accessoires) : comportements d'interface, non comparés ligne à ligne.
- **Fruits de Mayo / macguffinBonuses** : l'accumulation par Rebirth des bonus de fragments (formule `(niveau+1) × 1e-5 × facteur de temps`) a seulement été recoupée sur les coefficients `lin` / `coef` de SOREAL ; le détail (`macGuffinBonusTimeFactor`) relève de l'audit des MacGuffins.
- **Le portrait Krissmuss, les packs de plateforme (mode de déblocage des indices 1-10, 45, 46, 3 des chats)** : volontairement hors périmètre (achats de plateforme ou événements passés).
