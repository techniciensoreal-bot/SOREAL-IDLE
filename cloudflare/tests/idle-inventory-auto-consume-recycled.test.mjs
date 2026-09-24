import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1
} from "../src/idle-adventure-v47.js";
import {
  idleInventoryRunAutoBoostV1,
  applyIdleInventoryAutoActionV1,
  normalizeIdleInventoryAutoV1,
  idleInventoryAutoSnapshotV1
} from "../src/idle-inventory-auto-v1.js";

/*
 * Réglage « consommer les boosts recyclés » (2026-09-24). Build History 2018, build .367 :
 * « Added setting to choose if Autoboost/A+clicking consumes recycled boosts or leaves them
 * alone. » Par défaut (build .366) : « A + Click/Autoboost will now re-apply a boost that is
 * successfully recycled before moving to the next boost ».
 */
const always = () => 0; // recyclage toujours réussi

function adv() {
  const s = createIdleAdventureStateV47();
  s.inventoryAuto = normalizeIdleInventoryAutoV1(null);
  return s;
}
function addItem(s, definitionId, level = 0) {
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {});
  Object.assign(s, r.state);
  return s.inventory.find((x) => x.id === r.result.id);
}
function addBoost(s, type, strength) {
  return idleAdventureAddItemV1(s, idleAdventureBoostV1(type, strength));
}

// Valeur par défaut et normalisation.
assert.equal(normalizeIdleInventoryAutoV1(null).consumeRecycled, true, "défaut : ré-appliquer (build .366)");
assert.equal(normalizeIdleInventoryAutoV1({ consumeRecycled: false }).consumeRecycled, false);

// A + clic, réglage coupé : le boost recyclé reste dans le sac, les autres boosts passent.
{
  const s = adv();
  const arme = addItem(s, "beardverse:weapon");
  const b20 = addBoost(s, "power", 20);
  const t = addBoost(s, "toughness", 2);
  const st = { adventure: s };
  assert.deepEqual(applyIdleInventoryAutoActionV1(st, { mode: "settings", consumeRecycled: false }, {}), { consumeRecycled: false });
  const r = applyIdleInventoryAutoActionV1(st, { mode: "boostAll", targetId: arme.id }, { boostRecycleChance: 1 }, always);
  const w = st.adventure.inventory.find((x) => x.id === arme.id);
  assert.equal(w.power, 20, "le Boost 20 est appliqué une fois, son recyclage (10) est laissé");
  assert.equal(w.toughness, 2);
  assert.equal(r.applied, 2);
  assert.equal(r.recycled, 2);
  const restes = st.adventure.inventory.filter((x) => x.kind === "boost").map((x) => [x.id, x.boostType, x.strength]).sort();
  assert.deepEqual(restes, [[b20.id, "power", 10], [t.id, "toughness", 1]].sort(), "les boosts recyclés restent dans leur case");
  assert.equal(idleInventoryAutoSnapshotV1(st.adventure, {}).settings.consumeRecycled, false);
}

// Auto Boost, réglage coupé : un boost recyclé sur la 1re cible n'est pas repris par la suivante.
{
  const s = adv();
  const arme = addItem(s, "beardverse:weapon");
  Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id: arme.id, slot: "weapon" }, {}).state);
  const casque = addItem(s, "beardverse:head");
  Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id: casque.id, slot: "head" }, {}).state);
  addBoost(s, "power", 5);
  s.inventoryAuto.consumeRecycled = false;
  const stats = idleInventoryRunAutoBoostV1(s, { boostRecycleChance: 1 }, always);
  assert.equal(stats.applied, 1, "un seul boost appliqué pendant la passe");
  assert.equal(stats.recycled, 1);
  const reste = s.inventory.find((x) => x.kind === "boost");
  assert.equal(reste.strength, 2, "le Boost 2 issu du recyclage attend la passe suivante");
  // Passe suivante : aucun marqueur persistant documenté, c'est un boost ordinaire.
  const stats2 = idleInventoryRunAutoBoostV1(s, { boostRecycleChance: 0 }, always);
  assert.equal(stats2.applied, 1);
  assert.ok(!s.inventory.some((x) => x.kind === "boost"));
}

// Réglage actif (défaut) : comportement inchangé, le recyclage est ré-appliqué aussitôt.
{
  const s = adv();
  const arme = addItem(s, "beardverse:weapon");
  addBoost(s, "power", 20);
  const st = { adventure: s };
  applyIdleInventoryAutoActionV1(st, { mode: "boostAll", targetId: arme.id }, { boostRecycleChance: 1 }, always);
  assert.equal(st.adventure.inventory.find((x) => x.id === arme.id).power, 20 + 10 + 5 + 2 + 1);
}

console.log("idle-inventory-auto-consume-recycled: OK");
