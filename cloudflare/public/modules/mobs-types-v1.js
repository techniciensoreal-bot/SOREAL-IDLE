/*
 * Types d'ennemis de l'Aventure : poison, paralysie, explosif, chargeur, rapide, grandisseur (Norman, 2026-11-14 : « en Aventure, il y a des mobs exploder, d'autres poison, d'autres paralyze. Mais je ne vois jamais qu'ils explosent, qu'ils m'empoisonnent ou autres choses »).
 *
 * VALEURS ET CYCLES LUS DANS LE JEU (NGU Idle build 1260, 2026-11-15, avec l'accord de Norman : analyse de l'assembly du jeu pour ne garder que des FAITS chiffrés, jamais de code recopié ; recoupés par des combats réels relevés par OCR :
 * le poison de GEO.c.G et de Brown Slime, le Limburger...). Chaque type d'ennemi a un petit compteur qui avance à CHAQUE attaque de l'ennemi (« tour ») et fait un cycle fixe, sans hasard (sauf l'aléa de ±20 % de tout coup) :
 *   - dégâts d'un coup ordinaire : aléa(0,8 à 1,2) x max(10 % de la Puissance, Puissance - Robustesse x facteurs / 2) ; un coup « multiplié » multiplie ce résultat ;
 *   - poison, cycle de 7 tours : tour 1 le coup empoisonne ; tours 2, 3 et 4 : coup ordinaire PLUS un tick de poison de floor(20 % de la Puissance x aléa(0,8 à 1,2)) ; tour 5 : coup ordinaire, « le poison se dissipe » ; tours 6 et 7 : coups ordinaires ; puis le cycle recommence ;
 *   - chargeur, cycle de 5 tours : 2 coups ordinaires ; au 3e tour il s'illumine et N'ATTAQUE PAS (annonce) ; au 4e il n'attaque pas non plus ; au 5e coup MASSIF x4 ;
 *   - paralysie, cycle de 12 tours : tour 1 il n'attaque pas ; tour 2 coup ordinaire avec avertissement (« tu ralentis ») ; tour 3 coup ordinaire PLUS paralysie du joueur 2 s ; tours 4 à 12 : coups ordinaires ;
 *   - rapide, cycle de 14 tours : 4 coups ordinaires ; au 5e il s'agite (annonce, pas de coup) ; tours 6 et 7 : pas de coup ; au 8e il fonce : coup ordinaire et son intervalle d'attaque tombe à 30 % de l'intervalle normal pendant 6 coups ; au 14e le coup ramène la fin de la fureur et le cycle recommence ;
 *   - grandisseur : coup x (1 + floor(n / 2) / 5), n = nombre de coups depuis le début du combat (+20 % tous les 2 coups, sans plafond), annoncé tous les 2 coups ;
 *   - explosif : à son premier tour (son « Attack Rate » est son compte à rebours) il explose : coup ordinaire x1000 (Fairy, Puissance 33 : plus de 3 300 sans Robustesse, le wiki dit « around 2500 ») ; l'explosion ne l'épargne pas : il disparaît.
 * Jamais pour un titan (leurs capacités sont dans titans-comportements-v1.js). Un ennemi « poison/paralyze » (un seul boss du bestiaire) suit le cycle du poison. Aucune image : des émojis et des dégradés (combat-effets-v1.js), des sons synthétisés (audio-effects-v199.js).
 * API : window.SorealMobTypesV1 = { types, reinit, tourEnnemi, explosion, intervalleEnnemiMs, paralyse, poisonActif, constantes }.
 */
(function(){
'use strict';
if(typeof window==='undefined'||window.SorealMobTypesV1)return;

var C={poisonFraction:.2,poisonTicks:3,paralysieMs:2000,explosionMult:1000,chargeurMult:4,rapideIntervalle:.3,croissancePas:.2};
var etat=neuf();
function neuf(){return {paralyseJusqua:0,poisonE:0,chargeE:0,paralysieE:0,rapideE:0,rapide:false,croiss:0};}

/* `maintenant` : conservé pour la compatibilité des appels (le début du combat n'a plus d'effet : plus aucun effet ne dépend de la durée du combat). */
function reinit(maintenant){etat=neuf();}

/* Types de l'ennemi : « poison », « paralyze », « exploder »… (jamais pour un titan). « poison/paralyze » suit le poison. */
function types(fight){
  var sortie={poison:false,paralyze:false,exploder:false,rapid:false,charger:false,grower:false};
  if(!fight||!fight.active||fight.titanId)return sortie;
  String(fight.mobType||'').toLowerCase().split('/').forEach(function(t){t=t.trim();if(t==='poison'||t==='paralyze'||t==='exploder'||t==='rapid'||t==='charger'||t==='grower')sortie[t]=true;});
  if(sortie.poison)sortie.paralyze=false;
  return sortie;
}

function paralyse(maintenant){return etat.paralyseJusqua>maintenant;}
/* Poison en cours : entre l'empoisonnement (tour 1) et la dissipation (tour 5). */
function poisonActif(maintenant){return etat.poisonE>=1&&etat.poisonE<=7;}

/*
 * À appeler à CHAQUE tour d'attaque de l'ennemi (jamais pour un explosif : voir explosion). `hasard` : nombre dans [0,1[. Renvoie ce qu'il se passe à ce tour :
 *   saute : l'ennemi n'attaque pas ce tour ; mult : multiplicateur du coup ; poison : ce coup empoisonne ; poisonDegats : tick de poison de ce tour ; poisonFin : le poison se dissipe ;
 *   paralyse : ce coup paralyse le joueur ; avertit : avertissement ; charge / prepare : coup massif / annonce du chargeur ; croit : le grandisseur gonfle ; rapideDebut / rapideFin : fureur du rapide.
 */
function tourEnnemi(fight,hasard,maintenant){
  var t=types(fight),r={saute:false,mult:1,poison:false,poisonDegats:0,poisonFin:false,paralyse:false,avertit:false,charge:false,prepare:false,croit:false,rapideDebut:false,rapideFin:false};
  var puissance=Math.max(0,Number(fight&&fight.mobPower)||0),h=Math.max(0,Math.min(.999999,Number(hasard)||0));
  if(t.poison){
    if(etat.poisonE<0){/* coup ordinaire pendant le repos */}
    else if(etat.poisonE===0){r.poison=true;}
    else if(etat.poisonE<=5){r.poisonDegats=Math.max(0,Math.floor(puissance*C.poisonFraction*(.8+.4*h)));etat.poisonE+=1;}
    else{r.poisonFin=true;etat.poisonE=-3;}
    etat.poisonE+=1;
  }else if(t.charger){
    etat.chargeE+=1;
    if(etat.chargeE<3){/* coup ordinaire */}
    else if(etat.chargeE===3){r.saute=true;r.prepare=true;}
    else if(etat.chargeE<5){r.saute=true;}
    else{r.mult=C.chargeurMult;r.charge=true;etat.chargeE=0;}
  }else if(t.paralyze){
    if(etat.paralysieE<0){/* coup ordinaire */}
    else if(etat.paralysieE===0){r.saute=true;}
    else if(etat.paralysieE===1){r.avertit=true;}
    else if(etat.paralysieE===2){r.paralyse=true;etat.paralyseJusqua=(Number(maintenant)||0)+C.paralysieMs;etat.paralysieE=-10;}
    etat.paralysieE+=1;
  }else if(t.rapid){
    etat.rapideE+=1;
    if(etat.rapideE<5){/* coup ordinaire */}
    else if(etat.rapideE===5){r.saute=true;r.avertit=true;}
    else if(etat.rapideE<8){r.saute=true;}
    else if(etat.rapideE===8){etat.rapide=true;r.rapideDebut=true;}
    else if(etat.rapideE<14){/* coups ordinaires, intervalle réduit */}
    else{etat.rapide=false;etat.rapideE=0;r.rapideFin=true;}
  }else if(t.grower){
    etat.croiss+=1;
    r.mult=1+Math.floor(etat.croiss/2)*C.croissancePas;
    r.croit=etat.croiss%2===0;
  }
  return r;
}

/* Dégâts de l'explosion : le coup ordinaire (aléa compris, `degatsCoup`) multiplié par 1000 ; 0 s'il n'est pas explosif. */
function explosion(fight,degatsCoup){
  if(!types(fight).exploder)return 0;
  return Math.max(1,Math.round(Math.max(0,Number(degatsCoup)||0)*C.explosionMult));
}

/* Intervalle entre deux attaques de l'ennemi : un ennemi rapide en fureur attaque à 30 % de son intervalle normal. */
function intervalleEnnemiMs(fight,baseMs,maintenant){
  if(!types(fight).rapid||!etat.rapide)return baseMs;
  return Math.max(100,Math.round(baseMs*C.rapideIntervalle));
}

window.SorealMobTypesV1={types:types,reinit:reinit,tourEnnemi:tourEnnemi,explosion:explosion,intervalleEnnemiMs:intervalleEnnemiMs,paralyse:paralyse,poisonActif:poisonActif,constantes:C};
})();
