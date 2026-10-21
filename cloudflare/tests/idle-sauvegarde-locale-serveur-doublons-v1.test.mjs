import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1 } from "../src/idle-local-sync-v1.js";

/* Renvoi après une réponse perdue (audit anti-rollback, Norman, 2026-10-21) : le serveur n'enregistre pas deux fois les mêmes événements, et accepte toujours les événements même quand la ligne est refusée. */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return ")) ();
HEADERS_.splice(0, 0); // en-têtes tels que le serveur de test les pose
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS_]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);

const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const autre = { email: "autre@example.com", emailConnexion: "autre@example.com", emails: ["autre@example.com"], prenom: "Autre" };
const jeton = (u) => coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user: u }).ticket).sessionToken;
const T = jeton(user);
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });

// Export : la ligne du joueur + les catalogues, jamais la ligne d'un autre joueur.
const exp = exporterPourMoteurLocalV1(coord, T);
assert.equal(exp.ok, true);
const ligne = JSON.parse(exp.joueurs.ligne);
const a = ligne.slice(); a[15] = "2030-01-01T00:00:10.000Z";
const lot = { sessionToken: T, cells: a, flux: [{ at: 11, type: "boss", donnees: "{\"n\":1}" }, { at: 12, type: "boss", donnees: "{\"n\":2}" }], gains: [{ at: 13, operation: "test", avant: 1, apres: 2 }] };
let r = recevoirDuMoteurLocalV1(coord, lot);
assert.equal(r.flux, 2); assert.equal(r.gains, 1);
r = recevoirDuMoteurLocalV1(coord, lot);   // même lot renvoyé (réponse perdue)
assert.equal(r.flux, 0, "aucun doublon d'événement de flux");
assert.equal(r.gains, 0, "aucun doublon de gain d'EXP");
assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_flux")[0].n, 2);
assert.equal(sql.exec("SELECT COUNT(*) AS n FROM idle_gains_exp")[0].n, 1);
// Lot avec un nouvel événement : seul celui-là est ajouté.
r = recevoirDuMoteurLocalV1(coord, Object.assign({}, lot, { flux: lot.flux.concat([{ at: 14, type: "boss", donnees: "{\"n\":3}" }]) }));
assert.equal(r.flux, 1);
// Ligne refusée (état plus ancien) : les événements du lot sont tout de même enregistrés.
const vieux = a.slice(); vieux[15] = "2029-01-01T00:00:00.000Z";
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: vieux, flux: [{ at: 20, type: "boss", donnees: "{}" }], gains: [] });
assert.equal(r.ecrit, false); assert.equal(r.flux, 1, "événements acceptés même si la ligne est refusée");
console.log("idle-sauvegarde-locale-serveur-doublons-v1: OK");
