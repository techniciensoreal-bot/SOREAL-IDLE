import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « sur les items, dans le popup, les lignes qui se boostent avec des boosts Power écrites en orange (sauf les chiffres : juste Puissance, PV MAX, Endurance, REGEN PV, etc.).
 * Chaque intitulé doit avoir la couleur du boost qu'il nécessite. » Wiki NGU « Boost » : Power = orange (ajoute aussi à Max Health), Toughness = bleu (ajoute aussi à Health Regen), Specials = jaune.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Chaque intitulé a la couleur de SON boost : Puissance et PV Max -> Power ; Endurance et Regen PV -> Toughness ; Special -> Special.
const attendu = [
  ['<span class="sb-power-v1">Puissance</span>', 3],
  ['<span class="sb-power-v1">PV Max</span>', 2],
  ['<span class="sb-toughness-v1">Endurance</span>', 3],
  ['<span class="sb-toughness-v1">Regen PV</span>', 1],
  ['<span class="sb-toughness-v1">Regen PV/s</span>', 1],
  ['<span class="sb-special-v1">Special: ', 1],
  ['<span class="sb-special-v1">Special Bonus: ', 1]
];
for (const [fragment, n] of attendu) assert.equal(ui.split(fragment).length - 1, n, fragment + " : " + n + " occurrence(s)");
// Plus aucun intitulé de statistique sans couleur de boost.
for (const nu of ["<span>Puissance</span>", "<span>PV Max</span>", "<span>Endurance</span>", "<span>Regen PV</span>", "<span>Regen PV/s</span>", "<span>Special: ", "<span>Special Bonus: "]) {
  assert.ok(!ui.includes('details-stat">' + nu), "intitulé encore sans couleur : " + nu);
}
// Seuls les intitulés sont colorés : les chiffres (<b>) gardent leur couleur.
assert.ok(css.includes(".soreal-idle-v138-details-stat span.sb-power-v1{color:#ff9d2f}"));
assert.ok(css.includes(".soreal-idle-v138-details-stat span.sb-toughness-v1{color:#4da3ff}"));
assert.ok(css.includes(".soreal-idle-v138-details-stat span.sb-special-v1{color:#ffd84a}"));
assert.ok(!/details-stat b\.?[^{]*sb-(power|toughness|special)/.test(css), "aucune couleur de boost sur les chiffres");
console.log("idle-item-stats-couleurs-boost-v1 OK");
