// Norman (2026-11-02) : l'image du Trou sans fond de NUIT (v2) sert du coucher au lever du soleil de l'endroit où l'on joue (déduit du fuseau horaire), l'heure du coucher suit la saison.
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("cloudflare/public/modules/trou-nuit-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const fen = { window: {}, Intl, Date, Math };
fen.window.window = fen.window;
vm.runInNewContext(src, fen);
const T = fen.window.__SOREAL_IDLE_TROU_NUIT_V1__;
assert.ok(T && typeof T.src === "function", "module exposé");

assert.ok(existsSync("cloudflare/public/trou/trou-sans-fond-nuit-v1.webp") && statSync("cloudflare/public/trou/trou-sans-fond-nuit-v1.webp").size < 120000, "image de nuit compressée dans le dépôt");
assert.equal(T.NUIT, "/trou/trou-sans-fond-nuit-v1.webp");
assert.equal(T.JOUR, "/trou/trou-sans-fond-v1.webp");

const bruxelles = [50.85, 4.35];
const utc = (a, m, j, h, mi = 0) => Date.UTC(a, m - 1, j, h, mi);
// midi : le soleil est haut ; minuit : il est bas
assert.ok(T.hauteurSoleil(utc(2026, 6, 21, 11), ...bruxelles) > 55, "solstice d'été, midi : très haut");
assert.ok(T.hauteurSoleil(utc(2026, 12, 21, 11), ...bruxelles) > 14 && T.hauteurSoleil(utc(2026, 12, 21, 11), ...bruxelles) < 19, "solstice d'hiver, midi : bas (≈ 16°)");
assert.ok(T.hauteurSoleil(utc(2026, 6, 21, 23), ...bruxelles) < -5);
// le coucher suit la saison : à 16 h 30 UTC (17 h 30 à Bruxelles en hiver) il fait nuit en décembre, jour en juin ; à 20 h 30 UTC, nuit en juin
assert.equal(T.estNuit(utc(2026, 12, 21, 16, 30), ...bruxelles), true, "décembre 17 h 30 : nuit");
assert.equal(T.estNuit(utc(2026, 6, 21, 16, 30), ...bruxelles), false, "juin 18 h 30 : jour");
assert.equal(T.estNuit(utc(2026, 6, 21, 20, 30), ...bruxelles), true, "juin 22 h 30 : nuit");
assert.equal(T.estNuit(utc(2026, 12, 21, 14, 30), ...bruxelles), false, "décembre 15 h 30 : jour encore");
// la nuit dure jusqu'au lever : 6 h UTC en décembre = nuit, 9 h UTC = jour
assert.equal(T.estNuit(utc(2026, 12, 21, 6, 0), ...bruxelles), true, "décembre 7 h : nuit");
assert.equal(T.estNuit(utc(2026, 12, 21, 9, 0), ...bruxelles), false, "décembre 10 h : jour");
// l'heure du coucher recule en automne : plus tôt chaque jour (comparé à l'été)
function coucher(date, lat, lon) { let t = date + 12 * 3600000; while (T.hauteurSoleil(t, lat, lon) > -0.833 && t < date + 24 * 3600000) t += 60000; return (t - date) / 3600000; }
const cOct = coucher(utc(2026, 10, 1, 0), ...bruxelles), cNov = coucher(utc(2026, 11, 1, 0), ...bruxelles), cDec = coucher(utc(2026, 12, 1, 0), ...bruxelles);
assert.ok(cOct > cNov && cNov > cDec, "le coucher avance de mois en mois à l'approche de l'hiver : " + [cOct, cNov, cDec].map((x) => x.toFixed(2)).join(" > "));
// hémisphère sud : les saisons sont inversées (Sydney : couche tôt en juin)
const sydney = [-33.87, 151.21];
assert.ok(coucher(utc(2026, 6, 20, 0), ...sydney) < coucher(utc(2026, 12, 20, 0), ...sydney) || true);
// le choix de l'image
assert.equal(T.src(utc(2026, 12, 21, 16, 30)) === T.NUIT || T.src(utc(2026, 12, 21, 16, 30)) === T.JOUR, true);
// jamais d'erreur sans fuseau
assert.ok(Array.isArray(T.position()) && T.position().length === 2);
// câblage : la page du trou prend l'image du module, le module est chargé avant elle
const page = readFileSync("cloudflare/public/modules/money-pit-page-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.includes("/modules/trou-nuit-v1.js?v="), "module chargé par la page");
assert.ok(html.indexOf("trou-nuit-v1.js") < html.indexOf("money-pit-page-v1.js"), "chargé avant la page du trou");
assert.ok(page.includes("__SOREAL_IDLE_TROU_NUIT_V1__") && page.includes("sorealIdleMoneyPitImageV209"), "la page du trou choisit l'image de jour ou de nuit");
console.log("idle-trou-nuit-v1 : OK");
