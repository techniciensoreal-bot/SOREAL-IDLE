import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Norman (2026-10-05) : « je viens de dépenser 2 points dans le Plafond d'Énergie : mon total est toujours à 500000, l'énergie se génère de manière étrange, toutes les X secondes ; l'infobulle de la barre dit 530000 ».
 * Le maximum d'énergie envoyé au client doit être le plafond EFFECTIF du moteur dès la réponse de l'achat, jamais la colonne enregistrée (réécrite seulement à la synchro suivante).
 */
const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEAD), Date.now());
[["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
run("obtenirEtatSorealIdle");
const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const arr = JSON.parse(ligne.row_json);
arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
const st = JSON.parse(arr[37] || "{}");
st.metaNgu.systems.perks.unlocked = true;
st.metaNgu.currencies.pp = 1000;
st.metaNgu.resources.energy.cap = 500000;
st.metaNgu.resources.energy.capNaturel = 500000;
st.metaNgu.resources.energy.current = 500000;
arr[37] = JSON.stringify(st);
db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
let r = run("synchroniserSorealIdle");
assert.equal(r.joueur.energieMax, 500000);
r = run("agirProgressionSorealIdle", { action: "buyPerk", perkId: 8 });
assert.equal(r.ok, true);
assert.equal(r.joueur.energieMax, 505000, "+1 % de Plafond d'Énergie : le maximum affiché suit tout de suite (réponse de l'achat)");
assert.equal(r.joueur.systemes.resourceInfo.energy.capRun, 505000, "l'infobulle et le maximum disent la même chose");
r = run("agirProgressionSorealIdle", { action: "buyPerk", perkId: 8 });
assert.equal(r.joueur.energieMax, 510000);
r = run("synchroniserSorealIdle");
assert.equal(r.joueur.energieMax, 510000, "et après la synchro suivante");
console.log("idle-energie-max-apres-achat-v1: OK");
