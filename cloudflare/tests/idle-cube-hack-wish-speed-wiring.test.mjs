import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { IDLE_ADVENTURE_CUBE_TIERS_V1 } from "../src/idle-adventure-v47.js";

/*
 * Infinity Cube tiers 8-10 (IDLE_ADVENTURE_CUBE_TIERS_V1, idle-adventure-
 * v47.js, page wiki "Infinity Cube" -- 11/11 tiers vérifiés exacts) portent
 * hackSpeedPct/wishSpeedPct en plus de dropChancePct/goldDropsPct, mais
 * jusqu'à ce correctif (2026-09-18) ils n'étaient mergés nulle part dans
 * idle-ngu-progression.js : dropChancePct rejoignait déjà specials.dropChancePct
 * (consommé par dropMultiplier), goldDropsPct est appliqué directement au
 * point de génération d'or (idle-adventure-v47.js), mais hackSpeedPct/
 * wishSpeedPct restaient de purs champs de données jamais lus par
 * advanceHackTrack/advanceWishTrack.
 *
 * Tier 10 (seuil 1e11 de Power+Toughness cumulés du cube) : hackSpeedPct=20,
 * wishSpeedPct=20 (wiki) -> multiplicateur 1.20 pour chacun.
 */

// --- Sanity : le tier 10 du catalogue porte bien les valeurs wiki attendues ---
{
  const tier10 = IDLE_ADVENTURE_CUBE_TIERS_V1[10];
  assert.equal(tier10.seuil, 100000000000);
  assert.equal(tier10.hackSpeedPct, 20);
  assert.equal(tier10.wishSpeedPct, 20);
}

function stateWithCubeTier10(context, unlockedSystem) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.adventure.cube.power = 1e11; // seuil exact du tier 10
  state.adventure.cube.toughness = 0;
  state.systems[unlockedSystem].unlocked = true;
  return state;
}

// --- idleNguBonuses().hackSpeedMultiplier / wishSpeedMultiplier reflètent bien le cube ---
{
  const state = stateWithCubeTier10({ bosses: 200 }, "hacks");
  const bonuses = idleNguBonuses(state);
  assert.ok(
    Math.abs(bonuses.hackSpeedMultiplier - 1.2) < 1e-9,
    `hackSpeedMultiplier doit inclure le tier 10 du cube (+20%) -- mesuré : ${bonuses.hackSpeedMultiplier}.`
  );
  assert.ok(
    Math.abs(bonuses.wishSpeedMultiplier - 1.2) < 1e-9,
    `wishSpeedMultiplier doit inclure le tier 10 du cube (+20%) -- mesuré : ${bonuses.wishSpeedMultiplier}.`
  );
}

// --- advanceHackTrack lit réellement hackSpeedMultiplier (throughput r3, jamais lu avant ce correctif) ---
{
  const context = { bosses: 200 };
  function hackState(withCube) {
    let state = normalizeIdleNguState({}, context, 1_000_000);
    state.systems.hacks.unlocked = true;
    state.systems.hacks.data.activeTrack = "attackDefense";
    state.systems.hacks.allocation.r3 = 10;
    if (withCube) { state.adventure.cube.power = 1e11; state.adventure.cube.toughness = 0; }
    return state;
  }
  const without = advanceIdleNguState(hackState(false), 1000, context, 1_001_000);
  const withCube = advanceIdleNguState(hackState(true), 1000, context, 1_001_000);
  const progWithout = without.systems.hacks.data.tracks.attackDefense.progress;
  const progWith = withCube.systems.hacks.data.tracks.attackDefense.progress;
  assert.equal(without.systems.hacks.data.tracks.attackDefense.level, 0, "sanity : pas de passage de niveau (sans cube).");
  assert.equal(withCube.systems.hacks.data.tracks.attackDefense.level, 0, "sanity : pas de passage de niveau (avec cube).");
  assert.ok(progWithout > 0 && progWith > 0, "sanity : le Hack doit progresser dans les deux cas.");
  assert.ok(
    Math.abs(progWith / progWithout - 1.2) < 1e-6,
    `Le tier 10 du cube (hackSpeedPct=20%) doit accélérer le Hack "Attack/Defense" par exactement 1.2x -- mesuré : ${progWith / progWithout}.`
  );
}

// --- advanceWishTrack fusionne aussi le cube (en plus de wishBonusesV1) sans dépendre de tout idleNguBonuses() ---
{
  const context = { bosses: 200 };
  function wishState(withCube) {
    let state = normalizeIdleNguState({}, context, 1_000_000);
    state.systems.wishes.unlocked = true;
    state.systems.wishes.data.activeTrack = "1"; // wish id 1, "I Wish that wishes weren't so slow :c" -- speedDivider 1e15, 10 niveaux
    state.systems.wishes.allocation = { energy: 1, magic: 1, r3: 1 };
    if (withCube) { state.adventure.cube.power = 1e11; state.adventure.cube.toughness = 0; }
    return state;
  }
  const without = advanceIdleNguState(wishState(false), 1000, context, 1_001_000);
  const withCube = advanceIdleNguState(wishState(true), 1000, context, 1_001_000);
  const progWithout = without.systems.wishes.data.tracks["1"].progress;
  const progWith = withCube.systems.wishes.data.tracks["1"].progress;
  assert.equal(without.systems.wishes.data.tracks["1"].level, 0, "sanity : pas de passage de niveau (sans cube).");
  assert.equal(withCube.systems.wishes.data.tracks["1"].level, 0, "sanity : pas de passage de niveau (avec cube).");
  assert.ok(progWithout > 0 && progWith > 0, "sanity : le Wish doit progresser dans les deux cas (loin sous le plancher de 4h avec ces allocations minimales).");
  assert.ok(
    Math.abs(progWith / progWithout - 1.2) < 1e-6,
    `Le tier 10 du cube (wishSpeedPct=20%) doit accélérer le Wish id 1 par exactement 1.2x -- mesuré : ${progWith / progWithout}.`
  );
}

console.log("idle-cube-hack-wish-speed-wiring: OK");
