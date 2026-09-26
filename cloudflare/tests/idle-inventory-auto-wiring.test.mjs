import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguSnapshot,
  IDLE_NGU_EXP_SHOP_V1
} from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47, idleAdventureBoostV1, idleAdventureAddItemV1 } from "../src/idle-adventure-v47.js";
import { idleSelloutShopBuyV1, idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";
import { idlePerkByIdV1 } from "../src/idle-perks-v1.js";
import { idleQuirkByIdV1 } from "../src/idle-quirks-v1.js";

/* Câblage de l'automatisation de l'inventaire dans le moteur méta (boutique EXP, Sellout Shop, défis, tick, actions). */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
const fresh = () => normalizeIdleNguState({}, ctx, T0);
const act = (s, payload) => applyIdleNguAction(s, payload, ctx, T0);
function addItem(state, definitionId, level = 0) {
  const r = applyIdleAdventureActionV47(state.adventure, { action: "addItem", definitionId, level }, {});
  state.adventure = r.state;
  return r.result.id;
}
function equip(state, id, slot) {
  state.adventure = applyIdleAdventureActionV47(state.adventure, { action: "equip", id, slot }, {}).state;
}

// --- Boutique EXP (page Experience, Adventure Special) ---
assert.equal(IDLE_NGU_EXP_SHOP_V1.autoMerge.cost(0), 200);
assert.equal(IDLE_NGU_EXP_SHOP_V1.basicLootFilter.cost(0), 20);
assert.equal(IDLE_NGU_EXP_SHOP_V1.loadoutSlots.cost(0), 1000);
assert.equal(IDLE_NGU_EXP_SHOP_V1.loadoutSlots.gain, 2);
assert.equal(IDLE_NGU_EXP_SHOP_V1.loadoutSlot3.cost(0), 10000);
assert.equal(IDLE_NGU_EXP_SHOP_V1.boostRecycling.cost(4), 100);
assert.equal(IDLE_NGU_EXP_SHOP_V1.boostRecycling.max, 5, "+10 % par achat, plafond 50 %");
assert.equal(IDLE_NGU_EXP_SHOP_V1.inventoryMergeSlot.cost(0), 1000);

// --- Perks 111/112 et quirk 55 (pages Perk Points / Quirk Points) ---
assert.deepEqual([idlePerkByIdV1(111).cost, idlePerkByIdV1(111).cap], [250, 1]);
assert.deepEqual([idlePerkByIdV1(112).cost, idlePerkByIdV1(112).cap], [500000, 1]);
assert.deepEqual([idleQuirkByIdV1(55).cost, idleQuirkByIdV1(55).cap], [5000, 1]);

// --- Sellout Shop : les 5 objets câblés deviennent achetables ---
for (const id of ["improvedLootFilter", "autoMergeBoostTimers", "loadoutSlot", "filterBoostsIntoCube", "inventoryMergeSlots"]) {
  assert.ok(idleSelloutShopEffectActiveV1(id), id);
}

// --- Déblocages, minuteur et snapshot ---
{
  let s = fresh();
  assert.throws(() => act(s, { action: "inventoryAuto", mode: "settings", autoMerge: true }), /AUTO_MERGE_VERROUILLE/);
  assert.throws(() => act(s, { action: "inventoryAuto", mode: "settings", autoBoost: true }), /AUTO_BOOST_VERROUILLE/);
  s.currencies.experience = 100000;
  for (const [item, q] of [["autoMerge", 1], ["basicLootFilter", 1], ["loadoutSlots", 1], ["boostRecycling", 9], ["inventoryMergeSlot", 1]]) {
    s = act(s, { action: "buyExpShop", item, quantity: q }).state;
  }
  assert.equal(s.bonuses.expShop.boostRecycling, 5);
  s.challenge.completions.noEquipment = 5;
  s.challenge.completions.basic = 5;
  s.currencies.ap = 1e7;
  idleSelloutShopBuyV1(s, "autoMergeBoostTimers");
  s.systems.perks.data = s.systems.perks.data || { levels: {} };
  s.systems.perks.data.levels = Object.assign({}, s.systems.perks.data.levels, { 111: 1 });
  const snap = idleNguSnapshot(s, ctx, T0).inventoryAuto;
  assert.equal(snap.intervalSeconds, 3600 * 0.5 * 0.5, "No Equipment x5 (-50 %) puis 1/2 Sellout (x0,5)");
  assert.equal(snap.boostRecycleChance, 1, "50 % (EXP) + 50 % (Basic Challenge)");
  assert.equal(snap.mergeSlots, 2, "boutique EXP + perk 111");
  assert.equal(snap.loadoutSlots, 2);
  assert.ok(snap.unlocked.autoMerge && snap.unlocked.autoBoost && snap.unlocked.lootFilterBasic);
  assert.ok(!snap.unlocked.lootFilterImproved && !snap.unlocked.boostTransform);

  // Auto Merge via le tick : l'arme équipée absorbe son double après 15 minutes
  s = act(s, { action: "inventoryAuto", mode: "settings", autoMerge: true }).state;
  const arme = addItem(s, "sewers:weapon");
  equip(s, arme, "weapon");
  const double = addItem(s, "sewers:weapon", 2);
  let t = advanceIdleNguState(s, 899, ctx, T0);
  assert.ok(t.adventure.inventory.some((o) => o.id === double));
  t = advanceIdleNguState(t, 1, ctx, T0);
  assert.ok(!t.adventure.inventory.some((o) => o.id === double));
  assert.equal(t.adventure.inventory.find((o) => o.id === arme).level, 3);

  // Filtre basique : réglage accepté seulement une fois acheté
  t = act(t, { action: "inventoryAuto", mode: "lootFilterType", slot: "head", filtered: true }).state;
  assert.equal(t.adventure.inventoryAuto.lootFilters[t.adventure.selectedZone === "safe" ? t.adventure.lastCombatZone : t.adventure.selectedZone].types.head, true, "le filtre est réglé pour la zone courante");
  assert.throws(() => act(t, { action: "inventoryAuto", mode: "lootFilterItem", definitionId: "sewers:weapon", filtered: true }), /FILTRE_AMELIORE_VERROUILLE/);

  // Recyclage d'un boost appliqué à la main (100 % : il revient au palier inférieur dans la même case)
  // 2026-09-24 : la Beardverse weapon démarre à sa Base value (83 000 = plafond, Template:Item data), plus de place pour un boost ; cible GRB weapon (690/1 000).
  const cible = addItem(t, "grb:weapon");
  const b = idleAdventureAddItemV1(t.adventure, idleAdventureBoostV1("power", 5));
  const r = act(t, { action: "adventure", adventure: { action: "boost", boostId: b.id, targetId: cible } });
  assert.deepEqual([r.result.boostRecycled.recycled, r.result.boostRecycled.strength], [true, 2]);
  const recycle = r.state.adventure.inventory.find((o) => o.id === b.id);
  assert.equal(recycle.strength, 2);
  assert.equal(recycle.boostType, "power");

  // Loadouts
  const l = act(r.state, { action: "inventoryAuto", mode: "loadoutSave", index: 1 });
  assert.equal(l.result.loadout.weapon, arme);
  assert.throws(() => act(l.state, { action: "inventoryAuto", mode: "loadoutSave", index: 2 }), /LOADOUT_VERROUILLE/);
}

// --- Transformation : 100 Levels Challenge (Normal) ---
{
  const s = fresh();
  const b = idleAdventureAddItemV1(s.adventure, idleAdventureBoostV1("special", 200));
  assert.throws(() => act(s, { action: "inventoryAuto", mode: "transformBoost", itemId: b.id, type: "power" }), /TRANSFORMATION_BOOST_VERROUILLEE/);
  s.challenge.completions.hundredLevels = 1;
  const r = act(s, { action: "inventoryAuto", mode: "transformBoost", itemId: b.id, type: "power" });
  assert.deepEqual([r.result.type, r.result.strength], ["power", 100], "« 200->100 »");
  assert.throws(() => act(r.state, { action: "inventoryAuto", mode: "settings", autoTransform: "power" }), /TRANSFORMATION_AUTO_VERROUILLEE/);
  r.state.challenge.completions.hundredLevels = 5;
  const r2 = act(r.state, { action: "inventoryAuto", mode: "transformBoost", itemId: b.id, type: "toughness" });
  assert.equal(r2.result.strength, 100, "dernière complétion : transformation sans coût");
  const r3 = act(r2.state, { action: "inventoryAuto", mode: "settings", autoTransform: "special" });
  assert.equal(r3.state.adventure.inventoryAuto.autoTransform, "special");
}

console.log("idle-inventory-auto-wiring ok");
