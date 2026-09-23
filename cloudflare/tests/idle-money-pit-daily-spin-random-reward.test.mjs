import assert from 'node:assert/strict';
import {normalizeIdleNguState,advanceIdleNguState,applyIdleNguAction,rebirthIdleNguState} from '../src/idle-ngu-progression.js';

/*
 * Norman (2026-09-14) : "Le money pit et la roue journalière doivent
 * afficher les lots remportés. Regarde bien le wiki pour voir les % de
 * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Tables
 * complètes relues directement sur le wiki NGU (pages Money Pit et
 * Daily Spin, via navigateur — les résultats de recherche étaient trop
 * incomplets). V212 active Adventure Stat, Boost, Adventure Max HP,
 * Adventure HP Regen et EXP aux premiers paliers. Les lots encore non
 * câblés restent omis plutôt que remplacés par une valeur inventée ;
 * l'Or n'a JAMAIS été un lot réel de la roue.
 */
const context={bosses:37,bestGold:0,basicTrainingComplete:true};

// --- Money Pit : le tirage n'est plus un cycle prévisible (rewardIndex) ---
let state=normalizeIdleNguState({},context,1_000_000);
state.currencies.gold=1e9;
state=normalizeIdleNguState(state,context,1_000_000);
assert.equal(
  state.systems.moneyPit.data.rewardIndex,
  undefined,
  "Le compteur de cycle déterministe rewardIndex ne doit plus exister (le tirage est désormais au hasard)."
);

// --- Tier 3 (1e9) : les cinq colonnes NGU déjà supportées sont réellement appliquées ---
{
  const originalRandom=Math.random;
  try{
    const cas=[
      {random:0.01,type:'adventureStats',value:5},
      {random:0.21,type:'boost',value:5},
      {random:0.41,type:'adventureHp',value:50},
      {random:0.61,type:'adventureRegen',value:0.5},
      {random:0.81,type:'experience',value:2}
    ];
    for(const c of cas){
      let cursor=normalizeIdleNguState({},context,1_000_000);
      cursor.currencies.gold=1e9;
      cursor=normalizeIdleNguState(cursor,context,1_000_000);
      const beforeInventory=cursor.adventure.inventory.length;
      Math.random=()=>c.random;
      const res=applyIdleNguAction(cursor,{action:'moneyPit'},context,1_000_000);
      assert.equal(res.result.tier,3,"1e9 doit correspondre au palier 3 (wiki : min 1B).");
      assert.equal(res.result.reward.ap,9,"Le bonus AP fixe doit rester floor(log10(1e9)) = 9.");

      if(c.type==='boost'){
        assert.ok(res.result.boost&&res.result.boost.strength===5,"Le tirage Boost du palier 3 doit donner Boost 5.");
        assert.ok(['power','toughness','special'].includes(res.result.boost.type));
        assert.equal(res.state.adventure.inventory.length,beforeInventory+1,"Le Boost doit réellement entrer dans l'inventaire.");
      }else{
        assert.equal(res.result.reward[c.type],c.value,"La magnitude du lot doit être celle du tableau Money Pit NGU.");
      }

      if(c.type==='adventureStats'){
        assert.equal(res.state.adventure.permanent.adventurePower,5);
        assert.equal(res.state.adventure.permanent.adventureToughness,5);
      }
      if(c.type==='adventureHp')assert.equal(res.state.adventure.permanent.adventureHp,50);
      if(c.type==='adventureRegen')assert.equal(res.state.adventure.permanent.adventureRegen,0.5);
      if(c.type==='experience')assert.equal(res.state.currencies.experience,2);
    }
  }finally{
    Math.random=originalRandom;
  }
}

// --- Tier 6 (1e15, deux lots possibles : EXP ou Seeds) : le tirage doit varier ---
{
  let cursor=state;
  cursor.systems.moneyPit.data.nextAt=1_000_000;
  const cles=new Set();
  let at=1_000_000;
  for(let i=0;i<40;i+=1){
    cursor.currencies.gold=1e15;
    const res=applyIdleNguAction(cursor,{action:'moneyPit'},context,at);
    assert.equal(res.result.tier,6,"1e15 doit correspondre au palier 6 (wiki : min 1Qa = 1e15).");
    const clesMonnaie=Object.keys(res.result.reward).filter(k=>k!=='ap');
    assert.equal(clesMonnaie.length,1,"Un seul type de monnaie (hors bonus AP fixe) doit être accordé par tirage.");
    clesMonnaie.forEach(k=>cles.add(k));
    cursor=res.state;
    cursor.systems.moneyPit.data.nextAt=at;
    at+=1;
  }
  assert.ok(
    cles.has('experience')&&cles.has('seeds'),
    "Sur 40 tirages au palier 6, EXP et Seeds (les deux lots réels du wiki pour ce palier) doivent tous les deux apparaître au moins une fois."
  );
}

// --- Daily Spin : jamais un index basé sur la date/le nombre de spins, jamais d'Or (absent du wiki) ---
let daily=normalizeIdleNguState({},context,10_000_000);
daily.currencies.gold=100000;
daily=advanceIdleNguState(daily,0,context,10_000_000);

const clesSpin=new Set();
let curseurSpin=daily;
let atSpin=10_000_000;
for(let i=0;i<30;i+=1){
  const res=applyIdleNguAction(curseurSpin,{action:'collect',system:'dailySpin'},context,atSpin);
  assert.ok(res.result.reward&&typeof res.result.reward==='object',"spinDaily doit renvoyer un objet reward exploitable.");
  Object.keys(res.result.reward).forEach(k=>clesSpin.add(k));
  curseurSpin=res.state;
  atSpin=res.result.readyAt; // wait for the real cooldown between spins
}
assert.ok(
  clesSpin.size>=1,
  "Le Daily Spin doit produire au moins un type de récompense exploitable."
);
for(const cle of clesSpin){
  assert.ok(
    ['ap','seeds','items'].includes(cle),
    "Le Daily Spin (palier 0, joueur neuf) ne doit produire que les lots réels du wiki pour ce palier (AP, graines, potions), jamais l'Or (absent du wiki, fabriqué par l'ancienne implémentation SOREAL)."
  );
}

console.log('idle-money-pit-daily-spin-random-reward: OK');
