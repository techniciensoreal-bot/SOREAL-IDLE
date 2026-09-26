import assert from 'node:assert/strict';
import {normalizeIdleNguState,advanceIdleNguState,applyIdleNguAction,rebirthIdleNguState} from '../src/idle-ngu-progression.js';

const context={bosses:37,bestGold:0,basicTrainingComplete:true};
let state=normalizeIdleNguState({},context,1_000_000);
state.currencies.gold=1e9;
state=normalizeIdleNguState(state,context,1_000_000);
const first=applyIdleNguAction(state,{action:'moneyPit'},context,1_000_000);
assert.equal(first.result.cost,1e9);
assert.equal(first.result.tier,3);
assert.equal(first.state.systems.moneyPit.data.tossesThisRun,1);
assert.equal(first.state.systems.moneyPit.data.lastTossAt,1_000_000);
assert.equal(first.state.currencies.gold,0);
assert.equal(first.result.nextAt,1_000_000+2*3600000,"wiki Money Pit : 2 heures apres le premier jet");

first.state.currencies.gold=1e7;
const secondAt=first.result.nextAt;
const second=applyIdleNguAction(first.state,{action:'moneyPit'},context,secondAt);
assert.equal(second.result.cost,1e7);
assert.equal(second.result.cooldownHours,3);
assert.equal(second.state.systems.moneyPit.data.tossesThisRun,2);

const rebirthAt=secondAt+20*60*1000;
const reborn=rebirthIdleNguState(second.state,context,rebirthAt);
assert.equal(reborn.systems.moneyPit.data.tossesThisRun,0);
assert.equal(reborn.systems.moneyPit.data.nextAt,secondAt+3600000);
assert.ok(reborn.systems.moneyPit.data.nextAt>rebirthAt);

let daily=normalizeIdleNguState({},context,10_000_000);
daily.currencies.gold=100000;
daily=advanceIdleNguState(daily,0,context,10_000_000);
assert.equal(daily.systems.moneyPit.unlocked,true);
assert.equal(daily.systems.dailySpin.unlocked,true);
assert.equal(daily.systems.dailySpin.data.readyAt,10_000_000);
const spin1=applyIdleNguAction(daily,{action:'collect',system:'dailySpin'},context,10_000_000);
assert.equal(spin1.result.totalSpins,1);
assert.equal(spin1.result.readyAt,10_000_000+24*3600000);
assert.throws(()=>applyIdleNguAction(spin1.state,{action:'collect',system:'dailySpin'},context,10_000_000+23*3600000),/ROUE_PAS_PRETE/);
const late6h=10_000_000+30*3600000;
const spin2=applyIdleNguAction(spin1.state,{action:'collect',system:'dailySpin'},context,late6h);
assert.equal(spin2.result.bankedMs,6*3600000);
assert.equal(spin2.result.readyAt,10_000_000+48*3600000);
const late12h=10_000_000+60*3600000;
const spin3=applyIdleNguAction(spin2.state,{action:'collect',system:'dailySpin'},context,late12h);
assert.equal(spin3.result.bankedMs,12*3600000);
assert.equal(spin3.result.readyAt,10_000_000+72*3600000);

console.log('SOREAL IDLE V48 Money Pit/Daily Spin parity guards: OK');
