import assert from "node:assert/strict";
import fs from "node:fs";

/* Entraînement avancé (Norman, 2026-11-11) : la hauteur des lignes ne dépend pas du texte d'état du moment, donc aucun clic ne fait glisser la page ni la barre des menus. */
const mod = fs.readFileSync("cloudflare/public/modules/at-hauteur-stable-v1.js", "utf8");
const css = fs.readFileSync("cloudflare/public/soreal-idle-stabilite-v1.css", "utf8");
const html = fs.readFileSync("cloudflare/public/index.html", "utf8");
const page = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
assert.ok(/--at-detail-h/.test(mod) && /min-height:var\(--at-detail-h/.test(css), "la zone d'état réserve la hauteur du pire texte");
assert.ok(!/setInterval/.test(mod), "aucune minuterie : mesure après chaque redessin seulement");
assert.ok(html.includes("soreal-idle-stabilite-v1.css") && html.includes("at-hauteur-stable-v1.js"), "feuille et module chargés");
for (const t of ["Niveau suivant dans ", "50 niveaux par seconde (maximum)", "Place de l’énergie pour progresser.", "Target atteint"]) {
  assert.ok(page.includes(t) && mod.includes(t.replace(/^Niveau suivant dans $/, "Niveau suivant dans ")), "le pire texte couvre : " + t);
}
console.log("idle-at-hauteur-stable-v1: OK");
