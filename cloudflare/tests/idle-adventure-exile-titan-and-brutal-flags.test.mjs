import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_TITANS,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "The Exile" : 9e Titan, débloqué en battant le
 * boss 190 en difficulté Evil, respawn 330 minutes, 4 paliers (stats
 * "Manual" recommandées). Ce test verrouille le titan lui-même et les
 * flags PERMANENTS beastBrutalDefeated/exileBrutalDefeated (nécessaires à
 * idleNguDifficultyUnlockRequirementsV1, idle-ngu-progression.js, pour
 * les conditions de déblocage "The Beast v4 beaten"/"The Exile v4
 * beaten") -- le butin complet (Exile (set), etc.) reste hors périmètre.
 */

const t7 = IDLE_ADVENTURE_TITANS.find(x => x.id === "t7");

assert.equal(t7.name, "The Exile");
assert.equal(t7.boss, 190);
assert.equal(t7.cooldown / 3600000, 5.5, "Respawn wiki : 330 minutes = 5.5h.");
assert.deepEqual(
  t7.difficulties,
  {
    easy: { p: 2.3e22, t: 1.2e22 },
    normal: { p: 3.72e23, t: 1.56e23 },
    hard: { p: 7.45e24, t: 3.55e24 },
    brutal: { p: 2.2e26, t: 1.0e26 }
  },
  "Les 4 paliers doivent être les vraies stats Manual du wiki."
);
assert.equal(t7.requiresTitan, undefined, "Pas de chaîne anti-skip inventée pour un nouveau titan sans confirmation de Norman.");
assert.equal(t7.drop, "stillBeatingHeart");

// --- exileBrutalDefeated : jamais posé avant Brutal, posé et PERMANENT après ---
{
  let s = normalizeIdleAdventureStateV47({});
  const ctxEasy = { bosses: 190, stats: { power: 2.3e22, toughness: 1.2e22 } };
  s = applyIdleAdventureActionV47(s, { action: "titan", titan: "t7", difficulty: "easy" }, ctxEasy, 1).state;
  assert.equal(s.unlockFlags.exileBrutalDefeated, undefined, "Vaincre Easy ne doit jamais poser le flag Brutal.");

  const ctxBrutal = { bosses: 190, stats: { power: 2.2e26, toughness: 1.0e26 } };
  s = applyIdleAdventureActionV47(s, { action: "titan", titan: "t7", difficulty: "brutal" }, ctxBrutal, 999999999).state;
  assert.equal(s.unlockFlags.exileBrutalDefeated, true, "Vaincre Brutal (V4) doit poser le flag, utilisé par le déblocage Sadistic.");
}

// --- beastBrutalDefeated : même mécanique pour The Beast (t6), nécessaire au déblocage Evil ---
{
  let s = normalizeIdleAdventureStateV47({});
  const ctxNormal = { bosses: 132, stats: { power: 7000000000, toughness: 5000000000 } };
  s = applyIdleAdventureActionV47(s, { action: "titan", titan: "t6", difficulty: "normal" }, ctxNormal, 1).state;
  assert.equal(s.unlockFlags.beastBrutalDefeated, undefined, "Vaincre Normal ne doit jamais poser le flag Brutal.");

  const ctxBrutal = { bosses: 132, stats: { power: 700000000000, toughness: 500000000000 } };
  s = applyIdleAdventureActionV47(s, { action: "titan", titan: "t6", difficulty: "brutal" }, ctxBrutal, 999999999).state;
  assert.equal(s.unlockFlags.beastBrutalDefeated, true, "Vaincre Brutal (V4) doit poser le flag, utilisé par le déblocage Evil.");
}

// --- alias "titan7" (comme titan1..titan6 déjà supportés) ---
{
  let s = normalizeIdleAdventureStateV47({});
  const ctxBrutal = { bosses: 190, stats: { power: 2.2e26, toughness: 1.0e26 } };
  const { result } = applyIdleAdventureActionV47(s, { action: "titan", titan: "titan7", difficulty: "brutal" }, ctxBrutal, 1);
  assert.equal(result.id, "t7", "L'alias titan7 doit résoudre vers t7, comme titan1..titan6.");
}

console.log("idle-adventure-exile-titan-and-brutal-flags: OK");
