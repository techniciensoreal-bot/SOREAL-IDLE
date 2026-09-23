import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";

/*
 * (Réécrit le 2026-09-23 pour les 16 vrais NGU : le bonus s'observe sur le
 * travail accumulé du NGU "Power α".)
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
  state = applyIdleNguAction(state, { action: "allocateNgu", ngu: "powerAlpha", value: 100 }, context, 1_000_000).state;
  state.adventure.setRewards.nguSpeedPct = nguSpeedPct;
  return state;
}

// Le débit d'un NGU est alloc x puissance x vitesse / coût de base : le
// travail accumulé est donc exactement proportionnel à la vitesse.
const SECONDS = 16000;
const without = advanceIdleNguState(unlockedNguState(0), SECONDS, context, 4_600_000);
const withSet = advanceIdleNguState(unlockedNguState(.20), SECONDS, context, 4_600_000);

const workWithout = without.systems.ngu.data.ngus.normal.powerAlpha.work;
const workWith = withSet.systems.ngu.data.ngus.normal.powerAlpha.work;
assert.ok(workWithout > 0 && workWithout < 1, "Sanity : pas de passage de niveau pendant la mesure.");
assert.ok(
  Math.abs(workWith / workWithout - 1.2) < 1e-9,
  `Wiki (Meta (set)) : "+20% NGU Speed!" doit accélérer les NGU de exactement 1,2x -- mesuré : ${workWith / workWithout}.`
);

console.log("idle-adventure-ngu-speed-set-crosswiring: OK");
