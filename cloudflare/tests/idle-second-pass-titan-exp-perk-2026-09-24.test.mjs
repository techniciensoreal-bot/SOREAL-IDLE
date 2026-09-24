import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, rebirthIdleNguState } from "../src/idle-ngu-progression.js";
import { perkBonusesV1 } from "../src/idle-perks-v1.js";

/*
 * Audit de seconde passe (2026-09-24) : perk 34 « Bonus Titan EXP! ».
 * Pages Experience (« +50% EXP from Titans. +3 kill per level that will benefit from this Perk ») et Perk Points
 * (« level 2 of this perk means the first 6 kills of each titan grants the 50% EXP bonus, every rebirth »).
 * Avant : `titanExpFirstKillsMultiplier` était agrégé (1 + 0,5 x niveau) puis copié dans un objet que personne ne lisait.
 */
const ctxNgu = { bosses: 100 };

assert.equal(perkBonusesV1({ 34: 0 }).titanExpBonusKills, 0);
assert.equal(perkBonusesV1({ 34: 2 }).titanExpBonusKills, 6, "3 kills par niveau");
assert.equal(perkBonusesV1({ 34: 3 }).titanExpBonusKills, 9);

function tuer(etat, ctx, t) {
  etat.titans.t1 = Object.assign({ kills: 0 }, etat.titans.t1, { nextAt: 0 }); // le délai de réapparition n'est pas l'objet du test
  return applyIdleAdventureActionV47(etat, { action: "titan", titan: "t1" }, ctx, t);
}

/* Niveau 1 : les 3 premiers kills valent +50 % (35 x 1,5 = 52,5 -> 53), le 4e retombe à 35. */
{
  let etat = normalizeIdleAdventureStateV47({});
  const ctx = { bosses: 58, stats: { power: 1300, toughness: 1300 }, titanExpBonusKills: perkBonusesV1({ 34: 1 }).titanExpBonusKills };
  const exp = [];
  for (let i = 0; i < 4; i++) {
    const r = tuer(etat, ctx, 1000 + i);
    etat = r.state;
    exp.push(r.result.experience);
  }
  assert.deepEqual(exp, [53, 53, 53, 35]);
  assert.equal(etat.titans.t1.rebirthKills, 4);
  assert.equal(etat.titans.t1.kills, 4);
}

/* Sans le perk : jamais de bonus. */
{
  const etat = normalizeIdleAdventureStateV47({});
  const r = tuer(etat, { bosses: 58, stats: { power: 1300, toughness: 1300 } }, 1000);
  assert.equal(r.result.experience, 35);
}

/* Niveau 2 : 6 kills bonifiés. */
{
  let etat = normalizeIdleAdventureStateV47({});
  const ctx = { bosses: 58, stats: { power: 1300, toughness: 1300 }, titanExpBonusKills: 6 };
  const exp = [];
  for (let i = 0; i < 7; i++) {
    const r = tuer(etat, ctx, 1000 + i);
    etat = r.state;
    exp.push(r.result.experience);
  }
  assert.deepEqual(exp, [53, 53, 53, 53, 53, 53, 35]);
}

/* Le compteur repart à zéro à chaque Rebirth (« every rebirth »), pas les kills à vie. */
{
  const T0 = 1_000_000;
  const s = normalizeIdleNguState({}, ctxNgu, T0);
  s.adventure.titans.t1 = { kills: 24, rebirthKills: 5, nextAt: 0 };
  const r = rebirthIdleNguState(s, ctxNgu, T0 + 4 * 3600 * 1000);
  assert.equal(r.adventure.titans.t1.rebirthKills, 0);
  assert.equal(r.adventure.titans.t1.kills, 24, "les kills à vie (déblocages) sont conservés");
}

console.log("idle-second-pass-titan-exp-perk-2026-09-24 ok");
