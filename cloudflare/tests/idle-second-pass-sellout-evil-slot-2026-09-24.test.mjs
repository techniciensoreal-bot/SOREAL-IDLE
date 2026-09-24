import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idleSelloutShopItemV1, idleSelloutShopNextCostV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Audit de seconde passe (2026-09-24) : 4G's Sellout Shop, « An Evil Accessory Slot » (500 000 AP,
 * « I arbitrarily locked buying this until you're in Evil difficulty »). Omis jusqu'ici « tant que la difficulté
 * Evil n'existe pas » : elle existe. Test 2026-09-24 : l'ancien test d'omission de idle-sellout-shop.test.mjs ne
 * porte que sur le commentaire d'en-tête, pas sur le catalogue.
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;

const item = idleSelloutShopItemV1("extraAccessorySlotEvil");
assert.ok(item, "l'objet est catalogué");
assert.equal(idleSelloutShopNextCostV1(item, 0), 500000);
assert.equal(item.max, 1);

function etat(difficulte) {
  const s = normalizeIdleNguState({}, ctx, T0);
  s.currencies.ap = 600_000;
  s.difficulty = difficulte;
  s.selloutShop.unlockedEver = true;
  return s;
}
const acheter = (s) => applyIdleNguAction(s, { action: "sellShopBuy", itemId: "extraAccessorySlotEvil" }, ctx, T0 + 1000).state;

/* Refusé en Normal, sans débit. */
{
  const s = etat("normal");
  assert.throws(() => acheter(s), /DIFFICULTE_REQUISE/);
  assert.equal(s.currencies.ap, 600_000);
}

/* Accepté en Evil : 500 000 AP débités, +1 emplacement d'accessoire. */
{
  const avant = etat("difficile");
  avant.adventure.bonusSlots = avant.adventure.bonusSlots || {};
  const base = normalizeIdleNguState(JSON.parse(JSON.stringify(avant)), ctx, T0).adventure.bonusSlots.accessory;
  const r = acheter(avant);
  assert.equal(r.selloutShop.purchases.extraAccessorySlotEvil, 1);
  assert.equal(r.currencies.ap, 100_000);
  const apres = normalizeIdleNguState(JSON.parse(JSON.stringify(r)), ctx, T0 + 2000).adventure.bonusSlots.accessory;
  assert.equal(apres, base + 1, "un emplacement d'accessoire de plus");
  /* Une fois acquis, l'emplacement reste (retour en Normal). */
  r.difficulty = "normal";
  const encore = normalizeIdleNguState(JSON.parse(JSON.stringify(r)), ctx, T0 + 3000).adventure.bonusSlots.accessory;
  assert.equal(encore, base + 1);
}

/* Accepté en Sadistic (choix documenté). */
{
  const r = acheter(etat("extreme"));
  assert.equal(r.selloutShop.purchases.extraAccessorySlotEvil, 1);
}

console.log("idle-second-pass-sellout-evil-slot-2026-09-24 ok");
