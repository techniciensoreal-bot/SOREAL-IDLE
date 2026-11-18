import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-11-18, achat « Auto Nuker ») : « il ne doit réellement se lancer que quand un boss au minimum est tuable ; sinon ça ne sert à rien et ça fait un son toutes les minutes. »
 * Le moteur annonce `nukePossible` (mêmes conditions que la première passe de BossController::nukeBosses) ; le client ne lance l'auto Nuke que si c'est vrai.
 */
const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));

let niveauxEntrainement = 0;
function partie(boss, pic) {
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
  arr[14] = boss;
  const st = JSON.parse(arr[37] || "{}");
  st.metaNgu = st.metaNgu || {};
  st.metaNgu.difficultyPeaks = { normal: pic };
  if (niveauxEntrainement > 0) { st.entrainementBase = { version: 411, lastUpdateMs: Date.now(), skills: {} }; for (const k of ["attaque_passive", "attaque_reguliere", "attaque_renforcee", "contre_palette", "percee_quai", "ultime_soreal", "blocage", "bouclier", "riposte", "garde", "mur", "forteresse"]) st.entrainementBase.skills[k] = { level: niveauxEntrainement, progress: 0, allocation: 0, cap: 2500 }; }
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  return run;
}
const etatDe = (run) => run("obtenirEtatSorealIdle");
const lire = (r) => (r && r.joueur) || r;

/* 1. Joueur très fort, boss 3 déjà vaincu en Normal (record 100) : le NUKE tuerait un boss. */
niveauxEntrainement = 1e7;
assert.equal(lire(etatDe(partie(3, 100))).nukePossible, true, "boss tuable : l'Auto Nuker peut se lancer");
/* 2. Même joueur, mais le boss courant n'a JAMAIS été vaincu en Normal (record = boss courant) : le NUKE s'arrête avant (BossController::nukeBosses). */
assert.equal(lire(etatDe(partie(3, 3))).nukePossible, false, "boss encore jamais vaincu : aucun boss tuable, pas de Nuke");
/* 3. Joueur faible (entraînement à 0) : Attack/5 n'atteint pas la Defense du boss. */
niveauxEntrainement = 0;
assert.equal(lire(etatDe(partie(3, 100))).nukePossible, false, "joueur trop faible : aucun boss tuable, pas de Nuke");

/* Client : l'auto Nuke ne part que si le moteur annonce un boss tuable, avant toute minuterie, tout son, toute animation. */
const amorcage = readFileSync("cloudflare/public/modules/ui-amorcage-v1.js", "utf8");
const a = amorcage.indexOf("Number(achats.autoNuker)>0");
const fenetre = amorcage.slice(a, a + 1800);
assert.ok(fenetre.includes("if(j.nukePossible!==true)return;"), "garde nukePossible dans l'Auto Nuker");
assert.ok(fenetre.indexOf("j.nukePossible!==true") < fenetre.indexOf("nukerBossIdleV1_();"), "la garde passe AVANT le lancement du Nuke");
assert.ok(fenetre.indexOf("j.nukePossible!==true") < fenetre.indexOf("REG.idleAutoNukeDernierV1=maintenant"), "la minuterie n'est pas consommée tant qu'aucun boss n'est tuable");
const etat = readFileSync("cloudflare/src/idle-runtime-etat.js", "utf8");
assert.ok(etat.includes("nukePossible: nukeTueUnBossSorealIdle_("), "le moteur annonce nukePossible");
console.log("OK idle-auto-nuke-boss-tuable-v1");
