// Norman (2026-11-01) : « dans daycare, prochain niveau dans 7.6 h : je veux un format Jours, heures, minutes, pas des 7,5 au lieu de 7 h 30 ».
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const d = lire("cloudflare/public/modules/daycare-page-v1.js");
const z = lire("cloudflare/public/modules/garderie-zoom-v1.js");
// la vraie fonction, extraite du module et exécutée
const a = d.indexOf("function dureeJhmGarderieV1_(s){");
assert.ok(a > 0, "fonction présente");
const b = d.indexOf("\n  }\n", a) + 4;
const ctx = { window: { __SOREAL_IDLE_META_PARTAGE_V130__: { dureeLongueNguIdleV1_: () => "ABRÉGÉ" } } };
vm.runInNewContext(d.slice(a, b), ctx);
const f = ctx.dureeJhmGarderieV1_;
assert.equal(f(7.6 * 3600), "7 h 36 min");
assert.equal(f(7.5 * 3600), "7 h 30 min");
assert.equal(f(2 * 86400 + 3 * 3600 + 15 * 60), "2 j 3 h 15 min");
assert.equal(f(86400), "1 j");
assert.equal(f(45 * 60), "45 min");
assert.equal(f(30), "30 s");
assert.equal(f(0), "—");
assert.equal(f(1500 * 86400), "ABRÉGÉ", "au-delà de 1000 jours : format abrégé partagé");
// la page et la vue zoom l'utilisent (plus de « 7,5 h »)
assert.ok(d.includes("'+1 niv. dans '+dureeJhmGarderieV1_((1-e.p)/rep.r)") && d.includes("'1 niveau / '+dureeJhmGarderieV1_("), "la page de la Garderie");
assert.ok(z.includes("window.__SOREAL_IDLE_DUREE_JHM_V1__"), "la vue zoom");
console.log("idle-garderie-duree-jhm-v1 : OK");
