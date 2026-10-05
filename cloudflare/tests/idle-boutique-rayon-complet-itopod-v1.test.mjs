import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : (1) « l'icône du menu ITOPOD n'a pas d'animation quand il est actif » ; (2) « dans les rayons du shop, un petit V vert comme celui des sets quand on a acheté tout ce que contient le rayon ; si je rajoute des
 * articles, le V disparaît tant qu'on n'a pas fait ce nouvel achat ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// 1. ITOPOD (menu « tower ») : animé tant que la tour tourne, avec son propre effet.
assert.ok(/IDLE_MENUS_ETATS_V1=\{[^}]*tower:1/.test(ui), "ITOPOD fait partie des menus à état animé");
assert.ok(ui.includes("if(id==='tower'){") && ui.includes("tour.state.active"), "animé tant que le système tower est actif");
assert.ok(css.includes('.alimente-v1[data-effet-v1="tower"] .soreal-idle-nav-emoji-v2{animation:sorealAlEtageV1'), "effet propre : la tour grimpe");
assert.ok(css.includes('[data-effet-v1="wishes"],[data-effet-v1="tower"])::before{display:none}'), "le tour de lumière générique est remplacé");

// 2. Rayon complet : fonction extraite du code et rejouée.
const debut = meta.indexOf("function idleExpRayonCompletIdleV1_(j,rayon,ids){");
assert.ok(debut > 0);
const corps = meta.slice(debut, meta.indexOf("function pageSpendExpIdleV1_(j){", debut));
const complet = new Function(corps + "; return idleExpRayonCompletIdleV1_;")();
const j = (items) => ({ systemes: { expShop: items } });
const fini = (id) => ({ id, nextCost: null });
const encore = (id) => ({ id, nextCost: 100 });
assert.equal(complet(j([fini("a"), fini("b")]), "debuts", ["a", "b"]), true, "tout au maximum : V");
assert.equal(complet(j([fini("a"), encore("b")]), "debuts", ["a", "b"]), false, "un achat restant : pas de V");
// Un nouvel article devient visible : le V disparaît tant qu'il n'est pas acheté.
assert.equal(complet(j([fini("a"), fini("b"), encore("c")]), "debuts", ["a", "b", "c"]), false, "nouvel article : le V disparaît");
assert.equal(complet(j([fini("a"), fini("b"), fini("c")]), "debuts", ["a", "b", "c"]), true, "nouvel article acheté : le V revient");
assert.equal(complet(j([]), "debuts", []), false, "rayon vide : pas de V");
assert.equal(complet(j([fini("a")]), "energy", ["res:energy:speed"]), false, "rayons de ressources : sans maximum, jamais de V");
// Les deux boutiques posent le V sur l'onglet du rayon, même vert que les sets.
assert.ok(meta.includes("soreal-idle-rayon-complet-v1") && ui.includes("rayonCompletAp(cle)") && ui.includes("soreal-idle-rayon-complet-v1"), "V sur les rayons de la boutique EXP et de la boutique AP");
const cssUi = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.ok(cssUi.includes(".soreal-idle-rayon-complet-v1{") && cssUi.includes("background:#2fbf5f"), "même vert que le V des sets (#2fbf5f)");
console.log("idle-boutique-rayon-complet-itopod-v1: OK");
