/* Perk 56 « MacGuffin Daycare! » (jeu, build 1260, 2026-11-16) : les fragments de MacGuffin (type 11) vont à la Garderie à 2 h par niveau, sans plafond
   de niveau 100 ; sans le perk, le jeu les refuse (InventoryController::swapDaycare). */
import assert from "node:assert/strict";
import {
  IDLE_DAYCARE_FRAGMENT_HOURS_V1,
  advanceIdleDaycareV1,
  createIdleDaycareDataV1,
  idleDaycarePlaceV1,
  idleDaycareRemoveV1,
  idleDaycareSnapshotV1,
  normalizeIdleDaycareDataV1
} from "../src/idle-daycare-v1.js";
import { idlePerkByIdV1 } from "../src/idle-perks-v1.js";

assert.equal(IDLE_DAYCARE_FRAGMENT_HOURS_V1, 2);
const perk = idlePerkByIdV1(56);
assert.equal(perk.cost, 5000);
assert.equal(perk.cap, 1);

const factors = { slots: 2, timeFactor: 1, speedMultiplier: 1 };
const adv = { inventory: [], equipment: {}, revision: 0 };
const nom = (t) => "Fragment " + t;
const neuf = () => ({ fragments: [{ uid: "f1", type: "energyPower", level: 150 }, { uid: "f2", type: "magicPower", level: 3 }], perkFragments: 1, nomDe: nom });

// Sans le perk : refusé ; la liste plaçable ne montre rien (aucun indice).
{
  const ext = neuf(); ext.perkFragments = 0;
  const data = createIdleDaycareDataV1();
  assert.throws(() => idleDaycarePlaceV1(adv, data, "f1", factors, ext), /PERK_MACGUFFIN_DAYCARE_REQUIS/);
  assert.equal(ext.fragments.length, 2, "le fragment reste dans l'inventaire");
  assert.deepEqual(idleDaycareSnapshotV1(data, adv, factors, ext).inventory, []);
}

// Avec le perk : 2 h par niveau, au-delà de 100, repris avec les niveaux gagnés.
{
  const ext = neuf();
  const data = createIdleDaycareDataV1();
  assert.equal(idleDaycareSnapshotV1(data, adv, factors, ext).inventory.length, 2);
  const r = idleDaycarePlaceV1(adv, data, "f1", factors, ext);
  assert.equal(r.level, 150);
  assert.deepEqual(ext.fragments.map((f) => f.uid), ["f2"]);
  assert.equal(data.slots.length, 1);
  // 10 h = 5 niveaux (au-delà du plafond de 100 des objets)
  advanceIdleDaycareV1(data, 10 * 3600, factors);
  assert.equal(data.slots[0].item.level, 155);
  const snap = idleDaycareSnapshotV1(data, adv, factors, ext);
  assert.equal(snap.items[0].item.level, 155);
  assert.equal(snap.items[0].maxed, false);
  assert.equal(snap.items[0].baseHours, 2);
  // La pose survit à la normalisation (niveau > 100 conservé)
  const n = normalizeIdleDaycareDataV1(JSON.parse(JSON.stringify(data)));
  assert.equal(n.slots[0].item.level, 155);
  // Deux fois le même type : refusé
  ext.fragments.push({ uid: "f3", type: "energyPower", level: 1 });
  assert.throws(() => idleDaycarePlaceV1(adv, data, "f3", factors, ext), /DAYCARE_OBJET_DEJA_PRESENT/);
  // Reprise : retour dans l'inventaire des fragments avec le niveau acquis
  const rep = idleDaycareRemoveV1(adv, data, "f1", factors, ext);
  assert.equal(rep.level, 155);
  assert.equal(rep.levelsGained, 5);
  assert.deepEqual(ext.fragments.find((f) => f.uid === "f1"), { uid: "f1", type: "energyPower", level: 155 });
  assert.equal(data.slots.length, 0);
}

// Le facteur de temps (réductions) s'applique aussi aux fragments.
{
  const ext = neuf();
  const data = createIdleDaycareDataV1();
  const f = { slots: 1, timeFactor: 0.5, speedMultiplier: 1 };
  idleDaycarePlaceV1(adv, data, "f2", f, ext);
  advanceIdleDaycareV1(data, 4 * 3600, f); // 4 h / (2 h x 0,5) = 4 niveaux
  assert.equal(data.slots[0].item.level, 7);
}

console.log("idle-garderie-fragments-v1 ok");
