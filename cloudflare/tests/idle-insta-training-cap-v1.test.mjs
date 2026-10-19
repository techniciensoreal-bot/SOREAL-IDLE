import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

/*
 * Norman (2026-10-19) : « l'achat Plafond d'entraînement instantané ne fonctionne pas comme il devrait : il est supposé placer 6 points dans Attaque passive, et si on a acheté la synchro
 * du Basic Training, 6 aussi dans la première barre de la défense ». Garde : après un Rebirth, 6 points dans Attaque passive ; 6 de plus dans Blocage avec la Synchro (et pas sans).
 */
function rebirth(avecSynchro, avecAchat = true) {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
  const HEADERS_ = new Function("return " + src.match(/const HEADERS_ = (\[.*?\]);/)[1])();
  const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
  feuille("JOUEURS", [HEADERS_]);
  feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
  const op = (o, ...a) => coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: o, args: [T, ...a] });
  op("obtenirEtatSorealIdle"); op("definirPartieDevSorealIdle", "b"); op("obtenirEtatSorealIdle");
  op("preparerPartieTestSorealIdle", { boss: 100, or: 1e18, systemes: true, energie: 1000, energieCap: 100000 });
  const ligne = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=3")[0].row_json);
  const lig = ligne();
  const stats = JSON.parse(lig[37]);
  stats.metaNgu = stats.metaNgu || {};
  stats.metaNgu.runStartedAt = Date.now() - 3600000;
  stats.metaNgu.selloutShop = { purchases: avecAchat ? { instaTrainingCap: 1 } : {} };
  stats.metaNgu.bonuses = stats.metaNgu.bonuses || {};
  stats.metaNgu.bonuses.expShop = avecSynchro ? { syncBasicTraining: 1 } : {};
  lig[37] = JSON.stringify(stats);
  sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=3", JSON.stringify(lig));
  const r = op("renaitreSorealIdle");
  assert.equal(r.ok, true, "le Rebirth doit réussir : " + (r.message || r.error));
  const sk = JSON.parse(ligne()[37]).entrainementBase.skills;
  return { attaque: sk.attaque_passive.allocation, blocage: sk.blocage.allocation };
}

assert.deepEqual(rebirth(false), { attaque: 6, blocage: 0 }, "achat seul : 6 dans Attaque passive");
assert.deepEqual(rebirth(true), { attaque: 6, blocage: 6 }, "avec la Synchro : 6 aussi dans Blocage (première barre de la défense)");
assert.deepEqual(rebirth(true, false), { attaque: 0, blocage: 0 }, "sans l'achat : rien n'est placé");
console.log("idle-insta-training-cap-v1: OK");
