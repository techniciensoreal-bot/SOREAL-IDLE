// Norman (2026-11-03) : l'APK hors ligne affichait la MÊME heure pour la partie du serveur et celle du téléphone, et demandait toujours de choisir.
// Cause : les deux côtés comparaient « Dernière synchro » (colonne 16), remise à « maintenant » par chaque export du serveur et chaque démarrage du moteur local.
// Garde : le serveur renvoie progressionAt (dernière progression REELLE reçue), qu'un export ne fait jamais avancer ; le client ne pose plus aucune question.
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1, noterActionServeurV1 } from "../src/idle-local-sync-v1.js";

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

const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
const e0 = exporterPourMoteurLocalV1(coord, T, "tel");
const ligne = JSON.parse(e0.joueurs.ligne);
const lireLigne = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", e0.joueurs.index)[0].row_json);

// 1. Un envoi accepté fixe la date de dernière progression ; elle est celle de l'appareil (plafonnée à l'heure du serveur).
await attendre(60);
const instant = Date.now() - 20 * 60000;   // le téléphone a joué il y a 20 minutes
const a = ligne.slice(); a[15] = new Date(instant).toISOString(); a[24] = 3; a[14] = 50;
let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: a, appareil: "tel", depuis: e0.serveurAt, choixAppareil: true });
assert.equal(r.ok, true); assert.equal(r.ecrit, true);

// 2. Un export n'avance JAMAIS cette date, alors que « Dernière synchro » de la ligne, elle, est remise à « maintenant » (c'était la cause du bug).
await attendre(30);
const e1 = exporterPourMoteurLocalV1(coord, T, "pc");
assert.equal(e1.progressionAt, instant, "progressionAt = dernier envoi accepté, pas l'heure de l'export");
const derniereSynchroExport = Date.parse(JSON.parse(e1.joueurs.ligne)[15]);
assert.ok(derniereSynchroExport > instant + 10 * 60000, "« Dernière synchro » exportée vaut ~maintenant : ne plus s'en servir comme date de sauvegarde");
assert.equal(exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt, instant, "relire n'avance rien");

// 3. Un envoi REFUSE (plus ancien que le serveur) ne change pas la date.
const vieux = a.slice(); vieux[15] = new Date(Date.now() - 3 * 3600000).toISOString(); vieux[24] = 0;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: vieux, appareil: "pc", depuis: e1.serveurAt });
assert.equal(r.ecrit, false);
assert.equal(exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt, instant, "un envoi refusé n'est pas une progression");

// 4. Une sauvegarde seule (partie écartée du téléphone) n'est pas une progression non plus.
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: a, appareil: "tel", sauvegardeSeule: true });
assert.equal(r.sauvegardeSeule, true);
assert.equal(exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt, instant);

// 5. Un envoi accepté plus récent avance la date ; une date annoncée dans le futur est ramenée à l'heure du serveur.
const b = a.slice(); b[15] = new Date(Date.now() + 50).toISOString(); b[14] = 51;
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: b, appareil: "pc", depuis: e1.serveurAt + 1 });
assert.equal(r.ecrit, true);
const apres = exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt;
assert.ok(apres > instant + 10 * 60000 && apres <= Date.now(), "progressionAt avance avec un envoi accepté et ne dépasse jamais l'heure du serveur");
const futur = b.slice(); futur[15] = "2035-01-01T00:00:00.000Z";
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: futur, appareil: "pc", depuis: e1.serveurAt + 2 });
assert.ok(exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt <= Date.now(), "une horloge dans le futur est bornée");
assert.ok(lireLigne().length >= 30);

// 6. Une action de jeu passée par le serveur (ancien onglet) est une progression : la date avance.
const avantAction = exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt;
await attendre(15);
assert.equal(noterActionServeurV1(coord, user, "renaitreSorealIdle"), true);
assert.ok(exporterPourMoteurLocalV1(coord, T, "pc", true).progressionAt > avantAction, "action de jeu côté serveur = progression");

// 7. Contenu du client : plus d'écran de choix, la date du serveur est progressionAt et celle du téléphone vient de son activité, jamais de « Dernière synchro ».
const client = fs.readFileSync(new URL("../public/modules/apk-synchro-v1.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const code = client.replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/function choisir\(/.test(code) && !/Prendre la partie du compte|Garder ma partie du téléphone|sorealIdleApkChoixV1/.test(code), "plus aucun écran de choix");
assert.ok(/progressionAt/.test(code) && /activiteLocale\(\)/.test(code), "dates réelles : progressionAt (serveur) et activité du moteur local (téléphone)");
assert.ok(client.indexOf("var locAt=activiteLocale()") < client.indexOf("etat.activiteLue=true"), "l'activité précédente est lue AVANT d'être réécrite");
const dico = JSON.parse(fs.readFileSync(new URL("../public/modules/traduction-anglais-dict-v1.json", import.meta.url), "utf8"));
for (const k of ["Partie la plus récente chargée (serveur)", "Partie la plus récente chargée (locale)", "☁️ Prendre la partie du serveur", "📱 Garder la partie de ce téléphone"]) assert.ok(dico[k], "traduction anglaise : " + k);
const reglages = fs.readFileSync(new URL("../public/modules/ui-reglages-v1.js", import.meta.url), "utf8");
assert.ok(/htmlForcerPartieApkIdleV1_\(\)\+/.test(reglages) && /S\.forcer\(qui\)/.test(reglages), "Réglages > Ma partie : boutons de secours pour forcer l'autre sauvegarde");

console.log("idle-apk-dates-sauvegardes-v1 : OK");
