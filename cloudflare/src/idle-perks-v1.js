/*
 * SOREAL IDLE — Perks (ITOPOD, PP currency), Normal-difficulty catalog.
 *
 * Source: NGU Idle wiki (https://ngu-idle.fandom.com/wiki/Perk_Points),
 * indices 0-55 — the Normal-accessible portion of Page 1 (index 56,
 * "Macguffin Daycare!", is the first Evil-only perk and is intentionally
 * excluded until Evil difficulty exists in SOREAL IDLE).
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
 */

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
  { id: 27, name: "Daycare Kitty's Blessing I", effect: "Grow your daycare items 1% faster per level", cost: 5, cap: 5, bonus: { daycareGrowthPct: 0.01 } },
  { id: 28, name: "Daycare Kitty's Blessing II", effect: "Additional 1% faster per level", cost: 25, cap: 5, bonus: { daycareGrowthPct: 0.01 } },
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
  { id: 55, name: "Adventure Boost For Rich Perks I", effect: "+0.1% to Adventure Stats per level", cost: 100, cap: 1000, bonus: { adventureStatsPct: 0.001 } }
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
  for (const perk of IDLE_PERKS_CATALOG_V1) {
    const level = Math.max(0, Math.min(perk.cap, Number(levels[perk.id]) || 0));
    if (!level) continue;
    for (const [key, perLevel] of Object.entries(perk.bonus || {})) {
      totals[key] = (totals[key] || 0) + perLevel * level;
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
    boostPowerMultiplier: 1 + (totals.boostPowerPct || 0),
    nguSpeedEnergyMultiplier: 1 + (totals.nguSpeedEnergyPct || 0),
    nguSpeedMagicMultiplier: 1 + (totals.nguSpeedMagicPct || 0),
    adventureGoldMultiplier: 1 + (totals.adventureGoldPct || 0),
    seedYieldMultiplier: 1 + (totals.seedYieldPct || 0),
    lootGoblinChance: Math.min(1, totals.lootGoblinChancePct || 0),
    cubeBoostRate: 0.01 + (totals.cubeBoostRatePct || 0),
    daycareGrowthMultiplier: 1 + (totals.daycareGrowthPct || 0),
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
    beardTrimSpeedLevel: totals.beardTrimSpeedLevel || 0
  };
}
