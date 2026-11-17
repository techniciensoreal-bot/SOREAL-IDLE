import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-17, téléphone) : le redessin de 4 s d'un menu vivant ne doit JAMAIS ramener la page en arrière pendant que le joueur défile
 * (window.scrollTo annule l'inertie tactile : un saut de page toutes les 4 s). Chaque rappel de défilement après un redessin est gardé.
 */
const pub = (f) => readFileSync("cloudflare/public/modules/" + f, "utf8");
const menus = pub("ui-menus-v1.js"), noyau = pub("ui-noyau-v1.js"), inv = pub("ui-inventaire-v1.js");

assert.ok(menus.includes("window.__idleDefileV1__=function(){return performance.now()-dernierDefil<200;}"), "détecteur de défilement en cours");
assert.ok(/addEventListener\('scroll'[\s\S]*?\{passive:true/.test(menus), "écouteur passif (ne bloque pas le défilement)");
assert.ok(menus.includes("if(!ancre_ok&&!(window.__idleDefileV1__&&window.__idleDefileV1__()))window.scrollTo(xAvant,yAvant);"), "rafraîchissement de menu : pas de scrollTo pendant le défilement");
assert.ok(/function caler\(\)\{\s*if\(window\.__idleDefileV1__&&window\.__idleDefileV1__\(\)\)return;/.test(menus), "ancre de clic gardée");
assert.ok(noyau.includes("if(!idleAncreClicOkV1&&!(window.__idleDefileV1__&&window.__idleDefileV1__()))window.scrollTo("), "rendu complet : pas de scrollTo pendant le défilement");
assert.ok(/function caler\(\)\{\s*if\(window\.__idleDefileV1__&&window\.__idleDefileV1__\(\)\)return;/.test(inv), "ancre du sac gardée");
console.log("OK idle-redessin-pas-de-saut-defilement-v1");
