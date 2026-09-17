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

// --- ITOPOD stat bonus (PP) : inclut TOUT perk statPct, pas seulement "Rich Perks" nommés ---
{
  let state = normalizeIdleNguState(null, { bosses: 301 }, 0);
  state.difficultyPeaks.normal = 301;
  state.currencies.experience = 1e9;

  // Sans rien : verrouillé.
  assert.equal(idleNguDifficultyUnlockRequirementsV1(state, {}).difficile.richJerksReady, false);

  // La Newbie Stat Perk (id 4, +100%, cap 1) seule ne suffit jamais (richJerksAttackLevel=0 -> produit=0).
  state.systems.perks.data.levels[4] = 1;
  assert.equal(idleNguDifficultyUnlockRequirementsV1(state, {}).difficile.richJerksReady, false, "Sans aucun niveau Rich Jerks acheté, le produit reste 0 quel que soit le bonus ITOPOD.");

  // 1000 niveaux Rich Jerks Attack (10 000%) x Newbie Stat Perk (100%) = 1 000 000% pile.
  const { state: withRichJerks } = applyIdleNguAction(state, { action: "richJerks", stat: "attack", levels: 1000 }, {}, 0);
  const req = idleNguDifficultyUnlockRequirementsV1(withRichJerks, {});
  assert.ok(req.difficile.richJerksItopodBonusPct >= 1e6, `10000% x 100% doit atteindre >= 1e6% (obtenu ${req.difficile.richJerksItopodBonusPct}).`);
  assert.equal(req.difficile.richJerksReady, true);
}

console.log("idle-rich-jerks-and-itopod-stat-bonus: OK");
