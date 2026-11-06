import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import fs from "node:fs";

/*
 * Cible -1 (Norman, 2026-11-06) : dans chaque zone « Cible » (NGU, Entraînement avancé, Augmentations) on peut mettre -1. Une piste à -1 est IGNORÉE par « Faire suivre l'énergie » (jamais une destination) ;
 * quand toutes les cibles sont atteintes ou à -1, l'énergie est rendue. 0 reste « aucune cible ». Une piste à -1 n'est jamais « atteinte » : son énergie manuelle n'est jamais retirée.
 */
const ctx = { bosses: 120, bestGold: 1e12, adventurePower: 1e9 };
const T = 1_000_000;
function depart() {
  let s = normalizeIdleNguState({}, ctx, T);
  s.adventure.unlockItems.aNumber = true;
  s.systems.augmentations.unlocked = true;
  s.systems.advancedTraining.unlocked = true;
  s.systems.ngu.unlocked = true;
  s.resources.energy.cap = 1e9; s.resources.energy.current = 1e9; s.resources.energy.power = 1e9;
  s.currencies.gold = 1e30;
  return s;
}
const act = (s, p) => applyIdleNguAction(s, p, ctx, T).state;
const pairs = (s) => s.systems.augmentations.data.pairs;

/* Augmentations : l'énergie saute la piste à -1 (suivante dans l'ordre : Upgrade de la paire, puis paire suivante) */
{
  let s = depart();
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: -7 });
  assert.equal(pairs(s).scissors.target, -1, "toute valeur négative devient -1");
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: 1 });
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: true, value: -1 });
  assert.equal(pairs(s).scissors.upgradeTarget, -1);
  s = act(s, { action: "setAugmentAdvance", enabled: true });
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 });
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  const p = pairs(s);
  assert.equal(p.scissors.energy, 0, "la piste qui a atteint sa cible est vidée");
  assert.equal(p.scissors.upgradeEnergy, 0, "l'Upgrade à -1 n'est jamais une destination");
  assert.ok(p.milk.energy + p.milk.upgradeEnergy >= 1e6 - 1, "l'énergie passe à la piste suivante qui n'est pas ignorée");
}
/* Augmentations : toutes les suivantes à -1 => énergie rendue */
{
  let s = depart();
  const ids = Object.keys(pairs(s));
  for (const id of ids) for (const up of [false, true]) {
    if (id === "scissors" && !up) continue;
    try { s = act(s, { action: "setAugmentTarget", pair: id, upgrade: up, value: -1 }); } catch (_e) { /* piste verrouillée : sans objet */ }
  }
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: 1 });
  s = act(s, { action: "setAugmentAdvance", enabled: true });
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 });
  const avant = s.resources.energy.current;
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  const total = Object.values(pairs(s)).reduce((a, p) => a + p.energy + p.upgradeEnergy, 0);
  assert.equal(total, 0, "tout est à -1 ou atteint : l'énergie est rendue");
  assert.ok(s.resources.energy.current >= avant, "l'énergie est revenue dans la réserve");
}
/* Une piste à -1 ne perd JAMAIS son énergie posée à la main */
{
  let s = depart();
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: -1 });
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 });
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  assert.ok(pairs(s).scissors.level >= 1 && pairs(s).scissors.energy === 1e6, "-1 n'est jamais « atteinte »");
}
/* Entraînement avancé : une compétence à -1 est sautée */
{
  let s = depart();
  const tr = () => s.systems.advancedTraining.data.tracks;
  s = act(s, { action: "setAdvancedTrainingTarget", track: "power", value: -3 });
  assert.equal(tr().power.target, -1);
  s = act(s, { action: "setAdvancedTrainingTarget", track: "toughness", value: 1 });
  s = act(s, { action: "setAdvancedTrainingAdvance", enabled: true });
  s = act(s, { action: "allocateAdvancedTraining", track: "toughness", value: 1e6 });
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  assert.equal(tr().toughness.energy, 0);
  assert.equal(tr().power.energy, 0, "power (-1) n'est pas une destination");
  assert.ok(tr().block.energy >= 1e6 - 1, "l'énergie va à la compétence suivante non ignorée (block)");
}
/* NGU : un NGU à -1 est sauté, et la valeur négative est normalisée */
{
  let s = depart();
  s = act(s, { action: "setNguTarget", ngu: "wandoos", value: -1 });
  assert.equal(s.systems.ngu.data.ngus.normal.wandoos.target, -1);
  s = act(s, { action: "setNguTarget", ngu: "augments", value: 1 });
  s = act(s, { action: "setNguAdvance", resource: "energy", enabled: true });
  s = act(s, { action: "allocateNgu", ngu: "augments", value: 1e6 });
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  const n = s.systems.ngu.data.ngus.normal;
  assert.equal(n.augments.allocation, 0);
  assert.equal(n.wandoos.allocation, 0, "wandoos (-1) n'est pas une destination");
  assert.ok(n.respawn.allocation > 0, "l'énergie passe au NGU suivant non ignoré");
}
/* Client : champs « Cible » acceptent -1 (Augmentations, Entraînement avancé, NGU) */
{
  const aug = fs.readFileSync(new URL("../public/modules/augmentations-page-v1.js", import.meta.url), "utf8");
  const ngu = fs.readFileSync(new URL("../public/modules/ngu-labo-v1.js", import.meta.url), "utf8");
  assert.ok(/aug-cible-v2"><span>Cible<\/span><input type="number" inputmode="numeric" min="-1"/.test(aug));
  assert.ok(/soreal-idle-at-col-v1 cible"><span>Cible<\/span><input type="number" inputmode="numeric" min="-1"/.test(aug));
  assert.ok(/nl-cible"><span>Cible<\/span><input type="number" inputmode="numeric" min="-1"/.test(ngu));
  assert.ok(/__cibleAugmentIdleV1__=function\(id,upgrade,valeur\)\{\s*const n=Math\.max\(-1,/.test(aug));
  assert.ok(/var n=Math\.max\(-1,Math\.floor\(Number\(valeur\)\|\|0\)\);\s*var j=H_\(\)/.test(ngu));
}
console.log("idle-cible-moins-un-v1: OK");
