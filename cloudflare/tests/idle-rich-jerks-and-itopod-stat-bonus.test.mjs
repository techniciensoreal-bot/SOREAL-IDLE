import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguBonuses,
  idleNguDifficultyUnlockRequirementsV1,
  RICH_JERKS_COST_EXP_V1,
  RICH_JERKS_PCT_PER_LEVEL_V1
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "Experience", section "Spend Experience" > "Misc",
 * tableau "Attack Boosts For Rich Jerks" : Cost=30 EXP/niveau (plat),
 * Growth=+10%/niveau, Attack et Defense achetés séparément. Wiki page
 * "Glossary", entrée "Rich Jerks / Perks / Quirks" : "ITOPOD stat bonus
 * (PP)" = tout perk payé en PP qui boost Attack/Defense (statPct), pas
 * seulement les 2 perks nommés "Rich Perks".
 */

assert.equal(RICH_JERKS_COST_EXP_V1, 30, "Coût wiki : 30 EXP par niveau, plat.");
assert.equal(RICH_JERKS_PCT_PER_LEVEL_V1, 10, "Effet wiki : +10% par niveau.");

// --- Achat : décrémente EXP, incrémente le niveau, jamais si fonds insuffisants ---
{
  let state = normalizeIdleNguState(null, { bosses: 0 }, 0);
  state.currencies.experience = 100;

  const { state: after, result } = applyIdleNguAction(state, { action: "richJerks", stat: "attack", levels: 2 }, {}, 0);
  assert.equal(result.level, 2, "2 niveaux achetés doit donner level=2.");
  assert.equal(result.cost, 60, "2 x 30 EXP = 60.");
  assert.equal(after.currencies.experience, 40, "100 - 60 = 40 EXP restant.");
  assert.equal(after.bonuses.richJerksAttackLevel, 2);
  assert.equal(after.bonuses.richJerksDefenseLevel, 0, "Attack et Defense sont des compteurs séparés (achats indépendants sur le wiki).");

  assert.throws(
    () => applyIdleNguAction(after, { action: "richJerks", stat: "attack", levels: 100 }, {}, 0),
    /EXP_INSUFFISANT/,
    "Acheter plus de niveaux que l'EXP disponible ne permet jamais de payer à crédit."
  );
}

// --- Attack et Defense sont indépendants dans les stats finales ---
{
  let state = normalizeIdleNguState(null, { bosses: 0 }, 0);
  state.currencies.experience = 1000;
  const base = idleNguBonuses(state);

  const { state: withAttack } = applyIdleNguAction(state, { action: "richJerks", stat: "attack", levels: 1 }, {}, 0);
  const withAttackBonuses = idleNguBonuses(withAttack);
  assert.ok(withAttackBonuses.attackMultiplier > base.attackMultiplier, "+1 niveau Attack doit augmenter attackMultiplier.");
  assert.equal(withAttackBonuses.defenseMultiplier, base.defenseMultiplier, "Un achat Attack ne doit jamais augmenter Defense (compteurs séparés sur le wiki).");

  const { state: withDefense } = applyIdleNguAction(withAttack, { action: "richJerks", stat: "defense", levels: 1 }, {}, 0);
  const withDefenseBonuses = idleNguBonuses(withDefense);
  assert.equal(withDefenseBonuses.attackMultiplier, withAttackBonuses.attackMultiplier, "Un achat Defense ne doit jamais augmenter Attack.");
  assert.ok(withDefenseBonuses.defenseMultiplier > withAttackBonuses.defenseMultiplier, "+1 niveau Defense doit augmenter defenseMultiplier.");
}

// --- Seuil du jeu (IL Rebirth::setEvilNextRebirth) : attackBoost x totalStatBonus() >= 10000 (RATIO), attackBoost = 1 + 0,1 par achat ---
{
  let state = normalizeIdleNguState(null, { bosses: 301 }, 0);
  state.difficultyPeaks.normal = 301;
  state.currencies.experience = 1e9;

  // Sans rien : attackBoost 1 x atouts 1 = 1 < 10000.
  const r0 = idleNguDifficultyUnlockRequirementsV1(state, {}).difficile;
  assert.equal(r0.richJerksReady, false);
  assert.equal(r0.richJerksItopodRatio, 1, "Départ du jeu : attackBoost = 1, aucun atout de stats = x1.");

  // La Newbie Stat Perk (id 4, +100%, cap 1) : x2 seulement ; attackBoost reste 1 -> loin de 10000.
  state.systems.perks.data.levels[4] = 1;
  const r1 = idleNguDifficultyUnlockRequirementsV1(state, {}).difficile;
  assert.equal(r1.richJerksReady, false);
  assert.equal(r1.richJerksItopodRatio, 2);

  // Ancien seuil (mal converti) : 1000 niveaux Rich Jerks x Newbie = 101 x 2 = 202 : NE débloque PLUS.
  const { state: withRichJerks } = applyIdleNguAction(state, { action: "richJerks", stat: "attack", levels: 1000 }, {}, 0);
  const r2 = idleNguDifficultyUnlockRequirementsV1(withRichJerks, {}).difficile;
  assert.equal(r2.richJerksItopodRatio, 202);
  assert.equal(r2.richJerksReady, false, "202 < 10000 : l'ancien seuil laissait passer ce cas à tort.");

  // Atout 5 (Rich Perks I) niveau 1000 = x101 : 101 x (1 + 100 ... ) -> (1 + 0,1 x 1000) x (2 x 101) = 20 402 >= 10000.
  withRichJerks.systems.perks.data.levels[5] = 1000;
  const r3 = idleNguDifficultyUnlockRequirementsV1(withRichJerks, {}).difficile;
  assert.equal(r3.richJerksItopodRatio, 101 * 202);
  assert.equal(r3.richJerksReady, true);

  // Pile sur la limite : ratio 10000 débloque, juste en dessous non.
  const lim = normalizeIdleNguState(null, { bosses: 301 }, 0);
  lim.difficultyPeaks.normal = 301;
  lim.systems.perks.data.levels[5] = 1000; // x101
  lim.bonuses.richJerksAttackLevel = 980; // 1 + 98 = 99 -> 99 x 101 = 9999 < 10000
  assert.equal(idleNguDifficultyUnlockRequirementsV1(lim, {}).difficile.richJerksReady, false);
  lim.bonuses.richJerksAttackLevel = 990; // 100 x 101 = 10100
  assert.equal(idleNguDifficultyUnlockRequirementsV1(lim, {}).difficile.richJerksReady, true);
}

console.log("idle-rich-jerks-and-itopod-stat-bonus: OK");
