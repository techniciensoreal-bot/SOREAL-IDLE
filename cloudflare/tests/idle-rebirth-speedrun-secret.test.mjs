import assert from "node:assert/strict";
import { normalizeIdleNguState, rebirthIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 — audit des pages-guides. « Sneaky Secret about Rebirthing » (pages Rebirths,
 * Tips N' Tricks, Energy, New Player Guide (Truth), FAQ) : 3 Rebirths d'affilée, chacune de
 * moins de 30 minutes ET avec le boss 37 vaincu -> une seule fois 200 EXP et +1 Energy Power.
 */

const MIN = 60 * 1000;
function run(state, bosses, minutes) {
  const t = state.runStartedAt + minutes * MIN;
  const r = rebirthIdleNguState(state, { bosses }, t);
  return r.state || r;
}
const exp = (s) => s.currencies.experience;
const bonusPower = (s) => s.adventure.permanent.energyPowerFlat || 0;

// 3 Rebirths rapides : bonus au 3e.
{
  let s = normalizeIdleNguState({}, { bosses: 40 }, 1_000_000);
  const powerAvant = idleNguBonuses(s).energyPowerFlat;
  s = run(s, 40, 20);
  s = run(s, 37, 29);
  assert.equal(s.records.speedrunStreak, 2);
  const e2 = exp(s);
  assert.equal(bonusPower(s), 0, "pas encore de bonus après 2 Rebirths");
  s = run(s, 45, 25);
  assert.equal(exp(s) - e2, 200, "200 EXP au 3e Rebirth rapide");
  assert.equal(bonusPower(s), 1, "+1 Energy Power");
  assert.equal(s.records.speedrunSecretClaimed, 1);
  assert.ok(idleNguBonuses(s).energyPowerFlat > powerAvant, "l'Energy Power effective augmente");

  // Une seule fois.
  const e3 = exp(s);
  s = run(s, 45, 25);
  s = run(s, 45, 25);
  s = run(s, 45, 25);
  assert.equal(exp(s), e3, "bonus unique");
  assert.equal(bonusPower(s), 1);
}

// Série cassée : boss 36 seulement, ou 30 minutes pile.
{
  let s = normalizeIdleNguState({}, { bosses: 40 }, 1_000_000);
  s = run(s, 40, 20);
  s = run(s, 36, 20);
  assert.equal(s.records.speedrunStreak, 0, "boss 37 non vaincu : la série repart de zéro");
  s = run(s, 40, 20);
  s = run(s, 40, 30);
  assert.equal(s.records.speedrunStreak, 0, "30 minutes n'est pas « under 30 minutes »");
  s = run(s, 40, 20);
  s = run(s, 40, 20);
  assert.equal(bonusPower(s), 0);
  s = run(s, 40, 20);
  assert.equal(bonusPower(s), 1, "3 Rebirths consécutives après la cassure : bonus");
}

// Persistance des compteurs dans une sauvegarde.
{
  let s = normalizeIdleNguState({}, { bosses: 40 }, 1_000_000);
  s = run(s, 40, 20);
  const recharge = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), { bosses: 40 }, s.runStartedAt);
  assert.equal(recharge.records.speedrunStreak, 1, "la série survit à la sauvegarde");
}

console.log("idle-rebirth-speedrun-secret OK");
