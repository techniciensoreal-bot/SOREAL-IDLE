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

/* cadence : 8 pièces par seconde -> au plus 3 sons par seconde */
for (let t = 0; t < 2000; t += 125) { heure = 1000 + t; M.balayer(); }
const clings = appels.filter((d) => d === 260).length;
assert.ok(clings >= 5 && clings <= 7, "cling : 3 par seconde au plus (" + clings + " en 2 s)");
/* cadence lente : 1 par seconde */
appels.length = 0; machine.__cadencePieces = 1;
for (let t = 0; t < 3000; t += 125) { heure = 10000 + t; M.balayer(); }
assert.ok(appels.length >= 2 && appels.length <= 4, "1 pièce par seconde -> environ 1 cling par seconde (" + appels.length + ")");
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
console.log("idle-machine-sons-v1: OK");
