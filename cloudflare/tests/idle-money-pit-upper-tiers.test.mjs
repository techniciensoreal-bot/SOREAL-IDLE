import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki Money Pit) : paliers 5-11 avec Adv Stat, Cube, HP, regen, EXP (x bonus EXP), Wandoos plafonné, Seeds. */
function toss(gold, random) {
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  s.currencies.gold = gold;
  const old = Math.random;
  Math.random = () => random;
  try {
    return applyIdleNguAction(s, { action: "moneyPit" }, { bosses: 100 }, 10_000_000);
  } finally {
    Math.random = old;
  }
}
{
  // palier 6 (1e15) : 9 colonnes, indice 7 = Wandoos +1 niveau (plafond 20)
  const r = toss(1e15, 0.85);
  assert.equal(r.result.tier, 6);
  assert.equal(r.state.systems.wandoos.data.osLevels.moneyPit, 1);
}
{
  // palier 6 : Wandoos déjà à 20 -> rien de plus
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  s.systems.wandoos.data.osLevels.moneyPit = 20;
  s.currencies.gold = 1e15;
  const old = Math.random;
  Math.random = () => 0.85;
  try {
    const r = applyIdleNguAction(s, { action: "moneyPit" }, { bosses: 100 }, 10_000_000);
    assert.equal(r.state.systems.wandoos.data.osLevels.moneyPit, 20);
  } finally { Math.random = old; }
}
{
  // palier 8 (1e21) : Cube +50 Power (indice 1)
  const r = toss(1e21, 0.15);
  assert.equal(r.result.tier, 8);
  assert.equal(r.state.adventure.cube.power, 50);
  assert.equal(r.state.adventure.cube.toughness, 0);
}
{
  // palier 11 (1e30) : Adv Stat +300 (indice 0)
  const r = toss(1e30, 0);
  assert.equal(r.result.tier, 11);
  assert.equal(r.state.adventure.permanent.adventurePower, 300);
}
console.log("idle-money-pit-upper-tiers ok");
