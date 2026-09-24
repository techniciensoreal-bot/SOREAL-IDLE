import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Blood Magic », tableau des sorts :
 * Iron Pill 11,5 h ; Blood MacGuffin α 23,5 h ; Blood MacGuffin β 1 jour et
 * 23,5 h. Ce sont les recharges de TROIS sorts. L'ancien code les avait prises
 * pour une recharge de l'Iron Pill selon la difficulté (Evil 23,5 h, Sadistic
 * 47,5 h). Un ancien test n'existait pas ; la recharge de l'Iron Pill est de
 * 11,5 h dans les trois difficultés.
 */
const H = 3600000;
for (const difficulty of ["normal", "difficile", "extreme"]) {
  const s = normalizeIdleNguState({ difficulty }, {}, 1_000_000);
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = 10000;
  const r = applyIdleNguAction(s, { action: "castBloodSpell", spell: "ironPill" }, {}, 1_000_000).state;
  assert.equal(r.difficulty, difficulty);
  assert.equal(r.systems.bloodMagic.data.spells.ironPillReadyAt, 1_000_000 + 11.5 * H, `Iron Pill : 11,5 h en ${difficulty}`);
}
console.log("idle-blood-magic-iron-pill-cooldown: OK");
