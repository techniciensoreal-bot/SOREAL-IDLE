import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1
} from "../src/idle-adventure-v47.js";

function merge(s,a,b){
  return applyIdleAdventureActionV47(
    s,
    {action:"merge",a,b},
    {bosses:50},
    Date.now()
  ).state;
}

let state=createIdleAdventureStateV47();

const a=idleAdventureBoostV1("power",1);
const b=idleAdventureBoostV1("power",1);
a.level=49;
b.level=50;
idleAdventureAddItemV1(state,a);
idleAdventureAddItemV1(state,b);

state=merge(state,a.id,b.id);

const maxed=state.inventory.find(x=>x.id===a.id);
assert.ok(maxed,"Le boost cible doit survivre.");
assert.equal(maxed.level,100,"49 + 50 + 1 doit donner niveau 100.");
assert.equal(state.setRewards.boostCompletions,1);
assert.equal(state.setRewards.boostEffectiveness,.02);
assert.equal(
  state.itemList["boost:power:1"].boostCompletionRewardV183,
  true,
  "La récompense d'un boost précis doit être one-shot."
);

// La force brute d'un boost fusionné ne change pas.
assert.equal(maxed.strength,1);

// Une fois cette définition maxée, NGU ne fusionne plus ses copies.
const extra=idleAdventureBoostV1("power",1);
idleAdventureAddItemV1(state,extra);
assert.throws(
  ()=>applyIdleAdventureActionV47(
    state,
    {action:"merge",a:maxed.id,b:extra.id},
    {bosses:50},
    Date.now()
  ),
  /BOOST_DEJA_COMPLETE/
);

// Le bonus +2% augmente aussi la valeur totale envoyée au Cube.
state.cube.unlocked=true;
const cubeBoost=idleAdventureBoostV1("power",100);
idleAdventureAddItemV1(state,cubeBoost);
state=applyIdleAdventureActionV47(
  state,
  {action:"cube",boostId:cubeBoost.id},
  {bosses:50},
  Date.now()
).state;
assert.ok(
  Math.abs(state.cube.power-1.02)<1e-9,
  "Power Boost 100 avec +2% doit donner 1.02 Power au Cube à 1%."
);

// Migration: une ancienne sauvegarde avec un boost déjà maxé reçoit le bonus une fois.
let legacy=createIdleAdventureStateV47();
legacy.itemList["boost:special:5"]={seen:true,maxLevel:100};
legacy.setRewards.boostEffectiveness=0;
legacy.setRewards.boostCompletions=0;
legacy=normalizeIdleAdventureStateV47(legacy);
assert.equal(legacy.setRewards.boostEffectiveness,.02);
assert.equal(legacy.setRewards.boostCompletions,1);
legacy=normalizeIdleAdventureStateV47(legacy);
assert.equal(legacy.setRewards.boostEffectiveness,.02,"Aucun double crédit au second chargement.");
assert.equal(legacy.setRewards.boostCompletions,1);

console.log("Boost completion V183: OK");
