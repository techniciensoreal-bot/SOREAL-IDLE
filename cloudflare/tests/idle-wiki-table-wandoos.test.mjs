import assert from "node:assert/strict";
import { IDLE_WANDOOS_OS_V1 } from "../src/idle-ngu-progression.js";

/*
 * Wiki, page « Wandoos », section « Operating Systems » (2026-09-24) : pour chacun des 3 OS, l'énergie/magie de base pour un speed-cap de
 * 50 niveaux par seconde (Normal / Evil / SADISTIC) et la formule du bonus total Attack/Defense. Valeurs et formules recopiées du wiki.
 *  - Wandoos 98 : ((1 + Energy/100) x (1 + Magic/25))^0,8
 *  - Wandoos MEH : (1 + Energy/5) x (1 + Magic x 2)
 *  - Wandoos XL : ((1 + Energy x 6) x (1 + Magic x 40))^1,05
 * Relations annoncées : en Normal chaque OS demande 1000 fois celui d'avant ; en Evil et SADISTIC 1 million de fois ; Wandoos 98 Evil = 1e12 x Normal,
 * SADISTIC = 1e12 x Evil.
 */
const REQUIREMENTS = {
  "98": { normal: 1e9, difficile: 1e21, extreme: 1e33 },
  meh: { normal: 1e12, difficile: 1e27, extreme: 1e39 },
  xl: { normal: 1e15, difficile: 1e33, extreme: 1e45 }
};
for (const [os, req] of Object.entries(REQUIREMENTS)) {
  assert.deepEqual({ ...IDLE_WANDOOS_OS_V1[os].requirement }, req, "seuils de speed-cap de " + os);
}

const ratioIs = (a, b, expected, label) => assert.ok(Math.abs(a / b - expected) / expected < 1e-9, label + " : " + a / b);
const req = (os, tier) => IDLE_WANDOOS_OS_V1[os].requirement[tier];
ratioIs(req("meh", "normal"), req("98", "normal"), 1e3, "Normal : MEH = 1000 x 98");
ratioIs(req("xl", "normal"), req("meh", "normal"), 1e3, "Normal : XL = 1000 x MEH");
for (const tier of ["difficile", "extreme"]) {
  ratioIs(req("meh", tier), req("98", tier), 1e6, tier + " : MEH = 1e6 x 98");
  ratioIs(req("xl", tier), req("meh", tier), 1e6, tier + " : XL = 1e6 x MEH");
}
ratioIs(req("98", "difficile"), req("98", "normal"), 1e12, "Evil Wandoos 98 = 1e12 x Normal");
ratioIs(req("98", "extreme"), req("98", "difficile"), 1e12, "SADISTIC Wandoos 98 = 1e12 x Evil");

const wiki = {
  "98": (e, m) => Math.pow((1 + e / 100) * (1 + m / 25), 0.8),
  meh: (e, m) => (1 + e / 5) * (1 + m * 2),
  xl: (e, m) => Math.pow((1 + e * 6) * (1 + m * 40), 1.05)
};
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
for (const os of Object.keys(wiki)) {
  for (const [e, m] of [[0, 0], [1, 0], [0, 1], [10, 5], [100, 100], [400, 400], [1234, 56]]) {
    assert.ok(rel(IDLE_WANDOOS_OS_V1[os].statBonus(e, m), wiki[os](e, m)) < 1e-12, os + " bonus à Energy " + e + " / Magic " + m);
  }
}

console.log("idle-wiki-table-wandoos: OK");
