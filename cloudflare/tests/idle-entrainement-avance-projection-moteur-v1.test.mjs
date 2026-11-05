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
Date.now = () => horloge0 + decalage;   /* horloge GELÉE : seul `decalage` la fait avancer */
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

  for (const k of Object.keys(st.entrainementBase.skills)) st.entrainementBase.skills[k].level = Math.max(st.entrainementBase.skills[k].level || 0, 100000);   /* Basic Training terminé */
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);

/*
 * Norman (2026-11-05, plan design/PLAN-MOTEUR-UNIQUE.md) : MÊME preuve que pour la Machine temporelle et les Augmentations, pour l'ENTRAÎNEMENT AVANCÉ. La simulation de l'écran (atSimulerIdleV1_ et
 * atNiveauxDepuisTravailIdleV1_, augmentations-page-v1.js, extraites telles quelles : pures, sans DOM) doit donner le même niveau et la même fraction de barre que le moteur (advanceAdvancedTrainingV1,
 * idle-ngu-pistes.js) pour un même instant, l'horloge étant gelée. L'écran part du repère de la réponse précédente (tempLevel, progress, rateParEnergie de advancedTrainingView).
 *
 * RÈGLE DU WIKI « Ticks » (corrigée le 2026-11-05) : une barre gagne au plus 50 niveaux par seconde, QUEL QUE SOIT le découpage du temps en appels (atAvancerTempsV1, idle-ngu-pistes.js ; miroir atAvancerIdleV1_ côté écran).
 */
const ecran = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const a0 = ecran.indexOf("function atNiveauxDepuisTravailIdleV1_(");
const b0 = ecran.indexOf("function atBonusTexteIdleV1_(", a0);
assert.ok(a0 > 0 && b0 > a0, "fonctions de l'écran trouvées");
const simuler = new Function(ecran.slice(a0, b0) + "\nreturn atSimulerIdleV1_;")();

const lire = (r, id) => {
  const j = r.joueur;
  const sys = j.systemes.systems.find((x) => x.id === "advancedTraining");
  assert.ok(sys && sys.state && sys.state.unlocked, "Entraînement avancé débloqué dans la partie de test");
  const t = sys.state.data.tracks[id];
  const vue = j.systemes.advancedTrainingView;
  return { n: Math.floor(t.tempLevel), p: t.progress, energie: Number(t.energy) || 0, taux: vue.pistes[id].rateParEnergie, gratuit: vue.gratuit ? 1 : 0, cible: Math.floor(t.target || 0) };
};

const ecarts = [];
let niveauxMax = 0, plafond51 = 0;
for (const id of ["power", "toughness", "block"]) {
  for (const alloc of [1e3, 1e6, 1e9, 1e12, 1e15]) {
    const run = partie();
    agir(run, { action: "allocateAdvancedTraining", track: id, value: alloc });
    decalage += 3000; run("synchroniserSorealIdle");
    for (const dt of [0.05, 0.5, 3, 25, 200]) {
      const a = lire(run("synchroniserSorealIdle"), id);
      assert.ok(a.energie > 0, "énergie posée sur " + id);
      const e = simuler(a.n, a.p, dt, a.energie, a.taux, a.gratuit, a.cible);
      decalage += dt * 1000;
      const b = lire(run("synchroniserSorealIdle"), id);
      niveauxMax = Math.max(niveauxMax, b.n - a.n);
      if (b.n - a.n > Math.ceil(50 * dt - 1e-9) + 0) plafond51 += 1;
      ecarts.push([id, alloc, dt, a.n, b.n, a.n === b.n ? 0 : e.n - a.n, +b.p.toFixed(5), +e.p.toFixed(5)]);
      assert.equal(e.n, b.n, id + " niveau après " + dt + " s (alloc " + alloc + ") : moteur " + b.n + " / écran " + e.n);
      assert.ok(Math.abs(e.p - b.p) < 2e-3, id + " fraction après " + dt + " s (alloc " + alloc + ") : moteur " + b.p + " / écran " + e.p);
    }
  }
}
assert.ok(niveauxMax >= 20, "le test passe vraiment des niveaux : " + niveauxMax);

/* Indépendance du découpage : 100 synchros de 0,01 s = 1 synchro de 1 s, et jamais plus de 50 niveaux en 1 s (énergie énorme, plateau). */
{
  const mk = () => { const r = partie(); agir(r, { action: "allocateAdvancedTraining", track: "power", value: 1e15 }); decalage += 3000; r("synchroniserSorealIdle"); return r; };
  const r1 = mk(); const a = lire(r1("synchroniserSorealIdle"), "power");
  let n = a.n;
  for (let i = 0; i < 100; i += 1) { decalage += 10; n = lire(r1("synchroniserSorealIdle"), "power").n; }
  const r2 = mk(); const c = lire(r2("synchroniserSorealIdle"), "power");
  decalage += 1000; const d = lire(r2("synchroniserSorealIdle"), "power");
  assert.ok(n - a.n <= 50 && d.n - c.n <= 50, "au plus 50 niveaux par seconde : " + (n - a.n) + " (100 synchros) / " + (d.n - c.n) + " (1 synchro)");
  assert.ok(Math.abs((n - a.n) - (d.n - c.n)) <= 1, "même résultat quel que soit le découpage : " + (n - a.n) + " / " + (d.n - c.n));
}
console.log("idle-entrainement-avance-projection-moteur-v1: OK (" + niveauxMax + " niveaux au mieux en une étape ; " + plafond51 + " étapes au-dessus de 50 niveaux/s)");
