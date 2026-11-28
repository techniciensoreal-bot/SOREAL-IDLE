import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/* Norman (2026-11-28) : pendant le defi des 100 niveaux (comme 24 Hour et Troll), l'avancee hors ligne est coupee ET le compteur « Temps ecoule » ne defile plus. */
const T0 = 1_000_000_000_000;
for (const id of ["hundredLevels", "twentyFourHours", "troll"]) {
  const s = normalizeIdleNguState({}, { bosses: 10 }, T0);
  s.challenge.active = id;
  s.challenge.startedAt = T0;
  const apres = advanceIdleNguState(s, 3600, { bosses: 10 }, T0 + 3600_000);
  const ecoule = (T0 + 3600_000 - apres.challenge.startedAt) / 1000;
  assert.ok(ecoule <= 60, id + " : une heure hors ligne ne compte que 60 s au chrono (" + ecoule + " s)");
}
/* un defi qui n'est pas « sans hors ligne » garde son chrono */
{
  const s = normalizeIdleNguState({}, { bosses: 10 }, T0);
  s.challenge.active = "basic"; s.challenge.startedAt = T0;
  const apres = advanceIdleNguState(s, 3600, { bosses: 10 }, T0 + 3600_000);
  assert.equal(apres.challenge.startedAt, T0, "basic : chrono inchange");
}
console.log("idle-defi-chrono-hors-ligne-v1: OK");
