import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import { idleQuirkByIdV1, quirkBonusesV1 } from "../src/idle-quirks-v1.js";

/*
 * Slots de souhaits -- sources (page "Wishes") : "You can get 4 wish slots:
 * 1 to start with, 1 from evil mode Troll Challenge 7, 1 from maxing My Pink
 * Heart, 1 from Quirks".
 */
const ctx = { bosses: 300 };
const act = (s, payload) => applyIdleNguAction(s, payload, ctx, 1_000_000).state;
const slots = (s) => idleNguSnapshot(s, ctx, 1_000_000).wishSlots;

function base() {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.wishes.unlocked = true;
  s.systems.hacks.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  for (const k of ["energy", "magic", "r3"]) {
    s.resources[k].cap = 1000;
    s.resources[k].current = 1000;
  }
  return s;
}

// --- Quirk 56 : valeurs de la page Quirk Points ---
{
  const q = idleQuirkByIdV1(56);
  assert.equal(q.name, "A Wish Slot!");
  assert.equal(q.cost, 50000);
  assert.equal(q.cap, 1);
  assert.equal(quirkBonusesV1({ 56: 1 }).wishSlotBonus, 1);
  assert.equal(quirkBonusesV1({}).wishSlotBonus, 0);
}

// --- 1 slot au départ ---
{
  const w = slots(base());
  assert.equal(w.maxSlots, 4);
  assert.equal(w.slotCount, 1);
  assert.deepEqual(w.sources, { base: 1, trollEvil: 0, pinkHeart: 0, quirk: 0 });
  assert.deepEqual(w.slots.map(x => x.unlocked), [true, false, false, false]);
}

// --- Troll Challenge Evil : la 7e complétion, pas avant ; Normal/Sadistic ne comptent pas ---
{
  const s = base();
  s.challenge.completionsTier.difficile.troll = 6;
  s.challenge.completions.troll = 7;
  s.challenge.completionsTier.extreme.troll = 7;
  assert.equal(slots(s).slotCount, 1, "Troll Evil 6, Normal 7, Sadistic 7 : aucun slot");
  s.challenge.completionsTier.difficile.troll = 7;
  assert.equal(slots(s).sources.trollEvil, 1);
  assert.equal(slots(s).slotCount, 2);
}

// --- My Pink Heart au niveau 100 (set complété), pas au niveau 99 ---
{
  const ajouter = (level) => act(base(), { action: "adventure", adventure: { action: "addItem", definitionId: "heartPink", level } });
  assert.equal(slots(ajouter(99)).slotCount, 1, "cœur rose niveau 99 : pas de slot");
  const s = ajouter(100);
  assert.equal(s.adventure.completedSets.heartPink, true);
  assert.equal(slots(s).sources.pinkHeart, 1);
  assert.equal(slots(s).slotCount, 2);
}

// --- Quirk 56 achetée avec des QP ---
{
  let s = base();
  s.systems.quirks.unlocked = true;
  s.currencies.qp = 49999;
  assert.throws(() => act(s, { action: "buyQuirk", quirkId: 56 }), /MONNAIE_INSUFFISANTE/);
  s.currencies.qp = 50000;
  s = act(s, { action: "buyQuirk", quirkId: 56 });
  assert.equal(s.currencies.qp, 0);
  assert.equal(slots(s).sources.quirk, 1);
  assert.equal(slots(s).slotCount, 2);
  assert.throws(() => act(s, { action: "buyQuirk", quirkId: 56 }), /QUIRK_AU_MAXIMUM/);
}

// --- Les quatre sources : 4 slots ---
{
  let s = act(base(), { action: "adventure", adventure: { action: "addItem", definitionId: "heartPink", level: 100 } });
  s.challenge.completionsTier.difficile.troll = 7;
  s.systems.quirks.data.levels = { 56: 1 };
  const w = slots(s);
  assert.equal(w.slotCount, 4);
  assert.deepEqual(w.slots.map(x => x.unlocked), [true, true, true, true]);
  s = act(s, { action: "setWishSlot", slot: 3, wish: "7" });
  assert.equal(s.systems.wishes.data.slots[3].wish, "7");
}

// --- Slots verrouillés / invalides, souhaits en double ou terminés ---
{
  let s = base();
  assert.throws(() => act(s, { action: "setWishSlot", slot: 1, wish: "5" }), /SLOT_SOUHAIT_VERROUILLE/);
  assert.throws(() => act(s, { action: "allocateWishSlot", slot: 1, resource: "energy", value: 1 }), /SLOT_SOUHAIT_VERROUILLE/);
  assert.throws(() => act(s, { action: "setWishSlot", slot: 4, wish: "5" }), /SLOT_SOUHAIT_INVALIDE/);
  assert.throws(() => act(s, { action: "setWishSlot", slot: -1, wish: "5" }), /SLOT_SOUHAIT_INVALIDE/);
  assert.throws(() => act(s, { action: "setWishSlot", slot: 0, wish: "999" }), (e) => e.message === "SOUHAIT_INVALIDE");
  s.systems.quirks.data.levels = { 56: 1 };
  s = act(s, { action: "setWishSlot", slot: 0, wish: "5" });
  assert.throws(() => act(s, { action: "setWishSlot", slot: 1, wish: "5" }), /SOUHAIT_DEJA_DANS_UN_SLOT/);
  s.systems.wishes.data.tracks["0"].level = 1; // souhait 0 : 1 niveau
  assert.throws(() => act(s, { action: "setWishSlot", slot: 1, wish: "0" }), /SOUHAIT_TERMINE/);
  const verrouille = normalizeIdleNguState({}, ctx, 1_000_000);
  assert.throws(() => act(verrouille, { action: "setWishSlot", slot: 0, wish: "5" }), /SYSTEME_VERROUILLE/);
}

// --- Un slot qui n'est plus débloqué rend ses ressources et ne progresse pas ---
{
  let s = base();
  s.systems.quirks.data.levels = { 56: 1 };
  s = act(s, { action: "setWishSlot", slot: 1, wish: "9" });
  for (const k of ["energy", "magic", "r3"]) s = act(s, { action: "allocateWishSlot", slot: 1, resource: k, value: 100 });
  assert.equal(s.resources.energy.current, 900);
  s.systems.quirks.data.levels = {};
  const apres = advanceIdleNguState(s, 1000, ctx, 1_001_000);
  const w = apres.systems.wishes;
  assert.deepEqual(w.data.slots[1].allocation, { energy: 0, magic: 0, r3: 0 });
  assert.deepEqual(w.allocation, { energy: 0, magic: 0, r3: 0 });
  assert.equal(w.data.tracks["9"].progress, 0);
  assert.ok(apres.resources.energy.current >= 1000 - 1e-9, "énergie rendue");
}

console.log("idle-wish-slots-sources: OK");
