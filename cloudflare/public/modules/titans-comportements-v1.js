/*
 * Comportements des titans en combat (Norman, 2026-10-04 : « Pourquoi les comportements des titans ne sont pas encore simulés ? … go en commençant du premier au dernier »).
 *
 * Règle n°1 (AGENTS.md) : seules les capacités dont le wiki publie les nombres sont simulées ; ce qui n'est pas chiffré reste décrit mais sans effet (jamais de valeur inventée).
 * Module pur (aucun accès au DOM ni à l'état du jeu) : le combat (soreal-idle-ui.js) lui donne l'état du combat du titan et reçoit ce que l'attaque fait.
 *
 * Gordon Ramsay Bolton (https://ngu-idle.fandom.com/wiki/Gordon_Ramsay_Bolton, « Titan Skills ») :
 *  - Paralyze (1/7) : désactive les moves et l'Idle Mode, met en pause les cooldowns ; dure 4 s OU deux attaques de Ramsay. Si moins de 10 attaques depuis la dernière Paralyze, une attaque de base est faite à la place.
 *  - Power Attack (2/7) : dégâts doublés.
 *  - Bleed (2/7) : « réduit ta régénération de PV », cumul infini, mais le wiki ne publie AUCUNE ampleur par cumul -> NON simulé (tirage traité comme une attaque de base).
 *  Le wiki ne dit pas si le compteur « 10 attaques » est déjà plein au début du combat : on part de 0 (la première Paralyze ne peut venir qu'à la 11e attaque).
 */
(function(racine){
  'use strict';

  var TITANS={
    t1:{
      note:'Simulées dans le combat : Paralysie et Attaque puissante. Le Saignement est décrit mais pas simulé (le wiki ne publie pas son ampleur).',
      /* Tirage sur 7 : [0,1) Paralyze, [1,3) Bleed, [3,5) Power Attack, le reste attaque de base. */
      tirer:function(e,tirage){
        var t=tirage*7;
        if(t<1&&e.depuisParalysie>=10)return 'paralysie';
        if(t>=1&&t<3)return 'saignement';
        if(t>=3&&t<5)return 'puissante';
        return 'base';
      },
      multPuissante:2,
      paralysieMs:4000,
      paralysieAttaques:2,
      minAttaquesEntreParalysies:10
    }
  };

  function neuf(){
    return {attaques:0,depuisParalysie:0,paralyseJusqua:0,paralysieDebut:0,paralysieAttaquesRestantes:0};
  }

  /* Décrit ce que fait l'attaque du titan. Renvoie {type, multDegats, paralyse:boolean}. L'état est modifié sur place. */
  function attaqueTitan(id,etat,maintenantMs,tirage){
    var def=TITANS[String(id||'')];
    if(!def)return {type:'base',multDegats:1,paralyse:false};
    var enParalysie=etat.paralyseJusqua>maintenantMs;
    var type=def.tirer(etat,tirage);
    if(enParalysie&&type==='paralysie')type='base';
    etat.attaques+=1;
    if(type!=='paralysie')etat.depuisParalysie+=1;
    if(enParalysie){
      etat.paralysieAttaquesRestantes-=1;
      if(etat.paralysieAttaquesRestantes<=0)etat.paralyseJusqua=maintenantMs;
    }
    var rep={type:type,multDegats:type==='puissante'?def.multPuissante:1,paralyse:false};
    if(type==='paralysie'){
      etat.depuisParalysie=0;
      etat.paralysieDebut=maintenantMs;
      etat.paralyseJusqua=maintenantMs+def.paralysieMs;
      etat.paralysieAttaquesRestantes=def.paralysieAttaques;
      rep.paralyse=true;
    }
    return rep;
  }

  function joueurParalyse(etat,maintenantMs){return !!etat&&etat.paralyseJusqua>maintenantMs;}

  /* Fin de paralysie : durée réellement subie, pour repousser d'autant les cooldowns (« met en pause les cooldowns »). Renvoie 0 tant qu'elle dure. */
  function finParalysie(etat,maintenantMs){
    if(!etat||!etat.paralysieDebut||etat.paralyseJusqua>maintenantMs)return 0;
    var duree=Math.max(0,etat.paralyseJusqua-etat.paralysieDebut);
    etat.paralysieDebut=0;
    return duree;
  }

  racine.SorealTitanComportementsV1={
    possede:function(id){return !!TITANS[String(id||'')];},
    note:function(id){var d=TITANS[String(id||'')];return d?d.note:'';},
    neuf:neuf,attaqueTitan:attaqueTitan,joueurParalyse:joueurParalyse,finParalysie:finParalysie
  };
})(typeof window!=='undefined'?window:globalThis);
