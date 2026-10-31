import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { lireUiComplet } from "./_ui-sources.mjs";

/*
 * Alerte de fruit prêt d'Yggdrasil (Norman, 2026-10-31) : l'achat « Yggdrasil Harvest Light » (boutique AP) fait briller le bouton du menu
 * (même lueur que le Trou sans fond) ET les fruits prêts dans la page. Sans l'achat : rien. Fruit pas prêt ou mangé : rien.
 */
const ctx = { bosses: 100 };
const snap = (s) => idleNguSnapshot(s, ctx, 1).yggExtra;
function etat(acheter) {
  let s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  const f = s.systems.yggdrasil.data.fruits.gold;
  f.tier = 3; f.active = true; f.growthHours = 3; f.firstHarvestThisRun = false;
  if (acheter) {
    s.currencies.ap = 50000;
    s = applyIdleNguAction(s, { action: "sellShopBuy", itemId: "yggdrasilHarvestLight" }, ctx, 1).state;
  }
  return s;
}

// Sans achat : aucune lueur, aucun fruit désigné, même avec un fruit mûr.
{
  const x = snap(etat(false));
  assert.equal(x.harvestLight.lit, false);
  assert.deepEqual(x.harvestLightFruits, []);
}
// Avec achat et fruit mûr : menu allumé et le fruit est désigné.
{
  const x = snap(etat(true));
  assert.equal(x.harvestLight.lit, true);
  assert.deepEqual(x.harvestLightFruits, ["gold"]);
}
// Fruit pas prêt : rien.
{
  const s = etat(true);
  s.systems.yggdrasil.data.fruits.gold.growthHours = 2;
  const x = snap(s);
  assert.equal(x.harvestLight.lit, false);
  assert.deepEqual(x.harvestLightFruits, []);
}
// Fruit mangé (inactif, croissance remise à 0) : plus rien.
{
  const s = etat(true);
  const f = s.systems.yggdrasil.data.fruits.gold;
  f.active = false; f.growthHours = 0;
  const x = snap(s);
  assert.equal(x.harvestLight.lit, false);
  assert.deepEqual(x.harvestLightFruits, []);
}
// Deux fruits : le menu reste allumé tant qu'il en reste un prêt, puis s'éteint.
{
  const s = etat(true);
  const f2 = s.systems.yggdrasil.data.fruits.powerAlpha;
  f2.tier = 2; f2.active = true; f2.growthHours = 2; f2.firstHarvestThisRun = false;
  let x = snap(s);
  assert.equal(x.harvestLight.lit, true);
  s.systems.yggdrasil.data.fruits.gold.active = false;
  x = snap(s);
  assert.equal(x.harvestLight.lit, x.harvestLightFruits.length > 0);
}

// Client : bouton de menu (même mécanisme que le Trou sans fond : vert + lueur pulsante .soreal-idle-nav-dispo-v1), uniquement via le drapeau serveur.
{
  const ui = lireUiComplet();
  assert.ok(/m\.id==='yggdrasil'&&yggExtraNav&&yggExtraNav\.harvestLight&&yggExtraNav\.harvestLight\.lit\s*\?' soreal-idle-nav-money-green-v1 soreal-idle-nav-dispo-v1'/.test(ui), "menu Yggdrasil : même lueur que le Money Pit");
}
// Client : page, seuls les fruits désignés par le serveur brillent.
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
assert.ok(src.includes("x.harvestLightFruits") && src.includes("d.brille&&d.brille[id]&&v.active&&v.tier>0"), "la carte ne brille que pour un fruit désigné, actif et possédé");
assert.ok(src.includes("(alerte?' ygg-alerte':'')"));
// Boucles parfaites (règle n°3).
const lueur = src.match(/@keyframes yggFruitAlerte\{0%,100%\{[^}]*\}50%\{/);
assert.ok(lueur, "lueur du fruit : départ = arrivée (0 % = 100 %)");
const eclat = src.match(/@keyframes yggEclatAlerte\{0%\{background-position:0 0\}100%\{background-position:150% 0\}\}/);
assert.ok(eclat, "éclat : glissement d'exactement une tuile (tuile de 300 % -> 150 % de décalage)");
assert.ok(src.includes("/300% 100% repeat-x"), "une seule couche, taille de tuile explicite");
assert.ok(/prefers-reduced-motion:reduce\)\{\.ygg-carte\.ygg-alerte \.ygg-vitre\.ygg-decor \.ygg-fruit\.ygg-mur\{animation:none/.test(src) && src.includes(".ygg-vitre::after{animation:none;display:none}"), "mouvement réduit : lueur fixe, plus d'éclat");
console.log("idle-yggdrasil-alerte-fruit-v1: OK");
