import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import {
  IDLE_DEV_SAVE_SLOTS_V1,
  idleDevSlotsAvailableV1,
  idleDevSlotForUserV1,
  idleDevAliasEmailV1,
  idleDevUserForSlotV1
} from "../src/idle-dev-save-slots-v1.js";

/*
 * 2026-09-24 (Norman) : « la possibilité, uniquement pendant la période de développement, de pouvoir switcher entre 2 parties.
 * 1 que je jouerai vraiment sans jamais reset et l'autre que je vais reset régulièrement pour comparer à NGU IDLE. »
 * Vérifié de bout en bout sur un vrai SQLite en mémoire : coordinateur (tickets, sessions) + moteur (lignes JOUEURS).
 */
const ADMIN = "technicien.soreal@gmail.com";
const ALIAS = "technicien.soreal+partieb@gmail.com";

// --- Fonctions pures ---
assert.equal(IDLE_DEV_SAVE_SLOTS_V1.enabled, true, "actif pendant le développement (à passer à false au lancement public)");
assert.equal(idleDevAliasEmailV1(ADMIN, "b"), ALIAS);
assert.equal(idleDevAliasEmailV1(ADMIN, "a"), ADMIN, "la partie A garde l'adresse réelle");
assert.equal(idleDevSlotsAvailableV1({ email: ADMIN }), true);
assert.equal(idleDevSlotsAvailableV1({ email: "hodappsebastien@gmail.com" }), false, "réservé à l'administrateur");
assert.equal(idleDevSlotForUserV1({ email: ADMIN, slot: "b" }), "b");
assert.equal(idleDevSlotForUserV1({ email: ADMIN, slot: "x" }), "a");
assert.equal(idleDevSlotForUserV1({ email: "hodappsebastien@gmail.com", slot: "b" }), "a", "un autre joueur ne peut pas passer en B");
{
  const b = idleDevUserForSlotV1({ email: ADMIN, emailConnexion: ADMIN, emails: [ADMIN], prenom: "Norman" }, "b");
  assert.deepEqual([b.email, b.emailConnexion, b.emails, b.prenom], [ALIAS, ALIAS, [ALIAS], "Norman (B)"]);
}

// --- Bout en bout ---
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
const coordinator = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('JOUEURS',1,?,?)", JSON.stringify(HEADERS), Date.now());

function ouvrirSession(email, prenom) {
  const user = { email, emailConnexion: email, emails: [email], prenom };
  const ticket = coordinator.createLaunchTicketV1({ source: "tv", user });
  assert.equal(ticket.ok, true);
  const session = coordinator.consumeLaunchTicketV1(ticket.ticket);
  assert.equal(session.ok, true);
  return session.sessionToken;
}
function appeler(token, operation, args = []) {
  return coordinator.runStandaloneSessionOperationV1({ sessionToken: token, operation, args: [token, ...args] });
}
function lignes() {
  return Object.fromEntries(sql.exec("SELECT player_key,display_name,state_json FROM idle_players").map(r => [r.player_key, { nom: r.display_name, etat: r.state_json }]));
}

const norman = ouvrirSession(ADMIN, "Norman");
assert.deepEqual({ ...appeler(norman, "obtenirPartieDevSorealIdle") }, { ok: true, actif: true, partie: "a" }, "par défaut : partie A");

// Partie A : la ligne historique, sous l'adresse réelle.
appeler(norman, "definirAutoBossSuivantSorealIdle", [true]);
let avant = lignes();
assert.deepEqual(Object.keys(avant), [ADMIN]);
assert.equal(avant[ADMIN].nom, "Norman");
const etatA = avant[ADMIN].etat;

// Bascule en B : une seconde ligne, la partie A n'est pas touchée.
assert.deepEqual({ ...appeler(norman, "definirPartieDevSorealIdle", ["b"]) }, { ok: true, actif: true, partie: "b" });
assert.equal(appeler(norman, "obtenirPartieDevSorealIdle").partie, "b");
appeler(norman, "definirAutoBossSuivantSorealIdle", [false]);
avant = lignes();
assert.deepEqual(Object.keys(avant).sort(), [ADMIN, ALIAS].sort(), "deux parties = deux lignes");
assert.equal(avant[ALIAS].nom, "Norman (B)");
assert.equal(avant[ADMIN].etat, etatA, "jouer en B ne modifie pas la partie A");

// Réinitialiser en B efface B seulement.
assert.equal(appeler(norman, "reinitialiserCompteCompletSorealIdle").resetComplet, true);
const apresReset = lignes();
assert.equal(apresReset[ADMIN] && apresReset[ADMIN].etat, etatA, "la partie A survit à la réinitialisation de B");
assert.ok(!apresReset[ALIAS], "la partie B est effacée");

// Retour en A : on retrouve exactement la même ligne.
appeler(norman, "definirPartieDevSorealIdle", ["a"]);
appeler(norman, "definirAutoBossSuivantSorealIdle", [true]);
assert.deepEqual(Object.keys(lignes()), [ADMIN]);

// La session est bien le support du choix : une autre session du même compte repart en A.
const autreSession = ouvrirSession(ADMIN, "Norman");
assert.equal(appeler(autreSession, "obtenirPartieDevSorealIdle").partie, "a");

// Un autre joueur autorisé n'a ni sélecteur, ni partie B.
const sebastien = ouvrirSession("hodappsebastien@gmail.com", "Sébastien");
assert.deepEqual({ ...appeler(sebastien, "obtenirPartieDevSorealIdle") }, { ok: true, actif: false, partie: "a" });
assert.throws(() => appeler(sebastien, "definirPartieDevSorealIdle", ["b"]), /PARTIES_DEV_INDISPONIBLES/);

console.log("idle-dev-save-slots: OK");
