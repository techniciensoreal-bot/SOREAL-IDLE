import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

let state=createIdleAdventureStateV47();

let a=applyIdleAdventureActionV47(
  state,
  {action:"addItem",definitionId:"training:legs",level:10},
  {bosses:4},
  1
);
state=a.state;
const legs=a.result.id;

a=applyIdleAdventureActionV47(
  state,
  {action:"addItem",definitionId:"training:boots",level:10},
  {bosses:4},
  2
);
state=a.state;
const boots=a.result.id;

let snap=idleAdventureSnapshotV47(state,4);
const before=snap.inventorySlots.slice();
const legsPos=before.indexOf(legs);
const bootsPos=before.indexOf(boots);
assert.ok(legsPos>=0&&bootsPos>=0&&legsPos!==bootsPos);

state=applyIdleAdventureActionV47(
  state,
  {action:"reorderInventory",sourceId:legs,targetId:boots},
  {bosses:4},
  3
).state;

snap=idleAdventureSnapshotV47(state,4);
assert.equal(snap.inventorySlots[bootsPos],legs);
assert.equal(snap.inventorySlots[legsPos],boots);

state=applyIdleAdventureActionV47(
  state,
  {action:"reorderInventory",sourceId:legs,targetIndex:23},
  {bosses:4},
  4
).state;

snap=idleAdventureSnapshotV47(state,4);
assert.equal(snap.inventorySlots[23],legs);
assert.equal(
  snap.inventorySlots[bootsPos],
  "",
  "Déplacer vers une case vide doit laisser un vrai trou à l'ancienne position."
);
assert.equal(snap.inventorySlots.length,24);

console.log("idle-adventure-inventory-order-v162: OK");
