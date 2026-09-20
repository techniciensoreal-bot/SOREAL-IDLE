import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47,
  idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.match(
  ui,
  /function idsFusionAdventureIdleV169_\([\s\S]{0,500}return \{a:cible,b:source\};/,
  "Objet 2 / cible doit toujours être le survivant de la fusion."
);
assert.doesNotMatch(
  ui,
  /return cibleEquipe\s*\?\s*\{a:cible,b:source\}\s*:\s*\{a:source,b:cible\}/,
  "L'ancienne inversion de fusion sac-sur-sac ne doit plus exister."
);

assert.match(
  ui,
  /function supprimerObjetAdventureIdleV165_\(id\)\{\s*mettreObjetDansTrashAdventureIdleV165_\(id\);\s*\}/,
  "Le bouton Supprimer doit envoyer dans Trash, jamais appeler discard."
);

// L'appui long a été extrait du contrôleur V180 : il est couvert par\n// idle-inventory-gestures-v200.test.mjs et son module long-press-v200.js.\n\nassert.match(
  ui,
  /function appliquerDepotPointerAdventureIdleV180_\(/,
  "Un vrai chemin de drop PointerEvent mobile doit exister."
);
assert.match(
  ui,
  /document\.elementFromPoint\(/,
  "Le drag tactile doit résoudre la cible située sous le doigt."
);
assert.match(
  ui,
  /surInteractionInventaireV180[\s\S]{0,500}soreal-idle-v138-bag-card\[data-item-id\][\s\S]{0,500}soreal-idle-v138-slot\[data-occupant-id\]/,
  "Le swipe global doit être désarmé quand le geste commence sur un item."
);
assert.match(
  ui,
  /\.soreal-idle-v138-bag-card\[data-item-id\],[\s\S]{0,160}\.soreal-idle-v138-slot\[data-occupant-id\][\s\S]{0,100}touch-action:none/,
  "Les objets tactiles doivent posséder le geste au lieu de le céder au navigateur."
);

function act(state,payload){
  return applyIdleAdventureActionV47(state,payload,{bosses:4},Date.now()).state;
}

let state=createIdleAdventureStateV47();
state=act(state,{action:"addItem",definitionId:"training:weapon",level:2});
state=act(state,{action:"addItem",definitionId:"training:weapon",level:3});
let weapons=state.inventory.filter(x=>x.definitionId==="training:weapon");
assert.equal(weapons.length,2);

const source=weapons[0];
const target=weapons[1];

state=act(state,{action:"equip",id:source.id,slot:"weapon"});
assert.equal(state.equipment.weapon,source.id);

state=act(state,{action:"merge",a:target.id,b:source.id});
assert.ok(state.inventory.some(x=>x.id===target.id),"Objet 2 doit survivre.");
assert.ok(!state.inventory.some(x=>x.id===source.id),"Objet 1 doit être absorbé.");
assert.equal(
  state.equipment.weapon,
  target.id,
  "Si l'objet 1 était équipé, l'objet 2 survivant doit reprendre son emplacement."
);

state=act(state,{action:"trashPut",id:target.id});
const snap=idleAdventureSnapshotV47(state,4);
assert.equal(snap.trash.id,target.id,"Supprimer doit placer l'objet dans la Trash récupérable.");
assert.equal(state.equipment.weapon,"","Un objet envoyé à la Trash doit être déséquipé atomiquement.");
assert.ok(!snap.inventory.some(x=>x.id===target.id),"L'objet en Trash ne doit plus occuper le sac.");

console.log("Inventory interactions V180: OK");
