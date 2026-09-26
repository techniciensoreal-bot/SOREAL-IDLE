import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  idleAdventureItemAtLevelV47,
  idleAdventureAddItemV1
} from "../src/idle-adventure-v47.js";
import {
  applyIdleInventoryAutoActionV1,
  idleInventoryAutoSnapshotV1,
  idleInventoryReceiveDropV1,
  idleInventoryProcessNewDropsV1,
  idleInventoryFilterZoneV1
} from "../src/idle-inventory-auto-v1.js";

/*
 * Filtres de butin par zone (2026-09-26, Norman) : « les filtres de butin doivent être liés à la zone où on les active ; si je change de zone,
 * ça doit mettre le filtre adéquat ».
 */
const env = { lootFilterBasic: true, lootFilterImproved: true };
const state = (zone) => {
  const s = normalizeIdleAdventureStateV47(createIdleAdventureStateV47());
  s.selectedZone = zone;
  s.lastCombatZone = zone === "safe" ? "forest" : zone;
  return s;
};
const regler = (s, extra) => applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "lootFilterType", ...extra }, env);
const snap = (s) => idleInventoryAutoSnapshotV1(s, env);
const casque = () => idleAdventureItemAtLevelV47("training:head", 0, "x" + Math.random());

// Zone courante : la zone choisie, sinon la dernière zone de combat
assert.equal(idleInventoryFilterZoneV1({ selectedZone: "cave", lastCombatZone: "sky" }), "cave");
assert.equal(idleInventoryFilterZoneV1({ selectedZone: "safe", lastCombatZone: "sky" }), "sky");
assert.equal(idleInventoryFilterZoneV1({ selectedZone: "cave" }, "forest"), "forest", "zone explicite");

{
  const s = state("cave");
  regler(s, { slot: "head", filtered: true });
  assert.equal(snap(s).lootFilterZone, "cave");
  assert.equal(snap(s).lootFilter.types.head, true, "filtre actif dans la grotte");

  // Autre zone : le filtre de la grotte ne s'y applique pas ni ne s'y affiche
  s.selectedZone = "forest";
  assert.equal(snap(s).lootFilterZone, "forest");
  assert.equal(snap(s).lootFilter.types.head, undefined, "aucun filtre dans la forêt");
  assert.ok(idleInventoryReceiveDropV1(s, casque(), env).id, "le casque est gardé dans la forêt");

  // Régler la forêt ne touche pas la grotte
  regler(s, { slot: "chest", filtered: true });
  assert.equal(snap(s).lootFilter.types.chest, true);
  s.selectedZone = "cave";
  assert.equal(snap(s).lootFilter.types.chest, undefined);
  assert.equal(snap(s).lootFilter.types.head, true);
  // Butin dans la grotte : le casque est filtré
  assert.deepEqual(idleInventoryReceiveDropV1(s, casque(), env), { filtered: true });
  // Après un kill : les objets apparus sont filtrés selon la zone courante
  const avant = new Set(s.inventory.map((o) => String(o.id)));
  idleAdventureAddItemV1(s, casque());
  assert.equal(idleInventoryProcessNewDropsV1(s, avant, env).filtered, 1);
  // Safe zone : le filtre de la dernière zone de combat reste en vigueur
  s.selectedZone = "safe";
  s.lastCombatZone = "cave";
  assert.equal(snap(s).lootFilterZone, "cave");
}

// Sauvegarde d'avant : l'ancien filtre unique sert de filtre par défaut à toutes les zones, rien n'est perdu
{
  const s = state("sky");
  s.inventoryAuto = { lootFilter: { types: { legs: true }, items: {} } };
  assert.equal(snap(s).lootFilter.types.legs, true);
  s.selectedZone = "cave";
  assert.equal(snap(s).lootFilter.types.legs, true, "défaut partout");
  // régler une zone la détache (copie du défaut, puis modification)
  regler(s, { slot: "legs", filtered: false });
  assert.equal(snap(s).lootFilter.types.legs, undefined);
  s.selectedZone = "sky";
  assert.equal(snap(s).lootFilter.types.legs, true, "les autres zones gardent le défaut");
}
console.log("idle-loot-filter-per-zone-v1: OK");
