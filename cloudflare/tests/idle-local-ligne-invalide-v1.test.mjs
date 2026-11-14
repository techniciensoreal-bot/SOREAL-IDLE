import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1 } from "../src/idle-local-sync-v1.js";

/* Audit 2026-11-14 : une ligne au « Stats JSON » illisible ou à la date illisible ne peut plus écraser la bonne partie du serveur ; une restauration sans ligne ne plante plus. */
/* Date future (audit anti-rollback, Norman, 2026-10-21) : une synchro annoncée dans le futur ne verrouille jamais la ligne du joueur : les envois honnêtes suivants restent acceptés. */
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
const lire = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", exp.joueurs.index)[0].row_json);
const avant = lire();
// 1. « Stats JSON » tronqué : refusé, la ligne du serveur ne change pas.
const casse = ligne.slice(); casse[15] = new Date(Date.now() + 2000).toISOString(); casse[37] = String(ligne[37]).slice(0, 20); casse[10] = 777;
let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: casse });
assert.equal(r.ok, false); assert.equal(r.error, "IDLE_LOCAL_LIGNE_INVALIDE");
assert.deepEqual(lire(), avant, "la ligne du serveur est intacte");
// 2. Stats JSON qui n'est pas un objet : refusé aussi.
const tableau = ligne.slice(); tableau[37] = "[1,2,3]";
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: tableau });
assert.equal(r.error, "IDLE_LOCAL_LIGNE_INVALIDE");
// 3. Date illisible : l'envoi valide est accepté avec la date du SERVEUR (plus de comparaison sautée).
const nan = ligne.slice(); nan[15] = "pas une date"; nan[10] = 555;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: nan });
assert.equal(r.ok, true); assert.ok(Number.isFinite(Date.parse(lire()[15])), "la date enregistrée est une vraie date");
// 4. Ligne énorme (plus de 1,5 Mo) ou trop de cellules : refusée.
const enorme = ligne.slice(); enorme[15] = new Date(Date.now() + 5000).toISOString(); enorme[40] = "x".repeat(1600000);
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: enorme });
assert.equal(r.error, "IDLE_LOCAL_LIGNE_INVALIDE", "ligne de plus de 1,5 Mo refusée");
const large = ligne.slice(); while (large.length <= 200) large.push("");
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: large });
assert.equal(r.error, "IDLE_LOCAL_LIGNE_INVALIDE", "plus de 200 cellules refusé");
console.log("idle-local-ligne-invalide-v1: OK");
