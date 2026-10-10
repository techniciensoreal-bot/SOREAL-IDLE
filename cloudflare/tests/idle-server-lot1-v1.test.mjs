import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";
import { runSorealIdleOperation } from "../src/idle-sqlite-runtime.js";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/* Lot 1 serveur (audit 2026-10) : plafond de clics, index, noms d'opération hérités, idempotence clientMutationId. */
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
// Idempotence du constructeur (redémarrage du Durable Object) + index
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
const index = sql.exec("SELECT name FROM sqlite_master WHERE type='index'").map((r) => r.name);
assert.ok(index.includes("idx_idle_players_source_row"), "index sur idle_players.source_row");
assert.ok(!index.includes("idx_idle_catalog_sheet"), "index redondant avec la clé primaire supprimé");

for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = ["ID","Nom","Niveau","XP","Énergie","Énergie max","Prod/s","Force","Endurance","Organisation","Puissance","Boss actuel","PV boss","PV boss max","Boss vaincus","Dernière synchro","Public","Rang","Email principal","Email connexion","Pièces","Inventaire JSON","Équipement JSON","Améliorations JSON","Renaissances","Essence renaissance","PV joueur","PV joueur max","KO jusqu'à","Zone aventure","Progression aventure JSON","Points aventure","Dernière action aventure","Matériaux","Collection JSON","Date début","Capacité inventaire","Stats JSON"];
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEADERS), Date.now());
[["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]]
  .forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const op = (nom, ...args) => runSorealIdleOperation(sql, nom, ["x", ...args], user);

// 1) Clics plafonnés
assert.equal(op("enregistrerClicsSorealIdle", 3).clicsTotal, 3);
assert.equal(op("enregistrerClicsSorealIdle", 1e12).clicsTotal, 23, "un énorme delta est plafonné juste après un appel (20 max, audit 2026-10-10 SEC-005 ; le premier enregistrement garde son minimum de 200)");
assert.equal(op("enregistrerClicsSorealIdle", Infinity).clicsTotal, 203, "Infinity ignoré, jamais Infinity/NaN");
assert.equal(op("enregistrerClicsSorealIdle", NaN).clicsTotal, 203);
assert.equal(op("enregistrerClicsSorealIdle", -50).clicsTotal, 203);

// 3a) Noms hérités du prototype refusés
for (const nom of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
  assert.throws(() => runSorealIdleOperation(sql, nom, ["x"], user), /SOREAL_IDLE_OPERATION_INCONNUE/, nom);
}

// 3c) Une action de progression qui échoue (ok:false) ne committe aucune écriture partielle
{
  op("obtenirEtatSorealIdle");
  const photo = () => JSON.stringify(sql.exec("SELECT sheet_name,row_index,row_json FROM idle_catalog ORDER BY sheet_name,row_index"));
  const avant = photo();
  await new Promise((r) => setTimeout(r, 30));
  const echec = op("agirProgressionSorealIdle", { action: "actionInexistante" });
  assert.equal(echec.ok, false);
  assert.equal(echec.code, "ERREUR_META_PROGRESSION", "contrat de réponse inchangé");
  assert.equal(photo(), avant, "aucune écriture committée par l'opération en échec");
}

// 4) clientMutationId générique sur applyIdleNguAction
const context = { bosses: 37 };
const frais = () => {
  const s = normalizeIdleNguState(null, context, 1_000_000);
  s.currencies.experience = 1000;
  return s;
};
let state = frais();
const achat = { action: "buyResource", resource: "energy", stat: "speed", clientMutationId: "achat-1" };
const r1 = applyIdleNguAction(state, achat, context, 1_000_000);
assert.equal(r1.state.currencies.experience, 998);
assert.equal(r1.duplicate, undefined);
const r2 = applyIdleNguAction(r1.state, achat, context, 1_000_000);
assert.equal(r2.duplicate, true, "même identifiant : rejeu détecté");
assert.equal(r2.state.currencies.experience, 998, "pas de second achat");
assert.deepEqual(r2.result, r1.result, "résultat mémorisé renvoyé");
const r3 = applyIdleNguAction(r2.state, { ...achat, clientMutationId: "achat-2" }, context, 1_000_000);
assert.equal(r3.state.currencies.experience, 996, "autre identifiant : exécuté");
// Sans identifiant : comportement inchangé (deux achats = deux débits)
let s4 = applyIdleNguAction(frais(), { action: "buyResource", resource: "energy", stat: "speed" }, context, 1_000_000).state;
s4 = applyIdleNguAction(s4, { action: "buyResource", resource: "energy", stat: "speed" }, context, 1_000_000).state;
assert.equal(s4.currencies.experience, 996);
assert.deepEqual(s4.recentClientMutations, []);
// Borné à 64, identifiants trop longs tronqués à 160
let s5 = frais();
s5.currencies.experience = 1e6;
for (let i = 0; i < 70; i += 1) s5 = applyIdleNguAction(s5, { action: "buyResource", resource: "energy", stat: "speed", clientMutationId: "m" + i }, context, 1_000_000).state;
assert.equal(s5.recentClientMutations.length, 64);
assert.equal(s5.recentClientMutations[0].id, "m6");
assert.equal(normalizeIdleNguState(JSON.parse(JSON.stringify(s5)), context, 1_000_000).recentClientMutations.length, 64, "survit à la normalisation");

console.log("idle-server-lot1-v1: OK");
