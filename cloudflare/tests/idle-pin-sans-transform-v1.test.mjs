import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Mini mouvement de la page quand on presse une touche de Wandoos ou « Trier » (Norman, 2026-10-08) : le bouton pressé s'enfonce de quelques pixels (:active), et la page se recalait sur ce décalage.
 * Les trois mesures de position du bouton cliqué ignorent maintenant sa transformation.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function hautSansTransformIdleV1_(e){");
assert.ok(debut > 0, "mesure sans transformation présente");
const src = ui.slice(debut, ui.indexOf("\n      }\n", debut) + 9);
function mesure(rectTop, transform) {
  const fenetre = { getComputedStyle: () => ({ transform }) };
  return new Function("window", src + "\nreturn hautSansTransformIdleV1_;")(fenetre)({ getBoundingClientRect: () => ({ top: rectTop }) });
}
assert.equal(mesure(300, "none"), 300, "sans transformation");
assert.equal(mesure(302, "matrix(1, 0, 0, 1, 0, 2)"), 300, "bouton enfoncé de 2 px : même position qu'au repos");
assert.ok(Math.abs(mesure(302.6, "matrix(1, 0, 0, 1, 0, 2.6)") - 300) < 1e-9, "touche de Wandoos enfoncée de 0,7 cqw");
assert.equal(mesure(310, "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,10,0,1)"), 300, "matrice 3D");
assert.equal(mesure(300, ""), 300);
// Branchement : épingle de clic, mesure initiale et ancre de rendu
assert.ok(ui.includes("const hautStable=hautSansTransformIdleV1_(el);") && ui.includes("const dy=hautSansTransformIdleV1_(e)-pin.haut;") && ui.includes("hautSansTransformIdleV1_(el)-ancre.haut") && ui.includes("signatureClicIdleV1_(c.el,racine,chemin,hautSansTransformIdleV1_(c.el))"), "les trois mesures ignorent la transformation");
console.log("idle-pin-sans-transform-v1: OK");
