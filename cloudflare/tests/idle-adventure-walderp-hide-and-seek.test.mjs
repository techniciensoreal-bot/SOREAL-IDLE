import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_TITANS,
  normalizeIdleAdventureStateV47,applyIdleAdventureActionV47,idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit NGU 2026-09-23 : le butin des titans suit désormais les taux "base
 * chance" du wiki (plus d'objets garantis inventés). Les tests qui vérifient
 * "ce qui PEUT tomber" forcent donc le tirage à 0 (tout réussit).
 */
function tirageForce(valeur,fn){
  const avant=Math.random;
  Math.random=()=>valeur;
  try{return fn()}finally{Math.random=avant}
}


/*
 * 2026-11-13 (Norman : « fais comme dans le vrai jeu ») : le moteur n'a plus de liste de panneaux. L'ancienne contenait « inventaire » et « bestiaire »,
 * qui n'étaient plus des menus (2026-09-24, 2026-10-08) : Walderp y restait introuvable. Le menu du cycle est déduit par l'interface parmi les menus
 * ouverts au joueur (modules/walderp-cachette-v1.js, test idle-walderp-cachette-v1) ; le moteur ne garde que l'instant, une graine et la durée du cycle.
 */
/*
 * Norman (2026-09-11) : d'abord accepté comme simplifié (forme unique,
 * combat direct), puis reconsidéré : "c'est pas vraiment des minijeu,
 * il faut juste aller à certains endroits et faire certaines choses,
 * non ?" — le vrai cache-cache en 5 formes est donc reproduit :
 * - 5 formes, Manual P/T du wiki (×environ 1.3-5x d'une forme à l'autre,
 *   jamais inventé).
 * - Entre chaque forme (sauf la 5e), Walderp se cache dans un panneau
 *   de l'app tiré au sort (WALDERP_HIDE_PANELS_V147) : impossible de le
 *   recombattre tant qu'il n'a pas été retrouvé (titanFound).
 * - Retrouvé => le vrai cooldown de 180 minutes démarre ALORS, avant la
 *   forme suivante.
 * - Aucun butin sur les formes 1-4 (wiki : "After killing Walderp's
 *   final form he will begin to drop his items") — seule la 5e forme
 *   (et toutes les suivantes, "Final Form" permanente) donne le butin.
 * - Cycle de 3 minutes du wiki (hideCycleMs) : visibilité progressive puis
 *   changement de menu, joués par l'interface.
 */

const t5=IDLE_ADVENTURE_TITANS.find(x=>x.id==="t5");

assert.equal(t5.name,"Walderp");
assert.equal(t5.boss,116);
assert.equal(t5.cooldown/3600000,3);
assert.equal(t5.hideCycleMs,180000,"wiki Walderp : « You will have 3 minutes to find him [...] After 3 minutes he will reset his visibility and change menus ».");
assert.deepEqual(
  t5.forms,
  [
    {p:800000,t:400000},
    {p:1600000,t:800000},
    {p:2400000,t:1500000},
    {p:3200000,t:2300000},
    /* AutoKill (2026-09-27, correctif docs/HORS-LIGNE.md point 1) : seule la forme finale (répétable) en a un publié (wiki, page Walderp : "forms 1-4 cannot autokill"). */
    /* 2026-11-13 : « 3 kills on Walderp's final form » (infobox autokill5), en plus des stats. */
    {p:4000000,t:3000000,autoKillP:13000000,autoKillT:7000000,autoKillKills:3}
  ],
  "Les 5 formes doivent être les vrais seuils Manual (+ AutoKill sur la finale) du wiki, jamais inventés."
);
assert.equal(t5.requiresTitan,undefined,"Pas de palier de chaîne anti-skip inventé pour t5.");
assert.equal(t5.p,undefined,"t5 n'a plus de p/t plat — les seuils viennent exclusivement de forms[].");

const STATS_PAR_FORME=[
  {power:800000,toughness:400000},
  {power:1600000,toughness:800000},
  {power:2400000,toughness:1500000},
  {power:3200000,toughness:2300000},
  {power:4000000,toughness:3000000}
];

function tuerFormeEtTrouver(s,formeIndex,t){
  const stats=STATS_PAR_FORME[formeIndex];
  const combat=applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t5"},{bosses:116,stats},t
  );
  s=combat.state;
  if(formeIndex<4){
    // Caché : impossible de recombattre tant qu'on ne l'a pas trouvé.
    assert.ok(s.titans.t5.hiddenPanel,"Walderp doit se cacher après chaque forme sauf la dernière.");
    assert.equal(s.titans.t5.hiddenSince,t,"L'instant de la cachette est gardé : les cycles de 3 minutes partent de là.");
    assert.ok(Number.isInteger(s.titans.t5.hiddenSeed)&&s.titans.t5.hiddenSeed>=0,"Une graine entière est tirée une fois par cachette.");
    assert.equal(normalizeIdleAdventureStateV47(s).titans.t5.hiddenSeed,s.titans.t5.hiddenSeed,"La graine survit à la normalisation de l'état.");
    const vue=idleAdventureSnapshotV47(s,116).titans.find(x=>x.id==="t5");
    assert.ok(vue.state.hiddenPanel&&vue.state.hiddenSince===t&&vue.state.hiddenSeed===s.titans.t5.hiddenSeed&&vue.hideCycleMs===180000,"L'interface reçoit l'instant, la graine et la durée du cycle.");
    assert.throws(
      ()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[formeIndex+1]},t+1),
      /TITAN_CACHE/,
      "Impossible de recombattre Walderp tant qu'il n'a pas été retrouvé."
    );
    const trouve=applyIdleAdventureActionV47(s,{action:"titanFound",titan:"t5"},{},t+1);
    s=trouve.state;
    assert.equal(s.titans.t5.hiddenPanel,"","Le retrouver doit vider hiddenPanel.");
    assert.equal(s.titans.t5.hiddenSeed,0,"Le retrouver remet la graine à zéro.");
    assert.equal(trouve.result.nextAt,t+1+3*3600000,"Retrouver Walderp doit démarrer le VRAI cooldown de 180 minutes maintenant, pas avant.");
  }
  return {state:s,result:combat.result};
}

// Cycle complet des 5 formes : aucun butin avant la 5e, cooldown bloque
// bien la forme suivante tant qu'il n'a pas encore été retrouvé.
{
  let s=normalizeIdleAdventureStateV47({});
  let t=1000;
  for(let forme=0;forme<4;forme++){
    const {state,result}=tuerFormeEtTrouver(s,forme,t);
    s=state;
    assert.equal(result.drops.length,0,`Forme ${forme+1} : aucun butin avant la forme finale.`);
    assert.equal(s.titans.t5.kills,forme+1);
    // Le cooldown (démarré par titanFound) doit encore bloquer un combat immédiat.
    assert.throws(
      ()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[forme+1]},t+2),
      /TITAN_EN_REAPPARITION/,
      "Le cooldown de 180 minutes doit réellement bloquer la forme suivante juste après avoir retrouvé Walderp."
    );
    t+=3*3600000+10;
  }

  // Forme 5 (finale) : butin garanti, plus de cache-cache après.
  const finale=tirageForce(0,()=>applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[4]},t
  ));
  s=finale.state;
  assert.equal(s.titans.t5.kills,5);
  assert.equal(s.titans.t5.hiddenPanel,"","La forme finale ne doit plus jamais se cacher.");
  assert.ok(finale.result.drops.some(x=>x.set==="wanderer"),"Le set Wanderer's doit tomber dès la 1ère victoire sur la forme finale.");
  assert.ok(finale.result.drops.some(x=>x.set==="rerednaw"),"Le set S'rerednaW doit tomber dès la 1ère victoire sur la forme finale.");

  // Après la forme finale, Walderp reste "Final Form" en permanence :
  // recombattre après le cooldown normal donne à nouveau du butin, sans
  // jamais se recacher.
  t+=3*3600000+10;
  const encore=tirageForce(0,()=>applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[4]},t
  ));
  assert.equal(encore.state.titans.t5.hiddenPanel,"");
  assert.ok(encore.result.drops.some(x=>x.set==="wanderer"),"Toute victoire après la forme finale doit donner du butin, indéfiniment.");
}

// Stats insuffisantes pour la forme en cours doivent échouer normalement
// (même comportement que les autres titans).
{
  const s=normalizeIdleAdventureStateV47({});
  assert.throws(
    ()=>applyIdleAdventureActionV47(
      s,{action:"titan",titan:"t5"},{bosses:116,stats:{power:1,toughness:1}},1
    ),
    /PUISSANCE_INSUFFISANTE/
  );
}

// titanFound sans combat préalable (rien à trouver) doit échouer proprement.
{
  const s=normalizeIdleAdventureStateV47({});
  assert.throws(
    ()=>applyIdleAdventureActionV47(s,{action:"titanFound",titan:"t5"},{},1),
    /TITAN_PAS_CACHE/
  );
}

// Délai entre deux formes : -15 min par No Rebirth Challenge (page Titans, Normal dès le titan 3), plancher 60 min.
{
  const depart=()=>applyIdleAdventureActionV47(normalizeIdleAdventureStateV47({}),{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[0]},1000).state;
  const M=60000;
  const deux=applyIdleAdventureActionV47(depart(),{action:"titanFound",titan:"t5"},{titanCooldownReductionMs:30*M},2000);
  assert.equal(deux.result.nextAt,2000+150*M,"2 No Rebirth Challenges : 180 - 30 = 150 minutes entre deux formes.");
  const beaucoup=applyIdleAdventureActionV47(depart(),{action:"titanFound",titan:"t5"},{titanCooldownReductionMs:300*M},2000);
  assert.equal(beaucoup.result.nextAt,2000+60*M,"Jamais sous le plancher de 60 minutes.");
  const evil=applyIdleAdventureActionV47(depart(),{action:"titanFound",titan:"t5"},{titanCooldownReductionEvilMs:30*M,titanCooldownReductionSadisticMs:30*M},2000);
  assert.equal(evil.result.nextAt,2000+180*M,"Les réductions Evil (titan 7+) et Sadistic (titan 10+) ne touchent pas Walderp.");
}

// Alias titan5 (comme titan1..titan4/titan6 déjà existants).
{
  const s=normalizeIdleAdventureStateV47({});
  assert.doesNotThrow(()=>
    applyIdleAdventureActionV47(s,{action:"titan",titan:"titan5"},{bosses:116,stats:STATS_PAR_FORME[0]},1)
  );
}

console.log("idle-adventure-walderp-hide-and-seek: OK");
