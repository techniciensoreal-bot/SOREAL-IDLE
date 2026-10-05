import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

/*
 * Norman (2026-10-05) : « modifie la partie B comme tu veux, je ne l'utilise pas, elle est faite pour faire des tests ». preparerPartieTestSorealIdle fixe des valeurs de départ bornées, mais
 * UNIQUEMENT pour l'administrateur et UNIQUEMENT dans la partie B : jamais la vraie partie (A), jamais un autre joueur.
 */
const ADMIN = "technicien.soreal@gmail.com";
const AUTRE = "hodappsebastien@gmail.com";
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
const HEADERS = readFileSync("cloudflare/tests/idle-dev-save-slots.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('JOUEURS',1,?,?)", JSON.stringify(HEAD), Date.now());
[["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));

function ouvrirSession(email, prenom) {
  const user = { email, emailConnexion: email, emails: [email], prenom };
  const ticket = coordinator.createLaunchTicketV1({ source: "tv", user });
  const session = coordinator.consumeLaunchTicketV1(ticket.ticket);
  assert.equal(session.ok, true);
  return session.sessionToken;
}
function appeler(token, operation, args = []) {
  return coordinator.runStandaloneSessionOperationV1({ sessionToken: token, operation, args: [token, ...args] });
}
const etats = () => Object.fromEntries(sql.exec("SELECT player_key,state_json FROM idle_players").map((r) => [r.player_key, r.state_json]));

const norman = ouvrirSession(ADMIN, "Norman");
const autre = ouvrirSession(AUTRE, "Sébastien");
appeler(norman, "obtenirEtatSorealIdle");
const avantA = etats()[ADMIN];

// 1. Partie A : refusé, rien ne bouge.
const refuse = (fn) => { try { const x = fn(); return !(x && x.ok === true); } catch (e) { return true; } };
assert.ok(refuse(() => appeler(norman, "preparerPartieTestSorealIdle", [{ boss: 100, or: 1e9 }])), "partie A : refusé");
let r;
assert.equal(etats()[ADMIN], avantA, "la partie A n'est pas touchée");

// 2. Un autre joueur : refusé.
assert.ok(refuse(() => appeler(autre, "preparerPartieTestSorealIdle", [{ boss: 100, or: 1e9 }])), "autre joueur : refusé");

// 3. Partie B : les valeurs demandées sont appliquées (bornées), la partie A reste intacte.
assert.equal(appeler(norman, "definirPartieDevSorealIdle", ["b"]).partie, "b");
appeler(norman, "obtenirEtatSorealIdle"); // le jeu charge l'état de la partie B en y arrivant
r = appeler(norman, "preparerPartieTestSorealIdle", [{ boss: 100, or: 5e9, energieCap: 20000, energiePuissance: 30, energie: 20000 }]);
assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
assert.deepEqual(r.applique, { boss: 100, or: 5e9, energieCap: 20000, energiePuissance: 30, energie: 20000 });
assert.equal(r.joueur.bossVaincus, 100);
assert.ok(r.joueur.systemes.currencies.gold >= 5e9 && r.joueur.systemes.currencies.gold < 5e9 + 1000, "or fixé (à quelques unités de revenu près)");
assert.equal(r.joueur.energieMax, 20000);
assert.equal(etats()[ADMIN], avantA, "la partie A n'a pas changé");

// 4. Bornes : valeurs absurdes ramenées dans la plage.
r = appeler(norman, "preparerPartieTestSorealIdle", [{ boss: 9999, or: -5, energieCap: 1e99 }]);
assert.equal(r.ok, true);
assert.equal(r.applique.boss, 140);
assert.equal(r.applique.or, 0);
assert.equal(r.applique.energieCap, 1e12);

// 5. Contrat : l'opération existe côté serveur.
assert.ok(JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")).operations.includes("preparerPartieTestSorealIdle"));
console.log("idle-partie-test-b-v1: OK");
