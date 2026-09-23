import assert from "node:assert/strict";
import { perkBonusesV1 } from "../src/idle-perks-v1.js";
import { quirkBonusesV1 } from "../src/idle-quirks-v1.js";

/*
 * 2026-09-23 (wiki Boost, « Boost power ») : la puissance d'un boost = complétions (additives, 1,78 max) x Boosted Boosts
 * I-V (chacun multiplicatif : 2,5 x 2,2 x 2,2 x 1,5 x 1,5) x Beasted Boosts I-IV (1,5 x 2,2 x 1,5 x 1,25) x 1,2 x 1,2 (sets).
 * Total pour le boost « 1 » : 431,78.
 */
const perks = perkBonusesV1({ 12: 60, 33: 60, 107: 60, 229: 50, 230: 50 });
const quirks = quirkBonusesV1({ 11: 50, 53: 60, 72: 50, 73: 50 });
assert.ok(Math.abs(perks.boostPowerMultiplier - 2.5 * 2.2 * 2.2 * 1.5 * 1.5) < 1e-9);
assert.ok(Math.abs(quirks.boostPowerMultiplier - 1.5 * 2.2 * 1.5 * 1.25) < 1e-9);
const total = 1.78 * perks.boostPowerMultiplier * quirks.boostPowerMultiplier * 1.2 * 1.2;
assert.ok(Math.abs(total - 431.78) < 0.01, "boost de force 1 avec tout au maximum : 431,78 (wiki) -- obtenu " + total);
console.log("idle-boost-power-composition ok");
