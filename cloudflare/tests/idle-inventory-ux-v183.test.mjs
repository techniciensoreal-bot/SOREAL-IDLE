import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);
const css=readFileSync(
  new URL("../public/soreal-idle-ui.css",import.meta.url),
  "utf8"
);
const textTransforms=readFileSync(
  new URL("../public/modules/text-transforms-v1.js",import.meta.url),
  "utf8"
);

// 69 lol: exact 69 only.
assert.match(source,/function texte69LolIdleV183_/);
assert.match(textTransforms,/\(\^\|\[\^0-9\.,\]\)69\(\?=\$\|\[\^0-9\.,\]\)/);
assert.match(source,/installer69LolIdleV183_\(\)/);

// Norman (2026-10-14) : plus de fusion par dépôt sur un autre objet — ni action 'merge' côté client, ni nouvelle tentative de fusion.
assert.ok(!source.includes("mergeTransitoireV183")&&!source.includes("fusionnerSiPossibleAdventureIdleV138_")&&!source.includes("action==='merge'"),"Plus aucune fusion par dépôt.");
const depotStart=source.indexOf("function deposerSurCarteAdventureIdleV138_");
const depotEnd=source.indexOf("\n      function boosterObjetParIdAdventureIdleV47_",depotStart);
const depot=source.slice(depotStart,depotEnd);
assert.ok(depotStart>0&&depot.includes("boosterObjetParIdAdventureIdleV47_(source.id,cible.id)")&&depot.includes("reordonnerInventaireAdventureIdleV162_(source.id,cible.id,null)")&&!/definitionId/.test(depot),"Un dépôt sur une carte améliore (boost) ou déplace, sans jamais fusionner.");

// Transparent item ghost follows the finger.
assert.match(source,/function creerGhostDragAdventureIdleV183_/);
assert.match(css,/opacity:\.58/);
assert.match(source,/deplacerGhostDragAdventureIdleV183_\(event\)/);

// Compare mode: a second real popup is created.
assert.match(source,/>⚖️ Comparer<\/button>/);
assert.match(source,/function ouvrirComparaisonObjetAdventureIdleV183_/);
assert.match(source,/soreal-idle-v138-details-compare-v183/);
assert.match(source,/cloneNode\(true\)/);
assert.match(source,/Choisis maintenant le deuxième objet à comparer/);

console.log("Inventory UX V183: OK");
