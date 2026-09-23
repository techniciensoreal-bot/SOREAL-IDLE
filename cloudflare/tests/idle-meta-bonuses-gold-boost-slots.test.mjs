import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";

/* Audit 2026-09-23 : bonus calculés mais jamais lus (or d'aventure, Boosted Boosts, slots d'inventaire/accessoires). */
const ctx = { bosses: 100 };
const fresh = () => normalizeIdleNguState({}, ctx, 0);

// slots : 24 de base + Perks "More Inventory Space I/II" + souhaits ; 2 accessoires + perk 29
{
  const s = fresh();
  const base = idleAdventureSnapshotV47(s.adventure, 100);
  s.systems.perks.data = { levels: { 31: 12, 29: 1 } };
  const s2 = normalizeIdleNguState(s, ctx, 0);
  assert.equal(s2.adventure.bonusSlots.inventory, 12);
  assert.equal(s2.adventure.bonusSlots.accessory, 1);
  const snap = idleAdventureSnapshotV47(s2.adventure, 100);
  assert.equal(snap.inventorySlots.length, base.inventorySlots.length + 12, "+12 emplacements d'inventaire");
}

// Boosted Boosts I : +2,5 %/niveau sur la force appliquée d'un boost
{
  const boosted = (levels) => {
    let s = fresh();
    s.systems.perks.data = { levels };
    s.adventure.inventory = s.adventure.inventory.filter((i) => i.kind !== "cube");
    s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId: "forest:weapon", level: 100 } }, ctx, 1).state;
    const target = s.adventure.inventory.find((i) => i.definitionId === "forest:weapon");
    const avant = s.adventure.inventory.find((i) => i.id === target.id).power;
    s.adventure.inventory.push({ id: "b1", definitionId: "boost:power:1", name: "Boost", kind: "boost", boostType: "power", strength: 1, level: 0 });
    s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "boost", boostId: "b1", targetId: target.id } }, ctx, 1).state;
    return s.adventure.inventory.find((i) => i.id === target.id).power - avant;
  };
  const sans = boosted({});
  const avec = boosted({ 12: 40 });
  assert.ok(Math.abs(avec / sans - 2) < 1e-9, "40 niveaux x 2,5 % = +100 % : la force du boost double");
}

// Or d'aventure : Golden Showers (+5 %/niveau)
{
  const or = (levels) => {
    let s = fresh();
    s.systems.perks.data = { levels };
    const avant = Math.random;
    Math.random = () => 0.5;
    try {
      s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "selectZone", zone: "tutorial" } }, ctx, 1).state;
      const r = applyIdleNguAction(s, { action: "adventure", adventure: { action: "zoneKill", forceBoss: false } }, ctx, 2);
      return r.result.gold;
    } finally { Math.random = avant; }
  };
  const sans = or({});
  const avec = or({ 23: 20 });
  assert.ok(sans > 0);
  assert.ok(Math.abs(avec / sans - 2) < 0.01, "20 niveaux x 5 % = +100 % d'or");
}

console.log("idle-meta-bonuses-gold-boost-slots: OK");
