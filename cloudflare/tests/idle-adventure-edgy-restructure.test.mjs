import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_SETS,
  IDLE_ADVENTURE_ITEM_CATALOG_V1,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";
import { SET_ITEM_SPECIALS_V1 } from "../src/idle-adventure-set-specials-v1.js";

/* Audit 2026-09-23 (wiki « Edgy (set) » et « Edgy Boots (set) ») */
assert.deepEqual(IDLE_ADVENTURE_SETS.edgy.slots, ["head", "chest", "legs", "weapon", "amulet"], "Edgy = 5 pièces");
assert.deepEqual(IDLE_ADVENTURE_SETS.edgyboots.slots, ["left", "right"]);
assert.deepEqual(IDLE_ADVENTURE_SETS.bothedgy.slots, ["boots"]);
assert.equal(IDLE_ADVENTURE_ITEM_CATALOG_V1["edgyboots:left"].wikiItemId, 216);
assert.equal(IDLE_ADVENTURE_ITEM_CATALOG_V1["edgyboots:right"].wikiItemId, 219);
assert.equal(IDLE_ADVENTURE_ITEM_CATALOG_V1["bothedgy:boots"].wikiItemId, 220);
assert.equal(IDLE_ADVENTURE_ITEM_CATALOG_V1["edgy:boots"], undefined);

// Specials : le total Edgy (set) est exactement celui de la page du set (13 000 % Energy Bars...)
{
  const total = {};
  for (const slot of ["head", "chest", "legs", "weapon", "amulet"]) {
    for (const [type, , , max100] of SET_ITEM_SPECIALS_V1[`edgy:${slot}`] || []) total[type] = (total[type] || 0) + max100;
  }
  assert.equal(total.energyBarsPct, 13000);
  assert.equal(total.energyCapPct, 2540);
  assert.equal(total.energyPowerPct, 44200);
  assert.equal(total.magicBarsPct, 22400);
  assert.equal(total.magicCapPct, 3140);
  assert.equal(total.magicPowerPct, 35400);
}

// Migration : l'ancienne pièce edgy:boots devient bothedgy:boots (inventaire, liste d'objets)
{
  const s = createIdleAdventureStateV47();
  const ancien = JSON.parse(JSON.stringify(s));
  ancien.inventory.push({ id: "old1", definitionId: "edgy:boots", kind: "equipment", set: "edgy", slot: "boots", level: 7, power: 5, toughness: 6, special: 0 });
  ancien.itemList["edgy:boots"] = { maxLevel: 7, seen: true };
  const n = normalizeIdleAdventureStateV47(ancien);
  assert.ok(n.inventory.some((i) => i.id === "old1" && i.definitionId === "bothedgy:boots"));
  assert.equal(n.itemList["edgy:boots"], undefined);
  assert.equal(n.itemList["bothedgy:boots"].maxLevel, 7);
}

// BOTH Edgy Boots ne tombe que si Edgy Boots (set) est complet
{
  const boss = (complet) => {
    let s = createIdleAdventureStateV47();
    s.completedSets.edgyboots = complet;
    const ctx = { bosses: 260, difficulty: "difficile", difficultyPeaks: {}, forceBoss: true };
    const avant = Math.random;
    Math.random = () => 0;
    try {
      s = applyIdleAdventureActionV47(s, { action: "selectZone", zone: "evilverse" }, ctx).state;
      return applyIdleAdventureActionV47(s, { action: "zoneKill", forceBoss: true }, ctx).result;
    } finally { Math.random = avant; }
  };
  assert.ok(!boss(false).drops.some((d) => d.definitionId === "bothedgy:boots"));
  assert.ok(boss(true).drops.some((d) => d.definitionId === "bothedgy:boots"), "tirage forcé : BOTH tombe une fois Edgy Boots (set) complet");
}

console.log("idle-adventure-edgy-restructure: OK");
