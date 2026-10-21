import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";
import { recevoirDuMoteurLocalV1 } from "../src/idle-local-sync-v1.js";

/*
 * Norman (2026-10-21) : « supprime le record de Sylvain, il est forcément faux ». L'administrateur retire un record « combat le plus long » ; comme le jeu tourne dans la page du joueur (sa ligne est réécrite à chaque envoi),
 * la valeur retirée est aussi remise à zéro dans les envois qui la portent encore, jamais un record différent obtenu ensuite.
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coord = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email"];
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS), Date.now());
[["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
sql.exec("INSERT INTO idle_meta(meta_key,meta_value) VALUES('acces_public','1')");
const admin = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const sylvain = { email: "sylvain@example.org", emailConnexion: "sylvain@example.org", emails: ["sylvain@example.org"], prenom: "Sylvain", role: "externe", externe: true };
const opAdmin = (nom, ...args) => runSorealIdleOperation(sql, nom, ["local", ...args], admin);
opAdmin("obtenirEtatSorealIdle", "local");
runSorealIdleOperation(sql, "obtenirEtatSorealIdle", ["local"], sylvain);
const index = (email) => sql.exec("SELECT row_index FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1 AND row_json LIKE ?", "%" + email + "%")[0].row_index;
const iSyl = index("sylvain@example.org");
const ligneSyl = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", iSyl)[0].row_json);
const statsSyl = () => JSON.parse(ligneSyl()[37]);
const poser = (sec) => { const l = ligneSyl(); const st = JSON.parse(l[37] || "{}"); st.combatBossPlusLongSec = sec; st.combatBossPlusLongGagne = sec ? true : null; l[37] = JSON.stringify(st); sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(l), iSyl); };
poser(108.4);
assert.equal(statsSyl().combatBossPlusLongSec, 108.4);

// 1. Le retrait remet le record du joueur désigné à zéro.
let r = opAdmin("retirerRecordCombatLongAdminSorealIdle", { joueur: "SYLVAIN" });
assert.ok(r.ok, JSON.stringify(r));
assert.equal(r.avant, 108.4);
assert.equal(statsSyl().combatBossPlusLongSec, 0, "record remis à zéro");
assert.equal(statsSyl().combatBossPlusLongGagne, null);
// 2. Sans record : refus propre ; joueur inconnu : refus.
assert.equal(opAdmin("retirerRecordCombatLongAdminSorealIdle", { joueur: "Sylvain" }).code, "AUCUN_RECORD");
assert.equal(opAdmin("retirerRecordCombatLongAdminSorealIdle", { joueur: "Personne" }).code, "JOUEUR_INTROUVABLE");
// 3. Réservé à l'administrateur.
assert.throws(() => runSorealIdleOperation(sql, "retirerRecordCombatLongAdminSorealIdle", ["local", { joueur: "Sylvain" }], sylvain));

// 4. L'appareil du joueur renvoie encore l'ancien record (sa ligne locale n'a pas changé) : le serveur le remet à zéro (essai sur le compte de l'administrateur, qui a une session).
const iAdm = index("technicien.soreal@gmail.com");
const ligneAdm = () => JSON.parse(sql.exec("SELECT row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index=?", iAdm)[0].row_json);
const statsAdm = () => JSON.parse(ligneAdm()[37]);
{ const l = ligneAdm(); const st = JSON.parse(l[37] || "{}"); st.combatBossPlusLongSec = 77.7; st.combatBossPlusLongGagne = false; l[37] = JSON.stringify(st); sql.exec("UPDATE idle_catalog SET row_json=? WHERE sheet_name='JOUEURS' AND row_index=?", JSON.stringify(l), iAdm); }
assert.ok(opAdmin("retirerRecordCombatLongAdminSorealIdle", { joueur: "technicien.soreal@gmail.com" }).ok);
assert.equal(statsAdm().combatBossPlusLongSec, 0);
const T = coord.consumeLaunchTicketV1(coord.createLaunchTicketV1({ source: "tv", user: admin }).ticket).sessionToken;
let n = 0;
const envoi = (sec) => { const l = ligneAdm(); const st = JSON.parse(l[37]); st.combatBossPlusLongSec = sec; st.combatBossPlusLongGagne = sec ? true : null; l[37] = JSON.stringify(st); n += 1000; l[15] = new Date(Date.now() + n).toISOString(); return recevoirDuMoteurLocalV1(coord, { sessionToken: T, cells: l }); };
let e = envoi(77.7);
assert.equal(e.ok, true); assert.equal(e.ecrit, true);
assert.equal(statsAdm().combatBossPlusLongSec, 0, "l'ancien record renvoyé par l'appareil est remis à zéro");
// 5. Un autre record, obtenu ensuite, n'est jamais touché.
e = envoi(130.2);
assert.equal(statsAdm().combatBossPlusLongSec, 130.2, "un nouveau record différent est conservé");
console.log("idle-record-combat-retire-v1: OK");
