import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  advanceIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";

/*
 * ITOPOD (wiki) : 10 kills = 1 étage, report du temps entre deux ticks, PP de première atteinte des
 * étages multiples de 10, étages de départ/fin (retour au départ après 10 kills sur l'étage de fin),
 * EXP + 1 AP tous les n kills selon le palier. Un kill = 4 s de respawn + 1 s par coup d'Idle Attack.
 */

function baseState() {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      tower: { unlocked: true, active: true, data: { floor: 0, killProgress: 0, kills: 0, ppProgress: 0 } }
    },
    currencies: { pp: 0 }
  };
}
const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 30 };

// 10 ticks de 20 s = 40 kills = 4 étages, le report de temps n'est jamais perdu
{
  let state = baseState();
  for (let i = 0; i < 10; i++) state = advanceIdleNguState(state, 20, ctx, Date.now());
  const d = state.systems.tower.data;
  assert.equal(d.kills, 40);
  assert.equal(d.floor, 4);
  assert.equal(d.killsOnFloor, 0);
}

// Ticks d'une seconde : le temps de kill s'accumule (5 s par kill)
{
  let state = baseState();
  for (let i = 0; i < 10; i++) state = advanceIdleNguState(state, 1, ctx, Date.now());
  assert.equal(state.systems.tower.data.kills, 2);
}

// Un gros rattrapage donne le même résultat qu'une suite de petits ticks
{
  const gros = advanceIdleNguState(baseState(), 200, ctx, Date.now()).systems.tower.data;
  assert.equal(gros.kills, 40);
  assert.equal(gros.floor, 4);
}

// PP de première atteinte : étage 10 = 1 PP, étage 100 = 10 PP ; jamais deux fois
{
  let state = baseState();
  Object.assign(state.systems.tower.data, { floor: 9, killsOnFloor: 9, highestFloor: 9, kills: 99 });
  state = advanceIdleNguState(state, 5, ctx, Date.now());
  assert.equal(state.systems.tower.data.floor, 10);
  assert.equal(state.currencies.pp, 1);
  state = advanceIdleNguState(state, 5, ctx, Date.now());
  assert.equal(state.currencies.pp, 1);
}

// Étages de départ/fin : après 10 kills sur l'étage de fin, retour à l'étage de départ
{
  let state = baseState();
  Object.assign(state.systems.tower.data, { floor: 5, killsOnFloor: 0, highestFloor: 20, kills: 50 });
  state = applyIdleNguAction(state, { action: "towerFloors", start: 2, end: 4 }, ctx, Date.now()).state;
  assert.equal(state.systems.tower.data.floor, 2);
  state = advanceIdleNguState(state, 5 * 10 * 3, ctx, Date.now());
  const d = state.systems.tower.data;
  assert.equal(d.floor, 2, "3 étages x 10 kills = un cycle complet, retour au départ");
  assert.equal(d.kills, 50 + 30);
}

// EXP et AP : palier 1 = 1 EXP / 39 kills ; 39 kills donnent 1 AP
{
  let state = baseState();
  state.currencies.experience = 0;
  state.currencies.ap = 0;
  Object.assign(state.systems.tower.data, { floor: 0, killsOnFloor: 0, highestFloor: 0, kills: 0 });
  state = applyIdleNguAction(state, { action: "towerFloors", start: 0, end: 0 }, ctx, Date.now()).state;
  state = advanceIdleNguState(state, 5 * 39, ctx, Date.now());
  assert.equal(state.systems.tower.data.kills, 39);
  assert.ok(Math.abs(state.currencies.experience - 1) < 1e-9);
  assert.equal(state.currencies.ap, 1);
}

// Sans assez de puissance, un kill demande plusieurs coups : 0 kill en 20 s à 10 de Power
{
  const faible = advanceIdleNguState(baseState(), 20, { adventurePower: 1, adventureToughness: 1, bosses: 30 }, Date.now());
  assert.equal(faible.systems.tower.data.kills, 0);
}

console.log("idle-itopod-floor-tracking: OK");
