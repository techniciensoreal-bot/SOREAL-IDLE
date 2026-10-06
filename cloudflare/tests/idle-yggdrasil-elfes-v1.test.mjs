import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { choisirCleYggR2_ } from "../src/idle-media-v1.js";

/*
 * Page Yggdrasil « elfique » (Norman, 2026-10-06) : 9 fruits par page en grille 3 x 3, une image par fruit (R2, dossier idle/yggdrasil/), graines et poop,
 * boutons Activer / Améliorer / Manger / Récolter, « tout manger ou récolter », anti-spoil (fruit verrouillé et page 2 vide invisibles).
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
const actions = [];
let rafraichi = 0;
const fenetre = {
  __SOREAL_IDLE_META_HOST_V130__: {
    idleHtml_: (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    formatterHeuresIdleV47_: (h) => Math.round(h * 10) / 10 + " h",
    rafraichirMenuRacineIdleV28_: () => { rafraichi += 1; },
    getIdleEtat: () => etatJoueur
  },
  __SOREAL_IDLE_ICONES_V1__: { pour: () => "🌿" },
  __actionMetaV47__: (p) => actions.push(p)
};
fenetre.window = fenetre;
fenetre.setTimeout = setTimeout;
fenetre.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({}), querySelector: () => null };
let verrouMac = false;
let etatJoueur = null;
fenetre.__SOREAL_IDLE_META_V130__ = {
  systemeMetaParIdIdleV130_: (j, id) => (id === "yggdrasil" ? j.systemes.systems[0] : id === "macguffins" ? { state: { unlocked: !verrouMac } } : null)
};
vm.runInNewContext(src, fenetre, { filename: "yggdrasil-elfes-v1.js" });
const Y = fenetre.__SOREAL_IDLE_YGG_V1__;
assert.ok(Y && typeof Y.page === "function", "module exposé");

const noms = ["gold", "powerAlpha", "adventure", "knowledge", "pomegranate", "luck", "powerBeta", "arbitrariness", "numbers", "rage", "macguffinAlpha", "powerDelta"];
function joueur(nbVisibles, debloque = true) {
  const fruits = {}, xf = {};
  noms.forEach((id, i) => {
    fruits[id] = { tier: i < nbVisibles ? (i % 3) + 1 : 0, active: i % 2 === 0, growthHours: i % 2 === 0 ? 2 : 0 };
    xf[id] = { unlocked: i < nbVisibles, activationCost: 1000, nextTierCost: i === 0 ? null : 10, autoShopId: "ygg" + id, autoCost: 300, autoRequiredCap: 1e6 };
  });
  return { systemes: { currencies: { seeds: 322, experience: 5000 }, yggFruits: noms.map((id) => ({ id, name: "Fruit of " + id, resource: "energy" })), yggExtra: { poop: 10, poopFactor: 1.5, maxTier: 10, tierSeconds: 3600, fruits: xf }, systems: [{ id: "yggdrasil", state: { unlocked: debloque, data: { fruits, runPowerAlphaValue: 0, permanent: { luckDropPct: 100 } } } }] } };
}

// Verrouillé : rien.
assert.equal(Y.page(joueur(5, false)), "", "système verrouillé : aucune page");

// 12 fruits visibles : 9 sur la page 1, 3 sur la page 2, deux onglets.
etatJoueur = joueur(12);
verrouMac = false;
let h = Y.page(etatJoueur);
assert.equal((h.match(/class="ygg-carte[ "]/g) || []).length, 9, "9 fruits par page");
assert.equal((h.match(/class="ygg-onglet"/g) || []).length, 2, "deux onglets");
assert.ok(h.includes("/api/idle/media/ygg?name=gold") && h.includes("/api/idle/media/item?wikiItemId=92") && !h.includes("name=seed") && h.includes("/shop/fertilizer.png") && !h.includes("name=poop"), "fruits : R2 ; graine : Item_0092_A_Giant_Seed ; poop : image de la boutique AP");
assert.ok(h.includes("(2/10)"), "tier / tier max");
assert.ok(h.includes("avec du caca)"), "sous-titre demandé");
Y.aller(2);
h = Y.page(etatJoueur);
assert.equal((h.match(/class="ygg-carte[ "]/g) || []).length, 3, "3 fruits sur la page 2");
assert.ok(rafraichi >= 1, "le changement de page redessine");
Y.aller(1);

// Anti-spoil : 5 fruits seulement = une seule page, pas d'onglets ; un fruit verrouillé n'est pas dans la page ; pas de MacGuffin sans le système.
etatJoueur = joueur(5);
h = Y.page(etatJoueur);
assert.equal((h.match(/class="ygg-onglet"/g) || []).length, 0, "page 2 invisible tant qu'elle est vide");
assert.equal((h.match(/class="ygg-carte[ "]/g) || []).length, 5, "seulement les fruits découverts");
assert.ok(!h.includes('data-fruit="rage"') && !h.includes('data-fruit="numbers"'), "fruits verrouillés absents");
etatJoueur = joueur(12);
verrouMac = true;
h = Y.page(etatJoueur);
assert.ok(!h.includes('data-fruit="macguffinAlpha"'), "fruit de MacGuffin caché tant que le système est verrouillé");
verrouMac = false;

// Actions.
etatJoueur = joueur(12);
actions.length = 0;
Y.activer("powerAlpha");
Y.ameliorer("adventure");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "activateYggFruit", fruit: "powerAlpha" }, { action: "upgradeYggFruit", fruit: "adventure" }]);
actions.length = 0;
Y.mode("gold", "harvest");
Y.poop("gold");
Y.utiliser("gold");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "useYggFruit", fruit: "gold", mode: "harvest", poop: true }], "récolte avec poop");
Y.utiliser("gold");
assert.deepEqual(JSON.parse(JSON.stringify(actions[1])), { action: "useYggFruit", fruit: "gold", mode: "harvest" }, "la poop est consommée par l'usage");

// « Tout manger / récolter » : fruits prêts seulement ; poop selon « seulement au tier max ».
actions.length = 0;
const n = Y.tout("tous");
assert.equal(n, 6, "6 fruits prêts (actifs et poussés)");
await new Promise((r) => setTimeout(r, 6 * 350 + 200));
assert.equal(actions.length, 6);
assert.ok(actions.every((a) => a.action === "useYggFruit" && !a.poop), "aucune poop cochée");

// Image : manquante = plus redemandée ; route R2 : nom de fichier souple.
Y.imageManquante("gold", null);
assert.ok(!Y.page(etatJoueur).includes("name=gold"), "image absente : plus redemandée pendant la visite");
const cles = ["idle/yggdrasil/Fruit_of_Gold.png", "idle/yggdrasil/Fruit_of_Power_α.webp", "idle/yggdrasil/seed.png", "idle/ygg/Poop.webp", "idle/yggdrasil/pomegranate.PNG", "idle/yggdrasil/notes.txt"];
assert.equal(choisirCleYggR2_(cles, "gold"), "idle/yggdrasil/Fruit_of_Gold.png");
assert.equal(choisirCleYggR2_(cles, "powerAlpha"), "idle/yggdrasil/Fruit_of_Power_α.webp");
assert.equal(choisirCleYggR2_(cles, "seed"), "idle/yggdrasil/seed.png");
assert.equal(choisirCleYggR2_(cles, "poop"), "idle/ygg/Poop.webp");
assert.equal(choisirCleYggR2_(cles, "pomegranate"), "idle/yggdrasil/pomegranate.PNG");
assert.equal(choisirCleYggR2_(cles, "luck"), "", "pas d'image : chaîne vide (404)");
assert.equal(choisirCleYggR2_(cles, "notes"), "", "seules les images sont servies");

// Branchements.
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/yggdrasil-elfes-v1\.js\?v=\d+/.test(index) && index.indexOf("yggdrasil-elfes-v1.js") > index.indexOf("meta-progression-v130.js"), "module chargé après la page générique");
assert.ok(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8").includes("id==='yggdrasil'&&window.__SOREAL_IDLE_YGG_V1__"), "la page générique délègue");
assert.ok(readFileSync("cloudflare/src/idle-media-v1.js", "latin1").includes('"/api/idle/media/ygg"'), "route d'images déclarée");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "rien n'est envoyé");

console.log("idle-yggdrasil-elfes-v1: OK");
