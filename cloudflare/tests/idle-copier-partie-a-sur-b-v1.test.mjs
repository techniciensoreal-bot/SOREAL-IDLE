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
const refuse = (fn) => { try { const x = fn(); return !(x && x.ok === true); } catch (e) { return true; } };
const lignes = () => sql.exec("SELECT row_index,row_json FROM idle_catalog WHERE sheet_name='JOUEURS' AND row_index>1 ORDER BY row_index").map((r) => ({ i: r.row_index, v: JSON.parse(r.row_json) }));
const COL = { ID: 0, NOM: 1, PUBLIC: 16, RANG: 17, EMAIL: 18, EMAIL_CONNEXION: 19, STATS: 37 };

// Partie A : l'état existe ; partie B préparée avec des valeurs différentes.
appeler(norman, "obtenirEtatSorealIdle");
assert.ok(refuse(() => appeler(norman, "copierPartieASurBSorealIdle")), "partie A : la copie est refusée");
assert.ok(refuse(() => appeler(autre, "copierPartieASurBSorealIdle")), "autre joueur : refusé");
assert.equal(appeler(norman, "definirPartieDevSorealIdle", ["b"]).partie, "b");
appeler(norman, "obtenirEtatSorealIdle");
assert.equal(appeler(norman, "preparerPartieTestSorealIdle", [{ boss: 100, or: 5e9 }]).ok, true);

const avant = lignes();
const ligneA = avant.find((l) => String(l.v[COL.EMAIL]).toLowerCase() === ADMIN);
const ligneB = avant.find((l) => String(l.v[COL.EMAIL]).toLowerCase().includes("+partieb@"));
assert.ok(ligneA && ligneB && ligneA.i !== ligneB.i, "deux lignes distinctes : A et B");
assert.notEqual(JSON.stringify(ligneA.v.slice(COL.STATS)), JSON.stringify(ligneB.v.slice(COL.STATS)), "avant la copie, B diffère de A (préparée)");

const r = appeler(norman, "copierPartieASurBSorealIdle");
assert.equal(r.ok, true, JSON.stringify(r).slice(0, 300));
const apres = lignes();
const a2 = apres.find((l) => l.i === ligneA.i);
const b2 = apres.find((l) => l.i === ligneB.i);
assert.deepEqual(a2.v, ligneA.v, "la partie A n'est pas modifiée du tout");
for (let c = 0; c < a2.v.length; c++) {
  if ([COL.ID, COL.NOM, COL.PUBLIC, COL.RANG, COL.EMAIL, COL.EMAIL_CONNEXION].includes(c)) assert.deepEqual(b2.v[c], ligneB.v[c], "identité de B conservée, colonne " + c);
  else assert.deepEqual(b2.v[c], a2.v[c], "colonne " + c + " copiée depuis A");
}
assert.ok(String(b2.v[COL.EMAIL]).toLowerCase().includes("+partieb@"), "B garde son adresse alias (exclue du classement)");
// Client : un bouton dans Paramètres, visible seulement en partie B.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("window.__copierPartieADevIdleV1__=copierPartieADevIdleV1_") && ui.includes(".copierPartieASurBSorealIdle(SOREAL_SESSION)"), "bouton relié à l'opération");
assert.ok(ui.includes("(p.partie==='b'?'<div style=\"margin-top:10px\"><button") && ui.includes("Copier la partie A ici"), "bouton affiché seulement en partie B");
const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8"));
assert.ok(contrat.operations.includes("copierPartieASurBSorealIdle"), "opération déclarée au contrat");
console.log("idle-copier-partie-a-sur-b-v1: OK");
