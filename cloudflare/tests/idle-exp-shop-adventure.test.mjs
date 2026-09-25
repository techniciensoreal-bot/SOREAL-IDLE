import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot, IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki Experience > Spend Experience) : achats d'aventure et slots avec de l'EXP. */
const ctx = { bosses: 100 };
const fresh = (exp) => {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.currencies.experience = exp;
  return s;
};
const acheter = (s, item, quantity = 1) => applyIdleNguAction(s, { action: "buyExpShop", item, quantity }, ctx, 2_000_000);

{
  const r = acheter(fresh(100), "adventurePower", 10);
  assert.equal(r.state.currencies.experience, 70);
  assert.equal(r.state.adventure.permanent.adventurePower, 10);
}
{
  const r = acheter(fresh(100), "adventureHp", 4);
  assert.equal(r.state.adventure.permanent.adventureHp, 40, "3 EXP = +10 PV max");
  assert.equal(r.state.currencies.experience, 88);
}
{
  const r = acheter(fresh(100), "adventureRegen", 2);
  assert.equal(r.state.adventure.permanent.adventureRegen, 2);
  assert.equal(r.state.currencies.experience, 0);
}
// espaces d'inventaire : 12 premiers à 2 EXP (25 à 36), puis 4 x (possédés - 35)
{
  const r = acheter(fresh(1000), "inventorySpace", 13);
  assert.equal(r.state.currencies.experience, 1000 - 12 * 2 - 4);
  const s2 = normalizeIdleNguState(r.state, ctx, 3_000_000);
  assert.equal(s2.adventure.bonusSlots.inventory, 13);
}
// plafond et pas assez d'EXP
{
  assert.throws(() => acheter(fresh(1), "accessorySlot1"), /EXP_INSUFFISANT/);
  let s = acheter(fresh(5000), "accessorySlot1").state;
  assert.throws(() => acheter(s, "accessorySlot1"), /ACHAT_AU_MAXIMUM/);
  s = normalizeIdleNguState(s, ctx, 3_000_000);
  assert.equal(s.adventure.bonusSlots.accessory, 1);
}
{
  const s = acheter(fresh(30000), "diggerSlot").state;
  const snap = idleNguSnapshot(s, ctx, 3_000_000);
  assert.ok(Array.isArray(snap.expShop) && snap.expShop.length === Object.values(IDLE_NGU_EXP_SHOP_V1).filter((d) => !(d.yggFruit && /Mayo$/.test(d.yggFruit))).length, "les Auto-Activate des fruits de Mayo n'apparaissent qu'avec Cards");
  assert.equal(snap.expShop.find((x) => x.id === "diggerSlot").purchased, 1);
  assert.equal(snap.richJerks.cost, 30);
}
/* 2026-09-24 : prix des espaces d'inventaire (wiki Experience : 25-36 = 2 EXP, 37-60 = 4 x (Owned - 35), plafond 60) exposés en entier. */
{
  const ctx = { bosses: 10 };
  const state = normalizeIdleNguState({}, ctx, 1000);
  const snap = idleNguSnapshot(state, ctx, 1000);
  const inv = snap.expShop.find((x) => x.id === "inventorySpace");
  assert.equal(inv.remainingCosts.length, 36, "36 achats jusqu'à 60 espaces (24 de base)");
  assert.deepEqual(inv.remainingCosts.slice(0, 13), [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4], "12 achats à 2 EXP puis 4 x (possédés - 35)");
  assert.equal(inv.remainingCosts[13], 8);
  assert.equal(inv.remainingCosts[35], 96, "60e espace : 4 x 24");
  assert.equal(inv.remainingCosts.reduce((a, b) => a + b, 0), 1224);
  assert.equal(inv.nextCost, 2);
  const filtre = snap.expShop.find((x) => x.id === "basicLootFilter");
  assert.equal(filtre.nextCost, 20, "Basic Loot Filter : 20 EXP");
}
console.log("idle-exp-shop-adventure ok");
