/*
 * SOREAL IDLE — sons d'ambiance en Aventure (Norman, 2026-09-27) : « Je vais placer plusieurs sons d'ambiance
 * dans mon R2 soreal/idle/ambient/. Dès qu'on déverrouille le mode aventure, les sons placés dans ce dossier
 * doivent être joués presque tout le temps. Il peut arriver qu'aucun ne soit joué mais ça doit être rare. Le
 * niveau sonore ne doit pas être trop fort de base. »
 *
 * Fichiers déposés directement dans R2 par Norman (aucun build local, aucune liste figée en dur) : la liste
 * vient de /api/idle/media/ambient-list, chaque fichier de /api/idle/media/ambient?key=... (idle-media-v1.js).
 *
 * Correctif 2026-09-27 (même jour, Norman revient sur son idée initiale) : « Je ne veux plus que 2 sons soient
 * joués en même temps... 1 seul à la fois. » Un seul créneau désormais (silence rare, ~8% de chance à chaque fin
 * de morceau) -- quelque chose joue quasiment en permanence, jamais deux fichiers superposés.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__)return;

  var FADE_MS=1500;
  var SILENCE_MIN_MS=4000,SILENCE_MAX_MS=13000;
  var CRENEAUX=[
    {id:'principal',probabiliteSilence:0.08}
  ];

  var cles=null;
  var chargementEnCours=null;
  var demarre=false;
  var actif=false;
  var slots=[];

  function volumeAmbiance_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    return r?r.getAmbiance():0.35;
  }

  function chargerListe_(){
    if(cles)return Promise.resolve(cles);
    if(chargementEnCours)return chargementEnCours;
    chargementEnCours=fetch('/api/idle/media/ambient-list',{cache:'no-store'})
      .then(function(r){return r&&r.ok?r.json():{ok:false,cles:[]};})
      .then(function(data){cles=Array.isArray(data&&data.cles)?data.cles:[];return cles;})
      .catch(function(){cles=[];return cles;});
    return chargementEnCours;
  }

  function choisirCle_(){
    if(!cles||!cles.length)return '';
    var eviter=slots.map(function(s){return s.cle;}).filter(Boolean);
    var choix=cles.filter(function(c){return eviter.indexOf(c)===-1;});
    var pool=choix.length?choix:cles;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function fondu_(audio,cible,duree){
    var debut=Date.now(),depart=0;
    function pas(){
      if(!audio||audio.paused)return;
      var t=Math.min(1,(Date.now()-debut)/duree);
      audio.volume=depart+(cible-depart)*t;
      if(t<1)requestAnimationFrame(pas);
    }
    pas();
  }

  function planifierSuivant_(slot){
    if(!actif)return;
    if(Math.random()<slot.probabiliteSilence){
      var pause=SILENCE_MIN_MS+Math.random()*(SILENCE_MAX_MS-SILENCE_MIN_MS);
      slot.minuterie=setTimeout(function(){slot.minuterie=0;jouerSuivant_(slot);},pause);
      return;
    }
    jouerSuivant_(slot);
  }

  function jouerSuivant_(slot){
    if(!actif)return;
    chargerListe_().then(function(liste){
      if(!actif||!liste.length)return;
      var cle=choisirCle_();
      if(!cle)return;
      var audio;
      try{
        audio=new Audio('/api/idle/media/ambient?key='+encodeURIComponent(cle));
      }catch(_){return;}
      audio.preload='auto';
      audio.volume=0;
      slot.audio=audio;
      slot.cle=cle;
      audio.onended=function(){
        if(slot.audio!==audio)return;
        slot.audio=null;
        slot.cle='';
        planifierSuivant_(slot);
      };
      audio.onerror=function(){
        if(slot.audio!==audio)return;
        slot.audio=null;
        slot.cle='';
        slot.minuterie=setTimeout(function(){slot.minuterie=0;jouerSuivant_(slot);},3000);
      };
      var jouer=audio.play();
      if(jouer&&typeof jouer.catch==='function'){
        jouer.catch(function(){
          /* Lecture auto refusée (pas encore de geste utilisateur) : réessaie un peu plus tard. */
          if(slot.audio!==audio)return;
          slot.audio=null;
          slot.cle='';
          slot.minuterie=setTimeout(function(){slot.minuterie=0;jouerSuivant_(slot);},2000);
        });
      }
      fondu_(audio,volumeAmbiance_(),FADE_MS);
    });
  }

  function appliquerVolume_(){
    var v=volumeAmbiance_();
    slots.forEach(function(slot){
      if(slot.audio)slot.audio.volume=v;
    });
  }

  function demarrer_(){
    if(demarre)return;
    demarre=true;
    CRENEAUX.forEach(function(def,i){
      var slot={audio:null,minuterie:0,cle:'',probabiliteSilence:def.probabiliteSilence};
      slots.push(slot);
      /* Décale légèrement le départ de chaque créneau pour ne pas les faire toujours commencer pile ensemble. */
      slot.minuterie=setTimeout(function(){slot.minuterie=0;planifierSuivant_(slot);},i*1200);
    });
    if(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__)window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange(appliquerVolume_);
  }

  function arreterTout_(){
    slots.forEach(function(slot){
      if(slot.minuterie){clearTimeout(slot.minuterie);slot.minuterie=0;}
      if(slot.audio){
        try{slot.audio.pause();}catch(_){}
        slot.audio.onended=null;
        slot.audio.onerror=null;
        slot.audio=null;
      }
    });
    slots=[];
    demarre=false;
  }

  function verifier(debloque){
    var nouveau=Boolean(debloque);
    if(nouveau===actif)return;
    actif=nouveau;
    if(actif)demarrer_();
    else arreterTout_();
  }

  window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__={verifier:verifier};
})();
