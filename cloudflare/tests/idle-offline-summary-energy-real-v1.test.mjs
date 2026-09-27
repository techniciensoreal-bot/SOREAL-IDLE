import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Norman (2026-09-27) : « Je n'ai pas le popup en relançant le jeu comme indiqué dans la 5.0 ».
 *
 * Cause trouvée dans appliquerProgressionEnergieSorealIdle_ (idle-sqlite-runtime.js) : depuis la V55
 * (l'énergie n'avance plus qu'une fois, via syncIdleNguState), `energieTheoriqueProduite` était resté
 * figé à 0 (mort depuis la migration) ET `gainNetEnergie` se soustrayait de LUI-MÊME (`nouvelleEnergie`
 * et `energie` venaient tous deux de l'état déjà synchronisé, jamais de l'état d'AVANT) : toujours 0,
 * quelle que soit la production réelle pendant l'absence. Avec Fight Boss coupé au relancement
 * (stopBossOnOpen) et donc xp/bossBattus/dégâts eux aussi à 0 hors Aventure AUTO, plus rien ne pouvait
 * jamais rendre le popup non-vide pour une simple absence sans Aventure AUTO active.
 *
 * Ce test simule une vraie absence (avance metaNgu.updatedAt dans le passé, comme le ferait le temps
 * qui passe réellement) et vérifie que l'énergie produite pendant l'absence est bien remontée au client,
 * jamais 0 en dur.
 */

const db = new DatabaseSync(":memory:");
const sql = {
  exec(query, ...bindings) {
    const statement = db.prepare(query);
    if (/^\s*(select|pragma|with)/i.test(query)) return statement.all(...bindings);
    statement.run(...bindings);
    return [];
  }
};
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");

const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const STATS_JSON_COL = HEADERS.indexOf("Stats JSON") + 1;
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);

const norman = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const op = (nom, user, ...args) => runSorealIdleOperation(sql, nom, ["x", ...args], user);

// Premier lancement : crée le personnage, initialise metaNgu.
const j1 = op("obtenirEtatSorealIdle", norman).joueur;
assert.equal(j1.progressionHorsLigne.energieProduite, 0, "aucune absence encore : rien à raconter");

// Simule une vraie absence de 100 secondes (recule l'horloge interne du moteur NGU, comme le ferait le temps qui passe).
const rows = sql.exec("SELECT row_index, row_json FROM idle_catalog WHERE sheet_name='JOUEURS' ORDER BY row_index");
const dernierIndex = rows[rows.length - 1].row_index;
const row = JSON.parse(rows[rows.length - 1].row_json);
const stats = JSON.parse(row[STATS_JSON_COL - 1]);
const energieAvant = stats.metaNgu.resources.energy.current;
stats.metaNgu.updatedAt -= 100000;
row[STATS_JSON_COL - 1] = JSON.stringify(stats);
sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(row), dernierIndex);

const j2 = op("obtenirEtatSorealIdle", norman).joueur;
const energieApres = j2.energie;
const produitReel = energieApres - energieAvant;

assert.ok(produitReel > 0, "l'énergie doit avoir réellement augmenté pendant l'absence simulée");
assert.equal(j2.progressionHorsLigne.energieProduite, produitReel, "energieProduite doit refléter la vraie production, jamais 0 en dur");
assert.equal(j2.progressionHorsLigne.gainNetEnergie, produitReel, "gainNetEnergie ne doit jamais se soustraire de lui-même (toujours 0)");
assert.ok(j2.progressionHorsLigne.energieProduite > 0, "le popup de résumé (afficherResumeHorsLigneIdleV64_) doit désormais avoir quelque chose à montrer");

console.log("idle-offline-summary-energy-real-v1: OK");
