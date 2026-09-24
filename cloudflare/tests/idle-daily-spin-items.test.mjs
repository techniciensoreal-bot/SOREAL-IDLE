import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { idleAchievementsApMultiplierV1 } from "../src/idle-achievements-v1.js";

/* 2026-09-23 (wiki Daily Spin) : la roue donne aussi des potions, Lucky Charm, Bar Bar, Little Blue Pill (jackpots) ; chaque palier totalise 100 %. */
const ctx = { bosses: 100 };
function spin(totalSpins, random) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.dailySpin.unlocked = true;
  s.systems.dailySpin.data.totalSpins = totalSpins;
  s.systems.dailySpin.data.readyAt = 0;
  const old = Math.random;
  Math.random = () => random;
  try { return applyIdleNguAction(s, { action: "collect", system: "dailySpin" }, ctx, 10_000_000); } finally { Math.random = old; }
}
{
  // palier 1 (7 spins) : le 100e pourcent -> Magic Potion α (dernier lot à 1 %)
  const r = spin(7, 0.995);
  assert.equal(r.result.tier, 1);
  assert.deepEqual(r.result.reward.items, { magicPotionAlpha: 1 });
  const avant = idleNguBonuses(normalizeIdleNguState({}, ctx, 1_000_000)).magicPowerMultiplier;
  assert.ok(Math.abs(idleNguBonuses(r.state).magicPowerMultiplier / avant - 2) < 1e-9, "la potion s'active immédiatement");
}
{
  // palier 3 (30 spins) : jackpot entre 99,0 et 99,5 % (avant le 50 000 AP à 0,5 %)
  const r = spin(30, 0.9925);
  assert.equal(r.result.tier, 3);
  assert.ok(r.result.reward.items && r.result.reward.items.luckyCharm === 1, "CONSUMABLES JACKPOT du palier 3");
}
{
  // palier 3, dernier lot : 50 000 AP
  const r = spin(30, 0.9999);
  /* 2026-09-24 : lot de 50 000 AP x bonus des succès (boss 10..100 = 230 BP, page Arbitrary Points), arrondi inférieur. */
  assert.equal(idleAchievementsApMultiplierV1(r.state), 1.023);
  assert.equal(r.result.reward.ap, 51150);
}
console.log("idle-daily-spin-items ok");
