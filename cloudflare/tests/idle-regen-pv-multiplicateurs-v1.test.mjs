import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-10-03, URGENT) : « Ma barre de vie ne monte jamais. Arrivée à un certain seuil, elle redescend. » La régénération de PV du serveur perdait son multiplicateur (NUMBER, bonus) :
 * la défense d'entraînement brute vit dans entrainementV41.combat (le champ de premier niveau n'existe pas), donc la régénération restait celle de la défense BRUTE alors que la défense réelle est
 * des milliards de fois plus grande ; le client (défense/20 par seconde) faisait monter la barre, puis chaque synchro remettait la petite valeur du serveur.
 */
const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
const feuille = (nom, lignes) => lignes.forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", nom, i + 1, JSON.stringify(l), Date.now()));
feuille("JOUEURS", [HEADERS]);
feuille("IDLE_BOUTIQUE", [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]);
feuille("IDLE_BOSS", [["ID", "Nom", "PV", "Attaque", "XP", "Pieces", "Histoire", "Actif"], ...Array.from({ length: 60 }, (_, i) => [i + 1, "Boss " + (i + 1), 500 * (i + 1), 2 * (i + 1), 10 * (i + 1), 1, "h", true])]);
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const run = (op) => runSorealIdleOperation(sql, op, ["local"], user);
run("obtenirEtatSorealIdle");
const l = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const arr = JSON.parse(l.row_json);
arr[14] = 40; arr[26] = 1000; arr[27] = 1e30;
const stats = JSON.parse(arr[37] || "{}");
const m = stats.metaNgu = stats.metaNgu || {};
m.rebirth = Object.assign({}, m.rebirth, { number: 1e9, lastNumber: 1e9, nextNumber: 1e9 });
if (stats.entrainementBase) for (const k of ["attaque_passive", "blocage"]) if (stats.entrainementBase.skills[k]) stats.entrainementBase.skills[k].level = 3000000;
arr[37] = JSON.stringify(stats);
db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), l.id);

run("synchroniserSorealIdle");
await new Promise((r) => setTimeout(r, 1500));
const a = run("synchroniserSorealIdle").joueur;
await new Promise((r) => setTimeout(r, 1500));
const b = run("synchroniserSorealIdle").joueur;
const gagne = b.pvJoueur - a.pvJoueur; // ~1,5 s de régénération
const parSeconde = gagne / 1.5;
const attendu = b.defense / 20;
assert.ok(a.defense > 1e15, "scénario : la défense réelle dépasse largement la défense brute (multiplicateur NUMBER)");
assert.ok(parSeconde > attendu * 0.5 && parSeconde < attendu * 2, "régénération ≈ défense / 20 par seconde (" + parSeconde.toExponential(3) + " contre " + attendu.toExponential(3) + ")");
console.log("idle-regen-pv-multiplicateurs-v1 OK");
