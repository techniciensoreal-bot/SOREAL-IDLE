import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Norman (2026-10-20) : « le petit caca en bas à droite d'Entraînement avancé : quand on clique dessus, il vient en zoom sur l'écran complet avant de disparaître ; là il reste en bas à gauche ».
 * Avant : le bouton lui-même grossissait sur place (coincé dans le coin, rogné par la page). Maintenant : un grand caca en position fixe, posé sur la page entière, part du bouton, grossit jusqu'à couvrir l'écran
 * (échelle calculée sur la taille de l'écran), glisse vers le centre puis s'efface, et se retire du DOM. Vérifié dans le navigateur : sa boîte dépasse l'écran (1806 x 1512 sur 1500 x 900), puis il disparaît.
 */
const page = lirePagesMeta();
const i = page.indexOf("window.__cacaCoinIdleV1__=function(bouton){");
assert.ok(i > 0);
const code = page.slice(i, page.indexOf("window.__basculerAideAdvancedTrainingIdleV1__", i));
assert.ok(code.includes("position:fixed") && code.includes("document.body.appendChild(grand)"), "grand caca en position fixe, hors de la page redessinée");
assert.ok(/Math\.max\(vw,vh\)\*1\.7\/100/.test(code), "échelle d'arrivée calculée sur la taille de l'écran : il le couvre");
assert.ok(code.includes("translate('+(vw/2-cx)+'px,'+(vh/2-cy)+'px)"), "glisse du bouton vers le centre de l'écran");
assert.ok(code.includes("opacity:0") && code.includes("anim.onfinish") && code.includes("removeChild(grand)"), "s'efface puis disparaît du DOM");
assert.ok(code.includes("prefers-reduced-motion") && code.includes("cornerClick"), "mouvement réduit respecté ; le succès part toujours");
assert.ok(!page.includes("sorealAtCacaPartiV1"), "plus d'agrandissement sur place du petit bouton");
assert.ok(/\.soreal-idle-at-caca-v1\.parti\{pointer-events:none;opacity:0/.test(page), "le petit bouton s'efface tout de suite");
console.log("idle-caca-zoom-ecran-v1: OK");
