import assert from "node:assert/strict";
import {
  idleNguSnapshot,
  advanceIdleNguState,
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA
} from "../src/idle-ngu-progression.js";

/*
 * Audit 2026-09-16 : le Time Machine (ngu-time-machine.md) exige "Energy
 * and Magic allocation, plus Gold, to level up", avec un coût qui
 * "scale linéairement" (niveau N-1->N coûte N fois le coût 0->1). Deux
 * bugs réels trouvés :
 *  1. tmLevelSeconds ne dépendait jamais du niveau visé (temps constant),
 *     et son numérateur (1000) était 1 000 000 fois trop petit par
 *     rapport à la référence wiki (1 Power + 1000 de cap alloué =
 *     1 000 000 s pour le niveau 0->1) — chaque niveau montait quasi
 *     instantanément (~1s).
 *  2. Aucun Or n'était jamais prélevé pour valider un niveau.
 * Corrigé en suivant exactement le patron déjà établi pour les
 * Augmentations (idle-augmentations-progress-bar.test.mjs) : la barre
 * accumule toujours le temps investi, mais un niveau ne se valide que si
 * l'Or est disponible — jamais de progression perdue, jamais de niveau
 * gratuit.
 */

function baseState(overrides = {}) {
  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      timeMachine: {
        unlocked: true,
        allocation: { energy: 1000, magic: 0 },
        data: {
          speedLevel: 0, speedProgress: 0,
          goldLevel: 0, goldProgress: 0,
          bestGoldThisRun: 0, highestBossEver: 30, producedThisRun: 0
        }
      }
    },
    resources: {
      energy: { power: 1, speed: 50, cap: 1000, bars: 1, current: 1000 },
      magic: { power: 1, speed: 50, cap: 1000, bars: 1, current: 1000 }
    },
    currencies: { gold: 0 },
    ...overrides
  };
}

// --- Sans Or, la progression s'accumule mais aucun niveau ne monte gratuitement ---
{
  const raw = baseState({ currencies: { gold: 0 } });
  // Au repère wiki (1 Power, 1000 alloués), le niveau 0->1 vaut 1 000 000s.
  // 500 000s = la moitié du chemin : la barre doit progresser sans jamais valider le niveau, quel que soit l'Or.
  const after = advanceIdleNguState(raw, 500000, { adventurePower: 100, adventureToughness: 100, bosses: 30 }, Date.now());
  assert.ok(
    after.systems.timeMachine.data.speedProgress > 0,
    "Sans Or, le temps investi doit quand même faire progresser la barre."
  );
  assert.equal(
    after.systems.timeMachine.data.speedLevel, 0,
    "Sans Or, le niveau ne doit jamais monter gratuitement (régression trouvée par l'audit)."
  );
}

// --- Avec assez d'Or et assez de temps (repère wiki : 1 000 000s pour 0->1), le niveau monte et l'Or est prélevé ---
{
  const raw = baseState({ currencies: { gold: 10000000 } });
  const after = advanceIdleNguState(raw, 1000000, { adventurePower: 100, adventureToughness: 100, bosses: 30 }, Date.now());
  assert.equal(
    after.systems.timeMachine.data.speedLevel, 1,
    "Au repère wiki exact (1 Power, 1000 alloués, 1 000 000s), le niveau 0->1 doit être atteint."
  );
  assert.ok(
    after.currencies.gold <= 10000000 - 5000000 + 1,
    "Le coût en Or du niveau 0->1 (5 000 000, cf. ngu-time-machine.md) doit être réellement prélevé, jamais un niveau gratuit."
  );
}

// --- Le coût en temps ET en Or grandit avec le niveau (scaling linéaire par N) ---
// Allocation ×10 par rapport au repère wiki (10 000 au lieu de 1 000) pour
// que le temps requis (base 100 000s à ce rythme) reste sous le plafond
// général de rattrapage hors-ligne de advanceIdleNguState (30 jours =
// 2 592 000s), sans quoi ce plafond — sans rapport avec ce correctif —
// fausserait le test.
{
  const raw = baseState({
    currencies: { gold: 100000000 },
    systems: { timeMachine: { unlocked: true, allocation: { energy: 10000, magic: 0 }, data: { speedLevel: 4, speedProgress: 0, goldLevel: 0, goldProgress: 0, bestGoldThisRun: 0, highestBossEver: 30, producedThisRun: 0 } } }
  });
  // Passer du niveau 4 à 5 (N=5) doit coûter 5x le temps de base (base=100 000s ici), jamais le temps constant de la base seule.
  const notEnough = advanceIdleNguState(raw, 100000, { adventurePower: 100, adventureToughness: 100, bosses: 30 }, Date.now());
  assert.equal(
    notEnough.systems.timeMachine.data.speedLevel, 4,
    "100 000s (1x la base) ne doit jamais suffire à monter du niveau 4 au niveau 5 (coût qui scale par N, pas un coût constant)."
  );
  const enough = advanceIdleNguState(raw, 500000, { adventurePower: 100, adventureToughness: 100, bosses: 30 }, Date.now());
  assert.equal(
    enough.systems.timeMachine.data.speedLevel, 5,
    "500 000s (5x la base, niveau cible 5) doit suffire à monter du niveau 4 au niveau 5."
  );
}

console.log("idle-time-machine-gold-cost-and-scaling: OK");
