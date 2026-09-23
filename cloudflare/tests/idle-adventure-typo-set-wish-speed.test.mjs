import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * Audit NGU 2026-09-23 : le set Typo (page wiki "Typo (set)") donne « +20% Wish
 * Speed! » à sa complétion ; sa récompense était vide (`{}`).
 */
let s = normalizeIdleNguState({}, {}, 0);
const avant = idleNguBonuses(s).wishSpeedMultiplier;
for (const slot of ["head", "chest", "legs", "boots", "weapon", "asscessory", "eyeElxu"]) {
  s = applyIdleNguAction(
    s,
    { action: "adventure", adventure: { action: "addItem", definitionId: `typo:${slot}`, level: 100 } },
    {},
    1
  ).state;
}
assert.equal(s.adventure.completedSets.typo, true, "Typo Set complété (7 pièces niveau 100)");
assert.ok(Math.abs(s.adventure.setRewards.wishSpeedPct - 0.2) < 1e-12);
assert.ok(
  Math.abs(idleNguBonuses(s).wishSpeedMultiplier - avant * 1.2) < 1e-9,
  "le multiplicateur de vitesse des Wishes passe de x à x * 1,20"
);

console.log("idle-adventure-typo-set-wish-speed: OK");
