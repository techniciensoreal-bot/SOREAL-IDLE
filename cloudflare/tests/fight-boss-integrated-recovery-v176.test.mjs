import assert from "node:assert/strict";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";

const {
  createBasicTrainingStateV411,
  regenPvIntegreeBasicTrainingSorealIdleV176_
}=idleRuntimeTestHooks;

function close(actual,expected,rel=1e-10){
  const scale=Math.max(1,Math.abs(expected));
  assert.ok(
    Math.abs(actual-expected)<=scale*rel,
    "expected "+expected+", got "+actual
  );
}

const before=createBasicTrainingStateV411(0);
before.skills.blocage.level=1000;
before.skills.blocage.progress=0;
before.skills.blocage.allocation=2500;
before.skills.blocage.cap=2500;

const after=createBasicTrainingStateV411(15000);
after.skills.blocage.level=1750;
after.skills.blocage.progress=0;
after.skills.blocage.allocation=2500;
after.skills.blocage.cap=2500;

const seconds=15;
const l0=1000;
const l1=1750;
const avgPow=
  (Math.pow(l1,2.3)-Math.pow(l0,2.3))/
  (2.3*(l1-l0));
const averageDefense=100+150*avgPow;
const expected=averageDefense/20*seconds;

const integrated=
  regenPvIntegreeBasicTrainingSorealIdleV176_(
    before,
    after,
    seconds,
    seconds
  );

close(integrated,expected);

const finalDefense=100+150*Math.pow(l1,1.3);
const oldWrongFormula=finalDefense/20*seconds;

assert.ok(
  integrated<oldWrongFormula,
  "Integrated recovery must be lower than applying final Defense retroactively."
);

/*
 * If BT was updated only during the last 5 s of a 15 s HP window,
 * the first 10 s must use the starting Defense, not the ending Defense.
 */
const beforeShort=createBasicTrainingStateV411(10000);
beforeShort.skills.blocage.level=1000;
beforeShort.skills.blocage.allocation=2500;
beforeShort.skills.blocage.cap=2500;

const afterShort=createBasicTrainingStateV411(15000);
afterShort.skills.blocage.level=1250;
afterShort.skills.blocage.allocation=2500;
afterShort.skills.blocage.cap=2500;

const initialDefense=100+150*Math.pow(1000,1.3);
const avgPowShort=
  (Math.pow(1250,2.3)-Math.pow(1000,2.3))/
  (2.3*(1250-1000));
const avgDefenseShort=100+150*avgPowShort;
const expectedLongWindow=
  initialDefense/20*10+
  avgDefenseShort/20*5;

const integratedLongWindow=
  regenPvIntegreeBasicTrainingSorealIdleV176_(
    beforeShort,
    afterShort,
    5,
    15
  );

close(integratedLongWindow,expectedLongWindow);

console.log("Fight Boss integrated recovery V176: OK");
