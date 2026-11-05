import assert from "node:assert/strict";
import { createIdleAdventureStateV47, normalizeIdleAdventureStateV47, idleAdventureItemAtLevelV47 } from "../src/idle-adventure-v47.js";
import { applyIdleInventoryAutoActionV1, idleInventoryAutoSnapshotV1, idleInventoryReceiveDropV1, normalizeIdleInventoryAutoV1 } from "../src/idle-inventory-auto-v1.js";

/*
 * Norman (2026-11-05) : « le filtre avancé doit sauvegarder ce qu'on a choisi ; j'ai coché tout ce que je ne voulais plus looter et ça s'est décoché ». Cause : le filtre d'un objet précis suivait la ZONE ; un changement de zone affichait le filtre
 * (vide) de la nouvelle zone. Décision : UN SEUL filtre d'objets pour toutes les zones ; les filtres par TYPE restent par zone ; l'ancien format est fusionné sans rien perdre.
 */
const env = { lootFilterBasic: true, lootFilterImproved: true };
const etat = (zone) => {
  const s = normalizeIdleAdventureStateV47(createIdleAdventureStateV47());
  s.selectedZone = zone; s.lastCombatZone = zone;
  s.itemList = Object.assign({}, s.itemList, { "training:head": { seen: true }, "training:chest": { seen: true } });
  return s;
};
const objet = (s, d, zone) => applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "lootFilterItem", definitionId: d, filtered: true, zone }, env);
const snap = (s) => idleInventoryAutoSnapshotV1(s, env);
const casque = () => idleAdventureItemAtLevelV47("training:head", 0, "x" + Math.random());

{
  const s = etat("cave");
  objet(s, "training:head", "cave");
  assert.deepEqual(snap(s).lootFilter.items, ["training:head"], "filtré dans la grotte");
  s.selectedZone = "forest"; s.lastCombatZone = "forest";
  assert.deepEqual(snap(s).lootFilter.items, ["training:head"], "toujours coché dans la forêt (un seul filtre d'objets)");
  assert.deepEqual(idleInventoryReceiveDropV1(s, casque(), env), { filtered: true }, "l'objet n'est plus ramassé dans la forêt non plus");
  assert.ok(snap(s).filterable.find((x) => x.definitionId === "training:head").filtered, "la liste filtrable le montre filtré");
  /* décocher dans une zone décoche partout, et tient */
  applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "lootFilterItem", definitionId: "training:head", filtered: false, zone: "forest" }, env);
  s.selectedZone = "cave"; s.lastCombatZone = "cave";
  assert.deepEqual(snap(s).lootFilter.items, [], "décoché partout");
  assert.ok(idleInventoryReceiveDropV1(s, casque(), env).id, "ramassé de nouveau");
}
{
  /* les filtres par TYPE restent par zone */
  const s = etat("cave");
  applyIdleInventoryAutoActionV1({ adventure: s }, { mode: "lootFilterType", slot: "head", filtered: true }, env);
  s.selectedZone = "forest"; s.lastCombatZone = "forest";
  assert.equal(snap(s).lootFilter.types.head, undefined, "filtre par type : propre à la zone");
}
{
  /* migration : ancien filtre par défaut + filtres de zone fusionnés, rien n'est perdu ; puis vidés (un décochage tient) */
  const cfg = normalizeIdleInventoryAutoV1({ lootFilter: { items: { a: true } }, lootFilters: { cave: { items: { b: true }, types: { head: true } }, forest: { items: { c: true, a: true } } } });
  assert.deepEqual(Object.keys(cfg.lootItems).sort(), ["a", "b", "c"], "union de tous les anciens filtres d'objets");
  assert.deepEqual(Object.keys(cfg.lootFilter.items), [], "ancien emplacement vidé");
  assert.deepEqual(Object.keys(cfg.lootFilters.cave.items), [], "anciens filtres de zone vidés");
  assert.equal(cfg.lootFilters.cave.types.head, true, "les types de zone sont gardés");
  delete cfg.lootItems.a;
  assert.deepEqual(Object.keys(normalizeIdleInventoryAutoV1(cfg).lootItems).sort(), ["b", "c"], "un objet décoché ne revient pas à la normalisation suivante");
}
console.log("idle-filtre-objets-commun-toutes-zones-v1: OK");
