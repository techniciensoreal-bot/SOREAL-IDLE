import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/* 2026-09-23 (wiki Infinity Cube / perk 26 / souhait 110) : conversion 1 % (2 % avec le perk), x(1 + 5 % par niveau du souhait 110). */
function verser(ctx, type = "power") {
  const s = normalizeIdleAdventureStateV47({});
  s.inventory.push({ id: "b1", definitionId: "boost:" + type + ":100", kind: "boost", boostType: type, strength: 100, level: 0 });
  const r = applyIdleAdventureActionV47(s, { action: "boost", boostId: "b1", toCube: true }, Object.assign({ bosses: 100 }, ctx), 1);
  return r.state.cube;
}
assert.ok(Math.abs(verser({}).power - 1) < 1e-9, "boost 100 -> 1 % = 1");
assert.ok(Math.abs(verser({ cubeBoostRate: 0.02 }).power - 2) < 1e-9, "perk : 2 %");
assert.ok(Math.abs(verser({ cubeBoostRate: 0.02, cubeBoostEffectiveness: 2 }).power - 4) < 1e-9, "perk + souhait 110 au niveau 20 : x2");
const speciale = verser({ cubeBoostRate: 0.02 }, "special");
assert.ok(Math.abs(speciale.power - 1) < 1e-9 && Math.abs(speciale.toughness - 1) < 1e-9, "boost spécial réparti moitié moitié");
console.log("idle-cube-boost-rate ok");
