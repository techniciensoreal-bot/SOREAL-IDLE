import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1 } from "../src/idle-local-sync-v1.js";

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
const maintenant = Date.now();
// 1. Envoi annoncé en 2031 : accepté (alerte notée) mais la date enregistrée est ramenée à l'heure du serveur.
const futur = ligne.slice(); futur[15] = "2031-01-01T00:00:00.000Z"; futur[10] = 111;
let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: futur });
assert.equal(r.ecrit, true); assert.equal(r.alertes, 1);
assert.ok(Date.parse(lire()[15]) <= Date.now() + 1000, "la date enregistrée n'est pas dans le futur");
assert.equal(lire()[10], 111, "la progression est bien enregistrée");
// 2. Un envoi honnête juste après est accepté (avant : refusé pour toujours, la partie ne se sauvegardait plus).
const honnete = ligne.slice(); honnete[15] = new Date(Date.now() + 2000).toISOString(); honnete[10] = 222;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: honnete });
assert.equal(r.ecrit, true, "envoi honnête accepté après une date future");
assert.equal(lire()[10], 222);
// 3. Ligne DÉJÀ empoisonnée dans la base (date future écrite par une ancienne version) : un envoi honnête est accepté.
const poison = lire(); poison[15] = "2031-06-01T00:00:00.000Z";
sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(poison), exp.joueurs.index);
const apres = ligne.slice(); apres[15] = new Date(Date.now() + 4000).toISOString(); apres[10] = 333;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: apres });
assert.equal(r.ecrit, true, "ligne déjà empoisonnée : l'envoi honnête est accepté");
assert.equal(lire()[10], 333);
// 4. Un état vraiment plus ancien reste refusé.
const vieux = ligne.slice(); vieux[15] = new Date(Date.now() - 3600000).toISOString(); vieux[10] = 1;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: vieux });
assert.equal(r.ecrit, false, "un état plus ancien n'écrase toujours pas un plus récent"); assert.equal(lire()[10], 333);
console.log("idle-sauvegarde-locale-date-future-v1: OK");
