import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const vrai = Date.now.bind(Date);
let decalage = 0;
Date.now = () => vrai() + decalage;
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
  arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
  const st = JSON.parse(arr[37] || "{}");
  st.metaNgu.currencies = st.metaNgu.currencies || {};
  st.metaNgu.currencies.gold = 1e15;
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);

/*
 * Norman (2026-11-05, sur sa partie copiée en ligne) : « la barre avance sans énergie ». Mesuré : clic « 0 » à 32 304 ms, allocation à 0 à l'écran à 32 308 ms, mais le moteur traitait l'ordre 0,1 à 0,4 s plus tard
 * et créditait l'ancienne allocation jusqu'à CET instant : la barre gagnait 12 points après le « 0 ». Le client envoie l'instant du clic (clientAt) ; le moteur crédite l'ancienne allocation jusqu'au clic, la nouvelle ensuite.
 */
// 1. Machine temporelle : 200 s avec de l'énergie, puis « 0 » cliqué il y a 300 ms et traité maintenant.
{
  const run = partie();
  agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 50 });
  decalage += 200000;
  run("synchroniserSorealIdle");
  const apresClic = [];
  for (const avecInstant of [false, true]) {
    const r0 = run("synchroniserSorealIdle");
    const avant = r0.joueur.systemes.timeMachineView;
    const clic = Date.now();           // instant du clic « 0 »
    decalage += 300;                               // le moteur ne traite l'ordre que 300 ms plus tard
    const p = { action: "allocate", system: "timeMachine", resource: "energy", value: 0 };
    if (avecInstant) p.clientAt = clic;
    const r = agir(run, p);
    const vue = r.joueur.systemes.timeMachineView;
    apresClic.push({ avecInstant, avant: avant.speedProgressSeconds, apres: vue.speedProgressSeconds, niveauAvant: avant.speedLevel, niveau: r.joueur.systemes.systems.find((x) => x.id === "timeMachine").state.data.speedLevel });
    // la barre reste figée ensuite (plus d'énergie)
    decalage += 5000;
    const plus = run("synchroniserSorealIdle").joueur.systemes.timeMachineView;
    assert.equal(plus.speedProgressSeconds, vue.speedProgressSeconds, "plus aucune progression une fois l'allocation à 0 (avecInstant=" + avecInstant + ")");
    // on remet de l'énergie pour la boucle suivante
    agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 50 });
    decalage += 1000;
  }
  const sans = apresClic[0], avec = apresClic[1];
  assert.ok(sans.apres - sans.avant > 0.2, "sans instant : l'ancienne allocation est créditée 300 ms de plus (comportement d'avant, " + (sans.apres - sans.avant) + " s)");
  /* Comparaison RELATIVE (le test tourne en temps réel : la durée du calcul de la synchro précédente, plus longue sous SOREAL_IDLE_VERIF_BONUS=1, s'ajoute des deux côtés) : l'instant du clic retire les 300 ms de retard. */
  assert.ok((sans.apres - sans.avant) - (avec.apres - avec.avant) > 0.2, "avec l'instant du clic : la barre garde la valeur du clic (" + avec.avant + " -> " + avec.apres + " ; sans : " + sans.avant + " -> " + sans.apres + ")");
}

// 2. Un instant du futur, trop ancien ou absurde est ignoré (instant du traitement).
{
  const run = partie();
  agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 50 });
  decalage += 100000;
  for (const clientAt of [Date.now() + 60000, Date.now() - 3600000, "x", NaN]) {
    const r0 = run("synchroniserSorealIdle");
    const avant = r0.joueur.systemes.timeMachineView.speedProgressSeconds;
    decalage += 500;
    const r = agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 50, clientAt });
    assert.ok(r.joueur.systemes.timeMachineView.speedProgressSeconds >= avant, "instant invalide ignoré : la barre ne recule pas (" + clientAt + ")");
  }
}

// 3. Le client envoie bien l'instant du clic (file d'allocations rapides et action meta), sans casser le dédoublonnage.
{
  const aug = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
  const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  assert.ok(aug.includes("payload.clientAt=typeof window.__SOREAL_IDLE_HEURE_V1__"), "file d'allocations rapides : instant du clic");
  assert.ok(aug.includes("envoi=Object.assign({},envoi,{clientAt:"), "lots : instant le plus récent");
  assert.ok(meta.includes("selectTrack$)/.test(String(payload.action||''))&&payload.clientAt===undefined"), "action meta : instant du clic");
  const synchro = readFileSync("cloudflare/public/modules/ui-synchro-v1.js", "utf8");
  assert.ok(synchro.includes("payload.clientAt===undefined&&/^(allocate|clear[A-Za-z]*Allocations$"), "dernier filet : tout appel d'action de rythme est horodaté");
  const bt = readFileSync("cloudflare/public/modules/ui-entrainement-v1.js", "utf8");
  assert.ok(bt.includes("REG.idleBasicTrainingClicAtV1||undefined") && bt.includes("REG.idleBasicTrainingClicAtV1=typeof window.__SOREAL_IDLE_HEURE_V1__"), "Entraînement de base : instant du clic en 3e argument");
  assert.ok(meta.includes("k==='clientAt'?undefined:v"), "le dédoublonnage ignore l'instant");
}
console.log("idle-allocation-instant-clic-v1: OK");
