import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguDifficultyUnlockRequirementsV1,
  calculateIdleNguNextNumber
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "Il faut tout faire, de toutes façons" (fidélité
 * Evil/Sadistic avec NGU Idle). Ce test couvre le socle (Phase 1) :
 * persistance de state.difficulty, difficultyPeaks par difficulté réelle,
 * conditions de déblocage (wiki local, pages "Evil difficulty"/"SADISTIC
 * difficulty"), et le changement de difficulté lui-même (reset number à 1,
 * banks vidées, comme "starting a challenge"). Le diviseur ×1e-30 sur les
 * stats de combat des boss et le branchement dans le moteur de combat réel
 * (idle-sqlite-runtime.js) restent hors périmètre de ce test (Phase
 * suivante).
 */

// --- Bug corrigé : state.difficulty était écrasé à "normal" à chaque sync ---
{
  let state = normalizeIdleNguState(null, { bosses: 0 }, 0);
  assert.equal(state.difficulty, "normal", "Un joueur neuf démarre en difficulté normale.");
  state.difficulty = "difficile"; // simule une sauvegarde où le joueur est déjà en Evil
  const resynced = normalizeIdleNguState(state, { bosses: 10 }, 1000);
  assert.equal(resynced.difficulty, "difficile", "state.difficulty doit survivre à un re-sync, jamais réinitialisé en dur à normal.");
}

// --- difficultyPeaks suit la difficulté RÉELLEMENT active, jamais toujours "normal" ---
{
  let state = normalizeIdleNguState(null, { bosses: 0 }, 0);
  state.difficulty = "difficile";
  state = normalizeIdleNguState(state, { bosses: 50 }, 1000);
  assert.equal(state.difficultyPeaks.difficile, 50, "Le pic doit s'enregistrer sous la clé de la difficulté active (difficile), pas sous normal.");
  assert.equal(state.difficultyPeaks.normal, 0, "Le pic 'normal' ne doit pas bouger pendant une run en Evil.");
}

// --- Conditions de déblocage : les 3 doivent être réunies, aucun repli inventé ---
{
  const state = normalizeIdleNguState(null, { bosses: 301 }, 0);
  state.difficultyPeaks.normal = 301;

  const noneMet = idleNguDifficultyUnlockRequirementsV1(state, {});
  assert.equal(noneMet.difficile.met, false, "Sans richJerksItopodBonusPct ni beastV4Beaten fournis par l'appelant, Evil doit rester verrouillé.");
  assert.equal(noneMet.difficile.bossReady, true, "Le seul critère calculable ici (boss 301) doit lui être vrai.");

  const partial = idleNguDifficultyUnlockRequirementsV1(state, { richJerksItopodBonusPct: 1e6 });
  assert.equal(partial.difficile.met, false, "beastV4Beaten manquant doit encore bloquer Evil, même avec le seuil Rich Jerks atteint.");

  const allMet = idleNguDifficultyUnlockRequirementsV1(state, { richJerksItopodBonusPct: 1e6, beastV4Beaten: true });
  assert.equal(allMet.difficile.met, true, "Les 3 conditions réunies (boss 301, Rich Jerks x ITOPOD >= 1M%, Beast v4) doivent débloquer Evil.");
}

// --- L'action "difficulty" applique le vrai gate, jamais un accès libre ---
{
  const state = normalizeIdleNguState(null, { bosses: 301 }, 0);
  state.difficultyPeaks.normal = 301;
  state.runStartedAt = 0;

  assert.throws(
    () => applyIdleNguAction(state, { action: "difficulty", value: "difficile" }, { bosses: 301 }, 4 * 60 * 1000),
    /DIFFICULTE_VERROUILLEE/,
    "Sans les prérequis Rich Jerks/Beast v4, choisir 'difficile' doit échouer, jamais réussir silencieusement."
  );
}

// --- Une fois débloqué, le changement de difficulté réinitialise number à 1 et vide les banks ---
{
  let state = normalizeIdleNguState(null, { bosses: 301 }, 0);
  state.difficultyPeaks.normal = 301;
  state.runStartedAt = 0;
  state.rebirth.number = 999;
  state.bank.advancedTraining = 42;

  const ctx = { bosses: 301, richJerksItopodBonusPct: 1e6, beastV4Beaten: true };
  const { state: after, result } = applyIdleNguAction(state, { action: "difficulty", value: "difficile" }, ctx, 4 * 60 * 1000);

  assert.equal(result.difficulty, "difficile", "Le résultat doit confirmer la nouvelle difficulté.");
  assert.equal(after.difficulty, "difficile", "state.difficulty doit être mis à jour.");
  assert.equal(after.rebirth.number, 1, "Wiki : un changement de difficulté réinitialise NUMBER à 1, comme un défi.");
  assert.equal(after.bank.advancedTraining, 0, "Wiki : les niveaux en banque sont perdus lors d'un changement de difficulté.");

  assert.throws(
    () => applyIdleNguAction(after, { action: "difficulty", value: "difficile" }, ctx, 5 * 60 * 1000),
    /DIFFICULTE_DEJA_ACTIVE/,
    "Choisir la difficulté déjà active ne doit rien faire (jamais un second reset de number/banks gratuit)."
  );
}

// --- Formule de nombre de renaissance : 2^boss (normal) / 1.5^boss (Evil) / 1.2^boss (Sadistic) ---
{
  const bosses = 50;
  const normal = calculateIdleNguNextNumber({ difficulty: "normal", bosses });
  const evil = calculateIdleNguNextNumber({ difficulty: "difficile", bosses });
  const sadistic = calculateIdleNguNextNumber({ difficulty: "extreme", bosses });
  const relClose = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300) < 1e-9;
  assert.ok(relClose(normal.factors.currentBossFactor, Math.pow(2, bosses)), "Normal doit rester 2^boss.");
  assert.ok(relClose(evil.factors.currentBossFactor, Math.pow(1.5, bosses)), "Wiki Evil difficulty : 1.5^boss, pas 2^boss.");
  assert.ok(relClose(sadistic.factors.currentBossFactor, Math.pow(1.2, bosses)), "Wiki SADISTIC difficulty : 1.2^boss, pas 2^boss ni 1.5^boss.");
}

console.log("idle-difficulty-evil-sadistic-skeleton: OK");
