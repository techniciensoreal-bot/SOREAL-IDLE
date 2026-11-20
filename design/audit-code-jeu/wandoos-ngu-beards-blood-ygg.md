# Audit code du jeu (build 1260) : Wandoos, NGU, Barbes, Blood Magic, Yggdrasil

Date : 2026-11-20. Lecture seule. IL de `Assembly-CSharp.dll` (outils m/d du scratchpad) comparé au code SOREAL actuel (`idle-ngu-etat.js`, `idle-ngu-bonus.js`, `idle-ngu-systemes.js`, `idle-ngu-snapshot.js`, `idle-wandoos-os-v1.js`). Les points déjà CONFORMES dans `ngu-hacks-barbes-mineurs-tables.md`, `economie.md`, `macguffins-sang-coeurs.md`, `hors-ligne.md` et `defis.md` ne sont pas refaits ; leurs écarts listés ont été REVÉRIFIÉS dans le code SOREAL actuel : tous corrigés (NUMBER x timeMulti, `timeFactor` des barbes, Spaghetti / Counterfeit Gold avec `floor`, Iron Pill, fruit d'or sans arrondi, Brown Heart / `usePoop`, Fruit of Quirks, souhait 60, conditions de déblocage des fruits Rage / MacGuffin α / Quirks).

## 1. Écarts vérifiés (par impact)

### E1. Défi No NGU : la condition de déblocage cumule Énergie ET Magie (impact moyen, une ligne)
- Jeu : `AllNGUController::nguChallengeUnlocked` (3978). La variable somme (loc.0) est incrémentée dans la boucle des NGU d'Énergie (`skills`, `NGU.level` = niveau Normal) PUIS, SANS être remise à zéro (IL_004c ne remet que l'indice de boucle), dans celle des NGU de Magie (`magicSkills`) ; chaque pas teste `>= 10000`. Condition réelle : niveaux Normal Énergie + niveaux Normal Magie >= 10 000.
- SOREAL : `idle-ngu-snapshot.js:1339` : `n.energy>=10000||n.magic>=10000` (l'une OU l'autre séparément) ; le commentaire de `idle-ngu-bonus.js:245` affirme « séparément » (lecture du 2026-11-17 erronée).
- Correctif : `return n.energy + n.magic >= 10000;` et corriger le commentaire de `idle-ngu-bonus.js:245` (« No NGU : somme Énergie + Magie >= 10000 »). Test à adapter : celui qui fixe le seuil No NGU.

### E2. Changement de piste de niveau NGU : le jeu ne rend pas l'énergie / la magie allouée (impact moyen, choix de conception à trancher)
- Jeu : `AllNGUController::toNormalLevelTrack / toEvilLevelTrack / toSadisticLevelTrack` (3974-3976) ne font QUE `PlayerSettings.nguLevelTrack = n` puis `refreshMenu` (la piste Evil exige `rebirthDifficulty != Normal`, la Sadistic exige difficulté Sadistic). `NGU.energy` / `NGU.magic` (allocation) est UNIQUE par NGU : au changement de piste, la même allocation alimente la nouvelle piste (`progressPerTick` lit `NGU.energy` et choisit niveau / progression selon `nguLevelTrack`). Les cibles (`target`, `evilTarget`, `sadisticTarget`) sont bien par piste.
- SOREAL : `setNguTierV1` (`idle-ngu-bonus.js:469-488`) remet à 0 l'allocation du palier quitté et la rend au stock ; l'allocation est stockée par palier (`s.data.ngus[tier][id].allocation`, `setNguAllocationV1` refuse un palier inactif).
- Effet joueur : après un changement de piste, toutes les allocations NGU sont à refaire ; dans le jeu elles restent en place.
- Correctif précis : faire porter l'allocation par le NGU et non par le palier (une seule `allocation` par id, lue par le palier actif), ou, à défaut, à `setNguTierV1` recopier l'allocation du palier quitté vers le palier d'arrivée au lieu de la rendre (`ngus[nouveau][id].allocation = ancien.allocation ; ancien.allocation = 0`), sans toucher `state.resources`.

### E3. Troll « Wandoos plante » (`wipeWandoos`) : le jeu ne remet pas les barres à zéro (impact faible)
- Jeu : `TrollChallengeController::wipeWandoos` (2089) : `energyLevel = 0`, `magicLevel = 0` seulement.
- SOREAL : `idle-ngu-systemes.js:1483` remet aussi `dumpEnergyProgress` et `dumpMagicProgress` à 0 (perte d'une fraction de niveau).
- Correctif : ne laisser que `w.dumpEnergyLevel = 0; w.dumpMagicLevel = 0;` (les barres gardent leur progression).

### E4. Défi 100 Levels : la condition lit le niveau de la piste COURANTE (impact négligeable)
- Jeu : `AllNGUController::unlocked100LevelChallenge` (4060) somme `NGUController::getLevel` (4092), qui renvoie le niveau de la piste active (Normal, Evil ou Sadistic selon `nguLevelTrack`), sur les NGU d'Énergie seulement, seuil 10.
- SOREAL : `idle-ngu-snapshot.js:1329` lit toujours la piste Normal. Écart sans conséquence pratique (10 niveaux sont atteints dès la première heure) ; à noter seulement.

## 2. Points relus et CONFORMES (faits chiffrés)

### Wandoos98 / Wandoos98Controller
- Installation : 86 400 s de jeu EN LIGNE (`advanceTime(0,02)` par tick, 4779), aucun effet avant ; `Wandoos98::reset` ne l'efface pas : `installSeconds` SOREAL idem.
- Temps de boot (`wandoosBootupTime`, 4777) : 3600 s ; 3240 s avec le set XL (x0,9) ; x `clamp(1 - 0,1 x complétions Evil du 100 Levels, 0,5, 1)` : `wandoosBootFractionV1` identique (plancher 27 min).
- `bootupSpeedFactor` (4810) : progression 0 à 1, x1,1 une fois à 1 avec le set Wandoos : `wandoosSetMultiplier` x `afterBootShare`.
- `OSFactor` (4811) : `(min(OSlevel + pit + XL + ITOPOD, 400) + 1) / 25` : `wandoosOsLevelSpeedMultiplierV1` identique.
- Exigences par OS (`baseEnergyTime` 4771 / `baseMagicTime` 4773, mêmes valeurs Énergie et Magie) : Normal 1e9, 1e12, 1e15 ; Evil et Sadistic 1e21, 1e27, 1e33 ; en Sadistic la vitesse est divisée en plus par `sadisticModifier` (4774) = 1e12 (`Character::totalWandoosEnergySpeed` 2211, `rebirthDifficulty >= 2`) soit 1e33, 1e39, 1e45 effectifs : table `IDLE_WANDOOS_OS_V1.requirement` identique.
- Vitesse (2211 / 2212, Énergie et Magie ne diffèrent que par Advanced Training, macguffin 15 / 16 et quirk) : OSFactor x boot x (1 + équipement[12] + [31]) x (1 + Advanced Training) x défis x barbes (/ sadisticModifier) x NGU x mineurs x macguffin x quirk 15 / 16 (actif seulement en Evil+, `energyWandoos1Bonus` 1362 ; SOREAL : `IDLE_QUIRK_DIFFICULTE_V1` les range à 1) x Cartes : `baseRaw` identique. 100 Levels Normal : `1 + 0,2 x complétions` (1876) idem.
- Progression par tick (4781, 4787) : `alloc x vitesse / baseTime`, `>= 1` : barre à 0 sans report, +1 niveau si `canLevel` : `vitesseEffective` (`ceil(1/p)` ticks) idem.
- Bonus de statistiques (`wandoosBonus`, 4783) : 98 : `((1 + E/100)(1 + M/25))^0,8` ; MEH : `(1 + E/5)(1 + 2M)` ; XL : `((1 + 6E)(1 + 40M))^1,05` ; plancher 1 ; 1 si `disabled` : `IDLE_WANDOOS_OS_V1.statBonus` idem (Attaque et Défense : 2133 / 2134).
- `changeOS` (4764) : niveaux et barres remis à 0 : `selectWandoosOs` idem ; `Wandoos98::reset` (4763) ne touche pas l'OS : idem.
- Troll `disableWandoos` (2090) : bonus à 1 jusqu'au Rebirth : `trollFlagsV1(state).wandoos` idem.

### NGU
- `NGUController::progressPerTick` (4083) et Magic (4109) : `puissance / diviseur(id) x allocation / (niveau + 1)` selon la piste, x vitesse NGU (équipement[22] + [39] additifs, sets Number x1,1 / Meta x1,2 / School x1,15, ITOPOD, défis, barbe), x ITOPOD, x macguffin 4 / 5, x NGU Énergie / Magie, x mineur, x hack, x quirk, x souhaits, x Cartes, x3 (Troll Sadistic >= 1 pour l'Énergie ; Troll Normal >= 1 pour la Magie), / `sadisticDivider` (1e7, Énergie et Magie) en piste Sadistic : `nguSpeedMultiplierV1` couvre tous ces facteurs.
- Bonus d'un NGU : produit des trois pistes ; Evil actif seulement si `rebirthDifficulty >= 1` (3994) : `nguActiveTiersV1` idem. Plafond de niveau 1 000 000 000 sur les trois pistes (3973).
- Quirks 14 / 89 (4078) : récursion équivalente à `grantNguLevelsV1`. Cible `-1` = atteinte (4063) : `nguCibleIgnoreeV1` idem ; cibles par piste : idem.
- `NGU::reset` / `NGUController::reset` (4073 / 4100) : seules les allocations sont remises à 0 ; niveaux permanents : idem.

### Barbes, Blood Magic, Yggdrasil
- Tables et formules : voir les audits cités en tête ; points complémentaires relus : gain de sang `baseBoost x mineur x hack x quirk x macguffin 18` (1434), vitesse `magie x puissance / 50000 / diviseur x (1,25 si Nether)` (1462, 1464), `loseBlood` (1435, 2073 : sang 0 et `rebirthPower` 1) : conformes dans `advanceBloodMagic` (`idle-ngu-systemes.js:75-144`) et `applyTrollEffectV1`.

## 3. Non vérifié
- `effectPerLevel` de la quirk 15 / 16 (scène : 0,02 attendu) ; `capValue` / plafonds d'allocation affichés (`capAmountEnergy` 4788 : `baseTime / vitesse + 1`, seul le plancher de boot de 0,01 est une convention SOREAL pour l'affichage).
- Ordre exact du report d'« Advance Energy » après le dernier NGU (`autoAdvanceEnergy` 4061 : l'indice revient à 0 en fin de liste) : non comparé au code SOREAL.
- Hors ligne des NGU, des barbes et du Blood Magic : non relu ici (voir `hors-ligne.md`).
