import assert from "node:assert/strict";
import { idleNguAugmentationsVisiblesV1 } from "../src/idle-ngu-bonus.js";
import { IDLE_NGU_AUGMENTATIONS } from "../src/idle-ngu-catalogues.js";

/* Norman (2026-11-03) : « quand un augment est verrouillé, il faut donner l'information de quel boss est nécessaire pour l'avoir dans le cadre avec des ???????? » (« le prochain augment seulement »). */
const v0 = idleNguAugmentationsVisiblesV1({ bosses: 0 });
const premier = IDLE_NGU_AUGMENTATIONS[0];
const dernierVisible = v0[v0.length - 1];
assert.equal(dernierVisible.verrouille, true, "une seule paire verrouillée est annoncée");
assert.equal(v0.filter((d) => d.verrouille).length, 1, "jamais la liste des suivantes");
assert.deepEqual(Object.keys(dernierVisible).sort(), ["id", "unlockBoss", "verrouille"], "ni nom, ni données : seulement le numéro du boss");
const attendu = IDLE_NGU_AUGMENTATIONS.find((d) => d.unlockBoss > 0);
assert.ok(dernierVisible.unlockBoss === Math.floor(IDLE_NGU_AUGMENTATIONS[v0.length - 1].unlockBoss), "le numéro est celui de la prochaine augmentation");
// un boss de plus battu : la suivante devient la prochaine
const vN = idleNguAugmentationsVisiblesV1({ bosses: IDLE_NGU_AUGMENTATIONS[1].unlockBoss });
assert.equal(vN[vN.length - 1].unlockBoss, Math.floor(IDLE_NGU_AUGMENTATIONS[vN.length - 1].unlockBoss), "la prochaine suit la progression");
// tout débloqué : plus aucun cadre verrouillé
const tout = idleNguAugmentationsVisiblesV1({ bosses: 9999 });
assert.ok(!tout.some((d) => d.verrouille), "tout débloqué : aucun cadre ????????");
void premier; void attendu;
console.log("idle-augment-verrou-boss-v1: OK");
