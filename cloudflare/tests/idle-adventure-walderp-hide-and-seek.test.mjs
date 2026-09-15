import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_TITANS,WALDERP_HIDE_PANELS_V147,
  normalizeIdleAdventureStateV47,applyIdleAdventureActionV47,idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

/*
 * "boutique"/"magie"/"personnage" existent encore comme routes de rendu
 * côté client (contenuMenuIdleV28_) mais ne sont PLUS dans la navigation
 * visible depuis la parité NGU — y cacher Walderp le rendrait
 * introuvable pour de vrai. Cette liste doit rester EXACTEMENT
 * synchronisée avec IDLE_WALDERP_PANEL_LABELS_V147 côté SOREAL-APP
 * (Soreal_Idle_UI.html) — voir idle-adventure-walderp-panel-labels.test.mjs
 * côté APP pour le miroir de cette vérification.
 */
assert.deepEqual(
  WALDERP_HIDE_PANELS_V147,
  ["combat","entrainement","inventaire","bestiaire","parametres"],
  "Chaque panneau doit être un menu réellement navigable (navigationIdleV28_), jamais un menu retiré de la navigation (boutique/magie/personnage)."
);

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
 * Simplification assumée et documentée dans idle-adventure-v47.js : pas
 * de fenêtre de 3 minutes ni de visibilité progressive — une fois
 * caché, il reste dans le MÊME panneau jusqu'à ce qu'on le trouve.
 */

const t5=IDLE_ADVENTURE_TITANS.find(x=>x.id==="t5");

assert.equal(t5.name,"Walderp");
assert.equal(t5.boss,116);
assert.equal(t5.cooldown/3600000,3);
assert.deepEqual(
  t5.forms,
  [
    {p:800000,t:400000},
    {p:1600000,t:800000},
    {p:2400000,t:1500000},
    {p:3200000,t:2300000},
    {p:4000000,t:3000000}
  ],
  "Les 5 formes doivent être les vrais seuils Manual P/T du wiki, jamais inventés."
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
    assert.throws(
      ()=>applyIdleAdventureActionV47(s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[formeIndex+1]},t+1),
      /TITAN_CACHE/,
      "Impossible de recombattre Walderp tant qu'il n'a pas été retrouvé."
    );
    const trouve=applyIdleAdventureActionV47(s,{action:"titanFound",titan:"t5"},{},t+1);
    s=trouve.state;
    assert.equal(s.titans.t5.hiddenPanel,"","Le retrouver doit vider hiddenPanel.");
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
  const finale=applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[4]},t
  );
  s=finale.state;
  assert.equal(s.titans.t5.kills,5);
  assert.equal(s.titans.t5.hiddenPanel,"","La forme finale ne doit plus jamais se cacher.");
  assert.ok(finale.result.drops.some(x=>x.set==="wanderer"),"Le set Wanderer's doit tomber dès la 1ère victoire sur la forme finale.");
  assert.ok(finale.result.drops.some(x=>x.set==="rerednaw"),"Le set S'rerednaW doit tomber dès la 1ère victoire sur la forme finale.");

  // Après la forme finale, Walderp reste "Final Form" en permanence :
  // recombattre après le cooldown normal donne à nouveau du butin, sans
  // jamais se recacher.
  t+=3*3600000+10;
  const encore=applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t5"},{bosses:116,stats:STATS_PAR_FORME[4]},t
  );
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

// Alias titan5 (comme titan1..titan4/titan6 déjà existants).
{
  const s=normalizeIdleAdventureStateV47({});
  assert.doesNotThrow(()=>
    applyIdleAdventureActionV47(s,{action:"titan",titan:"titan5"},{bosses:116,stats:STATS_PAR_FORME[0]},1)
  );
}

console.log("idle-adventure-walderp-hide-and-seek: OK");
