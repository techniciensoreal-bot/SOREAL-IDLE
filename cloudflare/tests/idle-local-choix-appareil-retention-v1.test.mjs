// Norman (2026-10-30) : choix d'appareil (APK / PC). La partie REMPLACÉE est gardée 30 jours exacts, dans des types à part, sans toucher aux copies initiale / quotidienne / périodique.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { exporterPourMoteurLocalV1, recevoirDuMoteurLocalV1, listerSauvegardesLocalesV1, restaurerSauvegardeLocaleV1, sauvegarderSiBesoinLocalV1, SAUVEGARDE_CHOIX_APPAREIL_MS } from "../src/idle-local-sync-v1.js";

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
const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user }).ticket).sessionToken;
coord.runStandaloneSessionOperationV1({ sessionToken: T, operation: "obtenirEtatSorealIdle", args: [T] });
const exp = exporterPourMoteurLocalV1(coord, T, "pc");
const ligne = JSON.parse(exp.joueurs.ligne);
const lire = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", exp.joueurs.index)[0].row_json);
const liste = () => listerSauvegardesLocalesV1(coord, user.email);
await new Promise((ok) => setTimeout(ok, 60));

// le serveur détient une partie (PC)
const pc = ligne.slice(); pc[15] = new Date().toISOString(); pc[10] = 111;
assert.equal(recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: pc, appareil: "pc", depuis: exp.serveurAt }).ecrit, true);

// (b) « prendre la partie du serveur » : la partie du téléphone est envoyée comme sauvegarde SEULE
const tel = ligne.slice(); tel[15] = new Date(Date.now() - 1000).toISOString(); tel[10] = 222; tel[1] = "USURPATION";
let r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: tel, appareil: "apk-1", sauvegardeSeule: true });
assert.equal(r.ok, true); assert.equal(r.sauvegardeSeule, true);
assert.equal(lire()[10], 111, "jamais appliquée comme partie en cours");
const ecrasee = liste().find((x) => x.motif === "appareil-ecrase");
assert.ok(ecrasee && ecrasee.appareil === "apk-1" && ecrasee.at > 0, "type appareil-ecrase, avec date et appareil");
assert.equal(JSON.parse(sql.exec("SELECT row_json FROM idle_sauvegardes_locales WHERE id=?", ecrasee.id)[0].row_json)[10], 222, "la copie contient la partie du téléphone");
assert.equal(JSON.parse(sql.exec("SELECT row_json FROM idle_sauvegardes_locales WHERE id=?", ecrasee.id)[0].row_json)[1], ligne[1], "identité du serveur");
assert.equal(recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: [1, 2], appareil: "apk-1", sauvegardeSeule: true }).ok, false, "ligne incomplète refusée");
assert.equal(recevoirDuMoteurLocalV1(coord, { sessionToken: "faux", cells: tel, sauvegardeSeule: true }).ok, false, "sans session : refus");
// la sauvegarde seule ne revendique rien : le PC peut continuer d'envoyer
assert.equal(recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: Object.assign(pc.slice(), { 15: new Date(Date.now() + 5).toISOString() }), appareil: "pc", depuis: exp.serveurAt }).conflit, undefined, "pas de conflit pour le PC");

// (a) « garder la partie du téléphone » : elle remplace celle du serveur, MÊME avec une date plus ancienne ; l'ancienne est copiée avant
const refus = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: tel, appareil: "apk-1", depuis: Date.now() + 1 });
assert.equal(refus.ecrit, false, "sans choix, un état plus ancien reste refusé");
r = recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: tel, appareil: "apk-1", depuis: Date.now() + 1, choixAppareil: true });
assert.equal(r.ok, true); assert.equal(r.ecrit, true, "le choix remplace la partie du serveur");
assert.equal(lire()[10], 222);
const avant = liste().find((x) => x.motif === "avant-choix-appareil");
assert.ok(avant && avant.appareil === "apk-1", "copie « avant-choix-appareil » de la partie du serveur");
assert.equal(JSON.parse(sql.exec("SELECT row_json FROM idle_sauvegardes_locales WHERE id=?", avant.id)[0].row_json)[10] >= 111, true);

// restauration par l'administrateur : les nouveaux types sont listés et restaurables
const rr = restaurerSauvegardeLocaleV1(coord, user.email, ecrasee.id);
assert.equal(rr.ok, true); assert.equal(lire()[10], 222, "la partie écrasée de l'appareil est remise");
assert.equal(String(lire()[18]).toLowerCase(), user.email);

// rétention : 30 jours exacts, purge à l'échéance, les autres types intacts
assert.equal(SAUVEGARDE_CHOIX_APPAREIL_MS, 30 * 24 * 3600 * 1000);
const J = 24 * 3600 * 1000, t0 = Date.now();
sauvegarderSiBesoinLocalV1(coord, user.email, JSON.stringify(ligne), t0, "appareil-ecrase", "apk-1");
sauvegarderSiBesoinLocalV1(coord, user.email, JSON.stringify(ligne), t0, "avant-choix-appareil", "apk-1");
for (let i = 1; i <= 70; i += 1) sauvegarderSiBesoinLocalV1(coord, user.email, JSON.stringify(ligne), t0 + 3 * J + i * 16 * 60 * 1000);
const nb = (m) => liste().filter((x) => x.motif === m).length;
assert.ok(nb("periodique") <= 48, "les 48 périodiques sont toujours bornées");
const ids0 = liste().filter((x) => x.at === t0).map((x) => x.motif).sort();
assert.deepEqual(ids0, ["appareil-ecrase", "avant-choix-appareil"], "la limite des 48 ne les purge pas");
sauvegarderSiBesoinLocalV1(coord, user.email, JSON.stringify(ligne), t0 + 30 * J - 60000, "avant-restauration");
assert.equal(liste().filter((x) => x.at === t0).length, 2, "29 jours 23 h 59 : toujours là");
sauvegarderSiBesoinLocalV1(coord, user.email, JSON.stringify(ligne), t0 + 30 * J + 60000, "avant-restauration");
assert.equal(liste().filter((x) => x.at === t0).length, 0, "après 30 jours : purgées");
assert.ok(liste().some((x) => x.motif === "initiale"), "la copie initiale n'est jamais touchée");
console.log("idle-local-choix-appareil-retention-v1 : OK");
