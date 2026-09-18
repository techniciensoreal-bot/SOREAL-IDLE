import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState
} from "../src/idle-ngu-progression.js";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * Correctif 2026-09-18 : idleNguBonuses().nguSpeedMultiplier (challenges +
 * beard "Beard Cage" + Gold Diggers + NGU "attack" bonus log + Specials
 * d'objets, ex. "A Shrunken Voodoo Doll" -- idle-adventure-v47.js:1106,
 * sExtra nguSpeedPct base 200%, wiki) restait affichage-seul :
 * advanceTrackSystem (def.id === "ngu") n'appliquait que
 * setRewards.nguSpeedPct (le pont "set complet"), jamais ce
 * multiplicateur-ci. Câblé maintenant en plus de nguSpeedSetMultiplier.
 * Ce test isole la contribution Specials (A Shrunken Voodoo Doll, +200%
 * NGU Speed non boostable -- sExtra) en comparant la progression de la
 * piste NGU "attack" avec et sans l'objet équipé.
 */

function equipShrunkenVoodooDoll(ctx) {
  let s = createIdleAdventureStateV47();
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "shrunkenVoodooDoll", level: 0 }, ctx, 1);
  const item = r.state.inventory.find((i) => i.definitionId === "shrunkenVoodooDoll");
  r = applyIdleAdventureActionV47(r.state, { action: "equip", id: item.id, slot: "accessory" }, ctx, 1);
  return r.state;
}

function nguAttackState(context, equipItem) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.adventure.unlockItems.aNumber = true;
  state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
  state.resources.energy.cap = 1000;
  state = applyIdleNguAction(state, { action: "allocate", system: "ngu", resource: "energy", value: 100 }, context, 1_000_000).state;
  state = applyIdleNguAction(state, { action: "selectTrack", system: "ngu", track: "attack" }, context, 1_000_000).state;
  if (equipItem) state.adventure = equipShrunkenVoodooDoll(context);
  return state;
}

{
  const context = { bosses: 100, bestGold: 1e6, adventurePower: 1e9 };
  const without = advanceIdleNguState(nguAttackState(context, false), 200, context, 1_000_200);
  const withItem = advanceIdleNguState(nguAttackState(context, true), 200, context, 1_000_200);
  const progWithout = without.systems.ngu.data.tracks.attack.progress;
  const progWith = withItem.systems.ngu.data.tracks.attack.progress;
  assert.ok(progWithout > 0 && progWithout < 1 && progWith > 0 && progWith < 1, "sanity : pas de passage de niveau pendant la fenêtre de mesure.");
  assert.ok(
    Math.abs(progWith / progWithout - 3.0) < 1e-6,
    `A Shrunken Voodoo Doll (nguSpeedPct=200, wiki) doit tripler (1+200/100=3x) la progression de la piste NGU "attack" via nguSpeedMultiplier -- mesuré : ${progWith / progWithout}.`
  );
}

console.log("idle-ngu-speed-multiplier-wiring: OK");
