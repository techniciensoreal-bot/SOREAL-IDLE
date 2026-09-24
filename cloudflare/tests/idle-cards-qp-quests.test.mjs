import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";
import { idleQuestRewardV1 } from "../src/idle-questing-v1.js";

/*
 * Cartes QP (2026-09-24) : page Cards, type « QP Gain (QP) » ; page Questing, « Other features :
 * QP Hacks, QP Cards ». Le bonus des cartes QP lancées (state.bonuses.cards.qp, en %) multiplie
 * la récompense QP des quêtes, comme le QP Hack.
 */
const ctx = { bosses: 200, rebirths: 1 };
const T0 = 1_000_000_000;
const act = (s, payload, t = T0) => applyIdleNguAction(s, payload, ctx, t);
const avecAleatoire = (valeur, fn) => {
  const orig = Math.random;
  Math.random = () => valeur;
  try { return fn(); } finally { Math.random = orig; }
};

function base(cartesQpPct = 0) {
  let s = normalizeIdleNguState({}, ctx, T0);
  s.adventure.unlockItems = Object.assign({}, s.adventure.unlockItems, { heroicSigil: true });
  s.adventure.completedSets = { sewers: true };
  s.bonuses = Object.assign({}, s.bonuses, { cards: Object.assign({}, s.bonuses?.cards, { qp: cartesQpPct }) });
  return normalizeIdleNguState(s, ctx, T0);
}

// Unitaire : facteur multiplicatif, neutre par défaut.
{
  const s = base();
  assert.equal(idleQuestRewardV1(s, {}, { major: true, usedIdle: true }).qp, 50);
  assert.equal(idleQuestRewardV1(s, { qpCardMultiplier: 1.2 }, { major: true, usedIdle: true }).qp, 60);
  assert.equal(idleQuestRewardV1(s, { qpHackMultiplier: 2, qpCardMultiplier: 1.2 }, { major: true, usedIdle: true }).qp, 120, "cumul multiplicatif avec le QP Hack");
}

// Bout en bout : cartes QP +20 % -> Minor idle 10 -> 12 QP.
{
  assert.equal(idleNguBonuses(base(20)).cardsQpGainMultiplier, 1.2);
  const recompense = (pct) => {
    let s = avecAleatoire(0, () => act(base(pct), { action: "questStart" })).state;
    s = act(s, { action: "questIdle", active: true }).state;
    s = advanceIdleNguState(s, 50 * 800, ctx, T0 + 50 * 800_000);
    return act(s, { action: "questComplete" }, T0 + 50 * 800_000).result.qp;
  };
  assert.equal(recompense(0), 10, "Minor idle : 10 QP");
  assert.equal(recompense(20), 12, "cartes QP +20 % : 12 QP");
}

console.log("idle-cards-qp-quests: OK");
