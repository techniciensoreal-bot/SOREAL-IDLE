import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguResourceBudget,
  idleNguEffectiveResourceStat
} from "../src/idle-ngu-progression.js";

/*
 * Slots de souhaits -- limites d'allocation : chaque slot a sa propre
 * allocation Energy/Magic/R3, jamais au-delà du cap effectif moins ce qui
 * est alloué ailleurs (autres systèmes, autres slots), ni au-delà de ce que
 * le joueur possède (current + déjà alloué sur ce slot).
 */
const ctx = { bosses: 300 };
const act = (s, payload, context = ctx) => applyIdleNguAction(s, payload, context, 1_000_000).state;

function base() {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.wishes.unlocked = true;
  s.systems.hacks.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  s.systems.advancedTraining.unlocked = true;
  s.systems.quirks.data.levels = { 56: 1 };
  s.challenge.completionsTier.difficile.troll = 7;
  for (const k of ["energy", "magic", "r3"]) {
    s.resources[k].cap = 1000;
    s.resources[k].current = 1000;
  }
  return s;
}
const cap = (s, k) => idleNguEffectiveResourceStat(s, k, "cap");

// --- Deux slots se partagent le cap ; le second ne reçoit que le reste ---
{
  let s = base();
  const c = cap(s, "energy");
  s = act(s, { action: "allocateWishSlot", slot: 0, resource: "energy", value: c * 0.6 });
  s = act(s, { action: "allocateWishSlot", slot: 1, resource: "energy", value: c });
  const w = s.systems.wishes;
  assert.ok(Math.abs(w.data.slots[0].allocation.energy - c * 0.6) < 1e-9);
  assert.ok(Math.abs(w.data.slots[1].allocation.energy - c * 0.4) < 1e-9, "le slot 2 est plafonné au reste du cap");
  assert.ok(Math.abs(w.allocation.energy - c) < 1e-9, "allocation du système = somme des slots");
  assert.ok(Math.abs(s.resources.energy.current) < 1e-9);
  const budget = idleNguResourceBudget(s, "energy", ctx);
  assert.ok(Math.abs(budget.allocated - c) < 1e-9, "le budget compte tous les slots");
}

// --- Les autres systèmes et les réservations externes réduisent le plafond ---
{
  let s = base();
  s = act(s, { action: "allocate", system: "advancedTraining", resource: "energy", value: 300 });
  s = act(s, { action: "allocateWishSlot", slot: 2, resource: "energy", value: 1e9 });
  assert.equal(s.systems.wishes.data.slots[2].allocation.energy, 700, "cap 1000 - 300 (Advanced Training)");
  let t = base();
  t = act(t, { action: "allocateWishSlot", slot: 0, resource: "energy", value: 1e9 }, { ...ctx, basicTrainingEnergyAllocation: 250 });
  assert.equal(t.systems.wishes.data.slots[0].allocation.energy, 750, "réservation Basic Training déduite");
}

// --- Jamais plus que ce que le joueur possède ---
{
  let s = base();
  s.resources.magic.current = 120;
  s = act(s, { action: "allocateWishSlot", slot: 0, resource: "magic", value: 500 });
  assert.equal(s.systems.wishes.data.slots[0].allocation.magic, 120);
  assert.equal(s.resources.magic.current, 0);
  // Les deux slots réunis ne dépassent pas ce qui était possédé.
  s = act(s, { action: "allocateWishSlot", slot: 1, resource: "magic", value: 500 });
  assert.equal(s.systems.wishes.data.slots[1].allocation.magic, 0);
}

// --- Réduire l'allocation rend la ressource ; valeurs négatives ramenées à 0 ---
{
  let s = base();
  s = act(s, { action: "allocateWishSlot", slot: 2, resource: "r3", value: 400 });
  assert.equal(s.resources.r3.current, 600);
  s = act(s, { action: "allocateWishSlot", slot: 2, resource: "r3", value: 150 });
  assert.equal(s.resources.r3.current, 850);
  s = act(s, { action: "allocateWishSlot", slot: 2, resource: "r3", value: -50 });
  assert.equal(s.systems.wishes.data.slots[2].allocation.r3, 0);
  assert.equal(s.resources.r3.current, 1000);
}

// --- Ressources verrouillées / invalides ---
{
  const s = base();
  s.systems.bloodMagic.unlocked = false;
  assert.throws(() => act(s, { action: "allocateWishSlot", slot: 0, resource: "magic", value: 1 }, { bosses: 0 }), /MAGIC_VERROUILLEE/);
  const t = base();
  t.systems.hacks.unlocked = false;
  assert.throws(() => act(t, { action: "allocateWishSlot", slot: 0, resource: "r3", value: 1 }, { bosses: 0 }), /R3_VERROUILLEE/);
  assert.throws(() => act(base(), { action: "allocateWishSlot", slot: 0, resource: "gold", value: 1 }), /RESSOURCE_INVALIDE/);
}

console.log("idle-wish-slots-allocation: OK");
