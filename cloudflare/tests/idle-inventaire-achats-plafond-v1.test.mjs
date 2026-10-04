import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-progression.js";
import { idleSelloutShopItemV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Norman (2026-10-04) : « vérifie que si on est à 33/36 espaces d'inventaire, on ne puisse pas acheter 10 places : ça doit rester limité à 3 même si on demande 10, sinon ce serait une faille pour avoir plus
 * d'inventaire que prévu. » Les deux boutiques qui vendent des places : EXP (« Inventory Space », 36 au maximum, achat par lot possible) et AP (« Extra Inventory Space », 166 au maximum, un achat à la fois).
 */
const ctx = { bosses: 10 };
const nouveau = () => { const s = normalizeIdleNguState({}, ctx, 1_000); s.currencies.experience = 1e15; s.currencies.ap = 1e15; return s; };
const places = (s) => Number(s.bonuses.expShop.inventorySpace || 0);

// Boutique EXP : 33 places achetées sur 36, on en demande 10 -> 3 seulement.
{
  assert.equal(IDLE_NGU_EXP_SHOP_V1.inventorySpace.max, 36);
  const s = nouveau();
  s.bonuses.expShop.inventorySpace = 33;
  const exp0 = s.currencies.experience;
  const r = applyIdleNguAction(s, { action: "buyExpShop", item: "inventorySpace", quantity: 10 }, ctx, 2_000);
  assert.equal(r.result.bought, 3, "3 places seulement");
  assert.equal(places(r.state), 36, "plafond de 36 respecté");
  const attendu = [33, 34, 35].reduce((t, n) => t + IDLE_NGU_EXP_SHOP_V1.inventorySpace.cost(n), 0);
  assert.equal(exp0 - r.state.currencies.experience, attendu, "seules les 3 places réellement données sont facturées");
  // Au maximum : plus rien, quel que soit le lot demandé.
  for (const quantity of [1, 10, 1000, 1e9, Infinity, "10", -5, 1.9]) {
    assert.throws(() => applyIdleNguAction(r.state, { action: "buyExpShop", item: "inventorySpace", quantity }, ctx, 3_000), /ACHAT_AU_MAXIMUM/, "quantité " + quantity);
    assert.equal(places(r.state), 36);
  }
}
// Même depuis zéro, un lot énorme s'arrête à 36 (le lot est plafonné par l'argent ET par le maximum).
{
  const s = nouveau();
  const r = applyIdleNguAction(s, { action: "buyExpShop", item: "inventorySpace", quantity: 1e9 }, ctx, 2_000);
  assert.equal(places(r.state), 36);
  assert.equal(r.result.bought, 36);
}
// Un état déjà au-delà du maximum (donnée corrompue) n'achète rien de plus.
{
  const s = nouveau();
  s.bonuses.expShop.inventorySpace = 40;
  assert.throws(() => applyIdleNguAction(s, { action: "buyExpShop", item: "inventorySpace", quantity: 10 }, ctx, 2_000), /ACHAT_AU_MAXIMUM/);
}

// Boutique AP : un seul achat à la fois, la quantité envoyée est ignorée, le maximum (166) est un mur.
{
  assert.equal(idleSelloutShopItemV1("extraInventorySpace").max, 166);
  const s = nouveau();
  s.selloutShop = { purchases: { extraInventorySpace: 163 } };
  s.currencies.ap = 1e12;
  let etat = s;
  for (let i = 0; i < 3; i++) {
    etat = applyIdleNguAction(etat, { action: "sellShopBuy", itemId: "extraInventorySpace", quantity: 10, times: 10, count: 10 }, ctx, 2_000 + i).state;
    assert.equal(etat.selloutShop.purchases.extraInventorySpace, 164 + i, "un achat par demande, même si on en réclame 10");
  }
  assert.equal(etat.selloutShop.purchases.extraInventorySpace, 166);
  assert.throws(() => applyIdleNguAction(etat, { action: "sellShopBuy", itemId: "extraInventorySpace", quantity: 10 }, ctx, 3_000), /OBJET_AU_MAXIMUM/);
  assert.equal(etat.selloutShop.purchases.extraInventorySpace, 166, "jamais plus de 166");
}
console.log("idle-inventaire-achats-plafond-v1: OK");
