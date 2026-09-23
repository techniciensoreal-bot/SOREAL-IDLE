import assert from "node:assert/strict";
import { perkBonusesV1, idlePerkByIdV1 } from "../src/idle-perks-v1.js";
import { quirkBonusesV1 } from "../src/idle-quirks-v1.js";
import { normalizeIdleNguState, idleNguBonuses, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-23 (audit, page Perk Points) : perks Evil/Sadistic dont l'effet existe -- Iron Pill (84/85),
 * respawn (93), Resource 3 (95-103, 122-124, 132-134, 141-143, 226-228), vitesse et temps
 * minimum des Wishes (108-110, 155-160), paliers des Hacks (113-115, 217-219), Welcome to Sadistic (144).
 */
const b = perkBonusesV1({ 84: 5, 85: 3 });
assert.equal(b.ironPillMultiplier, 26 * 4, "26x au niveau 5 de 84, 4x au niveau 3 de 85");
assert.ok(Math.abs(perkBonusesV1({ 93: 100 }).respawnRemaining - 0.9) < 1e-12);
assert.ok(Math.abs(perkBonusesV1({ 95: 100, 98: 50 }).r3PowerMultiplier - (1 + 1 + 0.5)) < 1e-12);
assert.ok(Math.abs(perkBonusesV1({ 133: 100 }).r3BarsMultiplier - 1.5) < 1e-12);
assert.ok(Math.abs(perkBonusesV1({ 108: 50, 155: 100 }).wishSpeedMultiplier - (1 + 0.1 + 0.1)) < 1e-12);
assert.equal(perkBonusesV1({ 109: 50, 110: 50 }).wishMinTimeReductionSeconds, 2400);
assert.deepEqual(perkBonusesV1({ 113: 2, 219: 3 }).hackMilestoneReduction, { adventureStats: 2, magicNguSpeed: 3 });
assert.equal(idlePerkByIdV1(144).bonus.augmentSpeedPct, 0.2);
assert.equal(idlePerkByIdV1(93).cost, 2500);
assert.equal(idlePerkByIdV1(228).cap, 100);

// Iron Pill : le gain est multiplié par le perk
{
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = 10000;
  s.systems.perks.data.levels[84] = 5;
  const r = applyIdleNguAction(s, { action: "castBloodSpell", spell: "ironPill" }, { bosses: 100 }, 2_000_000);
  assert.ok(Math.abs(r.state.systems.bloodMagic.data.spells.ironPill - Math.pow(10000, 0.25) * 26) < 1e-6);
}

// Respawn : facteurs multiplicatifs, plancher 0,34 s
{
  const s = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  s.systems.perks.data.levels[93] = 100;
  const red = idleNguBonuses(s).respawnReduction;
  assert.ok(Math.abs(red - 0.1) < 1e-9, "100 niveaux de SPAWN FASTER = -10 %");
}
// Quirks 18 (slot d'accessoire), 54 (temps minimum des Wishes), 90 (espaces d'inventaire)
{
  const q = quirkBonusesV1({ 18: 1, 54: 50, 90: 24 });
  assert.equal(q.accessorySlotBonus, 1);
  assert.equal(q.wishMinTimeReductionSeconds, 1200);
  assert.equal(q.inventorySlotBonus, 24);
  const st = normalizeIdleNguState({}, { bosses: 100 }, 1_000_000);
  st.systems.quirks.data = { levels: { 18: 1, 90: 24 } };
  const st2 = normalizeIdleNguState(st, { bosses: 100 }, 2_000_000);
  assert.equal(st2.adventure.bonusSlots.accessory, 1);
  assert.equal(st2.adventure.bonusSlots.inventory, 24);
}
// Souhaits à effet réel : 20 (rebirth), 61 (EXP), 79 (PPP ITOPOD), 109 (slot d'accessoire), 111 (vitesse NGU Energy)
{
  const ctx = { bosses: 100 };
  const base = normalizeIdleNguState({}, ctx, 1_000_000);
  const avecSouhaits = normalizeIdleNguState({}, ctx, 1_000_000);
  const niveau = (id, level) => { avecSouhaits.systems.wishes.data.tracks[String(id)].level = level; };
  niveau(20, 6); niveau(61, 10); niveau(109, 1);
  assert.ok(Math.abs(idleNguBonuses(avecSouhaits).xpMultiplier / idleNguBonuses(base).xpMultiplier - 1.05) < 1e-9, "Souhait 61 : +0,5 % d'EXP par niveau");
  const s2 = normalizeIdleNguState(avecSouhaits, ctx, 2_000_000);
  assert.equal(s2.adventure.bonusSlots.accessory, 1, "Souhait 109 : un slot d'accessoire");
  assert.equal(s2.rebirth.minimumRebirthSeconds, 120, "Souhait 20 : 6 niveaux = 60 s de moins sur les 180 s");
}
console.log("idle-perks-evil-systems ok");
