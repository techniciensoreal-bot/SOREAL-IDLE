import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki Arbitrary Points) : 1 AP tous les 10 boss d'aventure vaincus. */
const ctx = { bosses: 100, adventurePower: 1e12, adventureToughness: 1e12 };
let s = normalizeIdleNguState({}, ctx, 1_000_000);
s.currencies.ap = 0;
s.adventure.unlockFlags = s.adventure.unlockFlags || {};
s.adventure.selectedZone = "tutorial";
let t = 2_000_000;
for (let i = 0; i < 100; i++) { // un boss tous les 10 kills
  const r = applyIdleNguAction(s, { action: "adventure", adventure: { action: "zoneKill", forceBoss: true } }, ctx, t);
  s = r.state;
  t += 5000;
}
assert.equal(s.adventure.permanent.adventureBossKills, 10);
assert.equal(s.currencies.ap, 1, "10 boss = 1 AP");
console.log("idle-boss-ap ok (kills boss:", s.adventure.permanent.adventureBossKills, "AP:", s.currencies.ap, ")");
