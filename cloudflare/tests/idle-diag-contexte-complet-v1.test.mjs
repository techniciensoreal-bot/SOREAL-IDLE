import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-17) : « adapte le journal de fluidité pour que quand je te colle, tu aies tout ce dont tu as besoin ». Chaque ligne porte le menu et le combat ; les tâches longues et les réponses lentes sont notées avec
 * la réponse du serveur qui les précède ; le texte copié a un en-tête (appareil, réseau, version) et une fin explicite.
 */
const src = readFileSync("cloudflare/public/modules/diag-fluidite-v1.js", "utf8");
const pont = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
const stockage = {};
let perf = 5000;
const racine = { getAttribute: (n) => (n === "data-menu" ? "ngu" : null) };
const ctx = {
  console,
  localStorage: { getItem: (k) => stockage[k] ?? null, setItem: (k, v) => { stockage[k] = v; } },
  document: { hidden: false, querySelector: (s) => (s.includes("page-root") ? racine : null), getElementById: () => null },
  navigator: { userAgent: "TestUA", hardwareConcurrency: 8, connection: { effectiveType: "4g", rtt: 50, downlink: 10 } },
  setInterval: () => 0,
  window: null
};
ctx.window = { performance: { now: () => perf }, __SOREAL_IDLE_EST_ADMIN_V1__: () => true, __SOREAL_IDLE_LIRE_ETAT_V1__: () => ({ combatBossActif: true }), innerWidth: 400, innerHeight: 800, devicePixelRatio: 2, navigator: ctx.navigator };
ctx.window.window = ctx.window; ctx.window.parent = ctx.window;
Object.assign(ctx.window, { localStorage: ctx.localStorage, document: ctx.document });
vm.createContext(ctx);
vm.runInContext(src, ctx);
const D = ctx.window.__SOREAL_IDLE_DIAG_V1__;

// 1. Une tâche longue juste après une réponse : attribuée à cette opération, avec le menu et le combat.
D.reponseRecue("synchroniserSorealIdle", 1200);
D.tacheLongue(perf + 20, 140);
let l = D.journal().find((x) => x.type === "tache_longue");
assert.ok(l, "tâche longue notée");
assert.equal(l.apres, "synchroniserSorealIdle"); assert.equal(l.ms, 140); assert.equal(l.menu, "ngu"); assert.equal(l.combat, 1);
// 2. Moins de 80 ms : ignorée. Sans réponse proche : « - ».
D.vider();
D.tacheLongue(perf + 9000, 60);
assert.equal(D.journal().length, 0, "sous 80 ms : rien");
D.tacheLongue(perf + 90000, 100);
assert.equal(D.journal()[0].apres, "-");
// 3. Réponse lente (> 3 s) notée, rapide ignorée.
D.vider();
D.reponseRecue("agirProgressionSorealIdle", 800);
assert.equal(D.journal().length, 0);
D.reponseRecue("agirProgressionSorealIdle", 4200);
assert.equal(D.journal()[0].type, "reponse_lente"); assert.equal(D.journal()[0].ms, 4200);
// 4. Le texte a un en-tête complet et une fin.
const t = D.texte();
assert.ok(t.startsWith("=== SOREAL IDLE — journal de diagnostic ==="), "en-tête");
for (const m of ["appareil : TestUA", "8 coeurs", "écran 400x800", "réseau : 4g", "menu ngu", "combat 1", "FIN DU JOURNAL (1 ligne(s))"]) assert.ok(t.includes(m), m);
// 5. Branchements : le pont signale chaque réponse, l'observateur de tâches longues appelle tacheLongue_.
assert.ok(pont.includes("Dg.reponseRecue(operation,"), "le pont signale la durée de chaque appel");
assert.ok(src.includes("tacheLongue_(e.startTime,e.duration)"), "observateur branché");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "journal local seulement");
console.log("idle-diag-contexte-complet-v1: OK");
// Vie de l'ordre de combat : clic -> envoi -> réponse, avec les actions rapides passées devant.
{
  const rapides = readFileSync("cloudflare/public/modules/ui-actions-rapides-v1.js", "utf8");
  D.vider();
  D.combatLance();
  D.lotEnvoye("shop"); D.lotTermine("shop", true);
  D.lotEnvoye("forge"); D.lotTermine("forge", true);
  D.lotEnvoye("combat"); D.lotTermine("combat", true);
  const o = D.journal().find((x) => x.type === "combat_ordre");
  assert.ok(o, "ordre de combat noté"); assert.equal(o.avant, "shop>forge"); assert.equal(o.ok, 1); assert.equal(typeof o.file_ms, "number"); assert.equal(typeof o.aller_retour_ms, "number");
  D.vider();
  D.lotEnvoye("shop"); ctx.window.performance.now = () => perf;
  assert.ok(rapides.includes("D.lotEnvoye(lot.type)") && rapides.includes("D.lotTermine(lot.type,Boolean(res&&res.ok))") && rapides.includes("D.lotTermine(lot.type,false)"), "actions rapides branchées");
  console.log("idle-diag-contexte-complet-v1 (ordre de combat): OK");
}
