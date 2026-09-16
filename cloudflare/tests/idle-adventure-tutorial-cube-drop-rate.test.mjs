import assert from "node:assert/strict";
import { applyIdleAdventureActionV47, normalizeIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-16) : "tu ne dois rien laisser différent de NGU."
 * Wiki ngu-idle.fandom.com/wiki/Sewers, Loot > Boss : "4G's Merge and
 * Boost Tutorial Cube lvl 4 (10% base chance)" — UNIQUEMENT sur un kill
 * de boss (Brown Slime), jamais sur un ennemi normal, jamais un taux
 * inventé (l'ancien 4% générique partagé par tous les SPECIALS d'une
 * zone n'était pas sourcé pour ce cube précis).
 */

function setupZone(s) {
  return applyIdleAdventureActionV47(s, { action: "selectZone", zone: "sewers" }, { bosses: 7 }, 1).state;
}

// --- Un kill NORMAL (boss=false forcé) ne doit JAMAIS faire tomber le cube, peu importe le random. ---
{
  let s = normalizeIdleAdventureStateV47({});
  s = setupZone(s);
  const originalRandom = Math.random;
  Math.random = () => 0; // toujours "réussite" si un roll existait
  try {
    const r = applyIdleAdventureActionV47(s, { action: "zoneKill" }, { bosses: 7, forceBoss: false, stats: {} }, 1);
    s = r.state;
    assert.equal(
      r.result.drops.some(d => d && d.definitionId === "tutorialCube"),
      false,
      "Un kill normal (non-boss) en Sewers ne doit jamais faire tomber le Tutorial Cube, même avec Math.random()=0."
    );
  } finally {
    Math.random = originalRandom;
  }
}

// --- Un kill de BOSS avec Math.random() juste sous 10% doit faire tomber le cube. ---
{
  let s = normalizeIdleAdventureStateV47({});
  s = setupZone(s);
  const originalRandom = Math.random;
  Math.random = () => 0.099;
  try {
    const r = applyIdleAdventureActionV47(s, { action: "zoneKill" }, { bosses: 7, forceBoss: true, stats: {} }, 1);
    assert.ok(
      r.result.drops.some(d => d && d.definitionId === "tutorialCube"),
      "Un kill de boss en Sewers avec random()=0.099 (<10%) doit faire tomber le Tutorial Cube."
    );
  } finally {
    Math.random = originalRandom;
  }
}

// --- Un kill de BOSS avec Math.random() juste au-dessus de 10% ne doit PAS faire tomber le cube. ---
{
  let s = normalizeIdleAdventureStateV47({});
  s = setupZone(s);
  const originalRandom = Math.random;
  Math.random = () => 0.101;
  try {
    const r = applyIdleAdventureActionV47(s, { action: "zoneKill" }, { bosses: 7, forceBoss: true, stats: {} }, 1);
    assert.equal(
      r.result.drops.some(d => d && d.definitionId === "tutorialCube"),
      false,
      "Un kill de boss en Sewers avec random()=0.101 (>10%) ne doit pas faire tomber le Tutorial Cube (taux exact du wiki, jamais approximé)."
    );
  } finally {
    Math.random = originalRandom;
  }
}

console.log("idle-adventure-tutorial-cube-drop-rate: OK");
