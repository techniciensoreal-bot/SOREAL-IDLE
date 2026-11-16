# Audit code du jeu (build 1260) contre moteur SOREAL : groupe « boutiques »

Source : IL de `Assembly-CSharp.dll` (outils `m.mjs` / `d.mjs` / `g.mjs`), classes `ArbitraryController` (308 méthodes, boutique AP), `AllArbitraryController`, `AdventurePurchases`, `EnergyPurchases`, `MagicPurchases`, `Resource3Purchases`, `StatBoostPurchases`, `MiscPurchases`, `YggdrasilEXPPurchases`, plus les lecteurs des effets (`Character::total*`, `InventoryController`, `CardsController`, etc.).
Moteur : `cloudflare/src/idle-sellout-shop-v1.js` (boutique AP : coûts, effets, potions), `idle-ngu-actions.js` (boutique EXP `IDLE_NGU_EXP_SHOP_V1`, Rich Jerks), `idle-ngu-catalogues.js` + `idle-ngu-snapshot.js` (achats Energy/Magic/R3), `idle-yggdrasil-extra-v1.js` (Auto-Activate), `idle-hearts-v1.js`, `idle-ngu-systemes.js`.
Aucun fichier du dépôt n'a été modifié, sauf ce rapport. Méthodes lues ou balayées : environ 395 (dont les ~80 `start*AP` de `ArbitraryController`, balayées par extraction des gardes et messages, pas désassemblées une à une).

Convention : « Sellout : xxx » = entrée du catalogue `IDLE_SELLOUT_SHOP_CATALOG_V1` de `idle-sellout-shop-v1.js` (ligne indiquée entre parenthèses quand utile). Dans le jeu, les valeurs de `AdventurePurchases`, `EnergyPurchases`, `MagicPurchases`, `Resource3Purchases`, `MiscPurchases`, `StatBoostPurchases` viennent des initialiseurs du `.ctor` (valeurs par défaut du code) ; la scène Unity peut les surcharger (voir section 3).

---

## 1. Tableau méthode du jeu / équivalent SOREAL / verdict

### 1.1 `ArbitraryController` : coûts AP (la méthode `cost` (999) aiguille par `id` vers ces méthodes)

| Méthode du jeu (id) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| energyPotion1Cost (732) | Sellout energyPotionAlpha (l.40) | CONFORME | 5000 (plancher 0) = 5000 |
| energyPotion2Cost (733) | energyPotionBeta (l.41) | CONFORME | 10000 |
| energyPotion3Cost (734) | energyPotionDelta (l.42) | CONFORME | 100000 |
| magicPotion1/2/3Cost (735-737) | magicPotionAlpha/Beta/Delta (l.43-45) | CONFORME | 5000 / 10000 / 100000 |
| res3Potion1Cost (738) | resource3PotionAlpha (l.46) | CONFORME | 4000 |
| res3Potion2Cost (739), res3Potion3Cost (740) | resource3PotionBeta/Delta (l.47-48) | CONFORME | 40000 et 40000 |
| energyBarBar1Cost (741), magicBarBar1Cost (742) | energyBarBar / magicBarBar (l.49-50) | CONFORME (défaut du .ctor) | champ `baseEnergyBarBar1Cost` = 10000 dans `ArbitraryController::.ctor` (1038) ; SOREAL 10000 |
| lootCharm1Cost (743) | luckyCharm (l.63) | CONFORME (défaut du .ctor) | `baselootCharm1Cost` = 5000 ; SOREAL 5000 |
| lootCharm2Cost (787) | superLuckyCharm (l.64) | CONFORME | 50000 |
| energyCapCost (744), magicCapCost (745) | aucun (non utilisées : pas dans le `switch` de `cost`) | SANS OBJET | 7500, jamais appelées par `cost` |
| lootFilterCost (746) | improvedLootFilter (l.69) | CONFORME | 100000 |
| autoBoostMergeCost (747) | autoMergeBoostTimers (l.71) | CONFORME | 100000 |
| instaTrainCost (748) | instaTrainingCap (l.72) | CONFORME | 10000 |
| exp500Cost (749), exp200Cost (750), exp2KCost (751) | exp500, exp200, exp2000 (l.141-143) | CONFORME | 100000 / 40000 / 400000 ; effet +500 / +200 / +2000 EXP (`Character::addExp`) identique |
| heartCost (752) | heartRed (l.129) | CONFORME | 225000 |
| customPercentSet1Cost (753) | customEnergyMagicButtons (l.73) | CONFORME | 25000 |
| customPercentSet2Cost (754) | moreCustomEnergyMagicButtons (l.74) | **ÉCART** | jeu 100000, SOREAL 80000 |
| customIdlePercentSet1Cost (755) | customIdleEnergyMagicButtons (l.92) | CONFORME | 125000 |
| res3PercentSet1Cost (756) | customResource3Button (l.99) | CONFORME | 50000 |
| res3PercentSet2Cost (757) | anotherCustomResource3Button (l.100) | CONFORME | 150000 |
| res3IdlePercentSet1Cost (758) | customIdleResource3Button (l.101) | CONFORME | 150000 |
| nguCapModifierCost (759) | nguCapModifier (l.97) | CONFORME | 100000 |
| addPoints (760) | `state.currencies.ap` (crédit) | NON VÉRIFIÉ ici | ajoute à `curArbitraryPoints` et `lifetimePoints` ; formule des AP gagnés = autre groupe |
| yellowHeartCost (761) | heartYellow (l.130) | CONFORME | 150000 |
| inventoryCost (762) | extraInventorySpace (l.70) `linearCappedCost(3000,100,10000)` | CONFORME sans le pack de départ | jeu : `3000 + inventorySpaces*100`, moins 1200 si `boughtNewbiePack` (starter pack), plafonné à 10000 ; SOREAL : mêmes nombres, sans la remise de 1200 (pack absent) |
| maxSpaces (763) | `max: 166` (l.70) | CONFORME | 166 |
| maxLoadoutSpaces (764) | loadoutSlot `max: 7` | CONFORME | 7 |
| maxBeardSpaces (765) | extraBeardSlot `max: 4` | CONFORME | 4 |
| maxDiggerSpaces (766) | diggerSlots `max: 6` | CONFORME | 6 |
| maxMacguffinSpaces (767) | macguffinSlot `max: 11` | CONFORME | 11 |
| maxInvMergeSpaces (768) | inventoryMergeSlots `max: 4` | CONFORME | 4 |
| maxDeckSpaces (769) | extraDeckSize `max: 50` | CONFORME | 50 |
| maxMayoGenSlots (770) | mayoGenerator `max: 2` | CONFORME | 2 |
| starterPackCost (771) + buyStarterPackAP (883) | aucun | **ABSENT** | 75000 AP : +500 EXP, +5 espaces d'inventaire (borné à 166), `hasStarterPack` (achat unique), et baisse de 1200 AP du prix des espaces suivants |
| acc4Cost (772), acc5Cost (773) | extraAccessorySlot1/2 (l.83, l.85) | CONFORME | 225000 chacun |
| acc6Cost (774), acc7Cost (775) | extraAccessorySlot3/4 (l.91, l.94) | CONFORME | 500000 chacun |
| acc8Cost (776) | extraAccessorySlotEvil (l.116) | CONFORME | 500000, achat refusé si `rebirthDifficulty < 1` (Evil) ; SOREAL `minDifficulty: "difficile"` |
| acc9Cost (777) | extraAccessorySlot5 (l.122) | **ÉCART** | jeu 675000 et achat refusé en Normal (`rebirthDifficulty < 1`, comme acc8) ; SOREAL 750000 et aucune condition de difficulté |
| poop1/10/100Cost (778-780) | icarusFertilizer1/10/100 (l.54-56) | CONFORME | 3000 / 25000 / 225000 ; +1/+10/+100 poop (`poop1Count`) |
| yggdrasilReminderCost (781) | yggdrasilHarvestLight (l.75) | CONFORME | 50000 |
| extendedSpinBankCost (782) | dailySpinTimeBank (l.76) | CONFORME | 100000 ; effet 36 h (129600 s) vers 7 j (604800 s) dans `DailyRewardController::maxSpinTime` (2971) = SOREAL |
| loadoutSlotCost (783) | loadoutSlot (l.77) `linearCappedCost(50000,10000,Infinity)` | CONFORME | `50000 + curLoadoutSlots*10000` |
| beardSlotCost (784) | extraBeardSlot (l.78) `tieredCost([110000,225000,...])` | CONFORME | `beardSlots >= 1 ? 225000 : 110000` |
| diggerSlotCost (785) | diggerSlots (l.86) | CONFORME | idem 110000 puis 225000 |
| infinityCubeFilterCost (786) | filterBoostsIntoCube (l.79) | CONFORME | 15000 |
| heartBrownCost (788), heartGreenCost (789), heartBlueCost (790), heartPurpleCost (791), heartGreyCost (792), heartOrangeCost (793) | heartBrown/Green/Blue/Purple/Grey/Orange (l.131-136) | CONFORME | 225000 chacun |
| heartPinkCost (794) | heartPink (l.137) | **ÉCART** | jeu 175000, SOREAL 225000 |
| heartRainbowCost (795) | heartRainbow (l.138) | CONFORME | 500000 |
| daycareSpeedCost (796) | daycareSpeedBoost (l.84) | CONFORME | 125000 ; effet `hasDaycareSpeed` : `daycareTime` x0,9 (`AllDaycareController::daycareTime`, 3293) = `selloutSpeedBoost ? 0.9 : 1` (idle-daycare-v1.js:418) |
| pill1/10/100Cost (797-799) | littleBluePill1000/10000/100000 (l.57-59) | CONFORME | 2500 / 20000 / 175000 ; +1000 / +10000 / +100000 `buffedKills` |
| lazyITOPODCost (800) | lazyItopodFloorShifter (l.80) | CONFORME | 225000 |
| macguffinSlotCost (801) | macguffinSlot (l.87) | CONFORME | `macguffinSlots < 2 ? 100000 : 225000` |
| remainingInvCost (802) | aucun (achat « x10 / tout » d'inventaire) | ABSENT (confort d'interface) | somme des coûts successifs de n espaces (+100 chaque, plafond 10000), pas de règle de jeu en plus |
| macguffinBooster1Cost (803) | macguffinMuffin (l.51) | CONFORME | 50000 |
| beastButter1/10/100Cost (804-806) | beastButter1/10/100 (l.60-62) | CONFORME | 10000 / 90000 / 800000 |
| questLightCost (807) | questReminder (l.88) | CONFORME | 50000 |
| fasterQuests1Cost (808) | fasterQuesting (l.89) | CONFORME | 250000 |
| extendedQuestBankCost (809) | extendedQuestBank (l.90) | CONFORME | 125000 |
| PP25Cost (810), PP100Cost (811), PP500Cost (812) | pp25, pp100, pp500 (l.144-146) | CONFORME | 100000 / 400000 / 2000000 ; +25/+100/+500 `perkPoints` |
| autoNukeCost (813) | autoNuker (l.93) | CONFORME | 65000 |
| daycareArtCost (814) | daycareKittyArt (l.98) | CONFORME | 250000 |
| res3NameGenratorCost (815) | resource3NameRandomizer (l.102) | **ÉCART** | jeu 85000, SOREAL 100000 |
| fasterWishesCost (816) | fasterWishes (l.103) | CONFORME | 250000 |
| invMergeSlotCost (817) | inventoryMergeSlots (l.104) `tieredCost` | CONFORME | `invMergeSlots` 0..3 : 50000 / 150000 / 250000 / 500000 |
| advLightCost (818) | adventureLight (l.105) | CONFORME | 75000 |
| advAdvancerCost (819) | adventureAdvancer (l.106) | CONFORME | 65000 |
| goToQuestCost (820) | goToQuestZoneButton (l.107) | CONFORME | 100000 |
| mayoGenCost (821) | mayoGenerator (l.120) | CONFORME | 250000 |
| tagSlotCost (822) | extraTagSlot (l.121) | CONFORME | 250000 |
| deckSizeCost (823) | extraDeckSize (l.119) | CONFORME | 25000 |
| cardTierConsumableCost (824) | regularBlackPens (l.66) | CONFORME | 40000 ; +25 stylos (`cardTierUpperCount += 25`), chacun +2 tiers sur la carte suivante (`CardsController::generateCard`, 1657) = `blackPens` |
| mayoSpeedConsumableCost (825) | mayoInfuser (l.65) | CONFORME | 40000 |
| (foil) startFoilUnlockAP (993) / buyFoilUnlockAP (994) | aucun (carte « foil » ~1 % toujours possible, `idle-cards-v1.js:133`) | ABSENT | `boughtFoils` conditionne `CardsController::generateCardType` ; aucun coût dans le `switch` de `cost` (non achetable en AP) |

### 1.2 `ArbitraryController` : achats (`buy*AP`, effets) et utilisation

| Méthode du jeu (id) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| buyEnergyPotion1AP/2AP/3, buyMagicPotion1AP/2AP/3, buyRes3Potion1/2/3 (827-843) | `idleSelloutApplyEffectV1` -> valise (`IDLE_POTIONS_STOCK_V1`) | CONFORME (stock) | le jeu aussi range d'abord (`*Count += 1`), l'utilisation est séparée |
| buyLootCharm1AP, buyLootCharm2AP (845, 913), buyEnergyBarBar1AP, buyMagicBarBar1AP (847, 849), buyMacguffinBooster1AP (940), buyMayoSpeedConsumableAP (988) | idem | CONFORME | compteurs +1 |
| buyLootFilterAP, buyAutoBoostMergeAP, buyInstaTrainAP (851-855) | drapeaux passifs | CONFORME | `lootFilter`, `improvedAutoBoostMerge`, `instaTrain` = 1 |
| buy500ExpAP, buy200ExpAP, buy2KExpAP (857-861) | `item.grant` EXP | CONFORME | `Character::addExp(500/200/2000)` ; SOREAL ajoute à `currencies.experience` directement (pas d'EXP bonus ici dans les deux cas : à confirmer côté `addExp` = autre groupe) |
| buyHeartAP et 9 autres coeurs (863, 877, 915, 919, 928, 936, 938, 954, 974, 992) | `idleHeartsBuyV1` -> `deps.createItem(heart.id, 0)` (`idle-hearts-v1.js`) | **ÉCART** | jeu : `ItemNameDesc::makeLevelledLoot(id, 10)` : l'objet arrive au **niveau 10** (ids 119, 129, 162, 171, 196, 212, 297, 293, 344, 390 = `wikiId` SOREAL). SOREAL : niveau 0. Le jeu refuse aussi si inventaire plein ou si le loot filter bloque l'objet |
| startHeartGreyAP (937), startHeartPinkAP (973), startHeartRainbowAP (991) (gardes) | `requiresR3` seulement pour Grey | **ÉCART mineur** | jeu : Grey exige `res3On` ; Pink exige `res3On` ET `wishesOn` ; Rainbow exige `cardsOn`. SOREAL : seul Grey est gardé (Pink et Rainbow dépendent seulement de la visibilité anti-spoil) |
| buyCustomPercent1/2AP, buyCustomIdlePercent1AP, buyRes3Percent1/2AP, buyRes3IdlePercent1AP (865-875) | drapeaux passifs (`modules/perso-boutons-v1.js`) | CONFORME (drapeaux) | `hasCustom{Energy,Magic}Percent1/2` (deux flags énergie+magie ensemble), `hasCustomRes3Percent1/2`, `hasCustomIdle*` |
| buyInventoryAP (879) | extraInventorySpace | CONFORME | `inventorySpaces += 1` |
| buy10InventoryAP (881) | aucun | ABSENT (confort) | +10 espaces pour `remainingInvCost(10)` |
| buyAcc4AP..buyAcc9AP (885-895) | extraAccessorySlot1..5 + Evil | CONFORME | `hasAccN = 1` ; `InventoryController::accessorySpaces` (3576) = 2 de base + `hasAcc3` (EXP) + `hasAcc4` + `hasAcc5` (AP) + `Purchases.hasAcc5` (EXP) + `hasAcc6..hasAcc9` : 6 emplacements AP + 2 EXP, comme SOREAL |
| buyPoop1/10/100AP (897-901) | `poop` | CONFORME | +1/+10/+100 |
| buyYggReminderAP, buyExtendedSpinBankAP, buyCubeFilterAP, buyDaycareSpeedAP, buyLazyITOPODAP, buyAutoNukeAP, buyDaycareArtAP, buyNGUCapModifierAP, buyRes3NameGeneratorAP, buyAdvLightAP, buyGoToQuestAP, buyQuestLightAP, buyFasterQuests1AP, buyExtendedQuestBankAP, buyFasterWishAP (903-980) | drapeaux passifs | CONFORME | un drapeau chacun |
| buyAdvAdvancerAP (978) | adventureAdvancer | **ÉCART mineur** | achat pose aussi `Adventure.didAdvAdvance = 1` : pas de saut de zone avant le Rebirth suivant. SOREAL : `adv.advancerRun !== run` donc il peut sauter juste après l'achat (voir 1.4) |
| buyLoadoutSlotAP, buyBeardAP, buyDiggerSlotAP, buyMacguffinSlotAP, buyInvMergeSlotAP, buyDeckSlotAP, buyMayoGenAP, buyTagSlotAP (907-986) | compteurs | CONFORME | +1 compteur |
| startMacguffinSlotAP (933), startMacguffinBooster1AP (939) | `macguffinUnlockedV1` | **ÉCART mineur** | jeu : succès n° 145 obligatoire ; SOREAL : visibilité par déblocage des MacGuffins |
| startBeardAP (908), startDiggerSlotAP (931), startInvMergeSlotAP (971), start25/100/500ppAP (955-959), startFasterWishAP (969), startNGUCapModifierAP (965), startDeckSlot/MayoGen/TagSlot/MayoSpeed/CardTier (981-989), startBeastButter/QuestLight/FasterQuests/ExtendedQuestBank/GoToQuest (941-951, 979) | anti-spoil par système découvert | CONFORME (esprit) | le jeu refuse l'achat tant que `beardsOn`, `diggersOn`, `hasAutoMerge`, `itopodOn`, `wishesOn`, `nguOn`+`beastOn`, `cardsOn`, `beastOn` ne sont pas vrais ; SOREAL masque les articles (règle n° 2) mais le serveur n'impose pas toujours le même prérequis lors d'un appel direct |
| buyPill1/10/100AP (922-926) | `bluePills` | CONFORME | +1000 / +10000 / +100000 `buffedKills` |
| buyMacguffinBooster1AP (940) | macguffinMuffin | CONFORME | compteur |
| buyBeastButter1/10/100AP (942-946) | beastButter | CONFORME | +1 / +10 / +100 |
| buy25ppAP, buy100ppAP, buy500ppAP (956-960) | `grant` PP | CONFORME | `perkPoints += 25/100/500` |
| useEnergyPotion1 (1006) | `idleSelloutUsePotionV1`, timer `energyPower` 3600 | CONFORME | `energyPotion1Time.advanceTime(3600)` |
| useEnergyPotion2 (1008) | `beta.energyPower` | CONFORME | drapeau `energyPotion2InUse`, refusé si déjà actif, remis à 0 à chaque Rebirth (`AllArbitraryController::reset` 721 appelé par `Character::resetAll`/`Rebirth::engage`) = `idle-ngu-actions.js:652` |
| useEnergyPotion3 (1010) | `energyPotionDelta` `{timer:"energyPower", sec:86400}` | CONFORME | ajoute 86400 au MÊME minuteur que alpha (`energyPotion1Time`) |
| useMagicPotion1/2/3 (1012-1016), useRes3Potion1/2/3 (1018-1022) | idem | CONFORME | 3600 / bêta / 86400 sur `magicPotion1Time` et `res3Potion1Time` |
| useLootCharm1 (1024), useLootCharm2 (1030) | luckyCharm / superLuckyCharm `{timer:"luck"}` | CONFORME | 1800 s et 43200 s ajoutés à `lootcharm1Time` (même minuteur) |
| useEnergyBarBar1 (1026), useMagicBarBar1 (1028) | energyBarBar / magicBarBar | CONFORME | 3600 s |
| useMacguffinBooster1 (1032) | macguffinMuffin `{timer, arm}` | CONFORME | +86400 s et `macGuffinBooster1InUse = true` ; effet actif si minuteur > 0 OU `InUse`, remis à faux au Rebirth |
| useMayoSpeedPot (1034) | mayoInfuser | CONFORME | 86400 s |
| startUse* (1005-1033) | `usePotion` | CONFORME | refus si compteur 0 ; bêta refusée si déjà active |
| updateMenu / updatePill / updateSpecial / useStatus / count / shouldDisableBuyButton / displayTooltip / OnPointer* / dosellout / Start / cancel / buyAP / start*AP (UI) | - | IGNORÉ (interface) | `shouldDisableBuyButton` confirme les plafonds (166, 7, 4, 6, 11, 4, 50, 2) |

### 1.3 `AllArbitraryController` et lecteurs de potions

| Méthode du jeu (id) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| potionModifier (724) | `idleSelloutPotionFactorV1` (`idle-sellout-shop-v1.js:337`) | CONFORME | 2, x1,1 avec Blue Heart (set) : 2,2 = `base * k`, k = `1 + consumablesEffectPct` |
| res3PotionModifier (725) | idem, `base = 3` si `key === "r3Power"` | CONFORME | 3 (3,3 avec Blue Heart) pour alpha et delta ; la bêta R3 utilise `potionModifier` (x2) dans `Character::totalRes3Power` (2150) = `beta ? 2*k : 1` |
| pillModifier (726) | `pillFactor = 2 * idleHeartsConsumableFactorV1` (`idle-ngu-systemes.js:~958`) | CONFORME | x2 / x2,2 ; appliqué seulement si `buffedKills > 0` ET réglage `buffedKillsOn` (`ItopodPerkController::totalPPBonus` 330) ; SOREAL n'a pas de réglage d'extinction (voir 2.14) |
| poopModifier (727) | `IDLE_YGG_POOP_FACTOR_V1 = 1.5` x `consumable` | CONFORME | 1,5 / 1,65 |
| butterModifier (728) | `beastButter` (idle-questing-v1.js) | CONFORME (déjà couvert par le groupe quêtes) | x2 / x2,2 ; `questRewardFactor` (1250) multiplie si `usedButter` ; `FruitController::consumeQPFruit` (5075) DIVISE par `butterModifier` (le fruit de quêtes ne profite pas du beurre) : à vérifier côté SOREAL (hors groupe) |
| updateSpecialItems (720) | `tickSelloutEffectsV1` (`idle-sellout-shop-v1.js:409`, appelé par `idle-ngu-systemes.js:1426`) | **ÉCART** | jeu : tous les minuteurs (potion alpha/delta énergie, magie, R3, charme, bar bars, muffin, mayo) baissent de `deltaTime` UNIQUEMENT quand le jeu tourne. SOREAL décompte `secs` y compris hors ligne (voir 2.6) |
| reset (721) | `idle-ngu-actions.js:652`, `consumeMuffin` | CONFORME | les 3 bêtas et `macGuffinBooster1InUse` remis à faux au Rebirth |
| Update (719), updateMenu (722), updateText (723) | - | IGNORÉ (UI) | - |
| `Character::totalEnergyPower` (2142) | `idleNguEffectiveResourceStatV1` (`idle-ngu-ressources.js:216`) | CONFORME | plafond `hardCapPowBar` (1e18) AVANT les potions, puis x`potionModifier` (alpha ou delta) et x`potionModifier` (bêta) ; SOREAL : `value / potion > hard ? hard * potion : value` équivalent |
| `Character::totalEnergyBar` (2143), `totalMagicBar` (2147) | idem (`energyBars`, `magicBars`) | CONFORME à une troncature près | x`potionModifier` après plafond puis `conv.i8` (troncature) puis minimum 1 ; SOREAL ne tronque pas (écart d'au plus 1 unité) |
| `Character::totalMagicPower` (2146), `totalRes3Power` (2150) | idem | CONFORME | même ordre |
| `Character::lootFactor` (2153) | `luck` dans `idle-ngu-bonus.js:934` | CONFORME | x`potionModifier` si `lootcharm1Time > 0`, en dernier |
| `CardsController::totalMayoSpeed` (1785) | `idle-cards-v1.js:~762` | CONFORME | x`potionModifier` si `mayoSpeedPotTime > 0` ; le minuteur baisse aussi hors ligne (`cardsOfflineProgress` appelle `removeTime`) |
| `InventoryController::macGuffinBonusTimeFactor` (3694) | `macguffinApplyRebirthV1` (`idle-macguffins-v1.js:~740`) | CONFORME | x`potionModifier` si minuteur > 0 ou `InUse` ; `addOfflineProgress` (2231) décompte AUSSI le minuteur du Muffin hors ligne (plancher 0) |
| `Character::addOfflineProgress` (2231) | tick des minuteurs | **ÉCART** | seul `macGuffinBooster1Time` est décrémenté hors ligne ; les fonctions `*OfflineProgress` (ex. `nguOfflineProgress` 2248) divisent la progression par `potionModifier` quand un minuteur de potion est actif : hors ligne, les potions n'augmentent rien et leur durée est conservée |

### 1.4 Autres lecteurs d'effets AP

| Méthode du jeu (id) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| `BeastQuestController::timerThreshold` (1224) | `idleQuestMajorIntervalSecondsV1` | CONFORME | 28200, `hasFasterQuests` x0,8 (troncature entière), fad x0,9 ; déjà mesuré par le banc |
| `BeastQuestController::maxBankedQuests` (1222) | `idleQuestBankCapV1` | CONFORME | base + 40 (10 -> 50) |
| `WishesController::totalWishSpeedBonuses` (4907) | `fasterWishes` | CONFORME | x1,25 multiplicatif |
| `DailyRewardController::maxSpinTime` (2971) | `spinDaily` | CONFORME | 129600 -> 604800 |
| `InventoryController::autoMergeTime / autoBoostTime` (3585, 3586) | `inventoryAutoEnvV1` `timerMultiplier` | CONFORME | 3600 x (1 - 0,1 x complétions) x 0,5 |
| `InventoryController::loadoutSpaces` (3584) | `idleInventoryLoadoutSlotsV1` | CONFORME (supposé) | AP + 2 (EXP) + 1 (EXP), plafond 10 ; fonction SOREAL non relue |
| `InventoryController::macguffinSpaces` (3577) | `macguffinSlotCountV1` | CONFORME | 1 + AP + EXP x2 + sets/perks |
| `InventoryController::totalInvMergeSlots` (3665) | `inventoryMergeSlots` | CONFORME | EXP + AP + quirk 55 + perks 111/112, plafond 10 |
| `CardsController::maxDeckSize` (1644) | `extraDeckSize` | CONFORME | 10 de base + `deckSpaceBought` (50 max) |
| `CardsController::maxTagSize` (1646) | `extraTagSlot` | CONFORME | +1 |
| `CardsController::maxManaGenSize` (1647) | `mayoGenerator` | CONFORME | 1 + `mayoGenSlots`, borné 1..6 ; vitesse x(1 + (taille-1) x 0,02) |
| `AllBeardsController::capBeards` (1132), `AllGoldDiggerController::maxDiggerSlots` (3104) | `beardSlot`/`diggerSlot` | CONFORME | 1 + EXP + AP + autres |
| `AllDaycareController::daycareTime` (3293) | `daycareFactorsV1` | CONFORME (partie boutique) | x0,9 |
| `BossController::Update` (1540) + `autoNukeThreshold` (1541) + `Rebirth::resetBoss` (2716) | `autoNukeDueIdleV1_` (`ui-combat-2-v1.js:733`) | CONFORME | minuteur remis à 50 au Rebirth, seuil 60 s : 1er nuke à 10 s, puis toutes les 60 s |
| `AdventureController::Update` (135), partie `advAdvancerBought` | `advanceAdventureAdvancerV1` (`idle-ngu-systemes.js:1053`) | **ÉCART mineur** | jeu : seulement quand `rebirthTime` est entre 20 s et 30 s, une seule fois par Rebirth (`didAdvAdvance`), via `goToMaxZone(advAdvancerZone)` ; SOREAL : dès 20 s sans borne haute |
| `Rebirth::instaTrain` (2676) | `instaTrainingCapSorealIdle_` (`idle-runtime-actions.js:1349`) | **ÉCART** | jeu : si `capEnergy >= 12` : `curEnergy += 12`, `attackEnergy[0] = 6` ET `defenseEnergy[0] = 6`. SOREAL : 6 en Attaque passive ; 6 en Blocage SEULEMENT si la « Synchro Basic Training » (achat EXP propre à SOREAL) est possédée ; pas de +12 d'énergie hors défi |
| `Rebirth::engage` (2674), `res3NameGeneratorBought` | `advanceR3NomV1` | CONFORME | tirage au Rebirth si option cochée |
| `ItopodPerkController::totalPPBonus` (330) | pills | CONFORME | voir `pillModifier` |
| `AdventureController::playerDeath/enemyDeath/updateShifterUI` (`boughtLazyITOPOD`) | `towerAppliquerEtageOptimalV1` | NON VÉRIFIÉ (hors groupe : seul le drapeau est lu ici) | - |

### 1.5 `AdventurePurchases` (boutique EXP, onglet Adventure)

Valeurs des `.ctor` (2368) = défauts du code.

| Méthode du jeu (id) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| attack1/10/100/1000/10K Cost, buy1/10/100/1000/10KAttack (2286-2295), defense idem (2296-2305) | `adventurePower` / `adventureToughness` (`idle-ngu-actions.js:1001`) `cost 3, gain 1` | CONFORME | 3 / 30 / 300 / 3000 / 30000 EXP pour +1 / +10 / +100 / +1000 / +10000 (3 EXP par point) |
| hp10/100/1K/10K/100KCost, buy10HP..buy100KHP (2306-2315) | `adventureHp` `cost 3, gain 10` | CONFORME | 3 EXP pour +10 PV max |
| hpRegen1..10KCost, buy1HPRegen..buy10KHPRegen (2316-2325) | `adventureRegen` `cost 50, gain 1` | CONFORME | 50 EXP par +1 regen |
| customPowerCost (2352), customToughnessCost (2353), buyCustomPower/Toughness (2361, 2363) | achat par quantité | CONFORME | `n x 3` ; plafond float 3,4e38 |
| customHPCost (2354), buyCustomHP (2365) | `adventureHp` x quantité de lots de 10 | CONFORME avec réserve | jeu : `n x 3 / 10` en division entière : un achat de n PV non multiple de 10 est moins cher (1 PV = 0 EXP) ; SOREAL n'achète que des lots de 10 PV pour 3 EXP |
| customRegenCost (2355), buyCustomregen (2367) | `adventureRegen` | CONFORME | `n x 50` |
| invSpaceCost (2284), addInventorySpace/buyInventorySpace (2326-2327) | `inventorySpace` `cost: (n) => n+25<=36 ? 2 : 4*(24+n-35)`, `max 36` | CONFORME | `spaces < 24 : 0`, `24 <= spaces < 36 : 2`, sinon `(spaces-35) x 4`, plafond 60 espaces = 36 achats ; mêmes valeurs aux deux bords |
| filterCost 20, addFilter/buyFilter (2328-2329) | `basicLootFilter` 20 | CONFORME | `hasFilter` |
| acc3Cost 3000, addAcc3/buyAcc3 (2330-2331) | `accessorySlot1` 3000 | CONFORME | `hasAcc3` |
| acc5Cost 30000, addAcc5/buyAcc5 (2338-2339) | `accessorySlot2` 30000 | CONFORME | `Purchases.hasAcc5` |
| recycleCost 100, addRecycleBoost/buyRecycleBoost (2332-2333) | `boostRecycling` `cost 100, gain 10, max 5` | CONFORME | +0,1 par achat, plafonné à 0,5 |
| autoMergeCost 200, addAutoMerge/buyAutoMerge (2334-2335) | `autoMerge` 200 | CONFORME | `hasAutoMerge` |
| currentCombineCost (2279), addCombineBoost/buyCombineBoost (2336-2337) | aucun | SANS OBJET dans le jeu | `max(10, combineCost x boostCombineLevel^2)`, niveau plafonné à 50 : `boostCombineLevel` n'est lu par AUCUNE autre méthode (seulement `buyCombineBoost`, `currentCombineCost`, `Purchases::.ctor`, `ImportExport::loadData`) : achat sans effet de gameplay, rien à porter |
| loadout1Cost 1000 / loadout2Cost 10000 (2340-2343) | `loadoutSlots` 1000 (+2), `loadoutSlot3` 10000 (+1) | CONFORME | `hasloadout1` donne +2, `hasloadout2` +1 |
| daycareUnlockCost 250, daycareSlot2Cost 25000, daycareSlot3Cost 500000 (2344-2349) | `daycareSlot1/2/3` | CONFORME (coûts) / **ÉCART mineur** (prérequis) | les slots 2 et 3 exigent `hasDaycare` (« You have to buy the daycare first ») ; `buyExpShopV1` ne vérifie aucun prérequis |
| invMergeUnlockCost 1000 (2350-2351) | `inventoryMergeSlot` 1000 | CONFORME (coût) / **ÉCART mineur** (prérequis) | exige `hasAutoMerge` ; refuse si déjà acheté ; SOREAL : pas de prérequis serveur |
| updateAdventureStats (2285), Awake, Start, refresh, cancel, update*Input, try* | - | IGNORÉ (UI) | - |

### 1.6 `EnergyPurchases` / `MagicPurchases` / `Resource3Purchases` (onglets Spend EXP)

| Méthode du jeu (id) | Équivalent SOREAL (`IDLE_NGU_RESOURCE_PURCHASES`, `idle-ngu-catalogues.js:49`; `buyResource`, `idle-ngu-snapshot.js:467`) | Verdict | Détail |
|---|---|---|---|
| energySpeed10Cost (2384), energySpeed100Cost (2385), buyEnergySpeed10/100 (2389, 2391) | `energy.speed cost 2, gain 0.1, hardCap 50, bulkTiers [1,10]` | CONFORME | tant que vitesse < 50 : 2 EXP par +0,1 ; 20 EXP par +1 ; achat refusé dès 50 (les paliers 20/200 pour vitesse >= 50 sont inatteignables) ; le jeu arrondit à 50 entre 49,91 et 50 |
| energySpeedSpecial1/2/3 + buy (2394-2399) | `IDLE_NGU_NEWBIE_OFFERS.energy.speed` | CONFORME | 1 EXP -> +0,2 ; 2 -> +0,3 ; 3 -> +0,4 ; achat unique chacun (`special1/2/3Bought`) |
| energyBar1/10/100 + buy (2392, 2400, 2402) | `energy.bars cost 80, gain 1` | CONFORME | 80 / 800 / 8000 pour +1 / +10 / +100 ; aucun plafond dans le jeu (le plafond 1e18 s'applique au total dans `totalEnergyBar`) ; SOREAL borne la valeur brute à 1e18 (équivalent en pratique, voir 2.8) |
| maxEnergy10K/100k/1M + buy (2404-2409) | `energy.cap cost 40, gain 10000, hardCap 9e18` | **ÉCART (condition)** | prix 40 / 400 / 4000 identiques ; le +1M est plafonné à `Character::hardCap` (9e18) comme SOREAL ; mais l'achat est refusé tant que `capEnergy < 100000` (« You need to hit a cap of 100K energy first! »), alors que SOREAL le verrouille derrière le boss 17 du run en cours (voir 2.3) |
| energyPower01/1/10/100 + buy (2410-2417) | `energy.power cost 15, gain 0.1` | CONFORME (prix) / **ÉCART (condition)** | 15 / 150 / 1500 / 15000 ; refusé si `highestBoss < 17` (record permanent), SOREAL : `context.bosses` du run en cours |
| customPowerCost 150 x n (2426), customCapCost n/250 (2427), customBarCost 80 x n (2428), customAllCost (2429), buyCustom* (2419-2425) | achat par quantité (`quantity`) | CONFORME | `n x 150` par point de Power (= 15 pour 0,1) ; cap : `n / 250` division entière (40 pour 10000) ; bars : `80 x n` ; le « tout » est la somme des trois et exige `capEnergy >= 100000` |
| energy `.ctor` (2433) | idem | CONFORME | 80/800/8000 (bars), 40/400/4000 (cap), 15/150/1500/15000 (power), 1/2/3 (offres) |
| magicSpeed10/100 + buy (2449-2452) | `magic.speed cost 3, gain 0.1, hardCap 50` | CONFORME | 3 / 30 ; refus à 50 (pas d'arrondi à 50 dans le jeu ; l'écart de flottant n'existe pas dans SOREAL) ; exige `capMagic >= 1000` |
| magicBar1/10/100 + buy (2453-2458) | `magic.bars cost 240, gain 1` | CONFORME | 240 / 2400 / 24000 |
| maxmagic10K/100K/1M + buy (2459-2464) | `magic.cap cost 120, gain 10000` | CONFORME (prix) / **ÉCART mineur** (clamp) | 120 / 1200 / 12000 ; AUCUN plafond 9e18 dans le jeu pour la magie (SOREAL borne à 9e18) ; condition de déblocage = `capMagic >= 1000` (magie découverte), pas de boss 17 |
| magicPower01/1/10/100 + buy (2465-2472) | `magic.power cost 45, gain 0.1` | CONFORME (prix) | 45 / 450 / 4500 / 45000 ; pas de condition de boss 17 dans le jeu (SOREAL en pose une, sans effet pratique car la magie n'est découverte qu'après) |
| magic customPower/Cap/Bar/All Cost (2479-2482), buyCustom* (2474-2487) | quantité | CONFORME | x150x3, (n/250)x3, x80x3 |
| res3Speed10/100 + buy (2772-2775) | `r3.speed cost 300000, gain 0.1` | CONFORME | 300000 / 3000000 ; refus à 50 ; arrondi à 50 entre 49,91 et 50 ; exige `capRes3 >= 10000` |
| res3Bar1/10/100 + buy (2776-2781) | `r3.bars cost 8000000` | CONFORME | 8e6 / 8e7 / 8e8 ; exige `capRes3 >= 10000` |
| res3Cap10K/100K/1M + buy (2782-2787) | `r3.cap cost 4000000` | CONFORME (prix) | 4e6 / 4e7 / 4e8 ; exige `capRes3 >= 1000` ; aucun clamp 9e18 dans le jeu |
| res3Power01/1/10/100 + buy (2788-2795) | `r3.power cost 1500000` | CONFORME | 1,5e6 / 1,5e7 / 1,5e8 / 1,5e9 |
| res3 customPower/Cap/Bar/All Cost (2802-2805) | quantité | CONFORME | x150x1e5, (n/250)x1e5, x80x1e5 |
| tryCustom*, update*, Awake, cancel, Start, refresh | - | IGNORÉ (UI) | - |

### 1.7 `MiscPurchases`, `StatBoostPurchases`, `YggdrasilEXPPurchases`

| Méthode du jeu (id) | Équivalent SOREAL | Verdict | Détail |
|---|---|---|---|
| autoAdvance / buyAutoAdvance (2494-2495) | `trainingAutoAdvance` 300 | CONFORME | `hasAutoAdvance` ; coût 300 |
| energyButton1/buyEnergyButton1 (2496-2497), magicButton1 (2500-2501), energyButton2 (2498-2499), magicButton2 (2502-2503) | `customInput1..4` 50 / 100 / 500 / 1000 | CONFORME (coûts) | ordre du jeu : Button1 = energyButton1 50, Button2 = magicButton1 100, Button3 = energyButton2 500, Button4 = magicButton2 1000 ; effet du jeu : Shift+clic enregistre la valeur du champ (SOREAL : valeurs de départ + ✎, déjà signalé dans le registre) |
| beard1/buybeard1 (2504-2505) | `beardSlot` 50000 | CONFORME | `hasBeardSlot1` |
| digger1/buydigger1 (2506-2507) | `diggerSlot` 25000 | CONFORME | `hasDiggerSlot1` |
| macguffin1 (2508-2509), macguffin2 (2510-2511) | `macguffinSlot1` 10 M, `macguffinSlot2` 100 M | CONFORME | `hasMacguffinSlot1/2` |
| StatBoost attack10/100/1K + buy (2528-2533), defense idem (2534-2539) | « Rich Jerks » `richJerksAction` (`idle-ngu-actions.js:1222`) | CONFORME (prix et gain) / **ÉCART (application)** | 30 / 300 / 3000 EXP pour +10 % / +100 % / +1000 % ; `attackBoost += 0,1 / 1 / 10`. Dans `Character::totalAttack` (2133) / `totalDefense` (2134), `attackBoost` multiplie seulement la part « entraînement x multis x ITOPOD x (1 + équipement/100) », et la constante `100` est ajoutée APRÈS (`100 + (...) x attackBoost`). SOREAL l'applique comme multiplicateur du total (`idle-ngu-bonus.js:791`) : écart sur la part de 100 de base (voir 2.9) |
| customAttackCost / customDefenseCost (2544-2545), buyCustomAttack/Defense (2541, 2543) | `richJerksAction` (niveaux entiers) | CONFORME avec réserve | coût = `troncature(x_pourcent x 3)` ; gain `x / 100` ; SOREAL n'accepte que des niveaux de 10 % pour 30 EXP |
| updateStatPurchases (2527), Awake, Start, cancel, refresh, update*Input, tryCustom* | - | IGNORÉ (UI) | - |
| YggdrasilEXPPurchases::canBuy (2558), capRequired (2555) | `requiredCap` des entrées `yggAuto*` (`idle-yggdrasil-extra-v1.js:175-196`) | CONFORME | cap requis = `activationCost x 10`, Energy si le fruit utilise l'énergie, sinon Magic : j'ai vérifié par script que les 21 `requiredCap` de SOREAL valent exactement `activationCost x 10` du fruit (et la bonne ressource) |
| startFruitPurchase (2554) / buyFruit (2556) | `buyExpShopV1` (`idle-ngu-actions.js:1122`) | CONFORME (coût et état) / **ÉCART mineur** (garde) | `permCostPaid = 1` (achat unique) ; le jeu exige aussi que le fruit soit déjà débloqué (`Fruit.maxTier > 0`) pour TOUS les fruits ; SOREAL ne le vérifie que pour les fruits de Mayo (`ACHAT_VERROUILLE`) |
| coûts EXP par fruit (`fruitCosts`, tableau sérialisé) | `cost` de `IDLE_YGG_AUTO_ACTIVATE_V1` | NON VÉRIFIÉ | valeurs dans la scène (pas dans l'IL) |
| updateYggdrasilPurchases (2553), prettyPrint, Awake, cancel, Start, refresh | - | IGNORÉ (UI) | - |

---

## 2. Écarts priorisés et correctifs proposés

### Priorité haute (valeurs fausses, effet direct sur l'équilibrage)

**2.1 Cœurs achetés au niveau 10, pas 0** (`ArbitraryController::buy*Heart*`, 863, 877, 915, 919, 928, 936, 938, 954, 974, 992 : `ItemNameDesc::makeLevelledLoot(id, 10)`).
Dans `idle-hearts-v1.js`, `idleHeartsBuyV1` : remplacer `const objet = deps.createItem(heart.id, 0);` par `deps.createItem(heart.id, 10)`. Le commentaire du fichier (« niveau 0 : aucune fiche ne publie de niveau d'achat ») est contredit par le code du jeu ; il faut le remplacer par « niveau 10 (`ArbitraryController::buyHeartAP`, build 1260) ». Vérifier que `createItem(defId, level)` règle bien les stats et le Special au niveau 10 (stats de `curAttack`/`curDefense` interpolées).

**2.2 Prix faux** (`idle-sellout-shop-v1.js`) :
- ligne 137, `heartPink` : `flatCost(225000)` -> `flatCost(175000)` (jeu `heartPinkCost` = 175000).
- ligne 122, `extraAccessorySlot5` : `flatCost(750000)` -> `flatCost(675000)` (jeu `acc9Cost`) ET ajouter `minDifficulty: "difficile"` (jeu : `startAcc9AP` refuse si `rebirthDifficulty < 1`, comme `acc8`). Mettre aussi à jour la condition de visibilité du snapshot (`idle-ngu-snapshot.js:165` ne masque que les `minDifficulty` : déjà générique, donc rien d'autre).
- ligne 102, `resource3NameRandomizer` : `flatCost(100000)` -> `flatCost(85000)` (jeu `res3NameGenratorCost`).
- ligne 74, `moreCustomEnergyMagicButtons` : `flatCost(80000)` -> `flatCost(100000)` (jeu `customPercentSet2Cost`).
Penser aux commentaires/tests qui citent 750 000 / 80 000 / 100 000 / 225 000 (le wiki disait ces valeurs : la source de vérité devient le code du jeu, ce qui est déjà la ligne de `idle-hearts-v1.js` « lu dans le code du jeu »).

**2.3 Verrous d'achat Energy/Magic/R3** (`idle-ngu-catalogues.js` `unlockBoss`, `idle-ngu-snapshot.js:450-453`).
Jeu : Energy Power exige `Character.highestBoss >= 17` (RECORD PERMANENT, jamais remis à zéro : écrit seulement par `BossController::advanceBoss` et `hardReset`) ; Energy Cap/1M/custom cap exigent `capEnergy >= 100000` (cap brut atteint, après la 1re montée du cap naturel) ; Magic et R3 (power/cap/bars/vitesse) exigent seulement que la ressource soit découverte (`capMagic >= 1000`, `capRes3 >= 10000` ou 1000 pour cap) : aucune condition de boss 17.
SOREAL : `unlockBoss: 17` sur `power` ET `cap` des trois ressources, comparé à `context.bosses` (boss du run en cours, remis à 0 à chaque Rebirth). Conséquence : après un Rebirth, le joueur SOREAL ne peut plus acheter Energy Power/Cap tant qu'il n'a pas re-battu le boss 17 ; dans le jeu l'achat reste permis.
Correctif proposé : dans `resourcePurchaseUnlocked`, lire `state.records.highestBoss` (ou le record permanent équivalent) pour `energy.power`, tester `generatedCap` brut >= 100000 pour `energy.cap`, et retirer `unlockBoss` de `magic.*` et `r3.*` ; ajouter la garde « cap énergie brut >= 100000 » dans `buyResource` pour `energy.cap`. (Attention : `unlockBoss` sert aussi au snapshot client ; garder le champ envoyé sans révéler le nombre, règle n° 2.)

**2.4 Minuteurs des consommables qui tournent hors ligne** (`tickSelloutEffectsV1`, `idle-sellout-shop-v1.js:409`, appelé avec `secs` incluant le hors-ligne par `idle-ngu-systemes.js:1426`).
Jeu : `AllArbitraryController::updateSpecialItems` ne décrémente les minuteurs que pendant que le jeu tourne (`deltaTime`) ; `Character::addOfflineProgress` ne décrémente hors ligne que `macGuffinBooster1Time` (Muffin) ; `cardsOfflineProgress` décrémente `mayoSpeedPotTime` (Infuser). Les autres (potions alpha/delta énergie/magie/R3, charme, Super charme, Bar Bars) restent figées et leur effet est EXCLU de la production hors ligne (ex. `nguOfflineProgress` divise `progressPerTick` par `potionModifier`).
Correctif proposé : ne décompter hors ligne que `macguffinMuffin` et `mayoInfuser` ; pour les autres clés de `remaining`, ne décompter que le temps « en ligne » (ex. la part de `secs` sous le seuil de 5 minutes déjà utilisé pour le farm hors ligne, `idle-ngu-systemes.js:1415`) ; et ne pas appliquer `idleSelloutPotionFactorV1` à la production du temps hors ligne. Décision à valider par Norman : l'actuel comportement SOREAL est avantageux pour le joueur mais consomme aussi ses potions pendant l'absence.

**2.5 Insta Training Cap** (`instaTrainingCapSorealIdle_`, `idle-runtime-actions.js:1349`).
Jeu (`Rebirth::instaTrain` 2676) : si `capEnergy >= 12` -> `curEnergy += 12`, `attackEnergy[0] = 6` et `defenseEnergy[0] = 6` (les deux, toujours). SOREAL : 6 en Attaque passive ; le 6 en Blocage dépend de l'achat EXP « Synchro Basic Training » (inventé par SOREAL, décision de Norman du 2026-10-19) et l'énergie libre n'est pas augmentée de 12 hors défi. Correctif proposé : `voulu = { attaque_passive: 6, blocage: 6 }` sans condition et `budget = energieDepart + 12` (si le cap d'énergie >= 12), comme le jeu. À présenter à Norman car c'est une décision explicite antérieure.

### Priorité moyenne

**2.6 Écart d'application des « Rich Jerks »** (`idle-ngu-bonus.js:791-792` et 843).
Jeu : `total = 100 + (entraînement x attackMulti x totalStatBonus ITOPOD x (1 + équipement/100)) x attackBoost`, la constante 100 n'est pas multipliée ; SOREAL multiplie le total (qui contient la base). Écart seulement sensible au tout début (la base de 100 est négligeable ensuite) ; à traiter avec le groupe « statistiques ».

**2.7 Pack de départ absent** (`ArbitraryController::starterPackCost` 771, `buyStarterPackAP` 883) : 75000 AP, achat unique : +500 EXP, +5 espaces d'inventaire (borné à `maxSpaces`), et `inventoryCost` baisse de 1200. Ajouter une entrée au catalogue (`id: "starterPack"`, `max: 1`, `cost: flatCost(75000)`, `grant: {currency:"experience", amount: 500}` plus +5 `extraInventorySpace` achetés) et soustraire 1200 dans `linearCappedCost` de `extraInventorySpace` quand le pack est possédé (`Math.min(10000, 3000 + 100*n - (pack ? 1200 : 0))`). Vérifier la décision de Norman : le fichier d'en-tête exclut « Packs » (argent réel) ; le jeu vend celui-ci pour des AP.

**2.8 Plafonds des achats Energy/Magic/R3** : le jeu ne borne pas la valeur brute de Power/Bars (c'est le total qui est borné par `hardCapPowBar` = 1e18) et ne borne le cap qu'à 9e18 pour Energy (pas pour Magic ni R3). SOREAL borne les trois ressources à 1e18 (power/bars) et 9e18 (cap) dans l'achat. En pratique équivalent (le multiplicateur >= 1 rend le total >= brut), sauf un brut Magic/R3 au-dessus de 9e18 en cap, impossible à atteindre avec les prix actuels. Aucun correctif urgent.

**2.9 Cœurs : prérequis** : Pink exige R3 ET souhaits (`startHeartPinkAP` 973), Rainbow exige les cartes (`startHeartRainbowAP` 991), Grey exige R3 (937) ; SOREAL ne garde que Grey (`requiresR3`). Ajouter `requiresWishes` / `requiresCards` au tableau `IDLE_HEARTS_V1` et les tester dans `idleHeartsBuyV1` (si déjà masqués par l'anti-spoil, l'effet est seulement côté appel direct).

**2.10 Prérequis EXP non vérifiés par le serveur** (`buyExpShopV1`) : `daycareSlot2`/`daycareSlot3` exigent `daycareSlot1` (`hasDaycare`) ; `inventoryMergeSlot` exige `autoMerge` (`hasAutoMerge`) ; achat d'Auto-Activate Yggdrasil exige le fruit débloqué (`Fruit.maxTier > 0`) pour tous les fruits. Ajouter un champ `requires: "daycareSlot1"` / `"autoMerge"` dans `IDLE_NGU_EXP_SHOP_V1` et le tester avant le débit.

**2.11 Adventure Advancer** (`advanceAdventureAdvancerV1`, `idle-ngu-systemes.js:1053`) : jeu = fenêtre `rebirthTime` dans [20 s, 30 s], une fois par Rebirth, et l'achat pose `didAdvAdvance = true` (pas de saut dans le Rebirth en cours). Correctif : ajouter `if ((now - run) / 1000 > 30) { adv.advancerRun = run; return; }` après le test de 20 s, et au moment de l'achat `adv.advancerRun = state.runStartedAt` (dans `idleSelloutApplyEffectV1` pour `adventureAdvancer`).

### Priorité basse

**2.12** `totalEnergyBar` / `totalMagicBar` tronquent après la potion (`conv.i8`) puis minimum 1 : ajouter `Math.floor` après `idleSelloutPotionFactorV1` pour `bars` dans `idleNguEffectiveResourceStatV1` si l'on veut un décompte identique.

**2.13** Achats « custom » HP : le jeu calcule `floor(3 x n / 10)` (1 PV = 0 EXP) ; SOREAL ne permet que des lots de 10 PV pour 3 EXP ; rien à changer (le jeu a ici une faille de prix).

**2.14** Pills : le jeu ne les consomme que si le réglage `buffedKillsOn` est actif ; SOREAL les consomme toujours (`idle-ngu-systemes.js:~953`). Option d'ajout de réglage.

**2.15** Fruit de quêtes et Beast Butter : `FruitController::consumeQPFruit` (5075) divise le facteur de quête par `butterModifier` quand `usedButter` ; à comparer côté `idle-questing-v1.js` (hors groupe, non relu).

---

## 3. Non vérifié, et pourquoi

1. **Valeurs de scène (Unity)** : les initialiseurs des `.ctor` (`AdventurePurchases`, `EnergyPurchases`, `MagicPurchases`, `Resource3Purchases`, `MiscPurchases`, `StatBoostPurchases`, `ArbitraryController` pour Potions/Charme/Bar Bars) sont lus dans l'IL, mais un champ public sérialisé dans la scène (`level0`) peut surcharger la valeur par défaut. Je n'ai pas ouvert `level0` (binaire difficile) : tous les coûts des sections 1.1, 1.5, 1.6 et 1.7 reposent donc sur les défauts du code. Les écarts trouvés (2.2) viennent de méthodes sans champ sérialisé (`heartPinkCost`, `acc9Cost`, `res3NameGenratorCost`, `customPercentSet2Cost` sont des constantes dans l'IL) : ils sont fermes.
2. **`YggdrasilEXPPurchases::fruitCosts`** (tableau sérialisé) : coûts EXP des 21 Auto-Activate non vérifiés (seul le cap requis est confirmé).
3. **Capacité de départ de Resource 3** (`capRes3 >= 1000/10000` dans les gardes R3) : valeur à l'initialisation (`Resource3::.ctor` met 0, `unlockResource3` met 10000) lue ; l'équivalence exacte avec « `ressourceDecouverteV1` » de SOREAL n'est donc que supposée.
4. **`Character::addExp` / `addAP`** (formules d'EXP/AP gagnés, bonus des cœurs) : hors groupe, seule l'écriture du solde par la boutique a été lue.
5. **`idleInventoryLoadoutSlotsV1`**, **`macguffinSlotCountV1`**, **`idleCardsMultiplierV1`**, **`towerAppliquerEtageOptimalV1`** (Lazy ITOPOD) : côté SOREAL non relus en détail ; côté jeu les lecteurs `loadoutSpaces`, `macguffinSpaces`, `totalMayoSpeed`, `boughtLazyITOPOD` ont été lus mais pas confrontés ligne à ligne.
6. **Condition exacte de l'écriture `highestBoss`** (`BossController::advanceBoss`, bloc avec `rebirthDifficulty`) : j'ai lu qu'il est mis à `bossID` quand `bossID > highestBoss` mais pas la condition de difficulté qui l'entoure (peut ne compter que certains modes).
7. **Texte UI** du jeu pour la potion delta R3 (« 24 hours of 2x Power ») : le code applique bien `res3PotionModifier` (x3) ; l'écart est un texte du jeu, sans effet sur le moteur.
8. **Pas de test exécuté** : aucun test du dépôt n'a été lancé ; les propositions de la section 2 supposent de mettre à jour `cloudflare/tests/references/constantes-soreal-v1.json` si une constante change de statut, et les tests qui citent les anciens prix (750 000, 80 000, 100 000 AP pour le randomiseur, 225 000 pour Pink Heart).
