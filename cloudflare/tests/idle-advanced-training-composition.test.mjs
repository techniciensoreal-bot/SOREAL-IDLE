import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
} from "../src/idle-ngu-progression.js";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * 2026-09-24 -- audit de composition, pages « Advanced Training » et « Challenges » (100 Levels) :
 *  - Objets « Advanced Training » (Ring of Utility...) : vitesse d'AT, jamais lue.
 *  - Souhait 190 : toutes les capacites a 50 niveaux/s sans allocation.
 *  - Defi 100 Levels : les niveaux d'AT gagnes comptent dans les 100.
 * (Les banques d'AT et le perk 18 sont testes dans idle-banks-advanced-training.)
 */
const ctx = { bosses: 100, basicTrainingComplete: true };
const T0 = 1_000_000;
const RUN = 3 * 3600 * 1000;

function at(state, id) { return state.systems.advancedTraining.data.tracks[id]; }
function base(mutate) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T0);
  s.systems.advancedTraining.unlocked = true;
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  mutate?.(s);
  return s;
}

/* Vitesse de base inchangee : 10 000 s pour le niveau 1 a 1000 d'allocation, 1 de puissance. */
{
  const s = base((x) => { x.systems.advancedTraining.allocation.energy = 1000; x.systems.advancedTraining.data.activeTrack = "power"; });
  assert.equal(at(advanceIdleNguState(s, 9999, ctx, T0 + 9999e3), "power").tempLevel, 0);
  assert.equal(at(advanceIdleNguState(s, 10000, ctx, T0 + 10000e3), "power").tempLevel, 1);
}

/* Objet Ring of Utility (uug:ringUtility, niveau 0) : Advanced Training +50 % -> x1,5. */
{
  const equipped = () => {
    let a = createIdleAdventureStateV47();
    let r = applyIdleAdventureActionV47(a, { action: "addItem", definitionId: "uug:ringUtility", level: 0 }, ctx, 1);
    const item = r.state.inventory.find((i) => i.definitionId === "uug:ringUtility");
    r = applyIdleAdventureActionV47(r.state, { action: "equip", id: item.id, slot: "accessory" }, ctx, 1);
    return r.state;
  };
  const mk = (withItem) => base((x) => {
    x.systems.advancedTraining.allocation.energy = 1000;
    x.systems.advancedTraining.data.activeTrack = "power";
    if (withItem) x.adventure = equipped();
  });
  const sans = at(advanceIdleNguState(mk(false), 5000, ctx, T0 + 5000e3), "power").progress;
  const avec = at(advanceIdleNguState(mk(true), 5000, ctx, T0 + 5000e3), "power").progress;
  assert.ok(sans > 0 && avec > 0);
  assert.ok(Math.abs(avec / sans - 1.5) < 1e-9, `vitesse x1,5 mesuree : ${avec / sans}`);
}

/* Souhait 190 : les 3 capacites de base montent a 50 niveaux/s sans energie allouee. */
{
  const s = base((x) => { x.systems.wishes.data.tracks["190"].level = 1; });
  const r = advanceIdleNguState(s, 2, ctx, T0 + 2000);
  for (const id of ["power", "toughness", "block"]) assert.equal(at(r, id).tempLevel, 100, `${id} : 50 niveaux/s x 2 s`);
  assert.equal(at(r, "wandoosEnergy").tempLevel, 0, "les capacites Wandoos restent invisibles tant que Wandoos est verrouille");
}

/* Defi 100 Levels : les niveaux d'AT consomment le budget de 100. */
{
  const s = base((x) => {
    x.challenge.active = "hundredLevels";
    x.systems.wishes.data.tracks["190"].level = 1;
  });
  const r = advanceIdleNguState(s, 10, ctx, T0 + 10000);
  const total = ["power", "toughness", "block"].reduce((sum, id) => sum + at(r, id).tempLevel, 0);
  assert.ok(total <= 100, `au plus 100 niveaux pendant le defi : ${total}`);
  assert.equal(r.challenge.hundredLevelsGained, total);
}

console.log("idle-advanced-training-composition: OK");
