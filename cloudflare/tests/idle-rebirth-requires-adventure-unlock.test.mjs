import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  rebirthIdleNguState,
  REBIRTH_UNLOCK_BOSS_V1
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-16) : "je vois que le rebirth n'est supposé se
 * déverrouiller qu'à ce moment là [tutoriel Aventure] alors que dans
 * SOREAL IDLE on l'a direct." Confirmé sur le tutoriel réel NGU (page
 * Adventure_Mode/Tutorial Zone) : le déblocage d'Aventure (boss 4) est
 * immédiatement suivi de "You've also unlocked REBIRTHS, which needs
 * some explanation." Le Rebirth n'existe donc pas avant ce point dans le
 * vrai jeu — SOREAL le laissait disponible dès le début, corrigé ici.
 */

assert.equal(REBIRTH_UNLOCK_BOSS_V1, 4, "Le seuil doit rester le boss 4 (déblocage Aventure), jamais un autre chiffre inventé.");

function fresh(context, now) {
  return normalizeIdleNguState(null, context, now);
}

{
  // Avant le boss 4 : le Rebirth doit être bloqué, même après 3 minutes de run.
  const context = { bosses: 0 };
  let state = fresh(context, 0);
  state.runStartedAt = 0;
  assert.throws(
    () => rebirthIdleNguState(state, context, 4 * 60 * 1000),
    /REBIRTH_VERROUILLEE_AVENTURE/,
    "Le Rebirth ne doit jamais être permis avant d'avoir battu le boss 4 (déblocage Aventure)."
  );
}

{
  // Juste avant le seuil (boss 3) : toujours bloqué.
  const context = { bosses: REBIRTH_UNLOCK_BOSS_V1 - 1 };
  let state = fresh(context, 0);
  state.runStartedAt = 0;
  assert.throws(
    () => rebirthIdleNguState(state, context, 4 * 60 * 1000),
    /REBIRTH_VERROUILLEE_AVENTURE/
  );
}

{
  // Au seuil exact (boss 4) et après le délai minimum : autorisé.
  const context = { bosses: REBIRTH_UNLOCK_BOSS_V1 };
  let state = fresh(context, 0);
  state.runStartedAt = 0;
  const reborn = rebirthIdleNguState(state, context, 4 * 60 * 1000);
  assert.ok(reborn, "Le Rebirth doit réussir dès le boss 4 atteint, sans autre condition inventée.");
}

{
  // Le snapshot client (canRebirth) doit refléter le même seuil, pas un second calcul.
  const context = { bosses: 0 };
  let state = fresh(context, 0);
  state.runStartedAt = 0;
  const early = normalizeIdleNguState(state, context, 4 * 60 * 1000);
  assert.equal(early.rebirth.canRebirth, false, "canRebirth doit rester false avant le boss 4, même après le délai de 3 minutes.");

  const contextUnlocked = { bosses: REBIRTH_UNLOCK_BOSS_V1 };
  const unlocked = normalizeIdleNguState(state, contextUnlocked, 4 * 60 * 1000);
  assert.equal(unlocked.rebirth.canRebirth, true, "canRebirth doit devenir true dès le boss 4 atteint et le délai passé.");
}

console.log("idle-rebirth-requires-adventure-unlock: OK");
