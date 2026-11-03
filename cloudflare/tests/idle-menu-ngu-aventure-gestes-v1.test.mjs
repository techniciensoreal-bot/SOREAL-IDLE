import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : un simple appui sur NGU = NGU d'énergie ; double clic / double tap / clic droit = NGU de magie. Clic droit sur Aventure = Titans (comme le double appui). */
const nav = fs.readFileSync("cloudflare/public/modules/ui-navigation-v1.js", "utf8").replace(/\r\n/g, "\n");
const menus = fs.readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(nav.includes("function menuIdleV28_(menu,geste){") && nav.includes("if(menu==='ngu'){"), "le bouton NGU a son propre geste");
assert.ok(nav.includes("const dbl=geste==='alt'||t-idleNguDernierAppuiV1<420;") && nav.includes("L.onglet(dbl?'magic':'energy')"), "simple appui = énergie, double appui ou clic droit = magie, toujours (jamais l'onglet mémorisé)");
assert.ok(nav.includes("const doubleAppui=geste==='alt'||maintenant-idleAventureDernierAppuiV1<420;"), "clic droit sur Aventure = Titans, comme le double appui");
assert.ok(menus.includes("menuIdleV28_(id,'alt')") && menus.includes("id==='ngu'||id==='aventure'") && menus.includes("ev.pointerType==='touch'"), "le clic droit à la souris déclenche le geste ; l'appui long tactile reste au rangement des boutons");
console.log("idle-menu-ngu-aventure-gestes-v1: OK");
