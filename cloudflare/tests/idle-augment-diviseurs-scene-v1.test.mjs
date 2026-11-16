import assert from "node:assert/strict";
import { idleNguAugmentDifficultyDividerV1 } from "../src/idle-ngu-etat.js";
import { IDLE_NGU_AUGMENTATIONS } from "../src/idle-ngu-catalogues.js";

/*
 * Diviseurs de vitesse des Augmentations lus dans la scène du jeu (build 1260, `AllAugsController`, 2026-11-16) :
 * Evil = diviseur Evil / diviseur Normal de la piste ; Sadistic = diviseur Sadistic x (5e7 / 50 000) / diviseur Normal
 * (`AugmentController::sadisticDivider` = 5e7 remplace le 50 000). Ce n'est pas le facteur uniforme du wiki.
 */
const EVIL = [1e15, 1.7e16, 2.9e17, 5e18, 8.5e19, 1.19e23, 1.666e26];
const SAD = [1e27, 1.7e28, 2.9e29, 5e30, 8.5e31, 1.19e35, 1.666e38];
const proche = (a, b) => Math.abs(a - b) <= Math.abs(b) * 1e-12;
IDLE_NGU_AUGMENTATIONS.forEach((d, i) => {
  assert.equal(idleNguAugmentDifficultyDividerV1({ difficulty: "normal" }, d.id, false, d.baseSeconds) > 0, true);
  const ev = idleNguAugmentDifficultyDividerV1({ difficulty: "difficile" }, d.id, false, d.baseSeconds);
  const sa = idleNguAugmentDifficultyDividerV1({ difficulty: "extreme" }, d.id, false, d.baseSeconds);
  assert.ok(proche(ev * d.baseSeconds, EVIL[i]), d.id + " Evil");
  assert.ok(proche(sa * d.baseSeconds, SAD[i] * 1000), d.id + " Sadistic");
});
// Ciseaux et Lait : exactement le facteur du wiki ; Canon : 2,5087e12 (le wiki dit 2,5e12 partout).
assert.ok(proche(idleNguAugmentDifficultyDividerV1({ difficulty: "difficile" }, "scissors", false, 400), 2.5e12));
assert.ok(proche(idleNguAugmentDifficultyDividerV1({ difficulty: "extreme" }, "milk", false, 6800), 2.5e27));
assert.ok(idleNguAugmentDifficultyDividerV1({ difficulty: "difficile" }, "cannon", false, 115600) > 2.5e12);
// Une piste inconnue retombe sur le facteur uniforme (jamais de valeur inventée).
assert.equal(idleNguAugmentDifficultyDividerV1({ difficulty: "difficile" }, "inconnue", false, 400), 2.5e12);
console.log("idle-augment-diviseurs-scene-v1: OK");
