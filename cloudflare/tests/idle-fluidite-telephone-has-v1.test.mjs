import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Audit fluidité téléphone (2026-11-03). Mesuré dans un navigateur à processeur x4 (menu Combat de boss et Machine temporelle) : les 22 règles `.soreal-idle-native-v4:has(...)` des thèmes de couleur faisaient recalculer le style
 * de tout le sous-arbre (~870 éléments) à chaque modification de la page : 5,9 s de recalcul de style sur 10 s, 4,6 images/s. Sans elles : 1,8 s sur 10 s, ~20 images/s.
 * Gardes : (1) plus aucun :has() ancré sur le conteneur du jeu, (2) les drapeaux de menu sont posés sur <body> par menu-drapeaux-v1.js, chargé par index.html, (3) borne-led-v1.js ne lit plus window.innerWidth à chaque image (mise en page forcée),
 * (4) la couleur des cartes de l'album est calculée en avance, au repos.
 */
const lire = (p) => readFileSync(p, "utf8");
const themes = lire("cloudflare/public/soreal-idle-themes.css");
const chroniques = lire("cloudflare/public/soreal-idle-chroniques.css");
for (const [nom, css] of [["themes", themes], ["chroniques", chroniques]]) {
  assert.ok(!/soreal-idle-native-v4:has\(/.test(css), nom + " : aucun :has() sur le conteneur du jeu");
}
const menus = [...themes.matchAll(/\[data-sj-menu="([A-Za-z]+)"\]/g)].map((m) => m[1]);
for (const m of ["augmentations", "combat", "sang", "entrainement", "machine", "aventure", "renaissance", "moneyPit", "challenges", "titans", "succes", "shop", "classement", "bestiaire", "chat", "parametres", "admin", "avance"]) {
  assert.ok(menus.includes(m), "thème du menu " + m + " lu sur body[data-sj-menu]");
}
assert.ok(/\[data-sj-menu="shop"\]\[data-sj-shopap="1"\] \.soreal-idle-native-v4\{/.test(themes), "thème de la boutique AP");
assert.ok(/\[data-sj-onglet="classement"\] \.soreal-idle-native-v4\{/.test(themes) && /\[data-sj-onglet="succes"\] \.soreal-idle-native-v4\{/.test(themes), "thèmes des onglets de Chroniques");
assert.ok(/\[data-sj-chr="1"\] \.soreal-idle-native-v4\{--th-a:#c8923a/.test(chroniques), "thème chaud de Chroniques");

const html = lire("cloudflare/public/index.html");
assert.ok(/<script defer src="\/modules\/menu-drapeaux-v1\.js\?v=\d+"><\/script>/.test(html), "module chargé");
const drap = lire("cloudflare/public/modules/menu-drapeaux-v1.js");
assert.ok(drap.includes("MutationObserver") && drap.includes("Promise.resolve().then"), "recalcul en micro-tâche (avant le dessin : aucun clignotement)");
assert.ok(drap.includes("if(etat[cle]===valeur)return;"), "un attribut n'est réécrit que si sa valeur change");

// le module, exécuté sur un faux document : les quatre drapeaux suivent la page
const attrs = {};
const racine = { getAttribute: (k) => (k === "data-menu" ? "shop" : ""), querySelector: (s) => (s === ".soreal-idle-shop-ap-v1" ? {} : null) };
const doc = {
  body: { setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; } },
  querySelector: (s) => (s.startsWith(".soreal-idle-page-root-v28") ? racine : null),
  addEventListener() {}
};
const fen = { document: doc, MutationObserver: class { observe() {} } };
fen.window = fen;
vm.runInNewContext(drap, Object.assign(fen, { Promise }));
assert.equal(attrs["data-sj-menu"], "shop");
assert.equal(attrs["data-sj-shopap"], "1");
assert.equal(attrs["data-sj-chr"], undefined);

const led = lire("cloudflare/public/modules/borne-led-v1.js");
assert.ok(led.includes("var MOBILE_CACHE=null;") && /function mobile\(\)\{if\(MOBILE_CACHE===null\)/.test(led), "mobile() mémorisé");
assert.ok(/addEventListener\('resize',function\(\)\{MOBILE_CACHE=null;\}\)/.test(led), "invalidé au redimensionnement");
assert.ok(!/function mobile\(\)\{return \(window\.innerWidth/.test(led), "plus de lecture de innerWidth à chaque image");

const magic = lire("cloudflare/public/modules/carte-boss-magic-v1.js");
assert.ok(magic.includes("function preanalyser(") && magic.includes("requestIdleCallback") && /preanalyser:preanalyser/.test(magic), "analyse des couleurs au repos");
const album = lire("cloudflare/public/modules/album-cartes-v1.js");
assert.ok(album.includes("im.onload=pre_(n,im)") && album.includes("M.preanalyser(n,im)"), "l'album demande l'analyse des illustrations voisines");

console.log("idle-fluidite-telephone-has-v1: OK");
