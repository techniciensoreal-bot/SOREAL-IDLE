import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-04) : les tuiles du haut (Nombre, Rebirths, Attack…) ont chacune leur couleur pour être identifiées plus vite, et un style plus soigné. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
/* Depuis le 2026-10-08, Nombre, Rebirths et Run ont quitté les tuiles (ils sont dans la page Renaissance) : il reste Attaque, Défense, Or, EXP, AP. */
const ids = ["attack", "defense", "gold", "exp", "ap"];
const debut = ui.indexOf('<div class="soreal-idle-summary-grid-v28">');
const bloc = ui.slice(debut, ui.indexOf("</div>\n        `;", debut));
for (const id of ids) assert.ok(bloc.includes(`data-tuile="${id}"`), "tuile " + id);
assert.equal((bloc.match(/data-tuile=/g) || []).length, 5, "cinq tuiles marquées");
// Chaque chiffre a sa couleur propre, et la règle de couleur l'emporte sur la couleur neutre par défaut (même sélecteur de base + attribut).
const couleurs = ids.map((id) => {
  const cle = `.soreal-idle-summary-grid-v28 .soreal-idle-summary-v28[data-tuile="${id}"]{--tc:`;
  const i = css.indexOf(cle);
  assert.ok(i > 0, "couleur de " + id);
  return css.slice(i + cle.length, i + cle.length + 7);
});
assert.equal(new Set(couleurs).size, 5, "cinq couleurs différentes : " + couleurs.join(" "));
assert.ok(css.includes(".soreal-idle-summary-v28[data-tuile]{\n  --tc:#9aa5bb;"), "couleur neutre par défaut, plus faible que les couleurs par chiffre");
assert.ok(css.includes("border-left:4px solid var(--tc)!important") && css.includes("sorealTuileReflet"), "bande d'accent et reflet");
assert.ok(css.includes("@media (prefers-reduced-motion:reduce)"), "reflet coupé si l'animation est réduite");
// La mise à jour en direct des chiffres ne dépend que des identifiants des valeurs : elle n'est pas touchée.
for (const idVal of ["sorealIdleSummaryAttackV50", "sorealIdleSummaryDefenseV50", "sorealIdleSummaryGoldV50", "sorealIdleSummaryExpV50", "sorealIdleSummaryApV210"]) assert.ok(bloc.includes(`id="${idVal}"`), idVal);
console.log("idle-tuiles-couleurs-v1: OK");
