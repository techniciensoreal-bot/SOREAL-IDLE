import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses, IDLE_NGU_YGG_FRUITS } from "../src/idle-ngu-progression.js";

/*
 * Ygg extra (2026-09-23) : nouveaux fruits et écarts corrigés, page « Yggdrasil » du miroir
 * NGU-Wiki (tableau « Fruits and Fruit Effects », « Nerdy Formulas », « NGU Yggdrasil and
 * equipment Yggdrasil Yield »), « Perk Points » (19/20), « Challenges » (Troll 5).
 */
const ctx = { bosses: 100 };
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${m} : ${a} != ${b}`);

function pret(fruit, tier, mutate) {
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  const f = s.systems.yggdrasil.data.fruits[fruit];
  f.tier = tier;
  f.active = true;
  f.growthHours = tier;
  f.firstHarvestThisRun = false;
  if (mutate) mutate(s);
  return s;
}
const utiliser = (fruit, tier, mode = "eat", mutate) =>
  applyIdleNguAction(pret(fruit, tier, mutate), { action: "useYggFruit", fruit, mode }, ctx, 1);

// ---------- Catalogue : valeurs du tableau du wiki ----------
{
  const byId = Object.fromEntries(IDLE_NGU_YGG_FRUITS.map((f) => [f.id, f]));
  assert.deepEqual(
    ["powerDelta", "watermelon", "quirks"].map((id) => [byId[id].resource, byId[id].activationCost, byId[id].baseSeeds, byId[id].tierCost]),
    [["energy", 5e9, 7, 30000], ["magic", 20e9, 30, 50000], ["magic", 40e9, 7, 25000]],
    "Power δ 5 B Energy / 7 / T² x 30 000 ; Watermelon 20 B Magic / 30 / T² x 50 000 ; Quirks 40 B Magic / 7 / T² x 25 000"
  );
  assert.equal(IDLE_NGU_YGG_FRUITS.length, 21, "15 fruits + les 6 fruits de Mayo (2026-09-25 : wiki + source tierce)");
  assert.equal(IDLE_NGU_YGG_FRUITS.filter((f) => /mayo/i.test(f.id)).length, 6);
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  for (const id of ["powerDelta", "watermelon", "quirks"]) assert.equal(s.systems.yggdrasil.data.fruits[id].tier, 0, `${id} présent dans une sauvegarde neuve`);
}

// ---------- Fruit of Power δ : ⌈8 x 7⌉ = 56 niveaux, bonus Attack/Defense Level^1.3 x 0,0001 % toujours actif ----------
{
  const r = utiliser("powerDelta", 4);
  assert.equal(r.state.systems.yggdrasil.data.permanent.powerDeltaValue, 56);
  const base = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  const avec = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  avec.systems.yggdrasil.data.permanent.powerDeltaValue = 56;
  near(idleNguBonuses(avec).attackMultiplier / idleNguBonuses(base).attackMultiplier, 1 + Math.pow(56, 1.3) * 1e-6, "Power δ");
}

// ---------- Watermelon : graines avec HarvestBonus = 2 même mangé (⌈8 x 30 x 2⌉ = 480) ----------
{
  const avant = pret("watermelon", 4).currencies.seeds;
  assert.equal(utiliser("watermelon", 4, "eat").state.currencies.seeds - avant, 480);
  assert.equal(utiliser("watermelon", 4, "harvest").state.currencies.seeds - avant, 480);
}

// ---------- Fruit of Quirks : QP ⌈T x 3⌉, graines « mangé » sur T, « récolté » sur ⌈T^1.5⌉ ----------
{
  const s0 = pret("quirks", 4);
  const r = utiliser("quirks", 4, "eat");
  assert.equal(r.state.currencies.qp - s0.currencies.qp, 12, "4 x 3 QP");
  assert.equal(r.state.currencies.seeds - s0.currencies.seeds, 28, "graines mangé : ⌈4 x 7⌉");
  const h = utiliser("quirks", 4, "harvest");
  assert.equal(h.state.currencies.seeds - s0.currencies.seeds, 112, "graines récolté : ⌈8 x 7 x 2⌉");
  assert.equal(h.state.currencies.qp, s0.currencies.qp, "récolter ne donne pas de QP");
  const t24 = pret("quirks", 24);
  assert.equal(applyIdleNguAction(t24, { action: "useYggFruit", fruit: "quirks", mode: "eat" }, ctx, 1).state.currencies.qp - t24.currencies.qp, 72, "page Questing : « a base of 3 to 72 QP »");
}

// ---------- Fruit of Numbers : « Completion 5 Reward(s) : A new fruit » (Troll Challenge Normal) ----------
{
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s.currencies.seeds = 1e6;
  assert.throws(() => applyIdleNguAction(s, { action: "upgradeYggFruit", fruit: "numbers" }, ctx, 1), /FRUIT_NON_DEBLOQUE/);
  s.challenge.completions.troll = 5;
  const r = applyIdleNguAction(s, { action: "upgradeYggFruit", fruit: "numbers" }, ctx, 1);
  assert.equal(r.state.systems.yggdrasil.data.fruits.numbers.tier, 1);
  assert.equal(r.result.cost, 200, "T² x 200");
}

// ---------- Paliers : 10 sans Troll 3, 24 avec ; coût T² x base (Watermelon tier 1 = 50 000) ----------
{
  const s = normalizeIdleNguState({ difficulty: "extreme" }, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s.currencies.seeds = 50000;
  const r = applyIdleNguAction(s, { action: "upgradeYggFruit", fruit: "watermelon" }, ctx, 1);
  assert.equal(r.result.cost, 50000);
  assert.equal(r.result.maxTier, 10);
  const t = pret("gold", 10, (x) => { x.currencies.seeds = 1e9; });
  assert.throws(() => applyIdleNguAction(t, { action: "upgradeYggFruit", fruit: "gold" }, ctx, 1), /FRUIT_TIER_MAX/);
  t.challenge.completions.troll = 3;
  const u = applyIdleNguAction(t, { action: "upgradeYggFruit", fruit: "gold" }, ctx, 1);
  assert.equal(u.result.maxTier, 24);
  assert.equal(u.result.cost, 121, "T² x 1 pour le tier 11");
}

// ---------- Fruit of Knowledge : perks 19 et 20 = x3 chacun (multiplicatifs) ----------
{
  const exp = (levels) => utiliser("knowledge", 4, "eat", (s) => { s.currencies.experience = 0; s.systems.perks.data.levels = levels; }).state.currencies.experience;
  assert.equal(exp({}), 40);
  assert.equal(exp({ 19: 1 }), 120);
  assert.equal(exp({ 19: 1, 20: 1 }), 360);
}

// ---------- Quirk_Seeds (The Beast's Seed) sur les graines seulement ; Quirk_Ygg (Even Better Yggdrasil Yields) sur les rendements seulement ----------
{
  const graines = (levels) => {
    const s = pret("gold", 4, (x) => { x.systems.quirks.data.levels = levels; });
    const avant = s.currencies.seeds;
    return applyIdleNguAction(s, { action: "useYggFruit", fruit: "gold", mode: "harvest" }, ctx, 1).state.currencies.seeds - avant;
  };
  const alpha = (levels) => utiliser("powerAlpha", 4, "eat", (x) => { x.systems.quirks.data.levels = levels; }).state.systems.yggdrasil.data.runPowerAlphaValue;
  assert.equal(graines({}), 16, "⌈8 x 1 x 2⌉");
  assert.equal(graines({ 12: 25 }), 20, "The Beast's Seed : +25 %");
  assert.equal(graines({ 92: 50 }), 16, "Even Better Yggdrasil Yields ne touche pas les graines");
  assert.equal(alpha({}), 8);
  assert.equal(alpha({ 92: 50 }), 9, "⌈8 x 1,05⌉");
  assert.equal(alpha({ 12: 25 }), 8, "The Beast's Seed ne touche pas les rendements");
}

console.log("idle-yggdrasil-extra-fruits: OK");
