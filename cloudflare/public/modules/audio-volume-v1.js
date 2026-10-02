/*
 * SOREAL IDLE — réglages de volume (Norman, 2026-09-27) : « Tu dois ajouter dans paramètres, des barres de son
 * pour régler le volume des voix et le volume d'ambiance. » Module minuscule, chargé avant tout ce qui joue du
 * son (voix pré-générée/Piper, ambiance) : stocke/lit deux volumes 0-1, persistés en localStorage, avec des
 * écouteurs pour que les modules déjà en train de jouer s'ajustent en direct.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__)return;

  /*
   * Norman (2026-09-27, après coup) : « De base, Ambiance doit être sur 2% et voix sur 40% » -- PUIS (même jour) :
   * « vérifie que tout le monde ait bien Ambiance sur 2% et voix sur 40% de base. Il faut que ceux qui ont déjà
   * lancé le jeu aient aussi ces réglages. » Un ancien réglage stocké en localStorage (n'importe quelle valeur,
   * même déjà personnalisée) primait sur tout nouveau défaut -- les clés passent donc de v1 à v2 pour que CHAQUE
   * navigateur reparte sur ces nouveaux défauts une bonne fois, qu'il ait ou non déjà touché les curseurs.
   */
  /*
   * Norman (2026-10-02) : « 3 barres de son : une pour les voix, une pour l'ambiance, une pour les sons de l'interface. De base, toutes à 75 %.
   * Une case à cocher (cochée de base) pour couper complètement une des options. » Les clés passent de v2 à v3 pour que chaque navigateur reparte
   * sur ces défauts (même principe que le passage v1 -> v2 du 2026-09-27). La case décochée ne perd pas le réglage de la barre : elle met
   * simplement le volume effectif à 0 (getVoix / getAmbiance / getInterface renvoient 0).
   */
  var CLE_VOIX='soreal_idle_volume_voix_v3';
  var CLE_AMBIANCE='soreal_idle_volume_ambiance_v3';
  var CLE_INTERFACE='soreal_idle_volume_interface_v3';
  var CLE_ACTIF='soreal_idle_son_actif_v1_';
  var DEFAUT=0.75;
  var TYPES=['voix','ambiance','interface'];
  var CLES={voix:CLE_VOIX,ambiance:CLE_AMBIANCE,interface:CLE_INTERFACE};

  function lire_(cle,defaut){
    try{
      var brut=localStorage.getItem(cle);
      if(brut===null)return defaut;
      var n=Number(brut);
      return Number.isFinite(n)?Math.max(0,Math.min(1,n)):defaut;
    }catch(_){return defaut;}
  }
  function ecrire_(cle,valeur){
    var n=Math.max(0,Math.min(1,Number(valeur)||0));
    try{localStorage.setItem(cle,String(n));}catch(_){}
    return n;
  }

  var ecouteurs=[];
  function notifier_(){
    ecouteurs.forEach(function(fn){try{fn();}catch(_){}});
  }

  function actif_(type){
    try{return localStorage.getItem(CLE_ACTIF+type)!=='0';}catch(_){return true;}
  }
  function reglage_(type){return lire_(CLES[type],DEFAUT);}
  function effectif_(type){return actif_(type)?reglage_(type):0;}

  window.__SOREAL_IDLE_AUDIO_VOLUME_V1__={
    /* Volumes EFFECTIFS (0 quand la case est décochée) : c'est ce que lisent les modules qui jouent du son. */
    getVoix:function(){return effectif_('voix');},
    setVoix:function(v){ecrire_(CLE_VOIX,v);notifier_();},
    getAmbiance:function(){return effectif_('ambiance');},
    setAmbiance:function(v){ecrire_(CLE_AMBIANCE,v);notifier_();},
    getInterface:function(){return effectif_('interface');},
    setInterface:function(v){ecrire_(CLE_INTERFACE,v);notifier_();},
    /* Pour l'écran Paramètres : le réglage de la barre (même décochée) et l'état de la case. */
    getReglage:reglage_,
    setReglage:function(type,v){if(CLES[type]){ecrire_(CLES[type],v);notifier_();}},
    getActif:actif_,
    setActif:function(type,oui){
      if(TYPES.indexOf(type)<0)return;
      try{localStorage.setItem(CLE_ACTIF+type,oui?'1':'0');}catch(_){}
      notifier_();
    },
    types:TYPES,
    defaut:DEFAUT,
    onChange:function(fn){if(typeof fn==='function')ecouteurs.push(fn);}
  };
})();
