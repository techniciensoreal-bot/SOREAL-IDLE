import assert from "node:assert/strict";
import {
  IDLE_PERKS_CATALOG_V1,
  idlePerkByIdV1,
  idlePerkNextCostV1,
  perkBonusesV1
} from "../src/idle-perks-v1.js";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";

/*
 * NGU wiki adaptation (2026-09-11) — "Perks" was a single generic counter
 * (one shared level, exponential 1.55^level cost, no per-item identity or
 * real effect) with nothing matching the actual game. This is the first
 * real increment: the 56 Normal-accessible perks (wiki indices 0-55,
 * index 56 "Macguffin Daycare!" is Evil-only and intentionally excluded),
 * each individually purchasable at its own flat per-level cost/cap, with
 * bonuses wired into the same aggregator (idleNguBonuses) every other
 * bonus source (challenges, beard, diggers) already feeds.
 */

// --- Catalog shape: 56 entries, unique sequential ids 0-55, sane cost/cap ---
assert.equal(IDLE_PERKS_CATALOG_V1.length, 57, "56 Normal-accessible perks (wiki indices 0-55) + The Fibonacci Perk (wiki index 94).");
for (let i = 0; i < 56; i++) {
  const perk = IDLE_PERKS_CATALOG_V1[i];
  assert.equal(perk.id, i, "Perk ids must be sequential 0-55, matching the wiki table order.");
  assert.ok(perk.name && typeof perk.name === "string", "Perk " + i + " needs a name.");
  assert.ok(perk.effect && typeof perk.effect === "string", "Perk " + i + " needs an effect description.");
  assert.ok(Number.isFinite(perk.cost) && perk.cost > 0, "Perk " + i + " needs a positive flat cost.");
  assert.ok(Number.isFinite(perk.cap) && perk.cap > 0, "Perk " + i + " needs a positive cap.");
  assert.ok(perk.bonus && typeof perk.bonus === "object", "Perk " + i + " needs a bonus object (may be empty).");
}

// --- Spot-check exact wiki values for a representative sample ---
assert.deepEqual(idlePerkByIdV1(0), { id: 0, name: "The Newbie Energy Perk", effect: "Gain 3 Energy Power and 3 Energy Bars!", cost: 1, cap: 1, bonus: { energyPowerFlat: 3, energyBarsFlat: 3 } });
assert.equal(idlePerkByIdV1(5).cost, 1);
assert.equal(idlePerkByIdV1(5).cap, 1000, "Stat Boost for Rich Perks I caps at 1,000 levels per the wiki.");
assert.equal(idlePerkByIdV1(29).name, "You'll Really Want This");
assert.equal(idlePerkByIdV1(29).cost, 250);
assert.equal(idlePerkByIdV1(29).bonus.accessorySlotBonus, 1, "Perk 29 is the flat +1 accessory slot confirmed on the wiki.");
assert.equal(idlePerkByIdV1(55).name, "Adventure Boost For Rich Perks I");
assert.equal(idlePerkByIdV1(55).bonus.adventureStatsPct, 0.001, "0.1% per level, matches the wiki exactly.");
assert.equal(idlePerkByIdV1(56), null, "Index 56 (Macguffin Daycare!, Evil only) must not be in the Normal catalog.");
assert.equal(idlePerkByIdV1(94).name, "The Fibonacci Perk");
assert.equal(idlePerkByIdV1(94).cost, 500, "500 PP per level, per the audit.");
assert.equal(idlePerkByIdV1(94).cap, 1597, "Caps at 1597 (a Fibonacci number), per the audit.");

// --- The Fibonacci Perk: threshold-unlocked milestones, not linear per-level bonuses ---
{
  const below = perkBonusesV1({ 94: 0 });
  assert.equal(below.energyPowerMultiplier, 1, "Level 0 must unlock nothing.");

  const l1 = perkBonusesV1({ 94: 1 });
  assert.ok(Math.abs(l1.energyPowerMultiplier - 1.10) < 1e-9, "Level 1 unlocks +10% Energy Power.");
  assert.ok(Math.abs(l1.magicPowerMultiplier - 1.10) < 1e-9, "Level 1 unlocks +10% Magic Power.");
  assert.ok(Math.abs(l1.energyCapMultiplier - 1.10) < 1e-9, "Level 1 unlocks +10% Energy Cap.");
  assert.ok(Math.abs(l1.energyBarsMultiplier - 1.10) < 1e-9, "Level 1 unlocks +10% Energy Bars.");
  assert.ok(Math.abs(l1.magicBarsMultiplier - 1.10) < 1e-9, "Level 1 unlocks +10% Magic Bars.");
  assert.equal(l1.nguSpeedEnergyMultiplier, 1, "Level 5's bonus must not apply yet at level 1.");

  const l4 = perkBonusesV1({ 94: 4 });
  assert.ok(Math.abs(l4.energyPowerMultiplier - 1.20) < 1e-9, "Levels 1+2 stack: +10%+10% = +20% Energy Power.");
  assert.equal(l4.nguSpeedEnergyMultiplier, 1, "Level 5 not yet reached at level 4.");

  const l21 = perkBonusesV1({ 94: 21 });
  assert.ok(Math.abs(l21.energyPowerMultiplier - 1.30) < 1e-9, "Levels 1+2+21 stack to +30% Energy Power at level 21.");
  assert.ok(Math.abs(l21.nguSpeedEnergyMultiplier - 1.05) < 1e-9, "Level 5's +5% Energy NGU speed is included by level 21.");
  assert.ok(Math.abs(l21.nguSpeedMagicMultiplier - 1.05) < 1e-9, "Level 8's +5% Magic NGU speed is included by level 21.");

  const l55 = perkBonusesV1({ 94: 55 });
  assert.ok(Math.abs(l55.daycareGrowthMultiplier - 1.05) < 1e-9, "Level 55 unlocks +5% Daycare growth.");

  const l144 = perkBonusesV1({ 94: 144 });
  assert.ok(Math.abs(l144.lootGoblinChance - 0.05) < 1e-9, "Level 144 unlocks a 5% loot-level-up chance, same pool as Loot Goblin's Blessing.");

  assert.ok(Math.abs(perkBonusesV1({ 94: 99999 }).energyPowerMultiplier - perkBonusesV1({ 94: 1597 }).energyPowerMultiplier) < 1e-9, "Level is clamped to the 1597 cap, never over-counted beyond it.");
}

// --- Real flat per-level cost, not the old exponential model ---
assert.equal(idlePerkNextCostV1(idlePerkByIdV1(31), 0), 2, "More Inventory Space I costs a flat 2 per level, every level.");
assert.equal(idlePerkNextCostV1(idlePerkByIdV1(31), 11), 2, "Cost must stay flat right up to the cap — no exponential creep.");
assert.equal(idlePerkNextCostV1(idlePerkByIdV1(31), 12), Infinity, "At cap (12 levels), no further purchase is possible.");

// --- perkBonusesV1: sums level x per-level value across every purchased perk ---
{
  const bonuses = perkBonusesV1({ 0: 1, 5: 3, 31: 12, 29: 1 });
  assert.equal(bonuses.energyPowerFlat, 3, "Perk 0 grants a flat +3 Energy Power once purchased.");
  assert.equal(bonuses.energyBarsFlat, 3);
  assert.ok(Math.abs(bonuses.statMultiplier - 1.30) < 1e-9, "Perk 5 at level 3 = +30% (3 x 10%/level).");
  assert.equal(bonuses.inventorySlots, 12, "Perk 31 maxed (12 levels x 1 slot) = 12 extra inventory slots.");
  assert.equal(bonuses.accessorySlotBonus, 1, "Perk 29 purchased once = +1 accessory slot.");
}
{
  // Levels beyond a perk's cap must be clamped, never over-counted.
  const bonuses = perkBonusesV1({ 5: 5000 });
  assert.ok(Math.abs(bonuses.statMultiplier - 101) < 1e-9, "Perk 5 clamps to its 1,000-level cap: 1 + 1000*0.10 = 101, not 501.");
}

// --- Real purchase flow: buyPerk action, real currency deduction, real per-perk level tracking ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.perks.unlocked = true;
  state.currencies.pp = 10;

  const before = applyIdleNguAction(state, { action: "buyPerk", perkId: 0 }, {}, 1_000_000).state;
  assert.equal(before.currencies.pp, 9, "Perk 0 costs exactly 1 PP — the real wiki cost, not an inflated exponential one.");
  assert.equal(before.systems.perks.data.levels[0], 1, "Perk 0's own level must be tracked individually.");
  assert.equal(before.systems.perks.level, 1, "system.level stays the sum of all perk levels, for back-compat.");

  assert.throws(
    () => applyIdleNguAction(before, { action: "buyPerk", perkId: 0 }, {}, 1_000_000),
    /PERK_AU_MAXIMUM/,
    "Perk 0 has a cap of 1 — a second purchase must be refused, not silently accepted."
  );

  const afterSecondPerk = applyIdleNguAction(before, { action: "buyPerk", perkId: 5 }, {}, 1_000_000).state;
  assert.equal(afterSecondPerk.currencies.pp, 8, "Buying a second, DIFFERENT perk must not touch perk 0's own level or cost.");
  assert.equal(afterSecondPerk.systems.perks.data.levels[0], 1, "Perk 0's level must be untouched by buying perk 5.");
  assert.equal(afterSecondPerk.systems.perks.data.levels[5], 1);
  assert.equal(afterSecondPerk.systems.perks.level, 2, "Combined level is now perk0(1) + perk5(1) = 2.");

  assert.throws(
    () => applyIdleNguAction(afterSecondPerk, { action: "buyPerk", perkId: 999 }, {}, 1_000_000),
    /PERK_INTROUVABLE/,
    "An unknown perk id must be rejected explicitly, never silently ignored."
  );

  const poor = normalizeIdleNguState({}, {}, 1_000_000);
  poor.systems.perks.unlocked = true;
  poor.currencies.pp = 0;
  assert.throws(
    () => applyIdleNguAction(poor, { action: "buyPerk", perkId: 0 }, {}, 1_000_000),
    /MONNAIE_INSUFFISANTE/
  );
}

// --- idleNguBonuses actually folds purchased perks into the shared aggregator ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.perks.unlocked = true;
  state.currencies.pp = 1000;
  const withPerk0 = applyIdleNguAction(state, { action: "buyPerk", perkId: 0 }, {}, 1_000_000).state;
  const bonuses = idleNguBonuses(withPerk0);
  assert.equal(bonuses.energyPowerFlat, 3, "Purchased perk bonuses must reach idleNguBonuses(), the single aggregator every other system already reads from.");
  assert.equal(bonuses.energyBarsFlat, 3);
  assert.equal(bonuses.perkBonuses.energyPowerFlat, 3, "The raw perkBonuses breakdown is also exposed, matching the existing challengeBonuses pattern.");

  const baseline = idleNguBonuses(normalizeIdleNguState({}, {}, 1_000_000));
  assert.equal(baseline.energyPowerFlat, 0, "With no perks purchased, the perk contribution must be exactly zero (no regression for existing saves).");
  assert.equal(baseline.attackMultiplier, idleNguBonuses(normalizeIdleNguState({}, {}, 1_000_000)).attackMultiplier);
}

// --- Stat-multiplier perks actually move attackMultiplier/defenseMultiplier ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.perks.unlocked = true;
  state.currencies.pp = 1000;
  const before = idleNguBonuses(state);
  const after = idleNguBonuses(applyIdleNguAction(state, { action: "buyPerk", perkId: 4 }, {}, 1_000_000).state);
  assert.ok(
    after.attackMultiplier > before.attackMultiplier,
    "Perk 4 (The Newbie Stat Perk, +100% Attack/Defense) must visibly increase attackMultiplier once purchased."
  );
  assert.ok(Math.abs(after.attackMultiplier / before.attackMultiplier - 2) < 1e-9, "Exactly a +100% (x2) increase, matching the wiki's exact wording.");
}

console.log("idle-perks-v1: OK");
