import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { idleSelloutApplyEffectV1, idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Ygg extra (2026-09-23) : Poop. Page Yggdrasil : « increased by 50% (before rounding) ... will
 * consume one Poop, except if the player has maxed the Brown Heart, then one every 10th Poop used
 * will not be consumed » ; « Poop = ... 1.5 (1.65 with Blue Heart Set) ». 4G's Sellout Shop :
 * « 3,000 AP for 1 / 25,000 AP for 10 / 225,000 AP for 100 ».
 */
const ctx = { bosses: 100 };

function pret(fruit, tier, poop, mutate) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  const f = s.systems.yggdrasil.data.fruits[fruit];
  f.tier = tier;
  f.active = true;
  f.growthHours = tier;
  f.firstHarvestThisRun = false;
  s.selloutEffects.poop = poop;
  if (mutate) mutate(s);
  return s;
}
const manger = (s, fruit, mode = "eat", poop = true) => applyIdleNguAction(s, { action: "useYggFruit", fruit, mode, poop }, ctx, 1);

// ---------- Achat des lots au Sellout Shop et lots de la roue quotidienne ----------
{
  for (const id of ["icarusFertilizer1", "icarusFertilizer10", "icarusFertilizer100"]) assert.equal(idleSelloutShopEffectActiveV1(id), true, id);
  let s = normalizeIdleNguState({}, ctx, 0);
  s.currencies.ap = 253000;
  for (const id of ["icarusFertilizer1", "icarusFertilizer10", "icarusFertilizer100"]) s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: id }, ctx, 1).state;
  assert.equal(s.selloutEffects.poop, 111);
  assert.equal(s.currencies.ap, 0, "3 000 + 25 000 + 225 000 AP");
  idleSelloutApplyEffectV1(s, "poop", 25);
  assert.equal(s.selloutEffects.poop, 136, "jackpot de la roue quotidienne (poop: 25)");
  assert.equal(normalizeIdleNguState(s, ctx, 2).selloutEffects.poop, 136, "stock conservé à la normalisation");
  assert.equal(idleNguSnapshot(s, ctx, 2).yggExtra.poop, 136, "visible dans le menu Yggdrasil");
}

// ---------- x1,5 avant arrondi, sur le rendement et sur les graines ; une Poop consommée ----------
{
  const r = manger(pret("powerAlpha", 4, 3), "powerAlpha");
  assert.equal(r.state.systems.yggdrasil.data.runPowerAlphaValue, 12, "⌈8 x 1,5⌉");
  assert.equal(r.state.selloutEffects.poop, 2);
  assert.deepEqual(r.result.poop, { consumed: true, free: false, remaining: 2 });
  const s = pret("gold", 4, 1);
  const avant = s.currencies.seeds;
  const h = manger(s, "gold", "harvest");
  assert.equal(h.state.currencies.seeds - avant, 24, "graines : ⌈8 x 2 x 1,5⌉");
  assert.equal(h.state.selloutEffects.poop, 0);
  // Sans demande de Poop : rien n'est consommé.
  const sans = manger(pret("powerAlpha", 4, 3), "powerAlpha", "eat", false);
  assert.equal(sans.state.systems.yggdrasil.data.runPowerAlphaValue, 8);
  assert.equal(sans.state.selloutEffects.poop, 3);
}

// ---------- Erreurs : pas de Poop ; fruit pas prêt (la Poop n'est pas consommée) ----------
{
  assert.throws(() => manger(pret("powerAlpha", 4, 0), "powerAlpha"), /POOP_INSUFFISANTE/);
  const s = pret("powerAlpha", 4, 2);
  s.systems.yggdrasil.data.fruits.powerAlpha.growthHours = 0;
  assert.throws(() => manger(s, "powerAlpha"), /FRUIT_PAS_PRET/);
  assert.equal(s.selloutEffects.poop, 2);
}

// ---------- Blue Heart (set) : 1,65 ----------
{
  const r = manger(pret("powerAlpha", 4, 1, (s) => { s.adventure.completedSets.heartBlue = true; s.adventure.setRewards.consumablesEffectPct = 0.1; }), "powerAlpha");
  assert.equal(r.state.systems.yggdrasil.data.runPowerAlphaValue, 14, "⌈8 x 1,65⌉");
}

// ---------- FirstHarvest x Poop (même niveau dans la formule) ----------
{
  const s = pret("powerAlpha", 4, 1, (x) => { x.systems.yggdrasil.data.fruits.powerAlpha.firstHarvestThisRun = true; x.systems.perks.data.levels = { 51: 5 }; });
  assert.equal(manger(s, "powerAlpha").state.systems.yggdrasil.data.runPowerAlphaValue, 18, "⌈8 x 1,5 x 1,5⌉");
}

// ---------- Brown Heart (set) : chaque 10e Poop utilisée n'est pas consommée ----------
{
  const run = (brown) => {
    let s = pret("powerAlpha", 1, 20, (x) => { if (brown) x.adventure.completedSets.heartBrown = true; });
    let gratuites = 0;
    for (let i = 0; i < 10; i++) {
      const f = s.systems.yggdrasil.data.fruits.powerAlpha;
      f.active = true;
      f.growthHours = 1;
      const r = manger(s, "powerAlpha");
      if (r.result.poop.free) gratuites++;
      s = r.state;
    }
    return { reste: s.selloutEffects.poop, gratuites, used: s.selloutEffects.poopUsed };
  };
  assert.deepEqual(run(false), { reste: 10, gratuites: 0, used: 10 });
  assert.deepEqual(run(true), { reste: 11, gratuites: 1, used: 10 });
}

console.log("idle-yggdrasil-extra-poop: OK");
