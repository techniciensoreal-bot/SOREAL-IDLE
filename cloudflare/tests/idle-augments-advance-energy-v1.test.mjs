import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-10) : « dans Augmentations, on doit pouvoir faire Advance Energy ». Chaque piste (Augment, puis son Upgrade, paire après paire) a un niveau cible ; à l'atteinte, l'énergie passe à la piste suivante
 * (Advance Energy activé) ou est rendue (désactivé). La puissance des Augments n'est pas touchée.
 */
const ctx = { bosses: 120, bestGold: 1e12, adventurePower: 1e9 };
const T = 1_000_000;
function depart() {
  let s = normalizeIdleNguState({}, ctx, T);
  s.adventure.unlockItems.aNumber = true;
  s.systems.augmentations.unlocked = true;
  s.resources.energy.cap = 1e9; s.resources.energy.current = 1e9; s.resources.energy.power = 1e9;
  s.currencies.gold = 1e30;
  return s;
}
const act = (s, payload) => applyIdleNguAction(s, payload, ctx, T).state;
const pairs = (s) => s.systems.augmentations.data.pairs;

// Cible atteinte, sans Advance : l'énergie est rendue.
{
  let s = depart();
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 });
  assert.equal(pairs(s).scissors.energy, 1e6);
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: 1 });
  assert.equal(pairs(s).scissors.target, 1);
  const avant = s.resources.energy.current;
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  assert.ok(pairs(s).scissors.level >= 1, "le niveau cible est atteint");
  assert.equal(pairs(s).scissors.energy, 0, "énergie rendue à la cible");
  assert.ok(s.resources.energy.current >= avant, "l'énergie est revenue dans la réserve");
}

// Avec Advance : l'énergie passe à la piste suivante (Upgrade de la même paire si débloqué, sinon l'Augment suivant).
{
  let s = depart();
  s = act(s, { action: "setAugmentAdvance", enabled: true });
  assert.equal(s.systems.augmentations.data.advanceEnergy, true);
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 });
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: 1 });
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  const p = pairs(s);
  const suivant = p.scissors.upgradeEnergy + p.milk.energy + p.milk.upgradeEnergy;
  assert.ok(suivant >= 1e6 - 1, "l'énergie est passée à la piste suivante (obtenu : " + suivant + ")");
  assert.equal(p.scissors.energy, 0);
}

// Une cible déjà atteinte ne garde pas l'énergie qu'on y place ; la réponse expose cibles et réglage.
{
  let s = depart();
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 });
  s = act(s, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: 1 });
  s = advanceIdleNguState(s, 600, ctx, T + 600_000);
  s = act(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 5e5 });
  assert.equal(pairs(s).scissors.energy, 0, "cible atteinte : plus d'énergie gardée");
  const snap = idleNguSnapshot(s, ctx, T + 700_000);
  const def = snap.augmentations.find((d) => d.id === "scissors");
  assert.equal(def.target, 1);
  assert.equal(typeof def.upgradeTarget, "number");
  assert.equal(typeof snap.augmentationsAdvance, "boolean");
}
// Verrouillé : refusé.
{
  const s = normalizeIdleNguState({}, { bosses: 0 }, T);
  assert.throws(() => applyIdleNguAction(s, { action: "setAugmentAdvance", enabled: true }, { bosses: 0 }, T), /SYSTEME_VERROUILLE/);
}
console.log("idle-augments-advance-energy-v1: OK");
