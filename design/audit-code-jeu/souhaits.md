# Audit code du jeu (build 1260) : souhaits (Wishes)

Sources lues : `WishesController` (133 méthodes, IL) et tous ses appelants (Character, LootDrop, CardsController, InventoryController, BeastQuestController, HacksController, AllNGUController, Rebirth, PitController...), plus la table Unity `WishProperties` extraite de `NGUIdle_Data/level0` (231 entrées). Côté SOREAL : `cloudflare/src/idle-wishes-v1.js`, `idle-ngu-pistes.js`, `idle-ngu-bonus.js`, `idle-difficulty-gates-v1.js`, `idle-cards-v1.js`, `idle-adventure-combat.js`, etc. Aucun fichier du dépôt modifié hormis ce rapport.

## 1. Disposition de la table `WishProperties` (level0)

Par entrée : `maxLevel` (int64), nom, description, `wishSpeedDivider` (float32), `effectPerLevel` (float32), `difficultyRequirement` (int : 1 = Evil, 2 = Sadistic ; AUCUN souhait n'est Normal), un entier constant 3 (non utilisé par le code lu), id de sprite. 231 entrées, ids 0 à 230, ordre identique à SOREAL.

## 2. Comparaison champ par champ (231 souhaits)

Comparaison automatique (tolérance relative 1e-5) entre la table du jeu et `IDLE_WISHES_CATALOG_V1` + `IDLE_WISH_DIFFICULTE_V1` + `IDLE_CARDS_WISH_EFFECTS_V1` :

| champ | souhaits comparés | écarts de valeur |
|---|---|---|
| niveaux max | 231 | 0 |
| diviseur de vitesse | 231 | 1 : souhait 192 |
| difficulté exigée (Evil/Sadistic) | 231 | 0 |
| effet par niveau (toutes les entrées de `bonus` à clé unique) | toutes | 0 |
| niveaux et effets de la surcouche Cartes | 95 | 0 |
| noms | 231 | 8 écarts cosmétiques (voir 4) |

### Seul écart de valeur de la table

| souhait | champ | jeu | SOREAL | verdict |
|---|---|---|---|---|
| 192 « I wish I could beat up more Bosses VII » | wishSpeedDivider | 6,00e25 | 4,00e26 | ÉCART (SOREAL 6,67 fois trop lent) |

Le test `idle-catalogs-vs-wiki-mirror` note déjà que le wiki affiche 6.00E+25 mais que son `data-sort-value` dit 4e26 : le jeu donne raison au texte affiché.

## 3. Formules du `WishesController` comparées à SOREAL

| mécanisme | jeu (IL lu) | SOREAL | verdict |
|---|---|---|---|
| vitesse brute par tick | `rawProgressPerTick = energyFactor x magicFactor x res3Factor x totalWishSpeedBonuses / (wishSpeedDivider x (niveau+1))` | `wishSecondsForLevelV1` : `div x (niveau+1) / (E x M x R)^0,17 / vitesse / 50` | OK (le produit des trois puissances 0,17 égale la puissance 0,17 du produit) |
| facteurs de ressource | `(totalXPower x alloué)^0,17`, biais 0,17 pour les 3 | exposant 0,17, `max(1, puissance)` | OK (le `max(1,.)` n'existe pas dans le jeu, sans effet pratique) |
| plancher de temps | `minimumWishTime = 1/((14 400 - ITOPOD 24 s x niv. atouts 109 et 110 - quirk 54 24 s x niv.) x 50)`, `progressPerTick = min(minimumWishTime, raw)` | `max(3600, 14 400 - réductions)` s | OK (le plancher 3600 n'existe pas dans le jeu mais n'est jamais atteint : réduction maxi 3 600 s) |
| seuil d'arrêt | `raw < 1e-8` par tick => 0 (« INFINITY TIME ») | aucun | ÉCART mineur (5, n°5) |
| temps par niveau | `(1 - progress)/progressPerTick/50` | idem, quantifié sur les ticks | OK |
| `totalWishSpeedBonuses` | `(1 + bonuses[51] + cubeWishBonus) x ITOPOD x Hacks x Cartes(7) x (1,25 Wish Speed Booster) x (1,2 set Typo) x (1,1337 Severed Head) x totalWishBonus` | `wishSpeedParamsV1` : souhaits 1/21/43, atouts, 1,25 Sellout, (1 + cube + équipement), Typo 0,20 et Severed 0,1337 par `setFacteurNguV1`, hacks, cartes | OK pour les constantes lues |
| `totalWishBonus` | produit de `wishEffect` des souhaits 1, 21, 43 | `produitParSouhaitV1("wishSpeedPct")` | OK |
| hack speed | produit de `wishEffect` 18, 42, 63 | produit `hackSpeedPct` | OK |
| `wishEffect(id)` | 1 si difficulté courante < exigée, sinon `max(1, 1 + niveau x effet)` | `idleWishTracksActifsV1` filtre par difficulté | OK |
| Attaque / Défense | produit de `statBonus1` (2 si souhait 0 niv.>=1) x `wishEffect` de 5, 30, 105, 106, 189, 191, 192, 219 | `statProduct` (produit par souhait) | OK (mesuré par Norman le 2026-11-13) |
| **Stats d'aventure** | produit de `adventureBonus1` (1,2 si souhait 0) x `wishEffect` de 6, 29, 103, 104, 188, 218, 226 | **somme** `1 + sum(pct x niveau)` | **ÉCART** (5, n°1) |
| **Énergie / Magie / Ressource 3 : puissance, cap, barres** (9 totaux) | produit de la constante 1,05 du souhait 0 x `wishEffect` de chaque souhait de la famille | **somme** `1 + sum(pct x niveau)` | **ÉCART** (5, n°1) |
| slots de souhaits | `1 + (Troll Evil >= 7) + Pink Heart + (quirk 56 >= 1)`, plafonné à 4 | `wishSlotBreakdownV1` identique | OK |
| `wishLocked` | souhait 28 : Troll Evil < 4 ; souhait 45 : Troll Evil < 6 | `IDLE_WISH_TROLL_EVIL_V1 {28:4, 45:6}` | OK |
| allocation | refus si difficulté exigée > courante ; refus si aucun slot libre | `setWishSlotV1` | OK |
| `doLevelupEffect` | 4 : Pit à 100 ; 7, 22, 57 : inventaire ; 109 : accessoires ; 26/44/75/202 : portraits 43, art chaton 10, portrait 44, portrait 56 | Pit, portraits (26, 75, 202), art chaton 44, inventaire +1 par niveau, accessoire 109 | OK |
| respawn (46) | `max(0,9 ; 1 - niveau x 0,01)` | `1 - niveau x 0,01` puis plancher global | OK |
| EXP (61) | `1 + 0,005 x niveau` | idem | OK |
| Daycare (27) | `1 + 0,01 x niveau` | idem | OK |
| Blood α (59) / Fruit α (60) | `1 + 0,2 x niveau` | idem | OK |
| Sadistic boss (107, 108) | chacun `min(0,01 ; 0,001 x niv.)`, Sadistic | `0,001 x (niv107 + niv108)` | OK |
| Base PP ITOPOD (79) | `50 x niveau`, Sadistic | idem en extreme | OK |
| Cube boost (110) | `min(2 ; 1 + 0,05 x niveau)` | `1 + 0,05 x min(20, niveau)` | OK |
| NGU speed (111-114) | `wishEffect(111) x (112)` énergie ; `(113) x (114)` magie | produit de deux `(1 + 0,02 n)` | OK |
| Cartes : tiers, vitesses, mana, chonker, deck, tags | tiers = somme de niveaux ; mana min `1 + (163>=1) + (221>=1) + niv228`, max `9 + (162>=1) + (220>=1) + niv227` ; chonker min `21 + niv229`, max `29 + niv230` ; tag `0,10 + somme(eff x niv)` borné [0,10 ; 0,25] ; deck `somme(min(niv,5))` | `IDLE_CARDS_WISH_EFFECTS_V1` + `idle-cards-v1.js` | OK |
| quêtes | actives `2 x wishEffect(19) x wishEffect(62)` ; QP `wishEffect(47)` ; handin 10 - (80 Evil+) - (81 Sadistic), mini 2 ; bases 101 (Sadistic), 102 | `idle-questing-v1.js` | OK sur ce qui a été relu (page Quêtes = autre groupe) |
| Dual wield | débloqué si niv28 > 0 ; facteur `min(1 ; 0,05 x niv28 + 0,05 x niv45)`, 0 si 28 = 0 | `min(1, 0,05 x (28 + 45))` | ÉCART mineur (5, n°7) |
| temps de renaissance mini (20) | `clamp(180 - 10 x niveau, 120, 180)` | `180 - 10 x min(6, niveau)` | OK |
| MacGuffin niveau de base (2) | `min(5, niveau)` | idem | OK |
| Hacks milestones (76-78) | seuil moins le niveau | idem | OK |
| Titans V2/3/4 (souhait 3) | `higherVFactor` : niv.3 => 1,1/1,2/1,3 ; niv.2 => 1,1/1,2/1,2 ; niv.1 => 1,1/1,1/1,1 | `1 + 0,1 x min(niveau, rang V - 1)` | OK (équivalent) |
| QP des titans (73, 74, 40, 41, 100, 187, 204) | `conv.i8( conv.i8(base x questRewardFactor) x higherVFactor )` | `base x rewardMult`, non tronqué, sans `questRewardFactor` | **ÉCART** (5, n°2) |
| zones de drop et bases de QP (1, 1, 2, 3, 4, 5, 6) | zone19 73, zone23 74, zone26 40, zone30 41, zone34 100, zone38 187, zone42 204 | `TITAN_QP_V1` identique | OK |
| Advanced Training (190) | sans énergie, 50 niv./s | `advanceAdvancedTrainingV1` | OK |
| THE END (203) | pièce 490 donnée par `runEndItemChecker` seulement si difficulté courante >= Sadistic | donnée à chaque synchro | ÉCART de moment (5, n°8) |
| progression hors ligne | `wishOfflineProgress` : ticks = secondes x 50, vitesse recalculée par niveau, **divisée par `potionModifier^biais` si potion active** | pas de distinction hors ligne | ÉCART probable (5, n°4) |

## 4. Écarts de noms (cosmétiques)

Jeu / SOREAL : 56 « Resource 3 Bar III » / « Bars III » ; 139 « QP Tier » / « QP Card Tier » ; 155, 157, 159, 161 « Cards Spawned Faster » / « my Cards Spawned Faster » ; 215 « TM Speed Card Tier was higher V » / « TM Speed Tier was Higher V » ; 202 « 4G's next Idle game » / « Norman & Sébastien's next Idle game » (remplacement voulu). Majuscules différentes sur 205 à 217 dans la surcouche Cartes.

## 5. Écarts de comportement, par priorité, avec le correctif exact

### n°1 (ÉLEVÉ) Puissance, cap, barres des 3 ressources et stats d'aventure : SOREAL additionne, le jeu MULTIPLIE
Jeu : `Character::totalEnergyPower` (et les 8 autres, `totalAdvAttack/Defense/HP/HPRegen`) multiplient par `WishesController::total...Bonus`, qui vaut `1 x bonus1 x wishEffect(a) x wishEffect(b) x ...` : un facteur `1 + niveau x effet` PAR souhait.
SOREAL : `wishBonusesV1` (`idle-wishes-v1.js`) calcule `1 + somme(effet x niveau)` pour les 9 familles et `adventureStatsMultiplier`.
Mesure : Énergie puissance, souhaits 0, 9, 31, 48, 64, 82, 91, 193 au maximum : jeu 1,05 x 1,5^4 x 1,2^3 = 9,185 ; SOREAL 3,65. Aventure (0, 6, 29 au max) : jeu 1,2 x 1,3 x 1,2 = 1,872 ; SOREAL 1,70.
Correctif : calculer chaque total comme le produit, par souhait, de `max(1, 1 + niveau x effet)` (même schéma que `produitParSouhaitV1` / `statProduct`), avec le souhait 0 comme constante 1,05 (puissance/cap/barres de chaque ressource, niveau >= 1) et 1,2 (aventure, niveau >= 1). Familles (ids du jeu) :
- Énergie puissance : 0*, 9, 31, 48, 64, 82, 91, 193 ; cap : 0*, 10, 32, 49, 65, 84, 93, 195 ; barres : 0*, 11, 33, 50, 66, 83, 92, 194
- Magie puissance : 0*, 12, 34, 51, 67, 85, 94, 196 ; cap : 0*, 13, 35, 52, 68, 87, 96, 198 ; barres : 0*, 14, 36, 53, 69, 86, 95, 197
- Ressource 3 puissance : 0*, 15, 37, 54, 70, 88, 97, 199 ; cap : 0*, 16, 38, 55, 71, 90, 99, 201 ; barres : 0*, 17, 39, 56, 72, 89, 98, 200
- Aventure : 0* (x1,2), 6, 29, 103, 104, 188, 218, 226
(* constante du souhait 0, indépendante de `effectPerLevel`.) Le reste de l'objet retourné (`inventorySlots`, `basicTrainingExtraLevels`...) ne change pas. Mettre à jour les tests qui figent des valeurs additives.

### n°2 (ÉLEVÉ) QP des titans : ni `questRewardFactor`, ni troncature
Jeu : `LootDrop::zoneNDrop` : `qp = (long)((long)(base x BeastQuestController::questRewardFactor) x higherVFactor)`. `questRewardFactor` = produit de godmother (x1,15), `1,02^questItemsMaxxed`, atouts ITOPOD (`totalQPBonus`), hacks (QP gain), souhait 47, cartes (bonus 14), Orange Heart (x1,2), perk 94 >= 233 (x1,1), mini 1 ; si beurre utilisé, divisé par `butterModifier` (mini 1).
SOREAL : `creditTitanRewardsV1` (`idle-adventure-combat.js` vers la ligne 312) : `out.qp = base x rewardMult` non tronqué, puis seul `perksGain.qpEarningsMultiplier` s'applique (`idle-ngu-snapshot.js` ligne 1479).
Correctif : calculer `F` comme dans `idle-questing-v1.js` (mêmes facteurs ; beurre divisé comme le jeu), puis `qp = floor(floor(base x F) x rewardMult)`, et ne plus repasser par `qpEarningsMultiplier` pour ce gain (déjà dans F via `totalQPBonus` ITOPOD) afin d'éviter un double compte. Exemple d'effet : Beast base 1 x 1,1 donne 1 dans le jeu, 1,1 dans SOREAL.

### n°3 (MOYEN) Souhait 192 : diviseur 4e26 au lieu de 6e25
Correctif : `idle-wishes-v1.js` ligne 245, `speedDivider: 4.00e26` => `6.00e25`. Mettre à jour le commentaire du test `idle-catalogs-vs-wiki-mirror` qui retient 4e26.

### n°4 (BAS, à confirmer) Hors ligne : le jeu retire l'effet des potions
`wishOfflineProgress` divise la vitesse brute par `potionModifier^0,17` pour chaque potion active (Énergie, Magie, Ressource 3) avant de rattraper le temps d'absence. SOREAL traite le rattrapage comme du temps en ligne (potions comprises). Correctif si on veut l'aligner : dans un grand pas de temps, retirer le facteur potion de la puissance concernée dans `wishSecondsForLevelV1` quand la potion est active. À confirmer avec le code des potions (autre groupe).

### n°5 (BAS) Seuil d'arrêt à 1e-8 par tick
Le jeu met `progressPerTick = 0` quand la vitesse brute est < 1e-8 par tick (temps par niveau > 2 000 000 s, environ 23,1 jours) : le souhait ne bouge plus. SOREAL continue indéfiniment. Correctif : dans `wishSecondsForLevelV1`, retourner `Infinity` si `rawSeconds > 2e6`.

### n°6 (BAS) Portes de difficulté : lecteurs de niveau brut contre `wishEffect`
Le jeu ne porte la difficulté que dans `wishEffect` (stats, vitesse, hacks, NGU, EXP, Daycare...) ; les lecteurs de niveau brut (46 respawn, 20 renaissance, 28/45 double arme, 2 MacGuffin, 76-78 hacks, 3 et QP des titans, 4 Pit, 24/25, 23, 109, 190, deck/tags/mana des cartes) ignorent la difficulté courante. SOREAL filtre TOUS les niveaux par difficulté (`wishLevelV1`) et, à l'inverse, `wishSpeedParamsV1` lit `system.data.tracks` sans filtre. Sans effet tant que le joueur reste dans la difficulté qui a débloqué ses souhaits ; différent si la difficulté courante est abaissée. Correctif : lecteur `wishLevelBrutV1` sans filtre pour les lecteurs bruts, et `wishBonusesV1` toujours sur les niveaux filtrés, y compris dans `wishSpeedParamsV1`.

### n°7 (BAS) Double arme : souhait 45 sans le 28
Jeu : facteur 0 si le niveau du 28 est 0. SOREAL (`idle-ngu-etat.js` ligne 1145) : `min(1, 0,05 x (n28 + n45))` donne un facteur > 0 avec seulement le 45. Correctif : `n28 > 0 ? min(1, 0,05 x (n28 + n45)) : 0`.

### n°8 (BAS) THE END : pièce du souhait 203
Jeu : donnée à la fin d'un run (`runEndItemChecker`), seulement si la difficulté courante est Sadistic et si l'objet 490 est absent. SOREAL (`idleTheEndSyncV1`) : à chaque synchro dès que le niveau >= 1. Correctif : ne la donner qu'au Rebirth en Sadistic.

## 6. Ce qui n'a pas pu être vérifié

- MEGA BUFF (souhait 8) et OH SHIT (souhait 58) : le jeu lit leur niveau dans `MegaBuff::Update`, `OhShit::Update`, `Character::Update` ; ils vivent côté client SOREAL (`ui-aventure-1-v1.js`) ; effets (20 %, recharge 50 s) non rapprochés de l'IL.
- Composantes d'autres groupes : valeurs internes de `ItopodPerkController::totalQPBonus`, `HacksController::totalWishSpeedBonus`, `CardsController::getBonus(7/12/14)`, potions, `setFacteurNguV1`. Lues seulement pour confirmer leur place dans le produit.
- Pas de test numérique de bout en bout contre le jeu : formules rapprochées par lecture et par script sur la table.
- Flottants 32 bits du jeu contre doubles de SOREAL : non quantifié.
- `orderBaseCost`, `orderTotalCost`, `totalCost` (`0,5 x diviseur x (max - niv) x (max + niv + 1)`), filtres et boutons : interface seulement.

## 7. Table complète du jeu (extraite de level0)

Toutes les colonnes ont été rapprochées de SOREAL par script (voir 2) ; la seule ligne en écart est le souhait 192.

| id | nom (jeu) | niveaux max | diviseur de vitesse | effet/niveau | difficulté exigée |
|---|---|---|---|---|---|
| 0 | I wish that wishes kicked ass | 1 | 1.000e+15 | 1 | Evil |
| 1 | I Wish that wishes weren't so slow :c | 10 | 1.000e+15 | 0.05 | Evil |
| 2 | I wish MacGuffin drops mattered | 5 | 2.000e+15 | 1 | Evil |
| 3 | I wish V2/3/4 Titans had better rewards | 3 | 8.000e+15 | 1 | Evil |
| 4 | I wish money Pit didn't suck | 1 | 6.000e+15 | 1 | Evil |
| 5 | I wish I could beat up more bosses I | 10 | 3.000e+15 | 1 | Evil |
| 6 | I wish I was stronger in Adventure mode I | 10 | 3.000e+15 | 0.03 | Evil |
| 7 | I wish I had more Inventory space I | 12 | 4.000e+15 | 1 | Evil |
| 8 | I wish I had a cool new move for Adventure I | 1 | 6.000e+15 | 1 | Evil |
| 9 | I wish I had more Energy Power I | 10 | 5.000e+15 | 0.05 | Evil |
| 10 | I wish I had more Energy Cap I | 10 | 5.000e+15 | 0.03 | Evil |
| 11 | I wish I had more Energy Bars I | 10 | 5.000e+15 | 0.03 | Evil |
| 12 | I wish I had more Magic Power I | 10 | 5.000e+15 | 0.05 | Evil |
| 13 | I wish I had more Magic Cap I | 10 | 5.000e+15 | 0.03 | Evil |
| 14 | I wish I had more Magic Bars I | 10 | 5.000e+15 | 0.03 | Evil |
| 15 | I wish I had more Resource 3 Power I | 10 | 5.000e+15 | 0.05 | Evil |
| 16 | I wish I had more Resource 3 Cap I | 10 | 5.000e+15 | 0.03 | Evil |
| 17 | I wish I had more Resource 3 Bars I | 10 | 5.000e+15 | 0.03 | Evil |
| 18 | I wish the Greasy Nerd took a shower | 10 | 1.000e+16 | 0.04 | Evil |
| 19 | I wish Active Quests were more Rewarding I | 10 | 2.000e+16 | 0.02 | Evil |
| 20 | I wish I didn't have to wait 3 minutes per rebirth | 6 | 3.000e+16 | 1 | Evil |
| 21 | I wish Wishes weren't so slow :c II | 10 | 5.000e+16 | 0.02 | Evil |
| 22 | I wish I had more Inventory space II | 12 | 8.000e+16 | 1 | Evil |
| 23 | I wish Basic Training was EVEN FASTER >:) | 1 | 1.000e+17 | 1 | Evil |
| 24 | I wish Blood MacGuffin α wasn't so random | 1 | 6.000e+16 | 1 | Evil |
| 25 | I wish Fruit of MacGuffin α wasn't so random | 1 | 6.000e+16 | 1 | Evil |
| 26 | I wish I were an Oscar Meyer Weiner | 1 | 1.000e+18 | 1 | Evil |
| 27 | I wish the Daycare Kitty was even happier | 10 | 5.000e+16 | 0.01 | Evil |
| 28 | I wish I could dual wield weapons | 10 | 3.000e+17 | 0.05 | Evil |
| 29 | I wish I was stronger in Adventure mode II | 10 | 2.000e+17 | 0.02 | Evil |
| 30 | I wish I could beat up more bosses II | 10 | 2.000e+17 | 1 | Evil |
| 31 | I wish I had more Energy Power II | 10 | 1.000e+17 | 0.05 | Evil |
| 32 | I wish I had more Energy Cap II | 10 | 1.000e+17 | 0.03 | Evil |
| 33 | I wish I had more Energy Bars II | 10 | 1.000e+17 | 0.03 | Evil |
| 34 | I wish I had more Magic Power II | 10 | 1.000e+17 | 0.05 | Evil |
| 35 | I wish I had more Magic Cap II | 10 | 1.000e+17 | 0.03 | Evil |
| 36 | I wish I had more Magic Bars II | 10 | 1.000e+17 | 0.03 | Evil |
| 37 | I wish I had more Resource 3 Power II | 10 | 1.000e+17 | 0.05 | Evil |
| 38 | I wish I had more Resource 3 Cap II | 10 | 1.000e+17 | 0.03 | Evil |
| 39 | I wish I had more Resource 3 Bars II | 10 | 1.000e+17 | 0.03 | Evil |
| 40 | I wish the Godmother would drop QP | 1 | 1.000e+19 | 1 | Evil |
| 41 | I wish the Titan after Godmother would also drop QP | 1 | 3.000e+20 | 1 | Evil |
| 42 | I wish the Greasy Nerd took a shower II | 10 | 7.000e+17 | 0.04 | Evil |
| 43 | I wish Wishes weren't so slow :c III | 10 | 2.000e+18 | 0.02 | Evil |
| 44 | I wish there was more cute Daycare Kitty Art | 1 | 3.000e+19 | 1 | Evil |
| 45 | I wish I could dual wield weapons II | 10 | 1.000e+19 | 0.05 | Evil |
| 46 | I wish enemies spawned faster | 10 | 6.000e+18 | 0.01 | Evil |
| 47 | I wish Quests gave more QP | 10 | 3.000e+18 | 0.02 | Evil |
| 48 | I wish I had more Energy Power III | 10 | 5.000e+18 | 0.05 | Evil |
| 49 | I wish I had more Energy Cap III | 10 | 5.000e+18 | 0.03 | Evil |
| 50 | I wish I had more Energy Bars III | 10 | 5.000e+18 | 0.03 | Evil |
| 51 | I wish I had more Magic Power III | 10 | 5.000e+18 | 0.05 | Evil |
| 52 | I wish I had more Magic Cap III | 10 | 5.000e+18 | 0.03 | Evil |
| 53 | I wish I had more Magic Bars III | 10 | 5.000e+18 | 0.03 | Evil |
| 54 | I wish I had more Resource 3 Power III | 10 | 5.000e+18 | 0.05 | Evil |
| 55 | I wish I had more Resource 3 Cap III | 10 | 5.000e+18 | 0.03 | Evil |
| 56 | I wish I had more Resource 3 Bar III | 10 | 5.000e+18 | 0.03 | Evil |
| 57 | I wish I had more Inventory space III | 12 | 8.000e+19 | 0.03 | Evil |
| 58 | I wish I had another cool new move for adventure | 1 | 3.000e+21 | 1 | Evil |
| 59 | I wish Blood MacGuffin α also didn't suck | 10 | 4.000e+20 | 0.2 | Evil |
| 60 | I wish Fruit of MacGuffin α also didn't suck | 10 | 4.000e+20 | 0.2 | Evil |
| 61 | I wish I was more OP | 10 | 8.000e+19 | 0.005 | Evil |
| 62 | I wish Active Quests were more Rewarding II | 10 | 8.000e+20 | 0.01 | Evil |
| 63 | I wish the Greasy Nerd could at least wear some body spray | 10 | 5.000e+20 | 0.02 | Evil |
| 64 | I wish I had more Energy Power IV | 10 | 3.000e+20 | 0.05 | Evil |
| 65 | I wish I had more Energy Cap IV | 10 | 3.000e+20 | 0.03 | Evil |
| 66 | I wish I had more Energy Bars IV | 10 | 3.000e+20 | 0.03 | Evil |
| 67 | I wish I had more Magic Power IV | 10 | 3.000e+20 | 0.05 | Evil |
| 68 | I wish I had more Magic Cap IV | 10 | 3.000e+20 | 0.03 | Evil |
| 69 | I wish I had more Magic Bars IV | 10 | 3.000e+20 | 0.03 | Evil |
| 70 | I wish I had more Resource 3 Power IV | 10 | 3.000e+20 | 0.05 | Evil |
| 71 | I wish I had more Resource 3 Cap IV | 10 | 3.000e+20 | 0.03 | Evil |
| 72 | I wish I had more Resource 3 Bars IV | 10 | 3.000e+20 | 0.03 | Evil |
| 73 | I wish the Beast would drop some QP | 1 | 2.000e+16 | 1 | Evil |
| 74 | I wish the Greasy Nerd would drop some QP | 1 | 5.000e+17 | 1 | Evil |
| 75 | I wish I was a giant jar of Mayo. | 1 | 5.000e+21 | 1 | Evil |
| 76 | I wish the QP Hack had more milestones I | 5 | 2.000e+17 | 1 | Evil |
| 77 | I wish the Number Hack had more milestones I | 5 | 1.000e+19 | 1 | Evil |
| 78 | I wish the HACK HACK had more milestones I | 10 | 6.000e+20 | 1 | Evil |
| 79 | I wish the ITOPOD awarded more Base PP | 10 | 2.000e+21 | 1 | Sadistic |
| 80 | I wish higher level quest drops counted for even more Quest progress I | 2 | 5.000e+17 | 1 | Evil |
| 81 | I wish higher level quest drops counted for even more Quest progress II | 2 | 1.000e+22 | 1 | Sadistic |
| 82 | I wish I had more Energy Power V | 10 | 5.000e+21 | 0.02 | Sadistic |
| 83 | I wish I had more Energy Bars V | 10 | 5.000e+21 | 0.01 | Sadistic |
| 84 | I wish I had more Energy Cap V | 10 | 5.000e+21 | 0.01 | Sadistic |
| 85 | I wish I had more Magic Power V | 10 | 5.000e+21 | 0.02 | Sadistic |
| 86 | I wish I had more Magic Bars V | 10 | 5.000e+21 | 0.01 | Sadistic |
| 87 | I wish I had more Magic Cap V | 10 | 5.000e+21 | 0.01 | Sadistic |
| 88 | I wish I had more Resource 3 Power V | 10 | 5.000e+21 | 0.03 | Sadistic |
| 89 | I wish I had more Resource 3 Barfs V | 10 | 5.000e+21 | 0.015 | Sadistic |
| 90 | I wish I had more Resource 3 Cap V | 10 | 5.000e+21 | 0.015 | Sadistic |
| 91 | I wish I had more Energy Power VI | 10 | 1.000e+23 | 0.02 | Sadistic |
| 92 | I wish I had more Energy Bars VI | 10 | 1.000e+23 | 0.01 | Sadistic |
| 93 | I wish I had more Energy Cap VI | 10 | 1.000e+23 | 0.01 | Sadistic |
| 94 | I wish I had more Magic Power VI | 10 | 1.000e+23 | 0.02 | Sadistic |
| 95 | I wish I had more Magic Bars VI | 10 | 1.000e+23 | 0.01 | Sadistic |
| 96 | I wish I had more Magic Cap VI | 10 | 1.000e+23 | 0.01 | Sadistic |
| 97 | I wish I had more Resource 3 Power VI | 10 | 1.000e+23 | 0.03 | Sadistic |
| 98 | I wish I had more Resource 3 Bars VI | 10 | 1.000e+23 | 0.015 | Sadistic |
| 99 | I wish I had more Resource 3 Cap VI | 10 | 1.000e+23 | 0.015 | Sadistic |
| 100 | I wish Titan 10 dropped QP | 1 | 5.000e+22 | 1 | Sadistic |
| 101 | I wish Major Quests had better Base QP Rewards. | 10 | 1.000e+22 | 1 | Sadistic |
| 102 | I wish Minor Quests had better Base QP Rewards. | 2 | 1.800e+23 | 1 | Sadistic |
| 103 | I wish I was stronger in Adventure mode III | 10 | 1.000e+19 | 0.02 | Evil |
| 104 | I wish I was stronger in Adventure mode IV | 10 | 3.000e+21 | 0.01 | Sadistic |
| 105 | I wish I could beat up more bosses III | 10 | 2.000e+19 | 1 | Evil |
| 106 | I wish I could beat up more bosses IV | 10 | 1.000e+21 | 1 | Sadistic |
| 107 | I wish the Sadistic Boss Multiplier didn't suck so bad I | 10 | 2.000e+22 | 0.001 | Sadistic |
| 108 | I wish the Sadistic Boss Multiplier didn't suck so bad II | 10 | 5.000e+23 | 0.001 | Sadistic |
| 109 | I wish I had yet another Accessory Slot! | 1 | 5.000e+24 | 1 | Sadistic |
| 110 | I wish Infinity Cube Boosting wasn't so awful I | 20 | 4.000e+19 | 0.05 | Evil |
| 111 | I wish Energy NGU's were Faster I | 10 | 7.000e+20 | 0.02 | Sadistic |
| 112 | I wish Energy NGU's were Faster II | 10 | 2.000e+22 | 0.02 | Sadistic |
| 113 | I wish Magic NGU's were Faster I | 10 | 7.000e+20 | 0.02 | Sadistic |
| 114 | I wish Magic NGU's were Faster II | 10 | 2.000e+22 | 0.02 | Sadistic |
| 115 | I wish my Energy NGU Card Tier was higher I | 1 | 4.000e+19 | 1 | Evil |
| 116 | I wish my Drop Chance Card Tier was higher I | 1 | 4.000e+19 | 1 | Evil |
| 117 | I wish my Wandoos Card Tier was higher I | 1 | 2.000e+19 | 1 | Evil |
| 118 | I wish my Adventure Stats Card Tier was higher I | 1 | 8.000e+19 | 1 | Evil |
| 119 | I wish my Hacks Card Tier was higher I | 1 | 5.000e+19 | 1 | Evil |
| 120 | I wish my Augment Card Tier was higher I | 1 | 6.000e+19 | 1 | Evil |
| 121 | I wish my Gold Drop Card Tier was higher I | 1 | 8.000e+19 | 1 | Sadistic |
| 122 | I wish my PP Card Tier was higher I | 1 | 1.000e+20 | 1 | Sadistic |
| 123 | I wish my A / D Card Tier was higher I | 1 | 9.000e+19 | 1 | Sadistic |
| 124 | I wish my Magic NGU Card Tier was higher I | 1 | 1.900e+20 | 1 | Sadistic |
| 125 | I wish my TM Speed Card Tier was higher I | 1 | 1.700e+20 | 1 | Sadistic |
| 126 | I wish my QP Card Tier was higher I | 1 | 2.200e+20 | 1 | Sadistic |
| 127 | I wish my Daycare Card Tier was higher I | 1 | 2.500e+20 | 1 | Sadistic |
| 128 | I wish my Energy NGU Card Tier was higher II | 1 | 1.200e+21 | 1 | Sadistic |
| 129 | I wish my Drop Chance Card Tier was higher II | 1 | 1.200e+21 | 1 | Sadistic |
| 130 | I wish my Wandoos Card Tier was higher II | 1 | 1.000e+21 | 1 | Sadistic |
| 131 | I wish my Adventure Stats Card Tier was higher II | 1 | 1.500e+21 | 1 | Sadistic |
| 132 | I wish my Hacks Card Tier was higher II | 1 | 1.800e+21 | 1 | Sadistic |
| 133 | I wish my Augment Card Tier was higher II | 1 | 1.800e+21 | 1 | Sadistic |
| 134 | I wish my Gold Drop Card Tier was higher II | 1 | 2.000e+21 | 1 | Sadistic |
| 135 | I wish my PP Card Tier was higher II | 1 | 2.500e+21 | 1 | Sadistic |
| 136 | I wish my A / D Card Tier was higher II | 1 | 2.000e+21 | 1 | Sadistic |
| 137 | I wish my Magic NGU Card Tier was higher II | 1 | 3.000e+21 | 1 | Sadistic |
| 138 | I wish my TM Speed Card Tier was higher II | 1 | 2.500e+21 | 1 | Sadistic |
| 139 | I wish my QP Tier was higher II | 1 | 4.000e+21 | 1 | Sadistic |
| 140 | I wish my Daycare Card Tier was higher II | 1 | 5.000e+21 | 1 | Sadistic |
| 141 | I wish my Energy NGU Card Tier was higher III | 1 | 2.000e+22 | 1 | Sadistic |
| 142 | I wish my Drop Chance Card Tier was higher III | 1 | 1.800e+22 | 1 | Sadistic |
| 143 | I wish my Wandoos Card Tier was higher III | 1 | 1.500e+22 | 1 | Sadistic |
| 144 | I wish my Adventure Stats Card Tier was higher III | 1 | 5.000e+22 | 1 | Sadistic |
| 145 | I wish my Hacks Card Tier was higher III | 1 | 4.000e+22 | 1 | Sadistic |
| 146 | I wish my Augment Card Tier was higher III | 1 | 6.000e+22 | 1 | Sadistic |
| 147 | I wish my Gold Drop Card Tier was higher III | 1 | 7.500e+22 | 1 | Sadistic |
| 148 | I wish my PP Card Tier was higher III | 2 | 1.000e+23 | 1 | Sadistic |
| 149 | I wish my A / D Card Tier was higher III | 1 | 8.000e+22 | 1 | Sadistic |
| 150 | I wish my Magic NGU Card Tier was higher III | 1 | 1.300e+23 | 1 | Sadistic |
| 151 | I wish my TM Speed Card Tier was higher III | 1 | 1.200e+23 | 1 | Sadistic |
| 152 | I wish my QP Card Tier was higher III | 2 | 1.500e+23 | 1 | Sadistic |
| 153 | I wish my Daycare Card Tier was higher III | 1 | 1.600e+23 | 1 | Sadistic |
| 154 | I wish I made Mayo Faster I | 10 | 5.000e+20 | 0.005 | Evil |
| 155 | I wish Cards Spawned Faster I | 10 | 5.000e+20 | 0.005 | Evil |
| 156 | I wish I made Mayo Faster II | 10 | 1.000e+22 | 0.004 | Sadistic |
| 157 | I wish Cards Spawned Faster II | 10 | 1.000e+22 | 0.004 | Sadistic |
| 158 | I wish I made Mayo Faster III | 10 | 2.000e+23 | 0.003 | Sadistic |
| 159 | I wish Cards Spawned Faster III | 10 | 2.000e+23 | 0.003 | Sadistic |
| 160 | I wish I made Mayo Faster IV | 10 | 4.000e+24 | 0.003 | Sadistic |
| 161 | I wish Cards Spawned Faster IV | 10 | 4.000e+24 | 0.003 | Sadistic |
| 162 | I wish I had BEEFY Cards I | 1 | 4.000e+24 | 1 | Sadistic |
| 163 | I wish I didn't have WIMPY Cards I | 1 | 4.000e+24 | 1 | Sadistic |
| 164 | I wish I had a bigger Deck I | 5 | 1.000e+20 | 1 | Evil |
| 165 | I wish I had a bigger Deck II | 5 | 5.000e+21 | 1 | Sadistic |
| 166 | I wish I had a bigger Deck III | 5 | 2.500e+23 | 1 | Sadistic |
| 167 | I wish I had another Mayo Generator | 1 | 5.000e+21 | 1 | Sadistic |
| 168 | I wish I had another Bonus Tag | 1 | 3.000e+22 | 1 | Sadistic |
| 169 | I wish Tags worked better I | 10 | 2.000e+19 | 0.0005 | Evil |
| 170 | I wish Tags worked better II | 10 | 6.000e+20 | 0.0004 | Evil |
| 171 | I wish Tags worked better III | 10 | 1.800e+22 | 0.0004 | Sadistic |
| 172 | I wish Tags worked better IV | 10 | 5.000e+23 | 0.0004 | Sadistic |
| 173 | I wish Tags worked better V | 10 | 1.500e+25 | 0.0004 | Sadistic |
| 174 | I wish my Energy NGU Card Tier was higher IV | 2 | 2.500e+23 | 1 | Sadistic |
| 175 | I wish my Drop Chance Card Tier was higher IV | 2 | 2.200e+23 | 1 | Sadistic |
| 176 | I wish my Wandoos Card Tier was higher IV | 2 | 2.000e+23 | 1 | Sadistic |
| 177 | I wish my Adventure Stats Card Tier was higher IV | 2 | 5.000e+23 | 1 | Sadistic |
| 178 | I wish my Hacks Card Tier was higher IV | 2 | 4.000e+23 | 1 | Sadistic |
| 179 | I wish my Augment Card Tier was higher IV | 2 | 6.000e+23 | 1 | Sadistic |
| 180 | I wish my Gold Drop Card Tier was higher IV | 2 | 7.500e+23 | 1 | Sadistic |
| 181 | I wish my PP Card Tier was higher IV | 2 | 1.000e+24 | 1 | Sadistic |
| 182 | I wish my A / D Card Tier was higher IV | 2 | 8.000e+23 | 1 | Sadistic |
| 183 | I wish my Magic NGU Card Tier was higher IV | 2 | 1.300e+24 | 1 | Sadistic |
| 184 | I wish my TM Speed Card Tier was higher IV | 2 | 1.200e+24 | 1 | Sadistic |
| 185 | I wish my QP Card Tier was higher IV | 2 | 1.500e+24 | 1 | Sadistic |
| 186 | I wish my Daycare Card Tier was higher IV | 2 | 1.600e+24 | 1 | Sadistic |
| 187 | I wish Titan 11 Dropped QP | 1 | 2.000e+25 | 1 | Sadistic |
| 188 | I wish I was stronger in Adventure mode V | 20 | 1.000e+24 | 0.01 | Sadistic |
| 189 | I wish I could beat up more bosses V | 20 | 1.000e+24 | 1 | Sadistic |
| 190 | I wish I was f**king done with Advanced Training forever! | 1 | 1.000e+18 | 1 | Evil |
| 191 | I wish I could beat up more Bosses VI | 20 | 2.000e+25 | 1 | Sadistic |
| 192 | I wish I could beat up more Bosses VII | 20 | 6.000e+25 | 1 | Sadistic |
| 193 | I wish I had more Energy Power VII | 10 | 2.000e+24 | 0.02 | Sadistic |
| 194 | I wish I had more Energy Bars VII | 10 | 2.000e+24 | 0.01 | Sadistic |
| 195 | I wish I had more Energy Cap VII | 10 | 2.000e+24 | 0.01 | Sadistic |
| 196 | I wish I had more Magic Power VII | 10 | 2.000e+24 | 0.02 | Sadistic |
| 197 | I wish I had more Magic Bars VII | 10 | 2.000e+24 | 0.01 | Sadistic |
| 198 | I wish I had more Magic Cap VII | 10 | 2.000e+24 | 0.01 | Sadistic |
| 199 | I wish I had more Resource 3 Power VII | 10 | 2.000e+24 | 0.03 | Sadistic |
| 200 | I wish I had more Resource 3 Bars VII | 10 | 2.000e+24 | 0.015 | Sadistic |
| 201 | I wish I had more Resource 3 Cap VII | 10 | 2.000e+24 | 0.015 | Sadistic |
| 202 | I wish I was a sneak preview of 4G's next Idle game | 1 | 1.000e+24 | 1 | Sadistic |
| 203 | ARE YOU SURE YOU WISH TO SHUT DOWN? | 1 | 1.000e+27 | 1 | Sadistic |
| 204 | I wish Titan 12 gave me some QP | 1 | 3.000e+26 | 1 | Sadistic |
| 205 | I wish my Energy NGU Card Tier was higher V | 2 | 4.000e+25 | 1 | Sadistic |
| 206 | I wish my Drop Chance Card Tier was higher V | 2 | 5.000e+25 | 1 | Sadistic |
| 207 | I wish my Wandoos Card Tier was higher V | 2 | 4.000e+25 | 1 | Sadistic |
| 208 | I wish my Adventure Stats Card Tier was higher V | 2 | 1.000e+26 | 1 | Sadistic |
| 209 | I wish my Hacks Card Tier was higher V | 2 | 8.000e+25 | 1 | Sadistic |
| 210 | I wish my Augment Card Tier was higher V | 2 | 1.000e+26 | 1 | Sadistic |
| 211 | I wish my Gold Drop Card Tier was higher V | 2 | 1.300e+26 | 1 | Sadistic |
| 212 | I wish my PP Card Tier was higher V | 2 | 2.000e+26 | 1 | Sadistic |
| 213 | I wish my A / D Card Tier was higher V | 2 | 2.500e+26 | 1 | Sadistic |
| 214 | I wish my Magic NGU Card Tier was higher V | 2 | 2.000e+26 | 1 | Sadistic |
| 215 | I wish my TM Speed Card Tier was higher V | 2 | 3.000e+26 | 1 | Sadistic |
| 216 | I wish my QP Card Tier was higher V | 2 | 5.000e+26 | 1 | Sadistic |
| 217 | I wish my Daycare Card Tier was higher V | 2 | 4.000e+26 | 1 | Sadistic |
| 218 | I wish I was stronger in Adventure mode VI | 20 | 5.000e+25 | 0.01 | Sadistic |
| 219 | I wish I could beat up more Bosses VIII | 20 | 1.800e+26 | 1 | Sadistic |
| 220 | I wish I had BEEFY Cards II | 1 | 1.000e+26 | 1 | Sadistic |
| 221 | I wish I didn't have WIMPY Cards II | 1 | 1.000e+26 | 1 | Sadistic |
| 222 | I wish I made Mayo Faster V | 10 | 8.000e+25 | 0.003 | Sadistic |
| 223 | I wish Cards Spawned Faster V | 10 | 8.000e+25 | 0.003 | Sadistic |
| 224 | I wish I made Mayo Faster VI | 10 | 1.000e+27 | 0.003 | Sadistic |
| 225 | I wish Cards Spawned Faster VI | 10 | 1.000e+27 | 0.003 | Sadistic |
| 226 | I wish I was stronger in Adventure mode VI (part 2) | 10 | 3.300e+26 | 0.01 | Sadistic |
| 227 | I wish I had BEEFY Cards III | 2 | 3.800e+26 | 1 | Sadistic |
| 228 | I wish I didn't have WIMPY Cards III | 2 | 3.500e+26 | 1 | Sadistic |
| 229 | I wish my chonkers were CHONKIER | 5 | 3.400e+26 | 1 | Sadistic |
| 230 | I wish my chonkers were LESS NOT CHONKIER | 5 | 3.700e+26 | 1 | Sadistic |
