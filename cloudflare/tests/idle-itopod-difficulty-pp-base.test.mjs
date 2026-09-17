import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, pages "Evil difficulty"/"SADISTIC difficulty", section
 * "Differences" > "Adventure" : "ITOPOD base pp progress is (700 + floor)
 * instead of (200 + floor)" (Evil) ; "(2000 + floor) instead of Evil's
 * (700 + floor)" (SADISTIC) -- seule la base change, jamais le terme
 * "+ floor" lui-même.
 */

function baseState(difficulty) {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    difficulty,
    systems: {
      tower: { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } }
    },
    currencies: { pp: 0 }
  };
}

// Puissance/temps calibrés pour produire exactement 1 kill au floor 0 (comme idle-itopod-floor-tracking.test.mjs).
function oneKill(difficulty) {
  return advanceIdleNguState(baseState(difficulty), 20, { adventurePower: 1, adventureToughness: 1, bosses: 30 }, Date.now());
}

{
  const normal = oneKill("normal");
  assert.equal(normal.systems.tower.data.kills, 1, "Sanity : la calibration doit produire exactement 1 kill.");
  assert.equal(normal.systems.tower.data.ppProgress, 200, "Normal : (200 + floor 0) x 1 kill = 200.");
}
{
  const evil = oneKill("difficile");
  assert.equal(evil.systems.tower.data.ppProgress, 700, "Evil : (700 + floor 0) x 1 kill = 700, jamais 200.");
}
{
  const sadistic = oneKill("extreme");
  assert.equal(sadistic.systems.tower.data.ppProgress, 2000, "SADISTIC : (2000 + floor 0) x 1 kill = 2000, jamais 200 ni 700.");
}

console.log("idle-itopod-difficulty-pp-base: OK");
