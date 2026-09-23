import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction, idleNguBonuses } from "../src/idle-ngu-progression.js";

/* 2026-09-23 : effets réels des objets de la boutique Sellout (potions, charmes, pilules, slots, Faster Wishes). */
const ctx = { bosses: 100 };
const acheter = (s, id) => applyIdleNguAction(s, { action: "sellShopBuy", itemId: id }, ctx, 2_000_000);

function fresh(ap = 5_000_000) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.currencies.ap = ap;
  s.selloutShop.unlockedEver = true;
  return s;
}

{
  let s = fresh();
  const avant = idleNguBonuses(s).energyPowerMultiplier;
  s = acheter(s, "energyPotionAlpha").state;
  assert.ok(Math.abs(idleNguBonuses(s).energyPowerMultiplier / avant - 2) < 1e-9, "Energy Potion α : x2");
  s = acheter(s, "energyPotionBeta").state;
  assert.ok(Math.abs(idleNguBonuses(s).energyPowerMultiplier / avant - 4) < 1e-9, "α et β se cumulent : x4");
  // le timer est décompté par le moteur (3600 s)
  const apres = advanceIdleNguState(s, 3601, ctx, 2_000_000 + 3_601_000);
  assert.ok(Math.abs(idleNguBonuses(apres).energyPowerMultiplier / avant - 2) < 1e-9, "après 60 min il ne reste que la beta");
  // le Rebirth perd la beta
  assert.equal(Object.keys(apres.selloutEffects.remaining).length, 0);
}
{
  let s = fresh();
  const avant = idleNguBonuses(s).r3PowerMultiplier;
  s = acheter(s, "resource3PotionAlpha").state;
  assert.ok(Math.abs(idleNguBonuses(s).r3PowerMultiplier / avant - 3) < 1e-9, "Resource 3 Potion α : x3");
}
{
  let s = fresh();
  const avant = idleNguBonuses(s).dropMultiplier;
  s = acheter(s, "luckyCharm").state;
  assert.ok(Math.abs(idleNguBonuses(s).dropMultiplier / avant - 2) < 1e-9, "Lucky Charm : Drop Chance x2");
}
{
  let s = fresh();
  const avant = idleNguBonuses(s).diggerSlots;
  s = acheter(s, "diggerSlots").state;
  assert.equal(idleNguBonuses(s).diggerSlots, avant + 1);
}
{
  let s = fresh();
  s = acheter(s, "extraAccessorySlot1").state;
  s = acheter(s, "extraInventorySpace").state;
  s = normalizeIdleNguState(s, ctx, 3_000_000);
  assert.equal(s.adventure.bonusSlots.accessory, 1);
  assert.equal(s.adventure.bonusSlots.inventory, 1);
}
{
  let s = fresh();
  s = acheter(s, "littleBluePill1000").state;
  assert.equal(s.selloutEffects.bluePills, 1000);
}
console.log("idle-sellout-effects ok");
