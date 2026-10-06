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
 *
 * Correctif 2026-09-27 (même jour) : « Comment je peux faire pour que mes sons soient tous au même volume. Pour
 * pas devoir augmenter, baisser le son suivant le son d'ambiance en cours ? » Norman dépose ses fichiers tels
 * quels (aucun traitement audio de son côté) ; plutôt que de lui demander de renormaliser chaque fichier à la
 * main, chaque fichier est analysé une fois (RMS de son contenu décodé via Web Audio) et son volume compensé par
 * un gain individuel pour viser une sonie cible commune -- le curseur "Ambiance" des Paramètres règle ensuite le
 * niveau global par-dessus, identique pour tous les fichiers. Le gain calculé est mémorisé (clé R2 -> gain) en
 * localStorage : jamais recalculé au fichier suivant les fois d'après, sur ce navigateur.
 *
 * Correctif 2026-09-27 (même jour, Norman : « il faut que les sons trop faibles soient augmentés et que les sons
 * trop forts soient diminués. Je veux vraiment qu'on ne remarque pas de différence de son. ») : `<audio>.volume`
 * ne peut QU'ATTÉNUER (0 à 1, jamais au-delà du niveau natif du fichier) -- un fichier trop faible calculait bien
 * un gain > 1, mais `Math.min(1, v*gain)` l'empêchait de jamais dépasser le volume déjà réglé par le curseur : le
 * fichier restait perceptiblement plus faible, jamais réellement amplifié. La compensation passe donc par un
 * GainNode Web Audio (MediaElementAudioSourceNode -> GainNode -> destination), qui peut réellement multiplier le
 * signal au-delà de 1 -- `<audio>.volume` ne sert plus qu'au curseur "Ambiance" et au fondu, jamais à la
 * compensation elle-même.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AMBIENT_AUDIO_V1__)return;

  var FADE_MS=1500;
  var SILENCE_MIN_MS=4000,SILENCE_MAX_MS=13000;
  var CRENEAUX=[
    {id:'principal',probabiliteSilence:0.08}
  ];
  var GAIN_CLE_PREFIX_V1='soreal_idle_ambient_gain_v1:';
  /* Plage élargie (2026-09-27) : un GainNode Web Audio peut réellement amplifier (contrairement à `.volume`),
     donc un fichier très faible peut désormais être vraiment ramené au niveau cible, pas seulement "moins coupé". */
  var GAIN_MIN_V1=0.2,GAIN_MAX_V1=5,GAIN_CIBLE_RMS_V1=0.15;

  var cles=null;
  var chargementEnCours=null;
  var demarre=false;
  var actif=false;
  var slots=[];
  var gains_={};
  var ctxAnalyse_=null;

  /*
   * Safari iOS / WKWebView : éviter Web Audio pour l'ambiance.
   * Des décodages répétés via decodeAudioData peuvent faire monter fortement
   * l'usage mémoire sur iOS. Sur ces appareils on garde la lecture HTMLAudio
   * native et on désactive uniquement l'analyse/amplification Web Audio.
   */
  function estIOSWebKit_(){
    try{
      var ua=String(navigator.userAgent||'');
      var plateforme=String(navigator.platform||'');
      return /iPad|iPhone|iPod/.test(ua) ||
        (plateforme==='MacIntel' && Number(navigator.maxTouchPoints||0)>1);
    }catch(_){
      return false;
    }
  }

  function volumeAmbiance_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    return r?r.getAmbiance():0.35;
  }

  /* Annonce la piste qui joue (ou « aucune ») : l'orage visuel (orage-v1.js) s'enclenche quand la piste est celle du tonnerre. */
  function signaler_(cle,slot){
    try{window.dispatchEvent(new CustomEvent('soreal-ambiance-v1',{detail:{cle:cle||'',gainNode:slot&&slot.gainNode||null,contexte:ctxAnalyse_||null}}));}catch(_){}
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

  function ctxAnalyse_lazy_(){
    if(estIOSWebKit_())return null;
    if(ctxAnalyse_)return ctxAnalyse_;
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    try{ctxAnalyse_=new AC();}catch(_){ctxAnalyse_=null;}
    return ctxAnalyse_;
  }

  /*
   * Même AudioContext que l'analyse, réutilisé pour la lecture (source -> GainNode -> destination) : c'est ce
   * GainNode, jamais `.volume`, qui applique la compensation de sonie (peut dépasser 1, contrairement à `.volume`).
   * Un AudioContext démarre suspendu tant qu'aucun geste utilisateur n'a eu lieu -- débloqué au même titre que le
   * reste de l'audio du jeu (audio-effects-v199.js).
   */
  function debloquerContexteLecture_(){
    var ctx=ctxAnalyse_lazy_();
    if(ctx&&ctx.state==='suspended'){
      try{ctx.resume();}catch(_){}
    }
  }
  document.addEventListener('pointerdown',debloquerContexteLecture_,{capture:true,passive:true});
  document.addEventListener('touchstart',debloquerContexteLecture_,{capture:true,passive:true});
  document.addEventListener('click',debloquerContexteLecture_,{capture:true,passive:true});

  function gainConnu_(cle){
    if(Object.prototype.hasOwnProperty.call(gains_,cle))return gains_[cle];
    try{
      var brut=localStorage.getItem(GAIN_CLE_PREFIX_V1+cle);
      if(brut!==null){
        var n=Number(brut);
        if(Number.isFinite(n)){gains_[cle]=n;return n;}
      }
    }catch(_){}
    return undefined;
  }

  function enregistrerGain_(cle,gain){
    gains_[cle]=gain;
    try{localStorage.setItem(GAIN_CLE_PREFIX_V1+cle,String(gain));}catch(_){}
  }

  /* RMS calculé sur un échantillonnage régulier (jamais chaque sample d'un long fichier) : suffisant pour une
     sonie moyenne, sans bloquer le thread principal sur un fichier de plusieurs minutes. */
  function gainDepuisBuffer_(audioBuffer){
    var somme=0,total=0;
    for(var c=0;c<audioBuffer.numberOfChannels;c++){
      var data=audioBuffer.getChannelData(c);
      var pas=Math.max(1,Math.floor(data.length/200000));
      for(var i=0;i<data.length;i+=pas){somme+=data[i]*data[i];total+=1;}
    }
    if(!total)return 1;
    var rms=Math.sqrt(somme/total);
    if(!(rms>0))return 1;
    return Math.max(GAIN_MIN_V1,Math.min(GAIN_MAX_V1,GAIN_CIBLE_RMS_V1/rms));
  }

  function analyserGain_(url){
    if(estIOSWebKit_())return Promise.resolve(1);
    var ctx=ctxAnalyse_lazy_();
    if(!ctx)return Promise.resolve(1);
    return fetch(url,{cache:'force-cache'})
      .then(function(r){return r&&r.ok?r.arrayBuffer():null;})
      .then(function(buf){return buf?ctx.decodeAudioData(buf):null;})
      .then(function(audioBuffer){return audioBuffer?gainDepuisBuffer_(audioBuffer):1;})
      .catch(function(){return 1;});
  }

  /* Fondu du volume de base (curseur "Ambiance" + entrée/sortie de piste) : jamais la compensation de sonie,
     qui vit dans le GainNode et ne doit pas se remettre à zéro à chaque changement de curseur. */
  function fondu_(audio,cible,duree){
    var debut=Date.now(),depart=audio?audio.volume:0;
    /* Un changement de réglage (case « Ambiance » décochée, curseur) annule le fondu en cours : il ne doit jamais rétablir l'ancien volume après coup. */
    var id=audio?(audio.__fonduIdV1=(audio.__fonduIdV1||0)+1):0;
    function pas(){
      if(!audio||audio.paused||audio.__fonduIdV1!==id)return;
      var t=Math.min(1,(Date.now()-debut)/duree);
      audio.volume=depart+(cible-depart)*t;
      if(t<1)requestAnimationFrame(pas);
    }
    pas();
  }

  /* Rampe douce du GainNode de compensation (jamais un saut brusque, même quand le gain change après coup). */
  function ramperGain_(gainNode,cible,dureeSec){
    if(!gainNode)return;
    try{
      var ctx=gainNode.context;
      var maintenant=ctx.currentTime;
      gainNode.gain.cancelScheduledValues(maintenant);
      gainNode.gain.setValueAtTime(gainNode.gain.value,maintenant);
      gainNode.gain.linearRampToValueAtTime(Math.max(0,cible),maintenant+Math.max(.05,dureeSec));
    }catch(_){}
  }

  /* Relie l'élément <audio> à un GainNode Web Audio pour permettre une vraie amplification (au-delà de 1),
     jamais possible avec `.volume` seul. Repli : lecture directe (comme avant), compensation coupée au max à 1. */
  function relierGainLecture_(audio){
    var ctx=ctxAnalyse_lazy_();
    if(!ctx)return null;
    try{
      debloquerContexteLecture_();
      var source=ctx.createMediaElementSource(audio);
      var gainNode=ctx.createGain();
      gainNode.gain.value=1;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      return gainNode;
    }catch(_){
      return null;
    }
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
      var url='/api/idle/media/ambient?key='+encodeURIComponent(cle);
      var audio;
      try{
        audio=new Audio(url);
      }catch(_){return;}
      audio.preload='auto';
      audio.volume=0;
      try{audio.muted=!(volumeAmbiance_()>0);}catch(_){}
      slot.audio=audio;
      slot.cle=cle;
      var gainConnuAvant=gainConnu_(cle);
      slot.gain=gainConnuAvant!=null?gainConnuAvant:1;
      slot.gainNode=relierGainLecture_(audio);
      if(slot.gainNode)slot.gainNode.gain.value=slot.gain;
      /* Annoncée seulement quand la piste joue vraiment (un démarrage refusé par le navigateur ne déclenche rien). */
      audio.onplaying=function(){if(slot.audio===audio)signaler_(cle,slot);};
      audio.onended=function(){
        if(slot.audio!==audio)return;
        slot.audio=null;
        slot.cle='';
        signaler_('',slot);
        planifierSuivant_(slot);
      };
      audio.onerror=function(){
        if(slot.audio!==audio)return;
        slot.audio=null;
        slot.cle='';
        signaler_('',slot);
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
      /* Repli sans Web Audio (createMediaElementSource indisponible/refusé) : la compensation ne peut plus
         qu'atténuer, comme avant ce correctif -- toujours mieux qu'aucune compensation. */
      fondu_(audio,slot.gainNode?volumeAmbiance_():Math.min(1,volumeAmbiance_()*slot.gain),FADE_MS);
      /* Fichier jamais encore analysé : analyse en tâche de fond (n'attend jamais avant de démarrer la lecture),
         corrige la compensation EN DOUCEUR (rampe du GainNode, jamais un saut) si ce même fichier joue encore une
         fois le gain connu, et le mémorise pour toutes les prochaines lectures (sur ce navigateur). */
      if(gainConnuAvant==null){
        analyserGain_(url).then(function(gain){
          enregistrerGain_(cle,gain);
          if(slot.audio===audio&&slot.cle===cle){
            slot.gain=gain;
            if(slot.gainNode)ramperGain_(slot.gainNode,gain,.8);
            else fondu_(audio,Math.min(1,volumeAmbiance_()*gain),800);
          }
        });
      }
    });
  }

  function appliquerVolume_(){
    var v=volumeAmbiance_();
    slots.forEach(function(slot){
      if(!slot.audio)return;
      /*
       * Coupure franche (Norman, 2026-10-05 : « j'ai désactivé le son d'ambiance mais il ne se retire pas ») : sur iPhone / iPad, le navigateur ignore `volume` (toujours 1) et un fondu en cours le remettait à l'ancienne valeur ;
       * `muted` est respecté partout. Le fondu en cours est annulé, la piste continue en silence (le planning des pistes suit son cours) et reprend le son dès que la case est recochée.
       */
      slot.audio.__fonduIdV1=(slot.audio.__fonduIdV1||0)+1;
      try{slot.audio.muted=!(v>0);}catch(_){}
      /* Le GainNode porte déjà la compensation : le curseur ne règle plus que le volume de base de l'élément. */
      slot.audio.volume=slot.gainNode?v:Math.min(1,v*(slot.gain||1));
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
    signaler_('',null);
    slots.forEach(function(slot){
      if(slot.minuterie){clearTimeout(slot.minuterie);slot.minuterie=0;}
      if(slot.audio){
        try{slot.audio.pause();}catch(_){}
        slot.audio.onended=null;
        slot.audio.onerror=null;
        slot.audio=null;
      }
      if(slot.gainNode){
        try{slot.gainNode.disconnect();}catch(_){}
        slot.gainNode=null;
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
