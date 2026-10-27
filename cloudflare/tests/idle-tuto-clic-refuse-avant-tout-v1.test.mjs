import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-27) : pendant l'étape « clique sur Fight », il a pu appuyer sur le play de la carte de chronique d'un boss : la chronique a été lue et le tutoriel interrompu.
 * Cause : le refus des clics était un écouteur de capture sur `document`, or tutorial-tts-v202.js (chargé avant) pose le sien sur `document` aussi, pour [data-soreal-tts-target] : il passait en premier et lançait la lecture.
 * Remède : les refus sont posés sur `window` (la capture de window précède celle de document) et couvrent aussi touchstart / touchend.
 */
const src = readFileSync("cloudflare/public/modules/tutoriel-v1.js", "utf8");
const debut = src.indexOf("['click','pointerdown'");
assert.ok(debut > 0);
const bloc = src.slice(debut, src.indexOf("});", debut) + 3);
assert.ok(bloc.includes("window.addEventListener(nom,") && !bloc.includes("document.addEventListener(nom,"), "refus posés sur window");
assert.ok(/},true\);\s*\}\);$/.test(bloc.trim()), "en phase de capture");
for (const nom of ["click", "pointerdown", "mousedown", "pointerup", "touchstart", "touchend"]) assert.ok(bloc.includes("'" + nom + "'"), nom + " refusé");
assert.ok(bloc.includes("ev.stopImmediatePropagation()"), "arrêt immédiat");

// le bouton de lecture d'une carte est bien un écouteur de capture sur document, qui passerait avant un refus posé sur document
const tts = readFileSync("cloudflare/public/modules/tutorial-tts-v202.js", "utf8");
assert.ok(/document\.addEventListener\('click',function\(e\)\{\s*var target=e\.target&&e\.target\.closest\s*\?e\.target\.closest\('\[data-soreal-tts-target\]'\)/.test(tts), "garde : le bouton « lire » écoute sur document");
console.log("idle-tuto-clic-refuse-avant-tout-v1: OK");
