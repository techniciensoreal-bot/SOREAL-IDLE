import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguResourceGenerationPerSecond
} from "../src/idle-ngu-progression.js";

/*
 * Correctif 2026-09-18 ("finir le câblage laissé ouvert" après 12e2fe2/
 * 5a281bd) : idleNguBonuses() calcule energyPowerMultiplier/
 * energyBarsMultiplier/magicPowerMultiplier/magicBarsMultiplier depuis
 * Perks/Quirks/Wishes/objets Specials, mais idleNguEffectiveResourceStatV1
 * (le point d'entrée unique lu par tout calcul de vitesse/débit) n'en
 * appliquait jamais le terme *Multiplier pour power/bars -- seul le terme
 * *Flat l'était (le terme *Multiplier de "cap", lui, était déjà correct).
 * Corrigé pour composer flat puis multiplicatif, comme "cap" le faisait
 * déjà et comme attackMultiplier/dropMultiplier le font ailleurs dans ce
 * fichier. Ce test vérifie que ces multiplicateurs changent réellement un
 * nombre de jeu calculé, pas seulement qu'ils existent en tant que champ.
 *
 * Perks utilisés (idle-perks-v1.js) : id 6 "Generic Energy Power Perk I"
 * (+1%/niveau, cap 50, bonus energyPowerPct), id 9 "Generic Magic Power
 * Perk I" (même schéma, magicPowerPct), id 7 "Generic Energy Bar Perk I"
 * (energyBarsPct), id 10 "Generic Magic Bar Perk I" (magicBarsPct) -- au
 * niveau 50 chacun, le multiplicateur correspondant vaut exactement 1.5x
 * (1 + 50 x 0.01).
 */

function withPerk(perkId, level, context) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.systems.bloodMagic.unlocked = true; // ressource magic disponible
  if (perkId) {
    state.systems.perks.data.levels = Object.assign({}, state.systems.perks.data.levels, { [perkId]: level });
  }
  return state;
}

// --- energyBarsMultiplier / magicBarsMultiplier : idleNguResourceGenerationPerSecond dépend directement de la Barre effective ---
{
  const ctx = { bosses: 40 };
  const without = idleNguResourceGenerationPerSecond(withPerk(null, 0, ctx), "energy");
  const with_ = idleNguResourceGenerationPerSecond(withPerk(7, 50, ctx), "energy");
  assert.ok(
    Math.abs(with_ / without - 1.5) < 1e-9,
    `energyBarsMultiplier=1.5 (Perk 7 niveau 50) doit multiplier le débit Energy par exactement 1.5x -- mesuré : ${with_ / without}.`
  );
}
{
  const ctx = { bosses: 40 };
  const without = idleNguResourceGenerationPerSecond(withPerk(null, 0, ctx), "magic");
  const with_ = idleNguResourceGenerationPerSecond(withPerk(10, 50, ctx), "magic");
  assert.ok(
    Math.abs(with_ / without - 1.5) < 1e-9,
    `magicBarsMultiplier=1.5 (Perk 10 niveau 50) doit multiplier le débit Magic par exactement 1.5x -- mesuré : ${with_ / without}.`
  );
}

/*
 * --- energyPowerMultiplier / magicPowerMultiplier : le NGU Power α/β
 * (state.systems.ngu, def.resources=["energy","magic"], advanceTrackSystem)
 * additionne alloc x Puissance-effective x Barres-effectives -- SANS
 * racine carrée (contrairement à Advanced Training) -- donc sa progression
 * est strictement linéaire en Puissance. Mesurée avant tout passage de
 * niveau (progress < 1) pour lire un ratio exact.
 */
function nguAttackState(context, resource, perkId, level) {
  let state = normalizeIdleNguState({}, context, 1_000_000);
  state.systems.bloodMagic.unlocked = true;
  state.adventure.unlockItems.aNumber = true;
  state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
  state.resources[resource].cap = 1000;
  /*
   * Magic démarre à 0 (contrairement à Energy, qui démarre à 250 --
   * commentaire defaultResource() plus haut dans idle-ngu-progression.js) :
   * setAllocation() plafonne l'allocation à ce qui est réellement "possédé"
   * (previous alloc + resources.current), donc sans ce .current explicite
   * allouer 100 Magic serait silencieusement ramené à 0.
   */
  state.resources[resource].current = 1000;
  state = applyIdleNguAction(state, { action: "allocateNgu", ngu: resource === "energy" ? "powerAlpha" : "powerBeta", value: 100 }, context, 1_000_000).state;
  if (perkId) {
    state.systems.perks.data.levels = Object.assign({}, state.systems.perks.data.levels, { [perkId]: level });
  }
  return state;
}

{
  const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
  const without = advanceIdleNguState(nguAttackState(context, "energy", null, 0), 1000, context, 1_001_000);
  const withPerkState = advanceIdleNguState(nguAttackState(context, "energy", 6, 50), 1000, context, 1_001_000);
  const progWithout = without.systems.ngu.data.ngus.normal.powerAlpha.work;
  const progWith = withPerkState.systems.ngu.data.ngus.normal.powerAlpha.work;
  assert.ok(progWithout > 0 && progWithout < 1 && progWith > 0 && progWith < 1, "sanity : pas de passage de niveau pendant la fenêtre de mesure.");
  assert.ok(
    Math.abs(progWith / progWithout - 1.5) < 1e-6,
    `energyPowerMultiplier=1.5 (Perk 6 niveau 50) doit accélérer le NGU Power α/β par exactement 1.5x -- mesuré : ${progWith / progWithout}.`
  );
}
{
  const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
  const without = advanceIdleNguState(nguAttackState(context, "magic", null, 0), 1000, context, 1_001_000);
  const withPerkState = advanceIdleNguState(nguAttackState(context, "magic", 9, 50), 1000, context, 1_001_000);
  const progWithout = without.systems.ngu.data.ngus.normal.powerBeta.work;
  const progWith = withPerkState.systems.ngu.data.ngus.normal.powerBeta.work;
  assert.ok(progWithout > 0 && progWithout < 1 && progWith > 0 && progWith < 1, "sanity : pas de passage de niveau pendant la fenêtre de mesure.");
  assert.ok(
    Math.abs(progWith / progWithout - 1.5) < 1e-6,
    `magicPowerMultiplier=1.5 (Perk 9 niveau 50) doit accélérer le NGU Power α/β par exactement 1.5x -- mesuré : ${progWith / progWithout}.`
  );
}

console.log("idle-ngu-power-bars-multiplier-wiring: OK");
