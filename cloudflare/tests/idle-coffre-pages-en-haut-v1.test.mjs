// Norman (2026-11-01) : « les pages pour le coffre doivent aussi se trouver en haut, en dessous de la barre de recherche. »
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8").replace(/\r\n/g, "\n");
const a = s.indexOf("const paginationCoffre=rendrePaginationIdleV1_(REG.idlePageCoffreV1,totalPagesCoffre,'window.__changerPageCoffreV1__');");
assert.ok(a > 0, "pagination calculée une fois");
const r = s.indexOf("return paginationCoffre+'<div class=\"soreal-idle-collection-grid-v1 soreal-idle-coffre-grille-v1", a);
assert.ok(r > a && s.slice(r, r + 400).includes("+html+'</div>'+paginationCoffre;"), "pages en haut (sous la recherche, dans le conteneur de la grille) ET en bas");
const g = s.indexOf('<input type="search" id="sorealIdleCoffreRechercheV1"');
assert.ok(g > 0 && s.indexOf('<div id="sorealIdleCoffreGrilleV1">', g) > g, "la grille (donc les pages du haut) est juste sous la barre de recherche");
console.log("idle-coffre-pages-en-haut-v1 : OK");
