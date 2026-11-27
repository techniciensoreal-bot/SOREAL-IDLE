import assert from "node:assert/strict";
import { SorealIdleCoordinatorV1 } from "../src/index-idle-coordinator-v1.js";

function fakeSqlV1() {
  const tickets = new Map();
  const sessions = new Map();
  return {
    tickets,
    sessions,
    exec(query, ...bindings) {
      const q = String(query).replace(/\s+/g, " ").trim();
      if (q.startsWith("CREATE TABLE") || q.startsWith("CREATE INDEX") || q.startsWith("DROP INDEX")) return [];
      if (q === "DELETE FROM idle_launch_tickets WHERE expires_at<?") {
        const [cutoff] = bindings;
        for (const [key, row] of tickets) if (Number(row.expires_at) < Number(cutoff)) tickets.delete(key);
        return [];
      }
      if (q === "DELETE FROM idle_sessions WHERE expires_at<? OR revoked_at IS NOT NULL") {
        const [cutoff] = bindings;
        for (const [key, row] of sessions) {
          if (Number(row.expires_at) < Number(cutoff) || row.revoked_at != null) sessions.delete(key);
        }
        return [];
      }
      if (q.startsWith("INSERT INTO idle_launch_tickets")) {
        const row = {
          ticket: bindings[0], user_json: bindings[1], source: bindings[2],
          created_at: bindings[3], expires_at: bindings[4], consumed_at: null
        };
        tickets.set(row.ticket, row);
        return [];
      }
      if (q.startsWith("SELECT ticket,user_json,source,created_at,expires_at,consumed_at FROM idle_launch_tickets WHERE ticket=?")) {
        const row = tickets.get(bindings[0]);
        return row ? [{ ...row }] : [];
      }
      if (q.startsWith("UPDATE idle_launch_tickets SET consumed_at=? WHERE ticket=?")) {
        const [consumedAt, ticket] = bindings;
        const row = tickets.get(ticket);
        if (row && row.consumed_at == null) row.consumed_at = consumedAt;
        return [];
      }
      if (q === "DELETE FROM idle_launch_tickets WHERE ticket=?") {
        tickets.delete(bindings[0]);
        return [];
      }
      if (q.startsWith("INSERT INTO idle_sessions")) {
        const row = {
          session_token: bindings[0], user_json: bindings[1], created_at: bindings[2],
          expires_at: bindings[3], revoked_at: null
        };
        sessions.set(row.session_token, row);
        return [];
      }
      if (q.startsWith("SELECT session_token,user_json,created_at,expires_at,revoked_at FROM idle_sessions WHERE session_token=?")) {
        const row = sessions.get(bindings[0]);
        return row ? [{ ...row }] : [];
      }
      if (q.startsWith("UPDATE idle_sessions SET expires_at=? WHERE session_token=?")) {
        const row = sessions.get(bindings[1]);
        if (row && row.revoked_at == null) row.expires_at = bindings[0];
        return [];
      }
      if (q === "DELETE FROM idle_sessions WHERE session_token=?") {
        sessions.delete(bindings[0]);
        return [];
      }
      throw new Error("Unexpected SQL in standalone auth test: " + q);
    }
  };
}

const sql = fakeSqlV1();
const coordinator = new SorealIdleCoordinatorV1({ storage: { sql } }, {});

const createRequest = new Request("https://idle.internal/__soreal-idle-v1/launch-ticket-create", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    source: "tv",
    user: {
      email: "reeeedruuuum@gmail.com",
      emailConnexion: "reeeedruuuum@gmail.com",
      prenom: "Norman",
      role: "responsable"
    }
  })
});
const createResponse = await coordinator.internal(createRequest, new URL(createRequest.url));
assert.equal(createResponse.status, 200);
const created = await createResponse.json();
assert.equal(created.ok, true);
assert.equal(created.protocolVersion, 1);
assert.match(created.ticket, /^ilt_[a-f0-9]{64}$/);
assert.equal(sql.tickets.size, 1);

const consumeRequest = new Request("https://idle.internal/__soreal-idle-v1/launch-ticket-consume", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ticket: created.ticket })
});
const consumeResponse = await coordinator.internal(consumeRequest, new URL(consumeRequest.url));
assert.equal(consumeResponse.status, 200);
const consumed = await consumeResponse.json();
assert.equal(consumed.ok, true);
assert.match(consumed.sessionToken, /^ils_[a-f0-9]{64}$/);
assert.equal(sql.sessions.size, 1);

const validateRequest = new Request("https://idle.internal/__soreal-idle-v1/session-validate", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ sessionToken: consumed.sessionToken })
});
const validateResponse = await coordinator.internal(validateRequest, new URL(validateRequest.url));
assert.equal(validateResponse.status, 200);
const validated = await validateResponse.json();
assert.equal(validated.ok, true);
assert.ok(Number(validated.expiresAt) > Date.now());

const invalidValidateRequest = new Request("https://idle.internal/__soreal-idle-v1/session-validate", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ sessionToken: "ils_invalid" })
});
const invalidValidateResponse = await coordinator.internal(invalidValidateRequest, new URL(invalidValidateRequest.url));
assert.equal(invalidValidateResponse.status, 401);
assert.equal((await invalidValidateResponse.json()).error, "IDLE_SESSION_INVALID");

const secondConsumeRequest = new Request("https://idle.internal/__soreal-idle-v1/launch-ticket-consume", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ticket: created.ticket })
});
const secondConsumeResponse = await coordinator.internal(secondConsumeRequest, new URL(secondConsumeRequest.url));
assert.equal(secondConsumeResponse.status, 401);
assert.equal((await secondConsumeResponse.json()).error, "LAUNCH_TICKET_USED");

const callRequest = new Request("https://idle.internal/__soreal-idle-v1/session-call", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    sessionToken: consumed.sessionToken,
    operation: "testerAccesSorealIdle",
    args: [consumed.sessionToken]
  })
});
const callResponse = await coordinator.internal(callRequest, new URL(callRequest.url));
assert.equal(callResponse.status, 200);
const callBody = await callResponse.json();
assert.equal(callBody.ok, true);
assert.equal(callBody.autorise, true);

const invalidCallRequest = new Request("https://idle.internal/__soreal-idle-v1/session-call", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    sessionToken: "ils_invalid",
    operation: "testerAccesSorealIdle",
    args: ["ils_invalid"]
  })
});
const invalidCallResponse = await coordinator.internal(invalidCallRequest, new URL(invalidCallRequest.url));
assert.equal(invalidCallResponse.status, 401);
assert.equal((await invalidCallResponse.json()).error, "IDLE_SESSION_INVALID");

const deniedSql = fakeSqlV1();
const deniedCoordinator = new SorealIdleCoordinatorV1({ storage: { sql: deniedSql } }, {});
const deniedRequest = new Request("https://idle.internal/__soreal-idle-v1/launch-ticket-create", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    source: "app",
    user: { email: "not-authorized@example.com", prenom: "Intrus" }
  })
});
const deniedResponse = await deniedCoordinator.internal(deniedRequest, new URL(deniedRequest.url));
assert.equal(deniedResponse.status, 403);
assert.equal((await deniedResponse.json()).error, "SOREAL_IDLE_ACCES_REFUSE");
assert.equal(deniedSql.tickets.size, 0);

console.log("idle standalone session: ok");

// Renouvellement à l'usage (2026-11-27) : moins de 4 h restantes -> prolongée à 8 h, jamais au-delà de 14 jours après la création ; inutilisée = expire ; révoquée = jamais prolongée
{
  const H = 3600 * 1000, now = Date.now();
  const mk = (jeton, creeIlYa, expireDans, revoque = null) => sql.sessions.set(jeton, { session_token: jeton, user_json: JSON.stringify({ email: "a@b.c" }), created_at: now - creeIlYa, expires_at: now + expireDans, revoked_at: revoque });
  mk("ils_ren1", 7 * H, 1 * H);
  const r1 = coordinator.standaloneSessionV1("ils_ren1");
  assert.equal(r1.ok, true);
  assert.ok(sql.sessions.get("ils_ren1").expires_at >= now + 8 * H - 5000, "session proche de l'expiration prolongée à ~8 h");
  mk("ils_ren2", 1 * H, 7 * H);
  coordinator.standaloneSessionV1("ils_ren2");
  assert.ok(Math.abs(sql.sessions.get("ils_ren2").expires_at - (now + 7 * H)) < 5000, "plus de 4 h restantes : inchangée");
  mk("ils_ren3", 14 * 24 * H - 1 * H, 1 * H);
  coordinator.standaloneSessionV1("ils_ren3");
  assert.ok(sql.sessions.get("ils_ren3").expires_at <= now + 1 * H + 5000, "jamais au-delà de 14 jours après la création");
  mk("ils_ren4", 9 * H, -1 * H);
  assert.equal(coordinator.standaloneSessionV1("ils_ren4").ok, false, "session déjà expirée : refusée, jamais ressuscitée");
  mk("ils_ren5", 2 * H, 1 * H, now - 1000);
  assert.equal(coordinator.standaloneSessionV1("ils_ren5").ok, false, "session révoquée : refusée");
  console.log("idle-standalone-session renouvellement: ok");
}
