import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { idleAdventureSpecialsListV1 } from "../src/idle-adventure-objets.js";
import { IDLE_SPECIAL_POINTS_EXP_V1 } from "../src/idle-adventure-special-points-v1.js";

/*
 * Alignement sur le code du jeu (audit design/audit-code-jeu/sets-bonus.md, 2026-11-16 ; ItemNameDesc::constructItemInfo) : valeur de départ (curSpec), plafond au niveau 0 (capSpec)
 * et exposant de points de chaque special concerné, convertis par le diviseur du type (effectBonus).
 */
function liste(definitionId, level = 0) {
  let a = normalizeIdleAdventureStateV47({});
  a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId, level }, { bosses: 400 }, 1).state;
  const o = a.inventory.filter((i) => i.definitionId === definitionId).pop();
  return idleAdventureSpecialsListV1(o);
}
const proche = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg} : ${a} au lieu de ${b}`);
function verif(def, attendu) {
  const l = liste(def);
  for (const [type, base, max0, max100] of attendu) {
    const s = l.find((x) => x.type === type);
    assert.ok(s, `${def} : ${type} absent`);
    proche(s.base, base, `${def} ${type} base`);
    proche(s.max, max0, `${def} ${type} max niveau 0`);
    if (max100 !== undefined) proche(liste(def, 100).find((x) => x.type === type).max, max100, `${def} ${type} max niveau 100`);
  }
}
verif("clock:boots", [["magicPowerPct", 18, 30, 60], ["magicCapPct", 1.8, 3, 6]]);
verif("rerednaw:legs", [["magicBarsPct", 800, 800, 1600], ["magicCapPct", 85, 85, 170]]);
verif("jake:tie", [["magicPowerPct", 41.4, 108.2, 216.4]]);
verif("smallGerbil", [["energyPowerPct", 6000, 6000, 12000], ["magicPowerPct", 6000, 6000, 12000], ["magicCapPct", 600, 600, 1200]]);
verif("heartBrown", [["seedGainPct", 35, 35, 70]]);
verif("dragonWings", [["magicPowerPct", 41.4, 108.2, 216.4]]);
verif("aBeanie", [["magicPowerPct", 70, 185, 370]]);
verif("meta:charmInfinity", [["energyCapPct", 888.8888, 888.8888, 1777.7776], ["magicCapPct", 888.8888, 888.8888, 1777.7776]]);
verif("heartShapedPanties", [["r3PowerPct", 6.666666, 6.666666, 13.333332], ["nguSpeedPct", 333.3333, 333.3333, 666.6666], ["energyCapPct", 666.6666, 666.6666, 1333.3332], ["magicCapPct", 666.6666, 666.6666, 1333.3332]]);

// Exposants de points : points = valeur x 10^exposant
{
  const amulet = liste("edgy:amulet");
  assert.equal(amulet.find((s) => s.type === "energyCapPct").ratio, 1e4, "A Cheap Plastic Amulet : Energy Cap 3 600 000 points = 360 %");
  assert.equal(amulet.find((s) => s.type === "magicCapPct").ratio, 1e4);
  assert.equal(liste("magicBarBarAccessory").find((s) => s.type === "magicPowerPct").ratio, 1e3, "Magic Bar Bar : Magic Power 3 000 000 points = 3 000 %");
  assert.deepEqual(IDLE_SPECIAL_POINTS_EXP_V1["edgy:amulet"], [3, 4, 3, 3, 4, 3]);
  assert.deepEqual(IDLE_SPECIAL_POINTS_EXP_V1["magicBarBarAccessory"], [3, 4, 3]);
}

console.log("idle-sets-specials-alignes-jeu-v1 : OK");
