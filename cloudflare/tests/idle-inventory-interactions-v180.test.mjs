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
const css=readFileSync(
  new URL("../public/soreal-idle-ui.css",import.meta.url),
  "utf8"
);

/* Norman (2026-10-14) : le dépôt sur un autre objet ne fusionne plus, et un simple appui ouvre la fiche (plus de sélection). */
assert.ok(
  !ui.includes("idsFusionAdventureIdleV169_")&&!ui.includes("fusionnerSiPossibleAdventureIdleV138_")&&!ui.includes("fusionnerObjetAdventureIdleV47_"),
  "Plus aucune fusion par dépôt sur un autre objet."
);

assert.match(
  ui,
  /function supprimerObjetAdventureIdleV165_\(id\)\{\s*mettreObjetDansTrashAdventureIdleV165_\(id\);\s*\}/,
  "Le bouton Supprimer doit envoyer dans Trash, jamais appeler discard."
);

// L'appui long a été extrait du contrôleur V180 : il est couvert par
// idle-inventory-gestures-v200.test.mjs et son module long-press-v200.js.

assert.match(
  ui,
  /function appliquerDepotGesteAdventureIdleV196_\(/,
  "Le contrôleur PointerEvent V196 doit conserver un vrai chemin de drop mobile."
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
  css,
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
