import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, IDLE_ADVENTURE_SETS } from "../src/idle-adventure-v47.js";

/*
 * Wiki "Training (set)" (miroir NGU-Wiki) : "+2 energy speed / 10 EXP". Une
 * ancienne complétion ne doit plus recevoir le complément de +10 EXP de
 * l'ancienne migration "10 -> 20 EXP".
 */
assert.deepEqual(IDLE_ADVENTURE_SETS.training.reward, { experience: 10, energySpeed: 2 });

// Complétion normale : 10 EXP.
{
  let s = normalizeIdleAdventureStateV47({});
  for (const slot of IDLE_ADVENTURE_SETS.training.slots)
    s = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: `training:${slot}`, level: 100 }, {}, 1).state;
  assert.equal(s.completedSets.training, true);
  assert.equal(s.setRewards.experience, 10);
  assert.equal(s.permanent.experience, 10);
}

// Ancienne sauvegarde (complétée, sans drapeau de migration) : rien n'est ajouté au chargement.
{
  const brut = JSON.parse(JSON.stringify(normalizeIdleAdventureStateV47({})));
  brut.completedSets = { training: true };
  brut.setRewards.experience = 10;
  brut.permanent.experience = 10;
  delete brut.unlockFlags.trainingSetExp20V1;
  const s = normalizeIdleAdventureStateV47(brut);
  assert.equal(s.setRewards.experience, 10, "jamais porté à 20 EXP");
  assert.equal(s.permanent.experience, 10);
}

console.log("idle-set-bonus-training-exp: OK");
