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

// --- Transport réel : les actions de progression passent par window.__SOREAL_IDLE_CALL_V1__ (promesse), pas par google.script.run ---
{
  const joues = [];
  let reponse = { ok: true, joueur: {} };
  const fenetre = {
    __SOREAL_IDLE_AUDIO_V199__: { play: (n) => joues.push(n) },
    __SOREAL_IDLE_CALL_V1__: async () => reponse
  };
  new Function("window", "setInterval", "clearInterval", "Promise", achat)(fenetre, () => 0, () => {}, Promise);
  const attendre = () => new Promise((r) => setTimeout(r, 5));
  const res = await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyExpShop", item: "x", quantity: 1 }]);
  assert.equal(res, reponse, "la réponse d'origine est rendue telle quelle");
  await attendre();
  assert.deepEqual(joues, ["purchaseGold"], "achat EXP Shop par l'appel direct : pièces d'or");
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "sellShopBuy", itemId: "x" }]);
  await attendre();
  assert.deepEqual(joues, ["purchaseGold", "purchaseGem"], "achat Boutique AP par l'appel direct : gemme");
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyPerk", perkId: 1 }]);
  await attendre();
  assert.equal(joues[2], "purchase", "autre achat : caisse");
  reponse = { ok: false };
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyExpShop" }]);
  await attendre();
  assert.equal(joues.length, 3, "achat refusé : muet");
  assert.equal(fenetre.__SOREAL_IDLE_CALL_V1__.__sorealAchat, true);
}

// --- Équiper un objet : son « equip » (Adventure, ancien inventaire, MacGuffins) ---
{
  assert.ok(audio.includes('equip:{group:"inventory-equip"') && audio.includes("equip:equipJouer_") && audio.includes('equip:function(){return demander_("equip");}') && audio.includes("equip:{duree:520,construire:equipConstruire_}"), "son equip déclaré, jouable, exposé");
  const eq1 = ui.slice(ui.indexOf("function equiperObjetAdventureIdleV47_(id,slot){"), ui.indexOf("function desequiperObjetAdventureIdleV47_("));
  assert.ok(eq1.includes("jouerEffetAudioIdleV199_('equip');"), "équiper depuis Adventure (bouton, glisser-déposer, équiper par identifiant) joue le son");
  const eq2 = ui.slice(ui.indexOf("function equiperObjetIdleV10_("), ui.indexOf("const inventaire=", ui.indexOf("function equiperObjetIdleV10_(")));
  assert.ok(eq2.includes("jouerEffetAudioIdleV199_('equip');"), "équiper depuis l'ancien inventaire joue le son");
  assert.ok(readFileSync("cloudflare/public/modules/macguffins-v1.js", "utf8").includes("play('equip')"), "équiper un MacGuffin joue le son");
}

// --- Chiffres de vie du duel : ne dépassent jamais de la pastille (police qui rétrécit, puis retour à la ligne en dernier recours) ---
{
  const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
  const fit = ui.slice(ui.indexOf("function ajusterVieDuelIdleV1_("), ui.indexOf("window.addEventListener('resize',function(){", ui.indexOf("function ajusterVieDuelIdleV1_(")));
  assert.ok(fit.includes("element.scrollWidth>element.clientWidth+0.5") && fit.includes("taille-=0.5") && fit.includes("'white-space','normal','important'"), "ajustement de la police puis repli sur deux lignes");
  assert.ok(ui.includes("ajusterVieDuelIdleV1_(element,change);"), "appelé à chaque mise à jour du texte de combat");
  assert.ok(/soreal-idle-duel-hp-v41 \.soreal-idle-note-v4\{\s+overflow:hidden;/.test(css), "la pastille ne laisse rien sortir");
}

// --- Le texte de narration ne dépend pas d'un second texte : voir idle-voice-pregenerated-v1 (histoire du boss 4) ---
console.log("idle-shop-sounds-achievements-menu-v1 OK");
