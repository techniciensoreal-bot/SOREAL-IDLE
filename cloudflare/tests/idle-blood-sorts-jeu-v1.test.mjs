import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Lu dans le jeu (build 1260, 2026-11-16, RebirthPowerSpell / AllBloodMagicController) :
 *  - Blood Spaghetti : 1 + floor(log2(sang/10 000) + 1) x 0,01 ; Counterfeit Gold : 1 + floor((log2(sang/1e6) + 1)^2) x 0,01 ;
 *  - Iron Pill : floor(sang^0,25), plafonné à 1e8, multiplicateur des perks seulement en Evil ou plus ;
 *  - dernier sort : Sadistic seulement.
 */
const ctx = {};
function neuf(difficulty) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.difficulty = difficulty;
  s.systems.bloodMagic.unlocked = true;
  return s;
}
const lancer = (s, spell) => applyIdleNguAction(s, { action: "castBloodSpell", spell }, ctx, 1_000_000).state;

{
  const s = neuf("normal");
  s.currencies.blood = 3_000_000;
  assert.equal(lancer(s, "counterfeitGold").systems.bloodMagic.data.spells.counterfeitGold, 1 + 6 * 0.01, "(log2(3)+1)^2 = 6,68 : arrondi à 6");
  const t = neuf("normal");
  t.currencies.blood = 30_000;
  assert.equal(lancer(t, "bloodSpaghetti").systems.bloodMagic.data.spells.bloodSpaghetti, 1 + 2 * 0.01, "log2(3)+1 = 2,58 : arrondi à 2");
}
{
  const s = neuf("normal");
  s.currencies.blood = 1_000;
  assert.equal(lancer(s, "ironPill").systems.bloodMagic.data.spells.ironPill, 5, "floor(1000^0,25) = 5");
  const g = neuf("normal");
  g.currencies.blood = 1e40;
  assert.equal(lancer(g, "ironPill").systems.bloodMagic.data.spells.ironPill, 1e8, "plafond 1e8");
}
{
  const s = neuf("normal");
  s.currencies.blood = 1e23;
  assert.throws(() => lancer(s, "leeches"), /DIFFICULTE_VERROUILLEE/, "dernier sort : refusé sous Sadistic");
  const e = neuf("difficile");
  e.currencies.blood = 1e23;
  assert.throws(() => lancer(e, "leeches"), /DIFFICULTE_VERROUILLEE/, "dernier sort : refusé en Evil");
  const x = neuf("extreme");
  x.currencies.blood = 1e23;
  lancer(x, "leeches");
}
{
  const s = neuf("normal");
  s.adventure.unlockFlags.walderpFinalDefeated = true;
  s.systems.macguffins.unlocked = true;
  s.systems.macguffins.data.equipped.push({ uid: "mg1", type: "energyPower", level: 0 });
  s.systems.perks.data.levels = { 66: 1, 73: 1 };
  s.currencies.blood = 1e10;
  assert.throws(() => applyIdleNguAction(s, { action: "macguffin", op: "bloodBeta" }, ctx, 1_000_000), /./, "sort β : Evil minimum");
  s.difficulty = "difficile";
  applyIdleNguAction(s, { action: "macguffin", op: "bloodBeta" }, ctx, 1_000_000);
}

{
  /* Sans MacGuffin équipé le sort « fizzle » mais le jeu remet le sang à 0 et relance la recharge (castMacguffin1Spell / castMacguffin2Spell, build 1260, 2026-11-16). */
  const s = neuf("difficile");
  s.adventure.unlockFlags.walderpFinalDefeated = true;
  s.systems.macguffins.unlocked = true;
  s.systems.perks.data.levels = { 66: 1, 72: 1, 73: 1 };
  s.currencies.blood = 1e10;
  const T0 = 1_000_000;
  const a = applyIdleNguAction(s, { action: "macguffin", op: "bloodAlpha" }, ctx, T0);
  assert.equal(a.result.levels > 0, true, "le niveau calculé reste celui du sang");
  assert.deepEqual(a.result.touched, [], "aucun MacGuffin touché");
  assert.equal(a.state.currencies.blood, 0, "le sang est consommé");
  a.state.currencies.blood = 1e10;
  assert.throws(() => applyIdleNguAction(a.state, { action: "macguffin", op: "bloodAlpha" }, ctx, T0 + 1000), /SORT_EN_RECHARGE/, "la recharge est relancée");
  const b = applyIdleNguAction(a.state, { action: "macguffin", op: "bloodBeta" }, ctx, T0 + 1000);
  assert.deepEqual(b.result.touched, []);
  assert.equal(b.state.currencies.blood, 0);
}

console.log("idle-blood-sorts-jeu-v1: OK");
