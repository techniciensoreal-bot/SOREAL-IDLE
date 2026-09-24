import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Arbitrary Points » : « Arbitrary points
 * gained from all sources, except for ITOPOD kills and Special Prize, can be
 * increased by : achievements, My Yellow Heart, Fibonacci Perk level 89 (2%) ...
 * the final AP value is rounded down to nearest integer » ; page « Money Pit » :
 * « The pit also rewards AP using the formula log10(gold) ».
 * Avant : le Money Pit ne recevait aucun de ces bonus, Daily Spin / defis /
 * Fruit of Arbitrariness le Yellow Heart seul.
 */
const ctx = { bosses: 100 };
const FIBONACCI = 94; /* « The Fibonacci Perk » (idle-perks-v1.js) : niveau 89 -> +2 % d'AP */
function neuf(perk89) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.moneyPit.unlocked = true;
  if (perk89) s.systems.perks.data.levels[FIBONACCI] = 89;
  return s;
}

/* Money Pit : 1e50 d'or -> floor(log10) = 50 AP de base ; x1,02 -> 51. */
for (const [perk89, attendu] of [[false, 50], [true, 51]]) {
  const s = neuf(perk89);
  s.currencies.gold = 1e50;
  const r = applyIdleNguAction(s, { action: "moneyPit" }, ctx, 10_000_000);
  assert.equal(r.result.reward.ap, attendu, `Money Pit, Fibonacci 89 = ${perk89}`);
  assert.equal(r.state.currencies.ap, attendu);
}

/* Rebirth de plus d'1 h : 1 AP par 500 s -> 50 AP pour 25 000 s ; x1,02 -> 51 (arrondi inferieur). */
for (const [perk89, attendu] of [[false, 50], [true, 51]]) {
  const s = neuf(perk89);
  s.runStartedAt = 0;
  const r = rebirthIdleNguState(s, ctx, 25_000 * 1000);
  assert.equal(r.currencies.ap, attendu, `Rebirth long, Fibonacci 89 = ${perk89}`);
}
console.log("idle-ap-gain-composition: OK");
