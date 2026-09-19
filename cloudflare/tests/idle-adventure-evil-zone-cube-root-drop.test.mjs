import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  IDLE_ADVENTURE_V47,
  idleAdventureDropChanceV2
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "Evil difficulty", section "Differences" > "Drop
 * chance" : "Only cube root of drop chance applies for zones and titans
 * unlocked in evil difficulty." Aucune règle équivalente documentée sur
 * la page "SADISTIC difficulty" -- jamais étendue par extrapolation.
 *
 * evilverse.set==="" (Phase 5 : sets Evil pas encore construits), donc le
 * tirage d'équipement (22%) ne peut jamais rien droper ici -- ce test
 * verrouille le tirage BOOST (12%) à la place, seul tirage qui ne dépend
 * d'aucun set.
 */

function forceRandom(sequence) {
  let i = 0;
  const original = Math.random;
  Math.random = () => sequence[Math.min(i++, sequence.length - 1)];
  return () => { Math.random = original; };
}

// La règle cube-root est désormais centralisée dans idleAdventureDropChanceV2.
// On verrouille directement la formule au lieu de dépendre du nombre de tirages
// RNG internes d'une table de loot qui évolue par zone.
assert.ok(
  idleAdventureDropChanceV2(.12,1,8,{id:"evilverse",requiredDifficulty:"difficile"})>.30,
  "En zone Evil, la racine cubique du multiplicateur doit permettre un seuil supérieur à 30% dans ce cas de référence."
);
assert.equal(
  idleAdventureDropChanceV2(.12,1,1,{id:"tutorial"}),
  .12,
  "Une zone Normal conserve son taux de base sans racine cubique."
);

console.log("idle-adventure-evil-zone-cube-root-drop: OK");
