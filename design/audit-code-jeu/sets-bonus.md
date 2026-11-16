# Audit code du jeu (build 1260) : sets d'equipement, bonus de completion, specials d'objets

Date : 2026-11-16. Source : `Assembly-CSharp.dll` lu en IL (outils `lecteur-il.mjs`), table des 515 objets `items-jeu.json` (ItemNameDesc::constructItemInfo, id 3809). Aucun fichier du moteur modifie.
Methodes IL lues : `AllItemListController::checkforBonuses` (3406, recompenses uniques), `ItemList::maxxed*` (3415-3485, composition des sets), les consommateurs de chaque drapeau `ItemList.<x>Complete` (grep IL de tout l'assembly), `InventoryController::equipAttackBonus/equipDefenseBonus/equipSpecBonus/specBonus/effectName/effectBonus/getBonusFactor` (3604-3607, 3675-3677), `Equipment::boostEquip` (3363), `accessorySpaces/macguffinSpaces/daycareSpaces/curSpaces/loadoutSpaces` (3575-3578, 3584), `AllItemListController::boostBonus` (3403), `ItemList::totalBonus` (3414).

## Resume

- **15 ecarts d'objets** (specials) et **1 ecart structurel majeur** (mise a l'echelle des objets par le boss atteint, absente du moteur), 1 comportement de set non implemente (drops Exile), plusieurs commentaires perimes.
- **Compositions de sets : conformes** (46 sets d'equipement + 23 sets d'objets uniques : memes identifiants de jeu pour chaque piece). Les 3 « sets » du jeu absents de `completedSets` (Tutorial Cube, Red Liquid, Purple Liquid) sont geres par `unlockFlags` : effet conforme.
- **Bonus de completion : tous les effets chiffres du jeu sont presents et corrects dans le moteur** (valeurs et mode de combinaison, multiplicatif vs additif), sauf Exile (drops) et la restriction `res3On` du set Evidence.
- `ItemList::totalBonus` (1+0,5 %/objet decouvert)x(1+1 %/objet maxxe) n'est applique a AUCUN stat dans le jeu (affichage / score Kongregate seulement) : SOREAL ne l'applique pas (`void bonusCollections`, `idle-runtime-boss.js:1409`) : CONFORME.

## 1. Ecart structurel majeur : les stats d'equipement dependent du boss atteint (`bossRequired`)

| Champ | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Power / Toughness / HP / Regen / chaque Special d'un objet equipe | `equipAttackBonus` (3604), `equipDefenseBonus` (3605), `equipSpecBonus` (3606) : `floor( cur x min(1, effectiveBossID / bossRequired) )` pour CHAQUE valeur (Attack, Defense, spec1, spec2, spec3). HP = somme des attaques x 3 (3596), regen = somme des defenses x 0,03 (3597). `effectiveBossID` (2237) = `Character.bossID` (+301 si rebirthDifficulty >= 1, +301 de plus si >= 2). `bossID` est remis a 0 a chaque Rebirth (`Rebirth::resetBoss` 2716) et +1 par boss tue (`BossController::advanceBoss` 1546). | AUCUNE mise a l'echelle : `idleAdventureEquipmentStatsV47` (`idle-adventure-v47.js:205-262`) additionne `x.power`, `x.toughness`, `x.special` a 100 %. `bossRequired` n'existe pas dans le catalogue (seul `requiresBoss` de la Ring of Apathy / filtre de drop existe). | **ECART MAJEUR** |

`bossRequired` du jeu (158 objets equipables, type <= 5), par valeur :
- 20 : 68,69,70,71,72,73,74,435 (HSB, Magicite Crystal)
- 33 : 78-90 (GRB, Clockwork)
- 58 : 76,95-101 (Ascended Forest Pendant, 2D)
- 67 : 94 (Ascended Ascended Forest Pendant)
- 82 : 103-118,122-128,130-134,439,440,441 (Spoopy, Jake, Gaudy, Mega, Gaudy Epaulettes, F Tank, Beard Comb, Beanie, Looty, Stapler, Dragon Wings...)
- 100 : 136-140,142-161,164-170,173-178,184-195,213-227,229-249,295,296,442,444-452 (UUG, Beardverse, Wanderer, S'rerednaW, Badly Drawn, Stealth, Slimy, accessoires T6, Edgy, Chocolate, Pretty Pink, Greasy Nerd, accessoires Evil Bonus...)
- tous les autres objets (Training, Sewers, Forest, Cave, sets apres Choco/Nerd...) : 0 (aucune echelle).
(Liste exacte et complete : champ `bossRequired` de `items-jeu.json`, 158 entrees ; ids 182, 183, 191 sont des consommables, ignores.)

Consequence : dans le jeu, apres un Rebirth (bossID = 0) un objet de `bossRequired` 100 donne 0 ; a 50 boss tues il donne 50 % ; a 100 il donne 100 %. Sur le mode Evil/Sadistic le facteur est toujours 1. SOREAL donne 100 % tout de suite : les stats (et specials) d'objets de paliers 20-100 sont surestimees en debut de Rebirth.

## 2. Bonus de completion des sets (jeu `checkforBonuses` 3406 + consommateurs) vs SOREAL

Recompenses UNIQUES (versees une fois a la completion) : EXP passe par `Character::addExp` (x tous les bonus d'EXP) et AP par `addAP` ; SOREAL fait de meme (`crediterRecompensesAventure`, `idle-ngu-snapshot.js:1470/1478`).

| Set (id jeu `maxxedX`) | Jeu | SOREAL (`idle-adventure-sets.js`) | Verdict |
|---|---|---|---|
| Training (62-65, 75) | +2 Energy Speed (stat de base), 10 EXP | `{experience:10, energySpeed:2}` | CONFORME |
| Sewers (40-46) | +5 Atk, +5 Def, +15 maxHP, +0,2 regen, 20 EXP | `adventurePower/Toughness 5, Hp 15, Regen .2, exp 20` | CONFORME |
| Forest (47-53) | 2 Energy Potion a, 2 b, 2 Energy Bar Bar, +5 Energy Power, 200 EXP | idem (`energyPotionA/B 2, energyBarBar 2, energyPower 5, exp 200`) | CONFORME |
| Cave (54-61) | +2 Magic Power, +40000 Magic Cap, +2 Magic Per Bar, 300 EXP | `magicPower 2, magicCap 40000, magicBars 2, exp 300` | CONFORME |
| HSB (68-74) | 3 Magic Power, 30000 Magic Cap, 3 Magic/Bar, 1 Magic Bar Bar, 1 Magic Potion a et b, 500 EXP | idem | CONFORME |
| GRB (78-84) | 2000 EXP ; Safe Zone regen x2 en plus du x5 (`manageFight` 142) ; debloque le No Equipment Challenge | `exp 2000, safeZoneRegen10x, noEquipmentChallenge` ; x10 applique cote client (`ui-aventure-1-v1.js:2044`) | CONFORME |
| Clock (85-91) | 1000 EXP ; temps de respawn x0,95 (`respawnTime` 140) | `exp 1000, respawn .05` ; `clockSet = 1-respawn` (`idle-ngu-bonus.js:1129`) | CONFORME |
| 2D (95-101) | 2000 EXP ; loot factor x1,0743 (`lootFactor` 2153), facteur SEPARE | `exp 2000, drop .0743` ; produit (`idleAdventureSetRewardProductV1`) | CONFORME |
| Spoopy (103-109) | 3000 EXP ; Idle Attack prend le multiplicateur de l'attaque reguliere (`idleAttackPower` 2170) | `exp 3000, idleAttack:true` ; 1,5 / 1,2 (`idle-adventure-v47.js:264`) | CONFORME (valeurs 1,5 et 1,2 non verifiables en IL : champs serialises Unity `regAttackMulti/idleAttackMulti`) |
| Jake (111-117) | 7000 EXP ; debloque Wandoos MEH | `exp 7000, wandoosMeh` | CONFORME |
| Scrap of Paper (197) | +1 slot de Digger (`maxDiggerSlots` 3104) | `diggerSlot:1` | CONFORME |
| Gaudy (122-126) | 5000 EXP, 2 Lucky Charms ; +10 % de chance de +1 niveau (additif avec perk 25 et Fibonacci 144 : 3810) | `exp 5000, luckyCharms 2, extraDropLevelChance .10` ; somme plafonnee a 1 (`idle-adventure-butin.js:664`) | CONFORME |
| Mega (130-134) | 6000 EXP ; Charge x2,2 (2 x 1,1 : `chargePower` 2193, `charge` 688) | `exp 6000, chargeMultiplier 2.2` | CONFORME |
| Beardverse (143-147) | 8000 EXP ; penalite de plusieurs barbes meme ressource : diviseur x0,9 si >= 1,9, plancher 1 (`beardCountDivider` 1138) | `exp 8000` + `penaltyFactor 0.9` (`idle-ngu-pistes.js:569`) | CONFORME |
| UUG rings (136-140) | 20000 EXP + 20000 AP ; 6e anneau (UUG's Special Ring) 0,1 % x loot (`zone14Drop` 502) | `exp 20000, ap 20000` ; `chance(.001)` (`idle-adventure-combat.js:690`) | CONFORME |
| Wandoos 98 (66) | 300 EXP ; vitesse de boot x1,1 (`bootupSpeedFactor` 4810) | `exp 300, wandoosBootedSpeedPct .10` | CONFORME |
| Tutorial Cube (77) | 10000 AP, devient l'Infinity Cube | `unlockFlags.tutorialCubeMaxed`, `setRewards.ap +10000` (`idle-adventure-objets.js:695`) | CONFORME (hors `completedSets`) |
| Number (102) | NGU Speed x1,1 (`totalNGUSpeedBonus` 2215) | `nguSpeedPct .10` | CONFORME |
| Triple Flubber (121) | 30000 AP | `flubber ap 30000` | CONFORME |
| Giant Seed (92) | 10 Poop | `poop 10` | CONFORME |
| UUG Armpit Hair (141) | Beard Speed x1,1 (1133-1135) | `beardSpeedPct .10` | CONFORME |
| Red Liquid (93) | delai global des mouvements x0,8 (`usedMove` 701, aussi quetes et hors-ligne) | `unlockFlags.redLiquidMaxed` : 800 ms (`ui-aventure-1-v1.js:1563`, `idle-ngu-systemes.js:904`) | CONFORME (hors `completedSets`) |
| Purple Liquid (191) | Beast Mode x1,5 au lieu de x1,4 (`beastModeBonus` 201) | `purpleLiquidMaxed ? 1.5 : 1.4` (`ui-aventure-1-v1.js:1535`) | CONFORME |
| Wanderer (150-153) / S'rerednaW (155-158) | 50000 EXP + 10000 AP chacun ; accessoire ultra rare (Walderp, `zone16Drop` 504 : 0,01 % x loot) | `exp 50000, ap 10000` ; Fanny Pack / Dorky Glasses 0,0001 (`combat.js:702-703`) | CONFORME |
| Badly Drawn (164-168) | 30000 EXP + 5000 AP ; boosts x1,2 (multiplicatif, `boostBonus` 3403) | `exp 30000, ap 5000, boostEffectiveness .2` ; `(1+c)*1.2*1.2` (`inventaire.js:362`) | CONFORME |
| Stealth (173-177) | 50000 EXP + 10000 AP ; coffre rare Boring-Ass Earth (min(1e-6 x loot ; 0,005), `zone18Drop` 506) | `exp 50000, ap 10000` ; `stealthiestArmour chance 1e-6 cap .005` (`butin.js:376`) | CONFORME |
| Slimy (184-188) | 100000 EXP + 10000 AP ; Parry x3 (`takeDamage` 674) | `exp 100000, ap 10000` ; Parry x3 cote client (`ui-aventure-1-v1.js:1753`) | CONFORME |
| Choco (221-225) | 2 accessoires rares (0,018 % x loot, plafond 12 %, `zone20Drop` 508), macguffin Stat, kills/macguffin x0,9 (`macGuffinThreshold` 485) | via `completedSets.choco` (`butin.js:390`, `idle-macguffins-v1.js:312`) | CONFORME |
| Edgy (213,214,215,217,218) | 250000 EXP, +1 slot MacGuffin (`macguffinSpaces` 3577) | `exp 250000` ; slot via `completedSets.edgy` (`macguffins-v1.js:360`) | CONFORME |
| Edgy Boots (216,219) | drop special Evilverse (1,8e-5 x loot, plafond 12 %, `zone21Drop` 509) | `bothedgy:boots` requiresCompletedSet `edgyboots` (`butin.js:422`) | CONFORME |
| BOTH Edgy Boots (220) | n'est PAS un set du jeu (aucun `maxxed`) | set `bothedgy` (reward `{}`) | NEUTRE (sans effet) |
| Pretty Pink Princess (231-236) | PP x1,1 (multiplicatif, `totalPPBonus` 330) | `itopodPpPct .10` ; produit | CONFORME |
| Greasy Nerd (237-241) | chaque MacGuffin tombe 1 niveau plus haut (552) | `completedSets.greasynerd` (`macguffins-v1.js:344`) | CONFORME |
| Meta (251-257) | NGU x1,2 | `nguSpeedPct .20` | CONFORME |
| Party (258-264) | Total Digger Level Bonus +0,05 (additif, 3131) | `diggerGlobalBonusPct 5` ; additif (`idle-ngu-systemes.js:624`) ; formule du total (1+0,0005xN, 1,25+0,0005x(N-500)^0,7) identique | CONFORME |
| Mobster (265-271) | QP x1,15 (`questRewardFactor` 1250) | `IDLE_QUEST_MOBSTER_SET_QP_PCT_V1 0.15` | CONFORME |
| Typo (301-307) / Severed Head (343) | Wish Speed x1,2 / x1,1337 (multiplicatifs, 4907) | `wishSpeedPct .20 / .1337` ; `setFacteurNguV1` (produit) | CONFORME |
| Fad (308-314) | Major Quest x0,9 de duree, 3 Beast Butter (`timerThreshold` 1224) | `IDLE_QUEST_FAD_SET_FASTER_PCT_V1 .10`, butters 3 (`questing-v1.js:237,471`) | CONFORME |
| JRPG (315-321) | Ultimate Attack +2 (`ultimateAttackPower` 2178 : 2 + 0,01 x highestBoss, +2) | `jrpg ? 4 : 2` + 0,01 x boss (`ui-aventure-1-v1.js:1750`) | CONFORME |
| Exile (322-326) | ensuite, a chaque titan 9 (`zone30Drop` 518) : 2 % de « Sack of the Exile » niv. 100 (id 341) et 25 % de « Face of the Exile » niv. 100 (id 336) | NON IMPLEMENTE (`idle-adventure-combat.js:600` : « volontairement NON tires ») ; aucun id 336-342 dans le moteur | **ECART** (a faire seulement si Norman veut les Exile pieces ; non portes) |
| Rad (345-351) | +5 taille de deck (`maxDeckSize` 1644) | `IDLE_CARDS_SETS_V1.rad.deckSize 5` | CONFORME |
| Back To School (352-358) | NGU x1,15 | `nguSpeedPct .15` | CONFORME |
| Western (359-365) | drop 2e-8 x loot (plafond 12 %, `zone33Drop` 521) | Beretta 9 mm 2e-8 / 6e-8 boss (`butin.js:547,552`) | CONFORME |
| Space (373-379) | cuisine x1,1 (2934) | `spaceSetMultiplier 1.10` (`idle-cooking-v1.js:75`) | CONFORME |
| Rainbow Heart (390) | vitesse cartes et mayo x1,1 | `cardMayoSpeedPct .10` | CONFORME |
| Still-Beating Heart (391) | Tag Effect +0,01, borne 0,10-0,25 (1664) | `cardTagEffect .01`, borne (`idle-cards-v1.js:517`) | CONFORME |
| Bread (392-399) | duree de repas -3600 s (base 84600 s) | `breadSetReductionHours 1`, base 23,5 h | CONFORME (le texte du jeu dit « 30 minutes », le code retranche 3600 s) |
| Disco (400-407) | rarete mini des cartes +0,05 (0,80 -> 0,85) | `rarityMin 0.85` | CONFORME |
| Halloweenies (408-415) | PP x1,45 | `itopodPpPct .45` | CONFORME |
| Rock Lobster (416-423) | +1 palier a TOUTES les cartes (1666) | `rock.tierAll 1` | CONFORME |
| Construction (453-460) | boosts x1,2 | `boostEffectiveness .20` | CONFORME |
| Duck (496-503) | cartes et mayo x1,06 | `duck cardSpeed/mayoSpeed .06` | CONFORME |
| Nether / Dutch (461-468) | rituels Blood Magic x1,25 | `bloodMagicSpeedPct .25` | CONFORME |
| Amalgamate (469-476) | +10 taille de deck | `amalgamate.deckSize 10` | CONFORME |
| Pirate (507-514) | AUCUN effet (juste le portrait 66) | `reward {}` | CONFORME |
| Pissed Off Key (172) / Green Heart (171) | PP x1,1 / x1,2 | `itopodPpPct .10 / .20` | CONFORME |
| Red Heart (119) / Yellow Heart (129) | EXP x1,1 / AP x1,2 : le coeur maxxe REMPLACE le bonus equipe (`addExp` 2221, `addAP` 2225) | `heartExpPct/heartApPct` (`idle-hearts-v1.js:63-75`), memes regles | CONFORME |
| Brown Heart (162) | 1 Poop sur 10 non consommee (`usePoop` 5085) | `idleYggBrownHeartActiveV1` | CONFORME |
| Blue Heart (196) | consommables x1,1 (potions, potions R3, pilules, poop, butter : 724-728) | `consumablesEffectPct .10` | CONFORME |
| Purple Heart (212) | kills par MacGuffin x0,8 (485, 540) | `purpleHeart: k *= 0.8` (`macguffins-v1.js:308,313`) | CONFORME |
| Orange Heart (293) | QP x1,2 | `questQpPct .20` | CONFORME |
| Grey Heart (297) | Hacks x1,25 (3226) | `hackSpeedPct .25` | CONFORME |
| Pink Heart (344) | +1 slot de souhait (4877) | via `completedSets.heartPink` (`idle-ngu-progression.js`) | CONFORME |
| Heroic Sigil (292) | quest drops x1,1 (1262) | `questDropsSetPct .10` | CONFORME |
| Wandoos XL (163) | boot 3240 s (-10 %) | `wandoosBootReductionPct .10` | CONFORME |
| Incriminating Evidence (294) | +2 Res3 Power, +80000 Res3 Cap, +2 Res3 Bars, +1 potion R3 de chaque ; verse seulement si Resource 3 est active (`res3On`) | `r3PowerFlat 2, r3CapFlat 80000, r3BarsFlat 2, r3Potion* 1` ; versement sans condition `res3On` | CONFORME en valeurs / ECART MINEUR (condition `res3On` non reproduite) |
| Normal Bonus Accs (432-444) | loot x1,25 (separe) | `drop .25` ; produit | CONFORME |
| Evil Bonus Accs (445-452) | Adventure stats x1,2 (Atk, Def, HP, Regen) | `adventureStatsPct .20` | CONFORME |

Composition : pour chaque set, la liste d'ids du jeu (`ItemList::maxxed*`) a ete comparee aux definitions SOREAL via `IDLE_ADVENTURE_WIKI_ITEM_IDS_V1` : strictement identique (ex. Edgy = 213,214,215,217,218 ; Cave inclut 61 Combat Cheese ; Training inclut 75 ; Exile 322-326). Critere de completion : niveau >= 100 (`checkIfItemMaxxed` 3661) = `idleAdventureNiveauEstMaxV1`. Portraits (index du jeu, 43 sets) : tous presents dans `idle-portraits-v1.js` (Forest = 3 portraits).

Commentaires perimes (aucun effet) dans `idle-adventure-sets.js` : « reward volontairement vide » pour Disco, Rock, Duck, Space, Bread, Rad, JRPG, Fad, Mobster, Nerd (cartes, cuisine, quetes, macguffins ont ete construits depuis ; leurs effets lisent `completedSets`).

## 3. Specials d'objets : ecarts (jeu / SOREAL)

Methode : pour les 375 objets a specials du catalogue (376 dans le jeu, le 342 est absent), chaque special du jeu (type, `curSpec` = base, `capSpec` = max niveau 0, converti en % par `effectBonus` : diviseur 1 pour les types 1-4,6-9,11 ; 10 pour 5,10,16-19 ; 100 pour 12-14,20-22 ; 1000 pour 15,23,26-28,33-36,40 ; 10 000 pour 24,25,29-32,37-39,41,42 ; 100 000 pour 43,44 ; 1 000 000 pour 45,46,47,48 ; 10 000 000 pour 49,50,51) est apparie a SOREAL (type, base, max niveau 0, max niveau 100, exposant de points). 360 objets sur 375 : conformes sur tous les champs.

| Objet (id jeu) | Champ | Jeu | SOREAL | Verdict |
|---|---|---|---|---|
| Clockwork Boots (88) | base magicPowerPct | 18 (180 pts) | 12 | ECART (`SET_ITEM_SPECIALS_V1` "clock:boots") |
| Clockwork Boots (88) | base magicCapPct | 1,8 (180 pts) | 1 | ECART |
| S'rerednaW Pants (157) | base magicBarsPct | 800 (8000 pts) | 1600 (= max niveau 100 ; la base depasse le max niveau 0 800) | ECART |
| S'rerednaW Pants (157) | base magicCapPct | 85 (8500 pts) | 170 | ECART |
| A Small Gerbil (195) | base energyPowerPct / magicPowerPct / magicCapPct | = cap : 6000 / 6000 / 600 | 2000 / 2000 / 200 | ECART (`sBase`, `sExtra.base`) |
| My Brown Heart (162) | base seedGainPct | 35 (35 000 pts = cap) | 0 | ECART |
| A Regular Tie (116) | cap magicPowerPct | 108,2 | 108,12 | ECART (deja note) |
| A Regular Tie (116) | defense max niveau 0 | 82 | 81,5 (`sets.js:424`) | ECART (deja note) |
| Dragon Wings (110) | max niveau 100 magicPowerPct | 216,4 | 216,2 | ECART (max0 correct) |
| A Beanie (127) | cap magicPowerPct | 185 | 184,9 | ECART (deja note) |
| Infinity Charm (256) | cap energyCapPct, magicCapPct | 888,8888 | 888,89 | ECART (deja note) |
| Heart Shaped Panties (249) | cap r3PowerPct / nguSpeedPct / energyCapPct / magicCapPct | 6,666666 / 333,3333 / 666,6666 / 666,6666 | 6,67 / 333 / 667 / 667 | ECART (deja note) |
| A Cheap Plastic Amulet (218) | exposant de points energyCapPct (type 29, diviseur 10 000) | 4 | 5 | ECART (deja note) |
| Magic Bar Bar (227) | exposant de points magicPowerPct (type 34, diviseur 1000) | 3 | 4 | ECART (deja note) |
| A busted copy of Wandoos 98 (66) | special wandoosSpeed 0,98 % (98 pts) | present | absent | SANS EFFET (type 10 non equipable) : aucun correctif utile |
| The Toolbox (458) | r3BarsPct | 2 specials (941 + 943) | 1 special 1884 (somme) | CONFORME (fusion) |
| Blue Eyes Ultimate Chestplate (342) | 3 specials (R3 cap 1,2e9 pts...) | absent | ECART connu (titans/Exile, non porte) |
| Seal of the Exile (335) | objet type 4 | absent | ECART connu (idem) |
| Types 6 et 10 du jeu | n'apparaissent sur aucun objet ; type 11 « Cooking » : seul le nombre de pieces Chef compte (`invCookCheck`, plafond 1,5), jamais `bonuses[11]` | SOREAL : `cookingPct` par special, cuisine lit les pieces (`idle-cooking-v1.js:334`) | CONFORME |

Formule par niveau et boosts : plafond d'un special = `floor(cap x (1 + niveau/100))` (3363) ; SOREAL max100 = 2 x max0 : identique. Un Special Boost verse `cap_du_boost x multiplicateur` de points dans spec1 jusqu'a son plafond, puis spec2, puis spec3 (3363) : identique a SOREAL (points par ordre de la fiche). Les 3 specials d'un meme objet de types voisins (1/16/27/33...) s'additionnent comme pourcentages d'un meme stat dans le jeu (`updateBonuses` 3628) : meme convention que `specialsByType`.

Consommation des types par le moteur : tous consommes (`goldDropsPct`, `dropChancePct`, `energy*/magic*`, `nguSpeedPct`, `beard/wandoos/advancedTraining/augment/daycare/yggdrasil/questDrops/seedGain/r3*/hack/wish`, `respawnReductionPct`, `apPct`, `expPct` via cœurs) ; `moveCooldownPct` (type 14, Sands of Time, Alarm Clock, Minute-Hand) n'est lu que cote client (`ui-aventure-1-v1.js:1571`, plafond 95) : le jeu (`totalCooldownBonus`) n'a pas ete relu pour son plafond (NON VERIFIE).

## 4. Emplacements (accessorySpaces et co.)

- `accessorySpaces` (3576) : 2 de base +1 pour chacun des 8 achats (hasAcc3, 4, 5, 5bis, 6, 7, 8, 9) +1 Troll Normal >= 2, +1 Troll Evil >= 1, +1 Troll Sadistic >= 7, +1 perk 29, +1 quirk 18, +1 souhait 109 = 16 maximum. SOREAL : base 2 + `bonusSlots.accessory` (perk 29, quirk 18, defis, 6 achats Sellout + 2 boutique EXP, souhait 109 : `idle-ngu-etat.js:1148`) : meme structure, meme total (CONFORME en structure ; nombre exact d'achats non recompte ligne par ligne).
- `macguffinSpaces` (3577) : 1 + achats + Edgy + perks 66/67/88 + Troll Evil >= 2 + No Equipment Evil max + quirks 19/50 ; SOREAL 22 au total, Edgy +1 : CONFORME.
- `daycareSpaces` (3578), `loadoutSpaces` (3584 : arbitrary + 2 + 1, plafond 10), `curSpaces` (3575) : lus, NON compares ligne a ligne a SOREAL.
- `weapon2Factor` (3608) : 0,05 x (niveaux des souhaits 28 + 45), plafond 1 : identique (`idle-ngu-etat.js:1141`).

## 5. Correctifs exacts

1. **Mise a l'echelle `bossRequired`** (ecart n°1) :
   - ajouter `bossRequired` par objet (table du §1, cle = `wikiItemId`) ;
   - dans `idleAdventureEquipmentStatsV47` (`idle-adventure-v47.js:205-262`) et `idleAdventureSpecialsByTypeV1` : pour chaque objet equipe `f = bossRequired>0 ? Math.min(1, bossEffectif/bossRequired) : 1` ; Power = `Math.floor(power*f)`, Toughness = `Math.floor(toughness*f)`, chaque special `Math.floor(cur_points*f)/ratio` ; HP = somme des Power x 3, regen = somme des Toughness x 0,03 (le jeu calcule HP/regen a partir des sommes deja plancher) ;
   - `bossEffectif` = nombre de boss tues dans le Rebirth en cours (+301 par niveau de difficulte >= 1 et >= 2). Le propager comme `dualWieldRatio` (`state.adventure.bossesEffectifs`, synchronise dans `idle-ngu-etat.js` pres de la ligne 1141) et l'ajouter a la cle de memo `idle-adventure-v47.js:186` (sinon cache perime : voir AGENTS.md « Performance du moteur »).
2. `idle-adventure-set-specials-v1.js` : `"clock:boots"` base magicCapPct `1 -> 1.8`, base magicPowerPct `12 -> 18` ; `"rerednaw:legs"` base magicBarsPct `1600 -> 800`, base magicCapPct `170 -> 85` ; `"jake:tie"` magicPowerPct max0 `108.12 -> 108.2` (max100 `216.4`).
3. `idle-adventure-sets.js` (`SPECIALS`) : A Small Gerbil `sBase 2000 -> 6000`, `sExtra` magicCapPct `base 200 -> 600`, magicPowerPct `base 2000 -> 6000` ; My Brown Heart `sExtra` seedGainPct `base 0 -> 35` ; Dragon Wings magicPowerPct `max100 216.2 -> 216.4` ; A Beanie `184.9 -> 185` ; Infinity Charm `888.89 -> 888.8888` ; Heart Shaped Panties `6.67 -> 6.666666`, `333 -> 333.3333`, `667 -> 666.6666` (x2) ; A Regular Tie defense max `t:163 -> t:164`.
4. `idle-adventure-special-points-v1.js` : `"edgy:amulet"` exposant de l'index energyCapPct `5 -> 4` ; `"magicBarBarAccessory"` index magicPowerPct `4 -> 3`.
5. (Optionnel, si Norman veut Exile) : au kill du titan 9 avec `completedSets.exile` : 2 % d'objet 341 niveau 100 et 25 % d'objet 336 niveau 100.
6. (Mineur) Evidence : ne verser les bonus R3 que si Resource 3 est activee.
7. Nettoyage : mettre a jour les commentaires « reward volontairement vide » des sets deja branches (§2) ; mettre les ecarts de valeurs ci-dessus a jour dans `constantes-soreal-v1.json` si une entree existe.

## 6. Non verifie

- Valeurs serialisees Unity (non presentes en IL) : `AdventureController.regAttackMulti/idleAttackMulti/chargeMulti`, base du delai global, `Inventory.spaces` de base : pris tels que SOREAL les a deja (audits wiki precedents).
- Plafond du bonus Move Cooldowns du jeu (`Character::totalCooldownBonus`).
- `daycareSpaces`, `loadoutSpaces`, `curSpaces` ligne a ligne.
- Mise a l'echelle `bossRequired` des boosts/consommables (types > 5) : sans objet (aucun special).
- Probabilites de drop des sets Western/Edgy Boots/Choco/Stealth/Walderp/UUG : constantes du jeu lues (zoneNDrop) et comparees a `butin.js`/`combat.js` ; le facteur de loot exact applique par SOREAL (cap, racine cubique des titans) n'a pas ete rejoue.
- Scripts reutilisables (scratchpad) : `sets2.mjs` + `sets-game.json` (compositions), `cond.mjs`/`cond.txt` (recompenses uniques), `flagctx.mjs`/`flagctx.txt` (consommateurs), `cmpspec5.mjs` (specials), `types.mjs`/`types.json` (diviseurs par type).
