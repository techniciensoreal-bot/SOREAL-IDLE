import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { createIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * Correctif 2026-09-18 : idleNguBonuses().beardSpeedMultiplierFromItems
 * (Beard Comb / Red Lipstick / A Shrunken Voodoo Doll, wiki "Specials")
 * était calculé (PISTE 2, 5a281bd) mais son propre commentaire disait
 * explicitement "câblage dans beardBonusMultiplier laissé pour un futur
 * passage". beardBonusMultiplier() n'est PAS le bon point d'entrée pour ce
 * bonus : ce multiplicateur-là représente l'EFFET produit par le niveau de
 * Beard déjà acquis sur d'autres stats, jamais la VITESSE à laquelle la
 * Beard active elle-même progresse (baseRate, advanceBeardTrack) --
 * exactement ce que "Beard Speed" désigne sur le wiki. Câblé dans
 * baseRate. Ce test isole la contribution de "A Shrunken Voodoo Doll"
 * (idle-adventure-v47.js:1106, sType beardSpeedPct, base value wiki 200%,
 * non boostable) en comparant la progression de la piste Beard "drop"
 * (Neckbeard, toujours débloquée -- pas d'unlockTroll) avec et sans
 * l'objet équipé.
 */

function equipShrunkenVoodooDoll(ctx) {
  let s = createIdleAdventureStateV47();
  let r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "shrunkenVoodooDoll", level: 0 }, ctx, 1);
  const item = r.state.inventory.find((i) => i.definitionId === "shrunkenVoodooDoll");
  r = applyIdleAdventureActionV47(r.state, { action: "equip", id: item.id, slot: "accessory" }, ctx, 1);
  return r.state;
}

function beardDropState(context, equipItem) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.systems.beards.unlocked = true;
  // Puissance/Barres Energy modestes -- baseRate doit rester loin du palier "50 niveaux/s" pour lire un ratio exact.
  state.resources.energy.power = 100;
  state.resources.energy.bars = 100;
  state = applyIdleNguAction(state, { action: "selectTrack", system: "beards", track: "drop" }, context, 1_000_000).state;
  if (equipItem) state.adventure = equipShrunkenVoodooDoll(context);
  return state;
}

{
  const context = { bosses: 100 };
  const without = advanceIdleNguState(beardDropState(context, false), 100, context, 1_100_000);
  const withItem = advanceIdleNguState(beardDropState(context, true), 100, context, 1_100_000);
  const trackWithout = without.systems.beards.data.tracks.drop;
  const trackWith = withItem.systems.beards.data.tracks.drop;
  assert.equal(trackWithout.tempLevel, 0, "sanity : pas de passage de niveau pendant la fenêtre de mesure (sans l'objet).");
  assert.equal(trackWith.tempLevel, 0, "sanity : pas de passage de niveau pendant la fenêtre de mesure (avec l'objet).");
  assert.ok(trackWithout.progress > 0 && trackWith.progress > 0, "sanity : la piste Beard doit progresser dans les deux cas.");
  assert.ok(
    Math.abs(trackWith.progress / trackWithout.progress - 3.0) < 1e-6,
    `A Shrunken Voodoo Doll (beardSpeedPct=200, wiki) doit tripler (1+200/100=3x) la vitesse de la piste Beard "drop" via beardSpeedMultiplierFromItems -- mesuré : ${trackWith.progress / trackWithout.progress}.`
  );
}

console.log("idle-beard-speed-multiplier-wiring: OK");
