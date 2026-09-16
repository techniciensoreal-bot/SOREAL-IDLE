import assert from "node:assert/strict";
import { idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (répété plusieurs fois, dont 2026-09-16) : "Le regen n'est
 * toujours pas à 1/s dès le début du mode aventure." Cause réelle :
 * contexteMetaNguSorealIdle_ (idle-sqlite-runtime.js) n'alimente JAMAIS
 * adventurePower/adventureToughness (fix du 2026-09-14, voir
 * idle-adventure-power-not-from-basic-training.test.mjs) — donc pour un
 * joueur sans encore aucun équipement d'Aventure, idleAdventureCombatStatsV1
 * recevait context.adventureToughness===undefined, repli à 1, PUIS
 * multipliait ce 1 par 0.03 → un plancher réel de 0.03/s, jamais 1/s.
 * Le plancher doit désormais s'appliquer sur le REGEN final (après la
 * multiplication), jamais sur le toughness d'entrée.
 */

// Contexte réel d'un joueur tout frais : aucune valeur adventurePower/
// adventureToughness externe (exactement ce que contexteMetaNguSorealIdle_
// produit réellement, cf. test compagnon).
const ctxFrais = { bosses: 0 };

const snap = idleNguSnapshot(null, ctxFrais, 1);

assert.equal(
  snap.adventure.stats.regen,
  1,
  "Un joueur sans aucun équipement d'Aventure doit avoir un regen de 1/s dès le début, jamais 0.03/s (plancher toughness=1 écrasé par le ×0.03)."
);

// HP reste correct (floor power=1 -> hp=1*3=3), le regen est le SEUL champ
// dont le plancher doit être appliqué après la multiplication.
assert.equal(snap.adventure.stats.hp, 3, "HP de base doit rester Power(1)×3=3, comportement inchangé.");

// Avec de vraies stats d'équipement d'Aventure (context alimenté), le
// plancher ne doit jamais réduire un regen déjà supérieur à 1.
const ctxEquipe = { adventurePower: 100, adventureToughness: 100, bosses: 4 };
const snapEquipe = idleNguSnapshot(null, ctxEquipe, 1);
assert.equal(
  snapEquipe.adventure.stats.regen,
  3,
  "Avec un vrai adventureToughness=100, le regen doit rester 100×0.03=3 — le plancher à 1 ne doit jamais l'écraser."
);

console.log("idle-adventure-regen-floor-one: OK");
