import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
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
/* 2026-10-25 (Norman : « des lettres à chaque fois, pas de e+96 ») : après Tg, des lettres AA (10^96), AB (10^99)… jusqu'à CS (10^303) ; plus de notation scientifique. */
assert.equal(g(1e96), "1AA");
assert.equal(g(1.98e96), "1.98AA");
assert.equal(g(1.5e99), "1.5AB");
assert.equal(g(2e303), "2CR");
assert.ok(!/e+/.test(g(1e308)), "même la plus grande valeur n'a plus de e+");
const F = window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
assert.equal(F.suffixe(31), "Tg"); assert.equal(F.suffixe(32), "AA"); assert.equal(F.suffixe(33), "AB"); assert.equal(F.suffixe(57), "AZ"); assert.equal(F.suffixe(58), "BA");
assert.equal(F.rangDe("K"), 1); assert.equal(F.rangDe("qa"), 5); assert.equal(F.rangDe("AA"), 32); assert.equal(F.rangDe("ab"), 33); assert.equal(F.rangDe("x1"), -1);
assert.equal(g(1500), "1.5K");

const ui = lireUiComplet();
assert.ok(ui.includes("fmt.suffixe(rang)"), "les PV fixes du duel utilisent les mêmes unités (noms puis lettres)");
console.log("idle-grands-nombres-suffixes-v1: OK");
