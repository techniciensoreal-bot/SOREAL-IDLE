import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureBoostV1,
  idleAdventureBoostRoomV1,
  idleAdventureAddItemV1
} from "../src/idle-adventure-v47.js";
import {
  IDLE_INVENTORY_AUTO_BASE_SECONDS_V1,
  idleInventoryBoostRecycleChanceV1,
  idleInventoryAutoIntervalSecondsV1,
  idleInventoryLoadoutSlotsV1,
  idleInventoryMergeSlotCountV1,
  idleInventoryRecycleBoostV1,
  idleInventoryRunAutoMergeV1,
  idleInventoryRunAutoBoostV1,
  idleInventoryTransformBoostV1,
  idleInventoryReceiveDropV1,
  idleInventoryProcessNewDropsV1,
  idleInventoryIdsV1,
  advanceIdleInventoryAutoV1,
  applyIdleInventoryAutoActionV1,
  normalizeIdleInventoryAutoV1
} from "../src/idle-inventory-auto-v1.js";

/*
 * Automatisation de l'inventaire (wiki Inventory / Experience / Boost / Infinity Cube / Challenges /
 * 4G's Sellout Shop / Perk Points / Quirk Points) : valeurs verrouillées sur le miroir local du wiki.
 */

const always = () => 0; // rng : recyclage toujours réussi
const never = () => 0.999999;

function adv() {
  const s = createIdleAdventureStateV47();
  s.inventoryAuto = normalizeIdleInventoryAutoV1(null);
  return s;
}
function addItem(s, definitionId, level = 0) {
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId, level }, {});
  const o = r.result;
  Object.assign(s, r.state);
  return s.inventory.find((x) => x.id === o.id);
}
function addBoost(s, type, strength, level = 0) {
  const b = idleAdventureBoostV1(type, strength);
  b.level = level;
  return idleAdventureAddItemV1(s, b);
}
function equip(s, id, slot) {
  Object.assign(s, applyIdleAdventureActionV47(s, { action: "equip", id, slot }, {}).state);
}

// --- Valeurs chiffrées ---
assert.equal(IDLE_INVENTORY_AUTO_BASE_SECONDS_V1, 3600, "Inventory : « The baseline countdown without any upgrades is 60 minutes ».");
assert.equal(idleInventoryBoostRecycleChanceV1(1, 0), 0.10, "Experience : Boost Recycling +10 % par achat.");
assert.equal(idleInventoryBoostRecycleChanceV1(9, 0), 0.50, "Experience : « Capped at 50% ».");
assert.equal(idleInventoryBoostRecycleChanceV1(5, 0.5), 1, "Les 50 % restants viennent du Basic Challenge.");
assert.equal(idleInventoryAutoIntervalSecondsV1({ timerMultiplier: 0.5 * 0.5 }), 900);
assert.equal(idleInventoryLoadoutSlotsV1(1, 1, 7), 10, "Inventory : 10 loadouts au maximum (2 + 1 EXP, 7 Sellout).");
assert.equal(idleInventoryLoadoutSlotsV1(1, 0, 0), 2, "« 2 Loadout Slots! » donne 2 slots.");
assert.equal(idleInventoryMergeSlotCountV1({
  bonuses: { expShop: { inventoryMergeSlot: 1 } },
  systems: { perks: { data: { levels: { 111: 1, 112: 1 } } }, quirks: { data: { levels: { 55: 1 } } } },
  selloutShop: { purchases: { inventoryMergeSlots: 4 } }
}), 8, "Inventory : « There are 8 automerge slots available ».");

// --- Auto Merge : équipé + slots d'automerge, objets protégés et niveau 100 exclus ---
{
  const s = adv();
  const arme = addItem(s, "sewers:weapon");
  equip(s, arme.id, "weapon");
  const d1 = addItem(s, "sewers:weapon", 3);
  const d2 = addItem(s, "sewers:weapon", 0);
  const protege = addItem(s, "sewers:weapon", 5);
  Object.assign(s, applyIdleAdventureActionV47(s, { action: "setLock", id: protege.id, locked: true }, {}).state);
  const maxe = addItem(s, "sewers:weapon", 100);
  const r = idleInventoryRunAutoMergeV1(s, {});
  assert.equal(r.merged, 2);
  const w = s.inventory.find((x) => x.id === arme.id);
  assert.equal(w.level, (0 + 3 + 1) + 0 + 1, "niveau = somme + 1 à chaque fusion");
  assert.ok(!s.inventory.some((x) => x.id === d1.id || x.id === d2.id));
  assert.ok(s.inventory.some((x) => x.id === protege.id), "un objet protégé n'est jamais fusionné");
  assert.ok(s.inventory.some((x) => x.id === maxe.id), "« If an item is at level 100, Auto Merge will not combine that item anymore »");
}
{
  const s = adv();
  const arme = addItem(s, "sewers:weapon", 100);
  equip(s, arme.id, "weapon");
  addItem(s, "sewers:weapon", 2);
  assert.equal(idleInventoryRunAutoMergeV1(s, {}).merged, 0, "une cible au niveau 100 ne fusionne plus");
}
// Slot d'automerge : aucun drop n'y tombe, et Auto Merge y fusionne
{
  const s = adv();
  s.mergeSlots = 1;
  const casePremiere = s.inventorySlots[0];
  assert.ok(casePremiere, "le Tutorial Cube de départ occupe la 1re case");
  const cube = s.inventory.find((x) => x.id === casePremiere);
  addItem(s, "tutorialCube", 4);
  assert.equal(s.inventorySlots[0], cube.id);
  const r = idleInventoryRunAutoMergeV1(s, {});
  assert.equal(r.merged, 1, "l'objet du slot d'automerge absorbe son double");
  assert.equal(s.inventory.find((x) => x.id === cube.id).level, 5);
  // un slot d'automerge vide ne reçoit jamais de nouvel objet
  Object.assign(s, applyIdleAdventureActionV47(s, { action: "discard", id: cube.id }, {}).state);
  const nouveau = addItem(s, "sewers:head");
  assert.equal(s.inventorySlots[0], "", "« no items will drop in these slots »");
  assert.ok(s.inventorySlots.indexOf(nouveau.id) >= 1);
  // réglage « fusion des slots d'automerge » désactivé
  const s2 = adv();
  s2.mergeSlots = 1;
  s2.inventoryAuto.mergeSlotsMerge = false;
  addItem(s2, "tutorialCube", 0);
  assert.equal(idleInventoryRunAutoMergeV1(s2, {}).merged, 0);
}
// MacGuffins équipés : fusion des copies du même type
{
  const s = adv();
  const mg = { equipped: [{ uid: "a", type: "power", level: 3 }], inventory: [{ uid: "b", type: "power", level: 1 }, { uid: "c", type: "drop", level: 0 }] };
  assert.equal(idleInventoryRunAutoMergeV1(s, { macguffins: mg }).merged, 1);
  assert.equal(mg.equipped[0].level, 5);
  assert.deepEqual(mg.inventory.map((f) => f.uid), ["c"]);
}

// --- Recyclage : un boost recyclé redescend d'un palier (page Boost, x1,94 / x1,77 / x1,88) ---
{
  const chaine = (force) => {
    let total = 0, f = force;
    const tiers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    for (let i = tiers.indexOf(f); i >= 0; i--) total += tiers[i];
    return total / force;
  };
  assert.ok(Math.abs(chaine(2000) - 1.944) < 1e-3 && Math.abs(chaine(5000) - 1.7776) < 1e-3 && Math.abs(chaine(10000) - 1.8888) < 1e-3);
  const s = adv();
  const b = addBoost(s, "power", 20);
  const info = { id: b.id, type: "power", strength: 20, slotIndex: s.inventorySlots.indexOf(b.id) };
  s.inventory = s.inventory.filter((x) => x.id !== b.id);
  const nb = idleInventoryRecycleBoostV1(s, info, 1, always);
  assert.equal(nb.strength, 10);
  assert.equal(nb.id, b.id, "le boost recyclé garde sa case");
  const un = addBoost(s, "power", 1);
  s.inventory = s.inventory.filter((x) => x.id !== un.id);
  assert.equal(idleInventoryRecycleBoostV1(s, { id: un.id, type: "power", strength: 1, slotIndex: -1 }, 1, always), null, "Boost 1 : aucun palier inférieur");
  assert.equal(idleInventoryRecycleBoostV1(s, info, 0, always), null);
}

// --- A + clic : tous les boosts non protégés, recyclés ré-appliqués d'abord ---
{
  const s = adv();
  const arme = addItem(s, "beardverse:weapon");
  const b20 = addBoost(s, "power", 20);
  const protege = addBoost(s, "power", 50);
  protege.locked = true;
  const t = addBoost(s, "toughness", 2);
  const st = { adventure: s };
  const r = applyIdleInventoryAutoActionV1(st, { mode: "boostAll", targetId: arme.id }, { boostRecycleChance: 1 }, always);
  const w = st.adventure.inventory.find((x) => x.id === arme.id);
  assert.equal(w.power, 20 + 10 + 5 + 2 + 1, "20 puis ses recyclages 10, 5, 2, 1");
  assert.equal(w.toughness, 2 + 1);
  assert.equal(r.applied, 7);
  assert.ok(st.adventure.inventory.some((x) => x.id === protege.id), "« Protected boosts will now be skipped »");
  assert.ok(!st.adventure.inventory.some((x) => x.id === b20.id || x.id === t.id));
}

// --- Auto Boost : équipement d'abord, cube seulement si tout est au maximum ---
{
  const s = adv();
  s.cube.unlocked = true;
  const anneau = addItem(s, "sewers:ring");
  equip(s, anneau.id, "accessory");
  const room = idleAdventureBoostRoomV1(s, anneau.id, "power");
  assert.ok(room > 0 && room < 100 && idleAdventureBoostRoomV1(s, anneau.id, "special") > 0);
  addBoost(s, "toughness", 1000);
  addBoost(s, "power", 1000);
  const stats = idleInventoryRunAutoBoostV1(s, { boostRecycleChance: 0 }, never);
  assert.equal(stats.applied, 2);
  assert.equal(stats.cube, 0, "pas de cube tant qu'une cible n'est pas au maximum (Special encore incomplet)");
  const w = s.inventory.find((x) => x.id === anneau.id);
  assert.ok(Math.abs(w.power - room) < 1e-9, "plafonné à la marge de la stat");
  assert.equal(idleAdventureBoostRoomV1(s, anneau.id, "power"), 0);
  addBoost(s, "special", 50);
  addBoost(s, "power", 10);
  const avant = s.cube.power;
  const stats2 = idleInventoryRunAutoBoostV1(s, { boostRecycleChance: 0 }, never);
  assert.equal(stats2.applied, 1);
  assert.equal(stats2.cube, 1, "« the cube being boosted if all other equipment is at maximum boost »");
  assert.ok(s.cube.power > avant);
}

// --- Minuteur (tick) ---
{
  const s = adv();
  s.inventoryAuto.autoMerge = true;
  const arme = addItem(s, "sewers:weapon");
  equip(s, arme.id, "weapon");
  addItem(s, "sewers:weapon");
  const env = { autoMergeUnlocked: true, timerMultiplier: 1 };
  assert.equal(advanceIdleInventoryAutoV1(s, 3599, env).merge, undefined);
  assert.equal(advanceIdleInventoryAutoV1(s, 1, env).merge.merged, 1);
  assert.equal(s.inventoryAuto.mergeElapsed, 0);
  s.inventoryAuto.autoMerge = true;
  const s2 = adv();
  s2.inventoryAuto.autoMerge = true;
  assert.equal(advanceIdleInventoryAutoV1(s2, 7200, { autoMergeUnlocked: false }).merge, undefined, "rien sans l'achat Auto Merge");
}

// --- Transformation de boost (Q/W/E) ---
{
  const s = adv();
  const b = addBoost(s, "power", 5, 40);
  assert.throws(() => idleInventoryTransformBoostV1(s, b.id, "toughness", {}), /TRANSFORMATION_BOOST_VERROUILLEE/);
  const r = idleInventoryTransformBoostV1(s, b.id, "toughness", { boostTransformUnlocked: true });
  assert.deepEqual([r.type, r.strength, r.level], ["toughness", 2, 0], "« e.g. 5->2 » et « reduces the boost's level to 0 »");
  const un = addBoost(s, "power", 1);
  assert.throws(() => idleInventoryTransformBoostV1(s, un.id, "special", { boostTransformUnlocked: true }), /BOOST_PALIER_MINIMUM/);
  const r2 = idleInventoryTransformBoostV1(s, un.id, "special", { boostTransformUnlocked: true, boostTransformFree: true });
  assert.deepEqual([r2.type, r2.strength], ["special", 1], "après la dernière complétion : plus de perte de palier");
  assert.throws(() => idleInventoryTransformBoostV1(s, un.id, "special", { boostTransformUnlocked: true, boostTransformFree: true }), /BOOST_DEJA_DE_CE_TYPE/);
}

// --- Butin entrant : filtre, cube, transformation automatique ---
{
  const s = adv();
  s.cube.unlocked = true;
  s.inventoryAuto.autoTransform = "toughness";
  s.inventoryAuto.lootFilter.items["boost:special:10"] = true;
  const env = { boostTransformFree: true, lootFilterImproved: true, filterBoostsIntoCube: true };
  const itopod = idleAdventureBoostV1("power", 10);
  itopod.level = 1;
  const kept = idleInventoryReceiveDropV1(s, itopod, env);
  assert.equal(kept.boostType, "toughness", "transformation automatique des boosts entrants");
  assert.equal(kept.level, 1, "« Auto Transform does not reset the boost level (ITOPOD drops) »");
  const avant = s.cube.power + s.cube.toughness;
  const filtre = idleInventoryReceiveDropV1(s, idleAdventureBoostV1("special", 10), env);
  assert.deepEqual(filtre, { filtered: true, cube: true });
  assert.ok(s.cube.power + s.cube.toughness > avant, "Filter Boosts into Infinity Cube");
  assert.ok(!s.inventory.some((x) => x.definitionId === "boost:special:10"));
  // filtre basique par type sur des drops de zone déjà entrés dans le sac
  s.inventoryAuto.lootFilter.types.head = true;
  const ids = idleInventoryIdsV1(s);
  const casque = addItem(s, "sewers:head");
  const anneau = addItem(s, "sewers:ring");
  const out = idleInventoryProcessNewDropsV1(s, ids, { lootFilterBasic: true });
  assert.equal(out.filtered, 1);
  assert.ok(!s.inventory.some((x) => x.id === casque.id) && s.inventory.some((x) => x.id === anneau.id));
  assert.ok(!s.inventorySlots.includes(casque.id));
  // sans l'achat, le réglage ne filtre rien
  const ids2 = idleInventoryIdsV1(s);
  addItem(s, "sewers:head");
  assert.equal(idleInventoryProcessNewDropsV1(s, ids2, { lootFilterBasic: false }).filtered, 0);
}

// --- Loadouts ---
{
  const s = adv();
  const a1 = addItem(s, "sewers:weapon");
  const a2 = addItem(s, "beardverse:weapon");
  const casque = addItem(s, "sewers:head");
  equip(s, a1.id, "weapon");
  equip(s, casque.id, "head");
  const st = { adventure: s };
  const env = { loadoutSlots: 2 };
  assert.throws(() => applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 2 }, env), /LOADOUT_VERROUILLE/);
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutSave", index: 0 }, env);
  equip(st.adventure, a2.id, "weapon");
  Object.assign(st.adventure, applyIdleAdventureActionV47(st.adventure, { action: "unequip", id: casque.id }, {}).state);
  applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 0 }, env);
  assert.equal(st.adventure.equipment.weapon, a1.id);
  assert.equal(st.adventure.equipment.head, casque.id);
  assert.throws(() => applyIdleInventoryAutoActionV1(st, { mode: "loadoutApply", index: 1 }, env), /LOADOUT_VIDE/);
}

console.log("idle-inventory-auto-core ok");
