import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « J'aimerai que l'ordre des statistiques pour tous les objets soit changé. Dans NGU, c'est comme ça :
 * Power / Max HP / Toughness / HP Regen. Et en dessous les bonus spéciaux... Les 2 premières lignes se boostent avec les
 * boost oranges. Les 2 suivantes avec les boosts bleus et les spéciales avec les boosts jaunes. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("docs/UI-MONOLITH-HISTORY.md#bloc-268");
assert.ok(debut !== -1, "le bloc de construction des stats a bien été trouvé");
const fin = ui.indexOf("Special Bonus: ", debut);
assert.ok(fin !== -1 && fin > debut, "la fin du bloc (bonus spéciaux) a bien été trouvée");
const bloc = ui.slice(debut, fin);

const ordre = ["<span>Power</span>", "<span>Max HP</span>", "<span>Toughness</span>", "<span>HP Regen</span>"];
let curseur = -1;
for (const label of ordre) {
  const position = bloc.indexOf(label);
  assert.ok(position !== -1, `stat manquante : ${label}`);
  assert.ok(position > curseur, `ordre incorrect : ${label} doit venir après les stats précédentes`);
  curseur = position;
}
// Les bonus spéciaux (Special / Special Bonus) restent après les 4 stats de base (bornes du bloc analysé ci-dessus).
assert.ok(fin > curseur, "les bonus spéciaux restent affichés après Power/Max HP/Toughness/HP Regen");

console.log("idle-item-stats-order-v1: OK");
