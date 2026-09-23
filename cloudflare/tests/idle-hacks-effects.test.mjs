import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguBonuses } from "../src/idle-ngu-progression.js";

/*
 * Audit 2026-09-23 : les effets des Hacks n'étaient jamais appliqués (seule leur vitesse l'était).
 * Wiki Hacks : (100 % + Effect x Niveau) x Milestone^(floor(niveau / niveaux par milestone)) ;
 * « Hacks do not affect Normal mode ».
 */
const ctx = { bosses: 100 };
function avec(difficulty, levels, quirks) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.difficulty = difficulty;
  for (const [id, level] of Object.entries(levels)) s.systems.hacks.data.tracks[id].level = level;
  if (quirks) s.systems.quirks.data = { levels: quirks };
  return idleNguBonuses(s);
}
const base = avec("difficile", {});

// Attack/Defense Hack : 2,5 %/niveau, milestone 102,5 % tous les 10 niveaux
{
  const b = avec("difficile", { attackDefense: 25 });
  const attendu = (1 + 0.025 * 25) * Math.pow(1.025, 2);
  assert.ok(Math.abs(b.attackMultiplier / base.attackMultiplier - attendu) < 1e-9, "x" + attendu);
  assert.ok(Math.abs(b.defenseMultiplier / base.defenseMultiplier - attendu) < 1e-9);
}
// Sans effet en difficulté Normal
{
  const n = avec("normal", { attackDefense: 25 });
  const n0 = avec("normal", {});
  assert.equal(n.attackMultiplier, n0.attackMultiplier);
}
// Quirk Atk/Def Hack Milestone Reducer I : milestone tous les 8 niveaux (10 - 2)
{
  const b = avec("difficile", { attackDefense: 25 }, { 57: 2 });
  const attendu = (1 + 0.025 * 25) * Math.pow(1.025, 3);
  assert.ok(Math.abs(b.attackMultiplier / base.attackMultiplier - attendu) < 1e-9, "3 milestones au lieu de 2");
}
// Drop, EXP, PP, Adventure
{
  const b = avec("difficile", { dropChance: 40, exp: 75, pp: 25, adventureStats: 50 });
  assert.ok(Math.abs(b.dropMultiplier / base.dropMultiplier - (1 + 0.0025 * 40) * 1.03) < 1e-9);
  assert.ok(Math.abs(b.xpMultiplier / base.xpMultiplier - (1 + 0.00025 * 75) * 1.01) < 1e-9);
  assert.ok(Math.abs(b.ppMultiplier / base.ppMultiplier - (1 + 0.0005 * 25) * 1.005) < 1e-9);
  assert.ok(Math.abs(b.adventurePowerMultiplier / base.adventurePowerMultiplier - (1 + 0.001 * 50) * 1.02) < 1e-9);
}
console.log("idle-hacks-effects: OK");
