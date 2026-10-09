/*
 * Norman (2026-10-09) : « Sébastien et Saka (Sébastien) sont le même compte : il ne faut afficher que Saka (Sébastien) ». Un même joueur arrive avec des adresses différentes selon le lanceur ;
 * la présence et le fil « En direct » doivent le compter UNE fois (clé = adresse principale de sa ligne de jeu).
 */
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
const REPO = pathToFileURL(process.cwd()).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const imp = (p) => import(pathToFileURL(process.cwd() + "/cloudflare/" + p).href);
const { SorealIdleCoordinatorV1 } = await imp("src/index-idle-coordinator-v1.js");
const ADMIN = "technicien.soreal@gmail.com";
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
const coordinator = new SorealIdleCoordinatorV1({ storage: { sql } }, {});
for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
const HEADERS = readFileSync(REPO + "/cloudflare/tests/idle-dev-save-slots.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES('JOUEURS',1,?,?)", JSON.stringify(HEAD), Date.now());
const catalogue = readFileSync(REPO + "/cloudflare/tests/idle-partie-test-b-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith('[["Type"'));
new Function("sql", catalogue)(sql);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const env = { GOOGLE_CLIENT_ID: "", SOREAL_IDLE: { idFromName: () => "global", get: () => ({ fetch: async (req) => {
  let lourde = false;
  if (LAT > 0) { try { const p = await req.clone().json(); lourde = LOURDES.has(String(p && p.operation)); } catch (_e) {} }
  const r = await coordinator.fetch(req);
  if (lourde) await dormir(LAT);
  return r;
} }) } };
function nouveauTicket() {
  const user = { email: ADMIN, emailConnexion: ADMIN, emails: [ADMIN], prenom: "Norman" };
  return coordinator.createLaunchTicketV1({ source: "tv", user }).ticket;
}

const mk = (u) => { const t = coordinator.createLaunchTicketV1({ source: "tv", user: u }); const s = coordinator.consumeLaunchTicketV1(t.ticket); return s.sessionToken; };
const ALIAS = "alias.sebastien@example.com";
const tokA = mk({ email: ADMIN, emailConnexion: ADMIN, emails: [ADMIN, ALIAS], prenom: "Norman" });
const tokB = mk({ email: ALIAS, emailConnexion: ADMIN, emails: [ADMIN, ALIAS], prenom: "Norman" });
const call = (tok, op, ...args) => coordinator.runStandaloneSessionOperationV1({ sessionToken: tok, operation: op, args: [tok, ...args] });
call(tokA, "obtenirEtatSorealIdle");
const hb = (tok) => call(tok, "battementSorealIdle", { actif: true, connecte: true, activite: { t: "libre" }, apresFlux: 0, amorceFlux: false });
hb(tokA); hb(tokB); hb(tokA); hb(tokB);
import assert from "node:assert/strict";
assert.equal(sql.exec("SELECT email FROM idle_presence").length, 1, "un seul joueur en ligne malgré deux adresses");
assert.equal(sql.exec("SELECT DISTINCT email FROM idle_flux").length, 1, "un seul auteur dans le fil");
console.log("idle-cle-joueur-unique-v1: OK");
process.exit(0);
