import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Blood Magic » : le 8e rituel « Turn
 * Yourself Inside Out » « is unlocked by completing Troll Challenge 6 »
 * (page Challenges, Troll Completion 6 : « A new Blood Magic Ritual! »).
 * Le drapeau n'etait pose nulle part : rituel inaccessible.
 */
const ctx = { bosses: 300 };
function etat(trollCompletions) {
  const s = normalizeIdleNguState({}, ctx, 1e6);
  s.systems.bloodMagic.unlocked = true;
  s.challenge.completions.troll = trollCompletions;
  return s;
}
assert.throws(() => applyIdleNguAction(etat(5), { action: "selectRitual", ritual: "insideOut" }, ctx, 1e6), /RITUEL_VERROUILLE/);
const r = applyIdleNguAction(etat(6), { action: "selectRitual", ritual: "insideOut" }, ctx, 1e6).state;
assert.equal(r.systems.bloodMagic.data.activeRitual, "insideOut");

/* Le rituel progresse : 20 000 000 000 s a 1000 magie / 1 puissance ; ici allocation et puissance elevees. */
{
  const s = etat(7);
  s.currencies.gold = 1e30;
  s.resources.magic.cap = 1e12; s.resources.magic.current = 1e12; s.resources.magic.power = 1e12;
  let x = applyIdleNguAction(s, { action: "selectRitual", ritual: "insideOut" }, ctx, 1e6).state;
  x = applyIdleNguAction(x, { action: "allocate", system: "bloodMagic", resource: "magic", value: 1e12 }, ctx, 1e6).state;
  const y = advanceIdleNguState(x, 100, ctx, 1e6 + 100 * 1000);
  /* 20e9 x 1000 / (1e12 x 1e12) = 2e-5 s par completion : le rituel tourne, du sang est produit. */
  assert.ok(y.currencies.blood > 0, "le rituel 8 produit du sang");
}
console.log("idle-blood-ritual-8-troll-unlock: OK");
