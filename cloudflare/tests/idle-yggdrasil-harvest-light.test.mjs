import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { idleSelloutShopItemV1, idleSelloutShopEffectActiveV1 } from "../src/idle-sellout-shop-v1.js";

/*
 * Yggdrasil Harvest Light, 2026-09-24. 4G's Sellout Shop : « Buy this to have
 * the Yggdrasil menu light up when fruit is fully grown and ready to be eaten
 * of harvested », 50,000 AP ; page Yggdrasil : « also light up for the first
 * harvest of a rebirth » ; Build History 2018 : « any fruit at the max tier
 * that can't grow any further ».
 */
const ctx = { bosses: 100 };
const lumiere = (s) => idleNguSnapshot(s, ctx, 1).yggExtra.harvestLight;

{
  const item = idleSelloutShopItemV1("yggdrasilHarvestLight");
  assert.equal(item.cost(0), 50000);
  assert.equal(item.max, 1);
  assert.equal(idleSelloutShopEffectActiveV1("yggdrasilHarvestLight"), true, "achetable (plus d'EFFET_BOUTIQUE_AP_INACTIF)");
}

function etat(acheter) {
  let s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  const f = s.systems.yggdrasil.data.fruits.gold;
  f.tier = 3;
  f.active = true;
  f.growthHours = 2;
  f.firstHarvestThisRun = false;
  if (acheter) {
    s.currencies.ap = 50000;
    s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "yggdrasilHarvestLight" }, ctx, 1).state;
    assert.equal(s.currencies.ap, 0, "50 000 AP débités");
  }
  return s;
}

// Sans l'achat : jamais allumée.
{
  const s = etat(false);
  s.systems.yggdrasil.data.fruits.gold.growthHours = 3;
  assert.deepEqual(lumiere(s), { owned: false, lit: false });
}

// Avec l'achat : allumée quand le fruit ne pousse plus (croissance = tier).
{
  const s = etat(true);
  assert.deepEqual(lumiere(s), { owned: true, lit: false }, "2 h sur 3 : encore en croissance");
  s.systems.yggdrasil.data.fruits.gold.growthHours = 3;
  assert.equal(lumiere(s).lit, true, "tier atteint : totalement mûr");
  s.systems.yggdrasil.data.fruits.gold.active = false;
  assert.equal(lumiere(s).lit, false, "fruit inactif");
}

// Première récolte du Rebirth : dès que le fruit est prêt (1 h).
{
  const s = etat(true);
  const f = s.systems.yggdrasil.data.fruits.gold;
  f.firstHarvestThisRun = true;
  f.growthHours = 0.5;
  assert.equal(lumiere(s).lit, false, "pas encore prêt");
  f.growthHours = 1;
  assert.equal(lumiere(s).lit, true, "prêt, première récolte du Rebirth");
}

// Client : le bouton de menu Yggdrasil lit yggExtra.harvestLight.lit.
{
  const ui = fs.readFileSync(new URL("../public/soreal-idle-ui.js", import.meta.url), "utf8");
  assert.ok(/m\.id==='yggdrasil'&&yggExtraNav&&yggExtraNav\.harvestLight&&yggExtraNav\.harvestLight\.lit/.test(ui));
}

console.log("idle-yggdrasil-harvest-light: OK");
