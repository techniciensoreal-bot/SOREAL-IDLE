/*
 * Coup de poing du bouton rouge FIGHT (Norman, 2026-10-06 : « je n'aime pas le Fight finalement, mets un son de coup de poing »).
 * Synthèse en trois couches : le CHOC grave (sinus dont la hauteur s'effondre, le poing qui s'écrase), la CLAQUE médium (bruit filtré, la chair), et le CRAC bref (le claquement sec
 * de l'impact), le tout légèrement saturé. La hauteur varie un peu à chaque coup pour que deux coups ne soient jamais identiques. Volume = barre « interface » des Paramètres.
 *   window.__SOREAL_IDLE_FIGHT_COUP_V1__ = { jouer(), construire() -> Promise<AudioBuffer> (pour l'analyse hors ligne) }
 */
(function(){
  'use strict';
  var SR=44100,DUREE=0.5;
  var ac=null;
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  function bruit_(ctx,secondes){
    var n=Math.ceil(SR*secondes),b=ctx.createBuffer(1,n,SR),d=b.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
    return b;
  }
  function courbe_(k){
    var n=1024,c=new Float32Array(n);
    for(var i=0;i<n;i++){var x=i*2/n-1;c[i]=Math.tanh(x*k)/Math.tanh(k);}
    return c;
  }
  /* Branche le coup sur `sortie` à partir de l'instant t0 ; k = variation de hauteur (≈ 0,92 à 1,08). */
  function monter_(ctx,sortie,t0,k){
    var sat=ctx.createWaveShaper();sat.curve=courbe_(2.2);
    var maitre=ctx.createGain();maitre.gain.value=0.62;
    sat.connect(maitre);maitre.connect(sortie);

    /* CHOC : la masse du coup, un sinus qui tombe de 190 Hz à 46 Hz. */
    var o=ctx.createOscillator(),go=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(190*k,t0);o.frequency.exponentialRampToValueAtTime(46*k,t0+0.13);
    go.gain.setValueAtTime(0.0001,t0);go.gain.linearRampToValueAtTime(1,t0+0.004);go.gain.exponentialRampToValueAtTime(0.001,t0+0.3);
    o.connect(go);go.connect(sat);o.start(t0);o.stop(t0+0.34);

    /* CORPS : un triangle médium qui tombe vite, pour qu'on l'entende sur de petits haut-parleurs. */
    var t=ctx.createOscillator(),gt=ctx.createGain();
    t.type='triangle';t.frequency.setValueAtTime(340*k,t0);t.frequency.exponentialRampToValueAtTime(95*k,t0+0.09);
    gt.gain.setValueAtTime(0.0001,t0);gt.gain.linearRampToValueAtTime(0.5,t0+0.003);gt.gain.exponentialRampToValueAtTime(0.001,t0+0.14);
    t.connect(gt);gt.connect(sat);t.start(t0);t.stop(t0+0.18);

    /* CLAQUE : la chair, du bruit médium qui s'éteint vite. */
    var b=ctx.createBufferSource();b.buffer=bruit_(ctx,0.2);
    var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500*k;bp.Q.value=0.7;
    var gb=ctx.createGain();
    gb.gain.setValueAtTime(0.0001,t0);gb.gain.linearRampToValueAtTime(0.75,t0+0.002);gb.gain.exponentialRampToValueAtTime(0.001,t0+0.1);
    b.connect(bp);bp.connect(gb);gb.connect(sat);b.start(t0);b.stop(t0+0.2);

    /* CRAC : le claquement sec de l'impact, très bref. */
    var c=ctx.createBufferSource();c.buffer=bruit_(ctx,0.05);
    var hp=ctx.createBiquadFilter();hp.type='bandpass';hp.frequency.value=3200;hp.Q.value=0.9;
    var gc=ctx.createGain();
    gc.gain.setValueAtTime(0.4,t0);gc.gain.exponentialRampToValueAtTime(0.001,t0+0.025);
    c.connect(hp);hp.connect(gc);gc.connect(sat);c.start(t0);c.stop(t0+0.05);
  }
  function construire(){
    var Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    var ctx=new Off(1,Math.ceil(SR*DUREE),SR);
    monter_(ctx,ctx.destination,0.005,1);
    return ctx.startRendering();
  }
  function volume_(){
    try{var a=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;if(a&&a.getInterface){var x=a.getInterface();if(typeof x==='number')return x;}}catch(_e){}
    return 1;
  }
  function jouer(){
    var c=contexte_(),v=volume_();
    if(!c||v<=0)return false;
    if(c.state==='suspended'&&c.resume)c.resume();
    var g=c.createGain();g.gain.value=v;g.connect(c.destination);
    monter_(c,g,c.currentTime+0.005,0.92+Math.random()*0.16);
    return true;
  }
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('#sorealIdleBossStartV100'):null;
    if(!t||t.disabled)return;
    try{jouer();}catch(_e){}
  },true);
  window.__SOREAL_IDLE_FIGHT_COUP_V1__={jouer:jouer,construire:construire};
})();
