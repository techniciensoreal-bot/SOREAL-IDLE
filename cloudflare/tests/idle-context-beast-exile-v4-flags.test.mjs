import assert from "node:assert/strict";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";

const { contexteMetaNguSorealIdle_ } = idleRuntimeTestHooks;

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * beastBrutalDefeated/exileBrutalDefeated (idle-adventure-v47.js::titan(),
 * s.unlockFlags) vivent dans l'état Aventure, imbriqué sous
 * metaNgu.adventure -- ce test verrouille que contexteMetaNguSorealIdle_
 * les expose bien comme beastV4Beaten/exileV4Beaten, le pont utilisé par
 * idleNguDifficultyUnlockRequirementsV1 (idle-ngu-progression.js) pour
 * les conditions de déblocage Evil/Sadistic.
 */

// --- Absent/malformé : false par défaut, jamais un crash ni un repli qui débloquerait à tort ---
{
  const contexte = contexteMetaNguSorealIdle_([], {}, {});
  assert.equal(contexte.beastV4Beaten, false);
  assert.equal(contexte.exileV4Beaten, false);
}
{
  const contexte = contexteMetaNguSorealIdle_([], { metaNgu: { adventure: null } }, {});
  assert.equal(contexte.beastV4Beaten, false, "adventure malformé (null) ne doit jamais planter, juste rester false.");
}

// --- Flags posés : correctement exposés ---
{
  const stats = { metaNgu: { adventure: { unlockFlags: { beastBrutalDefeated: true } } } };
  const contexte = contexteMetaNguSorealIdle_([], stats, {});
  assert.equal(contexte.beastV4Beaten, true);
  assert.equal(contexte.exileV4Beaten, false, "Un flag ne doit jamais en activer un autre.");
}
{
  const stats = { metaNgu: { adventure: { unlockFlags: { exileBrutalDefeated: true } } } };
  const contexte = contexteMetaNguSorealIdle_([], stats, {});
  assert.equal(contexte.exileV4Beaten, true);
  assert.equal(contexte.beastV4Beaten, false);
}

console.log("idle-context-beast-exile-v4-flags: OK");
