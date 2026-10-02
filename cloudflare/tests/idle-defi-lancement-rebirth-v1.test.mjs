import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";

/*
 * Lancement d'un défi (Norman, 2026-10-02) : « quand je lance un défi, ça devrait me faire renaître normalement ». Wiki NGU, page Challenges :
 * « Starting any challenge will perform a rebirth ». Même effets de run qu'un Rebirth : boss du run à 0, Adventure en Safe Zone sans farm
 * automatique, PV au maximum. Abandonner un défi ne rend ni le NUMBER ni le run perdus (« no penalties for quitting » = rien de plus n'est perdu).
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };


const lire = () => runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["local"], user);
lire();
const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const arr = JSON.parse(ligne.row_json);
arr[14] = 70;
const stats = JSON.parse(arr[37] || "{}");
const m = (stats.metaNgu = stats.metaNgu || {});
m.records = Object.assign({}, m.records, { highestBoss: 80, totalRebirths: 40 });
m.adventure = m.adventure || {};
m.adventure.titans = m.adventure.titans || {};
for (const t of ["t2", "t3", "t4"]) m.adventure.titans[t] = Object.assign({}, m.adventure.titans[t], { kills: 1 });
m.adventure.itemList = m.adventure.itemList || {};
for (const s of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) m.adventure.itemList["grb:" + s] = { seen: true };
m.challenge = Object.assign({}, m.challenge, { bestMs: { basic: 1000 } });
m.adventure.selectedZone = "z3";
stats.autoAventure = true;
stats.autoAventureZone = 3;
arr[37] = JSON.stringify(stats);
db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);

const avant = lire().joueur;
assert.equal(avant.systemes.adventure.selectedZone, "z3");
assert.equal((avant.autoAventure ?? avant.aventure?.auto).actif, true);

const start = runSorealIdleOperation(sql, "agirProgressionSorealIdle", ["local", { action: "challenge", mode: "start", challenge: "basic" }], user);
assert.ok(start.ok, JSON.stringify(start));
const j = start.joueur;
assert.equal(j.systemes.challenge.active, "basic");
assert.equal(j.bossVaincus, 0, "boss du run remis à 0");
assert.equal(j.systemes.adventure.selectedZone, "safe", "Adventure repart en Safe Zone");
assert.equal((j.autoAventure ?? j.aventure?.auto).actif, false, "plus de farm automatique");
assert.equal(j.pvJoueur, j.pvJoueurMax, "PV au maximum, comme après un Rebirth");

const stop = runSorealIdleOperation(sql, "agirProgressionSorealIdle", ["local", { action: "challenge", mode: "stop" }], user);
assert.ok(stop.ok);
assert.equal(stop.joueur.systemes.challenge.active, "");
assert.equal(stop.joueur.systemes.rebirth.number, 1, "le NUMBER perdu au lancement n'est pas rendu (wiki : la perte est permanente)");

console.log("idle-defi-lancement-rebirth-v1: OK");
