import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  rebirthIdleNguState,
  idleNguResourceBudget,
  idleNguEffectiveResourceStat
} from "../src/idle-ngu-progression.js";

/* Audit 2026-09-23 (ressources et systèmes de run) */
const ctx = { bosses: 100, basicTrainingComplete: true };
const fresh = () => normalizeIdleNguState({}, ctx, 0);

// --- Advanced Training : 10 000 s pour le niveau 1 (1000 de cap, 1 de puissance), temps linéaire par niveau ---
function at(track, seconds, alloc = 1000) {
  const s = fresh();
  s.systems.advancedTraining.unlocked = true;
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  s.resources.energy.power = 1;
  s.systems.advancedTraining.allocation.energy = alloc;
  s.systems.advancedTraining.data.activeTrack = track;
  const r = advanceIdleNguState(s, seconds, ctx, seconds * 1000);
  return r.systems.advancedTraining.data.tracks[track];
}
assert.equal(at("power", 9999).tempLevel, 0, "moins de 10 000 s : pas encore de niveau 1");
assert.equal(at("power", 10001).tempLevel, 1, "wiki : 10 000 s pour passer du niveau 0 au niveau 1");
assert.equal(at("wandoosEnergy", 19999).tempLevel, 0);
assert.equal(at("wandoosEnergy", 20001).tempLevel, 1, "wiki : 20 000 s pour les dumps Wandoos");
// 1 + 2 + 3 = 6 unités pour 3 niveaux : 60 000 s
assert.equal(at("power", 59999).tempLevel, 2);
assert.equal(at("power", 60001).tempLevel, 3, "chaque niveau demande linéairement plus de temps");
// racine carrée de la puissance : puissance x4 -> vitesse x2
{
  const s = fresh();
  s.systems.advancedTraining.unlocked = true;
  s.resources.energy.cap = 1000; s.resources.energy.current = 1000; s.resources.energy.power = 4;
  s.systems.advancedTraining.allocation.energy = 1000;
  s.systems.advancedTraining.data.activeTrack = "power";
  const r = advanceIdleNguState(s, 5001, ctx, 5_001_000);
  assert.equal(r.systems.advancedTraining.data.tracks.power.tempLevel, 1, "sqrt(4) = 2 : 5 000 s suffisent");
}

// --- Cap effectif : les bonus de cap comptent pour l'allocation et le budget ---
{
  const s = fresh();
  s.resources.energy.cap = 1000;
  s.resources.energy.current = 1000;
  s.systems.perks.data = { levels: { 6: 0 } };
  s.systems.quirks.data = { levels: { 1: 1 } }; // Baby's First Quirk: Energy Cap (+10 %)
  assert.ok(Math.abs(idleNguEffectiveResourceStat(s, "energy", "cap") - 1100) < 1e-9);
  assert.equal(idleNguResourceBudget(s, "energy", ctx).cap, 1100, "le budget affiche le cap effectif");
}

// --- Resource 3 : générée une fois les Hacks débloqués ---
{
  const s = fresh();
  s.systems.hacks.unlocked = true;
  s.resources.r3.current = 0;
  s.resources.r3.cap = 100;
  s.resources.r3.bars = 5;
  const r = advanceIdleNguState(s, 60, ctx, 60_000);
  assert.ok(r.resources.r3.current > 0, "R3 se génère");
  const sans = fresh();
  const r2 = advanceIdleNguState(sans, 60, ctx, 60_000);
  assert.equal(r2.resources.r3.current, 0, "rien tant que les Hacks sont verrouillés");
}

// --- Rebirth : allocations Hacks/Wishes rendues, diggers désactivés ---
{
  const s = fresh();
  s.systems.hacks.allocation = { energy: 0, magic: 0, r3: 50 };
  s.systems.wishes.allocation = { energy: 77, magic: 0, r3: 0 };
  s.systems.diggers.unlocked = true;
  s.systems.diggers.data.diggers.drop.maxLevel = 10;
  s.systems.diggers.data.diggers.drop.runLevel = 10;
  s.systems.diggers.data.diggers.drop.active = true;
  const reborn = rebirthIdleNguState(s, ctx, 10_000_000);
  assert.equal(reborn.systems.hacks.allocation.r3, 0);
  assert.equal(reborn.systems.wishes.allocation.energy, 0);
  assert.equal(reborn.systems.diggers.data.diggers.drop.active, false, "wiki Rebirths : les diggers activés sont réinitialisés");
}

// --- Iron Pill : recharge 11,5 h (Normal) ---
{
  let s = fresh();
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = 10000;
  s = applyIdleNguAction(s, { action: "castBloodSpell", spell: "ironPill" }, ctx, 1_000_000).state;
  s.currencies.blood = 10000;
  assert.throws(() => applyIdleNguAction(s, { action: "castBloodSpell", spell: "ironPill" }, ctx, 1_000_000 + 11 * 3600000), /SORT_EN_RECHARGE/);
  const ok = applyIdleNguAction(s, { action: "castBloodSpell", spell: "ironPill" }, ctx, 1_000_000 + 11.6 * 3600000);
  assert.ok(ok.state.systems.bloodMagic.data.spells.ironPill > 10);
}

console.log("idle-resources-at-r3-rebirth: OK");
