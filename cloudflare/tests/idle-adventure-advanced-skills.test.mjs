import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

let state=createIdleAdventureStateV47();

// Red Liquid: level 100 marks the set bonus, drinking it unlocks Hyper Regen.
let step=applyIdleAdventureActionV47(
  state,
  {action:"addItem",definitionId:"mysteriousRedLiquid",level:100},
  {bosses:999,difficulty:"normal"},
  1
);
state=step.state;
assert.equal(state.unlockFlags.redLiquidMaxed,true);
const redId=step.result.id;
step=applyIdleAdventureActionV47(
  state,
  {action:"consumeSkillItem",id:redId},
  {bosses:999,difficulty:"normal"},
  2
);
state=step.state;
assert.equal(state.unlockFlags.hyperRegenUnlocked,true);
assert.equal(state.inventory.some(x=>x.id===redId),false);

// Purple Liquid: drinking unlocks Beast Mode; maxing it keeps the 50% set flag.
step=applyIdleAdventureActionV47(
  state,
  {action:"addItem",definitionId:"mysteriousPurpleLiquid",level:100},
  {bosses:999,difficulty:"normal"},
  3
);
state=step.state;
assert.equal(state.unlockFlags.purpleLiquidMaxed,true);
const purpleId=step.result.id;
step=applyIdleAdventureActionV47(
  state,
  {action:"consumeSkillItem",id:purpleId},
  {bosses:999,difficulty:"normal"},
  4
);
state=step.state;
assert.equal(state.unlockFlags.beastModeUnlocked,true);

step=applyIdleAdventureActionV47(
  state,
  {action:"setBeastMode",enabled:true},
  {bosses:999,difficulty:"normal"},
  5
);
state=step.state;
assert.equal(state.skillState.beastMode,true);

// Gerbil -> Grey Liquid is Sadistic-only, then unlocks Move 69.
step=applyIdleAdventureActionV47(
  state,
  {action:"addItem",definitionId:"smallGerbil",level:100},
  {bosses:999,difficulty:"extreme"},
  6
);
state=step.state;
const gerbilId=step.result.id;

assert.throws(
  ()=>applyIdleAdventureActionV47(
    state,
    {action:"transformAdventureItem",id:gerbilId},
    {bosses:999,difficulty:"normal"},
    7
  ),
  /DIFFICULTE_SADISTIC_REQUISE/
);

step=applyIdleAdventureActionV47(
  state,
  {action:"transformAdventureItem",id:gerbilId},
  {bosses:999,difficulty:"extreme"},
  8
);
state=step.state;
assert.equal(step.result.definitionId,"mysteriousGreyLiquid");
const greyId=step.result.id;

step=applyIdleAdventureActionV47(
  state,
  {action:"consumeSkillItem",id:greyId},
  {bosses:999,difficulty:"extreme"},
  9
);
state=step.state;
assert.equal(state.unlockFlags.move69Unlocked,true);

for(let i=0;i<69;i+=1){
  step=applyIdleAdventureActionV47(
    state,
    {action:"useMove69"},
    {bosses:999,difficulty:"extreme"},
    10+i
  );
  state=step.state;
}
assert.equal(state.skillState.move69Uses,69);
assert.equal(state.skillState.endPiece481,true);

// The rare unlock items use their real documented base chances.
const source=readFileSync(new URL("../src/idle-adventure-v47.js",import.meta.url),"utf8");
assert.ok(
  source.includes('if(id==="t2"&&Math.random()<.01)drops.push(add(s,special("mysteriousRedLiquid",5)))'),
  "Grand Corrupted Tree must use the 1% Red Liquid base chance."
);
assert.ok(
  source.includes('if(Math.random()<.00002)drops.push(add(s,special("mysteriousPurpleLiquid",1)))'),
  "The Beast Normal+ must use the 0.002% Purple Liquid base chance."
);
assert.ok(
  source.includes('if(tierKey==="brutal"&&Math.random()<.000001)drops.push(add(s,special("smallGerbil",4)))'),
  "The Beast Brutal must use the 0.0001% Small Gerbil base chance."
);

console.log("idle-adventure-advanced-skills: OK");
