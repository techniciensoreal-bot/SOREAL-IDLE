import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import { IDLE_WISHES_CATALOG_V1 } from "../src/idle-wishes-v1.js";

/*
 * Slots de souhaits -- formule par slot (page "Wishes", "Important Math") :
 * (EngPower x EngAlloc x MagPower x MagAlloc x R3Power x R3Alloc)^0.17 /
 * (SpeedDivider x (level+1)), plancher de 4 h par niveau. Chaque slot
 * applique cette formule avec SA propre allocation ; les multiplicateurs de
 * vitesse sont partagés.
 */
const ctx = { bosses: 300 };
const near = (a, b, msg, eps = 1e-9) => assert.ok(Math.abs(a / b - 1) < eps, `${msg} (obtenu ${a}, attendu ${b})`);
const act = (s, payload) => applyIdleNguAction(s, payload, ctx, 1_000_000).state;

function base({ slots = 2, power = 1, stock = 1e6 } = {}) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.wishes.unlocked = true;
  s.systems.hacks.unlocked = true;
  s.systems.bloodMagic.unlocked = true;
  for (const k of ["energy", "magic", "r3"]) {
    s.resources[k].power = power;
    s.resources[k].cap = stock;
    s.resources[k].current = stock;
  }
  /* Slot supplémentaire par la quirk 56 (le détail des sources est testé ailleurs). */
  if (slots >= 2) s.systems.quirks.data.levels = { 56: 1 };
  return s;
}
function allouer(s, slot, e, m, r) {
  s = act(s, { action: "allocateWishSlot", slot, resource: "energy", value: e });
  s = act(s, { action: "allocateWishSlot", slot, resource: "magic", value: m });
  return act(s, { action: "allocateWishSlot", slot, resource: "r3", value: r });
}
const def = (id) => IDLE_WISHES_CATALOG_V1.find(w => w.id === id);
function secondesAttendues(id, level, e, m, r, power, params) {
  const brut = def(id).speedDivider * (level + 1) / Math.pow(power ** 3 * e * m * r, 0.17) / params.speedMultiplier;
  return Math.max(params.minSecondsPerLevel, brut);
}

// --- Deux slots, deux souhaits, deux allocations : chacun suit la formule avec SA propre allocation ---
{
  let s = base();
  s = act(s, { action: "setWishSlot", slot: 0, wish: "1" });
  s = act(s, { action: "setWishSlot", slot: 1, wish: "5" });
  s = allouer(s, 0, 100, 100, 100);
  s = allouer(s, 1, 400, 200, 50);
  const params = idleNguSnapshot(s, ctx, 1_000_000).wishSlots;
  assert.equal(params.slotCount, 2);
  const apres = advanceIdleNguState(s, 1000, ctx, 1_001_000);
  const t = apres.systems.wishes.data.tracks;
  near(t["1"].progress, 1000 / secondesAttendues(1, 0, 100, 100, 100, 1, params), "slot 1 : formule du wiki avec son allocation");
  near(t["5"].progress, 1000 / secondesAttendues(5, 0, 400, 200, 50, 1, params), "slot 2 : formule du wiki avec son allocation");

  // Indépendance : le slot 1 progresse exactement comme s'il était seul.
  let seul = base();
  seul = act(seul, { action: "setWishSlot", slot: 0, wish: "1" });
  seul = allouer(seul, 0, 100, 100, 100);
  const seulApres = advanceIdleNguState(seul, 1000, ctx, 1_001_000);
  near(seulApres.systems.wishes.data.tracks["1"].progress, t["1"].progress, "le second slot ne ralentit pas le premier");

  // Snapshot : durée du niveau en cours par slot.
  const snap = idleNguSnapshot(s, ctx, 1_000_000).wishSlots;
  near(snap.slots[0].secondsPerLevel, secondesAttendues(1, 0, 100, 100, 100, 1, params), "snapshot slot 1");
  near(snap.slots[1].secondsPerLevel, secondesAttendues(5, 0, 400, 200, 50, 1, params), "snapshot slot 2");
  assert.equal(snap.slots[2].unlocked, false);
  assert.equal(snap.slots[2].secondsPerLevel, null);
}

// --- Répartir est plus efficace (exposant 0,17) : 2 x 100 contre 1 x 200 ---
{
  let un = base();
  un = act(un, { action: "setWishSlot", slot: 0, wish: "1" });
  un = allouer(un, 0, 200, 200, 200);
  let deux = base();
  deux = act(deux, { action: "setWishSlot", slot: 0, wish: "1" });
  deux = act(deux, { action: "setWishSlot", slot: 1, wish: "21" });
  deux = allouer(deux, 0, 100, 100, 100);
  deux = allouer(deux, 1, 100, 100, 100);
  const a = advanceIdleNguState(un, 1000, ctx, 1_001_000).systems.wishes.data.tracks;
  const b = advanceIdleNguState(deux, 1000, ctx, 1_001_000).systems.wishes.data.tracks;
  // Travail total en unités de "SpeedDivider x niveau" : progression x diviseur.
  const travailUn = a["1"].progress * def(1).speedDivider;
  const travailDeux = b["1"].progress * def(1).speedDivider + b["21"].progress * def(21).speedDivider;
  near(travailDeux / travailUn, 2 / Math.pow(8, 0.17), "rapport 2 / 8^0,17 entre répartir et concentrer");
  assert.ok(travailDeux > travailUn * 1.4, "répartir sur deux souhaits est bien plus efficace");
}

// --- Plancher de 4 h par niveau, appliqué slot par slot ---
{
  let s = base({ power: 1e18, stock: 1e12 });
  s = act(s, { action: "setWishSlot", slot: 0, wish: "1" });
  s = act(s, { action: "setWishSlot", slot: 1, wish: "9" });
  s = allouer(s, 0, 1e10, 1e10, 1e10);
  s = allouer(s, 1, 1e10, 1e10, 1e10);
  const snap = idleNguSnapshot(s, ctx, 1_000_000).wishSlots;
  assert.equal(snap.minSecondsPerLevel, 4 * 3600, "4 h sans perk ni quirk de réduction");
  assert.equal(snap.slots[0].secondsPerLevel, 4 * 3600);
  assert.equal(snap.slots[1].secondsPerLevel, 4 * 3600);
  const apres = advanceIdleNguState(s, 2.5 * 4 * 3600, ctx, 1_000_000 + 36_000_000);
  for (const id of ["1", "9"]) {
    assert.equal(apres.systems.wishes.data.tracks[id].level, 2, `souhait ${id} : 2 niveaux en 10 h`);
    near(apres.systems.wishes.data.tracks[id].progress, 0.5, `souhait ${id} : moitié du 3e niveau`);
  }
}

// --- Il faut les trois ressources sur le slot ; un slot vide ne fait rien ---
{
  let s = base();
  s = act(s, { action: "setWishSlot", slot: 0, wish: "1" });
  s = act(s, { action: "setWishSlot", slot: 1, wish: "" });
  s = allouer(s, 0, 100, 100, 0);
  s = allouer(s, 1, 100, 100, 100);
  const apres = advanceIdleNguState(s, 1000, ctx, 1_001_000);
  assert.equal(apres.systems.wishes.data.tracks["1"].progress, 0, "pas de R3 sur le slot 1 : aucune progression");
  assert.equal(apres.systems.wishes.level, 0);
}

console.log("idle-wish-slots-formula: OK");
