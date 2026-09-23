import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/* Audit 2026-09-23 : titans 7, 8, 10, 11, 12 (page Titans + page de chaque titan). */
const ctx = { bosses: 300 };
function combat(id, difficulty, stats, mutate) {
  let s = normalizeIdleNguState({}, ctx, 0);
  s.difficulty = difficulty;
  if (mutate) mutate(s);
  const avant = Math.random;
  Math.random = () => 0.999999;
  try {
    return applyIdleNguAction(s, { action: "adventure", adventure: { action: "titan", titan: id, difficulty: "easy", stats } }, ctx, 1000);
  } finally { Math.random = avant; }
}

// Greasy Nerd : Evil seulement, débloque Hacks
{
  assert.throws(() => combat("nerd", "normal", { power: 1e20, toughness: 1e20 }), /DIFFICULTE_EVIL_REQUISE/);
  const r = combat("nerd", "difficile", { power: 1.37e14, toughness: 8.9e13 });
  assert.equal(r.result.experience, 1100);
  assert.equal(r.result.ppProgress, 250000);
  assert.ok(r.result.gold >= 4e10 && r.result.gold <= 5e10);
  assert.equal(r.state.systems.hacks.unlocked, true, "Incriminating Evidence débloque les Hacks");
  assert.throws(() => combat("nerd", "difficile", { power: 1.36e14, toughness: 8.9e13 }), /PUISSANCE_INSUFFISANTE/, "seuil Easy : 1,37e14 / 8,9e13");
}
// Godmother : débloque Wishes ; QP avec le souhait 40 (2 QP)
{
  const r = combat("godmother", "difficile", { power: 1.7e18, toughness: 7e17 }, (s) => { s.systems.wishes.data.tracks[40] = { level: 1 }; s.currencies.qp = 0; });
  assert.equal(r.state.systems.wishes.unlocked, true);
  assert.equal(r.state.currencies.qp, 2);
  assert.equal(r.result.experience, 1500);
}
// IT HUNGERS / ROCK LOBSTER / AMALGAMATE : Sadistic seulement
{
  for (const [id, stats, exp] of [["hungers", { power: 1.55e28, toughness: 3e27 }, 4000], ["lobster", { power: 1.1e31, toughness: 4e30 }, 6000], ["amalgamate", { power: 1.47e33, toughness: 4.7e32 }, 8000]]) {
    assert.throws(() => combat(id, "difficile", stats), /DIFFICULTE_SADISTIC_REQUISE/, id);
    assert.equal(combat(id, "extreme", stats).result.experience, exp, id);
  }
  assert.equal(combat("hungers", "extreme", { power: 1.55e28, toughness: 3e27 }).state.adventure.unlockFlags.itHungersDefeated, true, "débloque Cooking");
}
console.log("idle-adventure-titans-nerd-godmother-sadistic: OK");
