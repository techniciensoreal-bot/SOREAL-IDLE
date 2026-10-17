import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-17, sangsue) : « je place 334K avec Max, le rituel affiche 10 minutes ; quand je change d'onglet, le temps a fortement diminué ». Option B : le journal de fluidité note, à chaque réponse du serveur,
 * l'écart entre le compte à rebours AFFICHÉ d'un rituel de sang et celui du serveur (écran et serveur : durée, magie, durée d'un niveau, K), pour savoir la prochaine fois ce qui diverge.
 */
const src = readFileSync("cloudflare/public/modules/diag-fluidite-v1.js", "utf8");
const noyau = readFileSync("cloudflare/public/modules/ui-noyau-v1.js", "utf8");
const stockage = {};
let perf = 100000;
const ctx = {
  console,
  localStorage: { getItem: (k) => stockage[k] ?? null, setItem: (k, v) => { stockage[k] = v; } },
  document: { hidden: false, querySelector: () => null, getElementById: () => null },
  navigator: {},
  setInterval: () => 0,
  window: null
};
ctx.window = { performance: { now: () => perf }, __SOREAL_IDLE_EST_ADMIN_V1__: () => true };
ctx.window.window = ctx.window; ctx.window.parent = ctx.window;
Object.assign(ctx.window, { localStorage: ctx.localStorage, document: ctx.document });
vm.createContext(ctx);
vm.runInContext(src, ctx);
const D = ctx.window.__SOREAL_IDLE_DIAG_V1__;
assert.equal(typeof D.ecartRituels, "function");

const ancien = (eta, at) => ({ __bloodMagicVisualV1: { hickey: { ritual: "hickey", secondsPerCompletion: 600, etaSeconds: eta, at, src: { magic: 334000, secondsK: 2e8 } } } });
const nouveau = (eta, extra = {}) => ({ systemes: { bloodMagicView: { rituals: [Object.assign({ id: "hickey", magic: 334000, etaSeconds: eta, secondsPerCompletion: 600, secondsK: 2e8, progressFraction: 0.4 }, extra)] } } });

// 1. Écran et serveur d'accord (à quelques secondes près) : rien de noté.
assert.equal(D.ecartRituels(ancien(600, perf), nouveau(598)), 0);
assert.equal(D.ecartRituels(ancien(600, perf), nouveau(596)), 0, "moins de 5 s ou 10 %");
assert.equal(D.journal().length, 0);
// 2. Le serveur donne bien moins que l'écran (10 minutes affichées, 4 minutes réelles) : noté avec les deux durées et K.
assert.equal(D.ecartRituels(ancien(600, perf), nouveau(240, { secondsK: 8e7, secondsPerCompletion: 240 })), 1);
const l = D.journal()[0];
assert.equal(l.type, "rituel_ecart"); assert.equal(l.cle, "hickey");
assert.equal(l.ecran_s, 600); assert.equal(l.serveur_s, 240); assert.equal(l.K_ecran, 2e8); assert.equal(l.K_serveur, 8e7);
assert.equal(l.magie_ecran, 334000); assert.equal(l.fraction_serveur, 0.4);
// 3. Le temps écoulé depuis le repère est retiré de l'affichage ; un rituel sans magie, sans repère ou déjà plein n'est pas comparé.
D.vider();
perf += 590000;
assert.equal(D.ecartRituels(ancien(600, 100000), nouveau(8)), 0, "10 s restantes à l'écran contre 8 s : d'accord");
assert.equal(D.ecartRituels({ __bloodMagicVisualV1: {} }, nouveau(10)), 0);
assert.equal(D.ecartRituels(ancien(0, perf), nouveau(300)), 0, "barre pleine : pas comparé");
assert.equal(D.ecartRituels(ancien(600, perf), nouveau(5, { magic: 0 })), 0, "plus de magie : pas comparé");
assert.equal(D.ecartRituels(null, nouveau(5)), 0);
// 4. Branché sur chaque réponse du serveur, avant que le nouvel état remplace l'ancien, et rien n'est envoyé.
assert.ok(noyau.includes("D.ecartRituels(REG.idleEtat,joueurRenduProtegeV208)"), "appelé à chaque rendu d'une réponse serveur");
assert.ok(noyau.indexOf("D.ecartRituels(REG.idleEtat") < noyau.indexOf("__appliquerAllocationsVouluesIdleV1__(joueurRenduProtegeV208)"), "avant l'application des allocations voulues");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "journal local seulement");
console.log("idle-diag-rituel-ecart-v1: OK");
