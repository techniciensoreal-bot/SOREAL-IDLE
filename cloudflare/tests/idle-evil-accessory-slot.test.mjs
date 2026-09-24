import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguBonuses } from "../src/idle-ngu-progression.js";
import { idleSelloutShopItemV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * 2026-09-24 — audit des pages-guides.
 *  - « An Evil Accessory Slot » (4G's Sellout Shop, Special 3, 500 000 AP, achat verrouillé hors
 *    Evil ; Advanced Guide : utilisable ensuite en Normal ; Builds : 6 slots viennent de la boutique).
 */
const ctx = { bosses: 100 };
const T = 2_000_000;
const neuf = () => {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.selloutShop.unlockedEver = true;
  return s;
};

// Evil Accessory Slot
{
  const item = idleSelloutShopItemV1("extraAccessorySlotEvil");
  assert.ok(item, "l'objet existe");
  assert.equal(item.name, "An Evil Accessory Slot");
  const acheter = (s) => applyIdleNguAction(s, { action: "sellShopBuy", itemId: "extraAccessorySlotEvil" }, ctx, T).state;

  let s = neuf();
  s.currencies.ap = 2_000_000;
  assert.throws(() => acheter(s), /DIFFICULTE_REQUISE/, "verrouillé en Normal");
  assert.equal(s.currencies.ap, 2_000_000, "rien n'est débité");

  s.difficulty = "difficile";
  const slotsAvant = normalizeIdleNguState(s, ctx, T).adventure.bonusSlots.accessory;
  s = acheter(s);
  assert.equal(s.currencies.ap, 1_500_000, "500 000 AP");
  s = normalizeIdleNguState(s, ctx, T + 1000);
  assert.equal(s.adventure.bonusSlots.accessory, slotsAvant + 1, "+1 emplacement d'accessoire");
  assert.throws(() => acheter(s), /OBJET_AU_MAXIMUM/, "achat unique");

  // Retour en Normal : le slot reste.
  s.difficulty = "normal";
  s = normalizeIdleNguState(s, ctx, T + 2000);
  assert.equal(s.adventure.bonusSlots.accessory, slotsAvant + 1, "utilisable en Normal");
}

console.log("idle-evil-accessory-slot OK");
