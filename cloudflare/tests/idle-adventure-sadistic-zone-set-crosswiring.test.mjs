import assert from "node:assert/strict";
import { advanceIdleNguState, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
 * Evil/Sadistic). Wiki NGU en direct, page "Dutch (set)" (The Nether
 * Regions) : "Bonus for Completion: +25% Faster Blood Magic Rituals!" --
 * setRewards.bloodMagicSpeedPct (idle-adventure-v47.js) divise
 * secondsPerCompletion dans advanceBloodMagic (idle-ngu-progression.js),
 * jamais composé avec le diviseur de difficulté Evil/Sadistic déjà
 * câblé (idle-difficulty-augment-tm-bloodmagic-slowdown.test.mjs).
 */

function baseSave(bloodMagicSpeedPct) {
  const state = normalizeIdleNguState({}, {}, Date.now());
  state.systems.bloodMagic = {
    unlocked: true,
    allocation: { magic: 500 },
    data: { activeRitual: "tack", rituals: { tack: { progress: 0, completions: 0, level: 0 } }, spells: {} }
  };
  state.resources.magic = { power: 1, speed: 50, cap: 1e9, bars: 1, current: 1e9 };
  state.currencies.gold = 1e30;
  state.adventure.setRewards.bloodMagicSpeedPct = bloodMagicSpeedPct;
  return state;
}

const ctx = { adventurePower: 100, adventureToughness: 100, bosses: 301 };
// Temps exact pour compléter le rituel "tack" (baseSeconds=2000) sans le set : (2000*1000)/500 = 4000s.
const RITUAL_NEEDED_WITHOUT_SET = (2000 * 1000) / 500;

const without = advanceIdleNguState(baseSave(0), RITUAL_NEEDED_WITHOUT_SET, ctx, 0);
assert.equal(without.systems.bloodMagic.data.rituals.tack.completions, 1, "Sanity : sans le set, le rituel complète pile au temps calculé.");

// Avec le set Dutch (+25%), le même temps doit compléter le rituel PLUS d'une fois
// (temps par complétion divisé par 1.25 -> il en faut 4000/1.25=3200s, 4000s en fait 1.25).
const withSet = advanceIdleNguState(baseSave(.25), RITUAL_NEEDED_WITHOUT_SET, ctx, 0);
assert.equal(withSet.systems.bloodMagic.data.rituals.tack.completions, 1, "1 complétion pile, avec du temps de progression restant (4000s/3200s = 1.25).");
assert.ok(withSet.systems.bloodMagic.data.rituals.tack.progress > 0, "Le set Dutch doit accélérer le rituel : il doit rester du temps de progression après la 1re complétion (4000 - 3200 = 800s), preuve que secondsPerCompletion a bien diminué.");

console.log("idle-adventure-sadistic-zone-set-crosswiring: OK");
