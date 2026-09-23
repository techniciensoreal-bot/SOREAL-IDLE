import assert from "node:assert/strict";
import {
  IDLE_NGU_TIER_CHALLENGES,
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguChallengeBonuses,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * 2026-09-23 (audit, page Challenges) : défis Evil et Sadistic (compteurs, cibles, EXP/AP,
 * bonus) + récompenses du 24 Hour proportionnelles au numéro du défi.
 */
const fresh = (difficulty = "normal", now = 1_000_000) => {
  const s = normalizeIdleNguState({}, { bosses: 100 }, now);
  s.difficulty = difficulty;
  s.systems.challenges.unlocked = true;
  s.records.highestBoss = 100;
  return s;
};

// Catalogue : valeurs du wiki
const evil = Object.fromEntries(IDLE_NGU_TIER_CHALLENGES.difficile.map(d => [d.id, d]));
const sad = Object.fromEntries(IDLE_NGU_TIER_CHALLENGES.extreme.map(d => [d.id, d]));
assert.equal(evil.basic.reward.experience, 15000);
assert.equal(evil.basic.reward.ap, 500);
assert.equal(evil.noAugmentations.reward.experience, 50000);
assert.equal(evil.twentyFourHours.reward.experience, 4000);
assert.equal(evil.noRebirth.reward.experience, 100000);
assert.equal(evil.noRebirth.targetStep, 5);
assert.equal(sad.basic.reward.experience, 150000);
assert.equal(sad.noEquipment.reward.experience, 400000);
assert.equal(sad.noRebirth.reward.experience, 1000000);
assert.equal(sad.troll.max, 7);
assert.equal(sad.noTimeMachine.reward.experience, 200000);

// Un défi Evil s'accomplit avec son propre compteur et sa récompense
{
  let s = fresh("difficile");
  const snap = idleNguSnapshot(s, { bosses: 100 }, 2_000_000);
  const defs = snap.challengeDefinitions;
  assert.equal(defs.find(d => d.id === "basic").tier, "difficile");
  assert.equal(defs.find(d => d.id === "basic").reward.experience, 15000);
  assert.equal(defs.find(d => d.id === "basic").unlocked, true);
  const started = applyIdleNguAction(s, { action: "challenge", mode: "start", challenge: "basic" }, { bosses: 100 }, 2_000_000);
  s = started.state;
  assert.equal(s.challenge.activeTier, "difficile");
  const expAvant = s.currencies.experience;
  const done = applyIdleNguAction(s, { action: "challenge", mode: "complete", challenge: "basic" }, { bosses: 100 }, 2_100_000);
  assert.equal(done.result.tier, "difficile");
  assert.equal(done.result.completion, 1);
  assert.equal(done.state.challenge.completionsTier.difficile.basic, 1);
  assert.equal(done.state.challenge.completions.basic, 0);
  assert.equal(done.state.currencies.experience - expAvant, 15000);
  assert.equal(idleNguChallengeBonuses(done.state).adventureStatsMultiplier, 1.1);
}

// 24 Hour : récompense = base x numéro du défi
{
  let s = fresh("normal");
  s.challenge.bestMs.basic = 1000;
  s.challenge.completions.twentyFourHours = 2;
  s = applyIdleNguAction(s, { action: "challenge", mode: "start", challenge: "twentyFourHours" }, { bosses: 100 }, 2_000_000).state;
  const expAvant = s.currencies.experience;
  const apAvant = s.currencies.ap;
  const done = applyIdleNguAction(s, { action: "challenge", mode: "complete", challenge: "twentyFourHours" }, { bosses: 200 }, 2_100_000);
  assert.equal(done.state.currencies.experience - expAvant, 400 * 3);
  assert.equal(done.state.currencies.ap - apAvant, 5000 * 3);
}

// Bonus permanents par difficulté
{
  const s = fresh("normal");
  s.challenge.completions.troll = 2;
  s.challenge.completions.twentyFourHours = 3;
  s.challenge.completions.hundredLevels = 2;
  s.challenge.completionsTier.difficile.noTimeMachine = 3;
  s.challenge.completionsTier.difficile.noNgu = 2;
  s.challenge.completionsTier.difficile.noEquipment = 5;
  s.challenge.completionsTier.difficile.twentyFourHours = 2;
  s.challenge.completionsTier.extreme.noEquipment = 5;
  s.challenge.completionsTier.extreme.troll = 7;
  s.challenge.completionsTier.extreme.twentyFourHours = 4;
  const b = idleNguChallengeBonuses(s);
  assert.equal(b.nguSpeedMagicChallengeMultiplier, 3);
  assert.equal(b.nguSpeedEnergyChallengeMultiplier, 3);
  assert.equal(b.wandoosSpeedChallengeMultiplier, 1.4);
  assert.ok(Math.abs(b.bossExpPct - (0.3 + 0.08 + 0.08)) < 1e-12);
  assert.ok(Math.abs(b.timeMachineSpeedMultiplier - 1.3) < 1e-12);
  assert.equal(b.timeMachineGoldMultiplier, 1 + 0 + 1, "1er No Time Machine Evil : +100 % de GPS (page Broken Time Machine)");
  assert.ok(Math.abs(b.hackSpeedChallengeMultiplier - 1.4) < 1e-12);
  assert.equal(b.inventorySlots, 24, "Evil No Equipment : 5 x 3 + 9 = 24 (page Inventory)");
  assert.ok(Math.abs(b.idleAttackBonus - 0.2) < 1e-12);
  assert.equal(b.accessorySlots, 2);
  assert.ok(Math.abs(1.5 * (1 + b.idleAttackBonus) - 1.8) < 1e-12);
}

// Les sauvegardes existantes gardent leurs compteurs Normal
{
  const s = normalizeIdleNguState({ challenge: { completions: { basic: 3 } } }, { bosses: 100 }, 1_000_000);
  assert.equal(s.challenge.completions.basic, 3);
  assert.equal(s.challenge.completionsTier.difficile.basic, 0);
  assert.equal(s.challenge.activeTier, "normal");
}
console.log("idle-challenges-tiers ok");
