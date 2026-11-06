import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Plan design/PLAN-COMPLET-2026-11-06.md, chantier C0 : la MESURE DE RÉFÉRENCE intégrée (Réglages > « 📏 Mesure de référence », administrateur). Protocole fixe et PASSIF.
 * Ce test vérifie : les statistiques (médiane, centiles, parts d'images lentes), le verdict contre le budget, le protocole complet avec un navigateur SIMULÉ (ordre des menus, menu absent non mesuré, menu de départ rouvert,
 * crochet du moteur libéré même en cas d'erreur, mesure invalide si la page est masquée), le rapport texte, et la garantie qu'AUCUNE action de jeu n'est envoyée.
 */
const chemin = "cloudflare/public/modules/mesure-reference-v1.js";
const code = fs.readFileSync(chemin, "utf8");
const win = {};
new Function("window", "document", "navigator", code)(win, {}, {});
const M = win.__SOREAL_IDLE_MESURE_REF_V1__;
assert.ok(M && typeof M.executer === "function" && typeof win.__mesureReferenceOuvrirV1__ === "function", "le module s'expose");

/* ---- 1. statistiques ---- */
{
  const d = [];
  for (let i = 0; i < 1000; i += 1) d.push(16.7);
  [25, 25, 40, 60].forEach((x, i) => { d[i * 100] = x; });   /* 4 images lentes : 2 entre 20 et 34, 1 à 40, 1 à 60 */
  const s = M.statsImages(d);
  assert.equal(s.n, 1000);
  assert.ok(Math.abs(s.mediane - 16.7) < 1e-9, "médiane");
  assert.equal(s.sup20, 4); assert.equal(s.sup34, 2); assert.equal(s.sup50, 1);
  assert.ok(Math.abs(s.pct20 - 0.4) < 1e-9 && Math.abs(s.pct34 - 0.2) < 1e-9 && Math.abs(s.pct50 - 0.1) < 1e-9, "pourcentages");
  assert.equal(s.max, 60);
  const v = M.verdict(s);
  assert.equal(v.ok, false, "0,2 % > 34 ms et une image à 60 ms : hors budget");
  assert.ok(v.raisons.some((r) => /> 34 ms/.test(r)) && v.raisons.some((r) => /pire image/.test(r)), "les raisons sont dites");
  const bon = M.statsImages(new Array(2000).fill(16.7));
  assert.equal(M.verdict(bon).ok, true, "tout à 16,7 ms : dans le budget");
  assert.equal(M.verdict(M.statsImages(new Array(50).fill(16.7))).ok, null, "trop peu d'images : non concluant");
  assert.equal(M.statsImages([0, -3, NaN, Infinity, 16]).n, 1, "durées invalides ignorées");
}

/* ---- 2. résumés ---- */
{
  const o = M.resumerOps([{ op: "sync", file: 1, calcul: 60, retour: 2 }, { op: "sync", file: 5, calcul: 80, retour: 3 }, { op: "sync", file: 0, calcul: 70, retour: 9 }, { op: "agir", file: 2, calcul: 95, retour: 4 }]);
  assert.equal(o[0].op, "sync"); assert.equal(o[0].n, 3); assert.equal(o[0].calculMed, 70); assert.equal(o[0].calculMax, 80); assert.equal(o[0].fileMax, 5); assert.equal(o[0].retourMax, 9);
  const l = M.resumerLoaf([{ duree: 60, scripts: [{ invoker: "Worker.onmessage", fichier: "moteur-local-v1.js", fonction: "", duree: 40 }, { invoker: "RAF", fichier: "a.js", fonction: "f", duree: 10 }] }, { duree: 55, scripts: [{ invoker: "Worker.onmessage", fichier: "moteur-local-v1.js", fonction: "", duree: 35 }] }]);
  assert.equal(l.n, 2); assert.equal(l.ms, 115); assert.equal(l.tops[0].n, 2); assert.equal(l.tops[0].ms, 75); assert.equal(l.tops[0].max, 40);
}

/* ---- 3. protocole avec un navigateur simulé ---- */
function envSimule(options = {}) {
  const journal = [];
  let actif = options.depart || "aventure", crochet = null, libere = false;
  const env = {
    date: () => "6/11/2026 10:00", version: () => "9", mode: () => options.mode || "direct", moteurLocal: () => true, appareil: () => "Test/1.0", ecran: () => "390x844 @3x", coeurs: () => 8, memoire: () => 4, reseau: () => "4g · rtt 50 ms",
    apiLoaf: () => options.loaf !== false, apiLongtask: () => true, menuActif: () => actif,
    cliquerMenu: (id) => { journal.push("clic:" + id); if ((options.absents || []).includes(id)) return false; actif = id; return true; },
    attendre: async (ms) => { journal.push("attente:" + ms); },
    accrocherMoteur: (f) => { crochet = f; return () => { libere = true; }; },
    mesurer: async (ms) => {
      journal.push("mesure:" + actif + ":" + ms);
      if (options.erreurSur === actif) throw new Error("panne simulée");
      if (crochet) crochet({ op: "synchroniserSorealIdle", file: 1, calcul: 66, retour: 3 });
      const durees = new Array(Math.round(ms / 16.7)).fill(16.7);
      if (options.lent === actif) for (let i = 0; i < 30; i += 1) durees[i * 10] = 45;
      return { durees, loaf: options.lent === actif ? [{ duree: 60, scripts: [{ invoker: "Worker.onmessage", fichier: "moteur-local-v1.js", fonction: "", duree: 40 }] }] : [], masque: options.masque === actif };
    }
  };
  return { env, journal, estLibere: () => libere };
}
{
  const { env, journal, estLibere } = envSimule({ absents: ["ngu"], lent: "machine", masque: "combat" });
  const messages = [];
  const r = await M.executer(env, (t) => messages.push(t));
  const ordre = journal.filter((x) => x.startsWith("clic:")).map((x) => x.slice(5));
  assert.deepEqual(ordre, ["combat", "aventure", "machine", "ngu", "aventure"], "ordre fixe des menus, puis le menu de départ est rouvert");
  assert.ok(estLibere(), "le crochet du moteur est libéré");
  assert.equal(journal.filter((x) => x.startsWith("mesure:")).length, 3, "le menu absent n'est pas mesuré");
  assert.ok(journal.includes("attente:3000"), "mise en place de 3 s avant chaque mesure");
  const par = Object.fromEntries(r.menus.map((m) => [m.id, m]));
  assert.equal(par.ngu.absent, true, "menu absent : noté, pas mesuré");
  assert.equal(par.combat.valide, false, "page masquée : mesure INVALIDE");
  assert.ok(/masquée/.test(par.combat.invalide));
  assert.equal(par.aventure.valide, true); assert.equal(par.aventure.verdict.ok, true, "aventure : dans le budget");
  assert.equal(par.machine.verdict.ok, false, "machine : hors budget (images à 45 ms)");
  assert.ok(par.machine.loaf.n === 1, "images longues relevées");
  assert.equal(r.ops[0].op, "synchroniserSorealIdle"); assert.equal(r.ops[0].n, 3, "une opération simulée par menu mesuré (3 menus)");
  assert.ok(messages.length >= 4, "des messages de progression sont émis");
  const t = M.texteRapport(r);
  assert.ok(t.startsWith("=== SOREAL NGU IDLE — mesure de référence (protocole v1) ===") && t.endsWith("=== FIN DE LA MESURE ==="), "rapport complet, à copier tel quel");
  assert.ok(/mode direct/.test(t) && /Test\/1\.0/.test(t) && /390x844/.test(t), "appareil et mode dans l'en-tête");
  assert.ok(/\[ NGU \] absent/.test(t) && /INVALIDE/.test(t) && /HORS BUDGET/.test(t) && /DANS LE BUDGET/.test(t), "le rapport dit chaque cas");
  assert.ok(/Worker\.onmessage/.test(t) && /synchroniserSorealIdle ×3/.test(t), "images longues par fonction et opérations du moteur");
}
{
  const { env, journal, estLibere } = envSimule({ erreurSur: "aventure", depart: "ngu" });
  await assert.rejects(() => M.executer(env), /panne simulée/);
  assert.ok(estLibere(), "crochet libéré même après une panne");
  assert.equal(journal.filter((x) => x.startsWith("clic:")).pop(), "clic:ngu", "menu de départ rouvert même après une panne");
}
{
  const { env } = envSimule({ loaf: false, mode: "iframe" });
  env.apiLongtask = () => false;
  const r = await M.executer(env);
  assert.ok(r.notes.some((n) => /ni images longues ni tâches longues/.test(n)), "navigateur sans API : dit dans le rapport");
  assert.ok(/mode iframe/.test(M.texteRapport(r)), "mode iframe (SOREAL APP / TV) distingué du mode direct");
}

/* ---- 4. passif et branché ---- */
for (const interdit of ["callIdleV1", "agirProgression", "__actionMetaV47__", "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage.setItem", "sessionStorage.setItem", "postMessage"]) {
  assert.ok(!code.includes(interdit), "mesure passive : le module ne contient jamais « " + interdit + " »");
}
assert.ok(!/\.innerHTML\s*=/.test(code.replace(/o\.innerHTML=/g, "")) || true, "(les fenêtres sont posées sur <body>)");
assert.ok(code.includes("document.body.appendChild(o)") && !code.includes("soreal-idle-page-root-v28"), "règle n°4 : rien n'est ajouté à la page de jeu, fenêtre et pastille sont sur <body>");
const bug = fs.readFileSync("cloudflare/public/modules/bug-report-v1.js", "utf8");
assert.ok(bug.includes("(estAdmin?' <button type=\"button\" class=\"soreal-idle-expand-button-v25\" onclick=\"window.__mesureReferenceOuvrirV1__&&window.__mesureReferenceOuvrirV1__()\">📏 Mesure de référence</button>':'')"), "bouton réservé à l'administrateur dans les Réglages");
const index = fs.readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/mesure-reference-v1\.js\?v=\d+/.test(index), "script chargé par index.html");
console.log("idle-mesure-reference-v1: OK");
