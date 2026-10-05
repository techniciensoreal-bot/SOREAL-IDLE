import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Mesuré sur la partie B en ligne (Norman, 2026-10-05) : quand une barre d'Augment arrive au bout et que l'Or manque pour valider le niveau, l'animation du navigateur la renvoyait à zéro d'elle-même, puis le jeu la
 * remettait pleine une image plus tard (0,998 -> 0,001 -> 1). Pour les Augments, un cycle long s'arrête maintenant PLEIN au bout ; les rituels de Blood Magic bouclent toujours.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function animerBarreCycliqueIdleV217_(el,seconds,progress,tenir){");
assert.ok(debut > 0, "paramètre tenir");
const corps = ui.slice(debut, ui.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-39 */", debut));
assert.ok(corps.includes("iterations:1,fill:'forwards'"), "cycle long d'Augment : s'arrête plein au bout");
assert.ok(corps.includes("iterations:Infinity"), "les rituels et les cycles courts bouclent toujours");
assert.ok(corps.includes("playState==='finished'"), "une barre finie dont le jeu démarre un nouveau cycle est recréée");
// Augments : tenir ; Blood Magic : boucle.
assert.ok(/animerBarreCycliqueIdleV217_\(el,secondes,secondes>0\?[^;]*,true\);/.test(ui), "les Augments demandent à tenir");
assert.ok(ui.includes("animerBarreCycliqueIdleV217_(el,seconds,progress);"), "Blood Magic boucle");
console.log("idle-barre-augment-tient-v1: OK");
