import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.match(
  ui,
  /function jouerSonOuvertureCoffreIdleV1_\(\)[\s\S]*?AudioContext\|\|window\.webkitAudioContext/,
  "Le Coffre doit avoir un son d'ouverture Web Audio dédié."
);

const toggleStart=ui.indexOf("function toggleCoffreOuvertAdventureIdleV1_");
const toggleEnd=ui.indexOf("window.__toggleCoffreOuvertAdventureIdleV1__",toggleStart);
assert.ok(toggleStart>=0&&toggleEnd>toggleStart,"Toggle du Coffre introuvable.");
const toggle=ui.slice(toggleStart,toggleEnd);

assert.match(
  toggle,
  /if\(!actuel\)\{[\s\S]*?jouerSonOuvertureCoffreIdleV1_\(\)/,
  "Le son doit jouer uniquement quand le Coffre passe de fermé à ouvert."
);

assert.doesNotMatch(
  toggle,
  /if\(actuel\)[\s\S]*?jouerSonOuvertureCoffreIdleV1_\(\)/,
  "Fermer le Coffre ne doit pas rejouer le son d'ouverture."
);

const clickStart=ui.indexOf("function clicCoffreAdventureIdleV1_");
const clickEnd=ui.indexOf("window.__clicCoffreAdventureIdleV1__",clickStart);
assert.ok(clickStart>=0&&clickEnd>clickStart,"Clic direct sur le Coffre introuvable.");
const clickBlock=ui.slice(clickStart,clickEnd);
assert.match(
  clickBlock,
  /if\(!idleAdventureSelectionIdV138\)\{[\s\S]*?toggleCoffreOuvertAdventureIdleV1_\(\)/,
  "Un clic sur l'icône du Coffre sans objet sélectionné doit ouvrir/fermer le Coffre."
);

console.log("Inventory chest opening sound: OK");
