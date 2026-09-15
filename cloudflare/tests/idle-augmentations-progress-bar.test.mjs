import assert from "node:assert/strict";
import {
  idleNguSnapshot,
  advanceIdleNguState,
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA
} from "../src/idle-ngu-progression.js";
import { IDLE_ADVENTURE_V47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-13) : "Le menu augmentation ne possède pas de barres qui
 * montent comme dans basic training. Il faut corriger ça. Tout repose sur
 * ces barres qui vont de plus en plus vite."
 *
 * Cause racine : le snapshot n'exposait que level/upgradeLevel (un entier
 * qui saute d'un coup), jamais la progression continue accumulée
 * (pair.progress/upgradeProgress) vers le niveau suivant — contrairement à
 * Basic Training qui expose déjà skill.progress (0-1) pour animer sa
 * barre. progressPct/upgradeProgressPct réutilisent la vraie formule de
 * temps qui fait réellement progresser le niveau
 * (augmentationSecondsForNextLevel), jamais un second calcul inventé.
 */

function freshSnapshot(bosses) {
  return idleNguSnapshot(
    {
      version: IDLE_NGU_META_VERSION,
      saveSchema: IDLE_NGU_SAVE_SCHEMA,
      systems: {
        augmentations: {
          unlocked: true,
          allocation: { energy: 500 },
          data: {
            activePair: "scissors",
            trainUpgrade: false,
            pairs: { scissors: { level: 0, upgradeLevel: 0, progress: 0, upgradeProgress: 0 } }
          }
        }
      },
      resources: { energy: { power: 1, speed: 50, cap: 500, bars: 1, current: 500 } }
    },
    { adventurePower: 100, adventureToughness: 100, bosses: Math.max(17, bosses || 17) }
  );
}

// --- Chaque définition expose une fraction de progression exploitable pour une barre ---
{
  const snap = freshSnapshot(17);
  assert.ok(Array.isArray(snap.augmentations) && snap.augmentations.length > 0);
  const scissors = snap.augmentations.find((x) => x.id === "scissors");
  assert.ok(scissors, "La définition scissors doit exister.");
  assert.ok(typeof scissors.progressPct === "number", "progressPct doit être un nombre exploitable directement pour une largeur de barre.");
  assert.ok(scissors.progressPct >= 0 && scissors.progressPct <= 1, "progressPct doit toujours rester une fraction 0-1, jamais un pourcentage brut ni une valeur hors bornes.");
  assert.ok(typeof scissors.upgradeProgressPct === "number");
}

// --- La progression avance réellement avec le temps, jamais figée à 0 ---
{
  const raw = {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      augmentations: {
        unlocked: true,
        allocation: { energy: 500 },
        data: {
          activePair: "scissors",
          trainUpgrade: false,
          pairs: { scissors: { level: 0, upgradeLevel: 0, progress: 0, upgradeProgress: 0 } }
        }
      }
    },
    resources: { energy: { power: 1, speed: 50, cap: 500, bars: 1, current: 500 } },
    updatedAt: Date.now() - 5000
  };
  const snap = idleNguSnapshot(raw, { adventurePower: 100, adventureToughness: 100, bosses: 17 }, Date.now());
  const scissors = snap.augmentations.find((x) => x.id === "scissors");
  assert.ok(
    scissors.progressPct > 0 || scissors.level > 0,
    "Après 5 secondes d'allocation réelle, la barre doit avoir progressé (ou le niveau déjà monté) — jamais rester figée à 0 comme avant ce correctif."
  );
}

// --- Bug racine trouvé en creusant : sans assez d'Or, la progression restait bloquée à 0 pour toujours ---
{
  const raw = {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    systems: {
      augmentations: {
        unlocked: true,
        allocation: { energy: 500 },
        data: {
          activePair: "scissors",
          trainUpgrade: false,
          pairs: { scissors: { level: 0, upgradeLevel: 0, progress: 0, upgradeProgress: 0 } }
        }
      }
    },
    resources: { energy: { power: 1, speed: 50, cap: 500, bars: 1, current: 500 } },
    currencies: { gold: 0 }
  };
  const after = advanceIdleNguState(raw, 500, { adventurePower: 100, adventureToughness: 100, bosses: 17 }, Date.now());
  assert.ok(
    after.systems.augmentations.data.pairs.scissors.progress > 0,
    "Sans Or, la progression doit quand même s'accumuler avec le temps investi — jamais rester bloquée à 0 comme avant ce correctif."
  );
  assert.equal(
    after.systems.augmentations.data.pairs.scissors.level, 0,
    "Sans Or, le niveau ne doit jamais monter (l'Or reste requis pour VALIDER un niveau) — seule la progression doit s'accumuler."
  );
}

console.log("idle-augmentations-progress-bar: OK");
