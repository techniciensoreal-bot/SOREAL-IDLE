import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,
  idleAdventureEquipmentStatsV47
} from "../src/idle-adventure-v47.js";
import { SET_ITEM_SPECIALS_V1 } from "../src/idle-adventure-set-specials-v1.js";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * Audit NGU 2026-09-23 : les pièces de set n'avaient AUCUN Special (énergie,
 * magie, drop, vitesses...) alors que la fiche wiki de 225 pièces sur 240 en
 * liste (gabarit "Item data" : Base value / Max stat at lvl 0 / Max stat at
 * max lvl). Le premier Special de la pièce est porté par le scalaire `special`
 * (départ = Base value, plafond = max niveau 0 x (1 + niveau/100), monté par les
 * Special Boosts comme pour les accessoires) ; les autres progressent avec la même
 * fraction vers leur propre plafond.
 */

// --- Données : la somme des maxima du set Jake = "Total Specials Max" de la page "Jake (set)" ---
{
  const totaux = {};
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "tie", "paperweight"]) {
    for (const [type, , , max100] of SET_ITEM_SPECIALS_V1[`jake:${slot}`] || []) totaux[type] = (totaux[type] || 0) + max100;
  }
  const attendu = { energyCapPct: 150.92, energyPowerPct: 825.6, goldDropsPct: 400, magicCapPct: 47.12, magicPowerPct: 392.64, nguSpeedPct: 120 };
  for (const [type, valeur] of Object.entries(attendu)) {
    assert.ok(Math.abs((totaux[type] || 0) - valeur) < 0.011, `${type} : ${totaux[type]} != ${valeur}`);
  }
}

// --- Office Hat (jake:head) : Energy Cap 11,14 -> 15,82 (x2 au niveau 100), Energy Power 61,4 -> 108,2 ---
function avecOfficeHat(niveau) {
  let s = normalizeIdleAdventureStateV47({});
  s.inventory = s.inventory.filter((i) => i.kind !== "cube");
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "jake:head", level: niveau }, { bosses: 100 }, 1).state;
  return s;
}
{
  const s = avecOfficeHat(0);
  const hat = s.inventory.find((i) => i.definitionId === "jake:head");
  assert.equal(hat.special, 11.14, "départ = Base value du 1er Special (Energy Cap)");
  const snap = idleAdventureSnapshotV47(s, 100).inventory.find((i) => i.definitionId === "jake:head");
  assert.equal(snap.specialType, "energyCapPct");
  assert.equal(snap.baseSpecial, 15.82, "plafond au niveau 0");
  assert.deepEqual(
    snap.specialsAll.map((x) => [x.type, Number(x.value.toFixed(2)), Number(x.max.toFixed(2))]),
    [["energyCapPct", 11.14, 15.82], ["energyPowerPct", 61.4, 108.2]]
  );

  // un gros Special Boost porte tous les Specials de la pièce à leur plafond
  s.inventory.push({ id: "bs", definitionId: "boost:special:10000", name: "Boost special", kind: "boost", boostType: "special", strength: 10000, level: 0 });
  const apres = applyIdleAdventureActionV47(s, { action: "boost", boostId: "bs", targetId: hat.id }, { bosses: 100 }, 1).state;
  const hat2 = apres.inventory.find((i) => i.id === hat.id);
  assert.ok(Math.abs(hat2.special - 15.82) < 1e-9, "plafonné à Max stat at lvl 0");
  const snap2 = idleAdventureSnapshotV47(apres, 100).inventory.find((i) => i.id === hat.id);
  assert.ok(Math.abs(snap2.specialsAll[1].value - 108.2) < 1e-9, "l'autre Special suit la même fraction : 100 % de son plafond");
}
{
  const s = avecOfficeHat(100);
  const snap = idleAdventureSnapshotV47(s, 100).inventory.find((i) => i.definitionId === "jake:head");
  assert.ok(Math.abs(snap.specialsAll[0].max - 31.64) < 1e-9, "Max stat at max lvl : Energy Cap 31,64 %");
  assert.ok(Math.abs(snap.specialsAll[1].max - 216.4) < 1e-9, "Energy Power 216,4 %");
}

// --- Effet en jeu : la pièce équipée alimente les bonus de ressources ---
{
  let s = avecOfficeHat(0);
  const hat = s.inventory.find((i) => i.definitionId === "jake:head");
  s = applyIdleAdventureActionV47(s, { action: "equip", id: hat.id, slot: "head" }, { bosses: 100 }, 1).state;
  const gear = idleAdventureEquipmentStatsV47(s);
  assert.ok(Math.abs(gear.specials.energyCapPct - 11.14) < 1e-9);
  assert.ok(Math.abs(gear.specials.energyPowerPct - 61.4) < 1e-9);

  const nu = normalizeIdleNguState({}, {}, 0);
  const sans = idleNguBonuses(nu);
  nu.adventure = s;
  const avec = idleNguBonuses(nu);
  assert.ok(Math.abs(avec.energyPowerMultiplier / sans.energyPowerMultiplier - 1.614) < 1e-9, "Energy Power +61,4 %");
  assert.ok(Math.abs(avec.energyCapMultiplier / sans.energyCapMultiplier - 1.1114) < 1e-9, "Energy Cap +11,14 %");
}

// --- Une pièce sans Special (Training) n'en expose aucun ---
{
  let s = normalizeIdleAdventureStateV47({});
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "training:weapon", level: 5 }, { bosses: 100 }, 1).state;
  const snap = idleAdventureSnapshotV47(s, 100).inventory.find((i) => i.definitionId === "training:weapon");
  assert.equal(snap.specialsAll, undefined);
  assert.equal(snap.specialType, undefined);
}

console.log("idle-adventure-set-item-specials: OK");
