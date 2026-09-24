import assert from "node:assert/strict";
import {
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA,
  IDLE_NGU_SYSTEMS,
  IDLE_NGU_TRACKS,
  IDLE_NGU_EARLY_GAME_TIMELINE,
  IDLE_NGU_NORMAL_CHALLENGES,
  IDLE_NGU_AUGMENTATIONS,
  IDLE_NGU_BLOOD_RITUALS,
  IDLE_NGU_YGG_FRUITS,
  IDLE_NGU_DIGGERS,
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState,
  idleNguBonuses,
  idleNguChallengeBonuses,
  idleNguAugmentationMultiplier,
  idleNguTimeMachineGoldPerSecond,
  idleNguTimeMachineGrossGoldPerSecond,
  idleNguRebirthTimeFactor,
  calculateIdleNguNextNumber
} from "../src/idle-ngu-progression.js";

const fresh=(context={}, now=1_000_000)=>
  normalizeIdleNguState({}, context, now);

{
  const state=fresh({},1_000_000);
  assert.equal(state.version,IDLE_NGU_META_VERSION);
  assert.equal(state.saveSchema,IDLE_NGU_SAVE_SCHEMA);
  assert.equal(state.rebirth.number,1);
  assert.equal(state.systems.augmentations.unlocked,false);
  assert.equal(state.systems.timeMachine.unlocked,false);
  assert.equal(state.systems.bloodMagic.unlocked,false);
}

{
  const timeline=Object.fromEntries(IDLE_NGU_EARLY_GAME_TIMELINE.map(x=>[x.id,x.boss]));
  assert.equal(timeline.adventure,4);
  assert.equal(timeline.augmentations,17);
  assert.equal(timeline.timeMachine,30);
  assert.equal(timeline.magic,37);
  assert.equal(timeline.challenges,58);
  assert.equal(timeline.titans,58);
}

{
  assert.equal(fresh({bosses:16}).systems.augmentations.unlocked,false);
  assert.equal(fresh({bosses:17}).systems.augmentations.unlocked,true);
  assert.equal(fresh({bosses:29}).systems.timeMachine.unlocked,false);
  assert.equal(fresh({bosses:30}).systems.timeMachine.unlocked,true);
  assert.equal(fresh({bosses:36}).systems.bloodMagic.unlocked,false);
  assert.equal(fresh({bosses:37}).systems.bloodMagic.unlocked,true);
  assert.equal(fresh({bosses:57}).systems.challenges.unlocked,false);
  assert.equal(fresh({bosses:58}).systems.challenges.unlocked,true);
  assert.equal(fresh({bosses:58}).systems.titans.unlocked,true);
}

{
  const byId=Object.fromEntries(IDLE_NGU_AUGMENTATIONS.map(x=>[x.id,x]));
  assert.deepEqual(
    [byId.scissors.unlockBoss,byId.scissors.baseGold,byId.scissors.baseSeconds],
    [17,10_000,400]
  );
  assert.deepEqual(
    [byId.milk.unlockBoss,byId.milk.baseGold,byId.milk.baseSeconds],
    [18,200_000,6800]
  );
  assert.deepEqual(
    [byId.buster.unlockBoss,byId.buster.baseGold,byId.buster.baseSeconds],
    [28,1.6e9,33_408_400]
  );
  assert.deepEqual(
    [byId.buster.upgrade.unlockBoss,byId.buster.upgrade.baseGold,byId.buster.upgrade.baseSeconds],
    [48,6.25e13,8_294_400]
  );
  assert.deepEqual(
    [byId.exoskeleton.unlockBoss,byId.exoskeleton.upgrade.unlockBoss],
    [56,56]
  );
}

{
  const r=IDLE_NGU_BLOOD_RITUALS;
  assert.equal(r.length,8);
  assert.deepEqual([r[0].blood,r[0].gold,r[0].baseSeconds],[1,3e7,2000]);
  assert.deepEqual([r[1].blood,r[1].gold,r[1].baseSeconds],[50,1e10,20000]);
  assert.equal(r[7].unlockFlag,"trollChallenge6");
}

{
  assert.ok(IDLE_NGU_TRACKS.advancedTraining.some(x=>x.id==="wandoosEnergy"));
  assert.ok(IDLE_NGU_TRACKS.advancedTraining.some(x=>x.id==="wandoosMagic"));
  assert.equal(IDLE_NGU_TRACKS.ngu.length,16,"16 vrais NGU (9 Energy + 7 Magic)");
  assert.ok(IDLE_NGU_TRACKS.hacks.length>=10);
  assert.ok(IDLE_NGU_TRACKS.wishes.length>=8);
  const ids=new Set(IDLE_NGU_SYSTEMS.map(x=>x.id));
  for(const id of [
    "achievements","dailySpin","augmentations","advancedTraining","timeMachine",
    "bloodMagic","wandoos","ngu","yggdrasil","moneyPit","diggers","beards",
    "tower","perks","challenges","titans","macguffins","daycare","infinityCube",
    "questing","quirks","hacks","wishes","cards","cooking"
  ]) assert.ok(ids.has(id),id);
}

{
  assert.equal(idleNguRebirthTimeFactor(60*60),1+60/(60*24*2));
  const p=calculateIdleNguNextNumber({
    bosses:10,
    runSeconds:3600,
    attackTrainingLevels:20_000
  });
  assert.equal(p.factors.currentBossFactor,2**10);
  assert.equal(p.factors.trainingFactor,3);
  assert.equal(p.canRebirth,true);
}

{
  const context={bosses:17,bestGold:1};
  let state=fresh(context,1_000_000);
  state.currencies.gold=1_000_000;
  state.resources.energy.cap=1000;
  state.resources.energy.current=1000;
  state=applyIdleNguAction(
    state,
    {action:"allocate",system:"augmentations",resource:"energy",value:1000},
    context,
    1_000_000
  ).state;
  state=advanceIdleNguState(state,400,context,1_400_000);
  assert.equal(state.systems.augmentations.data.pairs.scissors.level,1);
  assert.equal(Math.round(state.currencies.gold),990_000);
  assert.ok(idleNguAugmentationMultiplier(state)>1);
}

{
  /*
   * Fidélité wiki (audit 2026-09-16, ngu-time-machine.md) : le niveau
   * 0->1 du Time Machine coûte réellement 1 000 000s ET 5 000 000 Or à ce
   * rythme d'allocation (1 Power, 1000 alloués) — jamais 1 seconde
   * gratuite comme l'ancienne formule (bug corrigé) le laissait croire.
   * Ce test vérifie donc désormais le VRAI seuil, Or fourni.
   */
  const context={bosses:37,bestGold:1000};
  let state=fresh(context,1_000_000);
  state.currencies.gold=10_000_000;
  state.resources.energy.cap=1000;
  state.resources.energy.current=1000;
  state.resources.magic.cap=1000;
  state.resources.magic.current=1000;
  state=applyIdleNguAction(state,{action:"allocate",system:"timeMachine",resource:"energy",value:1000},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"allocate",system:"timeMachine",resource:"magic",value:1000},context,1_000_000).state;

  // 1 seconde (ancien seuil, désormais bien trop court) ne doit plus jamais suffire.
  const tooSoon=advanceIdleNguState(state,1,context,1_000_001);
  assert.equal(tooSoon.systems.timeMachine.data.speedLevel,0,"1s ne doit plus faire monter le niveau (ancienne régression corrigée).");

  // Le vrai seuil wiki (1 000 000s à ce rythme) doit, lui, fonctionner — Or suffisant fourni.
  state=advanceIdleNguState(state,1_000_000,context,2_000_000);
  assert.ok(state.systems.timeMachine.data.speedLevel>=1);
  assert.ok(state.systems.timeMachine.data.goldLevel>=1);
  assert.ok(idleNguTimeMachineGoldPerSecond(state)>0);
}

{
  const context={bosses:37,bestGold:1000};
  let state=fresh(context,1_000_000);
  state.currencies.gold=3e7;
  state.resources.magic.cap=1000;
  state.resources.magic.current=1000;
  state=applyIdleNguAction(state,{action:"allocate",system:"bloodMagic",resource:"magic",value:1000},context,1_000_000).state;
  state=advanceIdleNguState(state,2000,context,3_000_000);
  assert.equal(state.systems.bloodMagic.data.rituals.tack.completions,1);
  assert.equal(state.currencies.blood,1);
}

{
  const context={bosses:37,bestGold:0};
  let state=fresh(context,1_000_000);
  state.currencies.gold=1e9; // unlock Money Pit
  state=normalizeIdleNguState(state,context,1_000_000);
  const first=applyIdleNguAction(state,{action:"moneyPit"},context,1_000_000);
  assert.equal(first.result.cost,1e9);
  assert.equal(first.result.tier,3);
  assert.equal(first.result.cooldownHours,1);
  const secondAt=first.result.nextAt;
  first.state.currencies.gold=1e7;
  const second=applyIdleNguAction(first.state,{action:"moneyPit"},context,secondAt);
  assert.equal(second.result.cost,1e7);
  assert.equal(second.result.cooldownHours,2);
}

{
  const context={
    bosses:58,
    bestGold:1e6,
    adventurePower:1e9
  };
  let state=fresh(context,1_000_000);
  state.adventure.unlockItems.aNumber=true;
  state=applyIdleNguAction(state,{action:"adventure",adventure:{mode:"consumeUnlock",itemId:"aNumber"}},context,1_000_000).state;
  assert.equal(state.systems.ngu.unlocked,true);
  state.resources.energy.cap=100;
  state.resources.energy.power=1e6; // 16 vrais NGU : coût de base 2e11 s pour 1 de puissance x 1 alloué
  state=applyIdleNguAction(state,{action:"allocateNgu",ngu:"powerAlpha",value:100},context,1_000_000).state;
  state=advanceIdleNguState(state,3600,context,4_600_000);
  assert.ok(state.systems.ngu.data.ngus.normal.powerAlpha.level>0);
  assert.ok(idleNguBonuses(state).attackMultiplier>1);
}

{
  const context={bosses:17,attackTrainingLevels:10_000};
  let state=fresh(context,0);
  // 60 min run: legal rebirth, Number must be committed and run systems reset.
  state.currencies.gold=1e6;
  state.resources.energy.cap=1000;
  state.resources.energy.current=1000;
  state=applyIdleNguAction(state,{action:"allocate",system:"augmentations",resource:"energy",value:1000},context,0).state;
  state=advanceIdleNguState(state,400,context,400_000);
  assert.ok(state.systems.augmentations.data.pairs.scissors.level>0);
  const reborn=rebirthIdleNguState(state,context,3_600_000);
  assert.ok(reborn.rebirth.number>1);
  assert.equal(reborn.systems.augmentations.data.pairs.scissors.level,0);
  assert.equal(reborn.systems.augmentations.allocation.energy,0);
  assert.equal(reborn.currencies.blood,0);
}

{
  // V49 Beards mirror NGU's first-slot rules: unlock through UUG Hair,
  // passive Bars*sqrt(Power) growth, 50 levels/s cap, active temp bonus,
  // permanent bonus across selections and discrete rebirth time factor.
  const context={bosses:100,basicTrainingComplete:true};
  let state=fresh(context,0);
  state.adventure.unlockFlags.beards=true;
  state=normalizeIdleNguState(state,context,0);
  assert.equal(state.systems.beards.unlocked,true);
  assert.equal(state.systems.beards.active,false);

  const defs=Object.fromEntries(IDLE_NGU_TRACKS.beards.map(x=>[x.id,x]));
  assert.equal(defs.attack.resource,"magic");
  assert.equal(defs.drop.resource,"energy");
  assert.equal(defs.gold.unlockTroll,7);

  assert.throws(
    ()=>applyIdleNguAction(state,{action:"selectTrack",system:"beards",track:"gold"},context,0),
    /PISTE_VERROUILLEE/
  );

  state.resources.magic.bars=1e12;
  state.resources.magic.power=1e12;
  state=applyIdleNguAction(
    state,
    {action:"selectTrack",system:"beards",track:"defense"},
    context,
    0
  ).state;
  assert.equal(state.systems.beards.active,true);

  state=advanceIdleNguState(state,1,context,1000);
  assert.equal(state.systems.beards.data.tracks.defense.tempLevel,50);

  state.systems.beards.data.tracks.defense.tempLevel=100;
  const activeBonus=idleNguBonuses(state).beardNumberMultiplier;
  assert.ok(activeBonus>1);

  state.systems.beards.data.tracks.defense.permanentLevel=10;
  state=applyIdleNguAction(
    state,
    {action:"selectTrack",system:"beards",track:"attack"},
    context,
    1000
  ).state;
  const inactiveBonus=idleNguBonuses(state).beardNumberMultiplier;
  assert.ok(inactiveBonus>1);
  assert.ok(inactiveBonus<activeBonus);

  // At 59 minutes the beard factor is still 0. At 24h it is capped at 8.
  let short=fresh(context,0);
  short.adventure.unlockFlags.beards=true;
  short=normalizeIdleNguState(short,context,0);
  short=applyIdleNguAction(
    short,
    {action:"selectTrack",system:"beards",track:"defense"},
    context,
    0
  ).state;
  short.systems.beards.data.tracks.defense.tempLevel=100;
  const shortReborn=rebirthIdleNguState(short,context,59*60*1000);
  assert.equal(shortReborn.rebirth.beardConversion.gained,0);
  assert.equal(shortReborn.rebirth.beardConversion.timeFactor,0);

  let full=fresh(context,0);
  full.adventure.unlockFlags.beards=true;
  full=normalizeIdleNguState(full,context,0);
  full=applyIdleNguAction(
    full,
    {action:"selectTrack",system:"beards",track:"defense"},
    context,
    0
  ).state;
  full.systems.beards.data.tracks.defense.tempLevel=100;
  full.systems.beards.data.tracks.attack.tempLevel=999;
  const reborn=rebirthIdleNguState(full,context,24*3600*1000);
  assert.equal(reborn.systems.beards.data.tracks.defense.tempLevel,0);
  assert.equal(reborn.systems.beards.data.tracks.attack.tempLevel,0);
  assert.equal(reborn.systems.beards.data.tracks.defense.permanentLevel,80);
  assert.equal(reborn.systems.beards.data.tracks.attack.permanentLevel,0);
  assert.equal(reborn.rebirth.beardConversion.gained,80);
  assert.equal(reborn.rebirth.beardConversion.timeFactor,8);
  assert.ok(idleNguBonuses(reborn).beardNumberMultiplier>1);
}

{
  // V47 migrates compatible NGU progress forward without reviving the old
  // global player level / Renaissance / Essence mechanics.
  const legacy={
    version:"META-V2-NGU-PARITY",
    saveSchema:2,
    niveau:999,
    renaissance:999,
    essenceRenaissance:123,
    updatedAt:900_000,
    runStartedAt:100_000,
    resources:{
      energy:{power:7,cap:1000,bars:3,spentExp:20},
      magic:{power:4,cap:500,bars:2,spentExp:10}
    },
    currencies:{experience:1234,pp:5,gold:987654,blood:77,seeds:11},
    records:{highestBoss:58,highestZone:6,setsCompleted:2,totalRebirths:3},
    bank:{advancedTraining:8,timeMachine:6,beards:4},
    challenge:{active:"",completions:{basic:2,noEquipment:1}},
    bonuses:{ironPill:0.25,cards:{attack:0.1}},
    systems:{
      augmentations:{unlocked:true,tempLevel:7,allocation:{energy:50},data:{}},
      timeMachine:{unlocked:true,tempLevel:9,allocation:{energy:25},data:{}},
      ngu:{
        unlocked:true,
        allocation:{energy:80},
        data:{tracks:{attack:{level:12,tempLevel:0,permanentLevel:3,progress:0.5}},activeTrack:"attack"}
      }
    }
  };
  const migrated=normalizeIdleNguState(legacy,{bosses:58},1_000_000);
  assert.equal(migrated.saveSchema,47);
  assert.equal(migrated.version,IDLE_NGU_META_VERSION);
  assert.equal(migrated.resources.energy.power,7);
  assert.equal(migrated.resources.energy.cap,1000);
  assert.equal(migrated.resources.energy.bars,3);
  assert.equal(migrated.currencies.experience,1234);
  assert.equal(migrated.currencies.gold,987654);
  assert.equal(migrated.records.highestBoss,58);
  assert.equal(migrated.records.totalRebirths,3);
  assert.equal(migrated.systems.ngu.unlocked,true);
  // Migration NGU 2026-09-23 : les 9 pistes inventées disparaissent, les 16 vrais NGU
  // repartent de 0 et l'énergie allouée aux anciennes pistes est rendue au joueur.
  assert.equal(migrated.systems.ngu.data.tracks,undefined);
  assert.equal(migrated.systems.ngu.data.ngus.normal.powerAlpha.level,0);
  assert.equal(migrated.systems.ngu.allocation.energy,0);
  assert.equal(migrated.systems.augmentations.data.pairs.scissors.level,7);
  assert.equal(migrated.systems.timeMachine.data.speedLevel,9);
  assert.equal(migrated.bank.timeMachineSpeed,6);
  assert.equal(migrated.migration.fromVersion,"META-V2-NGU-PARITY");
  assert.ok(!Object.hasOwn(migrated,"niveau"));
  assert.ok(!Object.hasOwn(migrated,"renaissance"));
  assert.ok(!Object.hasOwn(migrated,"essenceRenaissance"));

  const again=normalizeIdleNguState(migrated,{bosses:58},1_000_000);
  assert.equal(again.migration.fromVersion,"META-V2-NGU-PARITY");
  assert.equal(again.systems.ngu.data.ngus.normal.powerAlpha.level,0);
  assert.equal(again.systems.ngu.allocation.energy,0);
  assert.equal(again.currencies.gold,987654);
}



{
  // Adventure V47 is persisted inside the single meta state and can unlock
  // permanent systems without the old Inventory JSON / rarity model.
  const context={bosses:58,bestGold:1e6};
  let state=fresh(context,1_000_000);
  const killed=applyIdleNguAction(
    state,
    {
      action:"adventure",
      adventure:{
        mode:"titan",
        titanId:"titan1",
        stats:{power:2000,toughness:2000},
        autoMerge:false
      }
    },
    context,
    1_000_000
  );
  state=killed.state;
  assert.equal(state.adventure.unlockItems.aNumber,true);
  const consumed=applyIdleNguAction(
    state,
    {action:"adventure",adventure:{mode:"consumeUnlock",itemId:"aNumber"}},
    context,
    1_000_001
  );
  assert.equal(consumed.state.adventure.unlockFlags.ngu,true);
  assert.equal(consumed.state.systems.ngu.unlocked,true);
}

{
  // Yggdrasil: tiers and seeds persist, growth is one hour per tier and
  // active fruit progress is reset on Rebirth.
  const context={bosses:66,bestGold:1e6};
  let state=fresh(context,1_000_000);
  state.adventure.unlockFlags.yggdrasil=true;
  state=normalizeIdleNguState(state,context,1_000_000);
  assert.equal(state.systems.yggdrasil.unlocked,true);
  state.currencies.seeds=1000;
  state.resources.energy.cap=500_000;
  state.resources.energy.current=500_000;
  state=applyIdleNguAction(state,{action:"upgradeYggFruit",fruit:"gold"},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"upgradeYggFruit",fruit:"gold"},context,1_000_000).state;
  assert.equal(state.systems.yggdrasil.data.fruits.gold.tier,2);
  state=applyIdleNguAction(state,{action:"activateYggFruit",fruit:"gold"},context,1_000_000).state;
  assert.equal(state.resources.energy.current,400_000);
  state=advanceIdleNguState(state,2*3600,context,8_200_000);
  assert.equal(state.systems.yggdrasil.data.fruits.gold.growthHours,2);
  const seedsBefore=state.currencies.seeds;
  const used=applyIdleNguAction(state,{action:"useYggFruit",fruit:"gold",mode:"harvest"},context,8_200_000);
  state=used.state;
  assert.ok(state.currencies.seeds>seedsBefore);
  assert.equal(state.systems.yggdrasil.data.fruits.gold.active,false);
  const tierBefore=state.systems.yggdrasil.data.fruits.gold.tier;
  const reborn=rebirthIdleNguState(state,context,10_000_000);
  assert.equal(reborn.systems.yggdrasil.data.fruits.gold.tier,tierBefore);
  assert.equal(reborn.systems.yggdrasil.data.fruits.gold.growthHours,0);
}

{
  // Gold Diggers: permanent purchased levels, one base slot, GPS drain
  // and exact first-page 1.5x price/drain progression.
  const context={bosses:82,bestGold:1e15};
  let state=fresh(context,1_000_000);
  state.adventure.unlockFlags.diggers=true;
  state=normalizeIdleNguState(state,context,1_000_000);
  assert.equal(state.systems.diggers.unlocked,true);
  assert.equal(IDLE_NGU_DIGGERS.find(x=>x.id==="drop").unlockCost,1e16);
  state.currencies.gold=1e18;
  state.systems.timeMachine.data.bestGoldThisRun=1e15;
  state.systems.timeMachine.data.highestBossEver=82;
  state.systems.timeMachine.data.speedLevel=50;
  const gross=idleNguTimeMachineGrossGoldPerSecond(state);
  state=applyIdleNguAction(state,{action:"upgradeDigger",digger:"drop"},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"setDiggerLevel",digger:"drop",level:1},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"toggleDigger",digger:"drop",active:true},context,1_000_000).state;
  assert.equal(state.systems.diggers.data.diggers.drop.active,true);
  assert.ok(idleNguTimeMachineGoldPerSecond(state)<gross);
  assert.ok(idleNguBonuses(state).dropMultiplier>1);
  assert.throws(
    ()=>applyIdleNguAction(state,{action:"toggleDigger",digger:"wandoos",active:true},context,1_000_000),
    /DIGGER_NON_ACHETE/
  );
}

{
  // The first four diggers use 1.5x cost growth, the remaining eight 1.75x.
  assert.deepEqual(
    IDLE_NGU_DIGGERS.slice(0,4).map(x=>x.growth),
    [1.5,1.5,1.5,1.5]
  );
  assert.ok(IDLE_NGU_DIGGERS.slice(4).every(x=>x.growth===1.75));
  assert.equal(IDLE_NGU_DIGGERS.length,12);
  assert.equal(IDLE_NGU_YGG_FRUITS[0].tierCost,1);
  assert.equal(IDLE_NGU_YGG_FRUITS.find(x=>x.id==="pomegranate").baseSeeds,5);
}


// V47 regression: Adventure uses Basic Training/player base stats in addition to gear.
{
  const context={bosses:4,adventurePower:20,adventureToughness:20};
  let state=fresh(context,1_000_000);
  state=applyIdleNguAction(state,{action:"adventure",adventure:{action:"selectZone",zone:"tutorial"}},context,1_000_001).state;
  const goldAvant=state.currencies.gold;
  const result=applyIdleNguAction(state,{action:"adventure",adventure:{action:"zoneKill"}},context,1_000_002);
  assert.ok(result&&result.state);
  /*
   * V152 — Or d'Aventure (Norman, 2026-09-11, "il faut aussi regarder ce
   * que les mobs sont supposés looter. Il faut qu'ils lootent des golds
   * aussi") : rollKill (idle-adventure-v47.js) crédite maintenant
   * state.adventure.permanent.gold, diffé ici vers la vraie monnaie
   * partagée state.currencies.gold — même schéma que l'expérience.
   */
  assert.ok(result.state.currencies.gold>goldAvant,"Un kill en Aventure doit créditer de l'or dans la monnaie partagée, pas seulement dans l'état interne de l'Aventure.");
  const snapshot=(await import('../src/idle-ngu-progression.js')).idleNguSnapshot(result.state,context,1_000_003);
  assert.ok(snapshot.adventure.stats.power>=20);
  assert.ok(snapshot.adventure.stats.toughness>=20);
  assert.ok(Array.isArray(snapshot.yggFruits)&&snapshot.yggFruits.length>0);
  assert.ok(Array.isArray(snapshot.diggerDefinitions)&&snapshot.diggerDefinitions.length>0);
}



{
  // Advanced Training cannot activate Wandoos dump tracks before Wandoos 98
  // has actually unlocked Wandoos in the shared progression state.
  const context={bosses:100,basicTrainingComplete:true};
  let state=fresh(context,1_000_000);
  assert.equal(state.systems.advancedTraining.unlocked,true);
  assert.equal(state.systems.wandoos.unlocked,false);
  assert.throws(
    ()=>applyIdleNguAction(state,{action:"selectTrack",system:"advancedTraining",track:"wandoosEnergy"},context,1_000_000),
    /SYSTEME_VERROUILLE/
  );
  state.adventure.unlockFlags.wandoos=true;
  state=normalizeIdleNguState(state,context,1_000_000);
  assert.equal(state.systems.wandoos.unlocked,true);
  assert.doesNotThrow(
    ()=>applyIdleNguAction(state,{action:"selectTrack",system:"advancedTraining",track:"wandoosEnergy"},context,1_000_000)
  );
}
{
  // V50: one Energy budget is shared by Basic Training and every meta system.
  const context={bosses:17,basicTrainingEnergyAllocation:300};
  let state=fresh(context,1_000_000);
  assert.equal(state.resources.energy.cap,500);
  state=applyIdleNguAction(
    state,
    {action:"allocate",system:"augmentations",resource:"energy",value:500},
    context,
    1_000_000
  ).state;
  assert.equal(state.systems.augmentations.allocation.energy,200);
  const snapshot=(await import('../src/idle-ngu-progression.js')).idleNguSnapshot(state,context,1_000_000);
  assert.equal(snapshot.resourceBudget.energy.cap,500);
  assert.equal(snapshot.resourceBudget.energy.current,0);
  assert.equal(snapshot.resourceBudget.energy.allocated,200);
  assert.equal(snapshot.resourceBudget.energy.reservedExternal,300);
  assert.equal(snapshot.resourceBudget.energy.available,0);
  assert.equal(snapshot.resourceBudget.energy.freeCapacity,0);
}

{
  // V50 Spend EXP uses NGU's fixed base purchases instead of the old
  // exponential SOREAL shop formula.
  const context={bosses:37};
  let state=fresh(context,1_000_000);
  state.currencies.experience=1000;
  state=applyIdleNguAction(state,{action:"buyResource",resource:"energy",stat:"speed"},context,1_000_000).state;
  assert.equal(state.resources.energy.speed,1.1);
  assert.equal(state.currencies.experience,998);
  state=applyIdleNguAction(state,{action:"buyResource",resource:"energy",stat:"power"},context,1_000_000).state;
  assert.equal(state.resources.energy.power,1.1);
  assert.equal(state.currencies.experience,983);
  state=applyIdleNguAction(state,{action:"buyResource",resource:"energy",stat:"cap"},context,1_000_000).state;
  assert.equal(state.resources.energy.cap,10500);
  assert.equal(state.currencies.experience,943);
  state=applyIdleNguAction(state,{action:"buyResource",resource:"energy",stat:"bars"},context,1_000_000).state;
  assert.equal(state.resources.energy.bars,2);
  assert.equal(state.currencies.experience,863);
  state=applyIdleNguAction(state,{action:"buyResource",resource:"magic",stat:"speed"},context,1_000_000).state;
  assert.equal(state.resources.magic.speed,1.1);
  assert.equal(state.currencies.experience,860);
}

{
  // Audit 2026-09-16 : la page "Resource 3" du Spend EXP menu (wiki,
  // currencies-gold-exp-ap.md) était absente — buyResource("r3",...) levait
  // ACHAT_RESSOURCE_INDISPONIBLE dans tous les cas.
  const context={bosses:37};
  let state=fresh(context,1_000_000);
  state.currencies.experience=1e7;

  assert.throws(
    ()=>applyIdleNguAction(state,{action:"buyResource",resource:"r3",stat:"speed"},context,1_000_000),
    /R3_VERROUILLEE/,
    "R3 doit rester verrouillé tant que les Hacks ne sont pas débloqués (même patron que Magic/Blood Magic)."
  );

  state.systems.hacks.unlocked=true;
  state=applyIdleNguAction(state,{action:"buyResource",resource:"r3",stat:"speed"},context,1_000_000).state;
  assert.equal(state.resources.r3.speed,1.1);
  assert.equal(state.currencies.experience,1e7-300000);
  const capBefore=state.resources.r3.cap;
  state=applyIdleNguAction(state,{action:"buyResource",resource:"r3",stat:"cap"},context,1_000_000).state;
  assert.equal(state.resources.r3.cap,capBefore+10000);
  assert.equal(state.currencies.experience,1e7-300000-4000000);
}

{
  // Le client (page Spend EXP) doit pouvoir lire coûts/plafonds sans
  // recalculer une formule lui-même — même patron que perkDefinitions.
  const idleNguSnapshot=(await import('../src/idle-ngu-progression.js')).idleNguSnapshot;
  const snapshot=idleNguSnapshot(fresh({bosses:37},1_000_000),{bosses:37},1_000_000);
  assert.equal(snapshot.resourcePurchases.energy.speed.cost,2);
  assert.equal(snapshot.resourcePurchases.magic.bars.hardCap,1e18);
  assert.equal(snapshot.resourcePurchases.r3.cap.cost,4000000);
}

{
  // V51: NGU Energy generation follows the 50-tick speed rule and Bars.
  const mod=await import('../src/idle-ngu-progression.js');
  let state=fresh({},1_000_000);
  assert.equal(mod.idleNguResourceGenerationPerSecond(state,"energy"),1);
  state.resources.energy.current=0;
  state=advanceIdleNguState(state,10,{},1_010_000);
  assert.equal(state.resources.energy.current,10);
  assert.equal(state.resources.energy.generatedThisRun,10);

  state.resources.energy.current=0;
  state.resources.energy.speed=25;
  state.resources.energy.bars=2;
  state=advanceIdleNguState(state,1,{},1_011_000);
  assert.equal(mod.idleNguResourceGenerationPerSecond(state,"energy"),50);
  assert.equal(state.resources.energy.current,50);
}

{
  /*
   * Isolation stats réelles (2026-09-15, Norman : "quand on commence une
   * nouvelle partie, le compte d'énergie est à 250 et on doit générer
   * les 250 restants pour atteindre 500") — une partie fraîche démarre
   * désormais à la moitié du plafond (250/500), plus jamais pleine.
   */
  const context={bosses:17};
  let state=fresh(context,1_000_000);
  assert.equal(state.resources.energy.current,250);
  state=applyIdleNguAction(state,{action:"allocate",system:"augmentations",resource:"energy",value:200},context,1_000_000).state;
  assert.equal(state.systems.augmentations.allocation.energy,200);
  assert.equal(state.resources.energy.current,50);
  state=applyIdleNguAction(state,{action:"allocate",system:"augmentations",resource:"energy",value:50},context,1_000_000).state;
  assert.equal(state.systems.augmentations.allocation.energy,50);
  assert.equal(state.resources.energy.current,200);
}

{
  const context={bosses:17,basicTrainingEnergyAllocation:300};
  let state=fresh(context,1_000_000);
  assert.equal(state.resources.energy.current,200);
  state=applyIdleNguAction(state,{action:"allocate",system:"augmentations",resource:"energy",value:200},context,1_000_000).state;
  assert.equal(state.resources.energy.current,0);
  state=advanceIdleNguState(state,100,context,1_100_000);
  assert.equal(state.resources.energy.current,0);
}

{
  let state=fresh({bosses:36},1_000_000);
  assert.equal(state.resources.magic.current,0);
  state=advanceIdleNguState(state,100,{bosses:36},1_100_000);
  assert.equal(state.resources.magic.current,0);
  state=normalizeIdleNguState(state,{bosses:37},1_100_000);
  state=advanceIdleNguState(state,10,{bosses:37},1_110_000);
  assert.equal(state.resources.magic.current,10);
}

{
  const context={bosses:17};
  let state=fresh(context,0);
  state=applyIdleNguAction(state,{action:"allocate",system:"augmentations",resource:"energy",value:100},context,0).state;
  const reborn=rebirthIdleNguState(state,context,3_600_000);
  assert.equal(reborn.systems.augmentations.allocation.energy,0);
  assert.equal(reborn.resources.energy.current,0);
  assert.equal(reborn.resources.energy.generatedThisRun,0);
}

{
  // V52: global reclaim returns meta allocations but leaves Basic Training reserved.
  // Isolation stats réelles (2026-09-15) : une partie fraîche démarre à
  // 250 (moitié du plafond 500), plus jamais pleine (500).
  const context={bosses:30,basicTrainingEnergyAllocation:100};
  let state=fresh(context,1_000_000);
  assert.equal(state.resources.energy.current,250);
  state=applyIdleNguAction(state,{action:"allocate",system:"augmentations",resource:"energy",value:200},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"allocate",system:"timeMachine",resource:"energy",value:100},context,1_000_000).state;
  const reclaimed=applyIdleNguAction(state,{action:"reclaimResource",resource:"energy"},context,1_000_000);
  state=reclaimed.state;
  assert.equal(reclaimed.result.released,250);
  assert.equal(state.systems.augmentations.allocation.energy,0);
  assert.equal(state.systems.timeMachine.allocation.energy,0);
  assert.equal(state.resources.energy.current,250);
}

{
  // Energy natural cap grows by one per 20 generated Energy at rebirth, capped at 100k.
  // bosses:4 (au lieu de 1) : Rebirth n'est déblocable qu'après le tutoriel
  // Aventure (boss 4, voir REBIRTH_UNLOCK_BOSS_V1) — ce test porte sur le
  // calcul du plafond d'Energie, pas sur ce seuil de déblocage.
  const context={bosses:4};
  let state=fresh(context,0);
  state.resources.energy.current=0;
  state.resources.energy.generatedThisRun=400;
  state.updatedAt=3_600_000;
  const reborn=rebirthIdleNguState(state,context,3_600_000);
  assert.equal(reborn.resources.energy.cap,520);
  assert.equal(reborn.rebirth.resourceGrowth.energyCapGain,20);

  let capped=fresh(context,0);
  capped.resources.energy.cap=99_995;
  capped.resources.energy.current=0;
  capped.resources.energy.generatedThisRun=1000;
  capped.updatedAt=3_600_000;
  const cappedReborn=rebirthIdleNguState(capped,context,3_600_000);
  assert.equal(cappedReborn.resources.energy.cap,100_000);
  assert.equal(cappedReborn.rebirth.resourceGrowth.energyCapGain,5);
}

{
  // Ygg activation spends idle Energy and the cost is not refunded on harvest.
  const context={bosses:100};
  let state=fresh(context,1_000_000);
  state.adventure.unlockFlags.yggdrasil=true;
  state=normalizeIdleNguState(state,context,1_000_000);
  state.currencies.seeds=100;
  state.resources.energy.cap=200_000;
  state.resources.energy.current=200_000;
  state=applyIdleNguAction(state,{action:"upgradeYggFruit",fruit:"gold"},context,1_000_000).state;
  state=applyIdleNguAction(state,{action:"activateYggFruit",fruit:"gold"},context,1_000_000).state;
  assert.equal(state.resources.energy.current,100_000);
  state=advanceIdleNguState(state,3600,context,4_600_000);
  const beforeUse=state.resources.energy.current;
  state=applyIdleNguAction(state,{action:"useYggFruit",fruit:"gold",mode:"harvest"},context,4_600_000).state;
  assert.equal(state.resources.energy.current,beforeUse);
}


{
  // V56 Normal challenge catalogue mirrors the normal-difficulty targets.
  const defs=Object.fromEntries(IDLE_NGU_NORMAL_CHALLENGES.map(x=>[x.id,x]));
  assert.deepEqual([defs.basic.targetBoss,defs.basic.max],[58,5]);
  assert.deepEqual([defs.noAugmentations.targetBoss,defs.noAugmentations.max],[59,5]);
  assert.deepEqual([defs.noEquipment.targetBoss,defs.noEquipment.max],[66,5]);
  assert.deepEqual([defs.noRebirth.targetBoss,defs.noRebirth.targetStep],[40,5]);
  assert.deepEqual([defs.noNgu.targetBoss,defs.noNgu.targetStep],[58,10]);
  assert.deepEqual([defs.noTimeMachine.targetBoss,defs.noTimeMachine.targetStep],[58,15]);
}

{
  // Starting Basic is a special Rebirth: Number=1, run systems/resources reset,
  // banks are emptied and the challenge remains active through later Rebirths.
  const unlockContext={bosses:58,attackTrainingLevels:10000};
  let state=fresh(unlockContext,0);
  state.rebirth.number=12345;
  state.rebirth.nextNumber=54321;
  state.bank.advancedTraining=10;
  state.bank.timeMachineSpeed=20;
  state.bank.timeMachineGold=30;
  state.bank.beards=40;
  state.resources.energy.current=400;
  state.currencies.gold=1e9;
  state.systems.augmentations.data.pairs.scissors.level=12;
  const started=applyIdleNguAction(state,{action:"challenge",mode:"start",challenge:"basic"},unlockContext,60_000);
  state=started.state;
  assert.equal(started.result.challengeReset,true);
  assert.equal(state.challenge.active,"basic");
  assert.equal(state.rebirth.number,1);
  assert.equal(state.resources.energy.current,0);
  assert.equal(state.currencies.gold,0);
  assert.equal(state.systems.augmentations.data.pairs.scissors.level,0);
  assert.deepEqual(state.bank,{advancedTraining:0,timeMachineSpeed:0,timeMachineGold:0,beards:0});

  const reborn=rebirthIdleNguState(state,{bosses:10,attackTrainingLevels:10000},300_000);
  assert.equal(reborn.challenge.active,"basic");
  /*
   * 2026-09-24 : l'ancienne assertion (NUMBER >= 1) ne tenait que grâce au
   * facteur « prior boss » 2^58 hérité du run d'avant le défi. Pages Evil /
   * SADISTIC difficulty : démarrer un défi remet « number and all last
   * rebirth number factors » à 1 ; un Rebirth de 4 min après 10 boss donne
   * donc 2^10 x facteur de temps(4 min) x facteur d'entraînement 2, < 1
   * (page Rebirths : le NUMBER peut baisser, facteur < 1 sous une heure).
   */
  const attendu=Math.pow(2,10)*idleNguRebirthTimeFactor(240)*2;
  assert.ok(Math.abs(reborn.rebirth.number/attendu-1)<1e-9,`NUMBER ${reborn.rebirth.number} != ${attendu}`);
}

{
  // Completion grants the normal Basic currency reward and quitting never
  // restores the pre-challenge Number.
  const context={bosses:58};
  let state=fresh(context,0);
  state=applyIdleNguAction(state,{action:"challenge",mode:"start",challenge:"basic"},context,10_000).state;
  const completed=applyIdleNguAction(state,{action:"challenge",mode:"complete",challenge:"basic"},{bosses:58},20_000);
  assert.equal(completed.state.challenge.completions.basic,1);
  assert.equal(completed.state.currencies.experience,1500);
  // 2026-09-24 : 2500 AP x bonus des succès (boss 10..50 + "Rebirth once!" = 80 BP -> x1,008,
  // page Arbitrary Points), arrondi inférieur.
  assert.equal(completed.state.currencies.ap,2520);
  assert.equal(completed.state.challenge.active,"");

  let quit=fresh(context,0);
  quit=applyIdleNguAction(quit,{action:"challenge",mode:"start",challenge:"basic"},context,10_000).state;
  quit.rebirth.number=7;
  quit=applyIdleNguAction(quit,{action:"challenge",mode:"stop"},{bosses:12},20_000).state;
  assert.equal(quit.challenge.active,"");
  assert.equal(quit.rebirth.number,7);
}

{
  // Existing challenge restrictions are now authoritative, not UI-only.
  let aug=fresh({bosses:75},0);
  aug=applyIdleNguAction(aug,{action:"challenge",mode:"start",challenge:"noAugmentations"},{bosses:75},10_000).state;
  aug.systems.augmentations.data.pairs.scissors.level=999;
  assert.equal(idleNguAugmentationMultiplier(aug),1);
  assert.throws(()=>applyIdleNguAction(aug,{action:"allocate",system:"augmentations",resource:"energy",value:1},{bosses:1},20_000),/DEFI_SANS_AUGMENTATIONS/);

  let tm=fresh({bosses:100},0);
  tm.systems.diggers.unlocked=true;
  tm.systems.timeMachine.unlocked=true;
  tm.systems.timeMachine.data.bestGoldThisRun=1e9;
  tm.systems.timeMachine.data.goldLevel=100;
  tm=applyIdleNguAction(tm,{action:"challenge",mode:"start",challenge:"noTimeMachine"},{bosses:100},10_000).state;
  assert.equal(idleNguTimeMachineGrossGoldPerSecond(tm),0);

  let noRb=fresh({bosses:100},0);
  noRb.adventure.titans.t3={kills:1,nextAt:0};
  noRb=applyIdleNguAction(noRb,{action:"challenge",mode:"start",challenge:"noRebirth"},{bosses:100},10_000).state;
  assert.throws(()=>rebirthIdleNguState(noRb,{bosses:20},300_000),/REBIRTH_INTERDITE_DEFI/);
}

{
  // Audit 2026-09-16 : 5 défis marqués implemented:false ne pouvaient pas
  // être lancés du tout ("DEFI_EN_PREPARATION"). Vérifie que chacun est
  // désormais réellement jouable ET que sa contrainte de jeu est appliquée.
  const def=id=>IDLE_NGU_NORMAL_CHALLENGES.find(d=>d.id===id);
  for (const id of ["twentyFourHours","hundredLevels","troll","laserSword","blind"]) {
    assert.equal(def(id).implemented,true,id+" doit maintenant être marqué implémenté.");
  }

  // "offline progress disabled" (24h/100 Levels/Troll) : un gros rattrapage
  // (plusieurs heures d'un coup) ne doit plus faire progresser les systèmes
  // passifs pendant que l'un des trois est actif.
  for (const id of ["twentyFourHours","hundredLevels","troll"]) {
    let state=fresh({bosses:100},0);
    state.adventure.titans.t2={kills:1,nextAt:0};
    state.challenge.bestMs.basic=3600000;
    state.systems.ngu.data.ngus.normal.powerAlpha.level=10;
    state=applyIdleNguAction(state,{action:"challenge",mode:"start",challenge:id},{bosses:100},10_000).state;
    state.systems.timeMachine.unlocked=true;
    state.systems.timeMachine.allocation={energy:1000,magic:0};
    state.resources.energy.power=1;
    state.currencies.gold=1e12;
    const before=state.systems.timeMachine.data.speedLevel;
    const after=advanceIdleNguState(state,10*3600,{bosses:100},20_000);
    // Repère wiki (1 Power, 1000 alloué) = 1 000 000s pour le niveau 0->1 ;
    // même 10h (36 000s) ne doivent JAMAIS suffire une fois plafonnées à 60s.
    assert.equal(after.systems.timeMachine.data.speedLevel,before,id+" doit plafonner le rattrapage hors-ligne, pas laisser passer 10h d'un coup.");
  }

  // "100 Levels Challenge" : pool combiné de 100 niveaux par Rebirth,
  // partagé entre Augments/Blood Magic/Time Machine/Wandoos/Beards.
  {
    let state=fresh({bosses:100},0);
    state.systems.ngu.data.ngus.normal.powerAlpha.level=10;
    state=applyIdleNguAction(state,{action:"challenge",mode:"start",challenge:"hundredLevels"},{bosses:100},10_000).state;
    state.challenge.hundredLevelsGained=99;
    state.systems.augmentations.unlocked=true;
    state.systems.augmentations.data.trainUpgrade=false;
    state.resources.energy.power=1e12;
    state.resources.energy.bars=1e12;
    state.currencies.gold=1e30;
    const after=advanceIdleNguState(state,60,{bosses:17},20_000);
    assert.ok(after.systems.augmentations.data.pairs.scissors.level<=1,"Le pool à 99/100 ne doit laisser passer qu'1 seul niveau supplémentaire, jamais plus.");
    assert.ok(after.challenge.hundredLevelsGained<=100,"Le compteur du pool ne doit jamais dépasser 100.");

    const reborn=rebirthIdleNguState(
      Object.assign({},after,{challenge:Object.assign({},after.challenge,{active:""})}),
      {bosses:17},
      200_000
    );
    assert.equal(reborn.challenge.hundredLevelsGained,0,"Le pool des 100 niveaux se remet à zéro à chaque Rebirth (pas seulement au lancement du défi).");
  }

  // "Laser Sword Challenge" : seul défi qui ne réinitialise PAS NUMBER/banks,
  // et dont la condition de victoire est le niveau réel de l'Augment (2/2
  // pour la 1re completion), pas un champ d'inventaire Aventure inexistant.
  {
    let locked=fresh({bosses:100},0);
    assert.throws(
      ()=>applyIdleNguAction(locked,{action:"challenge",mode:"start",challenge:"laserSword"},{bosses:100},10_000),
      /DEFI_VERROUILLE/,
      "Sans Augment Laser Sword niveau 1/1, le défi doit rester verrouillé."
    );

    let state=fresh({bosses:100},0);
    state.systems.augmentations.data.pairs.laserSword={level:1,upgradeLevel:1,progress:0,upgradeProgress:0};
    state.systems.timeMachine.unlocked=true;
    state.systems.timeMachine.data.speedLevel=500;
    state.systems.perks.data.levels[41]=10;
    state.rebirth.number=42;
    const started=applyIdleNguAction(state,{action:"challenge",mode:"start",challenge:"laserSword"},{bosses:100},200_000);
    assert.equal(started.result.challengeReset,false,"Laser Sword ne doit jamais annoncer un reset de NUMBER/banks.");
    assert.notEqual(started.state.rebirth.number,1,"NUMBER ne doit pas être forcé à 1 pour Laser Sword (rebirth normal, formule habituelle).");
    assert.ok(started.state.bank.timeMachineSpeed>0,"Les banks doivent se remplir normalement (pas vidées de force) pour Laser Sword.");

    assert.throws(
      ()=>applyIdleNguAction(started.state,{action:"challenge",mode:"complete",challenge:"laserSword"},{bosses:100},20_000),
      /OBJECTIF_NON_ATTEINT/,
      "Niveau 1/1 ne suffit pas : la 1re completion exige 2/2."
    );

    started.state.systems.augmentations.data.pairs.laserSword.level=2;
    started.state.systems.augmentations.data.pairs.laserSword.upgradeLevel=2;
    const completed=applyIdleNguAction(started.state,{action:"challenge",mode:"complete",challenge:"laserSword"},{bosses:100},20_000);
    assert.equal(completed.state.challenge.completions.laserSword,1);
    assert.equal(completed.state.currencies.experience,3000);
    // 2026-09-24 : 3000 AP x bonus des succès (boss 10..100 + "Rebirth once!" = 235 BP), arrondi inférieur.
    assert.equal(completed.state.currencies.ap,3070);
  }

  // "Blind Challenge" : restriction purement visuelle (client), rien à
  // appliquer côté moteur — le générique unlock/win/récompense suffit.
  {
    let state=fresh({bosses:100},0);
    state.adventure.titans.t4={kills:1,nextAt:0};
    const started=applyIdleNguAction(state,{action:"challenge",mode:"start",challenge:"blind"},{bosses:100},10_000);
    assert.equal(started.state.challenge.active,"blind");
    const completed=applyIdleNguAction(started.state,{action:"challenge",mode:"complete",challenge:"blind"},{bosses:58},20_000);
    assert.equal(completed.state.challenge.completions.blind,1);
  }
}


{
  // V57 rewards are derived solely from completion counters.
  let state=fresh({bosses:100},1_000_000);
  state.challenge.completions.basic=1;
  state.challenge.completions.noAugmentations=5;
  state.challenge.completions.noEquipment=5;
  state.challenge.completions.noRebirth=2;
  state.challenge.completions.noNgu=3;
  state.challenge.completions.noTimeMachine=5;
  const b=idleNguChallengeBonuses(state);
  assert.ok(Math.abs(b.adventureStatsMultiplier-1.15)<1e-12);
  assert.ok(Math.abs(b.augmentationPowerMultiplier-2.25)<1e-12);
  assert.ok(Math.abs(b.augmentationSpeedMultiplier-1.10)<1e-12);
  assert.equal(b.augmentationCostMultiplier,0.5);
  assert.equal(b.inventorySlots,50);
  assert.equal(b.autoBoost,true);
  assert.equal(b.autoMergeTimeMultiplier,0.5);
  assert.equal(b.titanRespawnReductionMs,30*60*1000);
  assert.equal(b.titanLootLevelBonus,1);
  assert.ok(Math.abs(b.nguSpeedMultiplier-1.15)<1e-12);
  assert.equal(b.timeMachineGoldMultiplier,6);
  assert.ok(Math.abs(b.diggerGlobalMultiplier-1.05)<1e-12);
  assert.equal(b.diggerSlotBonus,1);

  const all=idleNguBonuses(state);
  assert.equal(all.challengeBonuses.inventorySlots,50);
  assert.equal(all.inventorySlotsFromChallenges,50);
}

{
  // Basic and No NGU completion bonuses affect their actual shared multipliers.
  let base=fresh({bosses:100},1_000_000);
  const adventureBase=idleNguBonuses(base).adventureMultiplier;
  base.challenge.completions.basic=1;
  assert.ok(Math.abs(idleNguBonuses(base).adventureMultiplier/adventureBase-1.15)<1e-9);

  const nguBase=idleNguBonuses(base).nguSpeedMultiplier;
  base.challenge.completions.noNgu=1;
  assert.ok(idleNguBonuses(base).nguSpeedMultiplier>nguBase);
}


{
  // V58 integration: challenge completion counters flow through idleNgu into
  // Adventure without duplicating the Titan rule in the meta engine.
  let state=fresh({bosses:100},1_000_000);
  state.challenge.completions.noRebirth=1;
  const applied=applyIdleNguAction(
    state,
    {action:"adventure",adventure:{action:"titan",titan:"t1"}},
    {bosses:100,adventurePower:1e9,adventureToughness:1e9},
    2_000_000
  );
  // No Rebirth : -15 min à partir de Jake seulement, GRB garde son cooldown de 1 h.
  assert.equal(applied.result.nextAt,2_000_000+60*60*1000);
  assert.ok(applied.result.drops.some(x=>x.set==="grb"&&x.level===1));
}

{
  /*
   * Wiki NGU (page "Advanced Training", section Formulas) : Bonus% pour
   * Power/Toughness = Level^0.4 * 10, vérifié contre la table du wiki
   * (niveau 10 -> 25.12%, niveau 100 -> 63.10%, niveau 1000 -> 158.49%).
   */
  const base=fresh({},1_000_000);
  const baseAttack=idleNguBonuses(base).adventurePowerMultiplier;
  const baseDefense=idleNguBonuses(base).adventureToughnessMultiplier;
  // Audit 2026-09-23 : ce bonus s'applique à la Power/Toughness D'AVENTURE, pas à l'Attack/Defense de Fight Boss.
  assert.equal(baseAttack,1);

  for (const [level,expectedPct] of [[10,25.12],[100,63.10],[1000,158.49]]) {
    const expectedMultiplier=1+expectedPct/100;

    const powerState=fresh({},1_000_000);
    powerState.systems.advancedTraining.unlocked=true; // 2026-09-24 : menu AT requis pour l'effet (page Banks)
    powerState.systems.advancedTraining.data.tracks.power.tempLevel=level;
    const attackBonus=idleNguBonuses(powerState).adventurePowerMultiplier;
    assert.equal(idleNguBonuses(powerState).attackMultiplier,idleNguBonuses(base).attackMultiplier,"Advanced Training n'agit pas sur Attack");
    assert.ok(
      Math.abs(attackBonus/baseAttack/expectedMultiplier-1)<1e-3,
      `attack AT level ${level}: attendu x${expectedMultiplier}`
    );

    const toughnessState=fresh({},1_000_000);
    toughnessState.systems.advancedTraining.unlocked=true;
    toughnessState.systems.advancedTraining.data.tracks.toughness.tempLevel=level;
    const defenseBonus=idleNguBonuses(toughnessState).adventureToughnessMultiplier;
    assert.equal(idleNguBonuses(toughnessState).defenseMultiplier,idleNguBonuses(base).defenseMultiplier,"Advanced Training n'agit pas sur Defense");
    assert.ok(
      Math.abs(defenseBonus/baseDefense/expectedMultiplier-1)<1e-3,
      `defense AT level ${level}: attendu x${expectedMultiplier}`
    );
  }
}

{
  /*
   * Wiki NGU (page "Energy", section Uses > Advanced Training : "Energy
   * power affects it only by a Sqrt(Energy Power)") — doubler la Puissance
   * d'énergie doit multiplier la vitesse de progression de l'Advanced
   * Training par sqrt(2), pas par 2 (contrairement à Wandoos/NGU/Wishes).
   */
  const context={bosses:17,basicTrainingComplete:true};
  let low=fresh(context,1_000_000);
  low.systems.advancedTraining.unlocked=true;
  low.resources.energy.cap=1_000_000;
  low.resources.energy.current=1_000_000;
  low.resources.energy.power=1;
  low.systems.advancedTraining.allocation.energy=1000;
  low.systems.advancedTraining.data.activeTrack="power";
  low=advanceIdleNguState(low,1000,context,1_001_000);
  const lowLevel=low.systems.advancedTraining.data.tracks.power.tempLevel
    +low.systems.advancedTraining.data.tracks.power.progress;

  let high=fresh(context,1_000_000);
  high.systems.advancedTraining.unlocked=true;
  high.resources.energy.cap=1_000_000;
  high.resources.energy.current=1_000_000;
  high.resources.energy.power=4;
  high.systems.advancedTraining.allocation.energy=1000;
  high.systems.advancedTraining.data.activeTrack="power";
  high=advanceIdleNguState(high,1000,context,1_001_000);
  const highLevel=high.systems.advancedTraining.data.tracks.power.tempLevel
    +high.systems.advancedTraining.data.tracks.power.progress;

  // power x4 -> sqrt(4) = x2 en vitesse, pas x4.
  assert.ok(Math.abs(highLevel/lowLevel/2-1)<1e-6);
}

console.log("SOREAL IDLE V47 early-game parity tests: OK");
