import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Anti-spoil (AGENTS.md règle n°2 ; relevé le 2026-10-02) : le catalogue des boss envoyé au client ne contient que les boss déjà découverts
 * (jusqu'au boss actuel et au record permanent), jamais les 300 : ni noms, ni statistiques, ni histoires de boss à venir, ni total révélé par la taille de la liste.
 */
const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS), Date.now());
[["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
/* Catalogue de 30 boss (le vrai en compte 300) : assez pour vérifier que la liste envoyée n'est jamais le catalogue complet. */
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOSS", 1, JSON.stringify(["ID", "Nom", "PV", "Attaque", "XP", "Pieces", "Histoire", "Actif"]), Date.now());
for (let i = 1; i <= 30; i += 1) sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOSS", i + 1, JSON.stringify([i, "Boss secret " + i, 500 * i, 2 * i, 10 * i, 1, "Histoire secrète " + i, true]), Date.now());
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const etat = () => runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["local"], user).joueur;

// Joueur neuf : seulement le premier boss, jamais le catalogue complet.
{
  const j = etat();
  assert.equal(j.bossCatalogue.length, 1, "un joueur neuf ne reçoit que le boss actuel");
  assert.equal(j.bossCatalogue[0].numero, 1);
  assert.ok(!JSON.stringify(j.bossCatalogue).includes('"numero":2,'), "aucun boss à venir");
  /* Seule exception connue : `bossSuivant` (le boss d'APRÈS l'actuel, précalculé pour l'afficher sans attendre le serveur après une victoire ; jamais montré avant). */
  const sans = JSON.stringify(Object.assign({}, j, { bossSuivant: null }));
  assert.ok(!sans.includes("Boss secret 2") && !sans.includes("Histoire secrète 2") && !sans.includes("Boss secret 30") && !sans.includes("Histoire secrète 30"), "ni nom ni histoire d'un boss non découvert dans le reste de la réponse");
}

// Joueur plus avancé : jusqu'au boss actuel (vaincus + 1), pas un de plus.
{
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 6;
  sql.exec("update idle_catalog set row_json=? where rowid=?", JSON.stringify(arr), ligne.id);
  const j = etat();
  assert.equal(j.bossCatalogue.length, Math.max(j.bossVaincus + 1, j.bossSelection), "boss découverts + le boss actuel");
  assert.ok(j.bossCatalogue.length < 20, "la taille de la liste ne révèle pas le total");
  assert.deepEqual(j.bossCatalogue.map((b) => b.numero), j.bossCatalogue.map((_, i) => i + 1), "numéros contigus depuis 1 (le client retrouve les boss par numéro)");
  assert.ok(j.bossCatalogue.some((b) => b.numero === j.bossId), "le boss actuel est présent");
}
console.log("idle-anti-spoil-boss-catalogue-v1: OK");
