import assert from "node:assert/strict";
import {
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  IDLE_ADVENTURE_V47
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

// 12% (0.12) cube-root -> cbrt(0.12) ~= 0.4932. Une valeur tirée à 0.30
// (entre 0.12 et 0.4932) ne dropperait JAMAIS sans cube root, mais DOIT
// dropper avec cube root en zone Evil.
{
  const restore = forceRandom([0.30, 0.30]); // 1er tirage (equip, sans effet ici car set=""), 2e tirage (boost)
  try {
    const state = normalizeIdleAdventureStateV47({ version: IDLE_ADVENTURE_V47, selectedZone: "evilverse" });
    const { result } = applyIdleAdventureActionV47(state, { action: "zoneKill" }, { bosses: 58, difficulty: "difficile", dropMultiplier: 1 }, 1);
    assert.ok(result.drops.length > 0, "Avec cube root (Evil), un tirage à 0.30 doit dropper un boost (cbrt(0.12) ~= 0.493 > 0.30).");
  } finally {
    restore();
  }
}

// Même tirage (0.30), mais en zone Normal (tutorial, pas de requiredDifficulty) : pas de cube root, ne doit jamais dropper à 0.30 > 0.12.
{
  const restore = forceRandom([0.30, 0.30, 0.30]);
  try {
    const state = normalizeIdleAdventureStateV47({ version: IDLE_ADVENTURE_V47, selectedZone: "tutorial" });
    const { result } = applyIdleAdventureActionV47(state, { action: "zoneKill" }, { bosses: 30, dropMultiplier: 1 }, 1);
    assert.equal(result.drops.length, 0, "Sans cube root (zone Normal), un tirage à 0.30 ne doit jamais dropper (12% de base, jamais 30%+).");
  } finally {
    restore();
  }
}

console.log("idle-adventure-evil-zone-cube-root-drop: OK");
