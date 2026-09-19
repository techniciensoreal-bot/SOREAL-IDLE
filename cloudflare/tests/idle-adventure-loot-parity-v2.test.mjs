import assert from "node:assert/strict";
import {
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2,
  idleAdventureDropChanceV2
} from "../src/idle-adventure-v47.js";

assert.equal(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.tutorial.normal.equipment[0].chance,
  0.25
);
assert.equal(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.tutorial.boss.equipment[0].chance,
  1
);
assert.equal(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.sewers.boss.equipment[0].chance,
  0.65
);
assert.equal(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.forest.normal.boosts[0].chance,
  0.12
);
assert.equal(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.cave.boss.equipment[0].chance,
  0.75
);
assert.equal(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.sky.boss.specials
    .find(x=>x.id==="pissedOffKey").firstGuaranteed,
  true
);

assert.equal(
  idleAdventureDropChanceV2(.25,1,2,{id:"tutorial"}),
  .5,
  "Hors Chocolate/Evil, le multiplicateur Drop Chance doit multiplier le taux de base."
);
assert.equal(
  idleAdventureDropChanceV2(.00018,.08,8,{id:"chocolate"}),
  .00036,
  "Chocolate doit appliquer la racine cubique du multiplicateur de Drop Chance."
);

let state=createIdleAdventureStateV47();
state=applyIdleAdventureActionV47(
  state,
  {action:"selectZone",zone:"tutorial"},
  {bosses:4,difficulty:"normal"},
  1
).state;

const randomAvant=Math.random;
try{
  Math.random=()=>.999999;
  const normal=applyIdleAdventureActionV47(
    state,
    {action:"zoneKill"},
    {bosses:4,difficulty:"normal",dropMultiplier:1},
    2
  );
  state=normal.state;
  assert.ok(
    normal.result.drops.some(x=>x&&x.definitionId==="training:weapon"),
    "Le premier A Stick du Tutorial doit être garanti même avec un roll à 99,9999%."
  );

  state.zone.kills.tutorial=9;
  const boss=applyIdleAdventureActionV47(
    state,
    {action:"zoneKill"},
    {bosses:4,difficulty:"normal",dropMultiplier:1},
    3
  );
  assert.equal(boss.result.boss,true);
  assert.ok(
    boss.result.drops.some(x=>
      x&&["training:head","training:chest","training:legs","training:boots"]
        .includes(x.definitionId)
    ),
    "Un boss Tutorial doit toujours donner une pièce Training hors A Stick."
  );
}finally{
  Math.random=randomAvant;
}

console.log("idle-adventure-loot-parity-v2: OK");
