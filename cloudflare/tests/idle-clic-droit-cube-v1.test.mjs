import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-05) : « sur PC, le clic droit sur le cube de l'infini absorbe tous les boosts comme pour les items, pas de règle à part ». */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("      function clicDroitCubeIdleV1_(){");
const b = ui.indexOf("      /* Triple tap : fusion automatique de l'objet");
assert.ok(a > 0 && b > a);
const envois = [];
function monde(gestes, cube) {
  envois.length = 0;
  return new Function("gestesAchetesIdleV1_", "idleEtat", "aventureMetaIdleV47_", "window", "nettoyerEtatDragAdventureIdleV138_", ui.slice(a, b) + "\nreturn clicDroitCubeIdleV1_;")(
    () => gestes, {}, () => ({ cube }), { __actionMetaV47__: (p) => envois.push(p) }, () => {});
}
// Même achat que pour les objets (Double tap) : le clic droit absorbe tous les boosts, par la même action que « A + clic » sur le cube.
assert.equal(monde({ double: true, triple: false }, { unlocked: true })(), true);
assert.deepEqual(envois, [{ action: "inventoryAuto", mode: "boostAll", targetId: "cube" }]);
assert.equal(monde({ double: true, triple: true }, { unlocked: true })(), true);
// Sans Double tap (comme pour un objet) ou sans cube débloqué : rien.
assert.equal(monde({ double: false, triple: true }, { unlocked: true })(), false);
assert.equal(monde({ double: true, triple: false }, { unlocked: false })(), false);
assert.equal(monde({ double: true, triple: false }, null)(), false);
assert.equal(envois.length, 0);
// Câblage : clic droit de la souris seulement, sur le cube du sac.
const ctx = ui.slice(ui.indexOf("        document.addEventListener('contextmenu',function(event){\n          /* Cube de l'infini"), ui.indexOf("        document.addEventListener('click',function(event){\n\n          /*\n           * Comparer"));
assert.ok(ctx.includes("closest('[data-idle-cube-drop-v180]')") && ctx.includes("soreal-idle-v151-inventory-columns") && ctx.includes("sourisCube&&clicDroitCubeIdleV1_()"));
console.log("idle-clic-droit-cube-v1: OK");
