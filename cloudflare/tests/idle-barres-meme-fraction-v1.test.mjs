import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-10-05) : « quand j'ajoute de l'énergie dans une barre, au lieu de monter plus vite, elle rattrape le retard qu'elle a, comme si on avait mis une grosse somme dès le départ : on peut mettre une grosse somme,
 * remplir le niveau en un coup et retirer la somme. Ça ne fonctionne pas comme ça dans NGU : elle adopte la nouvelle vitesse, elle finit plus vite, mais pas instantanément. Dans l'intégralité du jeu. »
 * Barres comptées en secondes de la durée du niveau (Augments, Time Machine, rituels de Blood Magic) : en changeant l'allocation, c'est la FRACTION de barre qui reste.
 */
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
const aug = (r) => r.joueur.systemes.augmentations.find((x) => x.id === "scissors");

// 1. Augments : 20 s à une allocation, puis on la quadruple : la barre ne saute pas, elle garde sa fraction.
{
  const run = partie();
  let r = agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 60 });
  assert.equal(r.ok, true);
  decalage += 2000000;
  r = run("synchroniserSorealIdle");
  const avant = aug(r).progressPct;
  assert.ok(avant > 0.02 && avant < 0.9, "barre partielle avant le changement (" + avant + ")");
  const dureeAvant = aug(r).secondsPerLevel;
  r = agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 240 });
  const apres = aug(r).progressPct;
  assert.ok(Math.abs(apres - avant) < 0.01, "même fraction juste après (avant " + avant + ", après " + apres + ")");
  assert.ok(aug(r).secondsPerLevel < dureeAvant / 3.5, "mais une durée de niveau plus courte : nouvelle vitesse");
  // Le temps passe à la nouvelle vitesse : la fraction avance plus vite qu'avant, sans saut.
  decalage += 300000;
  r = run("synchroniserSorealIdle");
  const plusTard = aug(r).progressPct;
  assert.ok(plusTard > apres && plusTard - apres < 0.9, "elle avance à la nouvelle vitesse (" + apres + " -> " + plusTard + ")");
  // Retirer toute la somme : la barre garde sa place, rien n'est perdu ni gagné.
  r = agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 0 });
  assert.ok(Math.abs(aug(r).progressPct - plusTard) < 0.01, "sans énergie, la barre reste à sa place");
}

// 1 bis. Le changement arrive PLUS TARD que la dernière synchro : le temps écoulé depuis est compté à l'ANCIENNE vitesse (jamais à la nouvelle).
{
  const run = partie();
  agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 60 });
  let r = run("synchroniserSorealIdle");
  decalage += 2000000;
  const attendu = 2000 / aug(r).secondsPerLevel;
  r = agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 240 });
  const apres = aug(r).progressPct;
  assert.ok(Math.abs(apres - attendu) < 0.02, "2000 s écoulées à l'ancienne vitesse : " + attendu + " attendu, " + apres + " obtenu");
}

// 2. Gros coup impossible : une forte allocation placée au dernier moment ne remplit pas le niveau.
{
  const run = partie();
  agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1 });
  decalage += 30000;
  let r = run("synchroniserSorealIdle");
  const avant = aug(r).progressPct;
  r = agir(run, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 200 });
  const niveauAvant = r.joueur.systemes.systems.find((x) => x.id === "augmentations").state.data.pairs.scissors.level;
  decalage += 1;
  r = run("synchroniserSorealIdle");
  const niveauApres = r.joueur.systemes.systems.find((x) => x.id === "augmentations").state.data.pairs.scissors.level;
  assert.equal(niveauApres, niveauAvant, "aucun niveau gagné d'un coup en augmentant l'allocation (barre à " + avant + ")");
}

// 2 bis. Time Machine : même règle (fraction conservée, durée divisée) ; Blood Magic : sans Magic, la barre garde sa place.
{
  const run = partie();
  agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 20 });
  decalage += 300000;
  let r = run("synchroniserSorealIdle");
  const t1 = r.joueur.systemes.timeMachineView;
  r = agir(run, { action: "allocate", system: "timeMachine", resource: "energy", value: 80 });
  const t2 = r.joueur.systemes.timeMachineView;
  assert.ok(t1.speedFill > 0 && Math.abs(t2.speedFill / t1.speedFill - 1) < 0.01, "Time Machine : même fraction après x4 (" + t1.speedFill + " -> " + t2.speedFill + ")");
  assert.ok(Math.abs(t2.speedEtaSeconds / t1.speedEtaSeconds - 0.25) < 0.01, "Time Machine : durée restante divisée par 4");
  decalage += 100000;
  agir(run, { action: "allocate", system: "bloodMagic", resource: "magic", value: 40 });
  decalage += 600000;
  r = run("synchroniserSorealIdle");
  const avant = r.joueur.systemes.bloodMagicView.progressFraction;
  r = agir(run, { action: "allocate", system: "bloodMagic", resource: "magic", value: 0 });
  const vide = r.joueur.systemes.bloodMagicView;
  assert.ok(avant > 0 && vide.secondsPerCompletion === null && Math.abs(vide.progressFraction - avant) < avant * 0.01, "Blood Magic : sans Magic, la barre garde sa fraction (" + avant + " -> " + vide.progressFraction + ")");
}

// 3. Code : Time Machine et Blood Magic suivent la même règle ; le client garde la fraction.
const src = readFileSync("cloudflare/src/idle-ngu-progression.js", "utf8");
assert.ok(src.includes('rebaserProgressionSecondesV1(d, "speedProgress", energyStep)') && src.includes('rebaserProgressionSecondesV1(d, "goldProgress", magicStep)') && src.includes('rebaserProgressionSecondesV1(rs, "progress", secondsPerCompletion)') && src.includes("rebaserProgressionSecondesV1(pair,progressKey,needed)"));
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(!/recalculerPisteAllocIdleV1_\(k,progSec,alloc\)/.test(meta), "plus aucun recalcul local à secondes constantes");
assert.ok(meta.includes("function recalculerPisteFractionIdleV1_(k,fraction,alloc)"));
console.log("idle-barres-meme-fraction-v1: OK");
