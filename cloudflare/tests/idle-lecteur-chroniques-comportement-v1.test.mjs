import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Audit du 2026-10-10, IDLE-AUDIT-TEST-001 : le test « idle-lecteur-chroniques-v1 » ne cherche que des mots dans le source (il passait même avec un module qui ne fait plus rien). Ici le lecteur est EXÉCUTÉ dans un faux navigateur avec
 * un faux moteur vocal : file des boss découverts seulement, enchaînement quand une lecture va au bout, fermeture quand elle est interrompue, pause / reprise / stop.
 */
class FauxElement {
  constructor(tag) {
    this.tag = tag; this.id = ""; this.style = {}; this.children = []; this.parentNode = null; this.attributs = {}; this.ecouteurs = {};
    this._sel = new Map(); this.textContent = ""; this._html = "";
    this.classList = { add() {}, remove() {}, contains() { return false; } };
  }
  set innerHTML(v) { this._html = v; this._sel = new Map(); }
  get innerHTML() { return this._html; }
  setAttribute(k, v) { this.attributs[k] = v; }
  getAttribute(k) { return this.attributs[k] ?? null; }
  appendChild(n) { n.parentNode = this; this.children.push(n); return n; }
  removeChild(n) { this.children = this.children.filter((x) => x !== n); n.parentNode = null; }
  addEventListener(nom, f) { (this.ecouteurs[nom] = this.ecouteurs[nom] || []).push(f); }
  setPointerCapture() {}
  getBoundingClientRect() { return { left: 10, top: 10, width: 250, height: 110 }; }
  get offsetWidth() { return 250; }
  get offsetHeight() { return 110; }
  querySelector(sel) { if (!this._sel.has(sel)) this._sel.set(sel, new FauxElement("sous:" + sel)); return this._sel.get(sel); }
}
const elements = new Map();
const document = {
  head: new FauxElement("head"),
  body: new FauxElement("body"),
  createElement: (t) => new FauxElement(t),
  getElementById: (id) => elements.get(id) || null,
  addEventListener() {}
};
const memeAppend = document.body.appendChild.bind(document.body);
document.body.appendChild = (n) => { if (n.id) elements.set(n.id, n); return memeAppend(n); };
const retire = document.body.removeChild.bind(document.body);
document.body.removeChild = (n) => { if (n.id) elements.delete(n.id); return retire(n); };
document.head.appendChild = (n) => { if (n.id) elements.set(n.id, n); return n; };
Object.defineProperty(FauxElement.prototype, "parentNode", { configurable: true, writable: true, value: null });

const minuteurs = [];
const appelsTts = [];
const entrees = [1, 2, 3, 4].map((n) => ({ source: "boss", decouvert: n !== 3, numero: n, nom: "Boss " + n, description: n === 4 ? "" : "Histoire du boss " + n }));
let fin = null;
const tts = {
  composerChronique: (nom, hist) => nom + " :: " + hist,
  readText: (texte, _src, onDone) => { appelsTts.push(["readText", texte]); fin = onDone; return true; },
  pause: () => { appelsTts.push(["pause"]); return true; },
  resume: () => { appelsTts.push(["resume"]); return true; },
  stop: () => { appelsTts.push(["stop"]); return true; }
};
const window = {
  innerWidth: 1000, innerHeight: 800,
  ecouteursResize: new Set(),
  addEventListener(nom, f) { if (nom === "resize") this.ecouteursResize.add(f); },
  removeEventListener(nom, f) { if (nom === "resize") this.ecouteursResize.delete(f); },
  __SOREAL_IDLE_TUTORIAL_TTS_V209__: tts,
  __SOREAL_IDLE_LIRE_ETAT_V1__: () => ({ bestiaire: { entrees } }),
  __fermerBossCollectionIdleV1__() { appelsTts.push(["fiche-fermee"]); }
};
const localStorage = { getItem: () => null, setItem() {} };
const sandbox = { window, document, localStorage, setTimeout: (f) => { minuteurs.push(f); return minuteurs.length; }, Math, Number, JSON, String, Array, Object };
vm.runInNewContext(readFileSync("cloudflare/public/modules/lecteur-chroniques-v1.js", "utf8"), sandbox);
const lecteur = window.__SOREAL_IDLE_LECTEUR_CHRONIQUES_V1__;
assert.ok(lecteur, "le module expose son interface");
const vider = () => { while (minuteurs.length) minuteurs.shift()(); };

// 1. La file ne contient que les boss découverts, avec une chronique, du boss de départ au dernier, dans l'ordre.
assert.deepEqual(lecteur.file(1).map((x) => x.numero), [1, 2], "boss 3 non découvert et boss 4 sans chronique : absents");
assert.deepEqual(lecteur.file(2).map((x) => x.numero), [2], "départ au boss 2");
assert.deepEqual(lecteur.file(0).map((x) => x.nom), ["Boss 1", "Boss 2"]);

// 2. Démarrage : le lecteur s'affiche, la fiche se ferme, le 1er boss est lu.
assert.equal(lecteur.demarrer(1), true);
assert.ok(elements.get("sorealIdleLecteurChroniquesV1"), "le lecteur flottant est affiché");
assert.deepEqual(appelsTts.filter((a) => a[0] === "readText"), [["readText", "Boss 1 :: Histoire du boss 1"]]);
assert.equal(lecteur.actif(), true);

// 3. Une lecture qui va au bout (onDone(true)) enchaîne sur la suivante après un court délai.
fin(true); vider();
assert.deepEqual(appelsTts.filter((a) => a[0] === "readText").map((a) => a[1]), ["Boss 1 :: Histoire du boss 1", "Boss 2 :: Histoire du boss 2"]);

// 4. Pause puis reprise : appels au moteur vocal, le lecteur reste ouvert.
assert.equal(lecteur.pause(), true);
assert.equal(lecteur.reprendre(), true);
assert.ok(appelsTts.some((a) => a[0] === "pause") && appelsTts.some((a) => a[0] === "resume"));
assert.ok(elements.get("sorealIdleLecteurChroniquesV1"));

// 5. Dernière chronique terminée : le lecteur se ferme tout seul.
fin(true); vider();
assert.equal(lecteur.actif(), false, "plus rien à lire : fermé");
assert.equal(elements.get("sorealIdleLecteurChroniquesV1"), undefined, "lecteur retiré de l'écran");

// 6. Lecture interrompue de l'extérieur (onDone(false)) : fermeture, jamais d'enchaînement à tort.
appelsTts.length = 0;
lecteur.demarrer(1);
const nbAvant = appelsTts.filter((a) => a[0] === "readText").length;
fin(false); vider();
assert.equal(lecteur.actif(), false, "interrompu : fermé");
assert.equal(appelsTts.filter((a) => a[0] === "readText").length, nbAvant, "la chronique suivante n'est pas lancée");

// 7. Stop : arrête la voix, ferme le lecteur ; une fin tardive de la lecture annulée n'enchaîne rien.
appelsTts.length = 0;
lecteur.demarrer(1);
const finTardive = fin;
assert.equal(lecteur.stop(), true);
assert.ok(appelsTts.some((a) => a[0] === "stop"), "la voix est arrêtée");
assert.equal(elements.get("sorealIdleLecteurChroniquesV1"), undefined);
const lectures = appelsTts.filter((a) => a[0] === "readText").length;
finTardive(true); vider();
assert.equal(appelsTts.filter((a) => a[0] === "readText").length, lectures, "une fin tardive après Stop ne relance rien");

// 7bis. Aucun écouteur « resize » ne s'accumule : trois lectures lancées et fermées laissent zéro écouteur sur window (IDLE-AUDIT-FE-009).
for (let i = 0; i < 3; i += 1) { lecteur.demarrer(1); lecteur.stop(); }
assert.equal(window.ecouteursResize.size, 0, "tous les écouteurs de redimensionnement sont retirés à la fermeture");

// 7ter. La voix refuse de démarrer (readText renvoie faux, sans rappel) : le lecteur se ferme au lieu de rester ouvert (GP-011).
tts.readText = () => false;
assert.equal(lecteur.demarrer(1), true);
assert.equal(lecteur.actif(), false, "voix indisponible : lecteur fermé");
assert.equal(elements.get("sorealIdleLecteurChroniquesV1"), undefined);

// 8. Rien à lire (aucun boss découvert avec chronique à partir de ce numéro) : refus propre.
assert.equal(lecteur.demarrer(99), false);
console.log("idle-lecteur-chroniques-comportement-v1: OK");
