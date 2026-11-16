import assert from "node:assert/strict";
import fs from "node:fs";
import {
  normalizeIdleNguState,
  idleNguDifficultyUnlockRequirementsV1
} from "../src/idle-ngu-progression.js";
import { applyRebirthResetV56_ } from "../src/idle-ngu-actions.js";

/*
 * Audit du code du jeu (build 1260, 2026-11-16, design/audit-code-jeu/boss-at-rebirth.md) : écarts E2, E6, E7, E10.
 */

/* E6 : Evil et Sadistic exigent highestBoss / highestHardBoss >= 300 (et non 301). */
{
  const state = normalizeIdleNguState(null, { bosses: 300 }, 0);
  state.difficultyPeaks.normal = 299;
  state.difficultyPeaks.difficile = 299;
  let r = idleNguDifficultyUnlockRequirementsV1(state, {});
  assert.equal(r.difficile.bossReady, false);
  assert.equal(r.extreme.bossReady, false);
  state.difficultyPeaks.normal = 300;
  state.difficultyPeaks.difficile = 300;
  r = idleNguDifficultyUnlockRequirementsV1(state, {});
  assert.equal(r.difficile.bossReady, true, "Evil : 300 boss vaincus suffisent");
  assert.equal(r.extreme.bossReady, true, "Sadistic : 300 boss vaincus en Evil suffisent");
}

/* E10 : les AP du rebirth (secondes - 3600) / 500 sont versés aussi au démarrage d'un défi. */
{
  for (const options of [{}, { challengeId: "twentyFourHours", forceNumber: 1 }]) {
    const s = normalizeIdleNguState(null, { bosses: 10 }, 0);
    s.runStartedAt = 0;
    const avant = s.currencies.ap;
    applyRebirthResetV56_(s, { bosses: 10 }, 7200 * 1000, options);
    assert.ok(s.currencies.ap - avant >= 7, "7 AP au moins pour 7200 s de rebirth (" + JSON.stringify(options) + ")");
  }
}

/* E2, E7 : câblage dans le moteur (lecture de source, la partie de référence couvre le reste). */
{
  const combat = fs.readFileSync(new URL("../src/idle-runtime-combat.js", import.meta.url), "utf8");
  assert.ok(combat.includes("nukeArretBossInedit_(stats, bossVaincus, bossDepartNukeV1)) break") && combat.includes("bossVaincus >= 124) return false"), "NUKE : s'arrête sur un boss d'index < 124 jamais vaincu en Normal");
  const ngu = fs.readFileSync(new URL("../src/idle-ngu-etat.js", import.meta.url), "utf8");
  assert.ok(ngu.includes("difficultyPeaks?.extreme, 0) >= 301) idleTheEndGrantV1(adv, 487"), "objet 487 : après le 301e boss en Sadistic");
}

console.log("idle-audit-boss-code-jeu-v1: OK");
