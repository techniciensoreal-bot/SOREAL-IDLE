import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-07) : « j'aimerais des sons propres à la machine temporelle ». Module modules/machine-sons-v1.js : « cling » d'une pièce qui tombe dans le tas (au rythme des pièces, 3 par seconde au plus), « niveau » quand un niveau
 * est gagné ; rien hors de la page Machine, rien onglet caché, rien quand la machine est hors écran. Le module tourne ici sur un faux document et un faux moteur audio (les appels à synth sont comptés).
 */
const src = fs.readFileSync("cloudflare/public/modules/machine-sons-v1.js", "utf8");
let heure = 1000, intervalle = null;
const appels = [];
const machine = { __cadencePieces: 8, querySelector: (s) => (s === ".tmm-centre" ? centre : null), querySelectorAll: (s) => (s === "[data-tm-niveau]" ? niv : []) };
const centre = { __tmmHors: false };
const niv = [{ getAttribute: () => "vitesse", textContent: "3" }, { getAttribute: () => "or", textContent: "1" }];
let present = true, cache = false;
const fen = {
  __SOREAL_IDLE_AUDIO_V199__: { synth: (d, f) => { appels.push(d); } },
  document: { get hidden() { return cache; }, querySelector: (s) => (s === ".tmm-machine" && present ? machine : null) },
  performance: { now: () => heure }, Math, Number, String, Date
};
fen.window = fen;
const ctx = vm.createContext(Object.assign(fen, { setInterval: (f) => { intervalle = f; return 1; } }));
vm.runInContext(src, ctx);
const M = fen.__SOREAL_IDLE_MACHINE_SONS_V1__;
assert.ok(M && typeof M.cling === "function" && typeof M.niveau === "function" && typeof intervalle === "function", "module exposé, balayage régulier");

/* le tintement des pièces est COUPÉ (Norman, 2026-11-07 : « le bruit de pièce qui tombe, bof ») : aucun son automatique, même à 8 pièces par seconde ; la fonction reste (drapeau SON_PIECES) */
for (let t = 0; t < 2000; t += 125) { heure = 1000 + t; M.balayer(); }
assert.equal(appels.length, 0, "aucun tintement automatique");
M.cling();
assert.equal(appels.length, 1, "cling() reste disponible");
assert.ok(/var SON_PIECES=false;/.test(src), "drapeau de réactivation");
/* hors écran, onglet caché, hors de la page : silence */
appels.length = 0; centre.__tmmHors = true;
for (let t = 0; t < 2000; t += 125) { heure = 20000 + t; M.balayer(); }
assert.equal(appels.length, 0, "machine hors écran : aucun son");
centre.__tmmHors = false; cache = true;
for (let t = 0; t < 2000; t += 125) { heure = 30000 + t; M.balayer(); }
assert.equal(appels.length, 0, "onglet caché : aucun son");
cache = false; present = false; M.balayer();
assert.equal(appels.length, 0, "hors de la page Machine : aucun son");

/* niveau gagné : un son quand le niveau affiché change, jamais à la première lecture ni au retour à 0 */
present = true; machine.__cadencePieces = 0; appels.length = 0;
M.balayer();   /* première lecture (niveaux mémorisés après le passage hors page) */
assert.equal(appels.length, 0, "première lecture : aucun son");
niv[0].textContent = "4"; M.balayer();
assert.equal(appels.length, 1, "niveau gagné : un son");
assert.equal(appels[0], 900, "son de niveau (balayage + cloche)");
niv[0].textContent = "0"; M.balayer();
assert.equal(appels.length, 1, "retour à 0 (renaissance) : aucun son");
/* bouton sans effet : un son (jamais muet) ; les boutons + − Max ont leurs sons de mécanique dans le moteur audio */
appels.length = 0; M.refus();
assert.equal(appels.length, 1, "refus : un son");
const audio = fs.readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
for (const f of ["tmPlus_", "tmMoins_", "tmCap_"]) { const i = audio.indexOf("function " + f + "(){"); assert.ok(i > 0 && /nappe_\(c,\{type:"sawtooth"/.test(audio.slice(i, i + 900)), f + " : sons de mécanique (servomoteur + déclics), plus de simples tics"); }
const aug = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
assert.ok(aug.includes("if(delta===0){const MS=window.__SOREAL_IDLE_MACHINE_SONS_V1__;if(MS&&typeof MS.refus==='function')MS.refus();}"), "bouton sans effet : choc sourd");
console.log("idle-machine-sons-v1: OK");
