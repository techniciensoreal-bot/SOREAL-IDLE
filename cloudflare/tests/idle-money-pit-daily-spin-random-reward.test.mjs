import assert from 'node:assert/strict';
import {normalizeIdleNguState,advanceIdleNguState,applyIdleNguAction,rebirthIdleNguState} from '../src/idle-ngu-progression.js';

/*
 * Norman (2026-09-14) : "Le money pit et la roue journalière doivent
 * afficher les lots remportés. Regarde bien le wiki pour voir les % de
 * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Tables
 * complètes relues directement sur le wiki NGU (pages Money Pit et
 * Daily Spin, via navigateur — les résultats de recherche étaient trop
 * incomplets). Les lots non buildables (Potions, Lucky Charm, Bar Bar,
 * Poop, Cube, Adv Stat, Equip+1lvl, Wandoos — aucune de ces mécaniques
 * n'existe encore côté SOREAL) sont honnêtement omis plutôt que
 * remplacés par une valeur inventée ; l'Or n'a JAMAIS été un lot réel
 * de la roue (contrairement à l'ancienne implémentation SOREAL).
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

// --- Tier 3 (1e9, palier "Boost 5" du wiki) : chaque tir doit accorder un vrai boost + le bonus AP fixe (log10) ---
{
  let cursor=state;
  let at=1_000_000;
  for(let i=0;i<10;i+=1){
    cursor.currencies.gold=1e9;
    const before=(cursor.adventure&&cursor.adventure.inventory||[]).length;
    const res=applyIdleNguAction(cursor,{action:'moneyPit'},context,at);
    assert.equal(res.result.tier,3,"1e9 doit correspondre au palier 3 (Boost 5, wiki : min 1B).");
    assert.ok(res.result.boost&&res.result.boost.strength===5,"Le palier 3 doit accorder un Boost de force 5 (exact du wiki), jamais une monnaie inventée.");
    assert.ok(['power','toughness','special'].includes(res.result.boost.type),"Le type de boost doit être un type réel (power/toughness/special).");
    assert.equal(res.result.reward.ap,Math.floor(Math.log10(1e9)),"Le bonus AP fixe doit suivre exactement la formule du wiki : log10(or jeté).");
    const after=(res.state.adventure&&res.state.adventure.inventory||[]).length;
    assert.equal(after,before+1,"Le boost accordé doit être réellement ajouté à l'inventaire Aventure (idleAdventureAddItemV1), pas juste mentionné dans la réponse.");
    cursor=res.state;
    cursor.systems.moneyPit.data.nextAt=at;
    at+=1;
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
    ['ap','seeds'].includes(cle),
    "Le Daily Spin (palier 0, joueur neuf) ne doit produire que les lots réels du wiki pour ce palier (AP), jamais l'Or (absent du wiki, fabriqué par l'ancienne implémentation SOREAL)."
  );
}

console.log('idle-money-pit-daily-spin-random-reward: OK');
