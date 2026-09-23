import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_SPECIALS,
  IDLE_ADVENTURE_WIKI_ITEM_IDS_V1,
  IDLE_ADVENTURE_ITEM_SETS_V1,
  idleAdventureEquipmentStatsV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";
import {
  IDLE_SELLOUT_SHOP_CATALOG_V1,
  idleSelloutShopItemV1,
  idleSelloutShopEffectActiveV1,
  idleSelloutShopBuyV1
} from "../src/idle-sellout-shop-v1.js";
import { IDLE_HEARTS_V1 } from "../src/idle-hearts-v1.js";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Cœurs du 4G's Sellout Shop -- valeurs verrouillées sur le miroir NGU-Wiki :
 * fiches "My <X> Heart" (Id, Stats, Specials : Base value / Max stat at lvl 0 /
 * Max stat at max lvl), section Items du "4G's Sellout Shop" (prix en AP).
 */

// [id, wikiId, prix AP, Power lvl0, Toughness lvl0, Power/Toughness "Base value", specials [type, base, max0, max100]]
const FICHES = [
  ["heartRed", 119, 225000, 100, 100, 69, [["dropChancePct", 0, 30, 60], ["expPct", 2.5, 5, 10]]],
  ["heartYellow", 129, 150000, 100, 100, 69, [["apPct", 5, 10, 20], ["goldDropsPct", 0, 300, 600]]],
  ["heartBrown", 162, 225000, 100, 100, 69, [["energyPowerPct", 100, 100, 200], ["magicPowerPct", 100, 100, 200], ["seedGainPct", 0, 35, 70]]],
  ["heartGreen", 171, 225000, 100, 100, 69, [["beardSpeedPct", 30, 30, 60], ["dropChancePct", 50, 50, 100], ["respawnReductionPct", 4, 4, 8]]],
  ["heartBlue", 196, 225000, 420, 420, 69, [["goldDropsPct", 100, 100, 200], ["nguSpeedPct", 40, 40, 80]]],
  ["heartPurple", 212, 225000, 100, 1000, 69, [["beardSpeedPct", 40, 40, 80], ["dropChancePct", 40, 40, 80]]],
  ["heartOrange", 293, 225000, 100, 1000, 69, [["goldDropsPct", 300, 300, 600], ["questDropsPct", 5, 5, 10]]],
  ["heartGrey", 297, 225000, 1000000, 1000000, 1000000, [["r3CapPct", 20, 20, 40], ["r3BarsPct", 20, 20, 40]]],
  ["heartPink", 344, 225000, 3000000, 3000000, 3000000, [["daycareSpeedPct", 10, 10, 20], ["wishSpeedPct", 10, 10, 20]]],
  ["heartRainbow", 390, 500000, 100, 100, 69, [["cookingPct", 0, 69000000, 138000000], ["r3BarsPct", 100, 100, 200], ["seedGainPct", 30, 30, 60]]]
];

assert.equal(IDLE_HEARTS_V1.length, 10);
for (const [id, wikiId, prix, p, t, base, specials] of FICHES) {
  const d = IDLE_ADVENTURE_SPECIALS[id];
  assert.ok(d, `${id} défini dans SPECIALS`);
  assert.equal(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[id], wikiId, `${id} : Id wiki`);
  assert.equal(d.slot, "accessory", `${id} : Type Accessory`);
  assert.equal(d.zone, "", `${id} : jamais lâché en Aventure`);
  assert.deepEqual([d.p, d.t], [p, t], `${id} : Power/Toughness "Max stat at lvl 0"`);
  // Toughness de Purple/Orange : base 69 (comme Power) ; Grey/Pink : base = max lvl 0.
  assert.equal(d.pBase, base, `${id} : Power "Base value"`);
  assert.equal(d.tBase, base, `${id} : Toughness "Base value"`);
  const [premier, ...autres] = specials;
  assert.deepEqual([d.sType, d.sBase, d.sMax], premier.slice(0, 3), `${id} : 1er Special`);
  assert.equal(premier[3], 2 * premier[2], `${id} : max lvl = 2 x max lvl 0`);
  assert.deepEqual((d.sExtra || []).map((x) => [x.type, x.base, x.max0, x.max100]), autres, `${id} : Specials suivants`);

  const shop = idleSelloutShopItemV1(id);
  assert.equal(shop.cost(0), prix, `${id} : prix Sellout`);
  assert.equal(shop.max, null, `${id} : "each item can be bought multiple times"`);
  assert.equal(idleSelloutShopEffectActiveV1(shop), true, `${id} : achetable`);
  assert.deepEqual(IDLE_ADVENTURE_ITEM_SETS_V1[id].items, [id], `${id} : set à un objet`);
}
assert.equal(IDLE_SELLOUT_SHOP_CATALOG_V1.filter((x) => x.category === "items").length, 10);

// HP Max / HP regen des fiches = 3 x Power et 0,03 x Toughness (dérivés par le moteur).
{
  let s = normalizeIdleNguState({}, {}, 0);
  s.currencies.ap = 225000;
  s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartPurple" }, {}, 1).state;
  const coeur = s.adventure.inventory.find((x) => x.definitionId === "heartPurple");
  // On le monte au maximum de ses stats niveau 0 pour lire les dérivés de la fiche (HP 300, regen 30).
  coeur.power = 100;
  coeur.toughness = 1000;
  const a = applyIdleAdventureActionV47(s.adventure, { action: "equip", id: coeur.id, slot: "accessory" }, {}).state;
  const stats = idleAdventureEquipmentStatsV47(a);
  assert.equal(stats.hp, 300, "Purple Heart : HP Max 300 au niveau 0");
  assert.ok(Math.abs(stats.regen - 30) < 1e-9, "Purple Heart : HP regen 30 au niveau 0");
}

// ---------- Achat : AP débité, objet livré niveau 0 avec ses "Base value" ----------
{
  let s = normalizeIdleNguState({}, {}, 0);
  s.currencies.ap = 500000;
  const r = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartRed" }, {}, 1);
  s = r.state;
  assert.equal(s.currencies.ap, 275000, "225 000 AP débités");
  const coeur = s.adventure.inventory.find((x) => x.definitionId === "heartRed");
  assert.ok(coeur, "My Red Heart livré dans l'inventaire");
  assert.equal(coeur.level, 0);
  assert.equal(coeur.wikiItemId, 119);
  assert.deepEqual([coeur.power, coeur.toughness, coeur.special], [69, 69, 0], "Base value : 69 / 69 / Drop Chance 0 %");
  // Deuxième achat autorisé (pour fusionner vers le niveau 100).
  s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartRed" }, {}, 2).state;
  assert.equal(s.currencies.ap, 50000);
  assert.equal(s.adventure.inventory.filter((x) => x.definitionId === "heartRed").length, 2);
  assert.equal(s.selloutShop.purchases.heartRed, 2);
  // AP insuffisant : rien n'est livré.
  assert.throws(() => applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartRed" }, {}, 3), /AP_INSUFFISANT/);
}

// Yellow Heart équipé : Special AP (Base value 5 %) exposé dans specials.apPct.
{
  let s = normalizeIdleNguState({}, {}, 0);
  s.currencies.ap = 150000;
  s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartYellow" }, {}, 1).state;
  const coeur = s.adventure.inventory.find((x) => x.definitionId === "heartYellow");
  const a = applyIdleAdventureActionV47(s.adventure, { action: "equip", id: coeur.id, slot: "accessory" }, {}).state;
  assert.equal(idleAdventureEquipmentStatsV47(a).specials.apPct, 5);
}

// Inventaire plein : aucun AP débité.
{
  let s = normalizeIdleNguState({}, {}, 0);
  s.currencies.ap = 1e9;
  let achats = 0;
  assert.throws(() => {
    for (let i = 0; i < 1000; i++) {
      s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartYellow" }, {}, i + 1).state;
      achats++;
    }
  }, /INVENTAIRE_PLEIN/);
  assert.ok(achats > 0 && achats < 1000);
  assert.equal(s.currencies.ap, 1e9 - achats * 150000, "l'achat refusé n'a rien débité");
  assert.equal(s.selloutShop.purchases.heartYellow, achats);
}

// My Grey Heart : "unlocked by Resource 3 unlocked".
{
  let s = normalizeIdleNguState({}, {}, 0);
  s.currencies.ap = 1e6;
  s.systems.hacks.unlocked = false;
  assert.throws(() => applyIdleNguAction(s, { action: "sellShopBuy", itemId: "heartGrey" }, {}, 1), /R3_VERROUILLEE/);
  assert.equal(s.currencies.ap, 1e6);
}

// Un appel direct au Sellout ne peut jamais débiter un cœur sans livrer l'objet.
{
  const s = { currencies: { ap: 1e6 }, selloutShop: { purchases: {} } };
  assert.throws(() => idleSelloutShopBuyV1(s, "heartRed"), /OBJET_AVENTURE_NON_LIVRE/);
  assert.equal(s.currencies.ap, 1e6);
}

console.log("idle-hearts-items-shop: OK");
