# Audit code du jeu (build 1260) : MacGuffins, Blood Magic, Coeurs

Date : 2026-11-16. Méthode : IL de `Assembly-CSharp.dll` (lecteur `cloudflare/tools/banc-vrai-jeu/lecteur-il.mjs`) + constantes de scène lues dans `NGUIdle_Data/level0`. Rien n'a été modifié dans le moteur : ce fichier est le seul livrable.
Verdicts : OK = identique, ECART = différence de valeur ou de règle, MANQUE = fonction du jeu absente de SOREAL.

## 1. MacGuffins

| Méthode / table du jeu | Valeur dans le jeu | SOREAL (fichier) | Verdict |
|---|---|---|---|
| `InventoryController::macGuffinBonusTimeFactor` | t < 180 s : 0 ; 180..1800 s : (t/1800)^2 ; > 1800 s : (t/1800)^0.5 plafonné 20 ; Sadistic ET 2 complétions Troll Sadistic : (t/1800)^2 jusqu'à 1800, t/1800 jusqu'à 86400, puis 48*(t/86400)^0.4 plafonné 104.86 ; Muffin (Time>0 ou InUse) x `potionModifier` (2, x1.1 Blue Heart) APRÈS les plafonds | `macguffinTimeRatioV1`, `macguffinSadisticTroll2V1`, `consumeMuffin` (idle-macguffins-v1.js) | OK |
| `*BonusPerRebirth` (22 types), branche linéaire (L+1 <= 100) | (L+1) x lin x T : Power 1e-5, Cap/NGU/Bar/Beard/Drop/Adventure/Aug 1e-5, Golden 5e-5, Stat 1e-4, Wandoos 2e-5, NUMBER 5e-5, Blood 3e-5, R3 5e-6 | `IDLE_MACGUFFIN_FORMULAS_V1.lin` (en points de %) | OK |
| `*BonusPerRebirth`, branche exposant (L+1 > 100) | (L+1)^e x c x lin x T. Power : e 0.3, c 25.12 ; standard (Cap, NGU, Bar, Beard, Drop, Adventure) : 0.2, 39.81 ; Wandoos : 0.25, 31.63 ; NUMBER : 0.25, 31.63 ; Blood : 0.2, 39.81 ; R3 Power : 0.3, 25.12 ; R3 Cap/Bar : 0.2, 39.81. Golden, Aug, Stat : AUCUNE branche (linéaire pour tout L) | `exp` / `coef` | ECART mineur (a, b) |
| (a) seuil de la branche | `(L+1) > 100` donc exposant dès L = 100 | `L > 100` (macguffinRebirthGainPctV1) | ECART (1 niveau) |
| (b) coefficients arrondis | coef x lin = Wandoos 0.06326 %, NUMBER 0.15815 %, Blood 0.11943 %, R3 Power 0.01256 %, R3 Cap/Bar 0.019905 % | 0.06325, 0.1581, 0.1194, 0.01255, 0.0199 | ECART (4e-4 relatif au plus) |
| Index `Inventory.macguffinBonuses` (0 EP, 1 EC, 2 MP, 3 MC, 4 ENGU, 5 MNGU, 6 EBar, 7 MBar, 8 SEXY, 9 SMART, 10 Drop, 11 Golden, 12 Aug, 13 Stat, 15 EWandoos, 16 MWandoos, 17 NUMBER, 18 Blood, 19 Adventure, 20-22 R3 P/C/B) | consommateurs : totalEnergyPower etc., lootFactor [10], **totalGoldbonus [11] (utilisé seulement par `LootDrop::goldDrop` = or des drops)**, totalAttack/Defense [13], `Rebirth::calculateNextMultis` [17], bloodAdded [18], totalAdv* [19] | `macguffinApplyToBonusesV1` | OK (Golden = or des drops : confirmé par le code, la « source tierce » du commentaire est exacte) |
| **SEXY (206, idx 8) / SMART (207, idx 9)** | **`AllBeardsController::energyBeardSpeedFactor` multiplie par [8] ; `magicBeardSpeedFactor` par [9]** : vitesse des barbes Energy / Magic | `effect: null`, « aucun effet » (types sexy, smart) | **ECART IMPORTANT** |
| Slots `InventoryController::macguffinSpaces` | 1 + slots AP (max 11 : `maxMacguffinSpaces`) + Edgy set + EXP shop 1 + EXP shop 2 + perks 66, 67, 88 + Troll Evil >= 2 + NoEquipment Evil >= `maxCompletions` + quirks 19 et 50 = 22 | `macguffinSlotBreakdownV1` | OK (valeur de `maxCompletions` du No Equipment non lue ; SOREAL met 5) |
| Prix slots AP (`macguffinSlotCost`) | 100 000 si moins de 2 achetés, sinon 225 000 | `tieredCost([1e5,1e5,225000...])` | OK |
| Muffin (`macguffinBooster1Cost`, `useMacguffinBooster1`) | 50 000 AP ; +24 h au minuteur ; InUse jusqu'au Rebirth | `macguffinMuffin` | OK |
| `Equipment::mergeItem` | niveau = a + b + 1 ; plafond 100 sauf type 11 (MacGuffin, jusqu'à int max) | `macguffinMergeLevelV1` | OK |
| `Equipment::levelUp` (Daycare) | +1, plafonné à 100 pour tout type | non appliqué (perk 56) | MANQUE (voir écart 6) |
| `LootDrop::macGuffinThreshold` (zones) | **`globalKillCounter > seuil` (strict : seuil + 1 kills)** ; compteur remis à 0 au drop et au changement de zone (`ZoneSelector::changeZone`) ; exige le succès 145 (forme finale de Walderp, zone16) ; seuil = liste de scène x0.8 (Purple) puis x0.9 (Choco), troncature entière à chaque étape | `macguffinOnZoneKillsV1` : `kills >= required` (1000, 720 avec les deux bonus) | ECART (1 kill) ; liste de scène des seuils NON trouvée |
| `LootDrop::killsPerMacguffin` (ITOPOD) | 5000, x0.8 (perk 69), x0.75 (70), x0.75 (71), x0.8 (Purple), troncature à chaque étape ; drop quand `enemiesKilled % seuil == 0` ET perk 68 ET succès 145 | `macguffinKillsRequiredV1` + compteur remis à 0 | OK (compteur global modulo vs compteur local : équivalent tant que le seuil ne change pas) |
| `LootDrop::macguffinBaseLevelBonus` | perk 65 (niveau) + 1 si Greasy Nerd (set) + `wishBaseMacGuffinLevels` (= min(souhait 2, 5)) ; `macguffinDropLevelBonus` = 1 | `macguffinDropLevelV1` | OK |
| **`LootDrop::titanLevelBonus`** | **+1 niveau du MacGuffin ALÉATOIRE d'un titan si No Rebirth Challenge complété au moins une fois** (`dropRandomMacguffin(nom, titanLevelBonus())`) | `macguffinOnTitanKillV1` n'ajoute que `macguffinDropLevelV1` | **ECART** (SOREAL applique déjà ce +1 à l'équipement des titans : `titanLootLevelBonus`) |
| `dropRandomMacguffin` (réserve) | 198..208 (11) + {209, 210, 228, 211, 250, 289, 290, 291, 298, 299, 300} déjà lâchés (`itemDropped`) | `IDLE_MACGUFFIN_RANDOM_BASE_POOL_V1` + `sourceDropped` | OK |
| Titans à MacGuffin aléatoire garanti | zone23 (Nerd), 26 (Godmother), 30, 34, 38, 42 : six titans | `IDLE_MACGUFFIN_TITAN_RANDOM_V1` (6) | OK |
| Nerd : Adventure MacGuffin (291) | `dropMacguffin(291)` garanti, si succès 145 | `macguffinOnTitanKillV1` | OK |
| Godmother R3 Power/Cap/Bar (298/299/300) | chance 0.0001 / 0.000075 / 0.00006 x lootFactorRooted, plafond 0.25 ; paliers : tous (23-26) / 24-26 / 25-26 | `IDLE_MACGUFFIN_GODMOTHER_DROPS_V1` | OK |
| Sort α `castMacguffin1Spell` | perk 72 ; minimum 1e9 ; recharge `macguffin1Cooldown` = 84 600 s (23,5 h, lu en scène) ; niveaux = (int)((log10(sang/1e9)+1) x `wishEffect(59)`) ; souhait 24 > 0 : premier slot, sinon un slot au hasard ; sang remis à 0 et recharge relancée MÊME SI aucun MacGuffin (le sort « fizzle ») | `castBloodMacguffin` | OK sur la formule ; ECART mineur (SOREAL lève `AUCUN_MACGUFFIN_EQUIPE` sans consommer) |
| Sort β `castMacguffin2Spell` | perk 73 ; **difficulté Evil minimum** ; minimum 1e6 ; recharge 171 000 s (47,5 h, scène) ; niveaux = (int)(log20(sang/1e6)+1), tous les slots | `castBloodMacguffin` | OK sur la formule ; ECART (pas de contrôle de difficulté Evil+) |
| Fruit α / β (`consumeMacguffinFruit`, `consumeMacguffinFruit2`) | ceil(ceil(T^1.5) x 0.5 (α) ou 0.1 (β) x poop x yggYield x totalHarvestBonus x (α seulement) `wishEffect(60)`) ; souhait 25 > 0 : premier slot (α) | `macguffinFruitLevelsV1` / `macguffinEatFruitV1` | OK |
| Niveau 100 | `markItemAsMaxxed` (affichage / succès seulement) | n/a | OK |

## 2. Blood Magic

| Méthode / table du jeu | Valeur dans le jeu | SOREAL (fichier) | Verdict |
|---|---|---|---|
| Tableau des 8 rituels (scène : baseBoost, baseCost, bossRequired) | sang 1 / 50 / 2000 / 60 000 / 1.2e6 / 1.8e7 / 2.5e8 / 3.2e9 ; Or 3e7 / 1e10 / 2e12 / 4e14 / 8e16 / 1.6e19 / 3.2e21 / 6.4e23 | `IDLE_NGU_BLOOD_RITUALS` | OK |
| Diviseurs de vitesse (`AllBloodMagicController`, scène) | Normal 2000, 2e4, 2e5, 2e6, 2e7, 2e8, 2e9, 2e10 ; Evil 2e12..2e19 ; Sadistic 2e21..2e28 (et `sadisticDivider` 5e8, sans le 50000 des autres modes) | `baseSeconds` x `IDLE_DIFFICULTY_SPEED_DIVIDERS_V1.bloodMagic` (1e9, 1e22) | OK (rapports 1e9 et 1e22 recalculés) |
| `progressPerTick` | magie x puissance / 50000 / diviseur x `totalBloodMagicSpeedBonus` (x1.25 si `netherComplete`) | `dutchSetMultiplier` | OK |
| `updateBloodMagic` | l'Or est payé quand la barre est à 0 ; sans Or la barre n'avance pas ; fin de barre : remise à 0 sans report, UN niveau par tick au plus ; `canLevel` | `advanceBloodMagic` | OK |
| `currentCost` | `baseCost x totalDiscount` ; `totalDiscount` = 1 (aucune réduction) | `ritual.gold` fixe | OK |
| `bloodAdded` | baseBoost x `totalBloodBonus` (Digger) x macguffin[18] x `HacksController::totalBloodGainBonus` (Evil+) x `BeastQuestPerkController::blood1` (quirk 91 : +1 %/niveau, plafond 50, 2000 QP : relu dans `qt.json`) | `advanceBloodMagic` | OK |
| `ritualsUnlocked` | 7, +1 avec 6 complétions du Troll Challenge | `ritualUnlocked` | OK |
| Rituel actif et Magic | une barre par rituel, magie répartie, plafond `capValue` | `setRitualAllocationV1` | OK |
| `castRebirthSpell` (NUMBER) | AUCUN minimum ; `rebirthPower += sang` ; version partielle `castRebirthSpell(montant)` (montant <= sang) | `castBloodSpell("numberBoost")` : minimum 1, tout le sang, `Math.floor` | ECART mineur |
| `castAdventurePowerupSpell` (Iron Pill) | minimum 100 ; gain = floor(sang^0.25) x `ironPillBonus` (perks 84/85, **seulement si difficulté >= Evil**) ; plafond 1e8 ; +gain Puissance et Endurance, +3 x gain PV, +0.03 x gain régénération ; recharge 41 400 s (11,5 h, scène) | `castBloodSpellSansTrace("ironPill")` : `pow(sang, 0.25)` sans plancher ni plafond ; recharge 11,5 h ; +3 / +0,03 (idle-ngu-bonus.js:922) | ECART mineur (plancher, plafond 1e8, condition Evil) |
| `AllBloodMagicController::lootBonus` (Blood Spaghetti) | minimum 10 000 ; **1 + floor(log2(sang_dépensé/10 000) + 1) x 0.01** | `1 + (log2(sang/1e4)+1)/100` sans plancher | **ECART** |
| `AllBloodMagicController::goldBonus` (Counterfeit Gold) | minimum 1e6 ; **1 + floor((log2(sang_dépensé/1e6) + 1)^2) x 0.01** | `1 + ((log2(sang/1e6)+1)^2)/100` sans plancher | **ECART** |
| Sorts partiels et **sorts automatiques** (`autoSpell`, toutes les 1 s, boss > 36) | Number / Loot / Gold cochés : le sang est réparti à parts égales (floor), chacun lance `cast...(montant)` ; ne tourne pas hors ligne | absent | **MANQUE** |
| `castEndSpell` (dernier sort) | difficulté Sadistic seulement ; minimum 5e22 ; `makeLevelledLoot(494, 100)` ; sang remis à 0 | `leeches` : minimum 5e22 ; **aucun contrôle de difficulté** dans le moteur | ECART (à confirmer côté UI) |
| `TrollChallengeController::loseBlood` | sang perdu et `rebirthPower` remis à 1 | non relu ici | NON VÉRIFIÉ |
| Minuteurs de recharge hors ligne (`bloodMagicOfflineProgress`) | les trois chronos avancent du temps hors ligne | `readyAt` en temps réel | OK (équivalent) |
| Cooldowns de scène | Iron Pill 41 400 s ; α 84 600 s ; β 171 000 s | `IRON_PILL_COOLDOWN_MS_V1`, `cooldownMs` | OK |

## 3. Coeurs

| Coeur / méthode | Valeur dans le jeu (cur / cap, niveau 0) | SOREAL | Verdict |
|---|---|---|---|
| Red 119 | Puissance/Endurance 69/100 ; EXP 2,5/5 % ; Drop 0/30 % | idle-adventure-sets.js:899 | OK |
| Yellow 129 | 69/100 ; AP 5/10 % ; Or des drops 0/300 % | :901 | OK |
| Brown 162 | 69/100 ; **Seed Gain 35/35** ; Energy+Magic Power (type 27 « EM Power ») 100/100 % | :903 : `seedGainPct base:0 max0:35` | **ECART** (base 0 au lieu de 35) |
| Green 171 | 69/100 ; Drop 50/50 % ; Respawn 4/4 ; Beard Speed 30/30 | :905 | OK |
| Blue 196 | 69/420 ; Or 100/100 % ; NGU Speed 40/40 | :907 | OK |
| Purple 212 | Puissance 69/100, Endurance 69/1000 ; Drop 40/40 ; Beard 40/40 | :909 | OK |
| Orange 293 | 69/100, 69/1000 ; Or 300/300 ; Quest Drops 5/5 | :911 | OK |
| Grey 297 | 1e6/1e6 ; R3 Cap 20/20 ; R3 Bars 20/20 | :913 | OK |
| Pink 344 | 3e6/3e6 ; Wish Speed 10/10 ; Daycare Speed 10/10 | :915 | OK |
| Rainbow 390 | 69/100 ; Cooking 0/69 000 000 ; R3 Bars 100/100 ; Seed Gain 30/30 | :922 | OK |
| Croissance | `Equipment::updateItem` : cap x (1 + niveau/100), plafond de niveau 100 (x2) ; achat = `makeLevelledLoot(id, 10)` | niveau 10, x2 à 100 | OK |
| Prix AP (`heartCost`...) | Red 225 000 ; Yellow 150 000 ; Brown/Green/Blue/Purple/Grey/Orange 225 000 ; Pink 175 000 ; Rainbow 500 000 | `idle-sellout-shop-v1.js:129-138` | OK |
| Set = `itemMaxxed[id]` (niveau 100) : Brown | un Poop sur 10 non consommé | idle-yggdrasil-extra-v1.js | OK (non relu) |
| Set Green (`totalPPBonus`) | PP ITOPOD x1.2 | `itopodPpPct` 0.20 | OK |
| Set Blue (`potionModifier`, `res3PotionModifier`, `pillModifier`, `poopModifier`, `butterModifier`) | consommables x1.1 (base 2 -> 2.2 ; sert aussi au Muffin) | `consumablesEffectPct` | OK |
| Set Purple (`macGuffinThreshold`, `killsPerMacguffin`) | x0.8 sur les seuils | `purpleHeart` | OK |
| Set Orange (`questRewardFactor`) | QP x1.2 | `questQpPct` | OK |
| Set Grey | Hacks 25 % plus rapides | `hackSpeedPct` | OK |
| Set Pink (`curWishSlots`) | +1 slot de souhait | `idleHeartsPinkCompleteV1` | OK |
| Set Rainbow (`totalCardSpeed`, `totalMayoSpeed`) | x1.1 | `cardMayoSpeedPct` | OK |
| Still-Beating Heart (`tagEffect`) | +0.01 d'effet de tag, plafonné 0.1 | `cardTagEffect` 0.01 | OK |
| Red / Yellow (EXP / AP) | alignés par un audit précédent | idle-hearts-v1.js | OK |

## 4. Ecarts priorisés et correctifs exacts

1. **SEXY et SMART MacGuffins sans effet (important)** : le jeu les applique à la vitesse des barbes. Dans `cloudflare/src/idle-macguffins-v1.js`, mettre `effect: "energyBeard"` pour `sexy` et `effect: "magicBeard"` pour `smart`, ajouter `energyBeard: 1, magicBeard: 1` à `macguffinEffectMultipliersV1`, et dans `idle-ngu-pistes.js` (`baseRate` de `advanceBeardTrack`, ~ligne 227) multiplier par `macguffinEffectMultiplierV1(state, resource === "magic" ? "magicBeard" : "energyBeard")`. Mettre à jour `effet` : « Vitesse des barbes Energy / Magic ». Le jeu : `bars x sqrt(power) x macguffin[8|9] x (1 + bonuses[26] + bonuses[42]) / beardCountDivider x diggers x quirks x (UUG set x1.1)`.
2. **Blood Spaghetti et Counterfeit Gold sans plancher** : dans `castBloodSpellSansTrace` (`idle-ngu-systemes.js`), remplacer `pct = Math.pow(log2(x/1e6)+1, 2); 1 + pct/100` par `1 + Math.floor(Math.pow(Math.log2(x/1e6)+1, 2)) * 0.01`, et `pct = log2(x/1e4)+1; 1 + pct/100` par `1 + Math.floor(Math.log2(x/1e4)+1) * 0.01`. Rejouer les tests de références Blood Magic.
3. **Niveau +1 des MacGuffins aléatoires des titans (No Rebirth Challenge >= 1)** : `macguffinOnTitanKillV1` doit appeler `addDrop` avec un niveau `macguffinDropLevelV1(state) + titanLootLevelBonus` (la valeur `challengePermanentBonuses(state).titanLootLevelBonus` existe déjà, `idle-ngu-catalogues.js:378`) pour le `dropRandom` des titans seulement, pas pour les drops de zone, ni pour le 291 du Nerd, ni pour 298/299/300.
4. **Sorts automatiques et lancers partiels (MANQUE)** : ajouter à `castBloodSpell` un montant optionnel (Number : aucun minimum ; Loot : >= 10 000 ; Gold : >= 1e6 ; montant <= sang) et une cadence de 1 s pour `autoSpell` (boss > 36 : sang / nombre de sorts cochés, `Math.floor`). Les cases sont des préférences de compte (`rebirthAutoSpell`, `lootAutoSpell`, `goldAutoSpell`). Hors ligne : rien.
5. **Brown Heart, gain de graines** : `idle-adventure-sets.js:903`, `seedGainPct` doit valoir `base: 35, max0: 35, max100: 70` (le jeu : `curSpec1 = capSpec1 = 35000`, type 15 « Seed Gain », unité /1000).
6. **MacGuffin Daycare (perk 56)** : le jeu n'autorise un MacGuffin dans le Daycare qu'avec la perk 56 (`swapDaycare`), le niveau monte de 1 au rythme du Daycare (`Equipment::levelUp`) avec plafond 100. La règle est lisible dans le code ; la vitesse est celle du Daycare commun (`AllDaycareController::daycareTime`), donc aucune constante à inventer.
7. **Iron Pill** : `gain = Math.floor(Math.pow(sangBrut, 0.25))`, multiplié par `ironPillMultiplier` seulement si la difficulté est Evil ou plus, plafonné à 1e8.
8. **Sort β : difficulté Evil minimum** : dans `castBloodMacguffin`, refuser avec une erreur dédiée si `idleRangDifficulteV1(state.difficulty) < 1` quand `spell === "beta"`.
9. **Dernier sort (`leeches`)** : refuser sous Sadistic (`idleRangDifficulteV1 < 2`) dans le moteur, pas seulement dans l'interface.
10. **Strictement supérieur pour les zones** : `macguffinOnZoneKillsV1` : `while (kills > required)` (le jeu déclenche à seuil + 1) ; ITOPOD inchangé (modulo).
11. **Branche exposant à L = 100** : `macguffinRebirthGainPctV1` : `L + 1 > 100` au lieu de `L > 100`.
12. **Coefficients** : Wandoos 0.06326, NUMBER 0.15815, Blood 0.11943, R3 Power 0.01256, R3 Cap/Bar 0.019905.
13. **Sorts α/β sans MacGuffin** : le jeu consomme le sang et relance la recharge (le sort « fizzle ») ; SOREAL refuse sans consommer. Choix de jeu à trancher.

## 5. Non vérifié

- Liste de scène `LootDrop.baseKillsPerMacguffin` (seuils par zone) : introuvable dans `level0` (le wiki donne 1000 partout ; l'IL montre qu'elle est indexée par zone 0..18).
- `effectPerLevel` de `WishProperties` pour les souhaits 59, 60, 24, 25 (+20 %/niveau d'après le wiki ; seul `wishEffect = 1 + niveau x effectPerLevel`, borné à 1 en dessous de la difficulté requise, est lu).
- Valeur de `NoEquipmentChallengeController.maxCompletions` (SOREAL : 5).
- Niveau maximal de la perk 65 (SOREAL : 1).
- Valeurs de scène des diggers de Blood (`startingBoost[10]`, `boostPerLevel[10]`), des hacks (bonus 7) et de `effectPerLevel` des perks 84/85.
- `Character::canLevel` (défis « 100 niveaux »), `Troll Challenge loseBlood`.
- Répartition des stats initiales d'un cœur acheté (`makeLevelledLoot`, tirage entre `cur` et `cap` pour Red/Yellow) : les bornes sont lues, le tirage non.
- Comportement hors ligne du potentiel de magie (`magicPotion1Time` divise `progressPerTick` dans `bloodMagicOfflineProgress`) : non analysé.
