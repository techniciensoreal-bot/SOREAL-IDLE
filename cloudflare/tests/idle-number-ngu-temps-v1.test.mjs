import assert from "node:assert/strict";
import { normalizeIdleNguState, syncIdleNguState, idleNguRebirthTimeFactor } from "../src/idle-ngu-progression.js";

/*
 * Lu dans le jeu (Rebirth::calculateNextMultis -> AllNGUController::numberBonus() sans argument, build 1260, 2026-11-16) : l'effet du NGU NUMBER
 * est multiplie par Character.timeMulti : 1 + niveau x facteur x timeMulti (la version a un argument, sans timeMulti, ne sert qu'a l'affichage).
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000_000;
function etat(secondes) {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.runStartedAt = T0 - secondes * 1000;
  s.systems.ngu.unlocked = true;
  s.systems.ngu.data.ngus.normal.number.level = 300;   /* 1 % par niveau en Normal */
  return syncIdleNguState(s, ctx, T0);
}
{
  const demiHeure = etat(30 * 60);
  const f = idleNguRebirthTimeFactor(30 * 60);
  assert.ok(f < 1);
  const attendu = 1 + 300 * 0.01 * f;
  assert.ok(Math.abs(demiHeure.rebirth.preview.nguNumberBonus - attendu) < 1e-9, `NGU NUMBER x timeMulti (${demiHeure.rebirth.preview.nguNumberBonus} / ${attendu})`);
  const dixHeures = etat(10 * 3600);
  const g = idleNguRebirthTimeFactor(10 * 3600);
  assert.ok(g > 1);
  assert.ok(Math.abs(dixHeures.rebirth.preview.nguNumberBonus - (1 + 300 * 0.01 * g)) < 1e-9);
}
console.log("idle-number-ngu-temps-v1: OK");
