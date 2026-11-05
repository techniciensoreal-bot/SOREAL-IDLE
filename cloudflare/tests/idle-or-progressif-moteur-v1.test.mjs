import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const vrai = Date.now.bind(Date);
let decalage = 0;
const horloge0 = vrai();
Date.now = () => horloge0 + decalage;   /* horloge GELÉE : seul `decalage` la fait avancer (le temps réel du calcul ne compte pas) */
function partie() {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEAD), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
  run("obtenirEtatSorealIdle");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 5e14; arr[5] = 1e15; arr[6] = 0;
  const st = JSON.parse(arr[37] || "{}");
  st.metaNgu.currencies = st.metaNgu.currencies || {};
  st.metaNgu.currencies.gold = 3e7; st.metaNgu.systems.timeMachine.data.bestGoldThisRun = 1e6; st.metaNgu.systems.timeMachine.data.highestBossEver = 28;
  st.metaNgu.resources = st.metaNgu.resources || {}; st.metaNgu.resources.energy = Object.assign(st.metaNgu.resources.energy || {}, { current: 1e17, cap: 1e18, capNaturel: 1e18 });
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);

/*
 * Norman (2026-11-05) : « fais l'Or progressif comme le jeu d'origine ». Dans NGU Idle l'Or de chaque tick est ajouté AVANT la vérification du niveau suivant. Le moteur (avancerTmProgressifV1) coupe le temps aux événements ; ici il est comparé à une
 * SIMULATION de référence pas à pas (1 ms) des mêmes règles, quand l'Or limite la montée de niveaux : durée d'un niveau = (niveau + 1) x facteur (au moins un tick), coût 5 000 000 x niveau visé, Or par seconde = C x barres/s x (1 + niveau d'Or) - mineurs.
 */
const vue = (r) => { const j = r.joueur, v = j.systemes.timeMachineView, d = j.systemes.systems.find((x) => x.id === "timeMachine").state.data; return { v, niveau: d.speedLevel, or: Number(j.systemes.currencies.gold), fill: v.speedFill }; };
const run = partie();
agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 5e9 });
decalage += 1000; run("synchroniserSorealIdle");
const a = vue(run("synchroniserSorealIdle"));
assert.ok(a.v.speedStepBrut > 0 && a.v.grossGps > 0, "barre allouée et Or par seconde positif : brut " + a.v.speedStepBrut + ", Or/s " + a.v.grossGps);
const L0 = a.niveau, facteur = a.v.speedStepBrut / (L0 + 1), drain = a.v.grossGps - a.v.netGps;
const bps = (l) => (l < 50 ? Math.min(50, 1 + l) : 50 * (1 + (l - 49)));
const C = a.v.grossGps / (bps(L0) * (1 + 0));
const gps = (l) => Math.max(0, C * bps(l) - drain);
function reference(T) {
  let niveau = L0, or = a.or, prog = a.fill * Math.max(0.02, facteur * (L0 + 1)), step = Math.max(0.02, facteur * (niveau + 1));
  const dt = 0.001;
  for (let t = 0; t < T - 1e-9; t += dt) {
    or += gps(niveau) * dt;
    prog += dt;
    if (prog >= step - 1e-12) {
      const cout = 5e6 * (niveau + 1);
      if (or + 1e-9 >= cout) { or -= cout; prog = Math.max(0, prog - step); niveau += 1; step = Math.max(0.02, facteur * (niveau + 1)); } else prog = step;
    }
  }
  return { niveau, or };
}
let achatsMax = 0;
let cumul = 0;
for (const dt of [20, 20, 20, 20, 20]) {
  const ref = reference(cumul + dt);
  decalage += dt * 1000; cumul += dt;
  const b = vue(run("synchroniserSorealIdle"));
  achatsMax = Math.max(achatsMax, b.niveau - L0);
  assert.ok(Math.abs(b.niveau - ref.niveau) <= 1, "niveau après " + cumul + " s : moteur " + b.niveau + " / référence " + ref.niveau);
  assert.ok(Math.abs(b.or - ref.or) <= 0.01 * Math.max(1, Math.abs(ref.or)) + 2e5, "Or après " + cumul + " s : moteur " + b.or + " / référence " + ref.or);
}
assert.ok(achatsMax >= 3, "l'Or limite vraiment la montée (plusieurs achats) : " + achatsMax);
console.log("idle-or-progressif-moteur-v1: OK (" + achatsMax + " niveaux achetés avec l'Or qui arrive)");
