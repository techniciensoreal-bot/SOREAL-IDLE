import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1
} from "../src/idle-adventure-v47.js";

const ctx={
  bosses:999,
  difficulty:"normal",
  difficultyPeaks:{normal:999,difficile:0,extreme:0},
  stats:{power:1e9,toughness:1e9,hp:1e9,regen:0}
};

let state=createIdleAdventureStateV47();
function act(payload,context=ctx,now=1){
  const out=applyIdleAdventureActionV47(state,payload,context,now);
  state=out.state;
  return out;
}

// Inventory reorder must land in the exact requested index.
const r1=act({action:"addItem",definitionId:"training:weapon",level:10}).result;
const r2=act({action:"addItem",definitionId:"training:head",level:10}).result;
act({action:"reorderInventory",sourceId:r2.id,targetId:"",targetIndex:0});
assert.equal(state.inventorySlots[0],r2.id);

// Bag -> bag: A survives, B is absorbed.
const first=act({action:"addItem",definitionId:"training:chest",level:10}).result;
const second=act({action:"addItem",definitionId:"training:chest",level:10}).result;
act({action:"merge",a:first.id,b:second.id});
assert.ok(state.inventory.some(x=>x.id===first.id));
assert.ok(!state.inventory.some(x=>x.id===second.id));

// Bag -> equipped identical item: equipped target survives by passing it as A.
const bag=act({action:"addItem",definitionId:"training:boots",level:10}).result;
const equipped=act({action:"addItem",definitionId:"training:boots",level:10}).result;
act({action:"equip",id:equipped.id,slot:"boots"});
act({action:"merge",a:equipped.id,b:bag.id});
assert.equal(state.equipment.boots,equipped.id);
assert.ok(state.inventory.some(x=>x.id===equipped.id));
assert.ok(!state.inventory.some(x=>x.id===bag.id));

// Real NGU set completion = every set item reached level 100.
// "Fully boosted" is intentionally tracked separately for Collection.
for(const slot of ["head","chest","legs","boots","weapon"]){
  act({action:"addItem",definitionId:"training:"+slot,level:100});
}
assert.equal(state.completedSets.training,true);
assert.equal(state.setRewards.energySpeed,2);
assert.equal(state.permanent.energySpeedFlat,2);
assert.ok(state.permanent.experience>=10);

let snapshot=idleAdventureSnapshotV47(state,999,"normal",ctx.difficultyPeaks);
assert.equal(snapshot.itemList["training:weapon"].maxed,true);
assert.equal(
  snapshot.itemList["training:weapon"].fullyMaxed,
  false,
  "A level-100 weapon with an unfilled Power cap must not be 100% in Collection."
);

// Filling the only applicable stat to cap makes it fully maxed permanently.
const weapon=state.inventory.find(x=>x.definitionId==="training:weapon"&&x.level===100);
const boost=idleAdventureBoostV1("power",10);
idleAdventureAddItemV1(state,boost);
act({action:"boost",boostId:boost.id,targetId:weapon.id});
snapshot=idleAdventureSnapshotV47(state,999,"normal",ctx.difficultyPeaks);
assert.equal(snapshot.itemList["training:weapon"].fullyMaxed,true);

// Tutorial Boost 1 unlocks when the WHOLE Training set has been discovered,
// not only after every piece has already reached level 100.
// Wiki wording is "only after unlocking whole Training (set)"; NGU's Item List
// separately calls level-100 sets "completed".
{
  let gateState=createIdleAdventureStateV47();
  const gateAct=(payload,now=1)=>{
    const out=applyIdleAdventureActionV47(gateState,payload,ctx,now);
    gateState=out.state;
    return out;
  };

  // Four of five Training definitions seen: a forced-success RNG must still
  // NOT create a Tutorial boost.
  for(const slot of ["weapon","head","chest","legs"]){
    gateAct({action:"addItem",definitionId:"training:"+slot,level:10});
  }
  gateAct({action:"selectZone",zone:"tutorial"});
  const randomBefore=Math.random;
  try{
    Math.random=()=>0;
    const beforeUnlock=gateAct({action:"zoneKill"},{...ctx,forceBoss:false},50);
    assert.ok(
      !(beforeUnlock.result.drops||[]).some(x=>x&&x.kind==="boost"),
      "Tutorial Boost 1 must stay locked until all five Training items have been discovered."
    );
  }finally{
    Math.random=randomBefore;
  }

  // Discovering the fifth item unlocks the 15% Tutorial boost roll even
  // though the set is nowhere near level 100 completion.
  gateAct({action:"addItem",definitionId:"training:boots",level:10});
  assert.equal(gateState.completedSets.training,undefined);
  try{
    Math.random=()=>0;
    const afterUnlock=gateAct({action:"zoneKill"},{...ctx,forceBoss:false},51);
    assert.ok(
      (afterUnlock.result.drops||[]).some(x=>x&&x.kind==="boost"&&x.strength===1),
      "Tutorial Boost 1 must drop after all Training items are discovered, without requiring level-100 set completion."
    );
  }finally{
    Math.random=randomBefore;
  }
}

// Tutorial Boost 1 really drops at its documented 15% roll once Training set is unlocked.
act({action:"selectZone",zone:"tutorial"});
const originalRandom=Math.random;
let kill;
try{
  Math.random=()=>0;
  kill=act({action:"zoneKill"},{...ctx,forceBoss:false},100);
}finally{
  Math.random=originalRandom;
}
assert.ok(
  (kill.result.drops||[]).some(x=>x&&x.kind==="boost"&&x.strength===1),
  "A successful Tutorial Boost 1 roll must create a real boost item."
);

// Fresh item current stat may never exceed its cap at its current level.
// A Stick max lvl100 Power=6 => lvl0 base cap=3 => lvl10 cap=3.3.
const stick=(kill.result.drops||[]).find(x=>x&&x.definitionId==="training:weapon");
assert.ok(stick);
assert.ok(Number(stick.power)<=3.3000001);

console.log("idle-adventure-inventory-sets-boosts-regression: OK");
