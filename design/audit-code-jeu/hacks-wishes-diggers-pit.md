# Audit code du jeu (build 1260) : Hacks, Wishes, Mineurs d'or, Money Pit, roue journalière, AP et boutiques EXP (passe de contrôle, 2026-11-20)

Passe de CONTRÔLE : relit dans l'IL (`Assembly-CSharp.dll`) et dans `cloudflare/src` ce que les rapports `ngu-hacks-barbes-mineurs-tables.md`, `souhaits.md`, `economie.md`, `boutiques.md`, `hors-ligne.md` et `design/MONEY-PIT-CODE-DU-JEU-2026-11-16.md` donnaient, vérifie que leurs correctifs sont bien dans le moteur, et cherche ce qui manquait. Rien d'autre que ce rapport n'a été modifié.

## 1. Écarts réels (vérifiés dans l'IL ET dans le code SOREAL), par impact

### E1 (BAS) Money Pit : l'EXP versée n'est ni multipliée (bonus unique) ni tronquée (tirages)
- Jeu : tous les gains d'EXP du Pit passent par `Character::addExp(long)` (2221) : `floor(valeur x NGU EXP x (objet 119 maxé ? 1,1 : 1 + bonus équipement[24]) x (perk ITOPOD 94 >= 987 ? 1,05) x Digger EXP x Hack EXP x Souhaits x Cuisine)`, un `Math.Floor` par appel. Appelants lus : `tier2Reward` (1593, +1), `tier3Reward` (1594, +2), `tier4Reward` (1595, +3), `tier5Reward`..`tier16Reward` (EXP x `tossFactor`), et `tier4TotalReward` (1611, bonus unique 1E12 : `addExp(100)`).
- SOREAL : `idle-ngu-snapshot.js` ~l.746 (`MONEY_PIT_ONE_TIME_BONUSES_V1`, `applyMoneyPitOneTimeBonusesV1`) : `state.currencies.experience += b.experience` donc +100 EXP BRUT, sans `xpMultiplier`. Pour les tirages (`tossMoneyPit`, ~l.1000, `reward.experience = (reward.experience || 0) + v * xpMultiplier`) le produit n'est pas tronqué (jeu : plancher par versement : 1 x 1,7 donne 1, pas 1,7).
- Correctif : bonus unique `experience`, versé comme `Math.floor(100 * idleNguBonusesLectureV1(state).xpMultiplier)` (et le même nombre dans `totaux.experience`) ; tirages : `Math.floor(v * xpMultiplier)` (pour les paliers 12 à 16 : `Math.floor(Math.floor(base * facteurJets) * xpMultiplier)`, `moneyPitLotConcretV1` tronque déjà la base).

### E2 (BAS) Money Pit : un seul bonus unique par jet dans le jeu, tous d'un coup dans SOREAL ; total d'or compté même sous 100 000
- Jeu : `PitController::totalReward` (1590) lit `floor(log10(Pit.totalGold))` et verse UN SEUL bonus par jet (chaque branche fait `return`) : >= 8 (1E8), >= 10 (1E10), >= 11 (1E11, Looty : seulement si place dans le sac / filtre accessoire, sinon `return` AVANT les suivants), >= 12 (1E12). `tier5TotalReward` (1612) est vide : aucun bonus à 1E13. `Pit.totalGold += realGold` à CHAQUE `engage` (1587), même si l'or jeté est sous 100 000 (jet « rien »).
- SOREAL : `applyMoneyPitOneTimeBonusesV1` boucle sur les quatre paliers et verse TOUS ceux atteints dans le même jet ; `tossMoneyPit` n'ajoute pas l'or d'un jet < 100 000 à `totalGoldTossed` (commentaire : « ne compte pas… »).
- Correctif (si parité voulue) : `break` après le premier bonus versé dans la boucle ; ajouter `cost` à `totalGoldTossed` dans la branche `cost < 100000`. Effet réel minime (un joueur franchit rarement deux paliers d'un coup ; l'or sous 1E5 est négligeable), à traiter seulement avec E1.

### E3 (NOTE DE CONCEPTION, à décider par Norman) Money Pit : le jeu ne filtre pas les lots par système débloqué
- Jeu : `tierNReward` tire un entier uniforme sur TOUS les cas du palier (`Random.Range`, ex. palier 6 : 1 à 10). Un cas dont le système manque ne donne rien (« belches and smells awful ») : graines (`PlayerSettings.yggdrasilOn` faux), Wandoos au plafond du palier (`pitOSLevels >= 20`, 50, 100). Les lots du cube s'appliquent sans test.
- SOREAL : `moneyPitLotsDisponiblesV1` retire du tirage les lots dont le système n'est pas découvert (cube, Wandoos, Yggdrasil, garderie, Blood Magic) : leur probabilité est redistribuée (décision documentée « chance parmi les lots disponibles », wiki). Dans le jeu la probabilité des autres lots reste 1/N et il y a des jets perdus.
- Pas de correctif imposé : c'est un choix de lecture du wiki ; à confirmer.

## 2. Contrôles de correctifs antérieurs (tous APPLIQUÉS)

| Rapport | Point | État dans `cloudflare/src` |
|---|---|---|
| souhaits n°1 | puissance/cap/barres et stats d'Aventure en PRODUIT par souhait | fait : `wishBonusesV1` (`idle-wishes-v1.js` ~l.301-337) |
| souhaits n°3 | souhait 192, diviseur 6e25 | fait : `idle-wishes-v1.js:245` (le commentaire l.244 parle encore de 4e26 : à reformuler, sans effet) |
| souhaits n°4, n°5 | potions retirées hors ligne, seuil INFINITY TIME 1e-8 | faits : `wishSecondsForLevelV1` (`idle-ngu-pistes.js` ~l.409-419) |
| souhaits n°7 | double arme sans le souhait 28 | fait : `idle-ngu-etat.js:1260` |
| ngu-hacks §1.4 | NGU NUMBER x `timeMulti` | fait : `nguNumberRebirthV1` (`idle-ngu-ressources.js:149`) |
| economie 1.1 / n°8 | roue : chrono initial 23 h | fait : `advanceMoneyPitAndDaily` (`idle-ngu-systemes.js:381`) |
| economie 1.5 | niveau max abordable d'un mineur | fait : `niveauMaxSupporteDiggerV1` (`idle-ngu-systemes.js:756-770`), identique à `setLevelMaxAffordable` (3102) |
| boutiques 2.1 | cœurs au niveau 10 | fait : `idle-hearts-v1.js:127` |
| boutiques 2.2 | prix (Pink 175 000, accessoire 9 = 675 000 + difficile, randomiseur R3 85 000, boutons 100 000) | faits : `idle-sellout-shop-v1.js` l.74, 102, 122, 137 |
| boutiques 2.3 | verrous Énergie/Magie/R3 | faits : `resourcePurchaseUnlocked` (`idle-ngu-snapshot.js:512-520`, record de boss pour l'Énergie, cap brut 100 000, aucun verrou Magie/R3) |
| boutiques 2.4 | minuteurs hors ligne | fait : `IDLE_SELLOUT_MINUTEURS_HORS_LIGNE_V1` |

## 3. Points qui étaient « NON VÉRIFIÉ » ou « partiel », désormais CONFORMES

- **Boutique EXP, Auto-Activate d'Yggdrasil** (`YggdrasilEXPPurchases.fruitCosts`, tableau de scène, lu dans `level0` à l'offset 2555380, 21 entiers 64 bits) : 300, 500, 600, 2000, 2000, 8000, 10000, 15000, 20000, 100000, 500000, 2000000, 5000000, 15000000, 1000000, puis 1e9 x6 : identique, fruit par fruit, à `IDLE_YGG_AUTO_ACTIVATE_V1` (`idle-yggdrasil-extra-v1.js`). Cap requis = coût d'activation du fruit x 10 (`YggdrasilEXPPurchases::capRequired`, 2555 : `activationCost[i] x 10`), ce qui redonne les 21 `requiredCap` de SOREAL (1e6 à 1e17). CONFORME.
- **Slots de mineurs** (`maxDiggerSlots`, 3104) : 1 + `hasDiggerSlot1` + perks ITOPOD 52/53 (`totalDiggerSlots`, 447) + `arbitrary.diggerSlots` (max 6, `maxDiggerSpaces` 766 ; coût 110 000 puis 225 000, `diggerSlotCost` 785) + `jakeNoteComplete` (set Scrap of Paper, `AllItemListController::checkforBonuses` 3406) + défi Time Machine >= 5, borné au nombre de mineurs. `availableDiggerSlots` (`idle-ngu-systemes.js:728`) : même somme. CONFORME.
- **Money Pit, mécanique** : déblocage à `realGold >= 100000` (`Character::addGold` 2224 pose `pitUnlocked`) = `unlock: { gold: 100000 }` ; attente `3600 x (tossCount + 1)` secondes depuis le dernier jet (`currentPitTime` 1582, `canToss` 1584), `tossCount` remis à 0 au Rebirth SANS remettre le chrono (`Rebirth::resetGold` 2718) = `nextAt = dernierJet + 1 h` (`idle-ngu-actions.js:900-904`) puis `2 + jets` heures après chaque jet ; le jet prend tout l'or (`engage` 1587) ; palier = `floor(log10)` à 5/7/9/11/13/15/18/21/24/27/30 puis 50/55/60/65/70 avec le souhait n°4 (`oneTossReward` 1589) = `moneyPitTierV48_` ; AP = partie entière du log avant le test du minimum. CONFORME.
- **Money Pit, lots** : ids d'objets des paliers 1 à 4 (boosts Puissance 1/2/3/4, Endurance 14/15/16/17, Spécial 27/28/29/30, tirage 1 à 8 puis 1 à 9) cohérents avec `trio_(1|2|5|10)` ; paliers 12 à 16 = 5 cas (`Random.Range(1, 6)`) : pilule x (0,2 .. 0,4) x `tossFactor`, `allLevelUp`, EXP (2500 .. 5000) x `tossFactor`, graines de grenade (0,02 .. 0,04) x `tossFactor`, `daycareLevelUp` = `IDLE_MONEY_PIT_REWARDS_V1`. `tossFactor` = min(10, tossCount + 1) (1588) = `facteur` de `moneyPitLotConcretV1`. Bonus uniques 1E8 (+10/+10 Aventure, +100 PV, +1 régén.), 1E10 (+1 énergie par barre, +1 magie par barre), 1E11 (Looty, objet 67), 1E12 (+100 EXP) : valeurs conformes (seul le calcul de l'EXP diffère : E1).
- **Hacks, vitesse totale** (`totalHackSpeedBonus` 3226) : Hack Hack x souhaits x cartes[6] x (1 + équipement[50] + cube) x (objet 297 maxé ? 1,25) x (1 + 0,2 x complétions Evil du défi NGU) x (Troll Evil >= 5 ? 1,25) ; SOREAL `hackSpeedMultiplier` (`idle-ngu-bonus.js:1143`) + `hackSpeedChallengeMultiplier` (`idle-ngu-catalogues.js:393`, `(1 + 0,20 x noNgu) x (Troll Evil >= 5 ? 1,25 : 1)`) + `idleHeartsHackSpeedMultiplierV1` (Cœur gris) : mêmes termes. Plancher du jeu `max(1, .)` sans effet (tous les facteurs sont >= 1).
- **Mineurs, consommation des bonus** : les 12 bonus (`drop`, `wandoos`, `stats`, `adventure`, `energyNgu`, `magicNgu`, `energyBeard`, `magicBeard`, `pp`, `daycare`, `blood`, `experience`) sont tous lus dans le moteur ; l'EXP (`xpMultiplier`, `idle-ngu-bonus.js:990`) reprend les facteurs de `addExp` (NGU, mineur, hack, souhait 61, cuisine, cœur/équipement, perk 94).
- **AP** (`Character::addAP` 2225) : `floor(base x succès x (objet 129 maxé ? 1,2 : 1 + bonus[25]) x (perk 94 >= 89 ? 1,02 : 1))`, plancher 0 ; `apWithBonusV1` (`idle-ngu-bonus.js:302`) = succès x Cœur jaune (`idleHeartsApMultiplierV1`) x perk Fibonacci 89, arrondi inférieur : CONFORME (le Cœur jaune de SOREAL joue le rôle de l'objet 129 / bonus d'équipement 25, déjà admis par les audits précédents).

## 4. Non vérifié (et pourquoi)

- **Coûts des classes `EnergyPurchases`, `AdventurePurchases`, `MiscPurchases`, `StatBoostPurchases`** : ce sont les valeurs par défaut du constructeur (ex. 15 / 150 / 1500 / 15000 pour la Puissance 0,1). La suite d'entiers par défaut (80, 800, 8000 ; 15, 150, 1500, 15000) est absente de TOUS les fichiers de scène (`level0`, `sharedassets0.assets`, `resources.assets`, `globalgamemanagers*`) : soit ces champs ne sont pas sérialisés (le constructeur fait foi), soit la scène les remplace par d'autres valeurs. La lecture directe de la scène ne permet pas de trancher ; les valeurs de SOREAL restent celles du constructeur, qui recoupent le wiki.
- **Roue journalière** : tables de lots des paliers 0 à 7 relues dans `economie.md` (« CONFORME, calcul ») ; non rejouées ici.
- **Gold Diggers hors ligne** : aucune méthode `goldDiggerOfflineProgress` dans `Character::addOfflineProgress` (2231) : les mineurs ne progressent pas hors ligne dans le jeu ; aucun écart côté SOREAL relevé (non vérifié ligne à ligne).

## 5. Liste courte des écarts réels

1. E1 : Money Pit, +100 EXP du bonus unique 1E12 versé brut (jeu : x multiplicateur d'EXP, plancher), et EXP des tirages sans plancher (`idle-ngu-snapshot.js` ~l.746 et ~l.1000).
2. E2 : Money Pit, un seul bonus unique par jet dans le jeu (SOREAL : tous d'un coup) et or jeté sous 100 000 compté dans le total du jeu (pas dans SOREAL).
3. E3 (décision) : Money Pit, le jeu ne retire pas du tirage les lots des systèmes non débloqués (SOREAL redistribue la chance).

Aucun écart nouveau sur Hacks (60 constantes, formules, vitesse totale), Wishes (231 souhaits, formules, hors ligne), Mineurs d'or (72 constantes, slots, niveau maximum), roue journalière (chrono, paliers), coûts AP/EXP relus et Auto-Activate d'Yggdrasil.
