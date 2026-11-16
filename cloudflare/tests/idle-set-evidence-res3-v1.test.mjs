import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { normalizeIdleNguState, syncIdleNguState } from "../src/idle-ngu-progression.js";

/* Alignement sur le code du jeu (AllItemListController::checkforBonuses 3406, 2026-11-16) : le set Incriminating Evidence ne verse sa récompense que si Resource 3 est active (Resource3.res3On). */
{
  const DEF = "incriminatingEvidence";
  const avec = (res3Actif) => {
    let a = normalizeIdleAdventureStateV47({});
    if (res3Actif !== undefined) a.res3Actif = res3Actif;
    a = applyIdleAdventureActionV47(a, { action: "addItem", definitionId: DEF, level: 100 }, { bosses: 400 }, 1).state;
    return normalizeIdleAdventureStateV47(a);
  };
  const sans = avec(false);
  assert.ok(!sans.completedSets[DEF], "Resource 3 inactive : set non complété");
  assert.equal(sans.permanent.r3CapFlat || 0, 0);
  assert.equal(sans.setRewards.r3PowerFlat || 0, 0);
  const actif = avec(true);
  assert.ok(actif.completedSets[DEF], "Resource 3 active : set complété");
  assert.equal(actif.setRewards.r3PowerFlat, 2);
  assert.equal(actif.setRewards.r3CapFlat, 80000);
  // activation ultérieure : la récompense arrive à la normalisation suivante
  sans.res3Actif = true;
  const apres = normalizeIdleAdventureStateV47(sans);
  assert.ok(apres.completedSets[DEF], "Resource 3 activée plus tard : le set se complète alors");
  assert.equal(apres.setRewards.r3PowerFlat, 2);
}
// La synchro NGU pose res3Actif (Hacks débloqués)
{
  const s = syncIdleNguState(normalizeIdleNguState({}, { bosses: 0 }, 0), { bosses: 0 }, 1000);
  assert.equal(s.adventure.res3Actif, false);
  const s2 = normalizeIdleNguState({}, { bosses: 0 }, 0);
  s2.systems.hacks.unlocked = true;
  assert.equal(normalizeIdleNguState(s2, { bosses: 0 }, 1000).adventure.res3Actif, true);
}
console.log("idle-set-evidence-res3-v1 : OK");
