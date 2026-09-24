import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguTimeMachineGrossGoldPerSecond } from "../src/idle-ngu-progression.js";

/*
 * Wiki, page « Broken Time Machine » (2026-09-24), valeurs recopiées :
 *  - tableau « Machine Speed scaling » : niveau -> vitesse de barre (1x à 50x) et multiplicateur d'or supplémentaire (1 jusqu'au niveau 49, puis
 *    niveau - 48 : 2 au niveau 50, 3 au niveau 51, ... 50 au niveau 98) ;
 *  - « Highest Boss - 27 = Gold Multiplier (max of 274x) » ;
 *  - « The gold and Energy / Magic requirements for level N-1 -> N is N times that for level 0 -> 1 », 5 millions d'or pour le niveau 1 ;
 *    1e6 secondes en Normal (1 de puissance, 1000 de cap) et 1e18 secondes en Evil.
 * La production d'or brute est lue via idleNguTimeMachineGrossGoldPerSecond (l'or par barre = meilleur drop d'or de la run).
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
function gross({ speedLevel = 0, goldLevel = 0, highestBoss = 28, bestGold = 1 } = {}) {
  const state = normalizeIdleNguState({}, ctx, T0);
  state.systems.timeMachine.unlocked = true;
  const d = state.systems.timeMachine.data;
  d.bestGoldThisRun = bestGold;
  d.highestBossEver = highestBoss;
  d.speedLevel = speedLevel;
  d.goldLevel = goldLevel;
  return idleNguTimeMachineGrossGoldPerSecond(state);
}

const base = gross();
assert.ok(base > 0, "production de base > 0 : " + base);

// Tableau « Machine Speed scaling » : [niveau, vitesse de barre, multiplicateur d'or supplémentaire]
const SPEED_TABLE = [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [46, 47, 1], [47, 48, 1], [48, 49, 1], [49, 50, 1], [50, 50, 2], [51, 50, 3], [52, 50, 4], [98, 50, 50]];
for (const [level, bar, extra] of SPEED_TABLE) {
  const ratio = gross({ speedLevel: level }) / base;
  assert.ok(Math.abs(ratio - bar * extra) / (bar * extra) < 1e-9, "niveau " + level + " : x" + ratio + " au lieu de x" + bar * extra);
}
// « going from level 49 to 50 will double your GPS »
assert.ok(Math.abs(gross({ speedLevel: 50 }) / gross({ speedLevel: 49 }) - 2) < 1e-9);

// Volontairement NON verrouillé : l'effet exact d'un niveau de « Gold Multiplier » (piste magie) n'est pas publié par le wiki
// (« essentially just a basic multiplier to gold output »).

// Meilleur boss : (boss - 27), plafonné à 274. Au boss 28 le multiplicateur vaut 1.
assert.ok(Math.abs(gross({ highestBoss: 100 }) / base - 73) < 1e-9, "boss 100 : x73");
assert.ok(Math.abs(gross({ highestBoss: 301 }) / base - 274) < 1e-9, "boss 301 : x274 (maximum)");
assert.ok(Math.abs(gross({ highestBoss: 500 }) / base - 274) < 1e-9, "au-delà : reste à x274");

console.log("idle-wiki-table-time-machine: OK");
