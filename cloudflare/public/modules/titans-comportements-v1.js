/*
 * Comportements des titans en combat (Norman, 2026-10-04 : « Pourquoi les comportements des titans ne sont pas encore simulés ? … go en commençant du premier au dernier »).
 *
 * Règle n°1 (AGENTS.md) : seules les capacités dont le wiki publie les nombres sont simulées ; ce qui n'est pas chiffré reste décrit mais sans effet (jamais de valeur inventée).
 * Module pur (aucun accès au DOM ni à l'état du jeu) : le combat (soreal-idle-ui.js) lui donne l'état du combat du titan et reçoit ce que l'attaque fait.
 *
 * Gordon Ramsay Bolton (https://ngu-idle.fandom.com/wiki/Gordon_Ramsay_Bolton, « Titan Skills ») :
 *  - Paralyze (1/7) : désactive les moves et l'Idle Mode, met en pause les cooldowns ; dure 4 s OU deux attaques de Ramsay. Si moins de 10 attaques depuis la dernière Paralyze, une attaque de base est faite à la place.
 *  - Power Attack (2/7) : dégâts doublés.
 *  - Bleed (2/7) : « réduit ta régénération de PV pour le reste du combat », cumul infini, peut la rendre négative. Le wiki, Steam, les guides et les mods ne publient AUCUNE ampleur par cumul : valeur CHOISIE PAR SOREAL
 *    (accord de Norman, 2026-10-04 : « calcule toi-même, pour que ça reste faisable mais que l'effet ait lieu ») = -10 % de la régénération de départ par cumul (au 10e cumul elle est nulle, ensuite elle fait perdre des PV).
 *  Le wiki ne dit pas si le compteur « 10 attaques » est déjà plein au début du combat : on part de 0 (la première Paralyze ne peut venir qu'à la 11e attaque).
 *
 * Grand Corrupted Tree (https://ngu-idle.fandom.com/wiki/Grand_Corrupted_Tree, « Titan Skills ») :
 *  - Cloud of spores « arms feel heavy » (1/7, si le malus n'est pas déjà appliqué) : tes dégâts tombent à 2/3 pendant 15 s.
 *  - Power Attack (2/7) : dégâts x1,5.
 *  - Cloud of spores « energy draining » (1/7) : « dégâts subis 1.5?/4x? » -- le wiki lui-même n'est pas sûr de l'ampleur (points d'interrogation) -> NON simulé (attaque de base).
 */
(function(racine){
  'use strict';

  var TITANS={
    t1:{
      note:'Simulées dans le combat : Paralysie, Saignement et Attaque puissante. Le wiki ne publie pas l’ampleur du Saignement : chaque cumul retire 10 % de ta régénération de départ (valeur choisie par SOREAL).',
      /* Tirage sur 7 : [0,1) Paralyze, [1,3) Bleed, [3,5) Power Attack, le reste attaque de base. */
      tirer:function(e,tirage){
        var t=tirage*7;
        if(t<1&&e.depuisParalysie>=10)return 'paralysie';
        if(t>=1&&t<3)return 'saignement';
        if(t>=3&&t<5)return 'puissante';
        return 'base';
      },
      multPuissante:2,
      /* NON PUBLIÉ : constante SOREAL (voir l'en-tête). */
      saignementParCumul:0.1,
      paralysieMs:4000,
      paralysieAttaques:2,
      minAttaquesEntreParalysies:10
    }
  };

  TITANS.t2={
    note:'Simulées dans le combat : Nuage de spores (dégâts à 2/3 pendant 15 s) et Attaque puissante (x1,5). Le second nuage de spores est décrit mais pas simulé (le wiki n’en connaît pas l’ampleur).',
    /* Tirage sur 7 : [0,1) spores des bras, [1,2) spores d'énergie (non simulé), [2,4) puissante, le reste base. */
    tirer:function(e,tirage,maintenant){
      var t=tirage*7;
      if(t<1&&!(e.affaibliJusqua>maintenant))return 'sporesBras';
      if(t>=2&&t<4)return 'puissante';
      return 'base';
    },
    multPuissante:1.5,
    sporesBrasMs:15000,
    multDegatsJoueurSpores:2/3
  };

  function neuf(){
    return {saignements:0,affaibliJusqua:0,attaques:0,depuisParalysie:0,paralyseJusqua:0,paralysieDebut:0,paralysieAttaquesRestantes:0};
  }

  /* Décrit ce que fait l'attaque du titan. Renvoie {type, multDegats, paralyse:boolean}. L'état est modifié sur place. */
  function attaqueTitan(id,etat,maintenantMs,tirage){
    var def=TITANS[String(id||'')];
    if(!def)return {type:'base',multDegats:1,paralyse:false};
    var enParalysie=etat.paralyseJusqua>maintenantMs;
    var type=def.tirer(etat,tirage,maintenantMs);
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
    if(type==='saignement'){
      etat.saignements+=1;
      rep.saigne=true;
    }
    if(type==='sporesBras'){
      etat.affaibliJusqua=maintenantMs+def.sporesBrasMs;
      rep.spores=true;
    }
    return rep;
  }

  /* Facteur appliqué à la régénération de PV du joueur en combat (1 = intacte ; peut devenir négatif : le joueur perd alors des PV). */
  function multRegenJoueur(id,etat){
    var def=TITANS[String(id||'')];
    return def&&def.saignementParCumul&&etat?1-def.saignementParCumul*etat.saignements:1;
  }

  /* Multiplicateur appliqué aux dégâts du joueur (spores des bras du Grand Corrupted Tree). */
  function multDegatsJoueur(id,etat,maintenantMs){
    var def=TITANS[String(id||'')];
    return def&&def.multDegatsJoueurSpores&&etat&&etat.affaibliJusqua>maintenantMs?def.multDegatsJoueurSpores:1;
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
    neuf:neuf,attaqueTitan:attaqueTitan,multDegatsJoueur:multDegatsJoueur,multRegenJoueur:multRegenJoueur,joueurParalyse:joueurParalyse,finParalysie:finParalysie
  };
})(typeof window!=='undefined'?window:globalThis);
