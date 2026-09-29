import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Ce fichier testait à l'origine (2026-09-29, plus tôt) un rendu RAF séparé
 * (rafraichirVisuelsFluidesIdleV221_) qui interpolait le rebond de tick de la barre d'Énergie/Magie
 * à la fréquence native de l'écran. Norman (même jour, revirement assumé) : « Je ne veux plus qu'elle
 * tique !!! elle doit simplement se remplir et se vider quand on place de l'énergie. Aucune animation
 * de tique par seconde. » -- le rebond lui-même a été retiré (voir idle-energy-tick-bounce-v1.test.mjs),
 * donc plus rien à interpoler entre deux tics lourds : le rendu RAF séparé est retiré avec lui.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// La simulation lourde reste volontairement plafonnée à 15 Hz (coût DOM/calcul, freezes iPhone/Safari).
assert.ok(ui.includes("const intervalleFrameJeuVisibleV214=1000/15;"));
assert.ok(ui.includes("maintenantFrame-dernierFrameJeuVisibleV214>=intervalleFrameJeuVisibleV214"));
assert.ok(ui.includes("mettreAJourJeuIdleLocalV7_();"));

// Plus de second rendu séparé à la fréquence native de l'écran : la boucle rAF ne fait plus que le tic lourd.
assert.ok(!ui.includes("function rafraichirVisuelsFluidesIdleV221_("), "le rendu fluide séparé (V221) doit être retiré, plus rien à interpoler sans le rebond de tick");
assert.ok(!ui.includes("rafraichirVisuelsFluidesIdleV221_();"), "plus aucun appel à ce rendu retiré");

const loopStart = ui.indexOf("function frameJeuV214_(timestamp)");
const loopEnd = ui.indexOf("requestAnimationFrame(frameJeuV214_)", loopStart);
const loop = ui.slice(loopStart, loopEnd);
assert.ok(loopStart >= 0 && loopEnd > loopStart, "boucle rAF présente");
assert.match(loop, /mettreAJourJeuIdleLocalV7_\(\);\s*\}\s*\n\s*if\(PAGE_ACTIVE==='idle'\)\{/, "la boucle rAF ne déclenche plus que le tic lourd, rien d'autre entre les deux");

// La barre d'Énergie/Magie est posée directement depuis la valeur connue -- aucune interpolation de tick.
assert.match(
  ui,
  /function mettreAJourBarreProgressionContinueV1_\(\s*element,\s*valeurActuelle,\s*valeurMax\s*\)\{/,
  "signature simplifiée : plus de paramètre de progression/gain de tick à interpoler"
);

console.log("idle-smooth-visual-rendering: OK (rendu RAF séparé retiré, plus de barre qui tique)");
