import assert from "node:assert/strict";
import {
  advanceIdleNguState,
  idleNguAugmentationMultiplier,
  idleNguDifficultySpeedDividerV1,
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, pages "Evil difficulty"/"SADISTIC difficulty", section
 * "Differences" > "Features level slower"/"Features" : Augmentations
 * (2.5e12 Evil / 2.5e27 Sadistic), Time Machine (1e12 / 1e24), Blood
 * Magic (1e9 / 1e22) -- diviseurs de vitesse UNIFORMES, jamais cumulatifs
 * (la valeur Sadistic est déjà le total face à Normal).
 *
 * Deux niveaux de vérification :
 * 1) idleNguDifficultySpeedDividerV1 directement (valeurs exactes) --
 *    aucun test end-to-end ne peut vérifier une complétion EXACTE avec un
 *    diviseur ×1e12+ : advanceIdleNguState plafonne le temps simulable à
 *    EARLY_GAME_MAX_OFFLINE_SECONDS (30 jours), très loin des ~2e15s
 *    qu'il faudrait simuler pour compléter un niveau Evil d'Augmentations.
 * 2) Vérification qualitative : avec le temps EXACT qui complète le
 *    niveau en Normal, Evil ne doit JAMAIS compléter (le diviseur est
 *    bien lu et appliqué, pas juste défini sans être branché).
 */

assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "normal" }, "augmentations"), 1);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "difficile" }, "augmentations"), 2.5e12);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "extreme" }, "augmentations"), 2.5e27);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "difficile" }, "timeMachine"), 1e12);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "extreme" }, "timeMachine"), 1e24);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "difficile" }, "bloodMagic"), 1e9);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "extreme" }, "bloodMagic"), 1e22);
assert.equal(idleNguDifficultySpeedDividerV1({ difficulty: "normal" }, "wandoos"), 1, "Système inconnu (pas encore construit) : jamais de diviseur inventé, repli neutre à 1.");

const baseSave = (difficulty) => ({
  version: IDLE_NGU_META_VERSION,
  saveSchema: IDLE_NGU_SAVE_SCHEMA,
  difficulty,
  systems: {
    augmentations: {
      unlocked: true,
      allocation: { energy: 500 },
      data: { activePair: "scissors", trainUpgrade: false, pairs: { scissors: { level: 0, upgradeLevel: 0, progress: 0, upgradeProgress: 0 } } }
    },
    timeMachine: {
      unlocked: true,
      allocation: { energy: 500, magic: 0 },
      data: { speedLevel: 0, goldLevel: 0, speedProgress: 0, goldProgress: 0, producedThisRun: 0, bestGoldThisRun: 0, highestBossEver: 0 }
    },
    bloodMagic: {
      unlocked: true,
      allocation: { magic: 500 },
      data: { activeRitual: "tack", rituals: { tack: { progress: 0, completions: 0, level: 0 } }, spells: {} }
    }
  },
  resources: {
    energy: { power: 1, speed: 50, cap: 1e9, bars: 1, current: 1e9 },
    magic: { power: 1, speed: 50, cap: 1e9, bars: 1, current: 1e9 }
  },
  currencies: { gold: 1e30, blood: 0 }
});

const ctx = { adventurePower: 100, adventureToughness: 100, bosses: 301 };

// Temps exact pour compléter le niveau 0->1 en Normal (formules sourcées :
// scissors baseSeconds=400, constante Time Machine 1e9, ritual "tack" baseSeconds=2000).
const AUGMENT_NEEDED_NORMAL = (400 * 1000) / 500; // 800s
const TM_NEEDED_NORMAL = 1e9 / 500; // 2e6s
const BLOODMAGIC_NEEDED_NORMAL = (2000 * 1000) / 500; // 4000s

{
  const normal = advanceIdleNguState(baseSave("normal"), AUGMENT_NEEDED_NORMAL, ctx, 0);
  assert.equal(normal.systems.augmentations.data.pairs.scissors.level, 1, "Sanity : Normal doit compléter le niveau pile au temps calculé.");
  const evil = advanceIdleNguState(baseSave("difficile"), AUGMENT_NEEDED_NORMAL, ctx, 0);
  assert.equal(evil.systems.augmentations.data.pairs.scissors.level, 0, "Evil ne doit jamais compléter avec le même temps que Normal (diviseur bien lu, pas juste défini).");
}
{
  const normal = advanceIdleNguState(baseSave("normal"), TM_NEEDED_NORMAL, ctx, 0);
  assert.equal(normal.systems.timeMachine.data.speedLevel, 1, "Sanity : Normal doit compléter le niveau pile au temps calculé.");
  const evil = advanceIdleNguState(baseSave("difficile"), TM_NEEDED_NORMAL, ctx, 0);
  assert.equal(evil.systems.timeMachine.data.speedLevel, 0, "Evil ne doit jamais compléter avec le même temps que Normal.");
}
{
  const normal = advanceIdleNguState(baseSave("normal"), BLOODMAGIC_NEEDED_NORMAL, ctx, 0);
  assert.equal(normal.systems.bloodMagic.data.rituals.tack.completions, 1, "Sanity : Normal doit compléter le rituel pile au temps calculé.");
  const evil = advanceIdleNguState(baseSave("difficile"), BLOODMAGIC_NEEDED_NORMAL, ctx, 0);
  assert.equal(evil.systems.bloodMagic.data.rituals.tack.completions, 0, "Evil ne doit jamais compléter avec le même temps que Normal.");
}

// --- Augmentations : diviseur additionnel Sadistic sur le multiplicateur (force), jamais sur Evil ---
{
  const withLevel = (difficulty) => {
    const save = baseSave(difficulty);
    save.systems.augmentations.data.pairs.scissors.level = 100;
    return save;
  };
  const normal = idleNguAugmentationMultiplier(withLevel("normal"));
  const evil = idleNguAugmentationMultiplier(withLevel("difficile"));
  const sadistic = idleNguAugmentationMultiplier(withLevel("extreme"));
  assert.equal(evil, normal, "Evil ne doit jamais avoir le diviseur additionnel de force (uniquement documenté sur la page SADISTIC).");
  assert.ok(sadistic < normal, "Sadistic doit réduire le multiplicateur final (diviseur additionnel 1e12).");
  assert.ok(sadistic >= 1, "Le multiplicateur reste toujours plancher à 1 (wiki : floored at 1).");
}

console.log("idle-difficulty-augment-tm-bloodmagic-slowdown: OK");
