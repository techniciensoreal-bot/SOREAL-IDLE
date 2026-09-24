import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  rebirthIdleNguState,
  applyIdleNguAction
} from "../src/idle-ngu-progression.js";
import { idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Audit de seconde passe (2026-09-24) : effets catalogués mais jamais lus par le moteur.
 *  - perk 18 « Instant Advanced Training Levels! » (advancedTrainingStartBonus) ;
 *  - Advanced Training Level Bank (perks 36-40, quirks 20-24 : atBankMultiplier), page « Banks » ;
 *  - perk 25 « The Loot Goblin's Blessing » (lootGoblinChance), page Inventory ;
 *  - boosts de l'ITOPOD soumis au tirage +1 niveau (page Boost) ;
 *  - Sellout « Daycare Speed Boost! » lu par la garderie mais jamais achetable.
 */
const T0 = 1_000_000;
const RUN = 4 * 3600 * 1000; // bien au-delà du temps minimum de Rebirth
const ctx = { bosses: 100, basicTrainingComplete: false };

function withAt(levels, perks = {}, quirks = {}) {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.systems.perks.data.levels = Object.assign({}, perks);
  s.systems.quirks.data.levels = Object.assign({}, quirks);
  for (const [id, lv] of Object.entries(levels)) s.systems.advancedTraining.data.tracks[id].tempLevel = lv;
  return s;
}

/* --- Perk 18 : +1 niveau de CHAQUE piste d'AT par niveau du perk, au début de chaque Rebirth, sans attendre le déblocage. --- */
{
  const s = withAt({ power: 500, toughness: 300 }, { 18: 3 });
  const r = rebirthIdleNguState(s, ctx, T0 + RUN);
  for (const t of Object.values(r.systems.advancedTraining.data.tracks)) {
    assert.equal(t.tempLevel, 3, "perk 18 niveau 3 : chaque piste d'AT repart à 3");
  }
  const r0 = rebirthIdleNguState(withAt({ power: 500 }), ctx, T0 + RUN);
  assert.equal(r0.systems.advancedTraining.data.tracks.power.tempLevel, 0, "sans le perk, l'AT repart à 0");
}

/* --- Banks : perks 36-40 (1 %/niveau) + quirks 20-24 (0,5 %/niveau), cumulatif, arrondi à l'inférieur, par piste. --- */
{
  const perks = { 36: 10, 37: 10 }; // 20 %
  const quirks = { 20: 10 }; // 5 %
  const s = withAt({ power: 1000, toughness: 999, block: 3 }, perks, quirks);
  const r = rebirthIdleNguState(s, ctx, T0 + RUN);
  assert.equal(r.bank.advancedTraining, 499);
  /* 2026-09-24 (fusion avec main) : un seul mécanisme de banque d AT (celui de main) : les niveaux retenus (250 et 249 ; block : 3 x 25 % = 0) sont réinjectés dans les pistes dès le Rebirth, menu reverrouillé (page Banks : sans effet avant le déblocage). */
  assert.equal(r.systems.advancedTraining.data.tracks.power.tempLevel, 250);
  assert.equal(r.systems.advancedTraining.data.tracks.toughness.tempLevel, 249);
  assert.equal(r.systems.advancedTraining.data.tracks.block.tempLevel, 0);
  assert.equal(r.systems.advancedTraining.unlocked, false, "menu d AT reverrouillé après le Rebirth");

  // Survit à la sérialisation (normalize).
  const round = normalizeIdleNguState(JSON.parse(JSON.stringify(r)), ctx, T0 + RUN);
  assert.equal(round.bank.advancedTraining, 499);
}

/* --- Banks perdues en changeant de difficulté (page Banks : « lost when changing the difficulty level or starting a challenge »). --- */
{
  const s = withAt({ power: 1000 }, { 36: 10 });
  s.difficulty = "difficile";
  const r = rebirthIdleNguState(s, ctx, T0 + RUN, { difficulty: "normal" });
  assert.equal(r.bank.advancedTraining, 0);
}

/* --- Perk 25 : +1 %/niveau de chance de +1 niveau, cumulée avec Fibonacci 144 (+5 %). --- */
{
  const s = normalizeIdleNguState({ systems: { perks: { data: { levels: { 25: 10 } } } } }, ctx, T0);
  s.systems.perks.data.levels = { 25: 10 };
  const n = normalizeIdleNguState(s, ctx, T0);
  assert.ok(Math.abs(n.adventure.bonusDropLevelChance - 0.10) < 1e-12, "Loot Goblin niveau 10 : 10 %");
  n.systems.perks.data.levels = { 25: 10, 94: 144 };
  const f = normalizeIdleNguState(n, ctx, T0);
  assert.ok(Math.abs(f.adventure.bonusDropLevelChance - 0.15) < 1e-12, "Loot Goblin 10 % + Fibonacci 144 5 %");
}

/* --- ITOPOD : les boosts (niveau 1) passent par le même tirage +1 niveau. --- */
{
  const tctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 100 };
  let s = normalizeIdleNguState({}, tctx, T0);
  s.systems.perks.data.levels = { 25: 10 };
  s = normalizeIdleNguState(s, tctx, T0);
  s.systems.tower.unlocked = true;
  s.systems.tower.active = true;
  s.adventure.inventory = s.adventure.inventory.filter(i => i.kind !== "boost");
  const random = Math.random;
  try {
    Math.random = () => 0.05; // < 10 % : chaque boost gagne un niveau
    s = advanceIdleNguState(s, 5 * 100, tctx, T0 + 1_000_000);
  } finally {
    Math.random = random;
  }
  const boosts = s.adventure.inventory.filter(i => i.kind === "boost");
  assert.ok(boosts.length > 0);
  assert.ok(boosts.every(b => b.level === 2), "Loot Goblin : boosts de l'ITOPOD tirés au niveau 2");
}

/* --- Sellout « Daycare Speed Boost! » : désormais achetable (125 000 AP). --- */
{
  assert.equal(idleSelloutShopEffectActiveV1("daycareSpeedBoost"), true);
  const s = normalizeIdleNguState({}, ctx, T0);
  s.currencies.ap = 200_000;
  s.selloutShop.unlockedEver = true;
  const r = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "daycareSpeedBoost" }, ctx, T0 + 1000).state;
  assert.equal(r.selloutShop.purchases.daycareSpeedBoost, 1);
  assert.equal(r.currencies.ap, 75_000);
}

console.log("idle-second-pass-banks-loot-2026-09-24 ok");
