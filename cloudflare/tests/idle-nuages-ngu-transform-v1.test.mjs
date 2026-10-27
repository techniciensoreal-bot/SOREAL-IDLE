import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit 60 fps (Norman, 2026-10-26, Chrome, partie B) : le NGU de jour tournait à 20 images/s. Cause : les nuages dérivaient en animant background-position (24 dégradés d'une bande de 300 px, repeints à CHAQUE image).
 * Mesure : nuages en pause = 41 images/s ; nuages animés par transform = 37 à 39 images/s (au lieu de 20). Règle du dépôt : on n'anime que transform et opacity.
 */
const src = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
assert.ok(src.includes("@keyframes nlNuages{from{transform:translate3d(0,0,0)}to{transform:translate3d(640px,0,0)}}"), "les nuages glissent par transform");
assert.ok(!src.includes("@keyframes nlNuages{from{background-position"), "plus d'animation de background-position");
assert.ok(src.includes(".nl-nuages{animation:nlNuages 150s linear infinite;will-change:transform}"), "couche propre pour les nuages");
assert.ok(src.includes(".nl-v1[data-nl-onglet=\"energy\"] .nl-nuages{left:-640px}"), "débord de 640 px à gauche : exactement une période du motif, boucle sans à-coup");
assert.ok(/\.nl-v1\{[^}]*overflow:hidden/.test(src), "le cadre coupe ce qui déborde");
console.log("idle-nuages-ngu-transform-v1: OK");
