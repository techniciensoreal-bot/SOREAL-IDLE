import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleInventoryProcessNewDropsV1 } from "../src/idle-inventory-auto-v1.js";

/*
 * Norman (2026-09-27) : « Quand un objet tombe et que le filtre est activé pour ce type de
 * pièce, le journal de combat doit indiqué (filtré) à côté de l'objet. »
 */

// 1. idleInventoryProcessNewDropsV1 renvoie désormais filteredIds (les ids réellement filtrés).
{
  const s = {
    inventory: [{ id: "iA", definitionId: "sewers:head", slot: "head", kind: "equipment" }],
    inventorySlots: ["iA"],
    inventoryAuto: { lootFilter: { types: { head: true }, items: {} } }
  };
  const out = idleInventoryProcessNewDropsV1(s, new Set(), { lootFilterBasic: true });
  assert.equal(out.filtered, 1);
  assert.deepEqual(out.filteredIds, ["iA"]);
}

// 2. Bout en bout : un kill de zone en Sewers avec le filtre "head" actif marque bien l'entrée filtrée.
{
  let s = normalizeIdleNguState({}, {}, 1000);
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "selectZone", zone: "sewers" } }, { bosses: 7 }, 1000).state;
  s.bonuses = s.bonuses || {};
  s.bonuses.expShop = s.bonuses.expShop || {};
  s.bonuses.expShop.basicLootFilter = 1;
  s = applyIdleNguAction(s, { action: "inventoryAuto", mode: "lootFilterType", slot: "head", filtered: true }, { bosses: 7 }, 1000).state;

  const original = Math.random;
  Math.random = () => 0; // maximise les drops
  let r;
  try {
    r = applyIdleNguAction(s, { action: "adventure", adventure: { action: "zoneKill" } }, { bosses: 7, forceBoss: true, stats: {} }, 1000);
  } finally {
    Math.random = original;
  }

  const drops = (r.result && r.result.drops) || [];
  const casque = drops.find((d) => d.slot === "head");
  assert.ok(casque, "le casque doit apparaître dans result.drops (même filtré)");
  assert.equal(casque.filtered, true, "l'entrée filtrée doit porter filtered:true");
  assert.equal(r.state.adventure.inventory.some((o) => o.slot === "head"), false, "le casque filtré n'est jamais resté dans le sac");
}

// 3. Client : le message de loot ajoute "(filtré)" quand objet.filtered est vrai, et utilise les nouveaux types de couleur (loot/gold).
const mod = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.match(mod, /ajouterLogAventureIdleV1_\(\s*\n?\s*'loot',/, "le loot utilise le type 'loot' (couleur dédiée), plus 'system'");
assert.match(mod, /\(objet&&objet\.filtered\?' \(filtré\)':''\)/, "\" (filtré)\" ajouté quand objet.filtered est vrai");
assert.match(mod, /ajouterLogAventureIdleV1_\(\s*\n?\s*'gold',/, "le gain d'or utilise le type 'gold' (jaune), plus 'system'");

console.log("idle-combat-log-filtered-drop-v1: OK");
