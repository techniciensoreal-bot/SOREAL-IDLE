import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « certains boutons, quand ils sont pressés, ont un cadre bleu, comme quand on sélectionne du texte : neutralise ce comportement sur l'intégralité du jeu »
 * et « l'inventaire clignote une fraction de seconde parfois ».
 */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// Plus de surlignage du toucher, plus de sélection de texte, sauf dans les champs de saisie (et l'administration).
assert.ok(css.includes("html,html body{-webkit-tap-highlight-color:rgba(0,0,0,0);-webkit-touch-callout:none}"), "surlignage du toucher supprimé");
assert.ok(css.includes("html body{-webkit-user-select:none;user-select:none}"), "texte non sélectionnable sur tout le jeu");
assert.ok(/html body input,html body textarea,html body select,[^{]*\{-webkit-user-select:text;user-select:text/.test(css), "les champs de saisie gardent la sélection");
assert.ok(css.includes('html body .soreal-idle-page-root-v28[data-menu="admin"]'), "l'administration garde la sélection");

// L'inventaire (sac et équipement) ne retire plus puis remet toutes ses cases : il ne touche qu'à ce qui change.
const sac = ui.slice(ui.indexOf("function patchGrilleSacInventaireIdleV160_("), ui.indexOf("function htmlEquipementInventaireIdleV160_("));
assert.ok(!sac.includes("root.replaceChildren("), "sac : plus d'appel à replaceChildren");
assert.ok(sac.includes("actuels.every(function(n,i){return n===noeudsFinaux[i];}))return true;"), "sac : rien n'est touché si la page est identique");
const equip = ui.slice(ui.indexOf("function patchEquipementInventaireIdleV160_("), ui.indexOf("function trouverSectionParTitreInventaireIdleV160_("));
assert.ok(!equip.includes("courantPaper.replaceChildren("), "équipement : plus d'appel à replaceChildren");
assert.ok(equip.includes("actuelsPaper.every("), "équipement : rien n'est touché si tout est identique");
console.log("idle-sans-cadre-bleu-inventaire-stable-v1: OK");
