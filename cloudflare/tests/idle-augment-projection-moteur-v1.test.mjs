/* Norman (2026-11-05) : une seule formule pour une barre. Les Augmentations rejouent leurs niveaux dans l écran (augmentations-page-v1.js, rejouerCyclesAugmentIdleV1_ et la variante CAP) : ce test fait avancer le VRAI moteur et compare niveau, fraction et Or (Augments et Upgrades, barres lentes, rapides, au plafond d un tick, Or épuisé). Mesuré le 2026-11-10 : aucun écart. SOREAL_ECARTS=1 affiche le détail. */
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


/* Chargement de la formule de l'écran (augmentations-page-v1.js) dans un faux navigateur : on n'a besoin que de rejouerCyclesAugmentIdleV1_. */
import vm from "node:vm";
const fenetre = { addEventListener() {}, setInterval() {}, setTimeout() {}, performance: { now: () => 0 } };
fenetre.window = fenetre;
vm.runInNewContext(readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8"), Object.assign(fenetre, { document: { getElementById: () => null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] }, console, Math, Date, Number, Object, Array, JSON, String, Infinity, isFinite, parseFloat, parseInt, localStorage: { getItem: () => null, setItem() {} } }));
const rejouerFormule = fenetre.__rejouerCyclesAugmentIdleV1__, rejouerCap = fenetre.__rejouerCyclesAugmentPlafonneIdleV1__;
/* même choix que la page : une durée de niveau sous un tick (0,02 s) passe par la barre « CAP » */
const rejouer = (p) => (p.sec0 <= 0.0201 ? rejouerCap(Object.assign({}, p, { sec0: p.brut > 0 ? p.brut : p.sec0 })) : rejouerFormule(p));
assert.equal(typeof rejouer, "function", "formule de l'écran chargée");

const lire = (r, id, haut) => {
  const j = r.joueur, s = j.systemes;
  const def = s.augmentations.find((x) => x.id === id);
  const p = s.systems.find((x) => x.id === "augmentations").state.data.pairs[id];
  return haut
    ? { niveau: p.upgradeLevel, fraction: def.upgradeProgressPct, secondes: def.upgradeSecondsPerLevel, brut: def.upgradeSecondsPerLevelBrut, cout: def.upgradeGoldCost, or: Number(s.currencies.gold) }
    : { niveau: p.level, fraction: def.progressPct, secondes: def.secondsPerLevel, brut: def.secondsPerLevelBrut, cout: def.goldCost, or: Number(s.currencies.gold) };
};
const ECARTS = [];
function comparer(titre, id, haut, energie, dts) {
  const run = partie();
  agir(run, { action: "allocateAugment", pair: id, upgrade: haut, value: energie });
  decalage += 3000; run("synchroniserSorealIdle");
  for (const dt of dts) {
    const r0 = run("synchroniserSorealIdle"); const a = lire(r0, id, haut);
    if (!(a.secondes > 0)) { ECARTS.push([titre, dt, "pas de barre"]); continue; }
    const rj = rejouer({ niv0: a.niveau, sec0: a.secondes, cout0: a.cout, expo: haut ? 2 : 1, brut: a.brut, reste0: a.fraction * a.secondes + dt, debites: 0, gold: a.or, plafondK: Infinity });
    let restant = dt, r1;
    while (restant > 1e-9) { const pas = Math.min(30, restant); decalage += pas * 1000; restant -= pas; r1 = run("synchroniserSorealIdle"); }
    const b = lire(r1, id, haut);
    const fracEcran = rj.bloque ? 1 : rj.reste / rj.dureeProchaine;   /* Or insuffisant : barre pleine, en attente */
    ECARTS.push([titre, dt, a.niveau, b.niveau, a.niveau + rj.k, +b.fraction.toFixed(4), +fracEcran.toFixed(4)]);
    assert.equal(a.niveau + rj.k, b.niveau, titre + " : niveau après " + dt + " s (énergie " + energie + ") moteur " + b.niveau + " / écran " + (a.niveau + rj.k));
    assert.ok(Math.abs((a.or - rj.debit) - b.or) <= Math.max(1, Math.abs(b.or) * 1e-9), titre + " : Or après " + dt + " s : moteur " + b.or + " / écran " + (a.or - rj.debit));
    assert.ok(Math.abs(fracEcran - b.fraction) < 2e-3, titre + " : fraction après " + dt + " s : moteur " + b.fraction + " / écran " + fracEcran);
  }
}
for (const id of ["scissors", "milk"]) for (const e of [1e4, 1e6, 1e8, 1e10]) comparer("augment " + id, id, false, e, [0.5, 3, 20, 120, 600]);
for (const id of ["scissors"]) for (const e of [1e6, 1e9, 1e11]) comparer("upgrade " + id, id, true, e, [0.5, 3, 20, 120]);
if (process.env.SOREAL_ECARTS === "1") console.log(ECARTS.map((x) => x.join(" ")).join(String.fromCharCode(10)));
console.log("idle-augment-projection-moteur-v1: OK");
