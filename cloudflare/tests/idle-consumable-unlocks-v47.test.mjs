import assert from 'node:assert/strict';
import {normalizeIdleNguState,applyIdleNguAction} from '../src/idle-ngu-progression.js';

const ctx={bosses:58,bestGold:1e6,adventurePower:5000,adventureToughness:5000};
let state=normalizeIdleNguState({},ctx,1_000_000);

// A consumable in inventory does not unlock its feature until it is used.
state.adventure.unlockItems.aNumber=true;
state=normalizeIdleNguState(state,ctx,1_000_000);
assert.equal(state.systems.ngu.unlocked,false);
let used=applyIdleNguAction(state,{action:'adventure',adventure:{mode:'consumeUnlock',itemId:'aNumber'}},ctx,1_000_001);
assert.equal(used.state.adventure.unlockFlags.ngu,true);
assert.equal(used.state.systems.ngu.unlocked,true);

// The legacy/meta Titan action delegates to Adventure V47 instead of creating
// a second independent Titan reward path.
state=normalizeIdleNguState({},ctx,2_000_000);
const fought=applyIdleNguAction(state,{action:'titan'},ctx,2_000_000);
assert.equal(fought.state.adventure.titans.t1.kills,1);
assert.equal(fought.state.systems.titans.data.kills,1);
assert.equal(fought.state.adventure.unlockItems.aNumber,true);
assert.equal(fought.state.systems.ngu.unlocked,false);
assert.equal(fought.result.firstDrop,'aNumber');
assert.ok(Array.isArray(fought.result.drops));

const unlocked=applyIdleNguAction(fought.state,{action:'adventure',adventure:{mode:'consumeUnlock',itemId:'aNumber'}},ctx,2_000_001);
assert.equal(unlocked.state.systems.ngu.unlocked,true);

// Other guaranteed Titan consumables follow the same consume-first contract.
for(const [item,flag,system] of [
  ['giantSeed','yggdrasil','yggdrasil'],
  ['scrapPaper','diggers','diggers'],
  ['uugHair','beards','beards'],
  ['pissedOffKey','tower','tower'],
  ['wandoos98','wandoos','wandoos']
]){
  let s=normalizeIdleNguState({}, {bosses:200},3_000_000);
  s.adventure.unlockItems[item]=true;
  s=normalizeIdleNguState(s,{bosses:200},3_000_000);
  assert.equal(s.systems[system].unlocked,false,item+' must be consumed');
  s.adventure.unlockFlags[flag]=true;
  s.adventure.unlockItems[item]=false;
  s=normalizeIdleNguState(s,{bosses:200},3_000_001);
  assert.equal(s.systems[system].unlocked,true,item+' consumed flag');
}

/*
 * V148 — trouvé en auditant l'intégration après avoir construit Walderp
 * (2026-09-11) : MacGuffins est conditionné à
 * unlock:{flag:"walderpFinalDefeated"} (IDLE_NGU_SYSTEMS ci-dessus dans
 * idle-ngu-progression.js), mais RIEN ne posait jamais ce flag —
 * MacGuffins était donc structurellement impossible à débloquer, même
 * en battant réellement Walderp jusqu'à sa forme finale. Corrigé dans
 * idle-adventure-v47.js (titan()). Ce test va bout en bout via le vrai
 * chemin réseau (applyIdleNguAction/action:'adventure'), pas seulement
 * l'état interne d'idle-adventure-v47.js.
 */
{
  const ctxWalderp={bosses:116,adventurePower:5000000,adventureToughness:5000000};
  let s=normalizeIdleNguState({},ctxWalderp,4_000_000);
  assert.equal(s.systems.macguffins.unlocked,false,"MacGuffins doit démarrer verrouillé.");

  const formes=[
    {power:800000,toughness:400000},
    {power:1600000,toughness:800000},
    {power:2400000,toughness:1500000},
    {power:3200000,toughness:2300000},
    {power:4000000,toughness:3000000}
  ];
  let t=4_000_000;
  for(let i=0;i<4;i++){
    const combat=applyIdleNguAction(
      s,{action:'adventure',adventure:{action:'titan',titan:'t5',stats:formes[i]}},ctxWalderp,t
    );
    s=combat.state;
    assert.equal(s.systems.macguffins.unlocked,false,`MacGuffins ne doit pas se débloquer avant la forme finale (forme ${i+1}).`);
    const trouve=applyIdleNguAction(
      s,{action:'adventure',adventure:{action:'titanFound',titan:'t5'}},ctxWalderp,t+1
    );
    s=trouve.state;
    t+=3*3600000+10;
  }

  const finale=applyIdleNguAction(
    s,{action:'adventure',adventure:{action:'titan',titan:'t5',stats:formes[4]}},ctxWalderp,t
  );
  s=finale.state;
  assert.equal(s.adventure.unlockFlags.walderpFinalDefeated,true,"Le flag doit être posé dès la forme finale vaincue.");
  assert.equal(s.systems.macguffins.unlocked,true,"MacGuffins doit se débloquer immédiatement (même tick), sans attendre un autre appel serveur.");
}

console.log('SOREAL IDLE V47 consumable unlock and Titan single-source guards: OK');
