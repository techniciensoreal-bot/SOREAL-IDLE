import assert from "node:assert/strict";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-09-14) : "Mes PV en mode aventure doivent démarrer à
 * 50... là je suis à 703M, ça n'est pas normal."
 *
 * Cause confirmée : contexteMetaNguSorealIdle_ alimentait
 * adventurePower/adventureToughness (consommés par
 * idleAdventureCombatStatsV1 pour Power/Toughness/HP/Regen de combat,
 * ET par l'ITOPOD) avec le Basic Training Attack/Defense — le NUMBER
 * principal, en dizaines/centaines de millions dès le milieu de partie.
 * Vérifié sur le wiki NGU (page Adventure Mode) : c'est l'inverse —
 * "for every point of Power/Toughness from your gear, you also get +1%
 * Attack/Defense" (l'équipement d'Aventure influence le NUMBER, jamais
 * le contraire). Power/Toughness/HP d'Aventure ne doivent donc plus
 * jamais dépendre du Basic Training.
 */
const { contexteMetaNguSorealIdle_ } = idleRuntimeTestHooks;

// Un joueur avec un Basic Training TRÈS développé (attaque/défense énormes,
// exactement le scénario qui faisait exploser les PV d'Aventure) ne doit
// plus jamais faire fuiter cette valeur vers adventurePower/adventureToughness.
const stats = {
  entrainementBase: {
    allocations: {},
    skills: [
      { id: "attaque_force", level: 100000000 },
      { id: "defense_endurance", level: 100000000 }
    ]
  }
};
const contexte = contexteMetaNguSorealIdle_([], stats, {});

assert.equal(
  contexte.adventurePower,
  undefined,
  "adventurePower ne doit plus jamais être alimenté depuis le Basic Training — il doit être absent ici (les vrais consommateurs ont déjà leur propre repli à 1, gear-only)."
);
assert.equal(
  contexte.adventureToughness,
  undefined,
  "adventureToughness ne doit plus jamais être alimenté depuis le Basic Training, même chose."
);
assert.ok(
  "attackTrainingLevels" in contexte,
  "attackTrainingLevels (utilisé par le vrai NUMBER, jamais par l'Aventure) doit rester présent et inchangé."
);

console.log("idle-adventure-power-not-from-basic-training: OK");
