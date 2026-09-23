import assert from "node:assert/strict";
import worker from "../src/idle-worker-entry-v1.js";

function envV1() {
  const calls = [];
  return {
    calls,
    SOREAL_IDLE_INTERNAL_KEY: "secret",
    ASSETS: {
      async fetch() {
        return new Response("<!doctype html><title>SOREAL IDLE</title>", {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }
    },
    SOREAL_IDLE: {
      idFromName(name) {
        assert.equal(name, "global");
        return "global-id";
      },
      get(id) {
        assert.equal(id, "global-id");
        return {
          async fetch(request) {
            const body = request.method === "POST"
              ? await request.json().catch(() => ({}))
              : null;
            calls.push({ url: request.url, method: request.method, body });
            const path = new URL(request.url).pathname;
            if (path === "/__soreal-idle-v1/launch-ticket-consume") {
              return Response.json({ ok: true, sessionToken: "ils_test", expiresAt: Date.now() + 60_000 });
            }
            if (path === "/__soreal-idle-v1/session-call") {
              return Response.json({ ok: true, joueur: { id: 1 } });
            }
            return Response.json({ ok: true, joueur: { id: 1 } });
          }
        };
      }
    }
  };
}

{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/api/v1/bootstrap"), env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.ok, true);
  assert.equal(data.standalone, true);
  assert.equal(data.sessionEndpoint, "https://idle.test/api/v1/session");
  assert.equal(data.callEndpoint, "https://idle.test/api/v1/call");
}

{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/"), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /SOREAL IDLE/);
}

{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/api/v1/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  }), env);
  assert.equal(response.status, 400);
  assert.equal(env.calls.length, 0);
}

{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/api/v1/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ticket: "ilt_test" })
  }), env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.sessionToken, "ils_test");
  assert.equal(env.calls.length, 1);
  assert.equal(new URL(env.calls[0].url).pathname, "/__soreal-idle-v1/launch-ticket-consume");
  assert.deepEqual(env.calls[0].body, { ticket: "ilt_test" });
}

{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/api/v1/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: ["token"] })
  }), env);
  assert.equal(response.status, 401);
  assert.equal(env.calls.length, 0);
}

{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/api/v1/call", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer ils_test" },
    body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: ["ils_test"] })
  }), env);
  assert.equal(response.status, 200);
  assert.equal(env.calls.length, 1);
  assert.equal(new URL(env.calls[0].url).pathname, "/__soreal-idle-v1/session-call");
  assert.deepEqual(env.calls[0].body, {
    sessionToken: "ils_test",
    operation: "obtenirEtatSorealIdle",
    args: ["ils_test"]
  });
}

/*
 * Audit 2026-09-23 (second passage) : /api/v1/call acceptait un repli
 * "clé interne" (même secret que le proxy avatar/debug-list) qui faisait
 * confiance à un user.email fourni tel quel par l'appelant -- sans
 * jeton de session, sans preuve d'identité. Aucun appelant légitime
 * trouvé nulle part (TV/APP passent par le binding Durable Object
 * direct, jamais cette route HTTP publique). Retiré entièrement : ce
 * test verrouille qu'un appelant qui connaît la clé interne mais N'A
 * PAS de jeton de session valide est bien rejeté, exactement comme un
 * appelant qui n'a ni l'un ni l'autre.
 */
{
  const env = envV1();
  const response = await worker.fetch(new Request("https://idle.test/api/v1/call", {
    method: "POST",
    headers: { "content-type": "application/json", "x-soreal-idle-internal-key": "secret" },
    body: JSON.stringify({
      operation: "reinitialiserTousLesComptesSorealIdle",
      args: [],
      user: { email: "technicien.soreal@gmail.com" }
    })
  }), env);
  assert.equal(response.status, 401);
  assert.equal(env.calls.length, 0, "la clé interne seule ne doit plus jamais atteindre le Durable Object sur cette route.");
}

console.log("idle standalone worker routes: ok");
