import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

const audio=readFileSync(
  new URL("../public/modules/audio-effects-v199.js",import.meta.url),
  "utf8"
);

const index=readFileSync(
  new URL("../public/index.html",import.meta.url),
  "utf8"
);

/*
 * V199 : le Coffre ne doit PLUS créer son propre AudioContext dans l'UI.
 * Tous les sons passent par l'ordonnanceur audio partagé afin qu'aucun
 * effet ne puisse se superposer avec Fight, défaite, forge, boosts, etc.
 */
assert.match(
  index,
  /modules\/audio-effects-v199\.js\?v=199/,
  "Le moteur audio partagé V199 doit être chargé par le frontend autonome."
);

assert.match(
  audio,
  /chestOpen:coffreOuverture_/,
  "Le moteur V199 doit exposer le son d'ouverture du Coffre."
);

assert.match(
  audio,
  /chestClose:coffreFermeture_/,
  "Le moteur V199 doit exposer un son de fermeture distinct."
);

assert.doesNotMatch(
  ui,
  /function jouerSonOuvertureCoffreIdleV1_\(\)[\s\S]*?AudioContext\|\|window\.webkitAudioContext/,
  "Le Coffre ne doit plus créer un AudioContext local qui contourne le scheduler."
);

const toggleStart=ui.indexOf("function toggleCoffreOuvertAdventureIdleV1_");
const toggleEnd=ui.indexOf("window.__toggleCoffreOuvertAdventureIdleV1__",toggleStart);
assert.ok(toggleStart>=0&&toggleEnd>toggleStart,"Toggle du Coffre introuvable.");
const toggle=ui.slice(toggleStart,toggleEnd);

assert.match(
  toggle,
  /if\(!actuel\)\{[\s\S]*?jouerSonOuvertureCoffreIdleV1_\(\)/,
  "L'ouverture doit demander le son d'ouverture."
);

assert.match(
  toggle,
  /else\{[\s\S]*?jouerSonFermetureCoffreIdleV197_\(\)/,
  "La fermeture doit demander son effet dédié et distinct."
);

assert.match(
  ui,
  /function jouerSonOuvertureCoffreIdleV1_\(\)\{[\s\S]*?jouerEffetAudioIdleV199_\('chestOpen'\)/,
  "L'ouverture du Coffre doit passer par l'ordonnanceur V199."
);

assert.match(
  ui,
  /function jouerSonFermetureCoffreIdleV197_\(\)\{[\s\S]*?jouerEffetAudioIdleV199_\('chestClose'\)/,
  "La fermeture du Coffre doit passer par l'ordonnanceur V199."
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

console.log("Inventory chest audio V199 scheduler: OK");
