import assert from "node:assert/strict";
import fs from "node:fs";
/*
 * Norman (2026-11-08) : « avec le pack Magic, les boss suivants sont visibles directement une demi-seconde quand je tue un boss ; ensuite ils disparaissent et apparaissent avec leur animation d'arrivée ». Cause : le numéro du boss se lisait seulement dans « ?id=<n> » ; l'image du thème est
 * « /magic/boss/<n>.webp » : numéro 0, donc ni calque de mort ni apparition ne reconnaissaient le boss et le suivant restait à découvert. Les deux lecteurs d'adresse (apparition-boss-v1.js, victoire-boss-arcade-v1.js) comprennent les deux formes.
 */
const app = fs.readFileSync("cloudflare/public/modules/apparition-boss-v1.js", "utf8");
const i0 = app.indexOf("function idDe(img){"), i1 = app.indexOf("\n  }\n", i0) + 4;
const idDe = new Function("location", "URL", app.slice(i0, i1) + "\nreturn idDe;")({ href: "http://localhost/" }, URL);
const img = (src, id) => ({ getAttribute: (k) => (k === "src" ? src : k === "data-boss-id" ? (id == null ? null : String(id)) : null) });
assert.equal(idDe(img("/api/idle/media/boss?id=33")), 33, "image de base");
assert.equal(idDe(img("/api/idle/media/boss?id=33&difficulty=difficile")), 33, "image Evil");
assert.equal(idDe(img("/magic/boss/107.webp")), 107, "image du thème Magic");
assert.equal(idDe(img("/magic/boss/12.webp?v=3")), 12, "avec un numéro de version");
assert.equal(idDe(img("/magic/fonds/sewers.webp")), 0, "ce n'est pas un boss");
assert.equal(idDe(img("")), 0);
/* adresse inconnue (autre pack d'images, autre difficulté) : le numéro écrit sur la balise par la page (data-boss-id) */
assert.equal(idDe(img("/pack-inconnu/x.webp", 107)), 107, "numéro de la balise quand l'adresse ne le dit pas");
assert.equal(idDe(img("/api/idle/media/boss?id=33&difficulty=extreme", 99)), 33, "l'adresse prime quand elle donne un numéro");
assert.equal(idDe(img("/pack-inconnu/x.webp")), 0);
const c2 = fs.readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
assert.ok(c2.includes("data-boss-id=\"") && c2.includes("idImageBossCanoniqueIdleV181_(j)") && c2.split("numero").length > 6, "la balise de l'image du boss porte son numéro");
const arc = fs.readFileSync("cloudflare/public/modules/victoire-boss-arcade-v1.js", "utf8");
const j0 = arc.indexOf("function imagePourBoss(img,n){"), j1 = arc.indexOf("\n  function capturer", j0);
const entier_ = (v) => { const n = Math.floor(Number(v)); return isFinite(n) && n > 0 ? n : 0; };
const pour = new Function("entier_", "location", "URL", arc.slice(j0, j1) + "\nreturn imagePourBoss;")(entier_, { href: "http://localhost/" }, URL);
const im = (src, id) => ({ currentSrc: src, src, getAttribute: (k) => (k === "data-boss-id" && id != null ? String(id) : null) });
assert.equal(pour(im("/api/idle/media/boss?id=33"), 33), true);
assert.equal(pour(im("/magic/boss/33.webp"), 33), true, "l'image Magic du boss tué est reconnue pour l'éclatement");
assert.equal(pour(im("/magic/boss/34.webp"), 33), false, "jamais l'image du suivant");
assert.equal(pour(im("/pack-inconnu/a.webp", 33), 33), true, "adresse inconnue : numéro de la balise");
assert.equal(pour(im("/pack-inconnu/a.webp", 34), 33), false);
assert.equal(pour(im("/api/idle/media/boss?id=34&difficulty=difficile", 33), 33), false, "l'adresse prime sur la balise");
console.log("idle-boss-theme-magic-apparition-v1: OK");
