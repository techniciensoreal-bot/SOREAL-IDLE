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
  st.metaNgu.currencies.gold = 1e15;
  st.metaNgu.resources = st.metaNgu.resources || {}; st.metaNgu.resources.energy = Object.assign(st.metaNgu.resources.energy || {}, { current: 1e17, cap: 1e18, capNaturel: 1e18 });
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);

await import(pathToFileURL(process.cwd() + "/cloudflare/public/modules/tm-projection-v1.js").href);
const PROJ = globalThis.__SOREAL_IDLE_TM_PROJECTION_V1__;
assert.ok(PROJ && typeof PROJ.projeter === "function", "module de projection chargé");

/*
 * Norman (2026-11-05) : « je veux que ça fonctionne comme le jeu original sous Unity ». La projection de l'écran (tm-projection-v1.js) et le moteur (advanceTimeMachine) doivent donner la MÊME barre : mêmes niveaux, même fraction,
 * pour un même instant. Instantané du moteur, puis le moteur avance de dt secondes, puis la projection de l'instantané à dt.
 */
const piste = (r, nom) => {
  const j = r.joueur, v = j.systemes.timeMachineView, d = j.systemes.systems.find((x) => x.id === "timeMachine").state.data;
  const energie = nom === "vitesse";
  const fill = energie ? v.speedFill : v.goldFill, eta = energie ? v.speedEtaSeconds : v.goldEtaSeconds;
  const niveau = energie ? d.speedLevel : d.goldLevel;
  const palier = Number.isFinite(eta) && fill < 1 ? eta / (1 - fill) : 0;
  return { fill, eta, niveau, palier, or: Number(j.systemes.currencies.gold) };
};
function comparer(titre, alloc, dts, orLimite) {
  const run = partie();
  agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: alloc });
  decalage += 5000; run("synchroniserSorealIdle");
  const ecarts = [];
  for (const dt of dts) {
    const r0 = run("synchroniserSorealIdle"); const p0 = piste(r0, "vitesse");
    if (!(p0.palier > 0)) { ecarts.push([dt, "pas de barre"]); continue; }
    const proj = PROJ.projeter({ palier: p0.palier, fill0: p0.fill, ecoule: dt, niveau0: p0.niveau, or: orLimite ? p0.or : null });
    decalage += dt * 1000;
    const r1 = run("synchroniserSorealIdle"); const p1 = piste(r1, "vitesse");
    ecarts.push([dt, p0.niveau, p1.niveau, proj.franchis + p0.niveau, +p1.fill.toFixed(5), +proj.fill.toFixed(5)]);
    assert.equal(proj.franchis + p0.niveau, p1.niveau, titre + " : niveau après " + dt + " s (alloc " + alloc + ")");
    assert.ok(Math.abs(proj.fill - p1.fill) < 1e-3, titre + " : fraction après " + dt + " s : moteur " + p1.fill + " / projection " + proj.fill);
  }
  return ecarts;
}
// 1. Barre lente puis rapide, Or illimité (la partie de test a 1e15 d'Or) : niveaux et fraction égaux
let niveauxMax = 0;
for (const alloc of [5e5, 5e7, 5e8, 5e9]) for (const e of comparer("or illimité", alloc, [0.5, 3, 20, 120, 600])) if (e.length === 6) niveauxMax = Math.max(niveauxMax, e[2] - e[1]);
assert.ok(niveauxMax >= 20, "le test passe vraiment des niveaux (barre rapide) : " + niveauxMax + " niveaux gagnés au mieux en une étape");
// 2. Un changement d'allocation en cours de niveau garde la FRACTION (le moteur remet les secondes à l'échelle) : la projection repart de la nouvelle durée
{
  const run = partie();
  agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 40000 });
  decalage += 4000; run("synchroniserSorealIdle");
  const avant = piste(run("synchroniserSorealIdle"), "vitesse");
  const r = agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 2000000 });
  const apres = piste(r, "vitesse");
  assert.ok(Math.abs(apres.fill - avant.fill) < 0.05 || apres.niveau > avant.niveau, "la fraction est conservée au changement d'allocation (" + avant.fill + " -> " + apres.fill + ")");
  decalage += 2000;
  const proj = PROJ.projeter({ palier: apres.palier, fill0: apres.fill, ecoule: 2, niveau0: apres.niveau, or: null });
  const fin = piste(run("synchroniserSorealIdle"), "vitesse");
  assert.equal(proj.franchis + apres.niveau, fin.niveau, "niveau après changement d'allocation");
  assert.ok(Math.abs(proj.fill - fin.fill) < 1e-3, "fraction après changement d'allocation : " + fin.fill + " / " + proj.fill);
}
console.log("idle-tm-projection-moteur-v1: OK");
