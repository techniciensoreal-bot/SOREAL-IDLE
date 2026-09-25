import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  rebirthIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * Slots de souhaits -- migration des sauvegardes : l'ancien souhait actif
 * (data.activeTrack) et l'ancienne allocation partagée (system.allocation)
 * deviennent le slot 1 ; system.allocation reste la somme des slots.
 */
const ctx = { bosses: 300 };
const act = (s, payload) => applyIdleNguAction(s, payload, ctx, 1_000_000).state;
const zero = { energy: 0, magic: 0, r3: 0 };

function base() {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 1_000_000);
  s.systems.wishes.unlocked = true;
  s.systems.hacks.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  for (const k of ["energy", "magic", "r3"]) {
    s.resources[k].cap = 1000;
    s.resources[k].current = 1000;
  }
  return s;
}

// --- Nouvelle partie : 4 slots, le slot 1 porte le souhait par défaut, rien d'alloué ---
{
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 1_000_000);
  const slots = s.systems.wishes.data.slots;
  assert.equal(slots.length, 4);
  assert.equal(slots[0].wish, s.systems.wishes.data.activeTrack);
  assert.deepEqual(slots.map(x => x.allocation), [zero, zero, zero, zero]);
}

// --- Ancienne sauvegarde (sans slots) : activeTrack + allocation -> slot 1 ---
{
  const ancienne = JSON.parse(JSON.stringify(base()));
  delete ancienne.systems.wishes.data.slots;
  ancienne.systems.wishes.data.activeTrack = "5";
  ancienne.systems.wishes.allocation = { energy: 30, magic: 20, r3: 10 };
  ancienne.systems.wishes.data.tracks["5"].progress = 0.25;
  const s = normalizeIdleNguState(ancienne, ctx, 1_000_000);
  const w = s.systems.wishes;
  assert.equal(w.data.slots[0].wish, "5");
  assert.deepEqual(w.data.slots[0].allocation, { energy: 30, magic: 20, r3: 10 });
  assert.deepEqual(w.data.slots.slice(1).map(x => x.wish), ["", "", ""]);
  assert.deepEqual(w.data.slots.slice(1).map(x => x.allocation), [zero, zero, zero]);
  assert.deepEqual(w.allocation, { energy: 30, magic: 20, r3: 10 }, "la quantité allouée ne change pas");
  assert.equal(w.data.tracks["5"].progress, 0.25, "progression conservée");
  // Idempotent.
  assert.deepEqual(normalizeIdleNguState(s, ctx, 1_000_000).systems.wishes.data.slots, w.data.slots);
  // Le souhait migré continue de progresser avec l'ancienne allocation.
  const apres = advanceIdleNguState(s, 1000, ctx, 1_001_000);
  assert.ok(apres.systems.wishes.data.tracks["5"].progress > 0.25);
}

// --- Code qui n'écrit que les anciens champs : répercuté sur le slot 1 ---
{
  let s = base();
  s.systems.quirks.data.levels = { 56: 1 };
  s = act(s, { action: "setWishSlot", slot: 1, wish: "9" });
  s = act(s, { action: "allocateWishSlot", slot: 1, resource: "energy", value: 40 });
  s.systems.wishes.data.activeTrack = "1";
  s.systems.wishes.allocation = { energy: 50, magic: 1, r3: 1 };
  let n = normalizeIdleNguState(s, ctx, 1_000_000).systems.wishes;
  assert.equal(n.data.slots[0].wish, "1");
  assert.deepEqual(n.data.slots[0].allocation, { energy: 10, magic: 1, r3: 1 }, "slot 1 = total - autres slots");
  assert.equal(n.data.slots[1].allocation.energy, 40);

  // Total inférieur aux autres slots : tout va au slot 1, rien n'est créé ni perdu.
  s.systems.wishes.allocation = { energy: 25, magic: 0, r3: 0 };
  n = normalizeIdleNguState(s, ctx, 1_000_000).systems.wishes;
  assert.equal(n.data.slots[0].allocation.energy, 25);
  assert.equal(n.data.slots[1].allocation.energy, 0);
  assert.equal(n.allocation.energy, 25);

  // Même souhait choisi via l'ancien champ : l'autre slot est libéré (jamais deux fois le même souhait).
  s.systems.wishes.data.activeTrack = "9";
  n = normalizeIdleNguState(s, ctx, 1_000_000).systems.wishes;
  assert.equal(n.data.slots[0].wish, "9");
  assert.equal(n.data.slots[1].wish, "");
}

// --- Anciennes actions (allocate / selectTrack sur "wishes") : slot 1 ---
{
  let s = base();
  s = act(s, { action: "selectTrack", system: "wishes", track: "12" });
  s = act(s, { action: "allocate", system: "wishes", resource: "magic", value: 70 });
  const w = s.systems.wishes;
  assert.equal(w.data.slots[0].wish, "12");
  assert.equal(w.data.activeTrack, "12");
  assert.equal(w.data.slots[0].allocation.magic, 70);
  assert.equal(w.allocation.magic, 70);
  assert.equal(s.resources.magic.current, 930);
}

// --- Slot 1 vidé volontairement : reste vide après normalisation ---
{
  let s = base();
  s = act(s, { action: "setWishSlot", slot: 0, wish: "" });
  const n = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), ctx, 1_000_000).systems.wishes;
  assert.equal(n.data.slots[0].wish, "");
  assert.equal(n.data.activeTrack, "");
}

// --- Rebirth : ressources allouées perdues sur tous les slots, souhaits conservés ---
{
  let s = base();
  s.systems.quirks.data.levels = { 56: 1 };
  s = act(s, { action: "setWishSlot", slot: 0, wish: "1" });
  s = act(s, { action: "setWishSlot", slot: 1, wish: "9" });
  s = act(s, { action: "allocateWishSlot", slot: 0, resource: "energy", value: 100 });
  s = act(s, { action: "allocateWishSlot", slot: 1, resource: "r3", value: 100 });
  const reborn = rebirthIdleNguState(s, ctx, 10_000_000);
  const w = reborn.systems.wishes;
  assert.deepEqual(w.allocation, zero);
  assert.deepEqual(w.data.slots.map(x => x.allocation), [zero, zero, zero, zero]);
  assert.deepEqual(w.data.slots.slice(0, 2).map(x => x.wish), ["1", "9"]);
}

// --- Récupérer l'énergie : vide l'énergie de chaque slot et la rend ---
{
  let s = base();
  s.systems.quirks.data.levels = { 56: 1 };
  s = act(s, { action: "setWishSlot", slot: 1, wish: "9" });
  s = act(s, { action: "allocateWishSlot", slot: 0, resource: "energy", value: 100 });
  s = act(s, { action: "allocateWishSlot", slot: 1, resource: "energy", value: 50 });
  s = act(s, { action: "allocateWishSlot", slot: 1, resource: "magic", value: 5 });
  assert.equal(s.resources.energy.current, 850);
  s = act(s, { action: "reclaimResource", resource: "energy" });
  const w = s.systems.wishes;
  assert.deepEqual(w.data.slots.map(x => x.allocation.energy), [0, 0, 0, 0]);
  assert.equal(w.data.slots[1].allocation.magic, 5, "la magie n'est pas touchée");
  assert.equal(w.allocation.energy, 0);
  assert.equal(s.resources.energy.current, 1000);
}

console.log("idle-wish-slots-migration: OK");
