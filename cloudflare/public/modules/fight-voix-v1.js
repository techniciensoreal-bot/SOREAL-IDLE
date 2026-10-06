/*
 * Voix numérisées qui disent « FIGHT ! » sur le bouton rouge du combat de boss (Norman, 2026-10-06 : style Street Fighter / Mortal Kombat ; « 4, 5, 6 d'avant, qui tournent à chaque fois »).
 * Base : une voix d'homme qui dit « Fight ! » (fichiers WAV de fight-voix-base/), retravaillée comme une puce de borne : voix ralentie, couches superposées,
 * égalisation « cri », saturation, réduction en bits, réverbération de salle d'arcade. Trois voix qui tournent dans l'ordre à chaque clic sur FIGHT : démon, double voix, dramatique.
 * Le volume suit la barre « voix » des Paramètres (case décochée = silence).
 *   window.__SOREAL_IDLE_FIGHT_VOIX_V1__ = { variantes:[noms], jouer(i), suivante(), indexSuivant(), construire(i) -> Promise<AudioBuffer> }
 */
(function(){
  'use strict';
  var SR=44100,BASE='/modules/fight-voix-base/';
  /* rate : hauteur et vitesse (1 = normal) ; dist : saturation ; bits/saut : numérisation ; reverb : durée de la salle (s) ; mid : gain « cri » (dB) */
  var VOIX=[
    {nom:'Démon',       base:'david-bas',    couches:[{rate:0.82,gain:1},{rate:0.6,gain:0.7}],  dist:6,   bits:8, saut:2, reverb:1.5, mid:4},
    {nom:'Double voix', base:'david-normal', couches:[{rate:0.86,gain:1},{rate:0.66,gain:0.8}], dist:4.5, bits:8, saut:2, reverb:1.1, mid:5},
    {nom:'Dramatique',  base:'david-lent',   couches:[{rate:0.9,gain:1},{rate:0.68,gain:0.6}],  dist:3,   bits:8, saut:2, reverb:1.9, mid:4}
  ];
  var cacheBase={},cache={},ac=null,derniere=null,suivant=0;
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  function chargerBase_(nom){
    if(cacheBase[nom])return cacheBase[nom];
    var c=contexte_();
    cacheBase[nom]=fetch(BASE+nom+'.wav').then(function(r){return r.arrayBuffer();}).then(function(b){
      return new Promise(function(ok,ko){c.decodeAudioData(b,ok,ko);});
    });
    return cacheBase[nom];
  }
  /* Début réel de la voix : on saute le silence d'attaque du fichier. */
  function debutVoix_(buf){
    var d=buf.getChannelData(0),seuil=0.02;
    for(var i=0;i<d.length;i++)if(Math.abs(d[i])>seuil)return Math.max(0,i/buf.sampleRate-0.01);
    return 0;
  }
  function finVoix_(buf){
    var d=buf.getChannelData(0),seuil=0.015;
    for(var i=d.length-1;i>=0;i--)if(Math.abs(d[i])>seuil)return Math.min(buf.duration,i/buf.sampleRate+0.05);
    return buf.duration;
  }
  function courbe_(k){
    var n=2048,c=new Float32Array(n);
    for(var i=0;i<n;i++){var x=i*2/n-1;c[i]=Math.tanh(x*k)/Math.tanh(k);}
    return c;
  }
  function reponse_(ctx,secondes){
    var n=Math.ceil(SR*secondes),b=ctx.createBuffer(1,n,SR),d=b.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2);
    return b;
  }
  function rendre_(v,base){
    var d0=debutVoix_(base),d1=finVoix_(base),utile=d1-d0,plusLongue=0,i;
    for(i=0;i<v.couches.length;i++)plusLongue=Math.max(plusLongue,utile/v.couches[i].rate);
    var duree=plusLongue+v.reverb+0.1,Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    var ctx=new Off(1,Math.ceil(SR*duree),SR);
    var somme=ctx.createGain();somme.gain.value=1;
    for(i=0;i<v.couches.length;i++){
      var s=ctx.createBufferSource(),g=ctx.createGain();
      s.buffer=base;s.playbackRate.value=v.couches[i].rate;g.gain.value=v.couches[i].gain;
      s.connect(g);g.connect(somme);s.start(0,d0,utile);
    }
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=110;
    var mid=ctx.createBiquadFilter();mid.type='peaking';mid.frequency.value=2300;mid.Q.value=0.9;mid.gain.value=v.mid;
    var sat=ctx.createWaveShaper();sat.curve=courbe_(v.dist);sat.oversample='2x';
    var comp=ctx.createDynamicsCompressor();comp.threshold.value=-24;comp.ratio.value=8;comp.attack.value=0.002;comp.release.value=0.12;
    somme.connect(hp);hp.connect(mid);mid.connect(sat);sat.connect(comp);
    var sec=ctx.createGain();sec.gain.value=1;comp.connect(sec);sec.connect(ctx.destination);
    var conv=ctx.createConvolver();conv.buffer=reponse_(ctx,v.reverb);
    var mouille=ctx.createGain();mouille.gain.value=v.reverb>0.5?0.55:0.28;
    comp.connect(conv);conv.connect(mouille);mouille.connect(ctx.destination);
    return ctx.startRendering();
  }
  /* « Numérisation » : une valeur sur `saut`, quantifiée sur `bits` bits ; ramenée à un niveau sage (crête 0,62). */
  function numeriser_(buf,v){
    var d=buf.getChannelData(0),n=d.length,q=Math.pow(2,v.bits-1),tenu=0,i;
    for(i=0;i<n;i++){if(i%v.saut===0)tenu=Math.round(d[i]*q)/q;d[i]=tenu;}
    var pic=0;for(i=0;i<n;i++){var a=Math.abs(d[i]);if(a>pic)pic=a;}
    var k=pic>0?0.62/pic:1;
    for(i=0;i<n;i++)d[i]*=k;
    return buf;
  }
  function construire(i){
    var v=VOIX[i];
    if(!v)return Promise.reject(new Error('voix inconnue'));
    if(cache[i])return Promise.resolve(cache[i]);
    return chargerBase_(v.base).then(function(b){return rendre_(v,b);}).then(function(b){cache[i]=numeriser_(b,v);return cache[i];});
  }
  function volume_(){
    try{var a=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;if(a&&a.getVoix){var x=a.getVoix();if(typeof x==='number')return x;}}catch(_e){}
    return 1;
  }
  function jouer(i){
    var c=contexte_();
    if(!c||volume_()<=0)return Promise.resolve(false);
    if(c.state==='suspended'&&c.resume)c.resume();
    return construire(i).then(function(b){
      if(derniere){try{derniere.stop();}catch(_e){}}
      var s=c.createBufferSource(),g=c.createGain();
      s.buffer=b;g.gain.value=volume_();
      s.connect(g);g.connect(c.destination);s.start();derniere=s;
      return true;
    });
  }
  /* Une voix à chaque clic sur FIGHT, dans l'ordre 1, 2, 3, 1, 2, 3... */
  function suivante(){
    var i=suivant;
    suivant=(suivant+1)%VOIX.length;
    return jouer(i);
  }
  function precharger_(){
    for(var i=0;i<VOIX.length;i++)construire(i).catch(function(){});
  }
  document.addEventListener('pointerdown',function une_(){
    document.removeEventListener('pointerdown',une_,true);
    if(contexte_())precharger_();
  },true);
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('#sorealIdleBossStartV100'):null;
    if(!t||t.disabled)return;
    suivante().catch(function(){});
  },true);
  window.__SOREAL_IDLE_FIGHT_VOIX_V1__={variantes:VOIX.map(function(v){return v.nom;}),jouer:jouer,suivante:suivante,indexSuivant:function(){return suivant;},construire:construire};
})();
