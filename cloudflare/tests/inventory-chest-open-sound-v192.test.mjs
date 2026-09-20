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

console.log("Inventory chest opening sound: OK");
