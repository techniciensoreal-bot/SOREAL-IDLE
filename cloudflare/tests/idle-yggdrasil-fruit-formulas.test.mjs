import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses } from "../src/idle-ngu-progression.js";

/* Audit 2026-09-23 : formules de « Fruit Yields » du wiki (page Yggdrasil). */
const ctx = { bosses: 100 };
function manger(fruit, tier, mutate) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s.systems.yggdrasil.data.fruits[fruit].tier = tier;
  s.systems.yggdrasil.data.fruits[fruit].active = true;
  s.systems.yggdrasil.data.fruits[fruit].growthHours = tier;
  s.systems.yggdrasil.data.fruits[fruit].firstHarvestThisRun = false;
  if (mutate) mutate(s);
  return applyIdleNguAction(s, { action: "useYggFruit", fruit, mode: "eat" }, ctx, 1);
}
// Tier 4 : ceil(4^1.5) = 8
assert.equal(manger("powerBeta", 4).state.systems.yggdrasil.data.permanent.powerBetaValue, 8);
assert.equal(manger("numbers", 4).state.systems.yggdrasil.data.permanent.numbersValue, 24, "ceil(8 x 3)");
/*
 * 2026-09-24 : formule complète du wiki "floor(ceil(ceil(T^1.5) x 15 x ...) x (1 + BP/10000) x ...)" :
 * ici boss 10..100 (230 BP) + menu Yggdrasil débloqué (100 BP) -> floor(120 x 1,033) = 123.
 */
assert.equal(manger("arbitrariness", 4).state.currencies.ap, 123, "8 x 15 AP x 1,033");
assert.ok(Math.abs(manger("luck", 4).state.systems.yggdrasil.data.permanent.luckDropPct - Math.ceil(8 * 0.7) * 0.05) < 1e-9, "ceil(8 x 0,7) x 0,05 %");
assert.equal(manger("powerAlpha", 4).state.systems.yggdrasil.data.runPowerAlphaValue, 8);

// Bonus permanents : niveau^2 x 0,05 % (Power beta), niveau^1.3 x 0,05 % (Numbers)
{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.data.permanent.powerBetaValue = 10;
  s.systems.yggdrasil.data.runPowerBetaActive = true;
  s.systems.yggdrasil.data.permanent.numbersValue = 10;
  s.systems.yggdrasil.data.runNumbersActive = true;
  const base = normalizeIdleNguState({}, ctx, 0);
  const a = idleNguBonuses(s).attackMultiplier / idleNguBonuses(base).attackMultiplier;
  assert.ok(Math.abs(a - (1 + 100 * 5e-4) * (1 + Math.pow(10, 1.3) * 5e-4)) < 1e-9);
}

// Rage : progression de PP (1 000 000 = 1 PP), Tier 4 -> 8 x 60 000 = 480 000
{
  const r = manger("rage", 4, (s) => { s.systems.tower.data = { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 }; s.currencies.pp = 0; });
  assert.equal(r.state.systems.tower.data.ppProgress, 480000);
  assert.equal(r.state.currencies.pp, 0);
}

// Fruit of Knowledge : ceil(8 x 5) = 40 EXP
assert.equal(manger("knowledge", 4, (s) => { s.currencies.experience = 0; }).state.currencies.experience, 40);

console.log("idle-yggdrasil-fruit-formulas: OK");
