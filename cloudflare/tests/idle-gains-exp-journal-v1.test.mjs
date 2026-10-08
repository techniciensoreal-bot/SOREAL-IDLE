import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";
import { enregistrerGainExpV1, lireGainsExpV1, IDLE_GAINS_MAX_PAR_JOUEUR_V1 } from "../src/idle-gains-v1.js";

/*
 * Journal des variations d'EXP + crédit d'EXP par l'administrateur (Norman, 2026-10-08 : les 300 EXP du set de la Grotte jamais versés à Sébastien ; « il faudrait un historique de ce qu'ils ont reçu pour contrer ça »).
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email","Email connexion"];
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS), Date.now());
[["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
const admin = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const op = (nom, ...args) => runSorealIdleOperation(sql, nom, ["local", ...args], admin);

// Le compte de l'administrateur existe (créé à la première lecture) ; on crée à côté celui de « Sébastien » en copiant sa ligne.
op("obtenirEtatSorealIdle", "local");
const ligneAdmin = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const arr = JSON.parse(ligneAdmin.row_json);
const stats = JSON.parse(arr[37] || "{}");
stats.metaNgu = stats.metaNgu || {};
stats.metaNgu.currencies = Object.assign({}, stats.metaNgu.currencies, { experience: 1000 });
arr[37] = JSON.stringify(stats);
arr[3] = 1000;
const sebastien = arr.slice();
sebastien[0] = "J777";
sebastien[1] = "Sébastien";
sebastien[18] = "seb@example.org";
sebastien[19] = "seb@example.org";
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 3, JSON.stringify(sebastien), Date.now());
db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligneAdmin.id);
const xpDe = (email) => { const r = sql.exec("select row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1").map((x) => JSON.parse(x.row_json)).find((x) => x[19] === email); return { xp: r[3], exp: JSON.parse(r[37]).metaNgu.currencies.experience }; };
assert.deepEqual(xpDe("seb@example.org"), { xp: 1000, exp: 1000 });

// 1. Le crédit : +300 EXP sur le compte désigné (colonne XP et état), jamais sur celui de l'administrateur
const avantAdmin = xpDe(admin.email);
const r = op("crediterExpAdminSorealIdle", { email: "SEB@example.org", montant: 300, reference: "set-cave-sebastien" });
assert.ok(r.ok, JSON.stringify(r));
assert.equal(r.avant, 1000);
assert.equal(r.apres, 1300);
assert.deepEqual(xpDe("seb@example.org"), { xp: 1300, exp: 1300 });
assert.deepEqual(xpDe(admin.email), avantAdmin, "le compte de l'administrateur n'a pas bougé");

// 2. Journal : une ligne avec l'opération, la référence et les soldes
const j = op("lireGainsExpAdminSorealIdle", { email: "seb@example.org" });
assert.ok(j.ok);
const ligne = j.lignes.find((x) => x.operation === "crediterExpAdminSorealIdle:set-cave-sebastien");
assert.ok(ligne, JSON.stringify(j.lignes));
assert.equal(ligne.avant, 1000);
assert.equal(ligne.apres, 1300);
assert.equal(ligne.delta, 300);
assert.equal(ligne.email, "seb@example.org");

// 3. Le même crédit ne passe qu'une fois ; paramètres invalides refusés
const encore = op("crediterExpAdminSorealIdle", { email: "seb@example.org", montant: 300, reference: "set-cave-sebastien" });
assert.equal(encore.ok, false);
assert.equal(encore.code, "DEJA_FAIT");
assert.equal(xpDe("seb@example.org").exp, 1300, "pas de double crédit");
assert.equal(op("crediterExpAdminSorealIdle", { email: "seb@example.org", montant: -5, reference: "x" }).ok, false);
assert.equal(op("crediterExpAdminSorealIdle", { email: "seb@example.org", montant: 5, reference: "" }).ok, false);
assert.equal(op("crediterExpAdminSorealIdle", { email: "inconnu@example.org", montant: 5, reference: "y" }).code, "JOUEUR_INTROUVABLE");

// 4. Une autre référence passe (autre crédit légitime)
assert.ok(op("crediterExpAdminSorealIdle", { email: "seb@example.org", montant: 10, reference: "autre" }).ok);
assert.equal(xpDe("seb@example.org").exp, 1310);

// 4b. Désigné par son prénom (sans accent ni majuscule) ; nom inconnu refusé
{
  const parNom = op("crediterExpAdminSorealIdle", { joueur: "SEBASTIEN", montant: 5, reference: "par-nom" });
  assert.ok(parNom.ok, JSON.stringify(parNom));
  assert.equal(parNom.email, "seb@example.org");
  assert.equal(xpDe("seb@example.org").exp, 1315);
  assert.equal(op("crediterExpAdminSorealIdle", { joueur: "Personne", montant: 5, reference: "z" }).code, "JOUEUR_INTROUVABLE");
  assert.equal(op("lireGainsExpAdminSorealIdle", { joueur: "Sébastien" }).lignes.length > 0, true, "journal lu par prénom");
}

// 5. Réservé à l'administrateur
{
  const autre = { email: "autre@example.org", emailConnexion: "autre@example.org", emails: ["autre@example.org"], prenom: "Autre" };
  let refuse = false;
  try {
    const x = runSorealIdleOperation(sql, "crediterExpAdminSorealIdle", ["local", { email: "seb@example.org", montant: 5, reference: "pirate" }], autre);
    refuse = x && x.ok === false;
  } catch (_e) { refuse = true; }
  assert.ok(refuse, "un joueur ordinaire ne peut pas créditer");
  assert.equal(xpDe("seb@example.org").exp, 1315);
}

// 6. Toute opération passe par __idleCommit : le journal y est écrit (colonne XP avant / après), sans jamais gêner le jeu
{
  const { readFileSync } = await import("node:fs");
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
  const commit = rt.slice(rt.indexOf("function __idleCommit(sql,workbook){"), rt.indexOf("function verifierSessionSoreal"));
  assert.ok(commit.includes("json_extract(row_json,'$[3]')") && commit.includes("enregistrerGainExpV1(sql,{email:playerKey"), "journal écrit à chaque commit d'une ligne joueur");
  assert.ok(commit.includes("catch(_e)"), "une erreur du journal n'empêche jamais l'écriture du jeu");
  assert.ok(commit.includes('indexOf("+partieb@")===-1'), "la partie d'essai n'est pas journalisée");
}

// 7. Module : variations minimes ignorées, journal borné par joueur
{
  const base = new DatabaseSync(":memory:");
  const s2 = { exec(q, ...b) { const st = base.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  assert.equal(enregistrerGainExpV1(s2, { email: "a@x.fr", operation: "t", avant: 10, apres: 10.4 }), 0, "moins de 1 EXP : ignoré");
  for (let i = 0; i < IDLE_GAINS_MAX_PAR_JOUEUR_V1 + 25; i += 1) enregistrerGainExpV1(s2, { email: "a@x.fr", operation: "op" + i, avant: i, apres: i + 5 });
  const lignes = lireGainsExpV1(s2, { email: "a@x.fr", limite: 1000 });
  assert.equal(lignes.length, IDLE_GAINS_MAX_PAR_JOUEUR_V1, "au plus 300 lignes par joueur");
  assert.equal(lignes[0].operation, "op" + (IDLE_GAINS_MAX_PAR_JOUEUR_V1 + 24), "les plus récentes d'abord");
}
console.log("idle-gains-exp-journal-v1: OK");
