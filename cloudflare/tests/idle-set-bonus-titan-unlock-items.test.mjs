import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  idleNguBonuses,
  idleNguEffectiveResourceStat
} from "../src/idle-ngu-progression.js";

/*
 * Audit des bonus de complétion (2026-09-23) : A Number, UUG's Armpit Hair,
 * Incriminating Evidence et A Severed Unicorn's Head deviennent de vrais objets
 * (drop garanti à chaque kill du titan, section Loot de sa page) dont le set à
 * un objet se complète au niveau 100 (pages "Number (set)", "Armpit (set)",
 * "Incriminating Evidence (set)", "Severed Head (set)" du miroir NGU-Wiki).
 */

function titan(id, etat, ctx) {
  const avant = Math.random;
  Math.random = () => 0.999999; // aucun jet "base chance" ne réussit
  try { return applyIdleAdventureActionV47(etat, { action: "titan", titan: id }, ctx, 1000); }
  finally { Math.random = avant; }
}
const niveauDe = (r, defId) => r.result.drops.filter((d) => d.definitionId === defId).map((d) => d.level);

// ---------- Drops garantis ----------
{
  const r = titan("t1", normalizeIdleAdventureStateV47({}), { bosses: 58, stats: { power: 1300, toughness: 1300 } });
  assert.deepEqual(niveauDe(r, "aNumber"), [0], "GRB : A Number lvl 0 (guaranteed)");
  assert.equal(r.state.unlockItems.aNumber, true, "le drapeau de déblocage NGU reste posé au premier kill");
}
{
  const etat = normalizeIdleAdventureStateV47({});
  etat.unlockFlags.diggers = true;
  etat.unlockFlags.ringOfApathyMaxed = true;
  etat.titans.t3 = { kills: 28, nextAt: 0 };
  const r = titan("t4", etat, { bosses: 100, stats: { power: 1e6, toughness: 1e6 } });
  assert.deepEqual(niveauDe(r, "uugHair"), [0], "UUG : UUG's Armpit Hair lvl 0 (guaranteed)");
}
{
  const r = titan("nerd", normalizeIdleAdventureStateV47({}), { bosses: 300, difficulty: "difficile", stats: { power: 1.37e14, toughness: 8.9e13 } });
  assert.deepEqual(niveauDe(r, "incriminatingEvidence"), [1], "Greasy Nerd : Incriminating Evidence lvl 1 - guaranteed");
}
{
  const r = titan("godmother", normalizeIdleAdventureStateV47({}), { bosses: 300, difficulty: "difficile", stats: { power: 1.7e18, toughness: 7e17 } });
  assert.deepEqual(niveauDe(r, "severedUnicornHead"), [0], "The Godmother : A Severed Unicorn's Head lvl 0 - guaranteed");
}

// ---------- Fusion jusqu'au niveau 100 -> set complété ----------
{
  let s = normalizeIdleAdventureStateV47({});
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "aNumber", level: 49 }, {}, 1).state;
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "aNumber", level: 49 }, {}, 1).state;
  const [a, b] = s.inventory.filter((o) => o.definitionId === "aNumber").map((o) => o.id);
  assert.equal(s.completedSets.number, undefined);
  s = applyIdleAdventureActionV47(s, { action: "merge", a, b }, {}, 1).state;
  assert.equal(s.inventory.find((o) => o.id === a).level, 99, "49 + 49 + 1 = 99");
  assert.equal(s.completedSets.number, undefined, "niveau 99 : pas encore complété");
  s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "aNumber", level: 0 }, {}, 1).state;
  const c = s.inventory.find((o) => o.definitionId === "aNumber" && o.id !== a).id;
  s = applyIdleAdventureActionV47(s, { action: "merge", a, b: c }, {}, 1).state;
  assert.equal(s.completedSets.number, true, "A Number fusionné au niveau 100 -> Number (set) complété");
  assert.ok(Math.abs(s.setRewards.nguSpeedPct - 0.1) < 1e-12, "+10 % NGU Speed");
}

const ajouter = (s, definitionId, level = 100) =>
  applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, {}, 1).state;

// ---------- Number (set) : +10 % NGU Speed (travail d'un NGU) ----------
{
  const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
  const nguState = (avecSet) => {
    let state = normalizeIdleNguState({}, context, 1_000_000);
    if (avecSet) state = ajouter(state, "aNumber");
    state.adventure.unlockItems.aNumber = true;
    state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
    state.resources.energy.cap = 100;
    state = applyIdleNguAction(state, { action: "allocateNgu", ngu: "powerAlpha", value: 100 }, context, 1_000_000).state;
    return advanceIdleNguState(state, 16000, context, 4_600_000).systems.ngu.data.ngus.normal.powerAlpha.work;
  };
  const sans = nguState(false);
  const avec = nguState(true);
  assert.ok(sans > 0 && sans < 1, "Sanity : pas de passage de niveau pendant la mesure");
  assert.ok(Math.abs(avec / sans - 1.1) < 1e-9, `NGU x1,10 (mesuré ${avec / sans})`);
}

// ---------- Armpit (set) : +10 % Beard Speed ----------
{
  const ctx = { bosses: 100 };
  const barbe = (avecSet) => {
    let s = normalizeIdleNguState({}, ctx, 1_000_000);
    if (avecSet) s = ajouter(s, "uugHair");
    s.systems.beards.unlocked = true;
    s.resources.energy.power = 100; s.resources.energy.bars = 100;
    s = applyIdleNguAction(s, { action: "selectTrack", system: "beards", track: "drop" }, ctx, 1_000_000).state;
    s = advanceIdleNguState(s, 100, ctx, 1_100_000);
    const t = s.systems.beards.data.tracks.drop;
    return { total: t.progress + t.tempLevel, complete: s.adventure.completedSets.armpit };
  };
  const sans = barbe(false);
  const avec = barbe(true);
  assert.equal(avec.complete, true, "UUG's Armpit Hair niveau 100 -> Armpit (set) complété");
  assert.ok(sans.total > 0);
  assert.ok(Math.abs(avec.total / sans.total - 1.1) < 1e-6, `Beard x1,10 (mesuré ${avec.total / sans.total})`);
}

// ---------- Incriminating Evidence (set) : +2 / +80K / +2 de base Resource 3 ----------
{
  const sans = normalizeIdleNguState({}, {}, 0);
  const avec = ajouter(normalizeIdleNguState({}, {}, 0), "incriminatingEvidence");
  assert.equal(avec.adventure.completedSets.incriminatingEvidence, true);
  const b = idleNguBonuses(avec);
  for (const [stat, flat, mult] of [["power", 2, b.r3PowerMultiplier], ["cap", 80000, b.r3CapMultiplier], ["bars", 2, b.r3BarsMultiplier]]) {
    const brut = avec.resources.r3[stat];
    assert.ok(
      Math.abs(idleNguEffectiveResourceStat(avec, "r3", stat) - (brut + flat) * mult) < 1e-6,
      `R3 ${stat} : (brut + ${flat}) x multiplicateur`
    );
    assert.ok(
      Math.abs(idleNguEffectiveResourceStat(avec, "r3", stat) - idleNguEffectiveResourceStat(sans, "r3", stat) - flat * mult) < 1e-6,
      `R3 ${stat} : +${flat} de base par rapport à un compte sans le set`
    );
  }
}

// ---------- Severed Head (set) : +13,37 % Wish Speed ----------
{
  let s = normalizeIdleNguState({}, {}, 0);
  const avant = idleNguBonuses(s).wishSpeedMultiplier;
  s = ajouter(s, "severedUnicornHead");
  assert.equal(s.adventure.completedSets.severedHead, true);
  assert.ok(Math.abs(idleNguBonuses(s).wishSpeedMultiplier - avant * 1.1337) < 1e-9, "Wishes x1,1337");
}

console.log("idle-set-bonus-titan-unlock-items: OK");
