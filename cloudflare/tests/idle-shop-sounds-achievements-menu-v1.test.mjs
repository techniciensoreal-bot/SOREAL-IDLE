import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-26) : (1) « le menu Achievements n'apparaît que quand on débloque le premier achievement » ;
 * (2) « un bruit de Gold pour un achat dans EXP Shop ; pour l'AP, un bruit de pierre précieuse ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const achat = readFileSync("cloudflare/public/modules/purchase-sound-v1.js", "utf8");

// --- Menu Achievements : caché tant qu'aucun succès n'est débloqué ---
{
  const i = ui.indexOf("if(id==='succes'){");
  assert.ok(i > 0, "règle propre au menu Achievements");
  const bloc = ui.slice(i, ui.indexOf("const systemeId=IDLE_SYSTEME_PAR_MENU_V1[id];", i));
  assert.ok(/j\.systemes\.achievements/.test(bloc) && /\.list\.some\(function\(a\)\{return a&&a\.unlocked;\}\)/.test(bloc) && /return false;/.test(bloc), "faux tant qu'aucun succès n'est débloqué");
}

// --- Sons d'achat : or (EXP Shop), gemme (Boutique AP), caisse pour les autres ---
{
  const fenetre = { google: undefined };
  new Function("window", "setInterval", "clearInterval", achat)(fenetre, () => 0, () => {});
  const p = fenetre.__SOREAL_IDLE_PURCHASE_SOUND_V1__;
  const action = (a) => ["agirProgressionSorealIdle", ["joueur", { action: a }]];
  assert.equal(p.sonAchat("agirProgressionSorealIdle", ["joueur", { action: "buyExpShop" }]), "purchaseGold");
  assert.equal(p.sonAchat("agirProgressionSorealIdle", ["joueur", { action: "sellShopBuy" }]), "purchaseGem");
  for (const a of ["buyPerk", "buyQuirk", "buyResource", "buyDigger"]) assert.equal(p.sonAchat(...action(a)), "purchase", a);
  assert.equal(p.sonAchat("acheterAmeliorationSorealIdle", []), "purchase");
  assert.equal(p.estAchat("agirProgressionSorealIdle", ["joueur", { action: "buyExpShop" }], { ok: false }), false, "achat refusé : muet");
}
for (const nom of ["purchaseGold", "purchaseGem"]) {
  assert.ok(audio.includes(nom + ":{group:\"purchase\""), nom + " déclaré (même groupe que la caisse : jamais deux achats superposés)");
  assert.ok(audio.includes(nom + ":function(){return demander_(\"" + nom + "\");}"), nom + " jouable");
  assert.ok(audio.includes(nom + ":{duree:"), nom + " exposé pour le rendu hors ligne");
}
assert.ok(/function gemmeConstruire_[\s\S]*?2\.32[\s\S]*?4\.25/.test(audio) && !/function gemmeConstruire_[\s\S]{0,900}type:"square"/.test(audio), "la gemme est un carillon de cristal (partiels inharmoniques), sans son de métal");

console.log("idle-shop-sounds-achievements-menu-v1 OK");
