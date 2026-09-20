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
      if (q.startsWith("CREATE TABLE") || q.startsWith("CREATE INDEX")) return [];
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
