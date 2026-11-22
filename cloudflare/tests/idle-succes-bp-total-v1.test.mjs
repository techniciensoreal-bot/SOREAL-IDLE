import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_ACHIEVEMENTS_V1 } from "../src/idle-achievements-v1.js";

/* Tuile « Bonus Points : n / 5825 BP » : page des succès seulement (exception anti-spoil de Norman, 2026-10-10) ; total = somme des BP de la liste. */
const src = readFileSync(new URL("../public/modules/profile-v1.js", import.meta.url), "utf8");
assert.ok(src.includes("tuile('💎','Bonus Points',nombre(a.bp)+' / '+nombre(liste.reduce("), "x / y sur la tuile Bonus Points");
assert.equal(IDLE_ACHIEVEMENTS_V1.reduce((t, x) => t + x.bp, 0), 5825, "la somme du catalogue vaut 5825");
console.log("idle-succes-bp-total-v1 OK");
