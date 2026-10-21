import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Le coq d'Yggdrasil (Norman, 2026-10-21) : un vrai enregistrement (idle/ambient/coq.m4a, R2) joué juste après le son de la porte, le matin seulement, UNE fois par renaissance, à la première animation d'ouverture de porte ;
 * le son de la porte perd sa petite mélodie finale ; le coq n'entre jamais dans le tirage au hasard des sons d'ambiance d'Aventure.
 */
const sons = readFileSync(new URL("../public/modules/yggdrasil-sons-v1.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../public/modules/yggdrasil-elfes-v1.js", import.meta.url), "utf8");
const media = readFileSync(new URL("../src/idle-media-v1.js", import.meta.url), "latin1");

// 1. Module de sons : matin = 5 h à 11 h 59 ; le coq charge le bon fichier au bon volume, sans jamais lever d'erreur.
const lus = [];
let volume = 0.8;
const fen = {
  Audio: class { constructor(src) { this.src = src; this.volume = 1; lus.push(this); } play() { this.joue = true; return Promise.resolve(); } },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
  setTimeout: (f) => { f(); return 0; }
};
fen.window = fen;
let heure = 8;
fen.Date = class extends Date { getHours() { return heure; } };
vm.runInNewContext(sons, fen);
const S = fen.__SOREAL_IDLE_YGG_SONS_V1__;
for (const [h, attendu] of [[4, false], [5, true], [8, true], [11, true], [12, false], [20, false], [0, false]]) { heure = h; assert.equal(S.matin(), attendu, h + " h : matin = " + attendu); }
assert.equal(S.coq(1000), true);
assert.equal(lus.length, 1);
assert.equal(decodeURIComponent(lus[0].src), "/api/idle/media/ambient?key=idle/ambient/coq.m4a", "fichier du R2");
assert.equal(lus[0].volume, 0.8, "volume des sons de l'interface");
assert.equal(lus[0].joue, true, "lu après le délai");
volume = 0;
assert.equal(S.coq(0), false, "volume 0 : aucun son");
assert.equal(lus.length, 1, "volume 0 : aucun fichier même chargé");

// 2. Une seule fois par renaissance, à la PREMIÈRE ouverture, le matin seulement.
const debut = page.indexOf("  var CLE_COQ_=");
const fin = page.indexOf("  function noterPorteVue_(id,vue){");
assert.ok(debut > 0 && fin > debut, "bloc du coq dans la page");
const magasin = {};
let renaissances = 3, matin = true;
const appels = [];
const banc = vm.runInNewContext("(function(localStorage,window,reglages_){function renaissances_(){return Number(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes.records.totalRebirths)||0;}\n" + page.slice(debut, fin) + "\nreturn coqPremiereOuverture_;})", {})(
  { getItem: (k) => (k in magasin ? magasin[k] : null), setItem: (k, v) => { magasin[k] = String(v); } },
  { __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({ systemes: { records: { totalRebirths: renaissances } } }) }, __SOREAL_IDLE_YGG_SONS_V1__: { matin: () => matin, coq: (d) => { appels.push(d); return true; } } },
  () => ({ son: "pierre" })
);
assert.equal(banc(1), true, "première ouverture de la renaissance 3 : le coq chante");
assert.equal(appels.length, 1); assert.equal(appels[0], 1100, "juste après la porte de pierre (durée × réglage de vitesse)");
assert.equal(banc(1), false, "deuxième ouverture : pas de coq");
assert.equal(banc(1), false); assert.equal(appels.length, 1);
renaissances = 4;
assert.equal(banc(2), true, "nouvelle renaissance : le coq chante de nouveau à la première ouverture");
assert.equal(appels[1], 2200, "durée proportionnelle au réglage de la porte");
renaissances = 5; matin = false;
assert.equal(banc(1), false, "le soir : pas de coq");
matin = true;
assert.equal(banc(1), false, "la première ouverture de la renaissance est passée (le soir) : plus de coq cette renaissance");
assert.ok(page.includes("noterPorteVue_(id,true);son_(nomSonPorte_(),vit);coqPremiereOuverture_(vit);}"), "branché sur la vraie ouverture (pas sur le banc d'essai de l'administrateur)");
assert.equal((page.match(/coqPremiereOuverture_\(/g) || []).length, 2, "définie une fois, appelée une fois");

// 3. R2 : jamais tiré au hasard comme son d'ambiance.
assert.ok(media.includes('IDLE_COQ_R2_CLE_V1=IDLE_AMBIANT_R2_PREFIX+"coq.m4a"') && media.includes("IDLE_COQ_R2_CLE_V1.toLowerCase())return false"), "coq exclu du tirage d'ambiance");
console.log("idle-yggdrasil-coq-v1: OK");
