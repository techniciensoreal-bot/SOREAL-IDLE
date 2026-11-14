/*
 * Types d'ennemis de l'Aventure : poison, paralysie, explosif (Norman, 2026-11-14 : « en Aventure, il y a des mobs exploder, d'autres poison, d'autres paralyze. Mais je ne vois jamais qu'ils explosent, qu'ils m'empoisonnent ou autres choses »).
 * Le moteur retenait le type de chaque ennemi (fight.mobType : 31 poison, 20 paralyze, 10 exploder, 1 poison/paralyze dans le bestiaire) mais n'en tirait AUCUN effet.
 *
 * RÈGLE n°1 (AGENTS.md) : le wiki (pages Adventure Mode et de chaque ennemi, relues le 2026-11-14) ne publie que le TYPE et les statistiques ; ni la durée, ni les dégâts, ni la chance de ces effets, et aucune autre source (Steam, guides, mods) non plus.
 * Exception décidée par Norman (2026-10-04, « calcule toi-même ») : constantes SOREAL MODÉRÉES, toutes signalées ci-dessous, inscrites au registre cloudflare/tests/references/constantes-soreal-v1.json (« à valider par Norman ») :
 *   - poison : chaque coup qui blesse le joueur l'empoisonne (valeur SOREAL, non publiée) 5 s ; chaque seconde il perd 20 % des dégâts de ce coup (valeur SOREAL) ; un nouveau coup relance la durée, sans cumul ;
 *   - paralysie : un coup sur 4 (valeur SOREAL, non publiée) paralyse le joueur 2 s (plus de compétences ni d'Idle, comme la paralysie des titans) ; puis 4 s d'immunité (valeur SOREAL) pour ne jamais enchaîner ;
 *   - explosif : son « Attack Rate » PUBLIÉ par le wiki vaut 5 à 14 s (contre 0,8 à 1,5 s pour tous les autres types) : c'est son compte à rebours (Fairy 5, Icarus 9, Kitten in a Mech Woman 12…). Au bout de ce délai il explose : son coup, DOUBLÉ (valeur SOREAL, non publiée),
 *     te frappe, puis il disparaît (victoire) ; le joueur peut en mourir. Le tuer AVANT ne déclenche rien (wiki, page Adventure Mode : « enough Power to kill any exploder »). Avant cette correction (2026-11-14) il « attaquait » seulement toutes les 12 s, d'où « il n'attaque presque pas ».
 * Un ennemi « poison/paralyze » cumule les deux. Jamais pour un titan (leurs capacités sont dans titans-comportements-v1.js). Aucune image : des émojis et des dégradés (combat-effets-v1.js), des sons synthétisés (audio-effects-v199.js).
 * API : window.SorealMobTypesV1 = { types, reinit, apresCoupEnnemi, tickPoison, explosion, paralyse, poisonActif, constantes }.
 */
(function(){
'use strict';
if(typeof window==='undefined'||window.SorealMobTypesV1)return;

/* Toutes ces valeurs sont des choix SOREAL (non publiés : wiki, Steam, guides, mods ; accord de Norman 2026-10-04, décision du 2026-11-14), « à valider par Norman » dans le registre des constantes. */
var C={poisonMs:5000,poisonTickMs:1000,poisonFraction:.2,paralysieChance:.25,paralysieMs:2000,paralysieImmuniteMs:4000,explosionMult:2};
var etat={poisonJusqua:0,poisonCoup:0,dernierTickPoison:0,paralyseJusqua:0,immuniteJusqua:0};

function reinit(){etat={poisonJusqua:0,poisonCoup:0,dernierTickPoison:0,paralyseJusqua:0,immuniteJusqua:0};}

/* Types de l'ennemi : « poison », « paralyze », « exploder » (jamais pour un titan). « poison/paralyze » donne les deux. */
function types(fight){
  var sortie={poison:false,paralyze:false,exploder:false};
  if(!fight||!fight.active||fight.titanId)return sortie;
  String(fight.mobType||'').toLowerCase().split('/').forEach(function(t){t=t.trim();if(t==='poison'||t==='paralyze'||t==='exploder')sortie[t]=true;});
  return sortie;
}

function paralyse(maintenant){return etat.paralyseJusqua>maintenant;}
function poisonActif(maintenant){return etat.poisonJusqua>maintenant&&etat.poisonCoup>0;}

/*
 * Après un coup de l'ennemi qui a infligé `degats` au joueur à l'instant `maintenant` : renvoie { poison:boolean, paralyse:boolean } (ce qui vient de se déclencher). `hasard` : nombre dans [0,1[ (Math.random en jeu).
 */
function apresCoupEnnemi(fight,degats,maintenant,hasard){
  var t=types(fight),r={poison:false,paralyse:false};
  if(t.poison&&degats>0){
    if(!poisonActif(maintenant))etat.dernierTickPoison=maintenant;   /* nouveau poison : les ticks comptent depuis CE coup (un poison déjà actif garde son rythme) */
    etat.poisonJusqua=maintenant+C.poisonMs;
    etat.poisonCoup=degats;
    r.poison=true;
  }
  if(t.paralyze&&degats>=0&&!paralyse(maintenant)&&maintenant>=etat.immuniteJusqua&&hasard<C.paralysieChance){
    etat.paralyseJusqua=maintenant+C.paralysieMs;
    etat.immuniteJusqua=etat.paralyseJusqua+C.paralysieImmuniteMs;
    r.paralyse=true;
  }
  return r;
}

/* Dégâts du poison accumulés depuis le dernier appel jusqu'à `maintenant` (un tick par seconde pleine, dans la durée du poison) : renvoie le total à retirer des PV du joueur (0 si rien). */
function tickPoison(maintenant){
  if(!(etat.poisonCoup>0))return 0;
  var fin=Math.min(maintenant,etat.poisonJusqua),total=0;
  while(etat.dernierTickPoison+C.poisonTickMs<=fin){
    etat.dernierTickPoison+=C.poisonTickMs;
    total+=Math.max(1,Math.round(etat.poisonCoup*C.poisonFraction));
  }
  if(maintenant>=etat.poisonJusqua){etat.poisonCoup=0;}
  return total;
}

/* Dégâts de l'explosion de l'ennemi qui meurt : le double d'un coup ordinaire (`degatsCoup`) ; 0 s'il n'est pas explosif. */
function explosion(fight,degatsCoup){
  if(!types(fight).exploder)return 0;
  return Math.max(1,Math.round(Math.max(0,Number(degatsCoup)||0)*C.explosionMult));
}

window.SorealMobTypesV1={types:types,reinit:reinit,apresCoupEnnemi:apresCoupEnnemi,tickPoison:tickPoison,explosion:explosion,paralyse:paralyse,poisonActif:poisonActif,constantes:C};
})();
