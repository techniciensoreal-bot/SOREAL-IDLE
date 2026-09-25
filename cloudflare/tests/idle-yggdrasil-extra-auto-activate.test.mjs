import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  idleNguSnapshot,
  IDLE_NGU_EXP_SHOP_V1,
  IDLE_NGU_YGG_FRUITS
} from "../src/idle-ngu-progression.js";

/*
 * Ygg extra (2026-09-23) : page Experience, section Yggdrasil -- « Buying these will automatically
 * activate the fruit whenever possible, AND remove the Energy or Magic activation cost too! » ;
 * « Your total Energy or Magic cap must be 10x greater than the fruit's activation cost ».
 * Quirk 13 « The Beast's Fertilizer » (« Each tier will take 1 minute less to grow ») et perks 16/17
 * (« will automatically turn on after 30 minutes »).
 */
const ctx = { bosses: 100 };
const WIKI = {
  gold: [300, 1e6], powerAlpha: [500, 2e6], adventure: [600, 2e6], knowledge: [2000, 1e7], pomegranate: [2000, 3e6],
  luck: [8000, 5e7], powerBeta: [10000, 3e7], arbitrariness: [15000, 2e8], numbers: [20000, 1e8], rage: [100000, 5e9],
  macguffinAlpha: [500000, 5e9], powerDelta: [2e6, 5e10], watermelon: [5e6, 2e11], macguffinBeta: [1.5e7, 1e12], quirks: [1e6, 4e11],
  /* fruits de Mayo : 1 B EXP, cap requis « 100 Q » = 100 Qa = 10 x le coût d'activation (10 Qa = 1e16), comme les 15 autres lignes */
  angryMayo: [1e9, 1e17], sadMayo: [1e9, 1e17], moldyMayo: [1e9, 1e17], ayyMayo: [1e9, 1e17], cincoMayo: [1e9, 1e17], prettyMayo: [1e9, 1e17]
};

// ---------- Catalogue de la boutique EXP ----------
{
  const autos = Object.entries(IDLE_NGU_EXP_SHOP_V1).filter(([, d]) => d.yggFruit);
  assert.equal(autos.length, 21);
  for (const [id, d] of autos) {
    const fruit = IDLE_NGU_YGG_FRUITS.find((f) => f.id === d.yggFruit);
    assert.ok(fruit, id);
    assert.deepEqual([d.cost(0), d.requiredCap], WIKI[d.yggFruit], id);
    assert.equal(d.resource, fruit.resource, `${id} : ressource du tableau = ressource d'activation`);
    assert.equal(d.requiredCap, 10 * fruit.activationCost, `${id} : règle « 10x »`);
    assert.equal(d.max, 1);
  }
}

function base(capEnergy) {
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s.resources.energy.cap = capEnergy;
  s.resources.energy.current = 0;
  s.currencies.experience = 1000;
  s.systems.yggdrasil.data.fruits.gold.tier = 1;
  return s;
}

// ---------- Cap requis ; achat -> activation immédiate et gratuite ----------
{
  assert.throws(() => applyIdleNguAction(base(1000), { action: "buyExpShop", item: "yggAutoGold" }, ctx, 1), /CAP_RESSOURCE_INSUFFISANT/);
  const r = applyIdleNguAction(base(2e6), { action: "buyExpShop", item: "yggAutoGold" }, ctx, 1);
  assert.equal(r.state.currencies.experience, 700);
  const f = r.state.systems.yggdrasil.data.fruits.gold;
  assert.equal(f.active, true, "activé sans avoir 100 000 Energy libre");
  assert.equal(r.state.resources.energy.current <= 1, true, "aucun coût prélevé");
  assert.throws(() => applyIdleNguAction(r.state, { action: "buyExpShop", item: "yggAutoGold" }, ctx, 2), /ACHAT_AU_MAXIMUM/);

  // Manger : le fruit repart aussitôt.
  let s = advanceIdleNguState(r.state, 3600, ctx, 3_600_001);
  assert.equal(s.systems.yggdrasil.data.fruits.gold.growthHours, 1);
  const eat = applyIdleNguAction(s, { action: "useYggFruit", fruit: "gold", mode: "harvest" }, ctx, 3_600_001);
  assert.equal(eat.result.autoActivated, true);
  assert.equal(eat.state.systems.yggdrasil.data.fruits.gold.active, true);
  assert.equal(eat.state.systems.yggdrasil.data.fruits.gold.growthHours, 0);

  // Fruit désactivé (ex. après un Rebirth) : relancé au tick suivant.
  s = eat.state;
  s.systems.yggdrasil.data.fruits.gold.active = false;
  s = advanceIdleNguState(s, 60, ctx, 3_660_001);
  assert.equal(s.systems.yggdrasil.data.fruits.gold.active, true);

  // Un fruit sans Auto-Activate reste payant.
  const t = base(2e6);
  t.systems.yggdrasil.data.fruits.powerAlpha.tier = 1;
  assert.throws(() => applyIdleNguAction(t, { action: "activateYggFruit", fruit: "powerAlpha" }, ctx, 1), /RESSOURCE_YGG_INSUFFISANTE/);

  const snap = idleNguSnapshot(eat.state, ctx, 3_600_002);
  assert.equal(snap.yggExtra.fruits.gold.autoActivate, true);
  assert.equal(snap.yggExtra.fruits.gold.activationCost, 0);
  assert.equal(snap.yggExtra.fruits.powerAlpha.autoShopId, "yggAutoPowerAlpha");
  assert.equal(snap.expShop.find((e) => e.id === "yggAutoGold").requiredCap, 1e6);
}

// ---------- The Beast's Fertilizer : 60 min - 1 min par niveau (3 niveaux) ----------
{
  const s = base(1e3);
  s.systems.yggdrasil.data.fruits.gold.active = true;
  s.systems.quirks.data.levels = { 13: 3 };
  const a = advanceIdleNguState(s, 3420, ctx, 3_420_000);
  assert.equal(a.systems.yggdrasil.data.fruits.gold.growthHours, 1, "57 minutes par tier");
  assert.equal(idleNguSnapshot(a, ctx, 3_420_000).yggExtra.tierSeconds, 3420);
}

// ---------- Perks 16/17 : bonus Power β / Numbers actifs 30 minutes après le début du Rebirth ----------
{
  const run = (levels, seconds) => {
    const s = normalizeIdleNguState({}, ctx, 0);
    s.systems.yggdrasil.unlocked = true;
    s.systems.perks.data.levels = levels;
    const a = advanceIdleNguState(s, seconds, ctx, seconds * 1000);
    return [a.systems.yggdrasil.data.runPowerBetaActive, a.systems.yggdrasil.data.runNumbersActive];
  };
  assert.deepEqual(run({}, 1800), [false, false]);
  assert.deepEqual(run({ 16: 1, 17: 1 }, 1799), [false, false]);
  assert.deepEqual(run({ 16: 1 }, 1800), [true, false]);
  assert.deepEqual(run({ 17: 1 }, 1800), [false, true]);
}

console.log("idle-yggdrasil-extra-auto-activate: OK");
