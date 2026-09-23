/*
 * SOREAL IDLE — Perks (ITOPOD, PP currency).
 *
 * Source: NGU Idle wiki (https://ngu-idle.fandom.com/wiki/Perk_Points),
 * indices 0-55 — the Normal-accessible portion of Page 1.
 *
 * Extension (2026-09-18, Norman : "il faut tout faire" -- Evil/Sadistic
 * fidélité). Le déni précédent ("index 56 exclu jusqu'à ce qu'Evil
 * existe") reposait sur une lecture erronée du wiki : la colonne "Buy
 * Early?" du tableau (valeurs "Evil only"/"Sadistic only"/"No"/"Yes")
 * est un CONSEIL STRATÉGIQUE communautaire sur l'ordre d'achat efficace
 * ("cette perk n'est rentable qu'une fois en Evil/Sadistic, vu son
 * coût"), jamais une restriction d'achat imposée par le jeu -- exactement
 * comme les valeurs "YES (second)"/"Maybe a few" déjà présentes sur les
 * indices 0-55 ci-dessous, qui n'ont jamais été traitées comme une
 * mécanique de verrouillage. Chaque perk reste achetable dès que son
 * coût en PP est payé, quelle que soit la difficulté courante -- aucun
 * champ requiresDifficulty n'existe ni n'est nécessaire.
 *
 * Indices 56-231 ajoutés SEULEMENT quand leur effet correspond à un
 * mécanisme déjà construit chez SOREAL (mêmes clés bonus déjà agrégées
 * par perkBonusesV1 ci-dessous, ou hooks Blood Magic/Aventure/ngu déjà
 * câblés ailleurs) :
 * - 57-64, 74-81, 116-121, 126-131, 135-140, 220-225 : paliers II-VI/
 *   "Final" des perks génériques Energy/Magic Power/Bars/Cap et Faster
 *   NGU Energy/Magic déjà présents en indices 6-11/13-14 -- même clés
 *   bonus (energyPowerPct, nguSpeedEnergyPct, etc.), juste un palier de
 *   plus.
 * - 82-83, 149-154 : paliers III-VI des Rich Perks (statPct/
 *   adventureStatsPct) déjà présents en indices 5/54-55.
 * - 107, 229-230 : paliers III-V de Boosted Boosts (boostPowerPct) déjà
 *   présent en indices 12/33.
 * - 125, 144 : "Welcome to Evil/Sadistic Difficulty", bonus ponctuels
 *   (cap 1) en statPct/dropChancePct/adventureStatsPct, toutes des clés
 *   déjà agrégées. La perk 144 documente aussi +20% Aug Speed et +20%
 *   NGU Speed dans son texte wiki réel -- ces deux composantes N'ONT PAS
 *   de hook existant (Aug Speed : aucun multiplicateur perk-based sur
 *   augmentationSecondsForNextLevel ; NGU Speed : setRewards.nguSpeedPct
 *   couvre les sets d'Aventure, pas les perks) et sont donc
 *   volontairement OMISES de `bonus` -- reward partiel honnête plutôt
 *   qu'une perk à moitié inventée, `effect` reste le texte wiki complet.
 * - 231 : "ERROR" est une perk-blague sans AUCUN effet mécanique réel
 *   (texte : "NGU.EXE HAS ENCOUNTERED AN ERROR AND MUST CLOSE") --
 *   `bonus:{}` est donc la valeur réelle, pas un renoncement.
 *
 * Volontairement exclus (système absent de SOREAL, jamais approximé) :
 * MacGuffin Daycare (56 ; 65-73 et 88 câblés le 2026-09-23, voir
 * idle-macguffins-v1.js), Quêtes/Idle Questing (87,89-92,104-106,
 * 145-148), Wishes (108-110,155-156,159-160), Cards/Mayo/Tags/Deck (161-
 * 216,138-143,146-150 quirks), Hack Milestones (113-115,217-219 --
 * mécanique de palier non identifiée avec certitude dans le temps
 * imparti), Resource 3 (95-103,122-124,132-134,141-143,226-228 -- pas de
 * 3e ressource entraînable chez SOREAL, seulement Energy/Magic), Iron Pill I/II
 * (84-85 -- multiplierait castBloodSpell's gain ironPill, hook non
 * construit dans ce round), respawn (93 -- aucune minuterie de
 * réapparition ennemie n'existe dans le modèle de combat SOREAL).
 *
 * Previously "Perks" was a single generic counter (one shared level,
 * exponential 1.55^level cost) with no per-item identity or real effect —
 * nothing here matched the wiki. Each entry below is a real, individually
 * purchasable perk with its own flat per-level cost and cap, exactly as
 * the wiki lists it. `bonus` keys are summed (level × per-level value)
 * across all purchased perks by perkBonusesV1() below; idle-ngu-progression.js
 * wires the resulting totals into the same bonus object other systems
 * (challenges, beard, diggers) already feed.
 *
 * A handful of perks (16, 17: Yggdrasil auto-activation timers) have no
 * `bonus` entry — SOREAL IDLE has no Yggdrasil bonus-activation-timer
 * concept yet to hook them into. They are still real, purchasable,
 * correctly-costed catalog entries; only their mechanical payoff is
 * pending a future Yggdrasil pass. Never silently drop or fake data to
 * avoid an empty bonus object — an honest gap beats an invented one.
 *
 * Audit 2026-09-16 — "The Fibonacci Perk" (wiki index 94, listed further
 * down Page 1 than index 56 because most of its own milestones are
 * Evil/Sadistic-tier, but its early tiers are explicitly Normal per
 * ngu-core-tracks.md/itopod.md) was entirely missing from this catalog.
 * Unlike every perk above, it is NOT a linear per-level bonus — leveling
 * it unlocks a fixed, qualitatively different bonus at each
 * Fibonacci-numbered level (1, 2, 5, 8, 13, 21, 34, 55, 89, 144, ...,
 * cap 1597), so it carries its own `fibonacciMilestones` array instead of
 * a `bonus` map, applied by perkBonusesV1() as threshold unlocks rather
 * than level x perLevel sums. Only the milestones independently confirmed
 * against the local wiki mirror (1, 2, 5, 8, 21, 55, 144) are wired to a
 * real bonus below; milestones 13 (ITOPOD PP earnings), 89 (AP gain) and
 * 987 (flat EXP gain) have no aggregator field anywhere in this codebase
 * yet (AP/EXP/PP-earnings are not currently multiplier-driven) — left
 * undocumented in code rather than inventing a new global multiplier
 * system as a side effect of adding one perk. Same honesty rule as 16/17.
 */

import { IDLE_CARDS_PERKS_V1 } from "./idle-cards-v1.js";

export const IDLE_PERKS_CATALOG_V1 = Object.freeze([
  { id: 0, name: "The Newbie Energy Perk", effect: "Gain 3 Energy Power and 3 Energy Bars!", cost: 1, cap: 1, bonus: { energyPowerFlat: 3, energyBarsFlat: 3 } },
  { id: 1, name: "The Newbie Magic Perk", effect: "Gain 1 Magic Power, 1 Magic Bar, and 10k Magic Cap!", cost: 1, cap: 1, bonus: { magicPowerFlat: 1, magicBarsFlat: 1, magicCapFlat: 10000 } },
  { id: 2, name: "The Newbie Adventure Perk", effect: "Gain a flat +100 Power and Toughness for Adventure now, and a +10% bonus for all eternity!", cost: 1, cap: 1, bonus: { adventurePowerFlat: 100, adventureToughnessFlat: 100, adventureStatsPct: 0.10 } },
  { id: 3, name: "The Newbie Drop Chance Perk", effect: "Gain a permanent 10% multiplier to your Drop Chance!", cost: 1, cap: 1, bonus: { dropChancePct: 0.10 } },
  { id: 4, name: "The Newbie Stat Perk", effect: "Gain a permanent 100% multiplier to your Attack and Defense!", cost: 1, cap: 1, bonus: { statPct: 1.0 } },
  { id: 5, name: "Stat Boost for Rich Perks I", effect: "Each level increases your base Attack/Defense by 10%.", cost: 1, cap: 1000, bonus: { statPct: 0.10 } },
  { id: 6, name: "Generic Energy Power Perk I", effect: "+1% bonus multiplier to your Energy Power per level", cost: 1, cap: 50, bonus: { energyPowerPct: 0.01 } },
  { id: 7, name: "Generic Energy Bar Perk I", effect: "+1% bonus multiplier to your Energy Bars per level", cost: 1, cap: 50, bonus: { energyBarsPct: 0.01 } },
  { id: 8, name: "Generic Energy Cap Perk I", effect: "+1% bonus multiplier to your Energy Cap per level", cost: 1, cap: 50, bonus: { energyCapPct: 0.01 } },
  { id: 9, name: "Generic Magic Power Perk I", effect: "+1% Magic Power per level", cost: 1, cap: 50, bonus: { magicPowerPct: 0.01 } },
  { id: 10, name: "Generic Magic Bar Perk I", effect: "+1% Magic Bars per level", cost: 1, cap: 50, bonus: { magicBarsPct: 0.01 } },
  { id: 11, name: "Generic Magic Cap Perk I", effect: "+1% Magic Cap per level", cost: 1, cap: 50, bonus: { magicCapPct: 0.01 } },
  { id: 12, name: "Boosted Boosts I", effect: "Boost the power of all applied boosts by 2.5% per level", cost: 1, cap: 60, bonus: { boostPowerPct: 0.025 } },
  { id: 13, name: "Faster NGU Energy", effect: "+2.5% per level Energy NGU speed", cost: 5, cap: 20, bonus: { nguSpeedEnergyPct: 0.025 } },
  { id: 14, name: "Faster NGU Magic", effect: "+2.5% per level Magic NGU speed", cost: 5, cap: 20, bonus: { nguSpeedMagicPct: 0.025 } },
  { id: 15, name: "Double Basic Training", effect: "Every time a Basic Training bar fills, you will gain TWO levels instead of one!", cost: 100, cap: 1, bonus: { doubleBasicTraining: 1 } },
  { id: 16, name: "Quicker Power Fruit Beta Activation", effect: "Power Fruit Beta's bonus will automatically turn on after 30 minutes", cost: 50, cap: 1, bonus: {} },
  { id: 17, name: "Quicker Fruit of Numbers Bonus Activation", effect: "Fruit of Numbers' bonus will automatically turn on after 30 minutes", cost: 50, cap: 1, bonus: {} },
  { id: 18, name: "Instant Advanced Training Levels!", effect: "Gain an extra level of Advanced Training at the start of every rebirth", cost: 2, cap: 100, bonus: { advancedTrainingStartBonus: 1 } },
  { id: 19, name: "Fruit of Knowledge sucks, 1/5", effect: "Fruit of Knowledge yields 3x more EXP", cost: 20, cap: 1, bonus: { fruitKnowledgeExpMult: 2 } },
  { id: 20, name: "Fruit of Knowledge STILL sucks, 1/5", effect: "ANOTHER 3x EXP from Fruit of Knowledge", cost: 150, cap: 1, bonus: { fruitKnowledgeExpMult: 2 } },
  { id: 21, name: "Five O'Clock Shadow", effect: "Beard trim time factor grows faster, to a minimum of 12 hours", cost: 10, cap: 12, bonus: { beardTrimSpeedLevel: 1 } },
  { id: 22, name: "Wandoos Lover", effect: "+2 to your total OS level per level", cost: 1, cap: 50, bonus: { wandoosOsLevelFlat: 2 } },
  { id: 23, name: "Golden Showers", effect: "+5% multiplier to all gold drops in Adventure", cost: 1, cap: 200, bonus: { adventureGoldPct: 0.05 } },
  { id: 24, name: "I Want Your Seeds ;)", effect: "+5% multiplier to all seed earnings", cost: 10, cap: 20, bonus: { seedYieldPct: 0.05 } },
  { id: 25, name: "The Loot Goblin's Blessing", effect: "1% chance that any item dropped at lvl 1 or higher gains +1 level", cost: 10, cap: 10, bonus: { lootGoblinChancePct: 0.01 } },
  { id: 26, name: "Improved Cube Boosting!", effect: "Boosts going into the cube convert at a 2% rate instead of 1%", cost: 100, cap: 1, bonus: { cubeBoostRatePct: 0.01 } },
  /*
   * Daycare Kitty's Blessing I/II : page « Item Daycare » (section Time Reductions) -- ce sont des
   * RÉDUCTIONS DE TEMPS (-1 % par niveau, x95 % chacune au maximum, rétroactives), pas une hausse
   * de vitesse : clé daycareTimePct, repliée en produit par perkBonusesV1 (daycareTimeMultiplier).
   */
  { id: 27, name: "Daycare Kitty's Blessing I", effect: "Grow your daycare items 1% faster per level", cost: 5, cap: 5, bonus: { daycareTimePct: 0.01 } },
  { id: 28, name: "Daycare Kitty's Blessing II", effect: "Additional 1% faster per level", cost: 25, cap: 5, bonus: { daycareTimePct: 0.01 } },
  { id: 29, name: "You'll Really Want This", effect: "This perk awards a FREE accessory slot, pure and simple.", cost: 250, cap: 1, bonus: { accessorySlotBonus: 1 } },
  { id: 30, name: "What a Crappy Perk", effect: "Tiny chance ITOPOD dudes drop poop, works offline", cost: 25, cap: 1, bonus: {} },
  { id: 31, name: "More Inventory Space I", effect: "Extra Inventory Space per level", cost: 2, cap: 12, bonus: { inventorySlotBonus: 1 } },
  { id: 32, name: "More Inventory Space II", effect: "Extra Inventory Space per level (pricier)", cost: 10, cap: 12, bonus: { inventorySlotBonus: 1 } },
  { id: 33, name: "Boosted Boosts II", effect: "Additional 2% stacking bonus to boost power per level", cost: 5, cap: 60, bonus: { boostPowerPct: 0.02 } },
  { id: 34, name: "Bonus Titan EXP!", effect: "First 3 kills of each titan, each rebirth, grant +50% extra EXP per level", cost: 30, cap: 3, bonus: { titanExpFirstKillsPct: 0.50 } },
  { id: 35, name: "Bonus Boss Exp!", effect: "+2% bonus to exp dropped by bosses 24 and on, per level", cost: 20, cap: 25, bonus: { bossExpPct: 0.02 } },
  { id: 36, name: "Advanced Training Level Bank I", effect: "Saves 1% (rounded down) of Advanced Training levels gained per rebirth", cost: 3, cap: 10, bonus: { atBankPct: 0.01 } },
  { id: 37, name: "Advanced Training Level Bank II", effect: "Saves an additional 1% of Advanced Training levels gained per rebirth", cost: 10, cap: 10, bonus: { atBankPct: 0.01 } },
  { id: 38, name: "Advanced Training Level Bank III", effect: "Saves an additional 1% of Advanced Training levels gained per rebirth", cost: 25, cap: 10, bonus: { atBankPct: 0.01 } },
  { id: 39, name: "Advanced Training Level Bank IV", effect: "Saves an additional 1% of Advanced Training levels gained per rebirth", cost: 50, cap: 10, bonus: { atBankPct: 0.01 } },
  { id: 40, name: "Advanced Training Level Bank V", effect: "Saves an additional 1% of Advanced Training levels gained per rebirth", cost: 100, cap: 10, bonus: { atBankPct: 0.01 } },
  { id: 41, name: "Time Machine Level Bank I", effect: "Saves 1% of Time Machine levels gained per rebirth", cost: 3, cap: 10, bonus: { tmBankPct: 0.01 } },
  { id: 42, name: "Time Machine Level Bank II", effect: "Saves an additional 1% of Time Machine levels gained per rebirth", cost: 10, cap: 10, bonus: { tmBankPct: 0.01 } },
  { id: 43, name: "Time Machine Level Bank III", effect: "Saves an additional 1% of Time Machine levels gained per rebirth", cost: 25, cap: 10, bonus: { tmBankPct: 0.01 } },
  { id: 44, name: "Time Machine Level Bank IV", effect: "Saves an additional 1% of Time Machine levels gained per rebirth", cost: 50, cap: 10, bonus: { tmBankPct: 0.01 } },
  { id: 45, name: "Time Machine Level Bank V", effect: "Saves an additional 1% of Time Machine levels gained per rebirth", cost: 100, cap: 10, bonus: { tmBankPct: 0.01 } },
  { id: 46, name: "Beard Temp Level Bank I", effect: "Saves 1% of temporary Beard levels gained per rebirth", cost: 3, cap: 10, bonus: { beardBankPct: 0.01 } },
  { id: 47, name: "Beard Temp Level Bank II", effect: "Saves an additional 1% of temporary Beard levels gained per rebirth", cost: 10, cap: 10, bonus: { beardBankPct: 0.01 } },
  { id: 48, name: "Beard Temp Level Bank III", effect: "Saves an additional 1% of temporary Beard levels gained per rebirth", cost: 25, cap: 10, bonus: { beardBankPct: 0.01 } },
  { id: 49, name: "Beard Temp Level Bank IV", effect: "Saves an additional 1% of temporary Beard levels gained per rebirth", cost: 50, cap: 10, bonus: { beardBankPct: 0.01 } },
  { id: 50, name: "Beard Temp Level Bank V", effect: "Saves an additional 1% of temporary Beard levels gained per rebirth", cost: 100, cap: 10, bonus: { beardBankPct: 0.01 } },
  { id: 51, name: "The First Harvest's The Best", effect: "+10% bonus to the first eaten or harvested fruit for all fruits, per level", cost: 25, cap: 5, bonus: { firstHarvestPct: 0.10 } },
  { id: 52, name: "A Digger Slot!", effect: "Unlock an additional Digger Slot", cost: 25, cap: 1, bonus: { diggerSlotBonus: 1 } },
  { id: 53, name: "Ooh, Another Digger Slot!", effect: "Yet another Digger Slot", cost: 250, cap: 1, bonus: { diggerSlotBonus: 1 } },
  { id: 54, name: "Stat Boost for Rich Perks II", effect: "+1% Attack/Defense per level", cost: 100, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 55, name: "Adventure Boost For Rich Perks I", effect: "+0.1% to Adventure Stats per level", cost: 100, cap: 1000, bonus: { adventureStatsPct: 0.001 } },
  { id: 57, name: "Generic Energy Power Perk II", effect: "+1% bonus multiplier to your Energy Power per level", cost: 50, cap: 100, bonus: { energyPowerPct: 0.01 } },
  { id: 58, name: "Generic Energy Bar Perk II", effect: "+1% bonus multiplier to your Energy Bars per level", cost: 50, cap: 100, bonus: { energyBarsPct: 0.01 } },
  { id: 59, name: "Generic Energy Cap Perk II", effect: "+1% bonus multiplier to your Energy Cap per level", cost: 50, cap: 100, bonus: { energyCapPct: 0.01 } },
  { id: 60, name: "Generic Magic Power Perk II", effect: "+1% bonus multiplier to your Magic Power per level", cost: 50, cap: 100, bonus: { magicPowerPct: 0.01 } },
  { id: 61, name: "Generic Magic Bar Perk II", effect: "+1% bonus multiplier to your Magic Bars per level", cost: 50, cap: 100, bonus: { magicBarsPct: 0.01 } },
  { id: 62, name: "Generic Magic Cap Perk II", effect: "+1% bonus multiplier to your Magic Cap per level", cost: 50, cap: 100, bonus: { magicCapPct: 0.01 } },
  { id: 63, name: "Faster NGU Energy II", effect: "Raises the Speed of Energy-based NGU's by 2% per level", cost: 100, cap: 100, bonus: { nguSpeedEnergyPct: 0.02 } },
  { id: 64, name: "Faster NGU Magic II", effect: "Raises the Speed of Magic-based NGU's by 2% per level", cost: 100, cap: 100, bonus: { nguSpeedMagicPct: 0.02 } },
  /*
   * MacGuffin Fragments (2026-09-23, page Perk Points, lignes 65-73 et 88) :
   * effets lus directement par id dans idle-macguffins-v1.js (niveau de
   * drop, slots, drops ITOPOD et leurs réductions, sorts Blood α/β) --
   * `bonus` reste vide car aucune clé agrégée de perkBonusesV1 ne s'y
   * rapporte. 56 ("Macguffin Daycare!") reste exclu : dépend du Daycare.
   */
  { id: 65, name: "Improved Macguffin Drops I", effect: "Improve the base level of all MacGuffin drops by 1!", cost: 150, cap: 1, bonus: {} },
  { id: 66, name: "A MacGuffin Slot!", effect: "Gain an additional MacGuffin Slot!", cost: 250, cap: 1, bonus: {} },
  { id: 67, name: "Another MacGuffin Slot!", effect: "Gain another additional MacGuffin Slot!", cost: 5000, cap: 1, bonus: {} },
  { id: 68, name: "MacGuffin ITOPOD Drops!", effect: "This will unlock MacGuffin drops in the ITOPOD! Every 5000 kills, you'll obtain a random MacGuffin!", cost: 50, cap: 1, bonus: {} },
  { id: 69, name: "Improved MacGuffin ITOPOD Drops I", effect: "Reduce the number of kills per MacGuffin drop in the ITOPOD by 20%!", cost: 150, cap: 1, bonus: {} },
  { id: 70, name: "Improved MacGuffin ITOPOD Drops II", effect: "Reduce the number of kills per MacGuffin drop in the ITOPOD by another 25%!", cost: 500, cap: 1, bonus: {} },
  { id: 71, name: "Improved MacGuffin ITOPOD Drops III", effect: "Reduce the number of kills per MacGuffin drop in the ITOPOD by another 25%!", cost: 2500, cap: 1, bonus: {} },
  { id: 72, name: "Blood Macguffin α Spell!", effect: "Unlocks the Blood Macguffin α Spell, which can raise the level of a random equipped Macguffin!", cost: 100, cap: 1, bonus: {} },
  { id: 73, name: "Blood Macguffin β Spell!", effect: "Unlocks the Blood Macguffin β Spell, which can raise the level of ALL equipped Macguffins!", cost: 5000, cap: 1, bonus: {} },
  { id: 88, name: "Another MacGuffin Slot!", effect: "Gain an additional MacGuffin Slot! What were you expecting, a yacht?", cost: 40000, cap: 1, bonus: {} },
  { id: 74, name: "Generic Energy Power Perk III", effect: "+0.3% bonus multiplier to your Energy Power per level", cost: 250, cap: 100, bonus: { energyPowerPct: 0.003 } },
  { id: 75, name: "Generic Energy Bar Perk III", effect: "+0.3% bonus multiplier to your Energy Bars per level", cost: 250, cap: 100, bonus: { energyBarsPct: 0.003 } },
  { id: 76, name: "Generic Energy Cap Perk III", effect: "+0.3% bonus multiplier to your Energy Cap per level", cost: 250, cap: 100, bonus: { energyCapPct: 0.003 } },
  { id: 77, name: "Generic Magic Power Perk III", effect: "+0.3% bonus multiplier to your Magic Power per level", cost: 250, cap: 100, bonus: { magicPowerPct: 0.003 } },
  { id: 78, name: "Generic Magic Bar Perk III", effect: "+0.3% bonus multiplier to your Magic Bars per level", cost: 250, cap: 100, bonus: { magicBarsPct: 0.003 } },
  { id: 79, name: "Generic Magic Cap Perk III", effect: "+0.3% bonus multiplier to your Magic Cap per level", cost: 250, cap: 100, bonus: { magicCapPct: 0.003 } },
  { id: 80, name: "Faster NGU Energy III", effect: "Raises the Speed of Energy-based NGU's by 0.3% per level", cost: 250, cap: 100, bonus: { nguSpeedEnergyPct: 0.003 } },
  { id: 81, name: "Faster NGU Magic III", effect: "Raises the Speed of Magic-based NGU's by 0.3% per level", cost: 250, cap: 100, bonus: { nguSpeedMagicPct: 0.003 } },
  { id: 82, name: "Stat Boost for Rich Perks III", effect: "+1% to Attack/Defence per level", cost: 1000, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 83, name: "Adventure Boost For Rich Perks II", effect: "+0.1% to Adventure stats per level", cost: 1000, cap: 1000, bonus: { adventureStatsPct: 0.001 } },
  /*
   * Questing (2026-09-23, système construit dans idle-questing-v1.js -- lève l'exclusion
   * "Quêtes/Idle Questing" de l'en-tête pour 87, 89-92, 104-106, 145-148). Coût/plafond/texte :
   * page "Perk Points". Clés `quest*` relues par idleQuestBonusTotalsV1 ; "Better QP Rewards!"
   * rejoint qpEarningsPct, le même compartiment "QP rewards" que Fibonacci 233.
   */
  { id: 87, name: "Not So Minor Anymore", effect: "The base Minor Quest reward modifier is increased by 2 with this perk! Normally this value is 10.", cost: 30000, cap: 1, bonus: { questMinorBaseQp: 2 } },
  { id: 89, name: "Better QP Rewards!", effect: "Each level in this Perk will improve QP reward by 0.2%!", cost: 400, cap: 50, bonus: { qpEarningsPct: 0.002 } },
  { id: 90, name: "Improved Quest Looting", effect: "Each level in this Perk will improve the drop chance for Quest Items by 0.5%", cost: 200, cap: 30, bonus: { questDropsPct: 0.5 } },
  { id: 91, name: "Advanced Gooder Idle Questing", effect: "This perk will reduce the speed divider placed on Idle Questing by 1! Normally, this divider is 8.", cost: 25000, cap: 1, bonus: { questIdleDividerReduction: 1 } },
  { id: 92, name: "Even More Advanced Gooder Idle Questing", effect: "This perk will reduce the speed divider placed on Idle Questing by another 1! Normally, this divider is 8.", cost: 250000, cap: 1, bonus: { questIdleDividerReduction: 1 } },
  { id: 104, name: "Truly Idle Questing", effect: "With this Perk, Idle Quests will automatically be handed in, and a new Quest started!", cost: 200, cap: 1, bonus: { questTrulyIdle: 1 } },
  { id: 105, name: "Gooder Idle Questing", effect: "This perk will reduce the speed divider placed on Idle Questing by 2! Normally, this divider is 8.", cost: 100, cap: 1, bonus: { questIdleDividerReduction: 2 } },
  { id: 106, name: "Another Gooder Idle Questing", effect: "This perk will reduce the speed divider placed on Idle Questing by 1! Normally, this divider is 8.", cost: 5000, cap: 1, bonus: { questIdleDividerReduction: 1 } },
  { id: 107, name: "Boosted Boosts III", effect: "Additional 2% stacking bonus to the total boost power of any applied boost per level", cost: 20000, cap: 60, bonus: { boostPowerPct: 0.02 } },
  { id: 116, name: "Generic Energy Power Perk IV", effect: "+0.2% bonus multiplier to your Energy Power per level", cost: 100000, cap: 100, bonus: { energyPowerPct: 0.002 } },
  { id: 117, name: "Generic Energy Bar Perk IV", effect: "+0.2% bonus multiplier to your Energy Bars per level", cost: 100000, cap: 100, bonus: { energyBarsPct: 0.002 } },
  { id: 118, name: "Generic Energy Cap Perk IV", effect: "+0.2% bonus multiplier to your Energy Cap per level", cost: 100000, cap: 100, bonus: { energyCapPct: 0.002 } },
  { id: 119, name: "Generic Magic Power Perk IV", effect: "+0.2% bonus multiplier to your Magic Power per level", cost: 100000, cap: 100, bonus: { magicPowerPct: 0.002 } },
  { id: 120, name: "Generic Magic Bar Perk IV", effect: "+0.2% bonus multiplier to your Magic Bars per level", cost: 100000, cap: 100, bonus: { magicBarsPct: 0.002 } },
  { id: 121, name: "Generic Magic Cap Perk IV", effect: "+0.2% bonus multiplier to your Magic Cap per level", cost: 100000, cap: 100, bonus: { magicCapPct: 0.002 } },
  { id: 125, name: "Welcome to Evil Difficulty", effect: "Receive a +200% buff to Attack/Defense and 50% Drop Chance bonus", cost: 200, cap: 1, bonus: { statPct: 2.0, dropChancePct: 0.50 } },
  { id: 126, name: "Generic Energy Power Perk V", effect: "+0.2% bonus multiplier to your Energy Power per level", cost: 500000, cap: 100, bonus: { energyPowerPct: 0.002 } },
  { id: 127, name: "Generic Energy Bar Perk V", effect: "+0.1% bonus multiplier to your Energy Bars per level", cost: 500000, cap: 100, bonus: { energyBarsPct: 0.001 } },
  { id: 128, name: "Generic Energy Cap Perk V", effect: "+0.1% bonus multiplier to your Energy Cap per level", cost: 500000, cap: 100, bonus: { energyCapPct: 0.001 } },
  { id: 129, name: "Generic Magic Power Perk V", effect: "+0.2% bonus multiplier to your Magic Power per level", cost: 500000, cap: 100, bonus: { magicPowerPct: 0.002 } },
  { id: 130, name: "Generic Magic Bar Perk V", effect: "+0.1% bonus multiplier to your Magic Bars per level", cost: 500000, cap: 100, bonus: { magicBarsPct: 0.001 } },
  { id: 131, name: "Generic Magic Cap Perk V", effect: "+0.1% bonus multiplier to your Magic Cap per level", cost: 500000, cap: 100, bonus: { magicCapPct: 0.001 } },
  /*
   * Sadistic Boss Multiplier (2026-09-18) : wiki NGU local, page
   * "SADISTIC difficulty", section "Fight boss and number" — la base
   * 1.20^[boss] de la formule NUMBER (idle-ngu-progression.js,
   * calculateIdleNguNextNumber) peut être augmentée par ces 2 perks.
   * sadisticBossMultiplierBonus est additif, ajouté à la base avant
   * exponentiation, jamais un multiplicateur composé par-dessus.
   */
  { id: 157, name: "Improved Sadistic Boss Multiplier I", effect: "+0.0005 to the Sadistic Boss Multiplier per level (base 1.20)", cost: 1000000, cap: 10, bonus: { sadisticBossMultiplierBonus: 0.0005 } },
  { id: 158, name: "Improved Sadistic Boss Multiplier II", effect: "Another +0.0005 to the Sadistic Boss Multiplier per level (base 1.20)", cost: 20000000, cap: 10, bonus: { sadisticBossMultiplierBonus: 0.0005 } },
  { id: 135, name: "Generic Energy Power Perk VI", effect: "+0.2% bonus multiplier to your Energy Power per level", cost: 2500000, cap: 100, bonus: { energyPowerPct: 0.002 } },
  { id: 136, name: "Generic Energy Bar Perk VI", effect: "+0.1% bonus multiplier to your Energy Bars per level", cost: 2500000, cap: 100, bonus: { energyBarsPct: 0.001 } },
  { id: 137, name: "Generic Energy Cap Perk VI", effect: "+0.1% bonus multiplier to your Energy Cap per level", cost: 2500000, cap: 100, bonus: { energyCapPct: 0.001 } },
  { id: 138, name: "Generic Magic Power Perk VI", effect: "+0.2% bonus multiplier to your Magic Power per level", cost: 2500000, cap: 100, bonus: { magicPowerPct: 0.002 } },
  { id: 139, name: "Generic Magic Bar Perk VI", effect: "+0.1% bonus multiplier to your Magic Bars per level", cost: 2500000, cap: 100, bonus: { magicBarsPct: 0.001 } },
  { id: 140, name: "Generic Magic Cap Perk VI", effect: "+0.1% bonus multiplier to your Magic Cap per level", cost: 2500000, cap: 100, bonus: { magicCapPct: 0.001 } },
  {
    id: 144,
    name: "Welcome to Sadistic Difficulty",
    effect: "Receive a 1000% Bonus to Attack/Defense, 15% to Adventure Stats, 20% Aug Speed bonus, and 20% NGU Speed Bonus",
    cost: 500000,
    cap: 1,
    bonus: { statPct: 10.0, adventureStatsPct: 0.15, augmentSpeedPct: 0.2, nguSpeedEnergyPct: 0.2, nguSpeedMagicPct: 0.2 }
  },
  /* Questing (2026-09-23) : remise d'objets de quête et récompenses de base, page "Perk Points". */
  { id: 145, name: "Bonus Quest Handin Progess I", effect: "You can now hand in higher level Quest Items for added progress. The formula is 1 + (level/10) progress, rounded down.", cost: 1500, cap: 1, bonus: { questHandinReduction: 1 } },
  { id: 146, name: "Bonus Quest Handin Progess II", effect: "Reduce the level ratio for higher level Quest handins by 1 per level of this Perk! Originally the formula is 1 + (level/10), rounded down.", cost: 50000, cap: 2, bonus: { questHandinReduction: 1 } },
  { id: 147, name: "Improved Major Quest QP Rewards", effect: "Each level adds + 1 to Major Quests' Base QP! Normally this is 50.", cost: 1000000, cap: 10, bonus: { questMajorBaseQp: 1 } },
  { id: 148, name: "Improved Minor Quest QP Rewards", effect: "Each level adds + 1 to Minor Quests' Base QP! Normally this is 10.", cost: 5000000, cap: 2, bonus: { questMinorBaseQp: 1 } },
  { id: 149, name: "Stat Boost for rich Perks IV", effect: "+1% to Attack/Defence per level", cost: 10000, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 150, name: "Adventure Boost For Rich Perks III", effect: "+0.05% to Adventure stats per level", cost: 10000, cap: 1000, bonus: { adventureStatsPct: 0.0005 } },
  { id: 151, name: "Stat Boost for rich Perks V", effect: "+1% to Attack/Defence per level", cost: 100000, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 152, name: "Adventure Boost For Rich Perks IV", effect: "+0.05% to Adventure stats per level", cost: 100000, cap: 1000, bonus: { adventureStatsPct: 0.0005 } },
  { id: 153, name: "Stat Boost for rich Perks VI", effect: "+1% to Attack/Defence per level", cost: 1000000, cap: 1000, bonus: { statPct: 0.01 } },
  { id: 154, name: "Adventure Boost For Rich Perks V", effect: "+0.05% to Adventure stats per level", cost: 1000000, cap: 1000, bonus: { adventureStatsPct: 0.0005 } },
  { id: 220, name: "The Final Generic Energy Power Perk", effect: "+1% Power per level", cost: 10000000, cap: 100, bonus: { energyPowerPct: 0.01 } },
  { id: 221, name: "The Final Generic Energy Bar Perk", effect: "+1% Bars per level", cost: 10000000, cap: 100, bonus: { energyBarsPct: 0.01 } },
  { id: 222, name: "The Final Generic Energy Cap Perk", effect: "+1% Cap per level", cost: 10000000, cap: 100, bonus: { energyCapPct: 0.01 } },
  { id: 223, name: "The Final Generic Magic Power Perk", effect: "+1% Power per level", cost: 10000000, cap: 100, bonus: { magicPowerPct: 0.01 } },
  { id: 224, name: "The Final Generic Magic Bar Perk", effect: "+1% Bars per level", cost: 10000000, cap: 100, bonus: { magicBarsPct: 0.01 } },
  { id: 225, name: "The Final Generic Magic Cap Perk", effect: "+1% Cap per level", cost: 10000000, cap: 100, bonus: { magicCapPct: 0.01 } },
  { id: 229, name: "Boosted Boosts IV", effect: "Additional 1% stacking bonus to the total boost power of any applied boost per level", cost: 2000000, cap: 50, bonus: { boostPowerPct: 0.01 } },
  { id: 230, name: "Boosted Boosts V", effect: "Additional 1% stacking bonus to the total boost power of any applied boost per level", cost: 10000000, cap: 50, bonus: { boostPowerPct: 0.01 } },
  { id: 231, name: "ERROR", effect: "NGU.EXE HAS ENCOUNTERED AN ERROR AND MUST CLOSE", cost: 2500000000, cap: 1, bonus: {} },
  {
    id: 94,
    name: "The Fibonacci Perk",
    effect: "Each level unlocks secret bonuses at the next Fibonacci-numbered level (1, 2, 5, 8, 13, 21, 34, 55, 89, 144, ...).",
    cost: 500,
    cap: 1597,
    bonus: {},
    /*
     * 2026-09-23 (audit) : tableau exact de la page « Fibonacci Perk » du wiki (l'ancien
     * tableau donnait +10 % de tout aux niveaux 1 et 2 et omettait le niveau 3).
     */
    fibonacciMilestones: [
      { level: 1, energyPowerPct: 0.10, magicPowerPct: 0.10 },
      { level: 2, energyCapPct: 0.10 },
      { level: 3, magicCapPct: 0.10 },
      { level: 5, nguSpeedEnergyPct: 0.05 },
      { level: 8, nguSpeedMagicPct: 0.05 },
      { level: 13, ppEarningsPct: 0.05 },
      { level: 21, energyBarsPct: 0.10, magicBarsPct: 0.10 },
      { level: 34, adventureStatsPct: 0.13 },
      { level: 55, daycareGrowthPct: 0.05 },
      { level: 89, apEarningsPct: 0.02 },
      { level: 144, lootLevelChance: 0.05 },
      { level: 233, qpEarningsPct: 0.10 },
      { level: 377, statPct: 3.77 },
      /* Questing (2026-09-23) : "No more Quest Item Quantity RNG! (Quests now require a set 50 items ...)". */
      { level: 610, questFixedItems: 1 },
      { level: 987, expEarningsPct: 0.05 }
    ]
  },
  /*
   * 2026-09-23 (audit, page Perk Points) : perks Evil/Sadistic dont l'effet existe dans SOREAL
   * (Iron Pill, respawn, Resource 3, vitesse et temps minimum des Wishes, paliers des Hacks,
   * « Welcome to Sadistic Difficulty »). Ceux des systèmes absents (MacGuffins, Cards, Mayo,
   * Quests) restent exclus. Le perk 86 (slot de garderie) est câblé depuis idle-daycare-v1.js.
   */
  { id: 84, name: "\"Iron Pill Also Sucks 1/5\"", effect: "Iron Pill yields +5x more stats per level of this perk, up to 26x at level 5!", cost: 500, cap: 5, bonus: { ironPillA: 5 } },
  { id: 85, name: "\"Iron Pill Still Sucks 1/5\"", effect: "Iron Pill yields +1x more stats per level of this perk, up to 4x at level 3!", cost: 33333, cap: 3, bonus: { ironPillB: 1 } },
  { id: 93, name: "SPAWN FASTER DAMMIT", effect: "Each level of this perk reduces normal enemy respawn times by 0.1%.", cost: 2500, cap: 100, bonus: { respawnPct: 0.001 } },
  { id: 95, name: "Generic Resource 3 Power Perk I", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Power! I wonder what you named it.", cost: 250, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 96, name: "Generic Resource 3 Bar Perk I", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Bars! I wonder what you named it.", cost: 250, cap: 100, bonus: { r3BarsPct: 0.01 } },
  { id: 97, name: "Generic Resource 3 Cap Perk I", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Cap! I wonder what you named it.", cost: 250, cap: 100, bonus: { r3CapPct: 0.01 } },
  { id: 98, name: "Generic Resource 3 Power Perk II", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Power! I wonder what you named it.", cost: 2500, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 99, name: "Generic Resource 3 Bar Perk II", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Bars! I wonder what you named it.", cost: 2500, cap: 100, bonus: { r3BarsPct: 0.01 } },
  { id: 100, name: "Generic Resource 3 Cap Perk II", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Cap! I wonder what you named it.", cost: 2500, cap: 100, bonus: { r3CapPct: 0.01 } },
  { id: 101, name: "Generic Resource 3 Power Perk III", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Power! I wonder what you named it.", cost: 25000, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 102, name: "Generic Resource 3 Bar Perk III", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Bars! I wonder what you named it.", cost: 25000, cap: 100, bonus: { r3BarsPct: 0.01 } },
  { id: 103, name: "Generic Resource 3 Cap Perk III", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Cap! I wonder what you named it.", cost: 25000, cap: 100, bonus: { r3CapPct: 0.01 } },
  { id: 108, name: "Faster Wishes I", effect: "So you just got WIshes and hate how slow they are. Each level of this perk will grant 0.2% wish speed to help alleviate that issue.", cost: 5000, cap: 50, bonus: { wishSpeedPct: 0.002 } },
  { id: 109, name: "Minimum Wish Time Reduction I", effect: "Got your resources pumped into Wishes so fast, the Fairies can't work any faster? This perk will whip them into shape! Each level reduces the minimum wish completion time by 24 seconds. This time is normally 4 hours.", cost: 10000, cap: 50, bonus: { wishMinTimeSeconds: 24 } },
  { id: 110, name: "Minimum Wish Time Reduction II", effect: "With this perk,you can work wishes so efficiently that all the labour can be done by a single Australian man in record time! Reduces the minimum wish timer by an additional 24 seconds per level of this perk.", cost: 100000, cap: 50, bonus: { wishMinTimeSeconds: 24 } },
  { id: 113, name: "Adventure Hack Milestone Reduces I", effect: "Each level of this perk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 4000000, cap: 5, bonus: { hackReduce_adventureStats: 1 } },
  { id: 114, name: "Blood Hack Milestone Reduces I", effect: "Each level of this perk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 10000, cap: 5, bonus: { hackReduce_bloodGain: 1 } },
  /* Page Perk Points (index 86) et page « Item Daycare » (« 1 from ITOPOD perk for 50k PP ») : un slot de garderie. */
  { id: 86, name: "Daycare Slot! c:", effect: "Make the Daycare Kitty even happier-er-er-est-er and get a new Daycare Slot!", cost: 50000, cap: 1, bonus: { daycareSlotBonus: 1 } },
  { id: 115, name: "Daycare Hack Milestone Reduces I", effect: "Each level of this perk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 200000, cap: 5, bonus: { hackReduce_daycare: 1 } },
  { id: 122, name: "Generic Resource 3 Power Perk IV", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Power! I wonder what you named it.", cost: 100000, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 123, name: "Generic Resource 3 Bar Perk IV", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Bars! I wonder what you named it.", cost: 100000, cap: 100, bonus: { r3BarsPct: 0.01 } },
  { id: 124, name: "Generic Resource 3 Cap Perk IV", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Cap! I wonder what you named it.", cost: 100000, cap: 100, bonus: { r3CapPct: 0.01 } },
  { id: 132, name: "Generic Resource 3 Power Perk V", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Power! I wonder what you named it.", cost: 500000, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 133, name: "Generic Resource 3 Bar Perk V", effect: "Each level grants +0.5% bonus multiplier to your 3rd Resource's Bars! I wonder what you named it.", cost: 500000, cap: 100, bonus: { r3BarsPct: 0.005 } },
  { id: 134, name: "Generic Resource 3 Cap Perk V", effect: "Each level grants +0.5% bonus multiplier to your 3rd Resource's Cap! I wonder what you named it.", cost: 500000, cap: 100, bonus: { r3CapPct: 0.005 } },
  { id: 141, name: "Generic Resource 3 Power Perk VI", effect: "Each level grants +1% bonus multiplier to your 3rd Resource's Power! I wonder what you named it.", cost: 2500000, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 142, name: "Generic Resource 3 Bar Perk VI", effect: "Each level grants +0.5% bonus multiplier to your 3rd Resource's Bars! I wonder what you named it.", cost: 2500000, cap: 100, bonus: { r3BarsPct: 0.005 } },
  { id: 143, name: "Generic Resource 3 Cap Perk VI", effect: "Each level grants +0.5% bonus multiplier to your 3rd Resource's Cap! I wonder what you named it.", cost: 2500000, cap: 100, bonus: { r3CapPct: 0.005 } },
  { id: 155, name: "Faster Wishes II", effect: "Each level of this perk will add +0.1% to wish speed!", cost: 50000, cap: 100, bonus: { wishSpeedPct: 0.001 } },
  { id: 156, name: "Faster Wishes III", effect: "Each level of this perk will add +0.1% to wish speed!", cost: 200000, cap: 100, bonus: { wishSpeedPct: 0.001 } },
  { id: 159, name: "Faster Wishes IV", effect: "Each level of this perk will add +0.1% to wish speed!", cost: 800000, cap: 100, bonus: { wishSpeedPct: 0.001 } },
  { id: 160, name: "Faster Wishes V", effect: "Each level of this perk will add +0.1% to wish speed!", cost: 3000000, cap: 100, bonus: { wishSpeedPct: 0.001 } },
  { id: 217, name: "Drop Chance Hack Milestone Reducer I", effect: "Each level of this perk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 3000000, cap: 4, bonus: { hackReduce_dropChance: 1 } },
  { id: 218, name: "Augments Hack Milestone Reducer I", effect: "Each level of this perk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 5000000, cap: 2, bonus: { hackReduce_augmentSpeed: 1 } },
  { id: 219, name: "Magic NGU Hack Milestone Reducer I", effect: "Each level of this perk reduces the number of hack levels required per milestone by 1! This means more milestone bonuses!", cost: 8000000, cap: 3, bonus: { hackReduce_magicNguSpeed: 1 } },
  { id: 226, name: "The Final Generic Resource 3 Power Perk", effect: "Eh, just go nuts with this one. Gain 1% Power per level", cost: 10000000, cap: 100, bonus: { r3PowerPct: 0.01 } },
  { id: 227, name: "The Final Generic Resource 3 Bar Perk", effect: "Eh, just go nuts with this one. Gain 1% Bars per level", cost: 10000000, cap: 100, bonus: { r3BarsPct: 0.01 } },
  { id: 228, name: "The Final Generic Resource 3 Cap Perk", effect: "Eh, just go nuts with this one. Gain 1% Cap per level", cost: 10000000, cap: 100, bonus: { r3CapPct: 0.01 } },
  /* Perks 161-216 (Cards/Mayo/Tags/Deck) : définies et agrégées dans idle-cards-v1.js. */
  ...IDLE_CARDS_PERKS_V1,
]);

export function idlePerkByIdV1(id) {
  return IDLE_PERKS_CATALOG_V1.find(p => p.id === id) || null;
}

/*
 * Real per-level flat cost (the wiki's "Cost" column is already the
 * per-level price, not a base for an exponential curve) — matches the
 * wiki exactly, unlike the previous generic 1.55^level model.
 */
export function idlePerkNextCostV1(perk, currentLevel) {
  if (!perk) return Infinity;
  if (currentLevel >= perk.cap) return Infinity;
  return Math.max(1, Math.floor(perk.cost));
}

/*
 * Sums level × per-level bonus value across every purchased perk into one
 * flat object, keyed the same way idle-ngu-progression.js's other bonus
 * sources (challengePermanentBonuses, diggerBonuses, beardBonusMultiplier)
 * already are — so idleNguBonuses() can fold this in with the same
 * "multiply/add into the existing total" pattern instead of a parallel one.
 */
export function perkBonusesV1(levelsById) {
  const levels = levelsById && typeof levelsById === "object" ? levelsById : {};
  const totals = {};
  /* Page Boost : « Boosted Boosts I à V, chacun multiplicatif avec les autres » (2,5 x 2,2 x 2,2 x 1,5 x 1,5 au maximum). */
  let boostPowerProduct = 1;
  /* Page « Item Daycare » : Blessing I et II sont deux facteurs de temps distincts (x95 % x x95 %). */
  let daycareTimeProduct = 1;
  for (const perk of IDLE_PERKS_CATALOG_V1) {
    const level = Math.max(0, Math.min(perk.cap, Number(levels[perk.id]) || 0));
    if (!level) continue;
    if (perk.bonus && perk.bonus.boostPowerPct) boostPowerProduct *= 1 + perk.bonus.boostPowerPct * level;
    if (perk.bonus && perk.bonus.daycareTimePct) daycareTimeProduct *= Math.max(0, 1 - perk.bonus.daycareTimePct * level);
    for (const [key, perLevel] of Object.entries(perk.bonus || {})) {
      totals[key] = (totals[key] || 0) + perLevel * level;
    }
    if (Array.isArray(perk.fibonacciMilestones)) {
      for (const tier of perk.fibonacciMilestones) {
        if (level < tier.level) continue;
        for (const [key, value] of Object.entries(tier)) {
          if (key === "level") continue;
          totals[key] = (totals[key] || 0) + value;
        }
      }
    }
  }
  return {
    energyPowerFlat: totals.energyPowerFlat || 0,
    energyBarsFlat: totals.energyBarsFlat || 0,
    magicPowerFlat: totals.magicPowerFlat || 0,
    magicBarsFlat: totals.magicBarsFlat || 0,
    magicCapFlat: totals.magicCapFlat || 0,
    adventurePowerFlat: totals.adventurePowerFlat || 0,
    adventureToughnessFlat: totals.adventureToughnessFlat || 0,
    adventureStatsMultiplier: 1 + (totals.adventureStatsPct || 0),
    dropChanceMultiplier: 1 + (totals.dropChancePct || 0),
    statMultiplier: 1 + (totals.statPct || 0),
    energyPowerMultiplier: 1 + (totals.energyPowerPct || 0),
    energyBarsMultiplier: 1 + (totals.energyBarsPct || 0),
    energyCapMultiplier: 1 + (totals.energyCapPct || 0),
    magicPowerMultiplier: 1 + (totals.magicPowerPct || 0),
    magicBarsMultiplier: 1 + (totals.magicBarsPct || 0),
    magicCapMultiplier: 1 + (totals.magicCapPct || 0),
    boostPowerMultiplier: boostPowerProduct,
    nguSpeedEnergyMultiplier: 1 + (totals.nguSpeedEnergyPct || 0),
    nguSpeedMagicMultiplier: 1 + (totals.nguSpeedMagicPct || 0),
    adventureGoldMultiplier: 1 + (totals.adventureGoldPct || 0),
    seedYieldMultiplier: 1 + (totals.seedYieldPct || 0),
    lootGoblinChance: Math.min(1, totals.lootGoblinChancePct || 0),
    cubeBoostRate: 0.01 + (totals.cubeBoostRatePct || 0),
    /* Hausse de vitesse de la garderie (Fibonacci 55 : x105 %). */
    daycareGrowthMultiplier: 1 + (totals.daycareGrowthPct || 0),
    /* Réduction de temps de la garderie (Daycare Kitty's Blessing I/II) et slot du perk 86. */
    daycareTimeMultiplier: daycareTimeProduct,
    daycareSlotBonus: totals.daycareSlotBonus || 0,
    firstHarvestMultiplier: 1 + (totals.firstHarvestPct || 0),
    wandoosOsLevelBonus: totals.wandoosOsLevelFlat || 0,
    accessorySlotBonus: totals.accessorySlotBonus || 0,
    inventorySlots: totals.inventorySlotBonus || 0,
    diggerSlotBonus: totals.diggerSlotBonus || 0,
    advancedTrainingStartBonus: totals.advancedTrainingStartBonus || 0,
    atBankMultiplier: 1 + (totals.atBankPct || 0),
    tmBankMultiplier: 1 + (totals.tmBankPct || 0),
    beardBankMultiplier: 1 + (totals.beardBankPct || 0),
    titanExpFirstKillsMultiplier: 1 + (totals.titanExpFirstKillsPct || 0),
    bossExpMultiplier: 1 + (totals.bossExpPct || 0),
    fruitKnowledgeExpMultiplier: Math.max(1, totals.fruitKnowledgeExpMult || 1),
    doubleBasicTraining: Boolean(totals.doubleBasicTraining),
    ppEarningsMultiplier: 1 + (totals.ppEarningsPct || 0),
    apEarningsMultiplier: 1 + (totals.apEarningsPct || 0),
    qpEarningsMultiplier: 1 + (totals.qpEarningsPct || 0),
    expEarningsMultiplier: 1 + (totals.expEarningsPct || 0),
    lootLevelChance: Math.min(1, totals.lootLevelChance || 0),
    beardTrimSpeedLevel: totals.beardTrimSpeedLevel || 0,
    sadisticBossMultiplierBonus: totals.sadisticBossMultiplierBonus || 0,
    /* Perks 84/85 : Iron Pill donne (1 + 5 x niv84) x (1 + niv85) fois plus de stats. */
    ironPillMultiplier: (1 + (totals.ironPillA || 0)) * (1 + (totals.ironPillB || 0)),
    /* Perk 93 : -0,1 % par niveau de temps de respawn (part restante, multiplicative). */
    respawnRemaining: Math.max(0, 1 - (totals.respawnPct || 0)),
    r3PowerMultiplier: 1 + (totals.r3PowerPct || 0),
    r3BarsMultiplier: 1 + (totals.r3BarsPct || 0),
    r3CapMultiplier: 1 + (totals.r3CapPct || 0),
    wishSpeedMultiplier: 1 + (totals.wishSpeedPct || 0),
    wishMinTimeReductionSeconds: totals.wishMinTimeSeconds || 0,
    augmentSpeedMultiplier: 1 + (totals.augmentSpeedPct || 0),
    hackMilestoneReduction: Object.fromEntries(Object.entries(totals).filter(([k]) => k.startsWith("hackReduce_")).map(([k, v]) => [k.slice(11), v]))
  };
}
