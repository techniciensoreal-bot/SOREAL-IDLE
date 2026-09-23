import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  rebirthIdleNguState,
  idleNguBonuses,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Audit NGU 2026-09-23 : moteur des 16 vrais NGU -- allocation propre à chaque
 * NGU, progression parallèle, paliers Evil/Sadistic, quirks "Beast NGU",
 * effets réellement lus par les calculs du jeu.
 */

const context = { bosses: 100, bestGold: 1e6, adventurePower: 1e9 };

function unlocked(mutate) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.adventure.unlockItems.aNumber = true;
  state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
  state.systems.bloodMagic.unlocked = true;
  state.resources.energy.cap = 1000;
  state.resources.energy.current = 1000;
  state.resources.energy.power = 1e9;
  state.resources.magic.cap = 1000;
  state.resources.magic.current = 1000;
  state.resources.magic.power = 1e9;
  if (mutate) mutate(state);
  return state;
}
const act = (state, payload) => applyIdleNguAction(state, payload, context, 1_000_000).state;
const ngu = (state, tier, id) => state.systems.ngu.data.ngus[tier][id];

// --- Chaque NGU a sa propre allocation, plafonnée par le cap total ---
{
  let s = unlocked();
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 600 });
  s = act(s, { action: "allocateNgu", ngu: "gold", value: 600 });
  assert.equal(ngu(s, "normal", "powerAlpha").allocation, 600);
  assert.equal(ngu(s, "normal", "gold").allocation, 400, "le 2e NGU ne reçoit que le reste du cap (1000 - 600)");
  assert.equal(s.systems.ngu.allocation.energy, 1000, "le total alloué est exposé aux autres systèmes");
  assert.equal(s.resources.energy.current, 0);
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 0 });
  assert.equal(s.resources.energy.current, 600, "l'énergie retirée est rendue");
}

// --- Les NGU progressent en parallèle et indépendamment ---
{
  let s = unlocked();
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 500 });
  s = act(s, { action: "allocateNgu", ngu: "gold", value: 500 });
  s = advanceIdleNguState(s, 3600, context, 4_600_000);
  // 500 x 1e9 x 3600 / 2e11 = 9000 unités de travail -> 133 niveaux (cumul 1+2+...+n)
  const n = ngu(s, "normal", "powerAlpha").level;
  assert.equal(n, 133);
  assert.equal(ngu(s, "normal", "gold").level, 133, "Gold et Power α ont le même coût de base (2e11)");
  assert.ok(idleNguBonuses(s).attackMultiplier > 1, "Power α augmente l'Attack");
  assert.ok(Math.abs(idleNguBonuses(s).nguEffects.attackDefense - (1 + 133 * 5 / 100)) < 1e-9, "Power α : 5 % par niveau");
  assert.ok(Math.abs(idleNguBonuses(s).adventureGoldMultiplier / 1 - (1 + 133 * 1 / 100)) < 1e-9 || idleNguBonuses(s).adventureGoldMultiplier > 1);
}

// --- NGU Magic : nécessitent la Magic débloquée ---
{
  let s = unlocked((st) => { st.systems.bloodMagic.unlocked = false; });
  assert.throws(
    () => applyIdleNguAction(s, { action: "allocateNgu", ngu: "powerBeta", value: 10 }, { bosses: 30 }, 1_000_000),
    /MAGIC_VERROUILLEE/,
    "avant le boss 37, la Magic n'est pas débloquée"
  );
  s = unlocked();
  s = act(s, { action: "allocateNgu", ngu: "powerBeta", value: 500 });
  s = advanceIdleNguState(s, 3600, context, 4_600_000);
  // coût de base 4e12 : 500 x 1e9 x 3600 / 4e12 = 450 unités -> 29 niveaux (1+...+29 = 435)
  assert.equal(ngu(s, "normal", "powerBeta").level, 29);
}

// --- Paliers : Evil n'existe qu'en difficulté Evil, un seul palier alloué à la fois ---
{
  let s = unlocked();
  assert.throws(() => act(s, { action: "setNguTier", tier: "evil" }), /PALIER_NGU_VERROUILLE/);
  s = unlocked((st) => { st.difficulty = "difficile"; });
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 300 });
  assert.equal(s.resources.energy.current, 700);
  s = act(s, { action: "setNguTier", tier: "evil" });
  assert.equal(s.systems.ngu.data.tier, "evil");
  assert.equal(s.resources.energy.current, 1000, "changer de palier rend l'énergie du palier quitté");
  assert.equal(ngu(s, "normal", "powerAlpha").allocation, 0);
  assert.throws(() => act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 10, tier: "normal" }), /PALIER_NGU_INACTIF/);
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 1000 });
  s = advanceIdleNguState(s, 10 * 24 * 3600, context, 900_000_000);
  // coût de base Evil Power α 2e23 : 1000 x 1e9 x 864000 / 2e23 = 4,3e-6 -> aucun niveau (Evil est bien plus lent)
  assert.equal(ngu(s, "evil", "powerAlpha").level, 0);
  assert.ok(ngu(s, "evil", "powerAlpha").work > 0);
}

// --- Quirk "The Beast NGU Quirk Ever" (14) : chaque niveau Evil donne aussi un niveau Normal ---
{
  const build = (quirk14) => unlocked((st) => {
    st.difficulty = "difficile";
    st.systems.ngu.data.tier = "evil";
    st.resources.energy.power = 1e30;
    if (quirk14) st.systems.quirks.data = { levels: { 14: 1 } };
  });
  let s = build(true);
  s = act(s, { action: "allocateNgu", ngu: "adventureAlpha", value: 1000 });
  s = advanceIdleNguState(s, 3600, context, 4_600_000);
  const evilLevels = ngu(s, "evil", "adventureAlpha").level;
  assert.ok(evilLevels > 0);
  assert.equal(ngu(s, "normal", "adventureAlpha").level, evilLevels, "1 niveau Normal par niveau Evil gagné");
  let sans = build(false);
  sans = act(sans, { action: "allocateNgu", ngu: "adventureAlpha", value: 1000 });
  sans = advanceIdleNguState(sans, 3600, context, 4_600_000);
  assert.equal(ngu(sans, "normal", "adventureAlpha").level, 0);
}

// --- Effets réels : Respawn, Drop, EXP, Number ---
{
  const s = unlocked((st) => {
    const n = st.systems.ngu.data.ngus.normal;
    n.respawn.level = 1e9;
    n.dropChance.level = 1000;
    n.exp.level = 2000;
    n.number.level = 1000;
  });
  const b = idleNguBonuses(s);
  assert.ok(b.respawnReduction >= 0.39 && b.respawnReduction <= 0.4, "Respawn : jusqu'à 40 %");
  assert.ok(Math.abs(b.nguEffects.dropChance - (1 + 1000 * 0.1 / 100)) < 1e-9, "Drop Chance : 0,1 % par niveau sous le soft cap");
  assert.ok(Math.abs(b.nguEffects.exp - (1 + 2000 * 0.01 / 100)) < 1e-9, "EXP : 0,01 % par niveau");
  assert.ok(Math.abs(b.nguEffects.number - (1 + 1000 * 1 / 100)) < 1e-9, "Number : 1 % par niveau");
  assert.ok(b.dropMultiplier > 1 && b.xpMultiplier > 1);
}

// --- Le No NGU Challenge neutralise les effets et bloque l'allocation ---
{
  const s = unlocked((st) => {
    st.systems.ngu.data.ngus.normal.powerAlpha.level = 100;
    st.challenge.active = "noNgu";
  });
  assert.equal(idleNguBonuses(s).nguEffects.attackDefense, 1);
  assert.throws(() => act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 10 }), /DEFI_SANS_NGU/);
}

// --- Renaissance : les niveaux restent, les allocations sont rendues ---
{
  let s = unlocked();
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 500 });
  s = advanceIdleNguState(s, 3600, context, 4_600_000);
  const before = ngu(s, "normal", "powerAlpha").level;
  assert.ok(before > 0);
  const reborn = rebirthIdleNguState(s, context, 4_700_000);
  assert.ok(ngu(reborn, "normal", "powerAlpha").level >= before, "les NGU persistent à travers les Rebirths (wiki)");
  assert.equal(ngu(reborn, "normal", "powerAlpha").allocation, 0);
  assert.equal(reborn.systems.ngu.allocation.energy, 0);
}

// --- Les anciennes actions génériques ne visent plus le système NGU ---
{
  const s = unlocked();
  assert.throws(() => act(s, { action: "allocate", system: "ngu", resource: "energy", value: 10 }), /UTILISER_ALLOCATE_NGU/);
  assert.throws(() => act(s, { action: "selectTrack", system: "ngu", track: "attack" }), /UTILISER_ALLOCATE_NGU/);
  assert.throws(() => act(s, { action: "allocateNgu", ngu: "inconnu", value: 1 }), /NGU_INVALIDE/);
}

// --- Migration : anciennes pistes retirées, énergie allouée rendue ---
{
  let s = unlocked();
  s.systems.ngu.data = { tracks: { attack: { level: 40, tempLevel: 0, permanentLevel: 0, progress: 0.3 } }, activeTrack: "attack" };
  s.systems.ngu.allocation = { energy: 100, magic: 0, r3: 0 };
  s.resources.energy.current = 400;
  const migrated = normalizeIdleNguState(s, context, 1_000_000);
  assert.equal(migrated.systems.ngu.data.tracks, undefined);
  assert.equal(ngu(migrated, "normal", "powerAlpha").level, 0);
  assert.equal(migrated.systems.ngu.allocation.energy, 0);
  assert.equal(migrated.resources.energy.current, 500, "les 100 alloués aux anciennes pistes reviennent");
}

// --- Snapshot pour l'interface ---
{
  let s = unlocked();
  s = act(s, { action: "allocateNgu", ngu: "powerAlpha", value: 500 });
  const snap = idleNguSnapshot(s, context, 1_000_000);
  assert.equal(snap.ngus.tier, "normal");
  assert.deepEqual(snap.ngus.activeTiers, ["normal"]);
  assert.equal(snap.ngus.tiers.normal.length, 16);
  const pa = snap.ngus.tiers.normal.find((n) => n.id === "powerAlpha");
  assert.equal(pa.allocation, 500);
  assert.equal(pa.baseCost, 2e11);
  // niveau 0 -> 1 : 2e11 / (500 x 1e9 x vitesse 1)
  assert.ok(Math.abs(pa.secondsPerLevel - 2e11 / (500 * 1e9)) < 1e-6);
  assert.equal(pa.effectPct, 0);
}

console.log("idle-ngu-real-engine: OK");
