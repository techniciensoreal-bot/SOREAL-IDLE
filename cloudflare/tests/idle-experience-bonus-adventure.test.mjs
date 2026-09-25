import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, pages « Experience » (Gain Experience),
 * « Yggdrasil » (Nerdy Formulas) et « Perk Points » :
 *  - « EXPBonus is bonus applied to all experience gain » (NGU EXP x (1+Red
 *    Heart) x Fibonacci 987 x Digger EXP x Hacks EXP x Wish 61 x Cooking EXP) :
 *    l'EXP de l'aventure (titans, boss de zone, completion d'objets) etait
 *    creditee brute.
 *  - « Bonus Titan EXP! » : « For each level of this perk, the first 3 kills of
 *    each titan, each rebirth will grant +50% extra EXP ... level 2 ... first 6 »
 *    (bonus exporte mais jamais lu).
 * Titan 1 (Gordon Ramsay Bolton) : 35 EXP de base (test titan wiki).
 */
const ctx = { bosses: 58, stats: { power: 1300, toughness: 1300 } };
const T = 10_000_000;

function tuerT1(state, t) {
  const old = Math.random;
  Math.random = () => 0.999999;
  try {
    return applyIdleNguAction(state, { action: "adventure", adventure: { action: "titan", titan: "t1", difficulty: "easy" } }, ctx, t).state;
  } finally { Math.random = old; }
}
function neuf(mutate) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, T);
  mutate?.(s);
  return s;
}
const exp = (s) => s.currencies.experience;

/* Sans bonus : 35 EXP. */
{
  const s = tuerT1(neuf(), T);
  assert.equal(exp(s), 35);
}

/* Bonus d'EXP global : Fibonacci 987 (+5 %) + souhait 61 (+0,5 %/niveau). Ici : souhait 61 niveau 10 = x1,05. */
{
  const s = tuerT1(neuf((x) => { x.systems.wishes.data.tracks["61"].level = 10; }), T);
  assert.ok(Math.abs(exp(s) - 35 * 1.05) < 1e-9, `EXP x1,05 : ${exp(s)}`);
}

/* Bonus Titan EXP! niveau 1 : les 3 premieres morts du titan (par Rebirth) valent x1,5. */
{
  let s = neuf((x) => { x.systems.perks.data.levels[34] = 1; });
  const gains = [];
  for (let i = 0; i < 4; i += 1) {
    const before = exp(s);
    /* Le titan reapparait (cooldown) : on remet son horloge a zero entre les morts. */
    s.adventure.titans.t1 = Object.assign({}, s.adventure.titans.t1 || {}, { nextAt: 0 });
    s = tuerT1(s, T + i * 1000);
    gains.push(exp(s) - before);
  }
  assert.deepEqual(gains.map((g) => Math.round(g * 100) / 100), [53, 53, 53, 35], "3 premieres morts x1,5 puis normal");

  /* Nouveau Rebirth : le compteur repart. */
  s.currencies.experience = 0;
  s = rebirthIdleNguState(s, { bosses: 58 }, T + 4 * 3600 * 1000);
  s.adventure.titans.t1 = Object.assign({}, s.adventure.titans.t1 || {}, { nextAt: 0 });
  const before = exp(s);
  s = tuerT1(s, T + 4 * 3600 * 1000 + 1000);
  assert.ok(Math.abs(exp(s) - before - 53) < 1e-9, "apres un Rebirth, la premiere mort re-beneficie du bonus");
}
{
  /* Niveau 2 : les 6 premieres. */
  let s = neuf((x) => { x.systems.perks.data.levels[34] = 2; });
  const gains = [];
  for (let i = 0; i < 7; i += 1) {
    const before = exp(s);
    s.adventure.titans.t1 = Object.assign({}, s.adventure.titans.t1 || {}, { nextAt: 0 });
    s = tuerT1(s, T + i * 1000);
    gains.push(Math.round((exp(s) - before) * 100) / 100);
  }
  assert.deepEqual(gains, [53, 53, 53, 53, 53, 53, 35]);
}
console.log("idle-experience-bonus-adventure: OK");
