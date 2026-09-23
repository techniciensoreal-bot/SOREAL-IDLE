import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47, idleAdventureEquipmentStatsV47 } from "../src/idle-adventure-v47.js";

/*
 * Audit NGU 2026-09-23 : AUCUN multiplicateur d'Adventure Stats n'atteignait le combat
 * (perks, quirks, wishes, NGU Adventure alpha/beta, Advanced Training, Iron Pill, Fruit of
 * Adventure...). Stats = (base 10 + équipement + gains absolus) x multiplicateur.
 */
const ctx = { bosses: 30 };
const stats = (state) => idleNguSnapshot(state, ctx, 0).adventure.stats;
const neuf = () => normalizeIdleNguState({}, ctx, 0);

// Départ inchangé : 10 / 10, 50 PV, 1 de regen, Block 50 %
{
  const st = stats(neuf());
  assert.equal(st.power, 10);
  assert.equal(st.toughness, 10);
  assert.equal(st.hp, 50);
  assert.equal(st.regen, 1);
  assert.equal(st.blockReduction, 0.5, "Advanced Training niveau 0 : (0+50)/(0+100)");
}

// The Newbie Adventure Perk : +100 Power/Toughness plats puis +10 % (wiki Adventure Mode)
{
  const s = neuf();
  s.systems.perks.data = { levels: { 2: 1 } };
  const st = stats(s);
  assert.ok(Math.abs(st.power - 110 * 1.1) < 1e-9, "(10 + 100) x 1,10");
  assert.ok(Math.abs(st.toughness - 110 * 1.1) < 1e-9);
}

// Advanced Training : Level^0.4 x 10 % sur la Power/Toughness d'AVENTURE, jamais sur Attack/Defense
{
  const s = neuf();
  s.systems.advancedTraining.data.tracks.power.tempLevel = 1000;
  s.systems.advancedTraining.data.tracks.toughness.tempLevel = 10;
  const st = stats(s);
  assert.ok(Math.abs(st.power / 10 - 2.5849) < 1e-3, "niveau 1000 : +158,49 %");
  assert.ok(Math.abs(st.toughness / 10 - 1.2512) < 1e-3, "niveau 10 : +25,12 %");
  assert.equal(idleNguBonuses(s).attackMultiplier, 1);
}
// Block : (Level+50)/(Level+100)
{
  const s = neuf();
  s.systems.advancedTraining.data.tracks.block.tempLevel = 10;
  assert.ok(Math.abs(stats(s).blockReduction - 60 / 110) < 1e-9, "54,55 % au niveau 10 (wiki)");
}

// NGU Adventure alpha : 0,1 %/niveau
{
  const s = neuf();
  s.systems.ngu.data.ngus.normal.adventureAlpha.level = 500;
  const st = stats(s);
  assert.ok(Math.abs(st.power - 10 * 1.5) < 1e-9);
  assert.ok(Math.abs(st.hp - 50 * 1.5) < 1e-9, "PV et regen suivent Power/Toughness");
  assert.ok(Math.abs(st.regen - 1.5) < 1e-9);
}

// Iron Pill : gain ABSOLU Blood^0.25 (Power/Toughness), HP x3, regen x0,03 (wiki Blood Magic)
{
  const s = neuf();
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = 10000; // 10000^0.25 = 10
  const r = applyIdleNguAction(s, { action: "castBloodSpell", spell: "ironPill" }, ctx, 0);
  const st = stats(r.state);
  assert.ok(Math.abs(st.power - 20) < 1e-6, "10 + 10");
  assert.ok(Math.abs(st.toughness - 20) < 1e-6);
  assert.ok(Math.abs(st.hp - 80) < 1e-6, "50 + 3 x 10");
  assert.ok(Math.abs(st.regen - 1.3) < 1e-6, "1 + 0,03 x 10");
}

// Fruit of Adventure : le gain permanent d'Yggdrasil est désormais lu
{
  const s = neuf();
  s.systems.yggdrasil.data.permanent.adventurePower = 40;
  s.systems.yggdrasil.data.permanent.adventureToughness = 40;
  const st = stats(s);
  assert.equal(st.power, 50);
  assert.equal(st.toughness, 50);
}

// Specials d'équipement : tous les types sont exposés (Respawn, Resource 3...)
{
  let a = neuf().adventure;
  a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId: "uug:ringGreed", level: 0 }, { bosses: 100 }, 1).state;
  const id = a.inventory.find((i) => i.definitionId === "uug:ringGreed").id;
  a = applyIdleAdventureActionV47(a, { action: "equip", id, slot: "accessory" }, { bosses: 100 }, 1).state;
  const gear = idleAdventureEquipmentStatsV47(a);
  assert.equal(gear.specials.respawnReductionPct, 8, "Ring of Greed : Respawn 8 %");
  assert.equal(gear.specials.goldDropsPct, 800);
  const st = neuf();
  st.adventure = a;
  assert.ok(Math.abs(idleNguBonuses(st).respawnReduction - 0.08) < 1e-9);
}
{
  let a = neuf().adventure;
  a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId: "meta:legs", level: 0 }, { bosses: 100 }, 1).state;
  const id = a.inventory.find((i) => i.definitionId === "meta:legs").id;
  a = applyIdleAdventureActionV47(a, { action: "equip", id, slot: "legs" }, { bosses: 100 }, 1).state;
  const st = neuf();
  const sans = idleNguBonuses(st).r3PowerMultiplier;
  st.adventure = a;
  assert.ok(Math.abs(idleNguBonuses(st).r3PowerMultiplier / sans - 1.11) < 1e-9, "Resource 3 Power +11 % (Meta legs)");
}

console.log("idle-adventure-stats-multipliers: OK");
