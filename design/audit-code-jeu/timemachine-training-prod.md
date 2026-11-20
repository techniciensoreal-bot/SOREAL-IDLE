# Time Machine, Basic/Advanced Training, production Énergie / Magie / Ressource 3 : code du jeu, build 1260

Source : IL de Assembly-CSharp.dll (`lecteur-il.mjs`, ids de méthode du jeu), valeurs de scène `level0` (`scene/multi.mjs`, `dumpall.mjs`) et tableaux statiques `<PrivateImplementationDetails>` (lus par la table FieldRVA, ce que les audits précédents disaient « non lisible »). Rien n'est tiré de la mémoire. Aucun fichier du dépôt modifié hormis ce rapport.

Légende : CONFORME / ÉCART (jeu vs SOREAL, fichier:ligne) / NON VÉRIFIÉ. Seuls les écarts vérifiés dans l'IL ET dans le code SOREAL sont listés en section 1.

---

## 1. Écarts réels, classés par impact

### E1 (fort) : la Magie ne se génère pas hors du boss 37 du run, et ne démarre pas avec le cap 10 000 / la vitesse 3 du jeu
**Jeu**
- `Magic::unlockMagic` (2618), appelée par `BossController::advanceBoss` (1546, IL_0261-026c) quand `bossID == 37` (donc au 37e boss vaincu, et à chaque Rebirth qui le refranchit) : `capMagic = max(capMagic, 10000)`, `magicBarSpeed = max(magicBarSpeed, 3)`, `magicPerBar = max(magicPerBar, 1)`. `Magic::.ctor` (2617) met 0 partout, `Magic::reset` (2619, Rebirth) ne remet que `idleMagic`, `curMagic`, `magicBarProgress` : cap et vitesse PERSISTENT.
- `MagicDisplay::updateMagicBar` (2622), lancée en permanence par `MagicDisplay::Start` (2620, `InvokeRepeating` toutes les 0,02 s), ne teste aucun `bossID` : la barre remplit dès que `totalMagicSpeed > 0`. L'interface d'allocation de Magie (`ButtonShower::updateButtons`, 3058, IL_03e4-03f4) est affichée selon `capMagic >= 10000`, pas selon le boss du run. Donc après le premier boss 37, la Magie continue de se produire et de s'allouer après chaque Rebirth, avant de refrapper le boss 37.
- Même schéma pour la Ressource 3 : `Resource3Display::unlockResource3` (2764), appelée à la consommation de la preuve (`ItemController::consumeItem`, 3794, IL_0dd6) : `capRes3 >= 10000`, `res3BarSpeed >= 3`, `res3PerBar >= 1`.
**SOREAL**
- Démarrage : `defaultResource` (`idle-ngu-etat.js:34-61`) magie `speed 1`, `cap` naturel 1 ; `normalizeResource` (`idle-ngu-etat.js:846-850`) impose un cap mini de 100 (magie et R3) et une vitesse mini de 0,1. Mesuré en appelant `normalizeIdleNguState` avec `bosses = 38` : magie `{speed:1, cap:100, bars:1}` ; R3 `{speed:1, cap:100}`. Aucune remontée à 10 000 / 3 nulle part (aucune occurrence de `unlockMagic` ni d'équivalent).
- Production : `idleNguResourceGenerationPerSecond` (`idle-ngu-ressources.js:339`), `advanceGeneratedResources` (`:363`), `setAllocation`/`reclaimAllocatedResource` (`:414`, `:436`), `idle-ngu-ressources.js:291`, `idle-ngu-pistes.js:129,209,891,924-929,997,1157` : tout est conditionné par `state.systems.bloodMagic.unlocked`, drapeau REMIS À FAUX à chaque Rebirth (`idle-ngu-actions.js:779`) et rétabli seulement quand `context.bosses >= 37` DANS LE RUN. Après un Rebirth : 0 Magie/s jusqu'au boss 37, allocation refusée (`MAGIC_VERROUILLEE`), piste Or de la Time Machine inactive (`idle-ngu-pistes.js:997`, `:1157`).
**Impact** : Magie ×2,94 plus lente au départ (vitesse 1 contre 3 : `50 / ceil(50/v)` = 1 remplissage/s contre 50/17), plafond 100 contre 10 000 tant qu'on n'a pas acheté de cap, et aucune Magie (donc ni NGU de Magie, ni Wandoos Magie, ni piste Or de la Time Machine, ni Blood Magic hors boss 37) entre le début d'un Rebirth et le boss 37.
**Correctif proposé**
1. Dans la passe qui évalue `unlockSatisfied` (ou dans `refreshRebirthState`, `idle-ngu-etat.js:~1306`), au premier passage où `records.highestBoss >= 37` (ou `context.bosses >= 37`) : `resources.magic.cap = max(cap, 10000)`, `capNaturel = max(capNaturel, 10000)`, `speed = max(speed, 3)`, `bars = max(bars, 1)`. Idem pour R3 à l'obtention de la preuve / déblocage des Hacks : `cap >= 10000`, `speed >= 3`, `bars >= 1`.
2. Remplacer les gardes `!state.systems.bloodMagic.unlocked` de la PRODUCTION et de l'ALLOCATION de Magie (`idle-ngu-ressources.js:291,339,363,414,436` ; `idle-ngu-pistes.js:129,160,209,891,924-929,997,1157`) par `ressourceDecouverteV1(state,"magic")` (déjà permanent, `idle-ngu-catalogues.js:714`). Garder `bloodMagic.unlocked` pour les écrans et rituels de Blood Magic eux-mêmes (le jeu les masque par `bossID >= 37`, `ButtonShower`).
3. Test : Rebirth avec `records.highestBoss = 40` et `context.bosses = 5` : Magie > 0 /s, allocation acceptée, vitesse >= 3, cap >= 10 000.
Constante déjà lue dans le jeu, donc aucune entrée au registre « choix SOREAL » à ajouter.

### E2 (moyen) : barres (`bars`) non tronquées, caps non arrondis
**Jeu** : `Character::totalEnergyBar` (2143), `totalMagicBar` (2147), `totalRes3Bar` (2151) renvoient un `Int64` : le produit (achat x perk x quirk x souhait x MacGuffin x (1 + équipement)) est plafonné à 1e18 puis, pour Energy/Magic, multiplié par le facteur de potion de barre, puis `conv.i8` (TRONCATURE), puis `max(1, ...)`. `totalCapEnergy` (2144), `totalCapMagic` (2148), `totalCapRes3` (2152) : `Convert.ToInt64(double)` (arrondi au plus proche, demi vers le pair), puis `min(hardCap = 9e18)`, `max(1)`. `totalEnergyPower` (2142), `Magic/Res3Power` restent des flottants (non tronqués).
**SOREAL** : `idleNguEffectiveResourceStatV1` (`idle-ngu-ressources.js:216-263`) renvoie `(raw + flat) x mult` sans troncature pour `bars` et `cap`. Conséquence : une barre de 3 avec un multiplicateur 1,25 vaut 3,75 chez SOREAL contre 3 dans le jeu ; `advanceGeneratedResources` (`:373`) crédite `fullFills x bars` fractionnaire. Effet important surtout en début de Rebirth / début de partie (bars de 1 à quelques dizaines avec des multiplicateurs de perks, quirks et équipement), négligeable ensuite.
**Correctif** : dans `idleNguEffectiveResourceStatV1`, après le plafonnement et les potions : `bars` -> `Math.max(1, Math.trunc(valeur))` pour energy/magic/r3 ; `cap` -> arrondi pair de `valeur` (équivalent `Convert.ToInt64`), puis `min(9e18)`, `max(1)`. Ne pas toucher `power`. Vérifier ensuite `idle-bonus-memo-v1` (SOREAL_IDLE_VERIF_BONUS=1) et les tests de vitesse/cap d'énergie.

### E3 (faible) : déblocage des compétences de Basic Training : `>` dans le jeu, `>=` chez SOREAL
**Jeu** : `OffenseTraining::locked` (4349) et `DefenseTraining::locked` (4319), pour la compétence `id >= 1` : verrouillée tant que `niveau(id-1) <= id x 5000` (`cgt` puis `ceq 0`). Il faut donc 5001 niveaux (puis 10001, 15001, 20001, 25001) ; `OffenseTraining::addEnergy` (4360), `cap` (4359) et `addSum` (4363) refusent l'énergie d'une compétence verrouillée.
**SOREAL** : `isBasicTrainingSkillUnlockedV411` (`idle-basic-training.js:229-233`) : `previous.level >= prerequisiteLevel` (5000, 10000...). Écart d'un niveau (au plus un remplissage de barre) : cosmétique mais exact. Les autres usages passent par la même fonction (`:399`, `:459` cascade auto, `:544`, `:657-672`) ; la cascade auto (`needed = prerequisiteLevel`, `:459`) doit suivre.
**Correctif** : `>` au lieu de `>=` en `:231` et prendre `needed + 1` en `:459`. Mettre à jour `idle-basic-training-auto-advance.test.mjs` et `idle-basic-training-number-and-advanced-unlock.test.mjs` qui figent le seuil.

---

## 2. Time Machine (méthodes 4231-4289, 2245, 2216-2218, 2042, 3213)

Constantes lues : `TimeMachine::.ctor` (4231) : `speedBuildTime = 100000`, `goldMultiBuildTime = 1000000`, coûts `1e9` (non utilisés, voir plus bas) ; `TimeMachineController::.ctor` (4289) : `baseSpeedCost = baseGoldMultiCost = 5 000 000`. Scène (`TimeMachineController`) : `baseNormalSpeedDivider = baseNormalGoldMultiDivider = 1e6`, `baseEvil... = 999999984306749400` (1e18 en flottant 32 bits), `baseSadistic... = 1.0000000150474662e30` (1e30). `sadisticDivider()` (4249) = 1. `Character::totalDiscount` (2166) = 1 (aucune réduction).

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Durée d'un niveau (vitesse et Or) | progression par tick (0,02 s) = `puissance / diviseur x (allocation / 50000) x hack x défi x carte / (niveau + 1)` (4250, 4252) ; soit `1e9 x (niveau+1) x diviseurDeDifficulté / (allocation x puissance x ...)` s ; Énergie pour la vitesse, Magie pour l'Or | `tmSecondsFactorV1` x `(niveau + 1)` (`idle-ngu-pistes.js:798-807`) : `1e9 x diviseur / (alloc x puissance x hack x défi x cartes)` | CONFORME |
| Diviseurs de difficulté | Normal 1e6, Evil 1e18, Sadistic 1e30 (le `sadisticDivider` = 1 ne change rien) | `IDLE_DIFFICULTY_SPEED_DIVIDERS_V1.timeMachine` = 1e12 / 1e24 (rapport à Normal) | CONFORME (1e18/1e6 = 1e12 ; 1e30/1e6 = 1e24) |
| Bonus de vitesse hacks | `HacksController::totalTMSpeedBonus` (3213) = 1 en Normal, `hackBonus(2)` en Evil+ | `hackFxV1(state).timeMachineSpeed` (`idle-ngu-bonus.js:199-217`, 1 en Normal) | CONFORME |
| Bonus de défi vitesse | `TMSpeedBonus` (2042) = `1 + 0,1 x completions Evil` | `timeMachineSpeedMultiplier = 1 + noTimeMachineEvil x 0,10` (`idle-ngu-catalogues.js:388`) | CONFORME |
| Plafond 1 niveau par tick | la barre est remise à 0 dès qu'elle atteint 1 (4260-4261) : un niveau par tick maxi | `dureeNiveauEnTicksV1` (`idle-tick-v1.js:12`) : au moins un tick | CONFORME |
| Coût en Or d'un niveau | `(niveau + 1) x 5 000 000` payé au tick où la barre vaut 0 (4260) ; sans assez d'Or la barre ne bouge pas | `tmLevelGoldCost` = `5e6 x niveau cible` payé à `progress <= 0` (`:826`, `:1070-1137`) | CONFORME |
| Barres par seconde | `min(niveau vitesse + 1, 50)` (4254) | `min(50, 1 + niveau)` (`:897`, `:1178`) | CONFORME |
| Multiplicateur de vitesse du GPS | `max(1, ceil(niveau - 48))` (4255) | `niveau < 50 ? 1 : 1 + (niveau - 49)` | CONFORME |
| Multiplicateur d'Or | `niveau Or + 1` (4256) | `1 + goldLevel` | CONFORME |
| Or par seconde brut | `realBaseGold x machineBossMulti x barres/s x multVitesse x multOr x BloodMagic.goldBonus x Barbes.goldBonus x NGU x totalGPSbonus` (2216), net = brut - drain Diggers, plancher 0 (2217) | `idleNguTimeMachineGrossGoldPerSecond` (`:1171-1196`), net `:1198` | CONFORME (ordre sans importance) |
| `machineBossMulti` | `max(1, highestBoss - 27)` (2131), sans plafond ; `highestBoss` (`advanceBoss`, 1546) = identifiant du boss atteint (compteur 0-based : 301 au dernier), mis à jour en Normal seulement | `max(1, min(274, highestBossEver - 27))` | CONFORME (le plafond 274 n'est jamais dépassé car 301 - 27 = 274) |
| Sort Counterfeit (Blood Magic gold) | `1 + floor((log2(sang/min) + 1)^2) x 0,01` (1433) | `idle-ngu-systemes.js:290` | CONFORME |
| Or par remplissage (`realBaseGold`) | `setbaseGold` (4245) : seulement si `bossID > 29` et si l'Or du butin dépasse le record, appelé par `LootDrop::goldDrop` (487, Or avec `totalGoldbonus` et tirage 4-5) ; remis à 0 par `reset` (4266) | `bestGoldThisRun` (`idle-ngu-actions.js:262-267`, `bosses >= 30`), remis à 0 au Rebirth | CONFORME pour les kills de zone ; voir N1 pour les titans |
| Porte de la Time Machine | `updateTimeMachine` (4240) : `bossID > 29` | `unlock.bosses = 30` (`idle-ngu-catalogues.js:684`) | CONFORME |
| Banque de niveaux au Rebirth | `reset` (4266) : `levelSpeed x totalBankedTimeMachine` (perk ITOPOD), plafonné ; `setBankedLevels` à `bossID == 30` | `idle-ngu-actions.js:722` | CONFORME (structure) |
| Hors ligne (2245) | niveaux par `scaledLevelGain`, bornés par l'Or POSSÉDÉ, cible non lue, potion minutée : progression / `potionModifier` | `avancerTmGrossierV1` | ÉCART déjà documenté, voir `hors-ligne.md` E1 (non rouvert ici) |

---

## 3. Basic Training

Scène/statique lus : `_attackCaps = _defenseCaps` = **2500, 15000, 30000, 50000, 70000, 100000** ; `evilAttackCaps = evilDefenseCaps` = **250000, 1500000, 3000000, 5000000, 7000000, 10000000** ; `_trainFactor` = 150, 1000, 5000, 20000, 80000, 250000 (CONFORME avec `idle-basic-training.js:18-134`, `baseCap` et `baseValue`).

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Caps de départ (Normal) | tableau ci-dessus | `baseCap` 2500...100000 | CONFORME (devient VÉRIFIÉ, la note « non lisible » de `aventure.md` est levée) |
| Caps Evil | `evilAttackCaps` : tableau (x100 de Normal) ; seule occurrence d'écriture : `ImportExport::loadData` (4535), aucune lecture dans le jeu | non utilisés | NON VÉRIFIÉ : le champ n'est jamais lu dans l'IL ; le cap vient de `_attackCaps` (modifié à chaque Rebirth) |
| Bonus de stat | `somme(niveau^1,3 x trainFactor)` (4406) | `idle-basic-training.js:579-590` | CONFORME |
| Vitesse | à chaque tick `énergie / cap` ; à 1 un remplissage, `levelUp` ; énergie >= cap : un remplissage par tick (4352) | `levelsPerSecondForBasicTrainingSkillV411` (`:251`) | CONFORME |
| Niveaux par remplissage | `+1` (4354), `+1` si perk ITOPOD 15, `+1` si quirk 17, `+1` si souhait 23 niveau >= 1 | `levelsPerFillBasicTrainingV411` (`:243`), quirk 17 et souhait 23 valent 1 chacun | CONFORME |
| Réduction du cap au Rebirth | `Rebirth::resetTraining` (2715) : `r = (long)(1 + (n - 500i)^1,2 / 500 x cap/1000)`, `r >= 1`, `r <= cap/10 + 1`, nouveau cap = `cap - r` s'il reste > 1, sinon 1 ; `n < 500 i` -> NaN -> `r = 1` | `nextBasicTrainingCapV411` (`:283-301`) | CONFORME |
| Hors ligne (2236) | `pct = min(E, cap)/cap`, `constantLevelGain` (2255, mêmes ticks que le tick en ligne), puis +1 niveau par bonus (perk 15, quirk 17, souhait 23) | `advanceBasicTrainingSkillV411` | CONFORME (structure ; le coin `ticks < ceil(need x progression)` de `constantLevelGain` est recopié dans `idle-tick-v1.js:70-75`) |
| Déblocage d'une compétence | niveau précédent `> id x 5000` | `>=` | ÉCART E3 |
| Auto-advance | à `énergie >= 2` et `id != 5`, l'énergie au-delà du cap passe à la compétence suivante (4361) | `advanceBasicTrainingStateAutoV411_` | NON VÉRIFIÉ en détail |

## 4. Advanced Training (méthodes 30-74, 2214, 2246)

Scène (`AdvancedTrainingController`) : `baseTime` = 10 000 000 pour les ids 0 (Toughness), 1 (Power), 2 (Block) ; 20 000 000 pour 3 et 4 (Wandoos Énergie / Magie) ; `levelFactor` = 0,01 pour tous.

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Progression par tick | `(énergie / 50) x sqrt(totalEnergyPower) x (1 + équip 13 + équip 32) / (baseTime x (niveau + 1))` (36, 39, 2214) ; le souhait 190 niveau >= 1 donne 1 par tick (50 niveaux/s) | `rate = alloc x sqrt(puissance) x gearAtSpeed / (baseSeconds x 1000)` (`idle-ngu-pistes.js:509-518`), `baseSeconds` 10 000 / 20 000 (Wandoos) | CONFORME |
| Bonus Power / Toughness | `0,1 x niveau^0,4` (71, 72), niveau[1] pour Power, niveau[0] pour Toughness ; Power sert l'attaque ET les PV, Toughness la défense ET la régénération (2162-2165) | `1 + niveau^0,4 x 0,1` (`idle-ngu-bonus.js:795-796`), `multPower` aux PV, `multToughness` à la régénération (`:1285-1288`) | CONFORME |
| Wandoos Énergie / Magie | `trainingBonus` = `levelFactor x niveau` = +1 % par niveau (47) | `1 + niveau x 0,01` (`idle-ngu-etat.js:429-430`) | CONFORME |
| Hors ligne (2246) | niveaux bornés par la cible ; potion minutée : progression / `sqrt(potionModifier)` ; souhait 190 : `secs x 50` niveaux (plafond 1e18) | `idle-ngu-pistes.js:493-530` | CONFORME (déjà couvert par `hors-ligne.md` E5) |

---

## 5. Énergie, Magie, Ressource 3 : production et plafonds

| Point | Jeu | SOREAL | Verdict |
|---|---|---|---|
| Départ Énergie | vitesse 1, cap 500, énergie 250, `bars` 1, puissance 1 (`hardReset`, 2118) | `defaultResource` | CONFORME |
| Vitesse Énergie | `energySpeed x (1 + équip[2])`, bornée à `[1, 50]` (2140) ; `energyPerSecond = 50 / ceil(50 / vitesse) x totalEnergyBar` (2141) | `clamp(speed, 1, 50)`, `50 / ceil(50/v) x bars` (`idle-ngu-ressources.js:345-351`) | CONFORME (les bonus plats de set sont ajoutés à `energySpeed` dans le jeu, `AllItemListController::checkforBonuses` 3406 : même effet que `(raw + flat) x mult`) |
| Vitesse Magie | `magicBarSpeed x (1 + équip[4])`, plafonnée à 50, pas de plancher (2205) | idem, plancher 1 | CONFORME de fait : `unlockMagic` met la vitesse à 3 au minimum (voir E1) |
| Vitesse R3 | `res3BarSpeed` brute, sans équipement (2207) | brute | CONFORME |
| Puissance Énergie | `energyPower x perk ITOPOD x (1 + équip[1] + [16] + [33] + [27]) x MacGuffin[0] x Beast Quest x Souhaits`, plancher 1, plafond `hardCapPowBar` = 1e18, PUIS x `potionModifier` si potion minutée, PUIS x `potionModifier` si potion « 2 » (2142) ; `potionModifier` = 2 (x 1,1 avec Blue Heart) (724) | `idleNguEffectiveResourceStatV1` (`:216-263`) : plafond avant potions, 1e18 ; `idleSelloutPotionFactorV1` (`idle-sellout-shop-v1.js:339`) : x2 (x3 pour R3 minuté), x1,1 Blue Heart | CONFORME |
| Puissance Magie / R3 | même schéma (2146, 2150) ; potion R3 minutée x3 (`res3PotionModifier`, 725), potion « 2 » R3 x2 | idem | CONFORME |
| Cap | `capEnergy x perk x MacGuffin[1] x (1 + équip[20] + [37] + [29]) x Beast Quest x Souhaits`, plafond `hardCap` = 9e18, arrondi `Convert.ToInt64`, plancher 1 (2144) | `RESOURCE_STAT_HARD_CAPS_V1.cap = 9e18` | CONFORME pour le plafond ; ÉCART E2 pour l'arrondi |
| Barres | voir E2 | | ÉCART E2 |
| Plafonds durs | `hardCap` = 9e18 (2121), `hardCapPowBar` = 1e18 (2122) | `RESOURCE_STAT_HARD_CAPS_V1` | CONFORME |
| Cap naturel d'Énergie au Rebirth | `resetEnergy` (2711) : si `capEnergy <= 100000` : `floor(energyGained / 20 + 500)`, plafonné à 100 000 ; `energyGained` cesse de compter à 3 000 000 (`Energy::addEnergy`, 2271) | `applyNaturalEnergyCapGrowthOnRebirth` (`idle-ngu-actions.js:615-621`), `advanceGeneratedResources` (`:382`) | CONFORME |
| Hors ligne Énergie / Magie / R3 | `gain = (long)(secs x perSecond)` borné par la place restante ; `energyGained` augmente du gain complet (2232-2234) | `advanceGeneratedResources` (barre continue) | CONFORME à moins d'un remplissage près |
| Secret speedrun | `checkSpeedrunSecret` (2680) : `bossID >= 37`, durée du Rebirth <= 1800 s, 3 de suite, une fois : +200 EXP, +1 puissance d'énergie | `idle-ngu-actions.js:648-659` | CONFORME |
| Money Pit : récompense unique | `PitController::tier2TotalReward` (1609) : +1 `energyBars` ET +1 `magicPerBar` | non relu ici | NON VÉRIFIÉ (`MONEY-PIT-CODE-DU-JEU-2026-11-16.md` couvre le Pit) |

---

## 6. Non vérifié

- **N1 : Or des titans et `realBaseGold`** : `setbaseGold` n'est appelée que par `LootDrop::goldDrop`, elle-même appelée uniquement par les `zone0Drop` à `zone45Drop`. SOREAL compte aussi un butin de titan (`idle-ngu-actions.js:259-270`, `advActionInv === "titan"`, avec `creditTitanRewardsV1`, `idle-adventure-combat.js:298`, qui crédite de l'Or). Je n'ai pas établi si les titans du jeu passent par un `zoneNDrop` (et donc comptent) ni s'ils donnent de l'Or ; à lire dans les méthodes de mort de titan avant de toucher.
- `TimeMachine::goldMultiTimeLeft` et affichages (4234, 4235) : textes seulement.
- `Training::evilAttackCaps` : jamais lu dans l'IL (voir tableau 3).
- Auto-advance de Basic Training : 4361 lu mais pas confronté à `advanceBasicTrainingStateAutoV411_`.
