# Audit contre le code du jeu (build 1260) : Boss principaux, Entraînement avancé, Rebirth

Date : 2026-11-16. Source du jeu : `Assembly-CSharp.dll` lu avec `lecteur-il.mjs` (ids IL entre parenthèses) + scène `level0` (champs sérialisés, offsets d'octets cités). Rien n'est recopié : seulement des faits chiffrés. Aucun fichier du moteur n'a été modifié.
Moteur SOREAL comparé : `cloudflare/src/idle-runtime-boss.js`, `idle-ngu-boss-reference-v1.js`, `idle-runtime-combat.js` (nuke), `idle-runtime-progression.js`, `idle-ngu-pistes.js` (AT), `idle-ngu-bonus.js`, `idle-ngu-actions.js` (rebirth), `idle-ngu-ressources.js`, `idle-ngu-etat.js`, `idle-basic-training.js`.
Contrôle numérique des 301 boss : script `scratchpad/cmpboss.mjs` (reproduit `Boss::constructBossStats` en double et compare à `nguBossStatsV1`).

Verdicts : CONFORME / ÉCART (avec gravité) / ABSENT / NON VÉRIFIÉ.

---

## 1. Boss principaux

### 1.1 Statistiques (Boss::constructBossStats, id 1536)

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Boss 1 à 4 (indices 0 à 3) | Attaque / Défense / Regen / PV : 50 000 / 40 000 / 40 / 500 000 ; 100 000 / 90 000 / 90 / 1 M ; 400 000 / 350 000 / 350 / 4 M ; 1,1 M / 600 k / 170 / 11 M | `NGU_BOSS_REFERENCE_V1[0..3]` + `nguBossHpRegenForBossNumberV1` 40/90/350/170 | CONFORME (le boss 4 vaut bien 1,1 M, pas 1,3 M du tableau wiki) |
| Boss 5 à 20 (indices 4 à 19) | départ 1,3 M / 700 k / 200 / 13 M puis x5 AVANT chaque affectation : boss 5 = 6,5 M / 3,5 M / 1000 / 65 M | idem | CONFORME |
| Boss 21 à 301 (indices 20 à 300) | x10 par boss, attaque, défense, regen ET PV | idem | CONFORME |
| PV = 10 x Attaque ; Regen suit le même facteur | oui (boss 5 : 65 M = 10 x 6,5 M) | oui | CONFORME |
| Les 301 entrées | contrôle numérique : 0 écart (erreur relative max 1,9e-15) sur attaque, défense, PV, regen, boss 1 à 301 | | CONFORME |
| EXP de base (partie entière) boss 4 à 301 | table réf. = `floor(max((i-13)/10,1))` pour i >= 23, 1 pour 6 à 22, 0 pour 4 et 5 (indices) | 0 écart sur les 301 | CONFORME (la fraction est reprise par `facteurExpBossPerkSorealIdle_`, commit du 2026-11-16) |
| Difficulté Evil / Sadistic | stats de boss IDENTIQUES ; le joueur est divisé par `difficultyModifier` (2139) : champs publics `hardModifier` et `sadisticModifier`, initialisés à 1e25 / 1e50 par le constructeur mais la scène `level0` porte deux doubles 1e30 adjacents (offset 2 227 348) : les deux valent 1e30 | boss attaque/défense/PV/regen / 1e30 en Evil ET Sadistic | CONFORME (équivalent). Remarque : valeur de scène déduite d'une paire de doubles 1e30 trouvée à un seul endroit, très probable mais non rattachée formellement au composant Character |
| Après le boss 301 (bossID > 300) | plus de boss : `bossAttack = bossDefense = 69`, `bossRegen = bossCurHP = bossMaxHP = 420`, texte « NONE (YOU KILLED THEM ALL) », `fight()` retourne sans rien faire si bossID > 300 | extension infinie `definitionBossSorealIdle_` (x10 au-delà du catalogue), aucun garde à 301 trouvé | ÉCART (voir E3) |

### 1.2 Combat (BossController::fight, id 1542 ; `InvokeRepeating("fight", 0, 0,02)` dans `Start`, id 1539)

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Dégâts au boss par seconde | (Attaque joueur - Défense boss) x 0,02 par appel, 50 appels/s, plancher 0 | `max(0, puissance - defenseBoss)` par seconde | CONFORME |
| Dégâts au joueur | (Attaque boss - Défense joueur) x 0,02 par appel, plancher 0 | `degatsRecusSecondeSorealIdle_` : `max(0, attaque - defense)` / s | CONFORME |
| Regen du boss | `bossCurHP += bossRegen` à CHAQUE appel de `fight` (aucun facteur 0,02), plafonné à bossMaxHP, y compris hors combat : soit 50 x bossRegen par seconde | `regenBossSecondeSorealIdle_` renvoie la valeur du tableau comme regen PAR SECONDE | ÉCART (E4, faible impact pratique) |
| Capacités de boss (fureur, paralysie, bouclier, sceau, vulnérabilité, mana du joueur) | AUCUNE : le combat de boss principal n'utilise que attaque, défense, PV, regen | `multiplicateurAttaqueBossSorealIdle_` (fureur sous 30 % PV), `multiplicateurDpsJoueurBossSorealIdle_` (paralysie, bouclier), `multiplicateurSceauBossSorealIdle_` lisent `definition.capacites` du catalogue `IDLE_BOSS` | NON VÉRIFIÉ : si le catalogue ne porte aucune capacité pour les 301 boss, c'est du code mort inoffensif ; sinon c'est un écart (mécanique inventée). À contrôler dans la feuille `IDLE_BOSS` |
| Mur à la fin du monde 1 | aucun : `BossController` ne compare jamais bossID à 19/20 ; `ButtonShower::updateButtons` (3058) ne teste bossID que contre 1, 4, 17, 30, 37 | `bossBloqueRenaissance` : le boss d'index `BOSS_PAR_MONDE - 1` (19) ne peut pas être vaincu tant que `totalRebirths < 1` (`idle-runtime-progression.js:727`, `idle-runtime-combat.js:710`) | ÉCART (E5) |
| Seuils de menus (ButtonShower) | bossID >= 4 Rebirth/Aventure, 17 Augmentations, 30 Time Machine (+ `setBankedLevels` à bossID == 30), 37 Magie (+ `Magic::unlockMagic` : cap >= 10 000, vitesse de barre >= 3, magicPerBar >= 1), 58 Défis (`Challenges.unlocked`) | `REBIRTH_UNLOCK_BOSS_V1` = 4, Augmentations 17, TM 30, magie/sang 37, défis 58 | CONFORME (déjà vérifié par les audits précédents) |

### 1.3 NUKE (nukeBosses id 1543, startNuke 1545, autoNukeThreshold 1541 = 60, Update 1540)

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Condition de pas | Attaque joueur / 5 > Défense boss ET Défense joueur / 5 > Attaque boss, strictes | idem (`idle-runtime-combat.js` ~l. 736) | CONFORME |
| Un boss par appel de `fight` (50/s) tant que les conditions tiennent | oui | boucle de 500 itérations instantanée | CONFORME en résultat |
| Limite haute | stop si bossID > 300 | aucun garde | ÉCART (E3) |
| Boss jamais vaincus | stop si `bossID >= highestBoss ET bossID < 124` : le NUKE ne passe un boss d'index < 124 que s'il a DÉJÀ été vaincu en difficulté Normal (`highestBoss` n'est mis à jour qu'en Normal, id 1546) ; à partir de 124 il peut tuer de nouveaux boss | aucune condition de ce type (le seul garde est le « mur » boss 20) | ÉCART (E2) |
| Auto-nuke | `nukeTimer` mis à 50 s à chaque rebirth (`resetBoss`), seuil 60 s => 1er nuke 10 s après le rebirth puis toutes les 60 s ; exige `boughtAutoNuke` + `autoNukeOn` | Auto Nuker (boutique Sellout) « 10 secondes après chaque Rebirth puis chaque minute », côté client `ui-amorcage-v1.js:974` | CONFORME |
| Rebirth refusé pendant un nuke ou un combat | oui (`Rebirth::rebirth`) | non applicable (moteur par appel) | n/a |

### 1.4 advanceBoss (id 1546) : récompenses et bookkeeping

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Multiplicateur de boss (`bossMulti`) | x2 par boss en Normal, x1,5 en Evil, x`sadisticBossMultiplier` en Sadistic, à CHAQUE victoire ; remis à 1 par `resetBoss` | `calculateIdleNguNextNumber` : `base^bosses` avec base 2 / 1,5 / 1,2 + bonus (`idle-ngu-ressources.js:56`) | CONFORME |
| `sadisticBossMultiplier` (id 1544) | `1,2f + Perks ITOPOD 157+158 + Quirks 74+75 + Souhaits 107+108` ; chaque terme nul tant que la difficulté courante est inférieure au prérequis ; Perk : 0,0005/niveau plafonné à 0,005 chacun ; Quirk : 0,001/niveau plafonné à 0,01 chacun ; Souhait : 0,001/niveau plafonné à 0,01 chacun => max 1,25 | `1.2 + perks + quirks + 0.001 x (souhait107 + souhait108)` ; perks 157/158 et quirks 74/75 et souhaits 107/108 niveaux max 10 ; verrous Sadistic (`idle-difficulty-gates-v1.js`) | CONFORME. Remarque : le jeu calcule en float32 (1,2f) et applique le bonus du moment à chaque kill ; SOREAL applique le bonus actuel à toute la course (écart < 1e-5 en relatif, négligeable) |
| `highestBoss` / `highestHardBoss` / `highestSadisticBoss` / `currentHighestBoss` | trois records par difficulté + un record « toutes difficultés » (`currentHighestBoss`, jamais remis à 0, sert au bonus de première fois) | `difficultyPeaks.{normal,difficile,extreme}`, `records.highestBoss` | CONFORME |
| EXP de victoire (`rewardExp` id 1547 + `addExp` 2221/2222) | voir 1.5 | | voir 1.5 |
| Boss 301 vaincu (bossID == 301) en Sadistic | objet 487 (niveau 100) donné s'il manque | `idle-ngu-etat.js:1245` : `difficultyPeaks.extreme >= 300` | ÉCART (E6) |

### 1.5 EXP de victoire (rewardExp)

Formules du jeu (bossID = index du boss vaincu, avant l'incrément) :
- indice 0 : 2 EXP si `firstBossEver` ; 1 : 3 ; 2 : 4 ; 3 : 10 (et `firstBossEver` passe à faux, lancement du tutoriel Aventure) ; sinon rien pour ces indices.
- première victoire d'un boss tant que `currentHighestBoss < 20` (indices 4 à 19) : `addExp(3)` puis RETOUR : pas d'EXP de base en plus.
- indices 4 à 22 sinon : 1 EXP (0 pour les indices 4 et 5).
- indices >= 23 : `(max((id-13)/10, 1) + [1 si 24 Hour Normal fait au moins une fois]) x (1 + 0,02 x complétions) x ITOPOD totalBossExp`.
- `addExp` multiplie par NGU EXP, objet 119 (x1,1) ou (1 + équipement[24]), perk ITOPOD 94 (x1,05 à 987), Diggers, Hacks, Souhaits, Cuisine, puis `Math.Floor`.

| Point | SOREAL | Verdict |
|---|---|---|
| Bonus première fois ADDITIF ou REMPLAÇANT | additif : `xpReelle` (table) + `bonusPremiereFois` (2,3,4,10,3,...) dans `idle-runtime-combat.js` ~l. 768-815 et `idle-runtime-progression.js` ~l. 1297-1360 | ÉCART (E7) : indice 3 donne 11 au lieu de 10, indices 6 à 19 donnent 4 au lieu de 3 |
| Arrondi final | `Math.round(base x xpMultiplier x facteur)` | ÉCART (E7) : le jeu fait `Math.Floor` |
| Table de base et facteur fractionnaire pour >= 23 | alignés (2026-11-16) | CONFORME |

---

## 2. Entraînement avancé (AdvancedTrainingController 34 à 57, AllAdvancedTraining 58 à 74)

Constantes de scène (`level0`, champs publics `baseTime` et `levelFactor` de `AdvancedTrainingController`, floats ; offsets d'octets) :

| AT (id du jeu, ordre de `getDivisor`) | baseTime | levelFactor | Offset `level0` | SOREAL |
|---|---|---|---|---|
| id 0 Toughness (« Adventure Toughness + ») | 10 000 000 | 0,01 | 2 747 728 | `baseSeconds` 10000 x 1000 = 1e7 : CONFORME |
| id 1 Power (« Adventure Power + ») | 10 000 000 | 0,01 | 2 490 736 | CONFORME |
| id 2 Block (« Block Damage Reduction ») | 10 000 000 | 0,01 | 2 161 344 | CONFORME |
| id 3 Wandoos Energy (« Wandoos Energy Dump + ») | 20 000 000 | 0,01 | 2 754 160 | 20000 x 1000 : CONFORME |
| id 4 Wandoos Magic (« Wandoos Magic Dump + ») | 20 000 000 | 0,01 | 2 705 160 | CONFORME |

Remarque : `AllAdvancedTraining.size() = 5`. L'ordre d'écran du jeu (champs `defense, block, attack, wandoosEnergy, wandoosMagic`) correspond à `IDLE_AT_ORDRE_V1` = toughness, power, block, wandoosEnergy, wandoosMagic.

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Déblocage | `training[4]` (5e compétence de base) >= 25 000 en attaque ET en défense (`advancedTrainingUnlocked` 60) | `basicTrainingComplete` = toutes les compétences de base débloquées (ultime : prérequis 25 000 sur la 5e) | CONFORME |
| Diviseur d'un niveau (`getDivisor` 39) | `baseTime x (niveau + 1)` | coût `L + 1` unités de travail | CONFORME |
| Progression par tick (`progressPerTick` 36) | `(énergie/50) x sqrt(totalEnergyPower) x totalAdvancedTrainingSpeedBonus / diviseur` ; tick 0,02 s | `rate = alloc x sqrt(power) x gear / (baseSeconds x 1000)` par seconde, `aTick = rate/50`, durée d'un niveau = `ceil((L+1)/aTick)` ticks | CONFORME |
| Un niveau par tick au plus, la barre repart à 0 SANS report | oui | `atAvancerTempsV1` : oui (`niveauxEnTicksV1`) | CONFORME |
| Vitesse d'objets (`totalAdvancedTrainingSpeedBonus` 2214) | `1 x (1 + inventaire.bonuses[13] + inventaire.bonuses[32])` (additif) | `gearPctV1(gearSpecialsV1, "advancedTrainingPct")` | NON VÉRIFIÉ : correspondance des indices 13 et 32 avec `advancedTrainingPct` non contrôlée (si [32] vient d'un autre type de bonus, il manque) |
| Souhait 190 (« done with Advanced Training forever ») | `progressPerTick` = 1 : 50 niveaux/s, sans énergie ; ignore les cibles | +50 niveaux/s par compétence débloquée | CONFORME |
| Plafond de niveaux | aucun (sauf défi 100 niveaux via `canLevel`) | aucun, plafond du défi via `challengeHundredLevelsRemaining` | CONFORME |
| Bonus Power (`adventurePowerBonus` 71) | `0,1 x (niveau[1])^0,4` ; multiplie Attaque ET PV d'aventure (`totalAdvAttack`, `totalAdvHP`) ; 0 si niveau <= 0 | `1 + L^0,4 x 0,1` (`atPowerBonus`) | CONFORME |
| Bonus Toughness (72) | `0,1 x (niveau[0])^0,4` ; multiplie Défense ET Regen d'aventure | `atToughnessBonus` | CONFORME |
| Bonus Block (`blockBonus` 48 appliqué par `PlayerController::takeDamage` 674) | multiplicateur de dégâts reçus en blocage = 0,5 si niveau <= 0 sinon `0,5/(1 + 0,01 x L)` = 50/(100+L) | `blockReduction = (L+50)/(L+100)` ; le client applique `degats x (1 - blockReduction)` = 50/(L+100) | CONFORME |
| Wandoos Energy/Magic (`trainingBonus` 47 dans `totalWandoosEnergySpeed` 2211) | `1 + 0,01 x niveau` | `atEnergyDumpMultiplier = 1 + niveau x 0,01` (`idle-ngu-etat.js:415`) | CONFORME |
| Effet des niveaux avant le déblocage du menu | `AllAdvancedTraining::reset` (61) pose `level[i] = perkLevel[18]` (perk « Instant Advanced Training Levels ») : ces niveaux agissent sur les stats « avant même que le menu soit débloqué » (texte du jeu). Les niveaux en banque ne sont transférés qu'au déblocage (`Update` 58) | `atLevelV1` renvoie 0 tant que le menu est verrouillé ; le perk 18 est mis en `tempLevel` donc ignoré avant le déblocage | ÉCART (E8) |
| Banque d'AT au Rebirth | `bankedLevel[i] = (long)(totalBankedAdvTraining x level[i])`, nul en défi (`challengeReset` 62) ; plafond à 75 % | `floor(tempLevel x atBankPct)`, plafond 0,75, vidée en défi/difficulté | CONFORME |
| Cible de niveau (`levelTarget`) : 0 = aucune, -1 = ignorée (`reachedTarget` 73 vrai) ; à l'atteinte l'énergie est rendue, ou avec « avancer » passée à la compétence SUIVANTE | l'avance se fait CIRCULAIREMENT : après la dernière, retour à la première ; une compétence Wandoos est ignorée si Wandoos 98 est éteint | `atApplyTargetsV1` : `slice(index+1)` sans retour au début | ÉCART (E9, mineur) |
| Hors ligne (`advancedTrainingOfflineProgress` 2246) | divise le gain par `sqrt(potionModifier)` si potion d'énergie 1 active ; `scaledLevelGain` | même fonction temps réelle | NON VÉRIFIÉ (non lu) |

---

## 3. Rebirth

### 3.1 Conditions et gains

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Garde `Rebirth::rebirth` (2667) | `bossID > 0` quand la difficulté ne change pas ; refus pendant un nuke/combat ; refus en défi « No Rebirth » ; `rebirthTime.totalseconds < minRebirthTime` refusé ; un changement de difficulté n'exige AUCUN boss | `bosses >= REBIRTH_UNLOCK_BOSS_V1 (4)`, `REBIRTH_TROP_TOT`, `REBIRTH_INTERDITE_DEFI` | CONFORME en pratique (le bouton n'apparaît qu'à bossID 4) |
| `minRebirthTime` (2681) | `clamp(180 - 10 x niveau du souhait 20, 120, 180)` secondes | `180 - 10 x min(6, niveau)` | CONFORME |
| NUMBER (`calculateNextMultis` 2722) | `1 + bossMulti x oldBossMulti x oldTimeMulti x (1 + floor(totalAttackLevels/10000)) x macguffin[17] x timeMulti x Ygg.permNumberBonus x bloodMagic.rebirthPower x Beards.numberBonus x NGU.numberBonus x Hacks.totalNumberBonus` ; identique pour l'attaque et la défense | `1 + produit(...)` (`idle-ngu-ressources.js`) | CONFORME |
| `timeMulti` (`calculateTimeMulti` 2721) | par seuils en secondes : <60 : t/2^35/3600 ; <120 : t/2^25/3600 ; <180 : t/518144/3600 ; <240 : t/16192/3600 ; <300 : t/2048/3600 ; <420 : t/512/3600 ; <600 : t/128/3600 ; <720 : t/32/3600 ; <900 : t/8/3600 ; <1800 : t/4/3600 ; <3600 : t/2/3600 ; sinon 1 + t/172800 | `idleNguRebirthTimeFactor` : 12 paliers | CONFORME (vérifié palier par palier, y compris 31 088 640 x 60 = 518 144 x 3600) |
| `hardResetMultis` (2705) | attaque, défense, prochains, boss, temps, anciens = 1 (défi, changement de difficulté) | `forceNumber: 1` + `lastBosses/lastRunSeconds = 0` | CONFORME |
| AP du rebirth (`awardAP` 2678) | `(secondes de rebirth - 3600) / 500` en division entière, plancher 0, via `addAP` ; appelé par `engage(bool)` pour TOUS les rebirths, y compris le DÉMARRAGE d'un défi et le changement de difficulté | `floor((secondes - 3600)/500)` mais `if(!options.challengeId && runSeconds>=3600)` | ÉCART (E10) : démarrer un défi après plus d'une heure ne donne pas les AP |
| Bonus AP (`addAP` 2225) | arg x bonusAP des succès x (objet 129 maxé ? 1,2 : 1 + bonuses[25]) x (perk ITOPOD 94 >= 89 ? 1,02), `Floor` | `apWithBonusV1` | NON VÉRIFIÉ (hors périmètre) |
| Secret « speedrun » (`checkSecrets` 2679/2680) | tant que `gotSpeedrunSecret` est faux : bossID >= 37 ET temps <= 1800 s => compteur + 1, sinon compteur 0 ; à 3 : +200 EXP et +1 Puissance d'énergie | `speedrunStreak`, 200 EXP, +1 Puissance, condition `runSeconds <= 1800 && bosses >= 37` | CONFORME |
| `checkSpecial` (2675) | si les 4 indices d'Aventure (`clue1..4Complete`, obtenus via les secrets UUG / Grand Corrupted Tree / Jake / ITOPOD) sont faits ET temps de rebirth strictement entre 2585 et 2615 s ET `titan6Unlocked` faux => `titan6Unlocked = true` (« YOU HAVE RELEASED THE POWER OF THE BEAST »). Sans cela, le titan 6 (Bête) n'apparaît pas (`AdventureController::spawnEnemy` 151 et `manageFight` 142 testent `titan6Unlocked`) | aucun équivalent : la Bête se débloque par `d.boss = 132` (`idle-adventure-zones.js:600`, `idle-adventure-combat.js:362`) | ABSENT / ÉCART (E11) |
| Conditions pour passer en Evil (`setEvilNextRebirth` 2670) | succès 152 déjà obtenu (posé au premier démarrage d'un rebirth Evil) => aucune condition ; sinon `highestBoss >= 300` ET succès 151 (Bête v4) ET `attackBoost x ITOPOD.totalStatBonus >= 10 000` | `peaks.normal >= 301`, Rich Jerks x ITOPOD >= 1e6 %, `beastV4Beaten`, pas de contournement par le succès 152 | ÉCART (E6 pour 301/300 ; contournement 152 absent : faible) |
| Conditions pour passer en Sadistic (`setSadisticNextRebirth` 2671) | `highestHardBoss >= 300` ET `exilev4Defeated` | `peaks.difficile >= 301` ET `exileV4Beaten` | ÉCART (E6) |
| Changement de difficulté (`startNormal/Hard/SadisticRebirth` 2706-2708) | `engage(true)` (donc défi : `challengeReset` sur AT, barbes, TM) puis `hardResetMultis` ; l'Evil donne le succès 152 | `forceNumber: 1, clearBanks: true` | CONFORME |

### 3.2 Ce qui est remis à zéro (Rebirth::engage 2674, ordre exact)

Ordre du jeu : `checkSpecial`, `awardAP`, `convertBeardTrimmings`, `applyAllMacguffinBonuses`, `macGuffinBooster1InUse = false`, `checkSecrets`, `setNewMultis`, `resetEnergy`, `resetMagic`, `resetRes3`, `resetTraining`, `resetBoss`, `resetTime`, `Character::resetAll`, `resetGold`, `resetStats`, `Yggdrasil::reset`, `rebirthNumber++`, `instaTrain` (si achetée), puis si défi : `hardResetMultis` + `challengeReset` (AT, barbes, TM), sinon si barbes actives : `addBankedLevels`.

| Élément | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Énergie (`resetEnergy` 2711) | si cap <= 100 000 : cap = `floor(énergie gagnée au total/20 + 500)` plafonné à 100 000 ; énergie courante et énergie « idle » = 0. La PROGRESSION DE BARRE d'énergie n'est PAS remise à zéro | `applyNaturalEnergyCapGrowthOnRebirth` (même formule) ; `fillProgress = 0` pour toutes les ressources dont l'énergie | CONFORME (cap) ; écart mineur sur la barre d'énergie (E12) |
| Magie / Ressource 3 | courant, idle, progression de barre = 0 ; aucun gain de cap | idem | CONFORME |
| Entraînement de base (`resetTraining` 2715) | niveaux, énergie, barre, totaux = 0 ; cap_i -= r avec `r = trunc(1 + (n - 500 i)^1,2 / 500 x cap/1000)` borné `[1, cap/10 + 1]`, cap minimum 1 (NaN si n < 500 i => r = 1) | `nextBasicTrainingCapV411` | CONFORME |
| Boss (`resetBoss` 2716) | bossID = 0, stats du boss 1 rechargées, `bossMulti = 1`, `nukeTimer = 50 s` | `bosses` du run à 0 | CONFORME |
| Temps (`resetTime`), Or (`resetGold`) | `rebirthTime` = 0 ; Or et `realGold` = 0 ; fosse : Or jeté et nombre de jets = 0 | Or / sang à 0, `tossesThisRun = 0` | CONFORME |
| Attaque/défense de base (`resetStats` 2723) | 100 / 100 ; `rebirthLevels = 0` | n/a | CONFORME |
| `Character::resetAll` (2123) | reset de : trolls (si défi Troll), entraînement offensif/défensif, inventaire (`InventoryController::reset` est vide), Wandoos 98, Aventure (`resetAdventure` : zone = -1, multiplicateurs et cooldowns de capacités remis aux valeurs de départ, `bossNSpawn` remis à zéro, `bossNDefeated = false`, `titanNKills = 0`), Augmentations, Machine temporelle (niveaux = banque), Blood Magic (points de sang, rebirthPower = 1, sorts d'or/butin à 0), AT, Yggdrasil, NGU, Arbitrary (potions « 2 » et booster MacGuffin éteints), Barbes, Diggers (désactivés), Hacks (allocation Ressource 3 à 0), Wishes (`Wish::reset`) | `applyRebirthResetV56_` : `resetRunSystem`, Augmentations (cibles gardées), TM (niveaux = banque), Blood Magic (garde `ironPill`), Wandoos (garde OS), AT (menu reverrouillé, banque + perk 18), Yggdrasil, Diggers désactivés, Titans (`rebirthKills = 0`, nouveau délai) | CONFORME dans l'ensemble. NON VÉRIFIÉ : détail de chaque `reset` (NGU, Hacks, Wishes, Blood Magic `ironPill`, `resetAdventure`) ; la conservation de `ironPill` n'a pas été confrontée à `AllBloodMagicController::reset` (1427) |
| Conversion des barbes, MacGuffins | `convertBeardTrimmings`, `applyAllMacguffinBonuses` | `convertActiveBeardOnRebirth`, `macguffinApplyRebirthV1` | NON VÉRIFIÉ (audits Barbes/MacGuffins séparés) |
| Banque de niveaux | plafonds 75 % (TM, barbes, AT) ; vidée en défi/changement de difficulté ; barbes : `addBankedLevels` seulement hors défi | `Math.min(0.75, ...)`, `clearBanks` | CONFORME |
| Insta Training (`instaTrain` 2676) | si cap d'énergie >= 12 : +12 énergie, attackEnergy[0] = defenseEnergy[0] = 6 | aligné (commit `def12aee`) | CONFORME |

---

## 4. Écarts priorisés, avec correctif exact

Priorité 1 (change la progression ou les récompenses de façon mesurable)

**E7. EXP du bonus « première fois » additif au lieu de remplaçant, et arrondi `round` au lieu de `floor`.**
Jeu : première victoire d'un boss d'indice 3 (si `firstBossEver`) : exactement 10 ; indices 4 à 19 tant que `currentHighestBoss < 20` : exactement `addExp(3)` et rien d'autre ; indices 0 à 2 : 2/3/4 (si `firstBossEver`). Résultat de `addExp` = `Math.Floor(arg x multiplicateurs)`.
Correctif : dans `idle-runtime-combat.js` (~l. 768-815, boucle NUKE) ET `idle-runtime-progression.js` (~l. 1297-1360, combat), quand `estPremiereFoisJamais` ET `xpBonusPremiereFoisSorealIdle_(index) > 0`, ne pas verser `xpReelle` (le bonus REMPLACE l'EXP de base : sinon indice 3 = 11, indices 6 à 19 = 4) ; remplacer `Math.round` par `Math.floor` dans les deux calculs (`xpReelle`, `bonusPremiereFois`, `xpReelleNuke`, `bonusPremiereFoisNuke`). Mettre à jour `idle-parties-reference-v1` seulement si la règle change l'avancée des parties de référence (à régénérer volontairement).

**E2. Le NUKE n'a pas la restriction « boss déjà vaincu en Normal, sauf à partir de l'index 124 ».**
Jeu (`nukeBosses`) : stop si `bossID > 300` ou (`bossID >= highestBoss` ET `bossID < 124`) ; `highestBoss` = record en difficulté Normal uniquement (mis à jour seulement quand `rebirthDifficulty == 0`).
Correctif : dans la boucle de `nukerBossSorealIdle` (`idle-runtime-combat.js`, avant le test 5x, ~l. 736) ajouter `if (bossVaincus >= Math.max(0, difficultyPeaks.normal) && bossVaincus < 124) break;` en lisant `stats.metaNgu.difficultyPeaks.normal` (état déjà tenu à jour par `syncIdleNguState`). Même règle pour la partie « auto-nuke » client si elle recalcule le nombre de boss franchis. À faire valider par Norman : cela rallonge la progression des premiers rebirths.

**E3. Pas de fin des boss à 301.**
Jeu : `fight`, `nukeBosses`, `beginFight` s'arrêtent pour bossID > 300 ; `advanceBoss` pose attaque 69, défense 69, regen/PV 420 et le texte de fin. SOREAL prolonge le catalogue à l'infini (`definitionBossSorealIdle_`, branche `supplement`), donc NUMBER (`base^bosses`) et l'EXP peuvent dépasser le maximum du jeu.
Correctif : plafonner `bossVaincus` à 301 dans la boucle NUKE (`if (bossVaincus > 300) break;`), dans le combat manuel (refuser de commencer si `bossIndex > 300`) et dans `definitionBossSorealIdle_` (renvoyer les stats 69/69/420 pour n >= 301). À vérifier d'abord par un essai : l'absence de garde n'a été constatée que par lecture (grep sur 301/300 sans résultat dans `idle-runtime-*.js`).

**E5. « Mur de Renaissance » au boss 20 inexistant dans le jeu.**
`bossBloqueRenaissance` (`idle-runtime-progression.js:727`, `idle-runtime-combat.js:710`) empêche de vaincre l'index 19 avant le premier Rebirth. Aucune comparaison de ce type dans `BossController` ni `ButtonShower` (seuils 1, 4, 17, 30, 37 seulement). À conserver SEULEMENT si Norman le décide (c'est une mécanique SOREAL, règle n°1 : à enregistrer dans `constantes-soreal-v1.json` comme « divergence voulue » sinon la retirer).

**E6. Seuils Evil/Sadistic et objet 487 décalés d'un boss.**
Jeu : Evil exige `highestBoss >= 300` (affiché « reached Boss 301 »), Sadistic exige `highestHardBoss >= 300` ; l'objet 487 est donné quand `bossID > 300` en difficulté >= Sadistic, donc après le 301e boss.
Correctif : `idle-ngu-actions.js:949` `>= 301` => `>= 300` ; `idle-ngu-actions.js:953` `>= 301` => `>= 300` ; `idle-ngu-etat.js:1245` `difficultyPeaks.extreme >= 300` => `>= 301`. Ajouter (facultatif) le contournement du succès 152 pour Evil (une fois un rebirth Evil démarré, plus aucune condition).

**E10. AP du rebirth non versés au démarrage d'un défi.**
Jeu : `awardAP` est dans `engage(bool)` sans condition. Correctif : `idle-ngu-actions.js` (~l. 610) retirer `!options.challengeId&&` de `if(!options.challengeId&&runSeconds>=3600)`. Le plancher `runSeconds>=3600` est équivalent au `max(0, ...)` du jeu.

Priorité 2 (exactitude de formule, impact faible)

**E4. Regen des boss : 50 x par seconde dans le jeu.**
`fight` (appelé 50 fois par seconde) ajoute `bossRegen` à chaque appel sans facteur 0,02. Correctif : `regenBossSecondeSorealIdle_` (`idle-runtime-boss.js:756`) retourne `regenReference x ratioPv x 50`. Impact : la régénération représente 7,7e-4 PV max par seconde (boss 5 et suivants) au lieu de 1,5e-5 ; ne compte que pour un joueur dont la puissance nette est à peine supérieure. À CONFIRMER par une mesure dans le vrai jeu avant de corriger (déduit de la lecture IL, pas encore mesuré).

**E8. Niveaux d'AT du perk 18 actifs avant le déblocage du menu.**
Jeu : `level[i] = perkLevel[18]` dès le rebirth, effet immédiat sur Power/Toughness/Block/Wandoos ; seules les banques attendent le déblocage. Correctif : `atLevelV1` (`idle-ngu-bonus.js:465`) doit renvoyer, tant que le menu est verrouillé, le niveau du perk 18 (`perkBankBonuses.advancedTrainingStartBonus`) au lieu de 0 ; au déblocage, ajouter la banque.

**E9. Avancement d'énergie de l'AT non circulaire.**
Jeu : après la dernière compétence, l'énergie passe à la PREMIÈRE non atteinte (parcours modulo 5, avec ignorance des Wandoos si Wandoos 98 est éteint). Correctif : dans `atApplyTargetsV1` (`idle-ngu-pistes.js` ~l. 531), remplacer `IDLE_AT_ORDRE_V1.slice(index + 1)` par la liste tournante `[...ordre.slice(index+1), ...ordre.slice(0, index)]`.

**E12. Barre d'énergie conservée au Rebirth.**
`Rebirth::resetEnergy` ne touche pas la progression de la barre d'énergie (contrairement à la magie et à la ressource 3). Correctif : dans `applyRebirthResetV56_` ne pas remettre `fillProgress` à 0 pour `energy`. Impact : moins d'un tick.

Priorité 3 (contenu absent)

**E11. Secret de la Bête (`checkSpecial`). CORRIGÉ le 2026-11-16 : voir `bete-secret.md` (chaîne complète, migration 53 -> 54).** Rebirth avec les 4 indices faits (UUG, Grand Corrupted Tree, Jake, ITOPOD) et un temps de rebirth strictement compris entre 2585 et 2615 s débloque le titan 6. SOREAL le débloque directement au boss 132. Attention règle n°2 (aucun spoil) : un secret ne doit rien révéler avant sa découverte. À décider avec Norman ; si implémenté, ajouter `unlockFlags.beastSecret` et tester `runSeconds` dans `applyRebirthResetV56_` AVANT la remise à zéro.

---

## 5. Non vérifié (à lire ou mesurer ensuite)

1. Capacités de boss dans la feuille `IDLE_BOSS` (fureur, paralysie, bouclier, sceau) : à lister ; si présentes pour des boss principaux, elles n'existent pas dans le jeu.
2. Correspondance de `InventoryController.bonuses[13]` et `[32]` avec `advancedTrainingPct` (vitesse AT d'équipement).
3. Hors ligne de l'AT (`advancedTrainingOfflineProgress` 2246, `scaledLevelGain`) et effet de la potion d'énergie 1 (division par sqrt du modificateur).
4. Valeur de scène exacte de `hardModifier` / `sadisticModifier` (deux doubles 1e30 adjacents à l'offset 2 227 348 de `level0` ; non rattachés au composant par un parseur Unity complet). Les valeurs 1e25 / 1e50 du constructeur ne sont PAS celles utilisées.
5. Détail de chaque `reset` appelé par `Character::resetAll` (NGU 4057/4073, Hacks 3185, Wishes 4836/4903, Blood Magic 1427/1453, Yggdrasil 5008/5181, Beards 1144, Diggers 3085) ; conservation d'`ironPill` en particulier.
6. `convertBeardTrimmings`, `applyAllMacguffinBonuses`, `addAP` (multiplicateurs d'AP), `Training::get_totalAttackLevels` (compte exactement les niveaux d'attaque de la course, 0 après `resetTraining`).
7. Valeur du compteur `firstBossEver` (nouveau compte seulement) : SOREAL le remplace par « `records.highestBoss` <= indice ».
8. Le jeu applique `sadisticBossMultiplier` en float32 à chaque victoire ; SOREAL applique la base au total (écart relatif < 1e-5).
