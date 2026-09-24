import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, rebirthIdleNguState, idleNguTimeMachineGrossGoldPerSecond } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, pages « Broken Time Machine » et « Gold » :
 * « This machine will produce gold based on the best gold drop that you have
 * received in Adventure Mode. This number, along with the levels, resets upon
 * rebirth » ; « (based on highest gold earned from a kill that rebirth) ».
 * Avant : le plus gros drop d'Or n'etait enregistre nulle part cote serveur
 * (context.bestGold valait toujours 1) : la Time Machine ne produisait rien.
 */
const ctx = { bosses: 100, adventurePower: 1e9 };
const T = 1_000_000;

function kill(state, zone, boss, rnd, t) {
  const old = Math.random;
  Math.random = () => rnd;
  try {
    return applyIdleNguAction(state, { action: "adventure", adventure: { action: "zoneKill", forceBoss: boss, zone } }, Object.assign({ forceBoss: boss }, ctx), t).state;
  } finally { Math.random = old; }
}
let s = normalizeIdleNguState({}, ctx, T);
s.systems.timeMachine.unlocked = true;
s.adventure.selectedZone = "forest";
assert.equal(s.systems.timeMachine.data.bestGoldThisRun <= 1, true);

/* Boss de la Foret : 6 000 - 7 500 d'Or (page Gold : 7 500 au maximum). rnd = 0 -> minimum de la plage. */
s = kill(s, "forest", true, 0, T);
assert.equal(s.systems.timeMachine.data.bestGoldThisRun, 6000, "le drop de 6 000 Or est retenu");
const gps1 = idleNguTimeMachineGrossGoldPerSecond(s);
assert.ok(gps1 > 0);

/* Un drop plus faible ne remplace pas le meilleur ; un plus fort, si. */
const before = s.systems.timeMachine.data.bestGoldThisRun;
s = kill(s, "forest", false, 0, T + 1000);
assert.equal(s.systems.timeMachine.data.bestGoldThisRun, before, "kill normal (3 600) < 6 000 : inchange");
s = kill(s, "forest", true, 0.999, T + 2000);
assert.ok(s.systems.timeMachine.data.bestGoldThisRun > 7400 && s.systems.timeMachine.data.bestGoldThisRun <= 7500, "boss a la plage haute : meilleur drop");

/* Bonus d'Or (perk Golden Showers +5 %/niveau) : le drop retenu l'inclut. */
{
  let x = normalizeIdleNguState({}, ctx, T);
  x.systems.timeMachine.unlocked = true;
  x.adventure.selectedZone = "forest";
  x.systems.perks.data.levels[23] = 20; /* +100 % */
  x = kill(x, "forest", true, 0, T);
  assert.equal(x.systems.timeMachine.data.bestGoldThisRun, 12000);
}

/* Reinitialise au Rebirth (page BTM). */
{
  const r = rebirthIdleNguState(s, ctx, T + 10 * 3600 * 1000);
  assert.ok(r.systems.timeMachine.data.bestGoldThisRun <= 1, `remis a zero : ${r.systems.timeMachine.data.bestGoldThisRun}`);
}
console.log("idle-time-machine-best-gold-drop: OK");
