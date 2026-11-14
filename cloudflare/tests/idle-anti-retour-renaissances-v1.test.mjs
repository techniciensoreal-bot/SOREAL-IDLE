// Sébastien (2026-11-12) : sa partie est revenue de 228 à 225 renaissances ; une vieille copie de l'appareil (7 novembre) a écrasé celle du serveur, acceptée parce que sa date était plus récente.
// Garde : (1) le serveur refuse (« partie reprise ailleurs ») un envoi normal qui compte MOINS de renaissances que sa ligne, et le garde 30 jours (« appareil-ecrase ») ; un choix d'appareil ou
// un import par fichier, voulus par le joueur, restent permis ; (2) au démarrage, la page n'adopte jamais une copie qui compte moins de renaissances que le serveur, quelle que soit sa date.
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1, listerSauvegardesLocalesV1 } from "../src/idle-local-sync-v1.js";

const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const src = fs.readFileSync(new URL("../tools/local-dev-server.mjs", import.meta.url), "utf8");
const HEADERS_ = new Function(src.match(/const HEADERS_ = (\[.*?\]);/)[1].replace(/^/, "return "))();
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS_]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const jeton = (u) => coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user: u }).ticket).sessionToken;
const T = jeton(user);
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });

const e0 = exporterPourMoteurLocalV1(coord, T, "tel");
const ligne = JSON.parse(e0.joueurs.ligne);
const lireLigne = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", e0.joueurs.index)[0].row_json);
const maintenant = () => new Date(Date.now() + 5000).toISOString();

// Le serveur détient 228 renaissances.
const bonne = ligne.slice(); bonne[15] = maintenant(); bonne[24] = 228; bonne[14] = 116;
let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: bonne, appareil: "tel", depuis: e0.serveurAt, choixAppareil: true });
assert.equal(r.ok, true); assert.equal(r.ecrit, true);

// 1. Vieille partie (225) dont la date est PLUS RÉCENTE : refusée, la ligne du serveur ne bouge pas.
const vieille = ligne.slice(); vieille[15] = new Date(Date.now() + 60000).toISOString(); vieille[24] = 225; vieille[14] = 106;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: vieille, appareil: "tel", depuis: e0.serveurAt });
assert.equal(r.ok, false); assert.equal(r.conflit, true); assert.equal(r.error, "IDLE_PARTIE_REPRISE_AILLEURS");
assert.equal(Number(lireLigne()[24]), 228, "la partie du serveur n'est pas écrasée");
assert.equal(Number(lireLigne()[14]), 116);
const sauv = listerSauvegardesLocalesV1(coord, "technicien.soreal@gmail.com").filter((s) => s.motif === "appareil-ecrase");
assert.ok(sauv.length >= 1 && sauv[0].renaissances === 225, "la partie refusée est gardée 30 jours, rien n'est perdu");

// 2. Un envoi normal qui progresse (229) est accepté.
const suite = bonne.slice(); suite[15] = new Date(Date.now() + 90000).toISOString(); suite[24] = 229;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: suite, appareil: "tel", depuis: e0.serveurAt });
assert.equal(r.ok, true); assert.equal(r.ecrit, true); assert.equal(Number(lireLigne()[24]), 229);

// 3. Un choix d'appareil (voulu par le joueur) peut remplacer par une partie à moins de renaissances.
const choisie = ligne.slice(); choisie[15] = new Date(Date.now() + 120000).toISOString(); choisie[24] = 200;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: choisie, appareil: "tel", depuis: e0.serveurAt, choixAppareil: true });
assert.equal(r.ok, true); assert.equal(r.ecrit, true); assert.equal(Number(lireLigne()[24]), 200);

// 4. Au démarrage, la page n'adopte jamais une copie qui a moins de renaissances que le serveur.
const page = fs.readFileSync(new URL("../public/modules/moteur-local-v1.js", import.meta.url), "utf8");
assert.ok(/const copieEnRetard=statsIllisible\|\|Number\(rec\.cells\[24\]\)<Number\(srv\[24\]\);\s*if\(!copieEnRetard&&enMs\(rec\.cells\[15\]\)>refServeurMs\)\{/.test(page), "la reprise écarte une copie en retard sur les renaissances");

console.log("idle-anti-retour-renaissances-v1 : OK");
