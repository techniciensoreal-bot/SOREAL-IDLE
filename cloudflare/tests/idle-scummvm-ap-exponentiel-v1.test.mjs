/* Gain d'AP d'Énigmes EXPONENTIEL (Norman, 2026-11-23) : très peu au début, beaucoup à la fin, total = plafond pour une partie complète. */
import assert from "node:assert/strict";
import { applyIdleNguAction, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { idleScummvmApActifV1 } from "../src/idle-scummvm-progres-v1.js";
import { IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

assert.equal(idleScummvmApActifV1(), true);
const ctx = { bosses: IDLE_SCUMMVM_BOSS_V1 + 5 };
const t0 = Date.parse("2026-11-23T10:00:00.000Z");
const P = { jeu: "dott", plafond: 150000, reference: 200, croissance: 100 };
const cumul = (n, depuis) => {
  let e = depuis || syncIdleNguState({}, ctx, t0);
  e = applyIdleNguAction(e, Object.assign({ action: "scummvmProgres", unites: n }, P), ctx, t0 + 1000).state;
  return e;
};
const ap = (e) => e.systems.scummvm.data.jeux.dott.apCredite;
const a1 = ap(cumul(1)), a2 = ap(cumul(2)), a100 = ap(cumul(100)), a199 = ap(cumul(199)), a200 = ap(cumul(200)), a500 = ap(cumul(500));
const dernier = a200 - a199, premier = a1;
assert.ok(premier >= 1 && premier < 100, "la première unité rapporte très peu : " + premier);
assert.ok(a2 - a1 >= premier, "croissant");
assert.ok(a100 < 150000 * 0.1, "la moitié du jeu rapporte moins de 10 % du total : " + a100);
assert.ok(dernier > 50 * premier, "la dernière unité rapporte beaucoup plus que la première : " + dernier + " / " + premier);
assert.equal(a200, 150000, "une partie complète rapporte exactement le plafond");
assert.equal(a500, 150000, "jamais au-delà du plafond");
// idempotent et par paliers : 50 puis 50 = 100 d'un coup ; aucune unité en moins ne retire quoi que ce soit
let e = cumul(50); e = cumul(100, e); const e2 = cumul(40, e);
assert.equal(ap(e), a100, "par paliers = d'un coup");
assert.equal(ap(e2), a100, "une valeur plus basse n'enlève rien");
assert.equal(e.currencies.ap, a100, "l'AP du joueur est crédité du même montant (brut)");
console.log("idle-scummvm-ap-exponentiel-v1: OK (1re " + premier + ", 100e cumul " + a100 + ", dernière " + dernier + ")");
