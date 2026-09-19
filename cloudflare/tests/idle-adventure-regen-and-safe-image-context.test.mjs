import assert from "node:assert/strict";
import { applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Regen Adventure : la fiche doit afficher la stat canonique de l'objet,
 * jamais le multiplicateur de repos Safe Zone.
 */
let state=null;

let r=applyIdleNguAction(
  state,
  {action:"adventure",adventure:{action:"addItem",definitionId:"training:legs",level:0}},
  {bosses:4},
  1
);
state=r.state;
const legs=r.result;
assert.ok(legs&&legs.id,"Le pantalon Training doit être créé.");

r=applyIdleNguAction(
  state,
  {action:"adventure",adventure:{action:"equip",id:legs.id,slot:"legs"}},
  {bosses:4},
  2
);
state=r.state;

let snap=idleNguSnapshot(state,{bosses:4},3);
assert.equal(
  snap.adventure.stats.regenBase,
  1,
  "La regen de base Adventure doit rester 1/s."
);
assert.equal(
  snap.adventure.stats.regen,
  1,
  "Un objet de fixture créé à 0/maximum ne doit pas inventer de régén avant d'avoir réellement reçu des points de Toughness."
);

/*
 * Le contexte visuel de Safe Zone survit au KO : dernière zone réellement
 * combattue, pas simplement selectedZone='safe'.
 */
r=applyIdleNguAction(
  state,
  {action:"adventure",adventure:{action:"selectZone",zone:"tutorial"}},
  {bosses:4},
  4
);
state=r.state;

const originalRandom=Math.random;
try{
  Math.random=()=>0.99;
  r=applyIdleNguAction(
    state,
    {action:"adventure",adventure:{action:"startZoneFight",restHp:50}},
    {bosses:4},
    5
  );
}finally{
  Math.random=originalRandom;
}
state=r.state;
assert.equal(state.adventure.lastCombatZone,"tutorial");

r=applyIdleNguAction(
  state,
  {action:"adventure",adventure:{action:"loseZoneFight"}},
  {bosses:4},
  6
);
state=r.state;

snap=idleNguSnapshot(state,{bosses:4},7);
assert.equal(snap.adventure.selectedZone,"safe");
assert.equal(
  snap.adventure.lastCombatZone,
  "tutorial",
  "Après KO, la Safe Zone doit garder l'image de la dernière zone combattue."
);

console.log("idle-adventure-regen-and-safe-image-context: OK");
