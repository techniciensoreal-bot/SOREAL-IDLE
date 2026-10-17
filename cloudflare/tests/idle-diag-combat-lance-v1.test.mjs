import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-17) : « quand on lance un combat contre un boss, ça saute ». Le journal de fluidité note le lancement (délai du serveur, vie écran/serveur) et les sauts de vie en combat.
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
const combat = readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
const etat = (j, b, actif = true) => ({ combatBossActif: actif, pvJoueur: j, pvJoueurMax: 100, bossPv: b, bossPvMax: 1000, bossActuel: "Fée" });
// Sans clic ni combat actif : rien.
assert.equal(D.ecartCombat(etat(50, 500, false), etat(80, 500, false)), 0);
// Après un clic sur Fight : la première réponse est toujours notée, avec le délai.
D.combatLance();
assert.equal(D.ecartCombat(etat(100, 1000, false), etat(100, 1000)), 1);
const l = D.journal()[0];
assert.equal(l.type, "combat_lance"); assert.equal(l.joueur_ecran, 100); assert.equal(l.boss_serveur, 100); assert.equal(l.actif_serveur, 1); assert.equal(typeof l.delai_ms, "number");
// Ensuite : seulement un écart d'au moins 8 points.
D.vider();
assert.equal(D.ecartCombat(etat(60, 500), etat(57, 497)), 0, "petit écart : rien");
assert.equal(D.ecartCombat(etat(60, 500), etat(40, 500)), 1, "la vie du joueur saute de 20 points");
assert.equal(D.journal()[0].type, "combat_saut"); assert.equal(D.journal()[0].joueur_ecran, 60); assert.equal(D.journal()[0].joueur_serveur, 40);
assert.equal(D.ecartCombat(null, etat(1, 1)), 0);
// Branchements.
assert.ok(noyau.includes("D.ecartCombat(REG.idleEtat,joueurRenduProtegeV208)"), "appelé à chaque réponse du serveur");
assert.ok(combat.includes("D.combatLance()"), "le clic sur Fight arme la mesure");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "journal local seulement");
console.log("idle-diag-combat-lance-v1: OK");
