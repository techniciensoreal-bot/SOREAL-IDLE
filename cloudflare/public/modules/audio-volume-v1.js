/*
 * SOREAL IDLE — réglages de volume (Norman, 2026-09-27) : « Tu dois ajouter dans paramètres, des barres de son
 * pour régler le volume des voix et le volume d'ambiance. » Module minuscule, chargé avant tout ce qui joue du
 * son (voix pré-générée/Piper, ambiance) : stocke/lit deux volumes 0-1, persistés en localStorage, avec des
 * écouteurs pour que les modules déjà en train de jouer s'ajustent en direct.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__)return;

  var CLE_VOIX='soreal_idle_volume_voix_v1';
  var CLE_AMBIANCE='soreal_idle_volume_ambiance_v1';
  /* Norman (2026-09-27, après coup) : « De base, Ambiance doit être sur 2% et voix sur 40% ». */
  var DEFAUT_VOIX=0.4;
  var DEFAUT_AMBIANCE=0.02;

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

  window.__SOREAL_IDLE_AUDIO_VOLUME_V1__={
    getVoix:function(){return lire_(CLE_VOIX,DEFAUT_VOIX);},
    setVoix:function(v){ecrire_(CLE_VOIX,v);notifier_();},
    getAmbiance:function(){return lire_(CLE_AMBIANCE,DEFAUT_AMBIANCE);},
    setAmbiance:function(v){ecrire_(CLE_AMBIANCE,v);notifier_();},
    onChange:function(fn){if(typeof fn==='function')ecouteurs.push(fn);}
  };
})();
