import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Décalages de mise en page au chargement (Norman, 2026-11-03 : CLS 0,04 sur la trace Chrome ; mesuré : 0,058 avant, 0 après sur le menu Augmentations et sur la Machine temporelle).
 * Deux sources, corrigées à la racine :
 *  1. Le bandeau du haut compense la hauteur de ses barres d'énergie/magie par une marge basse négative (--hud-decalage). Elle n'était calculée qu'au premier passage du minuteur de 250 ms : la page
 *     était peinte avec la marge pleine puis remontait de 81 px (page-root-v28, 0,044). Un MutationObserver (micro-tâche, avant la peinture) branche la surveillance dès l'insertion du bandeau.
 *  2. Comic Neue 700 (titres de tour, texte d'aide, barre d'outils) n'était pas préchargée : la police de repli était remplacée ~800 ms après le premier affichage et le texte changeait de hauteur
 *     (barre d'outils 174 -> 155 px, cadre de la machine +23 px, 0,024). Toute police latine utilisée au premier affichage est préchargée.
 */
const hud = readFileSync(new URL("../public/modules/hud-haut-v2.js", import.meta.url), "utf8");
assert.ok(/new MutationObserver\(function\(\)\{\s*var h=document\.getElementById\('sorealIdleHudV2'\);\s*if\(h&&h!==hudEl\)surveillerHud\(\);\s*\}\)\.observe\(document\.documentElement,\{childList:true,subtree:true\}\)/.test(hud),
  "le bandeau doit être surveillé dès son insertion (avant la première peinture), pas au minuteur de 250 ms");
assert.ok(hud.indexOf("new MutationObserver(function(){") < hud.indexOf("setInterval(function(){if(!document.hidden)maj();},250)"), "l'observateur est posé avant le minuteur");

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
for (const f of ["bangers-400-latin", "russo-one-400-latin"]) {
  assert.ok(new RegExp('<link rel="preload" href="/fonts/' + f + '\\.woff2" as="font" type="font/woff2" crossorigin>').test(html), f + " doit être préchargée (sinon le texte change de taille au chargement)");
}
console.log("idle-cls-chargement-v1 : OK");
