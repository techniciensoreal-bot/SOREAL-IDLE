import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/* 2026-11-16 (code du jeu, PitController::tierNReward) : un entier uniforme, un lot par cas ; palier 6 : 11 cas (Cube x3, niveaux, EXP, graines, Puissance, Endurance, PV, régén., Wandoos). */
function toss(gold, random) {
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true; for (const id of ["infinityCube", "wandoos", "yggdrasil"]) s.systems[id].unlocked = true;
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
  // palier 6 (1e15) : 11 cas, le dernier = Wandoos +1 niveau (plafond 20)
  const r = toss(1e15, 10.5 / 11);
  assert.equal(r.result.tier, 6);
  assert.equal(r.state.systems.wandoos.data.osLevels.moneyPit, 1);
}
{
  // palier 6 : Wandoos déjà à 20 -> rien de plus
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.moneyPit.unlocked = true; for (const id of ["infinityCube", "wandoos", "yggdrasil"]) s.systems[id].unlocked = true;
  s.systems.wandoos.data.osLevels.moneyPit = 20;
  s.currencies.gold = 1e15;
  const old = Math.random;
  Math.random = () => 10.5 / 11;
  try {
    const r = applyIdleNguAction(s, { action: "moneyPit" }, { bosses: 100 }, 10_000_000);
    assert.equal(r.state.systems.wandoos.data.osLevels.moneyPit, 20);
  } finally { Math.random = old; }
}
{
  // palier 8 (1e21) : 11 cas sans garderie (non débloquée) ; Cube +50 Puissance = le 1er
  const r = toss(1e21, 0.5 / 11);
  assert.equal(r.result.tier, 8);
  assert.equal(r.state.adventure.cube.power, 50);
  assert.equal(r.state.adventure.cube.toughness, 0);
}
{
  // palier 11 (1e30) : +300 Puissance = le 7e cas des 11 (garderie non débloquée)
  const r = toss(1e30, 6.5 / 11);
  assert.equal(r.result.tier, 11);
  assert.equal(r.state.adventure.permanent.adventurePower, 310, "300 du lot + 10 du palier 1E8 (code du jeu)");
  assert.equal(r.state.adventure.permanent.adventureToughness, 10, "le lot est Puissance seule : la Robustesse ne reçoit que le palier 1E8");
}
console.log("idle-money-pit-upper-tiers ok");
