/*
 * Aide des PARTIES DE RÉFÉRENCE (plan design/ARCHITECTURE-CIBLE.md, § 4 : « parties de référence figées »). Charge le VRAI moteur (celui du serveur et du jeu local) sur une ligne de joueur figée, avec une horloge GELÉE et un hasard à graine :
 * le même scénario donne exactement le même état, quelle que soit la machine ou l'heure. Toute reconstruction du moteur doit reproduire ces états À L'IDENTIQUE.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const racine = process.cwd();
const { runSorealIdleOperation } = await import(pathToFileURL(racine + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(racine + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const src = fs.readFileSync(racine + "/cloudflare/tools/local-dev-server.mjs", "utf8");
const ENTETE = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();

/* Identité d'accès du moteur de test (comme les autres tests) : elle n'existe qu'en mémoire, jamais dans le fichier de la partie de référence (anonymisée). */
export const EMAIL_REFERENCE = "technicien.soreal@gmail.com";

/* Hasard déterministe (mulberry32) : le moteur tire des boosts d'objets, des repas... avec Math.random. */
export function figerLeHasard(graine = 20261105) {
  let a = graine >>> 0;
  Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* Horloge gelée : seul avancer() la fait bouger. */
const vrai = Date.now.bind(Date);
let base = vrai(), decalage = 0;
Date.now = () => base + decalage;
export function reglerHorloge(ms) { base = ms; decalage = 0; }
export function avancer(ms) { decalage += ms; }
export function maintenant() { return Date.now(); }

/* ligne : tableau des 38 colonnes de la ligne JOUEURS (anonymisée). Renvoie { run(operation, ...args), ligne() }. */
export function creerMoteur(ligne) {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(ENTETE), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { email: EMAIL_REFERENCE, emailConnexion: EMAIL_REFERENCE, emails: [EMAIL_REFERENCE], prenom: "Joueur" };
  const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
  run("obtenirEtatSorealIdle");
  const cree = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const identite = JSON.parse(cree.row_json);
  const cells = ligne.slice();
  for (const c of [0, 1, 18, 19]) cells[c] = identite[c];   /* l'identité reste celle du joueur de test ; tout le reste vient de la partie de référence */
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(cells), cree.id);
  return { run, ligne: () => JSON.parse(sql.exec("select row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0].row_json) };
}
