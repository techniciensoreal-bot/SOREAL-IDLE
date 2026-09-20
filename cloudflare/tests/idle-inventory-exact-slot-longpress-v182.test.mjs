import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

// 1) Empty slot DOM must always carry the current visual slot index.
assert.match(
  ui,
  /function noeudVideSacInventaireIdleV160_\(index\)[\s\S]{0,500}node\.dataset\.slotIndex=String\(index\)/,
  "Une case vide créée dynamiquement doit exposer data-slot-index."
);
assert.match(
  ui,
  /node=vides\.shift\(\)\|\|noeudVideSacInventaireIdleV160_\(desc\.index\)[\s\S]{0,700}node\.dataset\.slotIndex=String\(desc\.index\)[\s\S]{0,500}__deposerSurEmplacementVideSacAdventureIdleV1__/,
  "Une case vide réutilisée doit actualiser son index ET son ondrop."
);

// 2) Equipped -> empty slot must carry the exact requested targetIndex.
assert.match(
  ui,
  /function desequiperObjetAdventureIdleV47_\(id,targetIndex\)[\s\S]{0,450}payload\.targetIndex=idleEntier_\(targetIndex\)/,
  "Le déséquipement par drag doit transporter la case cible."
);
assert.match(
  ui,
  /if\(estEquipe\)\{\s*desequiperObjetAdventureIdleV47_\([\s\S]{0,120}targetIndex/,
  "Le drop desktop d'un objet équipé doit conserver la case visée."
);
assert.match(
  ui,
  /if\(estEquipe\)\{\s*desequiperObjetAdventureIdleV47_\([\s\S]{0,220}data-slot-index/,
  "Le drop tactile d'un objet équipé doit conserver la case visée."
);

// 3) Les gestes mobiles sont désormais couverts par idle-inventory-gestures-v200.test.mjs.\n// Ce test V182 ne verrouille plus l'ancien contrôleur tactile intégré.\n\n// Engine: equipped item must land in the exact requested empty slot.
let state=createIdleAdventureStateV47();
state=applyIdleAdventureActionV47(
  state,
  {action:"addItem",definitionId:"training:weapon",level:0},
  {bosses:4},
  1
).state;

const weapon=state.inventory.find(x=>x.definitionId==="training:weapon");
assert.ok(weapon);

state=applyIdleAdventureActionV47(
  state,
  {action:"equip",id:weapon.id,slot:"weapon"},
  {bosses:4},
  2
).state;

state=applyIdleAdventureActionV47(
  state,
  {action:"unequip",id:weapon.id,targetIndex:17},
  {bosses:4},
  3
).state;

const snap=idleAdventureSnapshotV47(state,4);
assert.equal(
  snap.inventorySlots[17],
  weapon.id,
  "Un objet déséquipé par drag doit rester exactement dans la case visée."
);
assert.equal(state.equipment.weapon,"");

console.log("Inventory exact slot V182: OK — gestes mobiles couverts par V200.");
