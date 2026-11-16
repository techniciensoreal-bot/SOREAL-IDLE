# Audit code du jeu (build 1260) vs moteur SOREAL : cartes-cuisine

Date : 2026-11-16. Source jeu : IL de `Assembly-CSharp.dll` (`CardsController`, `DeckPodUI`, `CookingController`, plus `Cards`, `Cooking`, `Ingredient`, `Character::cardsOfflineProgress` / `cookingOfflineProgress`, `Itopod/BeastQuest/Wishes*Controller::total*`, `ArbitraryController`). Source SOREAL : `cloudflare/src/idle-cards-v1.js`, `cloudflare/src/idle-cooking-v1.js`.
Aucun fichier du moteur n'a été modifié. Les ids entre parenthèses sont les ids de méthode de `m.mjs`/`d.mjs`.

Portée lue : CardsController 164 méthodes listées, ~105 de gameplay désassemblées (le reste = textes, phrases de noms de cartes `sentence1..15`, `getAdjective/Verb/Noun…`, pods, tooltips, pages : ignorés) ; DeckPodUI 10 (toutes déléguent à `selectNewCard/protectCard/trashCard/swapCards`, aucune règle propre) ; CookingController 34 (tout le gameplay lu, UI ignorée) ; plus les consommateurs de `getBonus` (25 méthodes) pour vérifier les index de type.

## 1. Tableau de comparaison

### 1.1 Cuisine (`CookingController`)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `maxIngredientLevel` (2929) | `IDLE_COOKING_V1.levelMax` (cooking:51) | CONFORME | 20. |
| `maxBankedtime` (2931) | `bankCapHours` 24,5 / `bankCapBreadHours` 25,5 (cooking:87-89, `idleCookingTimerV1` cooking:341) | **ÉCART** | Jeu : constante **172 800 s = 48 h**, la même avec ou sans Bread set (`Update` 2926 : `if cookTimer < max: += dt`, plafonné à max ; `cookingOfflineProgress` 2253 : même plafond). SOREAL : 24,5 h (25,5 h Bread) « bug du wiki ». Le code 1260 ne contient pas ce bug : on peut stocker 2 repas. |
| `eatRate` (2932) | `mealHours` 23,5 − `breadSetReductionHours` 1 (cooking:79-80, 343) | CONFORME | 84 600 s (= 23,5 h), −3 600 s si `breadverseComplete`. |
| `invCookCheck` (2933) | `idleCookingGearV1` + `gearMultiplier` (cooking:308-339) | **ÉCART** | Jeu : pour chaque slot head / chest / legs (**deux fois**) / boots / weapon / chaque accessoire, **chacun des 3 specs** (`spec1Type, spec2Type, spec3Type`) égal à 11 (Cooking %) donne ×1,03 ; puis résultat **plafonné à 1,5** (et plancher 1). SOREAL : 1 par objet (pas par spec) et **aucun plafond 1,5**. Le plafond 1,5 est atteint à 14 specs (1,03^13,7). |
| `totalCookingBonuses` (2934) | `idleCookingTotalBonusesV1` (cooking:328) | CONFORME (hors `invCookCheck`) | ×1,2 si ingrédient 7 (index 6) débloqué, ×1,2 si ingrédient 8 (index 7), ×1,1 si `spaceComplete`, × `invCookCheck`. SOREAL : mêmes 1,2 / 1,2 / 1,1. |
| `baseExpBonusPerDish` (2935) | `idleCookingMealExpGainPctV1` (cooking:367) | CONFORME | `a = 0,005 × totalCookingBonuses` ; `base = 0,36` si `expBonus > 1,8`, sinon `1 − (expBonus−1)²` ; résultat borné à `[0,36·a, a]`. SOREAL : `max(0,36, 1 − x²)` avec x = totalExpGainPct/100 = expBonus − 1 : équivalent (1 − x² ≥ 0,36 ⇔ x ≤ 0,8). `expBonus` initial = 1 (ctor 2924). |
| `consumeDish` (2936) | `eatIdleCookingMealV1` (cooking:410) | **ÉCART** (3 sous-points) | (a) refuse si `cookTimer < eatRate`, sinon `cookTimer -= eatRate` : CONFORME. (b) gain = `getCurPercentofMaxScore × baseExpBonusPerDish` ajouté à `expBonus` : CONFORME en formule, mais voir `getCurPercentofMaxScore` (plancher 1 %). (c) `expBonus` n'est PAS plafonné à l'écriture : seul `totalExpBonus` plafonne l'effet (ci-dessous). (d) puis `assignNewDish` sans remise à zéro des niveaux (voir 2942). |
| `totalExpBonus` (2937) | `synchroniserBonusExp` (cooking:375) + `xpMultiplier … (1 + cookingExp)` (idle-ngu-bonus.js:951) | **ÉCART** | Jeu : multiplicateur d'EXP = `clamp(expBonus, 1, 3)` (expBonus part de 1) : **×3 maximum = +200 points**. L'écran affiche `expBonus×100 %` (100 % au départ, 300 % max : c'est le « 300 % » du wiki). SOREAL : `totalExpGainPct` part de 0, plafonné à 300, appliqué `(1 + 3,00)` = **×4 maximum**. |
| `minWeight` / `maxWeight` (2938/2939) | `ingredientWeightMin/Max` 4 / 14 (cooking:60-61) | CONFORME | `Random.Range(4,14)` flottant, bornes incluses. |
| `minPairedWeight` / `maxPairedWeight` (2940/2941) | `pairWeightMin/Max` 8 / 30 (cooking:64-65) | CONFORME | 8 / 30. Le jeu tire `pairedWeight` pour CHAQUE ingrédient de la paire mais ne lit que celui du premier (`getPairedScore` : `pair[0].pairedWeight`) : même loi qu'un seul tirage. |
| `assignNewDish` (2942) | `generateIdleCookingMealV1` + `nouveauRepas` (cooking:118, 380) | **ÉCART** (1 point) | Cibles `Range(0, 21)` = 0..20 : CONFORME. Cible de paire `Range(5, 2×20−5=35)` = 5..34 : CONFORME. Appariement aléatoire des 8 index en 4 paires : CONFORME. Poids : CONFORME. **MAIS** le jeu ne touche jamais `Ingredient.curLevel` : les niveaux choisis **persistent** d'un plat au suivant (seuls `tryIngredientUp/Down` les modifient ; l'appel à `assignNewDish` au chargement de partie ne les remet pas non plus). SOREAL : `nouveauRepas` remet les 8 niveaux à 0 (cooking:383). |
| `invalidIngredientIndex` (2943) | `COOKING_INGREDIENT_INVALIDE` (cooking:439) | CONFORME | 0 ≤ i < 8. |
| `ingredientUnlocked` (2944) | `masqueSlots` (cooking:214) | CONFORME | Ingrédients 0-5 débloqués d'office (ctor 2924), 6 et 7 débloqués par `LootDrop::zone38Drop` (526 : ennemis de type 37-40 = Rock Lobster, `boss11Kills`) et `zone42Drop` (530, Amalgamate). SOREAL : `titans.lobster.kills ≥ 1` et `titans.amalgamate.kills ≥ 1`. |
| `getOptimalScore` (2945) | `idleCookingOptimalScoreV1` (cooking:264) | CONFORME | Pour chaque paire, balaye x, y de 0 à 20 ; score = [a débloqué] (local(a,x)+local(b,x)) + [b débloqué] (local(a,y)+local(b,y)) + [les deux] paire(x+y) ; max par paire, somme. Identique (masque appliqué). |
| `getCurScore` (2946) | `idleCookingScoreV1` / `idleCookingPairScoreV1` (cooking:241-255) | CONFORME | Même structure avec les niveaux courants ; niveaux des ingrédients verrouillés ignorés (SOREAL les met à 0 via le masque, même effet). |
| `getCurPercentofMaxScore` (2947) | `idleCookingEfficiencyV1` (cooking:283) | **ÉCART** | Jeu : si optimal = 0 → 0,01 ; sinon `cur/opt` **borné à [0,01 ; 1]**. SOREAL : ratio brut (peut être ≈ 0), 0 si pas de repas. Un repas raté donne au minimum 1 % du gain maximal dans le jeu. |
| `getPairedScore` (2948) | `idleCookingPairLevelScoreV1` (cooking:229) | CONFORME | `(1 − 0,02·|cibleDePaire − somme|)^40 × pairedWeight(pair[0])` ; paire 1..4 sinon 0. |
| `getLocalScore` (2949) | `idleCookingIngredientLevelScoreV1` (cooking:224) | CONFORME | `(1 − 0,03·|cible − niveau|)^30 × poids`. |
| `tryIngredientUp` (2950) / `tryIngredientDown` (2951) | `setIngredient` (cooking:437) | CONFORME | Niveau 0..20 ; +1 / −1 par clic. SOREAL fixe un niveau libre (UI), bornes identiques. |
| `getIngredientAmount` (2952) | — | CONFORME (cosmétique) | `unitMultiplier × curLevel`, affichage seulement. |
| `Update` (2926) | `idleCookingTimerV1` (cooking:341) | ÉCART (voir `maxBankedtime`) | Le minuteur monte de `deltaTime` tant que `< 48 h`. Modèle SOREAL par ancre équivalent sauf le plafond. |
| `updateMenu`, `updateIngredientPods`, `updateDishUI`, `showIngredientInfo`, `hideIngredientInfo`, `showDishInfo`, `hideDishInfo`, `getIngredientUnitName`, `changeIngredientLevel` (vide) | — | UI (ignoré) | — |
| `Cooking::.ctor` (2924) / `Ingredient::.ctor` (2960) | `createIdleCookingDataV1` (cooking:169) | CONFORME | `expBonus = 1`, 6 ingrédients débloqués, `cookTimer` = 0 au départ (SOREAL ancre = instant du déblocage : banque 0). |
| `Character::cookingOfflineProgress` (2253) | `idleCookingTimerV1` | ÉCART (plafond 48 h) | Ajoute les secondes, plafonne à `maxBankedtime`. |
| Déblocage Cooking (`LootDrop::zone34Drop` 522 : `Cooking.unlocked = 1` à la mort d'IT HUNGERS) | `unlock` du système (idle-ngu-catalogues) | NON VÉRIFIÉ côté SOREAL | Hors portée (groupe Titans). |
| `ImportExport::loadData` (4535) | — | ABSENT (info) | À CHAQUE chargement de partie le jeu appelle `assignNewDish` : le plat est retiré (cibles/poids/paires changent) alors que niveaux et banque sont gardés. SOREAL garde le plat sauvegardé. Comportement du jeu que SOREAL ne reproduit pas (probablement voulu). |

### 1.2 Cartes (`CardsController`, `Cards`)

| Méthode du jeu | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `Start` (1627) | cadence mayo (cards:764) | CONFORME | `InvokeRepeating("updateManaGens", 0, 0,02)` = 50 ticks/s. |
| `cardSpawnTime` (1629) / `chonkerSpawnTime` (1630) | `cardSeconds` 3600 / `chonkerSeconds` 72·3600 (cards:119-121) | CONFORME | 3 600 s / 259 200 s. |
| `Update` (1628) | `advanceIdleCardsV1` / `spawnLoop` (cards:751-793) | **ÉCART** | Jeu : le minuteur (× `totalCardSpeed`) monte **même quand le deck est plein**, jusqu'à `cardSpawnTime` et y reste ; dès qu'une place se libère, la carte part tout de suite. Hors ligne (`cardsOfflineProgress` 2252) : si le nombre de cartes dues dépasse les places libres, minuteur = `cardSpawnTime` (plein). SOREAL : `if deck plein return` (cards:774) : aucun avancement tant que le deck est plein, et le reste de cycle est perdu (cards:787). Le chantier « carte prête » est donc perdu. Aussi : jeu en ligne = cartes normales d'abord puis Chonker ; hors ligne = Chonker d'abord ; SOREAL = normal d'abord. |
| `manaGenProgressPerTick` (1638/1639) | cards:764 (`mayoSeconds`, `work`) | CONFORME | `0,000005555556 × totalMayoSpeed ÷ (nb. de générateurs actifs si > 1)` par tick à 50/s = 1/3600 par seconde ; index hors liste → 1e-8. Écart d'infime détail : le jeu divise par le nombre de générateurs ALLUMÉS, SOREAL par `min(allumés, slots)`. |
| `updateManaGens` (1637) | cards:765-770 | CONFORME (arrondi) | Progression += pas ; ≥ 1 → progression remise à **0** (le dépassement est perdu) et +1 mana. SOREAL garde le reste (`p - whole`) : écart négligeable. |
| `addBigManaProgress` (1780) | cards:767-769, 894-897 | CONFORME | `p = progress + x ; if p ≥ 1 : amount += floor(p) ; progress = p mod 1`. |
| `timeToGen` (1640), `manaGenText` etc. | cards:1001 | CONFORME (UI) | `(1 − progress) / pasParTick / 50`. |
| `maxDeckSize` (1644) | `deckSize` (cards:511) | CONFORME (structure) / NON VÉRIFIÉ (valeurs) | 10 + Itopod 208-210 + BeastQuest 146-148 + Wishes 164-166 (chacun `min(niveau, maxLevel)`) + Rad +5 + Amalgamate +10 + `Arbitrary.deckSpaceBought` (max 50 : `maxDeckSpaces` 769 = 50 ✓). Mêmes ids que SOREAL. Les `maxLevel` sont des données de scène. |
| `hardCapTagSize` (1645) | — | CONFORME | 4 ; non codé dans SOREAL mais jamais atteint au-delà. |
| `maxTagSize` (1646) | `tagSlots` (cards:514) | CONFORME | 1 + quirk 151 + souhait 168 + `gotTagslot1` (achat unique), borné à 4. |
| `maxManaGenSize` (1647) | `generators` (cards:518) | CONFORME | 1 + perk 211 + quirk 150 + souhait 167 + `mayoGenSlots` (max 2 : `maxMayoGenSlots` 770 = 2 ✓), borné [1,6]. |
| `toggleTag` (1649) / `toggleManaGen` (1726) / `curManaToggleCount` (1727) | `toggleTag`, `toggleGenerator` (cards:918-940) | CONFORME | Allumer refusé si le compte ≥ max ; éteindre libre. |
| `addCard` (1654) | `idleCardsCreateCardV1` + boucle (cards:713, 777-786) | **ÉCART** (End card) | La carte est générée AVANT le test « deck plein ». Puis `if rebirthDifficulty ≥ 2 && Random < 0,01 : addEndCard`. SOREAL ajoute deux conditions que le jeu n'a pas : pas déjà la pièce 492, et pas déjà une carte THE END dans le deck. |
| `addChonkerCard` (1655) | cards:790 | CONFORME | Pas de carte End. |
| `addEndCard` (1656) | cards:781-784 | CONFORME | Type 2, id 69, 99 mayo de chaque (`IDLE_THE_END_CARD_MAYO_V1` = 99 ✓), tier 1, rareté 1, aucun bonus. |
| `generateCard` (1657) | `idleCardsCreateCardV1` (cards:713-743) | **ÉCART** (voir `generateManaCosts`) | Ordre jeu : nom, type, tier (+2 si Black Pen > 0, `cardTierUpperCount--`), coûts de mayo (chonker : `min/maxChonkerMana`), variance (chonker : `getMaxVariance`), rareté, effet. Chonker `isProtected = 1`. Black Pens ✓ (+2 tiers, 25 par achat : `buyCardTierConsumableAP` 990 ✓). Le jeu utilise un RNG à graine sauvegardée (`cardState`/`chonkerState`) : sans incidence sur les lois. |
| `minCardMana` (1658) | `mayoMin` (cards:521) | CONFORME | 1 + [souhait 163 ≥ 1] + [221 ≥ 1] + niveau du souhait 228 (jusqu'à 2). |
| `maxCardMana` (1659) | `mayoMax` (cards:522) | CONFORME | 9 + [162 ≥ 1] + [220 ≥ 1] + niveau du souhait 227. |
| `minChonkerMana` (1660) | `chonkerMayoMin` (cards:523) | **ÉCART** | Jeu : **21 + niveau du souhait 229**. SOREAL : 21 + souhait **230** (`chonkerMayoMin: 1` sur 230). |
| `maxChonkerMana` (1661) | `chonkerMayoMax` (cards:524) | **ÉCART** | Jeu : **29 + niveau du souhait 230**. SOREAL : 29 + souhait **229** (`chonkerMayoMax: 1` sur 229). Les deux souhaits sont inversés (sans effet une fois les deux maximaux, 5+5 niveaux). |
| `unlockedChonkers` (1662) | `chonkers` (cards:526) | CONFORME | Quirk 149 > 0. |
| `generateBonusType` (1663) | `idleCardsTypeChancesV1` + `pickType` (cards:448, 690) | CONFORME | Tirage `Random.value` r ; pour i dans les tags (≤ maxTagSize) : `r < tagEffect×(i+1)` → tag i ; sinon type uniforme 1..14. Donne `effet + (1 − N·effet)/14` pour un tag, `(1 − N·effet)/14` sinon : identique à SOREAL. |
| `tagEffect` (1664) | `tagEffect` (cards:517) | CONFORME (structure) / NON VÉRIFIÉ (valeurs) | 0,10 + Wishes 169-173 + Quirks 152-155 + Itopod 212-215 (niveau × `effectPerLevel`) + 0,01 si `beatingHeartComplete`, borné à [0,10 ; 0,25]. Les `effectPerLevel` sont des données de scène. |
| `generateCardTier` (1665) | `mods.tiers` (cards:507) | CONFORME | Ordre des 14 types : E-NGU, M-NGU, Wandoos, Augs, TM, Hacks, Wishes, A/D, Adv, Drop, Gold, Daycare, PP, QP = ordre SOREAL. |
| `getEnergyNGUTier` … `getQPTier` (1667-1680) | `IDLE_CARDS_PERKS/QUIRKS/WISH_EFFECTS_V1` (`cardTier_*`) | CONFORME | **Vérifié par script** (`cmp-tiers.mjs`) : pour les 14 types, l'ensemble des ids de perks Itopod, de quirks et de souhaits lus dans l'IL est identique à celui de SOREAL (0 écart sur 42 listes). Perks/quirks I-III : +1 si niveau > 0 ; quirks IV (157-169) et souhaits IV/V : + niveau ; souhaits 148/152 (PP III, QP III) : + niveau : tous conformes. |
| `getGlobalTierBonus` (1666) | `tierAll` (cards:506) | CONFORME | +1 si `rockLobsterComplete`. L'id de set `rock` ↔ `rockLobsterComplete` est supposé (nom). |
| `getMinVariance` (1682) / `getMaxVariance` (1683) / `generateVariance` (1681) | `rarityMin` / `rarityMax` (cards:525, 725) | CONFORME | Uniforme flottant [0,80 (+0,05 si `that70sComplete`) ; 1,20]. Chonker : 1,20. |
| `generateRarity` (1684) | `IDLE_CARDS_RARITY_BANDS_V1` (cards:107) | CONFORME (cosmétique) | Bandes < 0,9 / 1 / 1,08 / 1,14 / 1,17 / 1,19 / sinon ; chonker = rang 7 (étiquette propre), SOREAL affiche « Hot Damn ». |
| `generateCardType` (1685) | `foil` (cards:738) | CONFORME (cosmétique) | Foil si `Random < 0,01` (ou achat Foils). |
| `generateManaCosts` (1687) | `spreadMayo` (cards:699) | **ÉCART** | Jeu : total = `Range(min, max+1)` ; puis, tant que reste > 0 : type = `Range(0,6)` uniforme, **paquet = 1 + Range(0, reste) = uniforme 1..reste**, ajouté à ce type (un même type peut être retiré plusieurs fois). Les coûts sont donc très concentrés (le premier paquet vaut en moyenne la moitié du total). SOREAL : nombre de types uniforme 1..min(6,total), 1 minimum chacun puis répartition une unité à la fois. Lois très différentes (probabilité de payer en peu de types de mayo). |
| `getNounID`, `generateCardName`, `sentence1-15`, `getAdjective…`, `getSuffix`, `manaGenTest`, `cardNameTest` | — | UI (ignoré) | Noms de cartes. |
| `generateCardEffect` (1759) | `idleCardBonusPctV1` (cards:432) | CONFORME | Aiguille sur 14 `calculate*Effect`. |
| `getTierFactor` (1761) | `Math.pow(t, c3) * Math.pow(c4, t)` (cards:439) | CONFORME | `1 × tier^c3 × c4^tier`. |
| `calculateEnergyNGUEffect` (1762) | `IDLE_CARDS_TYPES_V1` E-NGU `[0.03,0.1,1.2,1.03]` | CONFORME | `0,0003·M + 0,001·M·T^1,2·1,03^T·var` (×100 = % SOREAL). |
| `calculateMagicNGUEffect` (1763) | M-NGU `[0.02,0.1,0.8,1.08]` | CONFORME | 0,0002 ; 0,001 ; 0,8 ; 1,08. |
| `calculateWandoosEffect` (1764) | WANDOOS `[0.02,0.1,0.8,1.1]` | CONFORME | idem. |
| `calculateAugEffect` (1765) | AUGS `[0.02,0.1,0.8,1.1]` | CONFORME | idem. |
| `calculateTMEffect` (1766) | TM `[0.02,0.1,0.8,1.15]` | CONFORME | idem. |
| `calculateHackEffect` (1767) | HACKS `[0.02,0.1,0.4,1.05]` | CONFORME | idem. |
| `calculateWishEffect` (1768) | WISHES `[0.02,0.1,0.5,1.05]` | CONFORME | idem. |
| `calculateStatEffect` (1769) | A/D `[5,1,1.5,2]` | CONFORME | 0,05 ; 0,01 ; 1,5 ; 2. |
| `calculateAdventureStatEffect` (1770) | ADV `[0.05,0.1,0.4,1.07]` | CONFORME | 0,0005 ; 0,001 ; 0,4 ; 1,07. |
| `calculateDropChanceEffect` (1771) | DROPS `[0.02,0.1,1,1.15]` | CONFORME | 0,0002 ; 0,001 ; 1 ; 1,15. |
| `calculateGoldDropEffect` (1772) | GOLD `[0.1,0.5,0.8,1.15]` | CONFORME | 0,001 ; 0,005 ; 0,8 ; 1,15. |
| `calculateDaycareSpeedEffect` (1773) | DAYCARE `[0.005,0.02,0.4,1.04]` | CONFORME | 0,00005 ; 0,0002 ; 0,4 ; 1,04. |
| `calculatePPEffect` (1774) | PP `[0.01,0.02,0.6,1.11]` | CONFORME | 0,0001 ; 0,0002 ; 0,6 ; 1,11. |
| `calculateQPEffect` (1775) | QP `[0.01,0.02,0.6,1.08]` | CONFORME | 0,0001 ; 0,0002 ; 0,6 ; 1,08. |
| `bigChonkerFactor` (1760) | — | CONFORME | Renvoie 2 mais **n'est appelée nulle part** (0 appelant) : les Chonkers n'ont pas de ×2, SOREAL non plus. |
| `tryConsumeCard` / `tryConsumeCurrentCard` (1747/1746) | `idleCardsActionV1` mode `cast` (cards:856) | ÉCART mineur | Refus si protégée ; refus si une mana manque (`coût > montant`) ; débit ; `bonuses[type] += effectAmount` ; carte supprimée : CONFORME. En plus, une carte THE END (type 2) exige **une place libre dans l'inventaire** (« You need free inventory space ») : absent côté SOREAL. |
| `getBonus` (1783) | `idleCardsMultiplierV1` (cards:646) | CONFORME | `bonuses[type]` (initial 1, + effet) ; 1 si Cartes pas débloquées. SOREAL stocke en % et applique `1 + total/100` : identique. |
| Consommateurs de `getBonus` (330, 1048, 1096-1099, 1250, 2132-2134, 2153, 2162-2165, 2209, 2211-2212, 3123, 3226, 4065-4066, 4083-4084, 4109-4110, 4250-4253, 4907) | `idleCardsApplyToBonusesV1` (cards:659) + sites dans `idle-ngu-bonus.js`, `idle-ngu-etat.js`, `idle-ngu-pistes.js`, `idle-ngu-ressources.js`, `idle-questing-v1.js` | CONFORME (index) | Index lus : 1 E-NGU, 2 M-NGU, 3 Wandoos (énergie et magie), 4 Augs, 5 TM, 6 Hacks, 7 Wishes, 8 A/D (attaque, défense), 9 Adv (attaque, défense, PV, régén. PV), 10 Drop (lootFactor), 11 Gold, 12 Daycare, 13 PP, 14 QP (questRewardFactor) : tous multiplicatifs, mêmes cibles que SOREAL. (Le calcul fin de chacune de ces cibles relève des groupes NGU/Augments/TM/Wishes/etc.) |
| `trashCard` (1755) / `trashCurrentCard` (1754) | mode `yeet` (cards:878) | CONFORME | Protégée → refus. |
| `postYeetEffect` (1756) | cards:885-899 | CONFORME | Perk 216 : Chonker (rareté 7) → `+25 %` de `chonkerSpawnTime` ; carte normale → `+10 %` de `cardSpawnTime` (`advanceTime`). Quirk 156 : mana au hasard parmi les coûts > 0, `addBigManaProgress(0,2)`. |
| `protectCard` / `protectCurrentCard` (1753/1752) | mode `protect` (cards:904) | CONFORME | Bascule. |
| `swapCards` (1757/1758), `selectNewCard`, `cardForward/Back`, `DeckPodUI::*` (1791-1800) | mode `move` | CONFORME (UI) | Réordonnancement sans effet de jeu. |
| `totalCardSpeed` (1784) | `cardSpeed` (cards:497) | CONFORME (structure) | Produit : Itopod 200·202·204·206 × BeastQuest 138·140·142·144 × Wishes 155·157·159·161·223·225 (chacun `1 + niveau×effectPerLevel`, **portés par la difficulté** `perkEffect/quirkEffect/wishEffect`) × 1,10 `rainbowHeartComplete` × 1,06 `duckComplete` × 1,10 si Troll Challenge sadistic ≥ 5. SOREAL : mêmes ids (vérifiés), mêmes 1,10 / 1,06 / 1,10 (seuil 5). |
| `totalMayoSpeed` (1785) | `mayoSpeed` (cards:501) | CONFORME (structure) | Idem avec ids 201·203·205·207 / 139·141·143·145 / 154·156·158·160·222·224, Rainbow 1,10, Duck 1,06, Troll ≥ 6 → 1,10, **× (1 + (maxManaGenSize − 1)×0,02)**, × `potionModifier` si `mayoSpeedPotTime > 0` (potionModifier 724 : 2, ×1,1 avec `blueHeartComplete` = 2,2). SOREAL : mêmes valeurs (2 / 2,2 via `idleHeartsConsumableFactorV1`). |
| `timeToCardSpawn` / `timeToChonkerSpawn` (1786/1787) | `secondsToNextCard` (cards:979) | CONFORME (UI) | `(temps − minuteur) / vitesse`. |
| `awardSomeMayoIGuess` (1789) via `BasicChallengeController::complete` (1888) | `idleCardsGrantChallengeMayoV1` (cards:824) | CONFORME | 1 de chaque, 5 de chaque à la dernière complétion. |
| `Character::cardsOfflineProgress` (2252) | `advanceIdleCardsV1` | ÉCART (voir `Update`) + négligeable | Mayo : ticks = secondes×50, partie « potion » = `min(secondes, potTime)`; la durée de potion restante `< 5 s` est remise à zéro. Cartes : chonker avant cartes ; plein → minuteur = temps de cycle. |
| `ItemController::consumeItem` (3794, cœur battant) | déblocage `unlock:{item:"stillBeatingHeart"}` | ÉCART mineur | Manger le cœur fait `cardsOn = 1` et appelle **`addCard()` tout de suite** (une première carte immédiate). SOREAL ne crée aucune carte au déblocage (le cœur n'est pas consommé non plus). |
| `Cards::.ctor` (1621), `bonusesSize`, `manaSize` (=6), `deleteCard`, `updateCards` | `createIdleCardsDataV1` (cards:540) | CONFORME | 6 types de mayo, bonus initiaux 1, aucun générateur allumé au départ (`Mana.running = false`), identique à `generators: []`. |
| Effet des entrées de perk / quirk / souhait ci-dessus (coûts, plafonds, `effectPerLevel`, `difficultyRequirement`) | `IDLE_CARDS_PERKS_V1` etc. | NON VÉRIFIÉ | Tables de scène (voir §3). |
| Difficulté : `perkEffect` (348) / `quirkEffect` (1314) / `wishEffect` (4938) | `idlePerkNiveauxV1` etc. (idle-difficulty-gates-v1.js) | ÉCART mineur | Le jeu ne conditionne par la difficulté que les **vitesses** (via `perkEffect/quirkEffect/wishEffect`). Tiers, taille de deck, slots de tags / générateurs, effet des tags, bornes de coût, Chonkers, recyclage lisent le **niveau brut** (`perkLevel[id] > 0`, etc.) sans test de difficulté. SOREAL filtre tout par difficulté (`foldEntries` lit `idlePerkNiveauxV1`). Visible seulement si l'on repasse à une difficulté inférieure avec des niveaux déjà achetés. |

## 2. Écarts priorisés et corrections proposées

### P1 — Cartes : le minuteur de carte ne doit pas s'arrêter quand le deck est plein
Impact gameplay le plus large (tout joueur de Cartes qui laisse son deck plein perd la « carte prête »). Fichier `cloudflare/src/idle-cards-v1.js`, `spawnLoop` (l. 773-788). Remplacer le corps par :
```js
const spawnLoop = (key, period, chonker) => {
  data[key] = N(data[key], 0) + secs * mods.cardSpeed / period;
  while (data[key] >= 1 && data.deck.length < mods.deckSize) {
    data.deck.push(idleCardsCreateCardV1(state, { rng, mods, chonker }));
    data[key] -= 1;
    /* ... bloc carte THE END inchangé ... */
  }
  /* jeu (Update + cardsOfflineProgress) : deck plein => minuteur plein (carte prête), jamais plus d'un cycle d'avance sauf recyclage */
  if (data.deck.length >= mods.deckSize && data[key] > 1) data[key] = 1;
};
```
(Le recyclage perk 216 ajoute 0,10 / 0,25 : le jeu le fait par `advanceTime` sans plafond propre, le plafond de 1 intervient au tick suivant ; à garder cohérent avec `normalize…` qui accepte jusqu'à 1e6.) Pour l'ordre hors ligne du jeu (Chonker d'abord), appeler `spawnLoop("chonkerProgress", …)` avant `spawnLoop("spawnProgress", …)` quand `secs` est un temps hors ligne ; en ligne le jeu fait cartes puis Chonker. Mettre à jour `idle-cards-v1.test.mjs` (l'en-tête du fichier dit « le minuteur ne stocke pas de cartes en attente », à corriger).

### P1 — Cartes : loi des coûts en mayo (`generateManaCosts`)
`spreadMayo` (cards:699-710) doit imiter le jeu :
```js
function spreadMayo(rng, total) {
  const mayo = {};
  let left = total;
  while (left > 0) {
    const id = MAYO_IDS[Math.floor(rng() * MAYO_IDS.length) % MAYO_IDS.length]; /* type d'abord */
    const chunk = 1 + Math.min(Math.floor(rng() * left), left - 1);              /* uniforme 1..left */
    mayo[id] = (mayo[id] || 0) + chunk;
    left -= chunk;
  }
  return mayo;
}
```
Citer dans le commentaire : `CardsController::generateManaCosts`, build 1260. Supprimer la mention « choix d'implémentation » de l'en-tête (cards:49-54) pour la répartition (et l'entrée correspondante du registre `constantes-soreal-v1.json` si elle existe ; la recherche de `idle-cards` n'a trouvé aucune entrée). Le total (`min..max` uniforme inclusif) est déjà conforme.

### P1 — Cuisine : les niveaux d'ingrédients persistent d'un plat au suivant
`nouveauRepas` (cooking:380-384) : supprimer `data.levels = new Array(C.ingredientCount).fill(0);` (le jeu ne remet jamais `curLevel` à zéro). Mettre à jour le commentaire d'en-tête (« Le niveau initial … 0 ») et `idle-cooking-v1.test.mjs` (qui attend probablement des niveaux remis à zéro après `eat`).

### P1 — Cuisine : plancher d'efficacité de 1 %
`idleCookingEfficiencyV1` (cooking:283-289), remplacer la dernière ligne :
```js
if (!meal) return 0;
...
return opt > 0 ? clamp(idleCookingScoreV1(meal, lv, mask) / opt, 0.01, 1) : 0.01;
```
(jeu : `getOptimalScore == 0 → 0,01` ; `< 0,01 → 0,01` ; `> 1 → 1`.)

### P2 — Cuisine : plafond de la banque de temps = 48 h
`IDLE_COOKING_V1` (cooking:87-89) : `bankCapHours: 48`, `bankCapBreadHours: 48` (le jeu a une constante `172800` quel que soit le Bread set ; le Bread set ne baisse que `eatRate`). Mettre à jour le commentaire (« bug des 24,5 h » : non présent dans l'IL 1260) et le texte d'aide éventuel. Attention : `idleCookingTimerV1` reste valable (`capMs` plus grand, plusieurs repas stockés).

### P2 — Cuisine : plafond de l'effet EXP = ×3 (et non ×4)
`synchroniserBonusExp` (cooking:375-378) : le jeu applique `clamp(expBonus, 1, 3)` avec `expBonus = 1 + totalExpGainPct/100`, soit au plus **+200 points** :
```js
state.bonuses.cookingExp = Math.min(2, Math.max(0, num(data.totalExpGainPct, 0) / 100));
```
Le stockage `totalExpGainPct` peut rester sans plafond (le jeu ne le plafonne pas : `consumeDish` ajoute sans borne, `baseExpBonusPerDish` reste à 0,36 au-delà de 80 points) ; retirer ou relever `totalExpGainMaxPct`/`clamp(…, 0, C.totalExpGainMaxPct)` (cooking:189, 377, 420) en conséquence, ou le fixer à 200 si l'on préfère un plafond de stockage. L'affichage fidèle montre `100 % + totalExpGainPct` (plafond « 300 % »). Impact réel faible (il faut plusieurs centaines de repas), mais le moteur affirme aujourd'hui ×4.

### P2 — Cuisine : `invCookCheck` (plafond 1,5 et comptage par spec)
`idleCookingGearV1` / `idleCookingTotalBonusesV1` (cooking:308-339) : compter chaque entrée `cookingPct` des 3 emplacements de specs de l'objet (et non 1 par objet), jambes ×2, puis
```js
const gearMultiplier = Math.min(1.5, Math.max(1, Math.pow(C.gearMultiplierPerPiece, gear.count)));
```
Le plafond s'applique à ce seul facteur (les ×1,2 / ×1,2 / ×1,1 se multiplient ensuite, comme dans `totalCookingBonuses`). Il faut pour cela connaître le nombre de specs `cookingPct` par objet (`SET_ITEM_SPECIALS_V1` liste déjà des paires, `IDLE_ADVENTURE_SPECIALS` a `sType` + `sExtra`) : remplacer `aUnSpecialCooking` (booléen) par un compteur.

### P2 — Cartes : souhaits 229 / 230 inversés
Dans `IDLE_CARDS_WISH_EFFECTS_V1` (cards:416-417) : jeu = `minChonkerMana = 21 + niveau(229)`, `maxChonkerMana = 29 + niveau(230)`. Remplacer
`229: … bonus: { chonkerMayoMax: 1 }` par `bonus: { chonkerMayoMin: 1 }` et `230: … bonus: { chonkerMayoMin: 1 }` par `bonus: { chonkerMayoMax: 1 }` (et le commentaire cards:57-60, ainsi que `tests/idle-cards-v1.test.mjs` / `idle-wiki-table-cards.test.mjs` s'ils figent l'ancien sens). Sans effet une fois les deux souhaits au niveau 5 (26-34).

### P3 — Cartes : première carte offerte au déblocage
Le jeu appelle `addCard()` quand le cœur est mangé. À la transition `systems.cards.unlocked` false → true (là où le déblocage par `stillBeatingHeart` est détecté), appeler `data.deck.push(idleCardsCreateCardV1(state, {…}))` une fois (sans test d'End card).

### P3 — Cartes : THE END
Retirer les deux gardes que le jeu n'a pas (`!idleTheEndHasV1(…, 492)` et `!deck.some(theEnd)`) si l'on veut la parité stricte (cards:780) ; ajouter le refus « place libre dans l'inventaire » au `cast` d'une carte THE END. À arbitrer avec le groupe The End (décision de design de SOREAL possible).

### P3 — Cartes : lecture brute des niveaux hors vitesses
`idleCardsModifiersV1` : pour les clés qui ne sont pas `cardSpeedPct` / `mayoSpeedPct`, lire les niveaux bruts (`state.systems.perks.data.levels`, `…quirks…`, souhaits non filtrés) au lieu de `idlePerkNiveauxV1`. Sans effet tant que le joueur ne rétrograde pas de difficulté.

### P3 — Divers négligeables
Reste de progression de mayo perdu au passage à 1 (`Mana.progress = 0`) ; `cardSpawnTimer.reset()` jette le dépassement en ligne ; durée de potion Mayo `< 5 s` remise à zéro après hors ligne ; étiquette « Chonker » (rareté 7) au lieu de « Hot Damn ». Aucun effet de jeu mesurable.

## 3. Ce qui n'a pas pu être vérifié

- **Tables de données de scène** (`level0`, valeurs sérialisées Unity, non lues) : pour les 56 perks Itopod 161-216, les quirks 99-169 et les souhaits 115-230 liés aux Cartes : coûts, niveaux maximum (`maxLevel`), `effectPerLevel` (0,5 % / 0,4 % / 0,3 % des vitesses, 0,05 % / 0,04 % de l'effet des tags, etc.), et `difficultyRequirement`. Seuls les **ids** et la **structure** des formules ont été confirmés dans l'IL ; les valeurs numériques correspondantes dans `idle-cards-v1.js` restent celles du wiki (non confrontées au jeu).
- Mapping nom de set ↔ champ du jeu : `rock` ↔ `rockLobsterComplete`, `rad` ↔ `radComplete`, `amalgamate` ↔ `amalgamateComplete`, `duck` ↔ `duckComplete`, `disco` ↔ `that70sComplete`, Rainbow Heart ↔ `rainbowHeartComplete`, Blue Heart ↔ `blueHeartComplete`, Bread ↔ `breadverseComplete`, Space ↔ `spaceComplete`, Still-Beating Heart ↔ `beatingHeartComplete` : supposés par le nom, non recoupés avec `ItemList` (hors groupe).
- Fruits de Mayo (`FruitController::consumeMayoFruit1..6`, 5076-5081, qui écrivent `Mana.progress`) : groupe Yggdrasil, non lus ici ; `idleCardsMayoFruitProgressV1` n'a donc pas été confronté.
- Conditions d'obtention des cartes de Cuisine hors cuisine : déblocage de Cooking par la mort d'IT HUNGERS (`zone34Drop`, 522) lu mais comparé seulement au nom (groupe Titans).
- Les `calculate*` des cibles consommatrices (NGU, Augments, TM, Hacks, Wishes, Daycare, loot, or, PP, QP, stats d'aventure) : seuls les **index de type** de `getBonus` ont été vérifiés (tableau §1.2), pas le reste de ces formules (autres groupes).
- Le RNG à graine sauvegardée du jeu (`cardState`, `chonkerState`, `lootState`) : sans effet sur les lois de tirage, non reproduit.
- Le chiffrage « 14 specs pour atteindre 1,5 » est un calcul simple (1,03^n), pas une mesure sur objets réels.
