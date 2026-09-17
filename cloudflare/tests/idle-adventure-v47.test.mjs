import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_V47,IDLE_ADVENTURE_ZONES,IDLE_ADVENTURE_TITANS,IDLE_ADVENTURE_SETS,
  normalizeIdleAdventureStateV47,idleAdventureMergeLevelV47,idleAdventureItemAtLevelV47,
  idleAdventureSnapshotV47,applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

assert.equal(normalizeIdleAdventureStateV47({version:"old",inventory:[{level:99}]}).inventory.length,0);
const gates=Object.fromEntries(IDLE_ADVENTURE_ZONES.map(z=>[z.id,z.boss]));
assert.deepEqual([gates.tutorial,gates.sewers,gates.forest,gates.cave,gates.sky,gates.hsb,gates.clock,gates["2d"],gates.ancient,gates.avsp,gates.mega],[4,7,17,37,48,58,66,74,82,90,100]);
assert.deepEqual(IDLE_ADVENTURE_TITANS.map(x=>x.cooldown/3600000),[1,1,2,2,3,3.5]);
assert.deepEqual(IDLE_ADVENTURE_ZONES.map(x=>x.avatarLevel),[1,1,1,2,2,3,3,4,4,5,5,6,6,6,6,6]);
assert.deepEqual(IDLE_ADVENTURE_TITANS.map(x=>x.avatarLevel),[3,4,5,6,6,6]);
assert.deepEqual(IDLE_ADVENTURE_TITANS.slice(1).map(x=>[x.requiresTitan,x.requiresKills,x.requiresUnlock]),[
  ["t1",24,"ngu"],["t2",24,"yggdrasil"],["t3",28,"diggers"],
  [undefined,undefined,undefined],[undefined,undefined,undefined]
]);
assert.deepEqual(IDLE_ADVENTURE_TITANS.map(x=>x.drop),["aNumber","giantSeed","scrapPaper","uugHair","wanderersCane","heroicSigil"]);
assert.equal(idleAdventureMergeLevelV47(0,0),1);
assert.equal(idleAdventureMergeLevelV47(5,3),9);
assert.equal(idleAdventureMergeLevelV47(90,90),100);

const lv0=idleAdventureItemAtLevelV47("forest:weapon",0);
const lv100=idleAdventureItemAtLevelV47("forest:weapon",100);
assert.equal(Math.round(lv100.power*1000),Math.round(lv0.power*2000));

let s=normalizeIdleAdventureStateV47({},0);
for(const slot of IDLE_ADVENTURE_SETS.training.slots){
  let r=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:`training:${slot}`,level:100},{bosses:4},1);
  s=r.state;
}
assert.equal(s.completedSets.training,true);
assert.equal(s.setRewards.experience,10);
const remembered=Object.keys(s.itemList).length;
s.inventory=[];
assert.equal(idleAdventureSnapshotV47(s,4).completedSets.training,true);
assert.equal(Object.keys(idleAdventureSnapshotV47(s,4).itemList).length,remembered);

s=normalizeIdleAdventureStateV47({});
let a=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"forest:weapon",level:0},{bosses:17},1);s=a.state;
let b=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"forest:weapon",level:0},{bosses:17},1);s=b.state;
const ids=s.inventory.map(x=>x.id);
s=applyIdleAdventureActionV47(s,{action:"merge",a:ids[0],b:ids[1]},{bosses:17},1).state;
assert.equal(s.inventory.length,1);
assert.equal(s.inventory[0].level,1);
assert.equal("rarete" in s.inventory[0],false);

s=normalizeIdleAdventureStateV47({});
let t=applyIdleAdventureActionV47(s,{action:"titan",titan:"t1"},{bosses:58,stats:{power:2000,toughness:2000}},1000);
assert.equal(t.result.firstDrop,"aNumber");
assert.equal(t.result.nextAt,1000+3600000);
s=t.state;
s=applyIdleAdventureActionV47(s,{action:"consumeUnlock",item:"aNumber"},{bosses:58},2000).state;
assert.equal(s.unlockFlags.ngu,true);

s=normalizeIdleAdventureStateV47({});
s.unlockFlags.ngu=true;
s.titans.t1={kills:24,nextAt:0};
t=applyIdleAdventureActionV47(s,{action:"titan",titan:"t2"},{bosses:66,stats:{power:6000,toughness:5000}},1000);
assert.equal(t.result.firstDrop,"giantSeed");
s=t.state;
s=applyIdleAdventureActionV47(s,{action:"consumeUnlock",item:"giantSeed"},{bosses:66},2000).state;
assert.equal(s.unlockFlags.yggdrasil,true);

s=normalizeIdleAdventureStateV47({});
assert.throws(()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t4"},{bosses:100,stats:{power:1e6,toughness:1e6}},1),/PROTECTION_TITAN_REQUISE/);

s=normalizeIdleAdventureStateV47({});
s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"ringOfApathy",level:100},{bosses:100},1).state;
assert.equal(s.unlockFlags.ringOfApathyMaxed,true);
s.unlockFlags.diggers=true;
s.titans.t3={kills:28,nextAt:0};
t=applyIdleAdventureActionV47(s,{action:"titan",titan:"t4"},{bosses:100,stats:{power:1e6,toughness:1e6}},2);
assert.equal(t.result.firstDrop,"uugHair");

s=normalizeIdleAdventureStateV47({});
s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"tutorialCube",level:100},{bosses:4},1).state;
assert.equal(s.cube.unlocked,true);
assert.equal(s.unlockFlags.tutorialCubeMaxed,true);


// V47 regression: zoneKill accepts the runtime adventureStats alias.
s=normalizeIdleAdventureStateV47({});
s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"tutorial"},{bosses:4},1).state;
assert.doesNotThrow(()=>
  applyIdleAdventureActionV47(
    s,
    {action:"zoneKill"},
    {bosses:4,adventureStats:{power:20,toughness:20}},
    2
  )
);



// V49 pacing: a fresh save cannot skip the NGU -> Yggdrasil -> Diggers chain.
// 24 GRB kills, 24 Tree kills and 28 Jake kills imply 100 hours of Titan
// cooldown between the first GRB and eligibility for UUG, before gear farming.
s=normalizeIdleAdventureStateV47({});
assert.throws(
  ()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t2"},{bosses:100,stats:{power:1e9,toughness:1e9}},1),
  /PROGRESSION_TITAN_REQUISE/
);
s.unlockFlags.ngu=true;
s.titans.t1={kills:23,nextAt:0};
assert.throws(
  ()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t2"},{bosses:100,stats:{power:1e9,toughness:1e9}},1),
  /PROGRESSION_TITAN_REQUISE/
);
s.titans.t1.kills=24;
assert.doesNotThrow(
  ()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t2"},{bosses:100,stats:{power:1e9,toughness:1e9}},1)
);
const visualSnap=idleAdventureSnapshotV47(s,100);
assert.equal(visualSnap.visualSource,"avatar-level");
assert.equal(visualSnap.zones.find(x=>x.id==="mega").visual.level,6);
assert.equal(visualSnap.titans.find(x=>x.id==="t3").progressionUnlocked,false);

/*
 * Bug trouvé en vérifiant le vrai NGU (Norman, 2026-09-10) : GRB (t1)
 * n'a aucun prérequis de chaîne (titanGate renvoie toujours true pour
 * lui), donc un joueur tout juste arrivé en Aventure (bosses:0) le
 * voyait "Affronter" cliquable alors que le vrai seuil NGU est boss 58 —
 * le clic échouait ensuite avec TITAN_VERROUILLE. progressionUnlocked
 * doit refléter le VRAI seuil de boss, pas seulement la chaîne entre
 * titans.
 */
{
  const frais=normalizeIdleAdventureStateV47({});
  const snapFrais=idleAdventureSnapshotV47(frais,0);
  assert.equal(
    snapFrais.titans.find(x=>x.id==="t1").progressionUnlocked,false,
    "GRB (boss 58 requis) ne doit jamais apparaître accessible avant boss 58, même sans prérequis de chaîne."
  );
  const snapPret=idleAdventureSnapshotV47(frais,58);
  assert.equal(
    snapPret.titans.find(x=>x.id==="t1").progressionUnlocked,true,
    "GRB doit devenir accessible dès que le boss 58 est atteint."
  );
}


// V58 — No Rebirth rewards alter the real Adventure Titan engine.
s=normalizeIdleAdventureStateV47({});
t=applyIdleAdventureActionV47(
  s,
  {action:"titan",titan:"t1"},
  {
    bosses:58,
    stats:{power:2000,toughness:2000},
    titanCooldownReductionMs:15*60*1000,
    titanLootLevelBonus:1
  },
  5000
);
assert.equal(t.result.nextAt,5000+45*60*1000);
assert.ok(t.result.drops.some(x=>x.set==="grb"&&x.level===1));

s=normalizeIdleAdventureStateV47({});
t=applyIdleAdventureActionV47(
  s,
  {action:"titan",titan:"t1"},
  {
    bosses:58,
    stats:{power:2000,toughness:2000},
    titanCooldownReductionMs:10*3600000
  },
  7000
);
assert.equal(t.result.nextAt,7000);

// V60 — Combat de zone réel (Norman, 2026-09-09) : "on voit l'ennemi, on
// voit les barres de vie qui descendent à chaque coup. Comme pour les
// boss." startZoneFight/resolveZoneFight remplacent le clic instantané
// (zoneKill reste utilisable telle quelle, non touchée) par un vrai
// combat avec PV de monstre, simulé côté client comme le Combat de boss.
{
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;

  /*
   * RÉVISÉ 2026-09-14 (Norman, urgent : "les combats ne démarrent plus
   * en aventure") : AVENTURE_TROP_FAIBLE bloquait tout combat sous le
   * "Power/Toughness conseillé" de la zone — vérifié sur le wiki NGU que
   * c'est un simple conseil de confort, jamais une condition bloquante.
   * Un joueur avec 0 Power/Toughness doit donc pouvoir démarrer un
   * combat quand même (il encaissera juste plus de dégâts).
   */
  assert.doesNotThrow(
    ()=>applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:0,toughness:0}},1),
    "Un Power/Toughness sous le seuil conseillé ne doit plus jamais bloquer le démarrage d'un combat (conseil de confort, jamais une barrière)."
  );

  // Démarrage : un monstre avec de vrais PV apparaît, le kill n'est PAS
  // encore compté (contrairement à l'ancien zoneKill instantané). Les PV
  // sont maintenant de petits nombres façon NGU (rang de zone), pas une
  // dérivation de z.p — sewers est la zone d'index 2 (safe=0, tutorial=1).
  //
  // boss est tiré au hasard (25% — voir bloc dédié plus bas), Math.random
  // est donc figé ici pour garder ce test déterministe sur le reste des
  // assertions (monsterHpMax, playerHpMax...).
  let f;
  {
    const alea=Math.random;
    Math.random=()=>0.9;
    try{f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);}
    finally{Math.random=alea;}
  }
  s=f.state;
  assert.equal(f.result.active,true);
  assert.equal(f.result.zone,"sewers");
  assert.equal(f.result.boss,false);
  /*
   * Depuis le 2026-09-17 (Norman : "il y a une version boss fight et une
   * version adventure pour chaque mobs, tu dois connaitre les 2"), le
   * pool de PV n'est plus la simple moyenne de zone (z.oneHitP=194) mais
   * le VRAI mob tiré par monsterIndex (IDLE_ADVENTURE_MOB_BESTIARY_V1),
   * mis à l'échelle de zone. Math.random()=0.9 fige ce combat sur le
   * reskin sewers "mutant_rat" (index 2 sur 3).
   *
   * Extension bestiaire V2 (même jour, miroir wiki local complet) : Sewers
   * a maintenant ses 3 VRAIS mobs normaux (A Slightly Bigger Mouse/A Large
   * Rat/Small Mouse -- "Small Mouse" manquait avant cette extension),
   * index 2 retombe donc directement sur "Small Mouse" (Max HP réel 40),
   * plus besoin de modulo sur un pool de 2 : floor(40 ×
   * (194/moyenne(50,70,40))) = floor(40 × 3.6375) = 145.
   */
  assert.equal(f.result.monsterHpMax,145,"PV du monstre = le VRAI mob tiré (Small Mouse, Max HP réel 40, mis à l'échelle du oneHitP de zone = 145), jamais z.t=12 (seuil de survie du JOUEUR) ni la simple moyenne de zone (194) qui ne distinguait pas les mobs entre eux.");
  assert.equal(f.result.monsterHp,f.result.monsterHpMax);
  /*
   * playerHpMaxForAdventureV1 (10+stats.hp) reste inchangée ici — ce test
   * appelle applyIdleAdventureActionV47 directement avec un stats brut
   * {power,toughness} sans .hp, exactement comme le fait idle-ngu-
   * progression.js AVANT d'enrichir hp via idleAdventureCombatStatsV1
   * (Attack×10, voir ce fichier) : stats.hp est donc 0 ici par construction
   * du test, playerHpMax=10. Le vrai enrichissement Attack×10 est
   * verrouillé séparément par idle-adventure-combat-stats-shared.test.mjs,
   * au niveau où il s'applique réellement.
   */
  assert.equal(f.result.playerHpMax,10,"Sans stats.hp fourni (cas de ce test isolé), playerHpMax reste 10+0=10 — inchangé, ce n'est pas ici que le vrai bug/correctif se trouve.");
  assert.equal(f.result.playerHp,f.result.playerHpMax);
  assert.equal(s.zone.kills.sewers||0,0,"Le kill ne doit être compté qu'à la résolution du combat, jamais à son démarrage.");
  assert.equal(idleAdventureSnapshotV47(s,7).fight.active,true,"Le combat en cours doit être exposé dans l'état renvoyé au client.");
  /*
   * Norman (2026-09-15) : "tous les ennemis rencontrés en aventure
   * n'apparaissent pas dans collection." Contrairement à zone.kills (ci-
   * dessus, compté seulement à la victoire), la vraie RENCONTRE doit être
   * comptée dès le démarrage du combat, qu'il soit gagné ou non ensuite —
   * c'est ce compteur que lit désormais construireBestiaireSorealIdle_
   * (idle-sqlite-runtime.js) pour décider "découvert" dans Collection.
   */
  assert.equal(s.zone.encounters.sewers,1,"Une rencontre avec un mob normal doit incrémenter zone.encounters dès le démarrage du combat, indépendamment de son issue.");
  assert.equal(Object.keys(s.zone.bossEncounters).length,0,"Un mob normal ne doit jamais incrémenter bossEncounters.");

  /*
   * IMPORTANT (bug corrigé 2026-09-10) : monsterHp/playerHp ne sont
   * JAMAIS mis à jour côté serveur (exactement comme bossPv pour le
   * Combat de boss) — seul le client simule les coups en temps réel, le
   * serveur ne fait qu'ouvrir/fermer le combat sur la demande du client.
   * resolveZoneFight/loseZoneFight ne doivent donc JAMAIS vérifier ces
   * valeurs eux-mêmes (une garde de ce genre, ajoutée puis retirée dans
   * cette même session, rendait la résolution impossible pour toujours,
   * puisque monsterHp côté serveur restait éternellement à sa valeur de
   * départ) — ils font confiance au client, comme pour le Combat de boss.
   */

  // Résolution : réutilise rollKill telle quelle (même compteur de kills,
  // mêmes drops possibles), et referme le combat — même si s.fight.monsterHp
  // (jamais mis à jour côté serveur) affiche encore sa valeur de départ,
  // exactement le scénario qui causait la régression du 2026-09-10.
  assert.ok(s.fight.monsterHp>0,"Le PV serveur n'est jamais décrémenté — précondition du test de non-régression ci-dessous.");
  const killsAvant=s.zone.kills.sewers||0;
  let r=applyIdleAdventureActionV47(s,{action:"resolveZoneFight"},{bosses:7,stats:{power:12,toughness:12}},2);
  s=r.state;
  assert.equal(r.result.zone,"sewers");
  assert.equal(s.zone.kills.sewers,killsAvant+1);
  assert.equal(s.fight.active,false);
  assert.equal(s.fight.monsterHp,0);
  assert.equal(s.fight.playerHp,0);

  /*
   * V152 — Or d'Aventure (Norman, 2026-09-11) : "il faut aussi regarder ce
   * que les mobs sont supposés looter. Il faut qu'ils lootent des golds
   * aussi." Sourcé exactement de la page Sewers du wiki NGU : un kill
   * NORMAL (pas un boss) donne "Gold 800-1,000" — jamais le plafond boss
   * (1,600-2,000), et jamais une plage approximée.
   */
  assert.ok(r.result.gold>=800&&r.result.gold<=1000,"Un kill normal à Sewers doit looter EXACTEMENT la plage sourcée du wiki (800-1000), pas une approximation.");
  assert.equal(s.permanent.gold,r.result.gold,"L'or gagné doit s'accumuler dans permanent.gold, comme l'expérience.");

  // Résoudre sans combat actif doit échouer plutôt que compter un kill fantôme.
  assert.throws(
    ()=>applyIdleAdventureActionV47(s,{action:"resolveZoneFight"},{bosses:7,stats:{power:12,toughness:12}},3),
    /AUCUN_COMBAT_ACTIF/
  );

  // Changer de zone pendant un combat actif doit abandonner ce combat tout
  // de suite (jamais le laisser "fantôme" actif sur l'ancienne zone — bug
  // signalé par Norman : "j'ai été en safe zone et l'ennemi est toujours
  // présent") plutôt que le laisser résoluble par erreur sur la nouvelle.
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},4).state;
  f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},5);
  s=f.state;
  assert.equal(s.fight.active,true);
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"forest"},{bosses:17},6).state;
  assert.equal(s.fight.active,false,"Changer de zone doit vider le combat de l'ancienne zone immédiatement.");
  assert.throws(
    ()=>applyIdleAdventureActionV47(s,{action:"resolveZoneFight"},{bosses:17,stats:{power:35,toughness:35}},7),
    /AUCUN_COMBAT_ACTIF/
  );

  // Défaite en Aventure : le joueur est renvoyé à la Safe Zone (Norman :
  // "en aventure, on doit être renvoyé à la safe zone"). Doit réussir même
  // si s.fight.playerHp (jamais mis à jour côté serveur) affiche encore sa
  // valeur de départ — le client est seul juge du moment de la défaite,
  // exactement comme pour resolveZoneFight ci-dessus.
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);
  s=f.state;
  assert.ok(s.fight.playerHp>0,"Le PV serveur n'est jamais décrémenté — précondition du test de non-régression ci-dessous.");
  const defeat=applyIdleAdventureActionV47(s,{action:"loseZoneFight"},{bosses:7,stats:{power:12,toughness:12}},3);
  assert.equal(defeat.result.defeated,true);
  assert.equal(defeat.result.zone,"sewers");
  assert.equal(defeat.state.selectedZone,"safe","Une défaite doit renvoyer le joueur à la Safe Zone.");
  assert.equal(defeat.state.fight.active,false);

  /*
   * V2 (2026-09-14, Norman : "est ce que tu as pris le % de chance de
   * rencontrer tel ou tel ennemi ? Je tombe constamment sur le boss de la
   * zone tutoriel mais je ne peux pas le battre sans stuff") — vérifié en
   * direct sur le wiki NGU (pages Tutorial Zone et Sewers) : "Boss Chance
   * 1/4", un vrai tirage ALÉATOIRE indépendant à chaque combat, jamais
   * "tous les 10 kills CONFIRMÉS" (l'ancien nextKill%10===0 se basait sur
   * s.zone.kills, incrémenté SEULEMENT en cas de victoire — un joueur qui
   * perd contre un boss restait donc bloqué à vie sur ce même boss,
   * exactement le symptôme signalé). Math.random est figé pour verrouiller
   * le seuil exact (25%) plutôt qu'un test statistique flaky.
   */
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  let normalHpMax=0,bossHpMax=0;
  {
    const alea=Math.random;
    try{
      Math.random=()=>0.9;
      f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);
      assert.equal(f.result.boss,false,"Math.random()=0.9 (>=0.25) doit donner un combat normal.");
      normalHpMax=f.result.monsterHpMax;

      Math.random=()=>0.1;
      f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);
      assert.equal(f.result.boss,true,"Math.random()=0.1 (<0.25) doit donner un combat de boss.");
      bossHpMax=f.result.monsterHpMax;
    }finally{Math.random=alea;}
  }
  /*
   * Depuis le 2026-09-17, normalHpMax vient désormais du VRAI mob normal
   * tiré (IDLE_ADVENTURE_MOB_BESTIARY_V1) plutôt que de la moyenne de
   * zone — il n'est donc plus mécaniquement égal à bossHpMax/3.
   *
   * Extension bestiaire V2 (même jour) : IDLE_ADVENTURE_MOB_CATALOG_V1
   * .sewers.boss reste vide (aucun art R2 dédié pour le boss de Sewers),
   * mais le tirage du monsterIndex retombe maintenant sur la longueur du
   * bestiaire réel quand le catalogue d'images est vide (cf. correctif
   * startZoneFight, "extension bestiaire V2 aux 15 zones") -- Sewers A
   * bien une entrée boss réelle (Brown Slime, Max HP réel 150), donc
   * bossHpMax = floor(150 × (194/moyenne(50,70,40))) = floor(150 ×
   * 3.6375) = 545, plus jamais l'ancien repli zone-plat ×3 (582) dès
   * qu'une vraie entrée existe.
   */
  assert.equal(bossHpMax,545,"Avec Brown Slime maintenant reconnu comme boss réel de Sewers (extension bestiaire V2), le combat de boss utilise SES stats réelles (150 × échelle de zone), jamais l'ancien repli zone-plat ×3.");
  assert.ok(bossHpMax>normalHpMax,"Un boss de zone doit avoir plus de PV qu'un monstre normal.");

  /*
   * Régression directe du bug signalé : perdre contre un boss (kills
   * inchangés, PAS incrémenté par une défaite) ne doit JAMAIS forcer le
   * combat suivant à être aussi un boss — deux tirages différents sur le
   * MÊME état (kills toujours à 0) doivent pouvoir donner des résultats
   * différents, contrairement à l'ancien nextKill%10 (déterministe sur
   * s.zone.kills seul, donc identique tant que kills ne change pas).
   */
  {
    const alea=Math.random;
    try{
      Math.random=()=>0.9;
      const apresPerte1=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);
      Math.random=()=>0.1;
      const apresPerte2=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);
      assert.notEqual(
        apresPerte1.result.boss,apresPerte2.result.boss,
        "Le résultat boss/normal doit pouvoir varier d'une tentative à l'autre même sans nouvelle victoire (kills inchangés) — sinon un joueur qui perd contre un boss reste bloqué dessus pour toujours."
      );
    }finally{Math.random=alea;}
  }

  /*
   * Correctif 2026-09-14 — le butin (or/loot boss) doit suivre le VRAI
   * combat mené (s.fight.boss, fixé par startZoneFight), jamais un second
   * calcul indépendant dans rollKill : avant ce correctif, rollKill
   * recalculait son propre kills%10, qui pouvait diverger du combat
   * réellement affiché au joueur.
   */
  {
    const alea=Math.random;
    try{
      Math.random=()=>0.9;
      f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1);
      assert.equal(f.result.boss,false);
    }finally{Math.random=alea;}
    s=f.state;
    assert.notEqual((s.zone.kills.sewers||0)%10,9,"Précondition : kills n'est pas sur une frontière de boss, pour prouver que le loot suit bien s.fight.boss et non un modulo recalculé.");
    s.fight.boss=true;
    s.fight.monsterHp=0;
    const r=applyIdleAdventureActionV47(s,{action:"resolveZoneFight"},{bosses:7,stats:{power:12,toughness:12}},2);
    assert.ok(r.result.boss,"resolveZoneFight doit rapporter un butin de boss puisque le combat mené (s.fight.boss) en était un.");
    assert.ok(r.result.gold>=1600&&r.result.gold<=2000,"L'or doit suivre la plage BOSS du wiki (1600-2000), pas la plage normale, puisque s.fight.boss=true faisait autorité.");
    s=r.state;
    assert.equal(s.zone.bossKills.sewers,1,"Le compteur de victoires de boss doit lui aussi suivre s.fight.boss.");
  }

  // zoneKill reste disponible et inchangée (compatibilité, non appelée par
  // le nouveau client mais non retirée par prudence).
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  const kill=applyIdleAdventureActionV47(s,{action:"zoneKill"},{bosses:7,stats:{power:12,toughness:12}},1);
  assert.equal(kill.result.zone,"sewers");
  assert.equal(kill.state.zone.kills.sewers,1);
}

// V61 — combat fantôme (Norman, 2026-09-09) : "j'ai été en safe zone et
// l'ennemi est toujours présent." Changer de zone en plein combat ne
// vidait jamais s.fight, qui restait actif indéfiniment sur l'ancienne
// zone — visible même sur le décor de la Safe Zone, qui n'a pourtant
// aucun ennemi dans le vrai NGU.
{
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:7,stats:{power:12,toughness:12}},1).state;
  assert.equal(s.fight.active,true);

  // Changer de zone en plein combat doit vider le combat immédiatement,
  // dans la même réponse — pas seulement au prochain chargement.
  const switched=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"safe"},{bosses:7},2);
  assert.equal(switched.state.fight.active,false,"Changer de zone doit abandonner tout combat resté actif sur l'ancienne zone.");
  assert.equal(switched.state.selectedZone,"safe");

  // Auto-guérison : une sauvegarde déjà bloquée (combat actif sur une
  // zone différente de selectedZone, comme si le bug précédent avait
  // déjà eu lieu) doit se réparer toute seule au chargement suivant,
  // sans attendre une remise à zéro complète.
  const corrompu={
    version:IDLE_ADVENTURE_V47,
    selectedZone:"safe",
    fight:{active:true,zone:"tutorial",monsterHp:12,monsterHpMax:18,boss:false,playerHp:5,playerHpMax:10}
  };
  const gueri=normalizeIdleAdventureStateV47(corrompu);
  assert.equal(gueri.fight.active,false,"Un combat fantôme (zone différente de selectedZone) doit être vidé automatiquement à la lecture.");
}

// V62 — capacité de sac réelle (Norman, 2026-09-10) : "j'ai un
// inventaire infini alors que dans NGU il est limité." Vrai NGU (wiki,
// page Inventory) : 24 emplacements gratuits au départ. Les objets
// ÉQUIPÉS n'occupent pas de place dans le sac (la capacité gouverne la
// grille, pas les emplacements d'équipement), et un sac plein ne fait
// jamais échouer l'action qui aurait dû donner du butin — le butin est
// juste silencieusement perdu (comme le vrai NGU : "you won't get any
// new drops").
{
  s=normalizeIdleAdventureStateV47({});
  const snap0=idleAdventureSnapshotV47(s,100);
  assert.equal(snap0.inventoryCapacity,24,"La capacité de base doit être 24, comme le vrai NGU.");
  assert.equal(snap0.inventoryUsed,0);

  // Remplir le sac jusqu'à la capacité avec de vrais ajouts (addItem).
  for(let i=0;i<24;i++){
    const r=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:100},1);
    s=r.state;
    assert.ok(r.result,"Chaque ajout jusqu'à la capacité doit réellement créer un objet.");
  }
  assert.equal(idleAdventureSnapshotV47(s,100).inventoryUsed,24);

  // Le 25ème ajout doit être silencieusement refusé (jamais une erreur).
  const plein=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:100},1);
  s=plein.state;
  assert.equal(plein.result,null,"Un sac plein doit renvoyer null, jamais lancer d'erreur ni ajouter l'objet.");
  assert.equal(idleAdventureSnapshotV47(s,100).inventoryUsed,24,"Le sac plein ne doit jamais dépasser sa capacité.");

  // Équiper un objet libère une vraie place dans le SAC (l'objet reste
  // dans l'inventaire mais n'occupe plus la grille du sac).
  const premierId=s.inventory[0].id;
  s=applyIdleAdventureActionV47(s,{action:"equip",id:premierId,slot:"head"},{bosses:100},1).state;
  assert.equal(idleAdventureSnapshotV47(s,100).inventoryUsed,23,"Un objet équipé ne doit plus compter dans la capacité du sac.");

  const apresEquip=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:100},1);
  assert.ok(apresEquip.result,"Une place libérée par l'équipement doit permettre un nouvel ajout réel.");

  // Un kill de zone dont le butin ne rentre plus doit quand même réussir
  // (le kill compte), simplement sans butin dans la réponse.
  s=apresEquip.state;
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:100},1).state;
  const killPlein=applyIdleAdventureActionV47(s,{action:"zoneKill"},{bosses:100,stats:{power:1000,toughness:1000}},1);
  assert.equal(killPlein.state.zone.kills.sewers,1,"Le kill doit être compté même si le sac est plein.");
  assert.ok(Array.isArray(killPlein.result.drops),"drops doit toujours être un tableau, jamais contenir null.");
  assert.ok(killPlein.result.drops.every(d=>d!==null),"Aucun butin perdu (sac plein) ne doit apparaître comme null dans drops.");
}

// V63 — case Trash (Norman, 2026-09-10) : "on doit pouvoir jeter les
// items aussi... il y a une case Trash dans NGU."
{
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:7},1).state;
  const objetId=s.inventory[0].id;
  assert.equal(s.inventory.length,1);

  const jete=applyIdleAdventureActionV47(s,{action:"discard",id:objetId},{bosses:7},1);
  assert.equal(jete.result.id,objetId);
  assert.equal(jete.state.inventory.length,0,"L'objet doit vraiment disparaître de l'inventaire.");

  // Jeter un objet introuvable doit échouer proprement.
  assert.throws(
    ()=>applyIdleAdventureActionV47(jete.state,{action:"discard",id:"introuvable"},{bosses:7},1),
    /OBJET_INTROUVABLE/
  );

  // Un objet ÉQUIPÉ ne doit jamais pouvoir être jeté directement (comme
  // le vrai NGU : il faut d'abord le déséquiper).
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:7},1).state;
  const equipeId=s.inventory[0].id;
  s=applyIdleAdventureActionV47(s,{action:"equip",id:equipeId,slot:"head"},{bosses:7},1).state;
  assert.throws(
    ()=>applyIdleAdventureActionV47(s,{action:"discard",id:equipeId},{bosses:7},1),
    /OBJET_EQUIPE/,
    "Un objet équipé ne doit pas pouvoir être jeté sans être déséquipé d'abord."
  );

  // Jeter un objet libère bien une place dans le sac (capacité).
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  for(let i=0;i<24;i++){
    s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:7},1).state;
  }
  assert.equal(idleAdventureSnapshotV47(s,7).inventoryUsed,24);
  s=applyIdleAdventureActionV47(s,{action:"discard",id:s.inventory[0].id},{bosses:7},1).state;
  assert.equal(idleAdventureSnapshotV47(s,7).inventoryUsed,23);
  const apresTrash=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:7},1);
  assert.ok(apresTrash.result,"Jeter un objet doit vraiment libérer une place réutilisable.");
}

/*
 * V151 — Norman (2026-09-11) : "je n'arrive plus à jeter des items ni à
 * déséquiper des items." Aucune action "unequip" n'existait — un objet
 * équipé (dont tout accessoire) n'avait donc littéralement aucun moyen de
 * redevenir déséquipé, et discard() refuse justement tout objet équipé.
 * unequip() doit libérer un slot unique (head/chest/legs/boots/weapon) ou
 * retirer l'objet du tableau accessories, sans jamais le supprimer de
 * l'inventaire, et le rendre ensuite jetable normalement.
 */
{
  let s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:0},{bosses:7},1).state;
  const id=s.inventory[0].id;
  s=applyIdleAdventureActionV47(s,{action:"equip",id,slot:"head"},{bosses:7},1).state;
  assert.equal(s.equipment.head,id);

  s=applyIdleAdventureActionV47(s,{action:"unequip",id},{bosses:7},1).state;
  assert.equal(s.equipment.head,"","unequip doit vider le slot head.");
  assert.ok(s.inventory.some(x=>x.id===id),"L'objet déséquipé doit rester dans l'inventaire.");

  s=applyIdleAdventureActionV47(s,{action:"discard",id},{bosses:7},1).state;
  assert.ok(!s.inventory.some(x=>x.id===id),"Une fois déséquipé, l'objet doit redevenir jetable normalement.");

  assert.throws(
    ()=>applyIdleAdventureActionV47(normalizeIdleAdventureStateV47({}),{action:"unequip",id:"introuvable"},{bosses:7},1),
    /OBJET_INTROUVABLE/
  );
}

/*
 * V151 — plafond d'emplacements accessoire (Norman, 2026-09-11) : "chaque
 * fois que j'ajoute un anneau, il me débloque un emplacement
 * supplémentaire... on en a 2 de base." Le tableau accessories était sans
 * plafond du tout ; il doit maintenant refuser un 3e accessoire "général"
 * tant qu'aucune source d'extension réelle n'est construite, tout en
 * laissant intact le cas déjà testé plus haut des 5 anneaux UUG
 * coéquipables (qui ne comptent pas contre ce plafond général).
 */
{
  let s=normalizeIdleAdventureStateV47({});
  const ids=[];
  for(let i=0;i<3;i++){
    s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:weapon",level:0},{bosses:7},1).state;
    ids.push(s.inventory[s.inventory.length-1].id);
  }
  s=applyIdleAdventureActionV47(s,{action:"equip",id:ids[0],slot:"accessory"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"equip",id:ids[1],slot:"accessory"},{bosses:7},1).state;
  assert.equal(s.equipment.accessories.length,2);

  assert.throws(
    ()=>applyIdleAdventureActionV47(s,{action:"equip",id:ids[2],slot:"accessory"},{bosses:7},1),
    /EMPLACEMENT_ACCESSOIRE_PLEIN/,
    "Un 3e accessoire général ne doit pas pouvoir s'équiper sans emplacement libre."
  );

  // Libérer un emplacement (unequip) doit à nouveau permettre d'équiper.
  s=applyIdleAdventureActionV47(s,{action:"unequip",id:ids[0]},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"equip",id:ids[2],slot:"accessory"},{bosses:7},1).state;
  assert.equal(s.equipment.accessories.length,2);

  assert.equal(idleAdventureSnapshotV47(s,7).accessorySlotsCapacity,2);
}

// V64 — Norman (2026-09-10) : "Les boost s'appliquent manuellement. Une
// fois niveau 100, on ne peut plus en ajouter sur l'item." (vrai NGU :
// une fois l'"actual stat" au "maximum potential", booster ne sert plus
// à rien — bloqué). Le niveau (0-100) est le proxy SOREAL de ce plafond.
//
// RÉVISÉ 2026-09-16 (Norman, 3e retour : "la fusion d'objet augmente la
// quantité de power. Mais dans NGU si un objet est 1/3 et que je le
// fusionne il passe à 1/4. La seule manière de le faire monter à 2/4
// sera de lui mettre des boosts") — un correctif intermédiaire du
// 2026-09-14 avait changé le plafond de applyBoost() de
// basePower×(1+niveau/100) (le plafond du niveau COURANT) vers
// basePower×2 (le plafond ABSOLU à niveau 100), en pensant réparer un
// boost "sans effet" sur un objet frais. Reconfirmé sur
// ngu-idle.fandom.com/wiki/Inventory, section "Leveling-up Items" :
// "Each time an item levels-up, its maximum potential will go up and
// require to be boosted" — le plafond grandit AVEC LE NIVEAU, pas de
// façon fixe. Un objet frais (jamais fusionné) est TOUJOURS déjà à son
// propre plafond du moment dès sa création (item()/special() calculent
// power=basePower×(1+niveau/100)) : un boost dessus est donc gâché SANS
// EFFET, ce qui est le comportement ATTENDU, pas un bug — l'écart
// n'apparaît qu'APRÈS une fusion (qui augmente le niveau, donc le
// plafond, sans jamais toucher la stat courante). Revenu au plafond
// niveau-par-niveau, la même formule "q" que item()/special().
{
  /*
   * Isolation stats réelles par objet (2026-09-15) : training:head
   * ("Cloth Hat") n'a plus de Power du tout (0, exact wiki) — un boost
   * "power" n'aurait donc plus aucun écart à combler. Ce bloc teste
   * désormais un boost "toughness" sur ce même objet (qui, lui, en a
   * réellement), même logique de test inchangée.
   */
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:50},{bosses:7},1).state;
  const cibleId=s.inventory[0].id;
  s.inventory.push({id:"boostTest1",definitionId:"boost:toughness:1",kind:"boost",boostType:"toughness",strength:1,level:0});

  const avantPuissance=s.inventory[0].toughness;
  assert.doesNotThrow(
    ()=>{s=applyIdleAdventureActionV47(s,{action:"boost",boostId:"boostTest1",targetId:cibleId},{bosses:7},1).state;},
    "Un objet sous le niveau max doit toujours pouvoir recevoir un boost (jamais bloqué/rejeté), même quand le boost n'a aucun effet."
  );
  const apresPuissance=s.inventory.find(x=>x.id===cibleId).toughness;
  assert.equal(
    apresPuissance,
    avantPuissance,
    "Un objet frais (jamais fusionné) est déjà à SON PROPRE plafond du niveau courant dès sa création — un boost dessus doit être gâché, sans aucun effet (comportement NGU attendu, pas un bug)."
  );
  assert.ok(
    !s.inventory.some(x=>x.id==="boostTest1"),
    "Le boost doit tout de même être consommé même quand il n'a aucun effet (fidèle au wiki : gâché, pas remboursé)."
  );

  /*
   * Un objet créé directement au niveau 100 : plafond du niveau courant
   * = basePower×(1+100/100) = basePower×2, donc identique au plafond
   * absolu — un boost supplémentaire ne doit rien ajouter non plus.
   */
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:100},{bosses:7},1).state;
  const cibleMaxId=s.inventory[0].id;
  const avantPuissanceMax=s.inventory[0].toughness;
  s.inventory.push({id:"boostTest2",definitionId:"boost:toughness:1",kind:"boost",boostType:"toughness",strength:1,level:0});
  s=applyIdleAdventureActionV47(s,{action:"boost",boostId:"boostTest2",targetId:cibleMaxId},{bosses:7},1).state;
  const apresPuissanceMax=s.inventory.find(x=>x.id===cibleMaxId).toughness;
  assert.equal(
    apresPuissanceMax,
    avantPuissanceMax,
    "Un objet déjà à son plafond pur (baseToughness×2, niveau 100 créé directement) ne doit RIEN gagner d'un boost supplémentaire — gâché, jamais ajouté au-delà du maximum."
  );
  assert.ok(
    !s.inventory.some(x=>x.id==="boostTest2"),
    "Le boost doit tout de même être consommé même quand il n'a aucun effet (fidèle au wiki : gâché, pas remboursé)."
  );

  /*
   * Cas Norman exact : la fusion crée un vrai écart (deux objets niveau
   * 40 fusionnés donnent niveau 81, wiki : "The new level will be the
   * sum of the levels of the two items, +1" — mais gardent la stat du
   * niveau 40, wiki : "the resulting merged item will have the max
   * number in each stat between the original items", jamais un recalcul
   * de formule). Seul un boost doit pouvoir combler cet écart, jusqu'au
   * plafond du NOUVEAU niveau (81), jamais jusqu'au plafond absolu
   * (niveau 100) puisque l'objet n'est pas allé jusque-là.
   */
  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:40},{bosses:7},1).state;
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"training:head",level:40},{bosses:7},1).state;
  const idsEcart=s.inventory.map(x=>x.id);
  s=applyIdleAdventureActionV47(s,{action:"merge",a:idsEcart[0],b:idsEcart[1]},{bosses:7},1).state;
  const cibleEcartId=s.inventory[0].id;
  const avantEcart=s.inventory[0].toughness;
  const niveauApresFusion=s.inventory[0].level;
  assert.equal(niveauApresFusion,81,"40+40+1=81 (idleAdventureMergeLevelV47), pour un écart connu et reproductible.");

  const basePureItem=idleAdventureItemAtLevelV47("training:head",0).toughness;
  const plafondNiveauCourant=basePureItem*(1+niveauApresFusion/100);
  const plafondAbsolu=basePureItem*2;
  assert.ok(
    avantEcart<plafondNiveauCourant-1e-9,
    "La fusion doit créer un vrai écart entre toughness et le plafond du NOUVEAU niveau (81) — sinon ce test ne prouve rien."
  );
  for(let i=0;i<50;i++){
    s.inventory.push({id:"boostTestEcart"+i,definitionId:"boost:toughness:1",kind:"boost",boostType:"toughness",strength:100,level:0});
    s=applyIdleAdventureActionV47(s,{action:"boost",boostId:"boostTestEcart"+i,targetId:cibleEcartId},{bosses:7},1).state;
  }
  const finalPower=s.inventory.find(x=>x.id===cibleEcartId).toughness;
  assert.ok(
    finalPower>avantEcart,
    "Le boost doit combler une partie de l'écart réel créé par la fusion (jamais totalement inerte quand un écart existe vraiment)."
  );
  assert.equal(
    finalPower,
    plafondNiveauCourant,
    "En boostant massivement, Toughness doit pouvoir atteindre EXACTEMENT le plafond du niveau COURANT (81, pas 100) — jamais rester bloqué en dessous, jamais le dépasser."
  );
  assert.ok(
    finalPower<plafondAbsolu-1e-9,
    "Le plafond du niveau courant (81) doit rester strictement sous le plafond absolu (niveau 100) — la fusion seule ne comble jamais tout l'écart jusqu'au niveau 100."
  );
}

/*
 * V3 (2026-09-15, Norman : "on tombe uniquement sur le boss... l'ennemi
 * qu'on rencontre doit être aléatoire... recopie les pourcentages") — le
 * correctif V2 ci-dessus avait figé UNE SEULE valeur universelle (25%)
 * pour toutes les zones, mais une vérification fraîche de CHAQUE page de
 * zone sur le wiki NGU (2026-09-15) a montré que "Boss chance X/Y" varie
 * réellement d'une zone à l'autre (18,75% à Cave contre 25% à
 * Tutorial/Sewers/2D/Ancient/AVSP/Beardverse/Badly Drawn World). Ce test
 * verrouille la table exacte recopiée du wiki, zone par zone, pour ne
 * jamais retomber sur une constante universelle par erreur.
 */
{
  const attendu={
    tutorial:1/4,sewers:1/4,forest:2/9,cave:3/16,sky:1/5,hsb:1/5,
    clock:2/9,"2d":1/4,ancient:1/4,avsp:1/4,mega:1/5,
    beardverse:1/4,badly:1/4,boring:2/9,chocolate:3/13
  };
  for(const[id,valeur]of Object.entries(attendu)){
    const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===id);
    assert.ok(z,`Zone ${id} introuvable dans IDLE_ADVENTURE_ZONES.`);
    assert.ok(
      Math.abs(z.bossChance-valeur)<1e-9,
      `bossChance de la zone ${id} doit correspondre au "Boss chance" exact du wiki NGU (${valeur}), reçu ${z.bossChance}.`
    );
  }
  const safe=IDLE_ADVENTURE_ZONES.find(x=>x.id==="safe");
  assert.equal(safe.bossChance,undefined,"Safety Zone n'a aucun combat, donc aucun bossChance ne doit y être défini.");

  s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"cave"},{bosses:37},1).state;
  {
    const alea=Math.random;
    try{
      Math.random=()=>3/16+0.001;
      let f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:37,stats:{power:150,toughness:150}},1);
      assert.equal(f.result.boss,false,"Cave of Many Things : juste au-dessus de 3/16 doit donner un combat normal (pas 25%).");

      Math.random=()=>3/16-0.001;
      f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:37,stats:{power:150,toughness:150}},1);
      assert.equal(f.result.boss,true,"Cave of Many Things : juste en-dessous de 3/16 doit donner un combat de boss.");
    }finally{Math.random=alea;}
  }
}

/*
 * EXP de boss d'Aventure (Norman, 2026-09-16, "les boss d'Aventure doivent
 * looter de l'EXP comme le reste du jeu") — jusqu'ici rollKill ne posait
 * JAMAIS d'EXP sur un kill de boss d'Aventure, alors que le wiki NGU
 * documente une ligne "Exp N (X% base chance, up to Y% max)" sur CHAQUE
 * zone du monde Normal (vérifié en direct au navigateur le 2026-09-16,
 * page par page — jamais depuis la mémoire). Ce test verrouille :
 * (1) le pourcentage ET la quantité EXACTS de chaque zone (le wiki ne
 * donne pas toujours "Exp 1" — ça grimpe avec la zone, jusqu'à "Exp 30" à
 * Boring-Ass Earth/Chocolate World, jamais un flat "1" partout comme un
 * premier passage superficiel aurait pu le supposer) ;
 * (2) qu'un kill NON-boss ne donne jamais d'EXP (le wiki ne documente ce
 * drop QUE sur la ligne "Boss" de chaque zone) ;
 * (3) que l'EXP gagnée s'accumule dans s.permanent.experience — EXACTEMENT
 * le même champ que checkSets() (reward.experience des sets) alimente déjà
 * plus haut dans idle-adventure-v47.js, jamais un second système d'EXP
 * parallèle.
 */
{
  const attendu={
    tutorial:{chance:.07,amount:1},
    sewers:{chance:.085,amount:1},
    forest:{chance:.10,amount:1},
    cave:{chance:.12,amount:1},
    sky:{chance:.16,amount:1},
    hsb:{chance:.09,amount:2},
    clock:{chance:.10,amount:2},
    "2d":{chance:.05,amount:3},
    ancient:{chance:.03,amount:5},
    avsp:{chance:.01,amount:10},
    mega:{chance:.005,amount:15},
    beardverse:{chance:.002,amount:20},
    badly:{chance:.0005,amount:25},
    boring:{chance:.0003,amount:30},
    chocolate:{chance:.0002,amount:30}
  };
  const alea=Math.random;
  try{
    for(const [id,{chance,amount}] of Object.entries(attendu)){
      const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===id);
      assert.ok(z,`Zone ${id} introuvable dans IDLE_ADVENTURE_ZONES.`);
      const eps=Math.max(chance*0.01,1e-7);

      let s0=normalizeIdleAdventureStateV47({});
      s0=applyIdleAdventureActionV47(s0,{action:"selectZone",zone:id},{bosses:z.boss},1).state;

      Math.random=()=>chance+eps;
      let r=applyIdleAdventureActionV47(s0,{action:"zoneKill"},{bosses:z.boss,forceBoss:true},2);
      assert.equal(r.result.experience,0,`Zone ${id} : juste AU-DESSUS du base chance (${chance}) ne doit donner AUCUNE EXP.`);
      assert.equal(r.state.permanent.experience,0,`Zone ${id} : aucune EXP ne doit s'accumuler dans permanent.experience si le roll échoue.`);

      Math.random=()=>Math.max(0,chance-eps);
      r=applyIdleAdventureActionV47(s0,{action:"zoneKill"},{bosses:z.boss,forceBoss:true},3);
      assert.equal(r.result.experience,amount,`Zone ${id} : juste EN-DESSOUS du base chance (${chance}) doit donner EXACTEMENT ${amount} EXP (ligne "Exp ${amount}" du wiki), pas une autre quantité.`);
      assert.equal(r.state.permanent.experience,amount,`Zone ${id} : l'EXP de boss doit s'accumuler dans permanent.experience, comme les rewards de set.`);
    }
  }finally{Math.random=alea;}

  // Un kill NON-boss ne doit jamais donner d'EXP, même avec un roll
  // toujours gagnant (Math.random=0) — le wiki ne documente ce drop QUE
  // sur la ligne "Boss" de chaque zone, jamais sur les ennemis normaux.
  {
    const alea2=Math.random;
    try{
      Math.random=()=>0;
      let s0=normalizeIdleAdventureStateV47({});
      s0=applyIdleAdventureActionV47(s0,{action:"selectZone",zone:"sewers"},{bosses:7},1).state;
      const r=applyIdleAdventureActionV47(s0,{action:"zoneKill"},{bosses:7,forceBoss:false},2);
      assert.equal(r.result.boss,false);
      assert.equal(r.result.experience,0,"Un kill NON-boss ne doit jamais donner d'EXP, même si le roll serait gagnant.");
      assert.equal(r.state.permanent.experience,0);
    }finally{Math.random=alea2;}
  }
}

console.log("Adventure compact V47 OK");
