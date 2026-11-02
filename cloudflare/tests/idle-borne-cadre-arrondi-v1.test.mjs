/* Borne de combat (Norman, 2026-11-02) : « les images ont des bords arrondis, pourtant on voit un coin noir du cadre ». Le cadre (portrait) de chaque image portait un fond sombre en dégradé avec border-radius:0 : son carré dépassait derrière les angles arrondis (14px) des images. Garde : le rayon du cadre est au moins celui des images, et la règle gagnante (celle qui impose le rayon) l'impose. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");
const itopod = lire("soreal-idle-itopod.css");
const ui = lire("soreal-idle-ui.css");

const rayonImages = Math.max(...[".soreal-idle-boss-image-v35{", ".soreal-idle-player-image-v41{"].map((s) => {
  const i = ui.indexOf(s); assert.ok(i >= 0, s);
  const m = /border-radius:(\d+)px/.exec(ui.slice(i, ui.indexOf("}", i))); assert.ok(m, "rayon de " + s);
  return +m[1];
}));
assert.ok(rayonImages >= 14);

// La règle de la borne qui fixe le cadre des images (avec !important, donc gagnante sur les thèmes).
const sel = '[data-menu="combat"] .soreal-idle-duel-portrait-v41{\n';
const i = itopod.indexOf(sel); assert.ok(i >= 0, "règle du cadre des portraits");
const corps = itopod.slice(i, itopod.indexOf("}", i));
const m = /border-radius:(\d+)px!important/.exec(corps);
assert.ok(m, "le cadre a un rayon imposé");
assert.ok(+m[1] >= rayonImages, "rayon du cadre (" + m[1] + ") >= rayon des images (" + rayonImages + ")");
assert.ok(!/border-radius:0/.test(corps), "plus de cadre carré");

// Aucune autre règle de la borne ne remet un cadre carré sur les portraits.
for (const r of itopod.matchAll(/duel-portrait-v41\s*\{[^}]*border-radius:0[^}]*\}/g)) assert.fail("cadre carré : " + r[0].slice(0, 120));
console.log("idle-borne-cadre-arrondi-v1 : OK");
