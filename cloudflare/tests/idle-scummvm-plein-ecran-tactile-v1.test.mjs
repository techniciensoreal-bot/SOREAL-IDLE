/* Énigmes sur téléphone (Norman, 2026-11-23) : (1) « en plein écran l'image est minuscule » : un iframe est un élément remplacé, width/height:auto = 300 x 150 ; la règle doit donner une taille explicite ; (2) « le tactile ne fonctionne pas » : la couche au-dessus du jeu envoyait des événements de souris SIMULÉS que ScummVM ignore (mesuré dans le navigateur : le clic réel passe, le clic simulé non) ; plus aucune couche : le toucher natif devient un vrai clic. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("cloudflare/public/soreal-idle-scummvm-v1.css", "utf8");
const js = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");

const regle = /#scvHoteV1\.scv-plein iframe\{([^}]*)\}/.exec(css);
assert.ok(regle, "règle du plein écran pour l'iframe");
assert.ok(!/width:\s*auto|height:\s*auto/.test(regle[1]), "pas de width/height:auto (un iframe reprendrait 300 x 150) : " + regle[1]);
assert.ok(/width:calc\(100%/.test(regle[1]) && /height:calc\(100%/.test(regle[1]), "taille explicite (tout l'écran moins les zones sûres)");

assert.ok(!/scv-voile/.test(css), "plus de couche tactile dans la feuille de style");
assert.ok(!/monterVoile|envoyerSouris|new w\.MouseEvent|dispatchEvent\(new/.test(js), "plus d'événements de souris simulés envoyés au jeu");
assert.ok(!/addEventListener\('touch(start|move|end)'/.test(js), "aucun écouteur tactile qui intercepterait les touchers du jeu");
console.log("idle-scummvm-plein-ecran-tactile-v1: OK");
