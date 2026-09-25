import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,
  idleAdventureEquipmentStatsV47,
  idleAdventureBoostRoomV1
} from "../src/idle-adventure-v47.js";
import { IDLE_SPECIAL_POINTS_EXP_V1, idleSpecialPointsRatioV1 } from "../src/idle-adventure-special-points-v1.js";

/*
 * Special Boosts en POINTS, remplissage dans l'ordre des Specials (2026-09-25).
 * Wiki, page Build Cooking : « if you have a Level 0 Chef's Apron, you need to add 30 Special Boosts to it before you can start leveling the
 * Energy Power boost » ; page Item data : Base Points / Max Points de chaque Special (Chef's Apron : Cooking 30 pts = 30 %, Energy Power 50 pts = 50 %).
 */
const ctx = { bosses: 100 };
const near = (a, b, m) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${m} : ${a} != ${b}`);

function avec(definitionId, level = 0) {
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter((i) => i.kind !== "cube");
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, ctx, 1).state;
  return s;
}
function boost(s, force, targetId) {
  const id = `b${Math.random()}`;
  s.inventory.push({ id, definitionId: `boost:special:${force}`, name: "Boost", kind: "boost", boostType: "special", strength: force, level: 0 });
  return applyIdleAdventureActionV47(s, { action: "boost", boostId: id, targetId }, ctx, 1).state;
}
const liste = (s, id) => idleAdventureSnapshotV47(s, 100).inventory.find((i) => i.id === id).specialsAll;

// Table de points : ratios exacts lus sur les fiches wiki
assert.equal(idleSpecialPointsRatioV1("grb:chest", 0), 1, "Chef's Apron : Cooking 1 point = 1 %");
assert.equal(idleSpecialPointsRatioV1("grb:chest", 1), 1, "Chef's Apron : Energy Power 1 point = 1 %");
assert.equal(idleSpecialPointsRatioV1("gaudyShoulders", 0), 10, "Gaudy Epaulettes : Energy Bars 10 points = 1 %");
assert.equal(idleSpecialPointsRatioV1("gaudyShoulders", 1), 100, "Energy Cap 100 points = 1 %");
assert.equal(idleSpecialPointsRatioV1("gaudyShoulders", 2), 10, "Energy Power 10 points = 1 %");
assert.ok(Object.keys(IDLE_SPECIAL_POINTS_EXP_V1).length >= 370);

// Chef's Apron niveau 0 : 30 points pour le 1er Special, puis le 2e (Cooking / Energy Power)
{
  let s = avec("grb:chest", 0);
  const apron = s.inventory.find((i) => i.definitionId === "grb:chest");
  assert.deepEqual(liste(s, apron.id).map((x) => [x.type, x.value, x.max]), [["cookingPct", 0, 30], ["energyPowerPct", 0, 50]]);
  s = boost(s, 10, apron.id);
  s = boost(s, 10, apron.id);
  assert.deepEqual(liste(s, apron.id).map((x) => x.value), [20, 0], "le 2e Special ne bouge pas tant que le 1er n'est pas plein");
  s = boost(s, 10, apron.id);
  assert.deepEqual(liste(s, apron.id).map((x) => x.value), [30, 0]);
  s = boost(s, 10, apron.id);
  assert.deepEqual(liste(s, apron.id).map((x) => x.value), [30, 10], "le Special suivant démarre");
  // un gros boost déborde sur le 2e Special et s'arrête au plafond ; le boost est consommé
  s = boost(s, 100, apron.id);
  assert.deepEqual(liste(s, apron.id).map((x) => x.value), [30, 50]);
  assert.equal(idleAdventureBoostRoomV1(s, apron.id, "special"), 0);
  assert.throws(() => boost(s, 1, apron.id), /BOOST_STAT_DEJA_MAX/);
}

// Accessoire à 3 Specials, ratios 10 / 100 / 10 : les boosts sont des points, pas des pourcents
{
  let s = avec("gaudyShoulders", 0);
  const g = s.inventory.find((i) => i.definitionId === "gaudyShoulders");
  assert.deepEqual(liste(s, g.id).map((x) => [x.type, x.value, x.max]), [["energyBarsPct", 60, 100], ["energyCapPct", 12, 24], ["energyPowerPct", 50, 90]]);
  s = boost(s, 100, g.id);
  near(liste(s, g.id)[0].value, 70, "100 points = 10 % d'Energy Bars");
  // pièces équipées : les Specials secondaires comptent à leur valeur courante
  s = applyIdleAdventureActionV47(s, { action: "equip", id: g.id, slot: "accessory" }, ctx, 1).state;
  const st = idleAdventureEquipmentStatsV47(s).specials;
  near(st.energyBarsPct, 70, "Special 1");
  near(st.energyCapPct, 12, "Special 2 à sa Base value");
  near(st.energyPowerPct, 50, "Special 3 à sa Base value");
  // 300 points de plus (Energy Bars à 100) puis le Special 2 monte : (1200 points au maximum, 100 points = 1 %)
  s = boost(s, 500, g.id);
  const l = liste(s, g.id).map((x) => x.value);
  near(l[0], 100, "Energy Bars plein");
  near(l[1], 12 + (500 - 300) / 100, "le reste des points va à Energy Cap (100 points = 1 %)");
  near(idleAdventureEquipmentStatsV47(s).specials.energyCapPct, l[1], "l'équipement lit la valeur courante");
}

// Fusion : chaque Special garde son maximum
{
  let s = avec("grb:chest", 0);
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "grb:chest", level: 0 }, ctx, 1).state;
  const [a, b] = s.inventory.filter((i) => i.definitionId === "grb:chest");
  s = boost(s, 10, a.id); // 10 / 0
  for (let i = 0; i < 4; i++) s = boost(s, 10, b.id); // 30 / 10
  s = applyIdleAdventureActionV47(s, { action: "merge", a: a.id, b: b.id }, ctx, 1).state;
  const m = s.inventory.find((i) => i.definitionId === "grb:chest");
  assert.deepEqual(liste(s, m.id).map((x) => x.value), [30, 10]);
  assert.equal(m.level, 1);
}

// Sauvegarde antérieure (Specials d'une pièce de set proportionnels au 1er) : migration unique, rien n'est perdu
{
  let s = avec("jake:head", 0);
  const hat = s.inventory.find((i) => i.definitionId === "jake:head");
  delete hat.specialExtra;
  hat.special = 13.48; // milieu entre 11.14 et 15.82
  const n = normalizeIdleAdventureStateV47(s);
  const h = n.inventory.find((i) => i.id === hat.id);
  near(h.specialExtra[0], 61.4 + (108.2 - 61.4) / 2, "2e Special à la même fraction que l'ancien modèle");
  const n2 = normalizeIdleAdventureStateV47(n);
  near(n2.inventory.find((i) => i.id === hat.id).specialExtra[0], h.specialExtra[0], "migration idempotente");
}
console.log("idle-adventure-special-points-sequential: OK");
