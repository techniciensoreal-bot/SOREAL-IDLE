import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Plan moteur unique (Norman, 2026-11-05) : changer l'allocation d'un rituel ne fait PAS reculer sa barre. L'écran (blood-magic-v1.js, recalculerBloodLocalIdleV1_) garde la FRACTION de la barre au clic et ne change que
 * la durée ; le moteur doit faire exactement pareil, au clic ET au tick suivant. Mesuré le 2026-11-10 : la fraction du moteur reste identique (à 1 tick près) pour une allocation qui monte, qui baisse ou qui tombe à zéro.
 */
const ctx = { bosses: 140 };
const neuf = (or) => { const s = normalizeIdleNguState({}, ctx, 1000); s.systems.bloodMagic.unlocked = true; s.resources.magic.cap = 1e12; s.resources.magic.current = 1e12; s.currencies.gold = or; return s; };
const agir = (s, a, t) => applyIdleNguAction(s, a, ctx, t).state;
for (const [e1, e2, attente] of [[1000, 100000, 7000], [1e6, 1000, 7000], [1e5, 0, 7000], [3000, 30000, 1300], [50000, 400, 2900]]) {
  let s = neuf(1e18);
  const r = () => s.systems.bloodMagic.data.rituals.tack;
  const frac = () => (r().progressRef > 0 ? r().progress / r().progressRef : 0);
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: e1 }, 2000);
  s = advanceIdleNguState(s, attente, ctx, 2000 + attente);
  const t = 2000 + attente, f0 = frac();
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: e2 }, t);
  assert.ok(Math.abs(frac() - f0) < 1e-9, e1 + " -> " + e2 + " : la fraction est conservée au clic (" + f0 + " -> " + frac() + ")");
  if (e2 > 0) {
    s = advanceIdleNguState(s, 1, ctx, t + 1);   /* une milliseconde plus tard : jamais de saut en arrière */
    assert.ok(frac() >= f0 - 1e-9 || r().completions > 0, e1 + " -> " + e2 + " : pas de recul au tick suivant (" + f0 + " -> " + frac() + ")");
  }
}
console.log("idle-blood-allocation-fraction-v1: OK");
