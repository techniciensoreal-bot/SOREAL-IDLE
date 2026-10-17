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
// Barres de vie du duel : un saut posé par le jeu est noté avec la réponse du serveur qui le précède.
{
  const barres = { sorealIdleHudPvBarV2: { style: { width: "80%" } }, sorealIdleBossBarV7: { dataset: { idlePctV121: "50" } } };
  ctx.document.getElementById = (id) => barres[id] || null;
  D.vider();
  D.echantillonVie();
  barres.sorealIdleHudPvBarV2.style.width = "79%"; barres.sorealIdleBossBarV7.dataset.idlePctV121 = "49";
  D.echantillonVie();
  assert.equal(D.journal().length, 0, "variation normale : rien");
  D.reponseRecue("synchroniserSorealIdle", 300);
  barres.sorealIdleHudPvBarV2.style.width = "40%";
  D.echantillonVie();
  let s = D.journal().find((x) => x.type === "vie_saut" && x.cle === "joueur");
  assert.ok(s && s.de === 79 && s.a === 40 && s.apres === "synchroniserSorealIdle", "la vie du joueur saute juste après une synchro");
  barres.sorealIdleBossBarV7.dataset.idlePctV121 = "55";
  D.echantillonVie();
  assert.ok(D.journal().find((x) => x.type === "vie_saut" && x.cle === "boss"), "la barre du boss remonte");
  ctx.document.getElementById = () => null;
  console.log("idle-diag-contexte-complet-v1 (vie du duel): OK");
}
// Bouton de signalement : un appui note la vie par seconde sur 20 s et les dernières réponses du serveur.
{
  const barres = { sorealIdleHudPvBarV2: { style: { width: "100%" } }, sorealIdleBossBarV7: { dataset: { idlePctV121: "100" } } };
  ctx.document.getElementById = (id) => barres[id] || null;
  D.vider();
  for (let i = 0; i < 30; i += 1) {
    barres.sorealIdleHudPvBarV2.style.width = String(100 - i * 3) + "%";
    D.echantillonVie();
  }
  perf += 1000;
  D.reponseRecue("agirProgressionSorealIdle", 350);
  assert.equal(D.signalement(), true);
  const s = D.journal().find((x) => x.type === "signalement");
  assert.ok(s, "signalement noté"); assert.equal(s.menu, "ngu");
  assert.ok(/^\d+(\/\d+)+$/.test(s.vie_joueur_par_s), "vie du joueur seconde par seconde : " + s.vie_joueur_par_s);
  assert.ok(s.reponses.includes("agirProgression@-0.0s/350ms"), "dernière réponse du serveur : " + s.reponses);
  D.signalement(); D.signalement();
  assert.ok(D.journal().filter((x) => x.type === "signalement").length >= 2, "plusieurs appuis rapprochés ne se perdent pas");
  const src2 = readFileSync("cloudflare/public/modules/diag-fluidite-v1.js", "utf8");
  assert.ok(src2.includes("soreal-idle-diag-signaler-v1") && src2.includes("if(!estAdmin_())"), "bouton réservé à l'administrateur");
  ctx.document.getElementById = () => null;
  console.log("idle-diag-contexte-complet-v1 (signalement): OK");
}
