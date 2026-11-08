import assert from "node:assert/strict";
import fs from "node:fs";
/*
 * Norman (2026-11-08) : « avec le pack Magic, les boss suivants sont visibles directement une demi-seconde quand je tue un boss ; ensuite ils disparaissent et apparaissent avec leur animation d'arrivée ». Cause : le numéro du boss se lisait seulement dans « ?id=<n> » ; l'image du thème est
 * « /magic/boss/<n>.webp » : numéro 0, donc ni calque de mort ni apparition ne reconnaissaient le boss et le suivant restait à découvert. Les deux lecteurs d'adresse (apparition-boss-v1.js, victoire-boss-arcade-v1.js) comprennent les deux formes.
 */
const app = fs.readFileSync("cloudflare/public/modules/apparition-boss-v1.js", "utf8");
const i0 = app.indexOf("function idDe(img){"), i1 = app.indexOf("\n  }\n", i0) + 4;
const idDe = new Function("location", "URL", app.slice(i0, i1) + "\nreturn idDe;")({ href: "http://localhost/" }, URL);
const img = (src) => ({ getAttribute: (k) => (k === "src" ? src : null) });
assert.equal(idDe(img("/api/idle/media/boss?id=33")), 33, "image de base");
assert.equal(idDe(img("/api/idle/media/boss?id=33&difficulty=difficile")), 33, "image Evil");
assert.equal(idDe(img("/magic/boss/107.webp")), 107, "image du thème Magic");
assert.equal(idDe(img("/magic/boss/12.webp?v=3")), 12, "avec un numéro de version");
assert.equal(idDe(img("/magic/fonds/sewers.webp")), 0, "ce n'est pas un boss");
assert.equal(idDe(img("")), 0);
const arc = fs.readFileSync("cloudflare/public/modules/victoire-boss-arcade-v1.js", "utf8");
const j0 = arc.indexOf("function imagePourBoss(img,n){"), j1 = arc.indexOf("\n  function capturer", j0);
const entier_ = (v) => { const n = Math.floor(Number(v)); return isFinite(n) && n > 0 ? n : 0; };
const pour = new Function("entier_", "location", "URL", arc.slice(j0, j1) + "\nreturn imagePourBoss;")(entier_, { href: "http://localhost/" }, URL);
const im = (src) => ({ currentSrc: src, src });
assert.equal(pour(im("/api/idle/media/boss?id=33"), 33), true);
assert.equal(pour(im("/magic/boss/33.webp"), 33), true, "l'image Magic du boss tué est reconnue pour l'éclatement");
assert.equal(pour(im("/magic/boss/34.webp"), 33), false, "jamais l'image du suivant");
console.log("idle-boss-theme-magic-apparition-v1: OK");
