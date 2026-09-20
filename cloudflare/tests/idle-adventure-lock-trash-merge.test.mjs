import assert from "node:assert/strict";
import test from "node:test";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47,
  idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

function act(state,payload){
  return applyIdleAdventureActionV47(state,payload,{},Date.now()).state;
}

test("merge keeps the first selected object and consumes the second",()=>{
  let state=createIdleAdventureStateV47();
  state=act(state,{action:"addItem",definitionId:"training:weapon",level:2});
  state=act(state,{action:"addItem",definitionId:"training:weapon",level:3});
  const weapons=state.inventory.filter(x=>x.definitionId==="training:weapon");
  assert.equal(weapons.length,2);
  const first=weapons[0],second=weapons[1];

  state=act(state,{action:"merge",a:first.id,b:second.id});
  assert.ok(state.inventory.some(x=>x.id===first.id));
  assert.ok(!state.inventory.some(x=>x.id===second.id));
  assert.equal(state.inventory.find(x=>x.id===first.id).level,6);
});

test("locked objects cannot be destroyed by merge, delete or Trash",()=>{
  let state=createIdleAdventureStateV47();
  state=act(state,{action:"addItem",definitionId:"training:boots",level:0});
  state=act(state,{action:"addItem",definitionId:"training:boots",level:0});
  const boots=state.inventory.filter(x=>x.definitionId==="training:boots");
  state=act(state,{action:"setLock",id:boots[1].id,locked:true});
  assert.equal(idleAdventureSnapshotV47(state).inventory.find(x=>x.id===boots[1].id).locked,true);

  assert.throws(
    ()=>applyIdleAdventureActionV47(state,{action:"merge",a:boots[0].id,b:boots[1].id},{},Date.now()),
    /OBJET_VERROUILLE/
  );
  assert.throws(
    ()=>applyIdleAdventureActionV47(state,{action:"discard",id:boots[1].id},{},Date.now()),
    /OBJET_VERROUILLE/
  );
  assert.throws(
    ()=>applyIdleAdventureActionV47(state,{action:"trashPut",id:boots[1].id},{},Date.now()),
    /OBJET_VERROUILLE/
  );
});

test("Trash stores one recoverable object and replacing it destroys the previous one",()=>{
  let state=createIdleAdventureStateV47();
  state=act(state,{action:"addItem",definitionId:"training:head",level:0});
  state=act(state,{action:"addItem",definitionId:"training:chest",level:0});
  const head=state.inventory.find(x=>x.definitionId==="training:head");
  const chest=state.inventory.find(x=>x.definitionId==="training:chest");

  state=act(state,{action:"trashPut",id:head.id});
  let snap=idleAdventureSnapshotV47(state);
  assert.equal(snap.trash.id,head.id);
  assert.ok(!snap.inventory.some(x=>x.id===head.id));

  state=act(state,{action:"trashRecover"});
  snap=idleAdventureSnapshotV47(state);
  assert.equal(snap.trash,null);
  assert.ok(snap.inventory.some(x=>x.id===head.id));

  state=act(state,{action:"trashPut",id:head.id});
  state=act(state,{action:"trashPut",id:chest.id});
  snap=idleAdventureSnapshotV47(state);
  assert.equal(snap.trash.id,chest.id);
  assert.ok(!snap.inventory.some(x=>x.id===head.id));
  assert.ok(!snap.inventory.some(x=>x.id===chest.id));
});

test("Tutorial Boost 1 unlocks on full Training Set discovery at 15 percent",async()=>{
  const source=await import("node:fs/promises").then(fs=>fs.readFile(new URL("../src/idle-adventure-v47.js",import.meta.url),"utf8"));
  assert.match(source,/tutorial:\s*\{[\s\S]*?normal:\s*\{[\s\S]*?boosts:\[\{strength:1,chance:\.15,requiresUnlockedSet:"training"\}\]/);
});
