import assert from "node:assert/strict";
import worker, { idleReinitialiserLimitesV1 } from "../src/idle-worker-entry-v1.js";

/*
 * Audit de sécurité du 2026-10-10, IDLE-AUDIT-SEC-007 : les routes publiques n'avaient ni plafond de taille de corps ni limitation de débit, alors qu'un seul Durable Object traite tous les joueurs. Un corps trop gros est
 * refusé (413) avant tout parsing ; au-delà du seau à jetons d'une session (40 d'avance, 12/s), les appels reçoivent 429 « réessayable » ; la cadence normale d'un client n'est pas touchée.
 */
let appelsCoordinateur = 0;
const env = {
  SOREAL_IDLE: {
    idFromName: () => ({}),
    get: () => ({ fetch: async () => { appelsCoordinateur += 1; return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } }); } })
  }
};
const appel = (corps, jeton = "jeton-a", entetes = {}) =>
  worker.fetch(new Request("https://x.invalid/api/v1/call", { method: "POST", headers: Object.assign({ authorization: "Bearer " + jeton, "content-type": "application/json" }, entetes), body: corps }), env);

// Cadence normale : une dizaine d'appels étalés ne sont jamais limités.
idleReinitialiserLimitesV1();
for (let i = 0; i < 10; i += 1) assert.equal((await appel(JSON.stringify({ operation: "battementSorealIdle", args: [] }))).status, 200, "appel normal " + i);

// Flot : au-delà de la réserve, 429 réessayable ; une autre session n'est pas touchée.
idleReinitialiserLimitesV1();
let refus = 0;
for (let i = 0; i < 200; i += 1) {
  const r = await appel(JSON.stringify({ operation: "battementSorealIdle", args: [] }), "jeton-flot");
  if (r.status === 429) { refus += 1; const j = await r.json(); assert.equal(j.code, "SOREAL_IDLE_TROP_DE_REQUETES"); assert.equal(j.retryable, true); }
}
assert.ok(refus >= 100, "un flot de 200 appels est largement refusé (refusés : " + refus + ")");
assert.equal((await appel(JSON.stringify({ operation: "x", args: [] }), "jeton-autre")).status, 200, "une autre session n'est pas pénalisée");

// Corps trop gros : 413, le coordinateur n'est jamais appelé.
idleReinitialiserLimitesV1();
const avant = appelsCoordinateur;
const gros = JSON.stringify({ operation: "x", args: ["a".repeat(300000)] });
assert.equal((await appel(gros)).status, 413, "corps de plus de 256 Ko refusé");
assert.equal((await appel("{}", "jeton-a", { "content-length": "999999" })).status, 413, "content-length annoncé trop gros refusé");
assert.equal(appelsCoordinateur, avant, "rien n'a atteint le Durable Object");

// Corps invalide : comportement inchangé (opération manquante).
assert.equal((await appel("pas du json")).status, 400);

// Connexion Google : 10 tentatives par minute et par adresse.
idleReinitialiserLimitesV1();
let g429 = 0;
for (let i = 0; i < 25; i += 1) {
  const r = await worker.fetch(new Request("https://x.invalid/api/v1/google-login", { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" }, body: JSON.stringify({ credential: "x" }) }), env);
  if (r.status === 429) g429 += 1;
}
assert.ok(g429 >= 10, "au-delà de 10 tentatives, 429 (obtenu : " + g429 + ")");
idleReinitialiserLimitesV1();
console.log("idle-audit-securite-limites-v1: OK");
