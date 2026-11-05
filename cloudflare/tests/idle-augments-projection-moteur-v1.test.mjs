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
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);


/*
 * Norman (2026-11-05, plan design/PLAN-MOTEUR-UNIQUE.md) : après la Machine temporelle, MÊME preuve pour les Augmentations : la rejouée de l'écran (rejouerCyclesAugmentIdleV1_ et sa variante CAP, augmentations-page-v1.js) doit donner les mêmes
 * niveaux et la même fraction de barre que le moteur (advanceAugmentationTrackV214_), pour un même instant. Les deux fonctions de l'écran sont extraites du fichier tel quel (pures, sans DOM).
 */
const ecran = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const extraire = (nom, fin) => { const a = ecran.indexOf("function " + nom + "(p){"); const b = ecran.indexOf(fin, a); assert.ok(a > 0 && b > a, nom + " trouvée"); return ecran.slice(a, b); };
const rejouer = new Function(extraire("rejouerCyclesAugmentIdleV1_", "window.__rejouerCyclesAugmentIdleV1__=") + "\nreturn rejouerCyclesAugmentIdleV1_;")();
const rejouerCap = new Function(extraire("rejouerCyclesAugmentPlafonneIdleV1_", "window.__rejouerCyclesAugmentPlafonneIdleV1__=") + "\nreturn rejouerCyclesAugmentPlafonneIdleV1_;")();
const lire = (r) => {
  const j = r.joueur, d = j.systemes.augmentations.find((x) => x.id === "scissors");
  const pair = j.systemes.systems.find((x) => x.id === "augmentations").state.data.pairs.scissors;
  return { niveau: pair.level, sec: d.secondsPerLevel, brut: d.secondsPerLevelBrut, fraction: d.progressFraction, cout: d.goldCost, or: Number(j.systemes.currencies.gold) };
};
const ecarts = [];
let niveauxMax = 0;
for (const alloc of [1e4, 1e5, 1e6, 4e6, 2e7]) {
  const run = partie();
  agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: alloc });
  decalage += 3000; run("synchroniserSorealIdle");
  for (const dt of [0.5, 3, 25, 200]) {
    const a = lire(run("synchroniserSorealIdle"));
    if (!(a.sec > 0.0201)) { ecarts.push([alloc, dt, "barre CAP : hors de ce test"]); continue; }
    const p = { niv0: a.niveau, sec0: a.sec, cout0: a.cout, expo: 1, reste0: a.fraction * a.sec + dt, debites: 0, gold: a.or, plafondK: Infinity };
    const rj = rejouer(p);
    decalage += dt * 1000;
    const b = lire(run("synchroniserSorealIdle"));
    niveauxMax = Math.max(niveauxMax, b.niveau - a.niveau);
    const fractionEcran = rj.reste / rj.dureeProchaine;
    ecarts.push([alloc, dt, a.niveau, b.niveau, a.niveau + rj.k, +b.fraction.toFixed(5), +fractionEcran.toFixed(5)]);
    assert.equal(a.niveau + rj.k, b.niveau, "niveau après " + dt + " s (alloc " + alloc + ") : moteur " + b.niveau + " / écran " + (a.niveau + rj.k));
    assert.ok(Math.abs(fractionEcran - b.fraction) < 2e-3, "fraction après " + dt + " s (alloc " + alloc + ") : moteur " + b.fraction + " / écran " + fractionEcran);
  }
}
/*
 * BARRES CAP (un niveau dure moins d'un tick) : Norman (2026-11-05) : « ça doit être exactement la même chose que sur NGU IDLE original ». Wiki NGU Idle, page Energy, section Ticks : 50 mises à jour par seconde, une barre gagne au plus UN niveau par tick,
 * soit 50 niveaux par seconde. Le moteur (idle-tick-v1.js) donne maintenant au moins un tick à chaque niveau ; l'écran rejoue avec la durée SANS plancher (secondsPerLevelBrut) puis applique le même plancher.
 */
let capVu = 0;
for (const alloc of [1e8, 5e8, 4e9, 4e11]) {
  for (const dt of [0.1, 0.4, 1, 5]) {
    const run = partie();
    agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: alloc });
    const a = lire(run("synchroniserSorealIdle"));
    if (!(a.brut > 0 && a.brut < 0.0201)) continue;
    capVu += 1;
    const rj = rejouerCap({ niv0: a.niveau, sec0: a.brut, cout0: a.cout, expo: 1, reste0: a.fraction * a.sec + dt, debites: 0, gold: a.or, plafondK: Infinity });
    decalage += dt * 1000;
    const b = lire(run("synchroniserSorealIdle"));
    assert.ok(b.niveau - a.niveau <= Math.ceil(50 * dt) + 1, "jamais plus de 50 niveaux par seconde : " + (b.niveau - a.niveau) + " niveaux en " + dt + " s (alloc " + alloc + ")");
    assert.equal(a.niveau + rj.k, b.niveau, "CAP : niveau après " + dt + " s (alloc " + alloc + ") : moteur " + b.niveau + " / écran " + (a.niveau + rj.k) + " (durée sans plancher " + a.brut + ")");
    assert.ok(Math.abs(rj.reste / rj.dureeProchaine - b.fraction) < 2e-2, "CAP : fraction après " + dt + " s (alloc " + alloc + ")");
  }
}
assert.ok(capVu >= 4, "le test voit des barres CAP : " + capVu);
assert.ok(niveauxMax >= 20, "le test passe vraiment des niveaux : " + niveauxMax);
console.log("idle-augments-projection-moteur-v1: OK (" + niveauxMax + " niveaux au mieux en une étape)");
