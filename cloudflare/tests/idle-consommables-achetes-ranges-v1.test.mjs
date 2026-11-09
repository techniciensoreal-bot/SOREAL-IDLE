import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IDLE_POTIONS_STOCK_V1, IDLE_SELLOUT_SHOP_CATALOG_V1, idleSelloutApplyEffectV1, idleSelloutUsePotionV1, createSelloutEffectsV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Norman (2026-11-09) : « aucun consommable qu'on achète ne doit s'utiliser à l'achat. Les barres d'énergie fonctionnent encore comme ça. Tout ce qui est acheté en consommable doit être stocké dans la valise et utilisé quand bon nous semble ».
 * Les Bar Bars, le MacGuffin Muffin et le Mayo Infuser (effets à durée, jusque-là actifs dès l'achat) sont rangés dans la valise comme les potions et ne s'activent que par « Utiliser ».
 * Restent des RÉSERVES consommées par l'événement qu'elles modifient, sans minuteur à lancer : pilules (par kill), Beast Butter (prochaine quête), fertilisant / Poop (par fruit), stylos noirs (prochaine carte).
 */
for (const id of ["energyBarBar", "magicBarBar", "macguffinMuffin", "mayoInfuser"]) {
  assert.ok(IDLE_POTIONS_STOCK_V1.includes(id), id + " est rangé dans la valise");
  const state = { selloutEffects: createSelloutEffectsV1({}) };
  idleSelloutApplyEffectV1(state, id, 2);
  assert.equal(state.selloutEffects.stock[id], 2, id + " : 2 achetés = 2 en réserve");
  assert.deepEqual(state.selloutEffects.remaining, {}, id + " : rien d'actif à l'achat");
  assert.deepEqual(state.selloutEffects.armed, {}, id + " : rien d'armé à l'achat");
  const r = idleSelloutUsePotionV1(state, id);
  assert.equal(r.reste, 1);
  assert.equal(state.selloutEffects.stock[id], 1, id + " : un de moins en réserve");
  assert.ok(Object.keys(state.selloutEffects.remaining).length > 0, id + " : l'effet à durée est lancé par « Utiliser »");
}
{
  const s = { selloutEffects: createSelloutEffectsV1({}) };
  idleSelloutApplyEffectV1(s, "energyBarBar", 1);
  idleSelloutUsePotionV1(s, "energyBarBar");
  assert.equal(s.selloutEffects.remaining.energyBars, 3600, "Bar Bar d'énergie : 60 minutes, comme avant");
  const m = { selloutEffects: createSelloutEffectsV1({}) };
  idleSelloutApplyEffectV1(m, "macguffinMuffin", 1);
  idleSelloutUsePotionV1(m, "macguffinMuffin");
  assert.equal(m.selloutEffects.remaining.macguffinMuffin, 86400);
  assert.equal(m.selloutEffects.armed.macguffinMuffin, true, "le Muffin garde son armement (au moins un Rebirth)");
}
// la sauvegarde garde ces réserves (createSelloutEffectsV1 ne filtre que les ids inconnus)
{
  const fx = createSelloutEffectsV1({ stock: { energyBarBar: 3, magicBarBar: 1, mayoInfuser: 2, macguffinMuffin: 1, inconnu: 9 } });
  assert.deepEqual(fx.stock, { energyBarBar: 3, magicBarBar: 1, macguffinMuffin: 1, mayoInfuser: 2 });
}
// aucun objet de la boutique à effet à durée n'échappe à la valise (sauf les réserves à l'événement)
const SANS_VALISE = new Set(["littleBluePill1000", "littleBluePill10000", "littleBluePill100000", "beastButter1", "beastButter10", "beastButter100", "icarusFertilizer1", "icarusFertilizer10", "icarusFertilizer100", "regularBlackPens"]);
const shop = readFileSync(new URL("../src/idle-sellout-shop-v1.js", import.meta.url), "utf8");
const effets = shop.slice(shop.indexOf("export const IDLE_SELLOUT_EFFECTS_V1"), shop.indexOf("export const IDLE_SELLOUT_EFFECTS_V1") + 4500);
for (const [, id, def] of effets.matchAll(/^\s{2}(\w+): (\{[^}]*\})/gm)) {
  if (/timer:|beta:|arm:/.test(def)) assert.ok(IDLE_POTIONS_STOCK_V1.includes(id) || SANS_VALISE.has(id), id + " : un effet à durée acheté doit être rangé dans la valise");
}
assert.ok(IDLE_SELLOUT_SHOP_CATALOG_V1.some((x) => x.id === "energyBarBar"));
// la valise (page) sait les afficher et les utiliser
const valise = readFileSync(new URL("../public/modules/valise-v1.js", import.meta.url), "utf8");
for (const id of ["energyBarBar", "magicBarBar", "macguffinMuffin", "mayoInfuser"]) assert.ok(valise.includes("{id:'" + id + "',nom:"), id + " : article de la valise");
const snap = readFileSync(new URL("../src/idle-ngu-snapshot.js", import.meta.url), "utf8");
assert.ok(snap.includes('"macguffinMuffin", "mayoInfuser"]) {'), "les minuteurs du Muffin et de l'Infuseur sont envoyés à la valise (effets en cours)");
console.log("idle-consommables-achetes-ranges-v1: OK");
