import assert from "node:assert/strict";
import { normalizeIdleNguState, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/* 2026-09-23 (wiki Arbitrary Points) : « Rebirths over 1 hour long : 1 AP pour chaque 500 s de Rebirth ». */
const ctx = { bosses: 100 };
const debut = 1_000_000;
function apApres(secondes) {
  const s = normalizeIdleNguState({}, ctx, debut);
  s.currencies.ap = 0;
  const r = rebirthIdleNguState(s, ctx, debut + secondes * 1000);
  return (r.state || r).currencies.ap;
}
assert.equal(apApres(1800), 0, "moins d'une heure : aucun AP");
assert.equal(apApres(3600), 7, "1 h = floor(3600 / 500)");
assert.equal(apApres(5000), 10);
console.log("idle-rebirth-ap ok");
