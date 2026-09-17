import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
 * Evil/Sadistic). En construisant les sets Meta ("+20% NGU Speed!") et
 * Back To School ("+15% NGU Speed!"), découverte que le système "ngu"
 * (trainers Attack/Defense/Adventure/Drop/etc., wiki "NGU" track) EST
 * déjà construit chez SOREAL (state.systems.ngu, advanceTrackSystem) --
 * contrairement au statut précédemment supposé. setRewards.nguSpeedPct
 * (idle-adventure-v47.js) accélère maintenant sa progression via
 * advanceTrackSystem (idle-ngu-progression.js), même schéma que les
 * autres ponts setRewards.* déjà câblés.
 */

const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };

function unlockedNguState(nguSpeedPct) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.adventure.unlockItems.aNumber = true;
  state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
  state.resources.energy.cap = 100;
  state = applyIdleNguAction(state, { action: "allocate", system: "ngu", resource: "energy", value: 100 }, context, 1_000_000).state;
  state = applyIdleNguAction(state, { action: "selectTrack", system: "ngu", track: "attack" }, context, 1_000_000).state;
  state.adventure.setRewards.nguSpeedPct = nguSpeedPct;
  return state;
}

// La vitesse d'accumulation du trainer NGU n'est PAS linéaire dans le
// temps (le débit dépend de resources.energy, qui évolue lui-même durant
// l'avancement) -- valeurs mesurées empiriquement à 16000s : niveau 5
// sans le set, niveau 6 avec (+20%). Vérifie l'effet réel plutôt qu'une
// prédiction de taux constant.
const SECONDS = 16000;
const without = advanceIdleNguState(unlockedNguState(0), SECONDS, context, 4_600_000);
const withSet = advanceIdleNguState(unlockedNguState(.20), SECONDS, context, 4_600_000);

assert.equal(without.systems.ngu.data.tracks.attack.level, 5, "Sanity : sans le set, 16000s doivent produire exactement le niveau 5 mesuré.");
assert.equal(
  withSet.systems.ngu.data.tracks.attack.level, 6,
  "Wiki (Meta (set)) : \"+20% NGU Speed!\" doit accélérer la progression du trainer NGU -- les mêmes 16000s doivent atteindre un niveau supérieur avec le bonus."
);

console.log("idle-adventure-ngu-speed-set-crosswiring: OK");
