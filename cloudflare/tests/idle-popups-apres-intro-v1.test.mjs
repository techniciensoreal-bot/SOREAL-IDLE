import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-01) : « vérifie que pour un nouveau joueur, les popups des objets débloqués (Garderie…) n'arrivent qu'après toute l'introduction ».
 * On exécute le VRAI tutoriel-v1.js sur un faux navigateur et on interroge introFinie() à chaque étape de l'intro d'un nouveau joueur ; le popup d'annonce de la Garderie doit l'interroger avant de s'ouvrir.
 */
const tuto = fs.readFileSync(new URL("../public/modules/tutoriel-v1.js", import.meta.url), "utf8");
const popup = fs.readFileSync(new URL("../public/modules/daycare-skin-popup-v1.js", import.meta.url), "utf8");
assert.ok(/T\.introFinie\(etat\)\)return;\s*ouvrir\(liste\[0\]\)/.test(popup), "le popup de la Garderie attend la fin de l'introduction");

const elements = {};
const fauxDoc = {
  getElementById: (id) => elements[id] || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }) }),
  head: { appendChild() {} }, body: { appendChild() {}, classList: { contains: () => false } }, documentElement: { classList: { contains: () => false } }
};
let bienvenue = false;
const fenetre = {
  document: fauxDoc, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
  getComputedStyle: () => ({}), requestAnimationFrame: () => 0, innerWidth: 1000, innerHeight: 800, localStorage: { getItem: () => null, setItem() {} },
  __soreal_idle_vu_connu_v1__: () => bienvenue
};
fenetre.window = fenetre;
const contexte = vm.createContext(Object.assign(fenetre, { console, Date, Math, JSON, Promise, Boolean, Number, String, Array, Object, Error, RegExp, parseInt, parseFloat, isNaN }));
try { vm.runInContext(tuto, contexte); } catch (e) { assert.fail("tutoriel-v1.js ne se charge pas dans le faux navigateur : " + e.message); }
const T = fenetre.__SOREAL_IDLE_TUTORIEL_V1__;
assert.equal(typeof T.introFinie, "function", "introFinie exposée");

const nouveau = { profil: { nouveauJoueur: true, stats: { vus: [] } } };
assert.equal(T.introFinie({ profil: { nouveauJoueur: false } }), true, "joueur existant : aucun blocage");
assert.equal(T.introFinie(nouveau), false, "nouveau joueur, intro en images pas finie");
bienvenue = true;
assert.equal(T.introFinie(nouveau), false, "intro finie mais guide de départ pas encore connu");
elements.sorealIdleIntroDiapoV1 = {};
assert.equal(T.introFinie(nouveau), false, "pendant l'intro en images");
delete elements.sorealIdleIntroDiapoV1;
const etat = T.etat();
etat.debutResolu = true; etat.debutVuId = "tuto:debut";
assert.equal(T.introFinie(nouveau), false, "guide de départ pas encore terminé");
etat.enCours = { guide: {}, i: 0 };
assert.equal(T.introFinie({ profil: { nouveauJoueur: true, stats: { vus: ["tuto:debut"] } } }), false, "un guide est en cours");
etat.enCours = null;
assert.equal(T.introFinie({ profil: { nouveauJoueur: true, stats: { vus: ["tuto:debut"] } } }), true, "guide de départ terminé : les annonces peuvent s'afficher");
etat.debutVuId = "";
assert.equal(T.introFinie(nouveau), true, "aucun guide de départ configuré : pas de blocage éternel");
console.log("idle-popups-apres-intro-v1: OK");
