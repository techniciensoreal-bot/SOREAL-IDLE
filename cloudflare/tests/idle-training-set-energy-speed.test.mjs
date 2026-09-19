import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  idleNguResourceGenerationPerSecond
} from "../src/idle-ngu-progression.js";
import {applyIdleAdventureActionV47} from "../src/idle-adventure-v47.js";

const ctx={bosses:999,adventurePower:1e9,adventureToughness:1e9};
let state=normalizeIdleNguState(null,ctx,1);

for(const slot of ["head","chest","legs","boots","weapon"]){
  state.adventure=applyIdleAdventureActionV47(
    state.adventure,
    {action:"addItem",definitionId:"training:"+slot,level:100},
    {bosses:999,difficulty:"normal"},
    2
  ).state;
}
state=normalizeIdleNguState(state,ctx,3);

assert.equal(state.adventure.completedSets.training,true);
assert.equal(state.adventure.permanent.energySpeedFlat,2);

// Raw Energy Speed 1 + Training Set 2 = effective speed 3.
// NGU generation: 50 / ceil(50/3) = 50/17 fills per second at 1 bar.
state.resources.energy.speed=1;
state.resources.energy.bars=1;
const rate=idleNguResourceGenerationPerSecond(state,"energy");
assert.ok(Math.abs(rate-(50/17))<1e-9, "Training Set +2 Energy Speed must affect actual Energy generation.");

console.log("idle-training-set-energy-speed: OK");
