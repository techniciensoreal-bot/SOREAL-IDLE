import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand je dépense toute ma magie ou toute mon énergie, les barres disparaissent et ça fait bouger la page où je me trouve ; je veux que ça se fasse de manière fluide sans faire bouger la page ».
 * Mesuré dans Chrome (page défilée) : le contenu sous le bandeau se décalait de 41 à 47 px quand une barre apparaissait ou partait ; après correction, au plus 2 px. Le défilement natif « ancré » est coupé sur la page
 * (overflow-anchor:none) : le bandeau reporte lui-même, image après image, le décalage du contenu sur le défilement.
 */
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
assert.ok(hud.includes("new ResizeObserver(") && hud.includes("hudObs.observe(h)"), "le bandeau est surveillé image après image");
assert.ok(hud.includes("nextElementSibling") && hud.includes("suite.getBoundingClientRect().top+"), "on mesure la position réelle du contenu sous le bandeau (marges comprises)");
assert.ok(hud.includes("window.scrollTo({top:Math.max(0,y+d),behavior:'instant'})"), "le décalage est reporté sur le défilement, sans animation de défilement");
assert.ok(hud.includes("y>0"), "en haut de page il n'y a rien à compenser");
assert.ok(hud.includes("surveillerHud();"), "le bandeau (parfois recréé) est ré-attaché régulièrement");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes("soreal-idle-page-root-v28{overflow-anchor:none}"), "l'ancrage natif reste coupé (page redessinée en continu) : c'est le bandeau qui compense");

console.log("idle-hud-barre-sans-saut-v1: OK");
