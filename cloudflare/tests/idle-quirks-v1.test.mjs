import assert from "node:assert/strict";
import {
  IDLE_QUIRKS_CATALOG_V1,
  idleQuirkByIdV1,
  idleQuirkNextCostV1,
  quirkBonusesV1
} from "../src/idle-quirks-v1.js";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguBonuses,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import { IDLE_PERKS_CATALOG_V1 } from "../src/idle-perks-v1.js";

/*
 * NGU wiki adaptation (2026-09-14) — "Quirks" was
 * buyTree(state, "quirks", "qp", 50): a single generic counter (one shared
 * level, exponential 1.55^level cost, no per-item identity or real effect),
 * live and reachable via the "buyQuirk" action. This is the same migration
 * already done for Perks: the 27 Normal-accessible quirks (wiki page
 * https://ngu-idle.fandom.com/wiki/Quirk_Points, indices 0-13, 19-21,
 * 25-26, 30-31, 35-40), each individually purchasable at its own flat
 * per-level cost/cap, with bonuses wired into the same aggregator
 * (idleNguBonuses) every other bonus source (perks, challenges, beard,
 * diggers) already feeds.
 *
 * Extension (2026-09-18) — indices 41-182 (39 more) were previously
 * excluded on the mistaken belief that the wiki's "Evil only"/"Sadistic
 * only" note was a game-enforced purchase gate; it is community
 * buying-order advice, not a mechanic. Added wherever the effect maps to
 * an already-existing bonus key (see idle-quirks-v1.js header for the
 * full breakdown of what's still excluded and why).
 */

// --- Catalog shape: 66 entries, ids matching the wiki table's own indices ---
assert.equal(IDLE_QUIRKS_CATALOG_V1.length, 66, "27 Normal-accessible quirks + 39 Evil/Sadistic-tier quirks.");
const expectedIds = [
  0,1,2,3,4,5,6,7,8,9,10,11,12,13,19,20,21,25,26,30,31,35,36,37,38,39,40,
  41,42,43,44,45,46,51,52,53,61,62,63,64,65,66,72,73,76,77,78,79,80,81,82,83,84,85,92,
  170,171,172,173,176,177,178,179,180,181,182
];
assert.deepEqual(IDLE_QUIRKS_CATALOG_V1.map(q => q.id), expectedIds, "Quirk ids must match the wiki table's own indices, gaps included (excluded rows skipped).");
{
  const ids = IDLE_QUIRKS_CATALOG_V1.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length, "No duplicate quirk ids across the whole catalog.");
}
for (const quirk of IDLE_QUIRKS_CATALOG_V1) {
  assert.ok(quirk.name && typeof quirk.name === "string", "Quirk " + quirk.id + " needs a name.");
  assert.ok(quirk.effect && typeof quirk.effect === "string", "Quirk " + quirk.id + " needs an effect description.");
  assert.ok(Number.isFinite(quirk.cost) && quirk.cost > 0, "Quirk " + quirk.id + " needs a positive flat cost.");
  assert.ok(Number.isFinite(quirk.cap) && quirk.cap > 0, "Quirk " + quirk.id + " needs a positive cap.");
  assert.ok(quirk.bonus && typeof quirk.bonus === "object", "Quirk " + quirk.id + " needs a bonus object (may be empty).");
}

// --- Spot-check exact wiki values ---
assert.deepEqual(idleQuirkByIdV1(0), { id: 0, name: "Baby's First Quirk: Energy Power", effect: "Improve your Energy Power by 10%!", cost: 100, cap: 1, bonus: { energyPowerPct: 0.10 } });
assert.equal(idleQuirkByIdV1(7).cost, 25);
assert.equal(idleQuirkByIdV1(7).cap, 1000, "Stat Boost For Rich Quirks I caps at 1,000 levels per the wiki.");
assert.equal(idleQuirkByIdV1(9).name, "GOOOOOLLLLLLLLLLLD!");
assert.equal(idleQuirkByIdV1(9).bonus.adventureGoldPct, 0.10, "10% gold drops per level, matches the wiki exactly.");
assert.equal(idleQuirkByIdV1(20).bonus.atBankPct, 0.005, "0.5% per level, not the Perk catalog's 1% — a different, real wiki value.");
assert.equal(idleQuirkByIdV1(14), null, "Index 14 (The Beast NGU Quirk Ever) needs a separate Evil/Sadistic NGU track system SOREAL doesn't have — still excluded.");

// --- Spot-check the 2026-09-18 Evil/Sadistic-tier extension ---
assert.deepEqual(idleQuirkByIdV1(41).bonus, { energyPowerPct: 0.01 }, "Generic Energy Power Quirk II : même taux que le palier I (indice 35), juste un coût/plafond différents.");
assert.equal(idleQuirkByIdV1(61).bonus.energyPowerPct, 0.005, "Wiki : palier III baisse à +0.5%/niveau (pas +1%).");
assert.equal(idleQuirkByIdV1(92).bonus.seedYieldPct, 0.001, "Wiki : \"Even Better Yggdrasil Yields\" = +0.1%/niveau, réutilise la clé de \"The Beast's Seed ;)\" (indice 12).");
assert.deepEqual(idleQuirkByIdV1(176).bonus, {}, "\"A PROBLEM HAS BEEN DETECTED\" est une quirk-blague, aucun effet réel à inventer.");
assert.equal(idleQuirkByIdV1(99), null, "Index 99 (Magic NGU Speed Card Tier Up I) a besoin du système Cards, absent de SOREAL — reste exclu.");

// --- Real flat per-level cost, not the old exponential model ---
assert.equal(idleQuirkNextCostV1(idleQuirkByIdV1(35), 0), 75, "Generic Energy Power Quirk I costs a flat 75 per level, every level.");
assert.equal(idleQuirkNextCostV1(idleQuirkByIdV1(35), 49), 75, "Cost must stay flat right up to the cap — no exponential creep.");
assert.equal(idleQuirkNextCostV1(idleQuirkByIdV1(35), 50), Infinity, "At cap (50 levels), no further purchase is possible.");

// --- quirkBonusesV1: sums level x per-level value across every purchased quirk ---
{
  const bonuses = quirkBonusesV1({ 0: 1, 7: 3, 35: 10 });
  assert.ok(Math.abs(bonuses.energyPowerMultiplier - 1.20) < 1e-9, "Quirk 0 (+10%) and quirk 35 at level 10 (+10%) stack to +20%.");
  assert.ok(Math.abs(bonuses.statMultiplier - 1.03) < 1e-9, "Quirk 7 at level 3 = +3% (3 x 1%/level).");
}
{
  // Levels beyond a quirk's cap must be clamped, never over-counted.
  const bonuses = quirkBonusesV1({ 7: 5000 });
  assert.ok(Math.abs(bonuses.statMultiplier - 11) < 1e-9, "Quirk 7 clamps to its 1,000-level cap: 1 + 1000*0.01 = 11, not 51.");
}

// --- Real purchase flow: buyQuirk action, real currency deduction, real per-quirk level tracking ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.quirks.unlocked = true;
  state.currencies.qp = 200;

  const before = applyIdleNguAction(state, { action: "buyQuirk", quirkId: 0 }, {}, 1_000_000).state;
  assert.equal(before.currencies.qp, 100, "Quirk 0 costs exactly 100 QP — the real wiki cost, not an inflated exponential one.");
  assert.equal(before.systems.quirks.data.levels[0], 1, "Quirk 0's own level must be tracked individually.");
  assert.equal(before.systems.quirks.level, 1, "system.level stays the sum of all quirk levels, for back-compat.");

  assert.throws(
    () => applyIdleNguAction(before, { action: "buyQuirk", quirkId: 0 }, {}, 1_000_000),
    /QUIRK_AU_MAXIMUM/,
    "Quirk 0 has a cap of 1 — a second purchase must be refused, not silently accepted."
  );

  const afterSecondQuirk = applyIdleNguAction(before, { action: "buyQuirk", quirkId: 7 }, {}, 1_000_000).state;
  assert.equal(afterSecondQuirk.currencies.qp, 75, "Buying a second, DIFFERENT quirk must not touch quirk 0's own level or cost.");
  assert.equal(afterSecondQuirk.systems.quirks.data.levels[0], 1, "Quirk 0's level must be untouched by buying quirk 7.");
  assert.equal(afterSecondQuirk.systems.quirks.data.levels[7], 1);
  assert.equal(afterSecondQuirk.systems.quirks.level, 2, "Combined level is now quirk0(1) + quirk7(1) = 2.");

  assert.throws(
    () => applyIdleNguAction(afterSecondQuirk, { action: "buyQuirk", quirkId: 999 }, {}, 1_000_000),
    /QUIRK_INTROUVABLE/,
    "An unknown quirk id must be rejected explicitly, never silently ignored."
  );

  const poor = normalizeIdleNguState({}, {}, 1_000_000);
  poor.systems.quirks.unlocked = true;
  poor.currencies.qp = 0;
  assert.throws(
    () => applyIdleNguAction(poor, { action: "buyQuirk", quirkId: 0 }, {}, 1_000_000),
    /MONNAIE_INSUFFISANTE/
  );
}

// --- idleNguBonuses actually folds purchased quirks into the shared aggregator ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.quirks.unlocked = true;
  state.currencies.qp = 1000;
  const withQuirk0 = applyIdleNguAction(state, { action: "buyQuirk", quirkId: 0 }, {}, 1_000_000).state;
  const bonuses = idleNguBonuses(withQuirk0);
  assert.ok(Math.abs(bonuses.energyPowerMultiplier - 1.10) < 1e-9, "Purchased quirk bonuses must reach idleNguBonuses(), the single aggregator every other system already reads from.");
  assert.equal(bonuses.quirkBonuses.energyPowerMultiplier, bonuses.energyPowerMultiplier, "The raw quirkBonuses breakdown is also exposed, matching the existing perkBonuses pattern.");

  const baseline = idleNguBonuses(normalizeIdleNguState({}, {}, 1_000_000));
  assert.equal(baseline.energyPowerMultiplier, 1, "With no quirks or perks purchased, the multiplier must be exactly 1 (no regression for existing saves).");
}

// --- Stat-multiplier quirks actually move attackMultiplier ---
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  state.systems.quirks.unlocked = true;
  state.currencies.qp = 1000;
  const before = idleNguBonuses(state);
  const after = idleNguBonuses(applyIdleNguAction(state, { action: "buyQuirk", quirkId: 7 }, {}, 1_000_000).state);
  assert.ok(
    after.attackMultiplier > before.attackMultiplier,
    "Quirk 7 (Stat Boost For Rich Quirks I, +1% Attack/Defense per level) must visibly increase attackMultiplier once purchased."
  );
  assert.ok(Math.abs(after.attackMultiplier / before.attackMultiplier - 1.01) < 1e-9, "Exactly a +1% increase at level 1, matching the wiki's exact wording.");
}

// --- Audit 2026-09-14 : le client n'a AUCUN moyen de savoir quels
// perks/quirks existent (nom/coût/plafond/effet) sans que le catalogue
// soit exposé dans idleNguSnapshot() — sans ça, le seul bouton d'achat
// possible envoie l'action sans id et échoue toujours (PERK_INTROUVABLE/
// QUIRK_INTROUVABLE). Verrouille l'exposition, même gabarit que
// diggerDefinitions (déjà exposé et déjà consommé par le client).
{
  const state = normalizeIdleNguState({}, {}, 1_000_000);
  const snapshot = idleNguSnapshot(state, {}, 1_000_000);
  assert.ok(
    Array.isArray(snapshot.perkDefinitions) && snapshot.perkDefinitions.length === IDLE_PERKS_CATALOG_V1.length,
    "idleNguSnapshot doit exposer le catalogue complet des Perks (perkDefinitions), sinon le client ne peut jamais construire un id de perk valide."
  );
  assert.ok(
    Array.isArray(snapshot.quirkDefinitions) && snapshot.quirkDefinitions.length === IDLE_QUIRKS_CATALOG_V1.length,
    "idleNguSnapshot doit exposer le catalogue complet des Quirks (quirkDefinitions), sinon le client ne peut jamais construire un id de quirk valide."
  );
  assert.deepEqual(snapshot.perkDefinitions[0], IDLE_PERKS_CATALOG_V1[0], "Le catalogue exposé doit être identique au catalogue source, jamais reconstruit/approximé côté snapshot.");
  assert.deepEqual(snapshot.quirkDefinitions[0], IDLE_QUIRKS_CATALOG_V1[0], "Le catalogue exposé doit être identique au catalogue source, jamais reconstruit/approximé côté snapshot.");
}

console.log("idle-quirks-v1: OK");
