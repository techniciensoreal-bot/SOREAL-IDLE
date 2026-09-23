import assert from "node:assert/strict";
import { normalizeIdleNguState, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki Beards of Power) : facteur de temps = +1/3 par heure (8 après 24 h) ; Five O'Clock Shadow : max 1 h plus tôt par niveau (12 h minimum). */
const ctx = { bosses: 100 };
function permanentApresRebirth(shadowLevel) {
  const debut = 1_000_000;
  const s = normalizeIdleNguState({}, ctx, debut);
  s.systems.beards.unlocked = true;
  s.systems.beards.active = true;
  s.systems.beards.data.activeTrack = "attack";
  s.systems.beards.data.tracks.attack.tempLevel = 100;
  if (shadowLevel) s.systems.perks.data.levels[21] = shadowLevel;
  const r = rebirthIdleNguState(s, ctx, debut + 12 * 3600 * 1000);
  return (r.state || r).systems.beards.data.tracks.attack.permanentLevel;
}
assert.equal(permanentApresRebirth(0), 40, "12 h : facteur 4 -> floor(sqrt(100) x 4)");
assert.equal(permanentApresRebirth(12), 80, "12 niveaux : maximum atteint dès 12 h -> facteur 8");
console.log("idle-beard-shadow-perk ok");
