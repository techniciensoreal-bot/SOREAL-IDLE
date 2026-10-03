import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : suffixes au-delà de « Qid » (Sxd, Spd, Ocd, Nod, Vg...) avant de passer à la notation scientifique. */
globalThis.window = {};
new Function(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"))();
const g = window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;

assert.equal(g(1e48), "1Qid");
assert.equal(g(1.18e48), "1.18Qid");
assert.equal(g(2.5e51), "2.5Sxd");
assert.equal(g(1e54), "1Spd");
assert.equal(g(1e57), "1Ocd");
assert.equal(g(1e60), "1Nod");
assert.equal(g(3e63), "3Vg");
assert.equal(g(1e93), "1Tg");
assert.equal(g(1e96), "1.00e+96", "au-delà du dernier suffixe : notation scientifique");
assert.equal(g(1500), "1.5K");

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("'Qid','Sxd','Spd','Ocd','Nod','Vg'"), "même liste dans les PV fixes du duel");
console.log("idle-grands-nombres-suffixes-v1: OK");
