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

// Merge rollback protection: retry before queue shift/reconcile.
const finishStart=source.indexOf("function terminerMutationInventaireIdleV160_");
const finishEnd=source.indexOf("\n      function envoyerProchaineMutationInventaireIdleV160_",finishStart);
const finish=source.slice(finishStart,finishEnd);
assert.match(finish,/mergeTransitoireV183/);
assert.match(finish,/tx\.retryCount\|\|0/);
assert.match(finish,/setTimeout\([\s\S]*envoyerProchaineMutationInventaireIdleV160_/);
assert.ok(
  finish.indexOf("if(mergeTransitoireV183")<
  finish.indexOf("idleInventoryMutationQueueV160.shift()"),
  "Un merge transitoirement échoué ne doit jamais être retiré/reconstruit avant ses retries."
);

// Same boost definition must merge until its Item List completion is reached.
const mergeUiStart=source.indexOf("function fusionnerSiPossibleAdventureIdleV138_");
const mergeUiEnd=source.indexOf("\n      function boosterObjetParIdAdventureIdleV47_",mergeUiStart);
const mergeUi=source.slice(mergeUiStart,mergeUiEnd);
assert.match(mergeUi,/const memeDefinition=/);
assert.match(mergeUi,/const boostDejaComplete=/);
assert.match(mergeUi,/if\(memeDefinition&&!boostDejaComplete\)/);
assert.doesNotMatch(
  mergeUi,
  /source\.kind!=='boost'&&\s*cible\.kind!=='boost'/,
  "Les boosts identiques ne doivent plus être exclus de la fusion."
);

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
