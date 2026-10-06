/*
 * Coup de poing du bouton rouge FIGHT (Norman, 2026-10-06 : « je n'aime pas le Fight finalement, mets un son de coup de poing »).
 * Synthèse en trois couches : le CHOC grave (sinus dont la hauteur s'effondre, le poing qui s'écrase), la CLAQUE médium (bruit filtré, la chair), et le CRAC bref (le claquement sec
 * de l'impact), le tout légèrement saturé. La hauteur varie un peu à chaque coup pour que deux coups ne soient jamais identiques. Volume = barre « interface » des Paramètres.
 *   window.__SOREAL_IDLE_FIGHT_COUP_V1__ = { jouer(), construire() -> Promise<AudioBuffer> (pour l'analyse hors ligne) }
 */
(function(){
  'use strict';
  var SR=44100,DUREE=0.8;
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
  /* Variantes du coup (Norman, 2026-10-06 : « fais des variantes »). choc = [f. départ, f. arrivée, durée de chute, durée totale, gain] ; corps = idem (triangle) ;
   claque = bruit [fréquence, Q, durée, gain] ; crac = [gain, fréquence] ; sat = saturation ; carre = choc en onde carrée (arcade) ; souffle = élan qui précède le coup ; suite = coups suivants (retards en s) ; anneau = [fréquence, durée, gain] d'une résonance métallique */
  var VARIANTES=[
    {nom:'Classique',        choc:[190,46,0.13,0.30,1.0], corps:[340,95,0.09,0.14,0.5], claque:[1500,0.7,0.10,0.75], crac:[0.4,3200], sat:2.2},
    {nom:'Sec et claquant',  choc:[210,70,0.07,0.16,0.6], corps:[420,130,0.05,0.09,0.45], claque:[2100,0.8,0.07,1.0], crac:[0.75,3800], sat:2.8},
    {nom:'Lourd',            choc:[150,36,0.2,0.46,1.0],  corps:[260,70,0.14,0.2,0.5], claque:[900,0.6,0.14,0.6], crac:[0.28,2600], sat:2.6},
    {nom:'Sac de frappe',    choc:[130,42,0.14,0.34,1.0], corps:[220,80,0.1,0.16,0.55], claque:[650,0.9,0.16,0.9], crac:[0.12,1800], sat:1.6},
    {nom:'Arcade 8 bits',    choc:[260,52,0.1,0.22,0.8],  corps:[480,110,0.06,0.1,0.5], claque:[2400,0.5,0.08,0.7], crac:[0.5,4200], sat:5, carre:true},
    {nom:'Élan et impact',   choc:[180,44,0.13,0.32,1.0], corps:[330,92,0.09,0.15,0.5], claque:[1400,0.7,0.11,0.8], crac:[0.5,3200], sat:2.4, souffle:0.11},
    {nom:'Double coup',      choc:[190,46,0.12,0.26,1.0], corps:[340,95,0.08,0.13,0.5], claque:[1500,0.7,0.09,0.75], crac:[0.4,3200], sat:2.4, suite:[0.13]},
    {nom:'Uppercut',         choc:[160,38,0.18,0.42,1.0], corps:[300,75,0.12,0.18,0.5], claque:[1100,0.7,0.13,0.8], crac:[0.35,2800], sat:2.6, souffle:0.08},
    {nom:'Crochet métallique',choc:[200,60,0.08,0.2,0.7],  corps:[400,120,0.05,0.1,0.45], claque:[2000,0.8,0.08,0.9], crac:[0.6,3600], sat:2.6, anneau:[1180,0.28,0.22]},
    {nom:'Coup au ventre',   choc:[110,30,0.16,0.4,1.0],  corps:[190,60,0.1,0.16,0.5], claque:[420,0.9,0.14,0.85], crac:[0.08,1400], sat:1.8},
    {nom:'Rafale',           choc:[200,52,0.09,0.2,0.9],  corps:[360,100,0.06,0.1,0.5], claque:[1700,0.7,0.07,0.8], crac:[0.45,3300], sat:2.6, suite:[0.095,0.19]}
  ];
  /* Branche UN coup sur `sat` à partir de l'instant t ; k = variation de hauteur (≈ 0,92 à 1,08). */
  function coup_(ctx,sat,t0,k,v){
    var o=ctx.createOscillator(),go=ctx.createGain();
    o.type=v.carre?'square':'sine';o.frequency.setValueAtTime(v.choc[0]*k,t0);o.frequency.exponentialRampToValueAtTime(v.choc[1]*k,t0+v.choc[2]);
    go.gain.setValueAtTime(0.0001,t0);go.gain.linearRampToValueAtTime(v.carre?0.55:v.choc[4],t0+0.004);go.gain.exponentialRampToValueAtTime(0.001,t0+v.choc[3]);
    o.connect(go);go.connect(sat);o.start(t0);o.stop(t0+v.choc[3]+0.04);

    var t=ctx.createOscillator(),gt=ctx.createGain();
    t.type=v.carre?'square':'triangle';t.frequency.setValueAtTime(v.corps[0]*k,t0);t.frequency.exponentialRampToValueAtTime(v.corps[1]*k,t0+v.corps[2]);
    gt.gain.setValueAtTime(0.0001,t0);gt.gain.linearRampToValueAtTime(v.carre?0.3:v.corps[4],t0+0.003);gt.gain.exponentialRampToValueAtTime(0.001,t0+v.corps[3]);
    t.connect(gt);gt.connect(sat);t.start(t0);t.stop(t0+v.corps[3]+0.04);

    var b=ctx.createBufferSource();b.buffer=bruit_(ctx,0.25);
    var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=v.claque[0]*k;bp.Q.value=v.claque[1];
    var gb=ctx.createGain();
    gb.gain.setValueAtTime(0.0001,t0);gb.gain.linearRampToValueAtTime(v.claque[3],t0+0.002);gb.gain.exponentialRampToValueAtTime(0.001,t0+v.claque[2]);
    b.connect(bp);bp.connect(gb);gb.connect(sat);b.start(t0);b.stop(t0+0.25);

    if(v.anneau){
      var r=ctx.createOscillator(),gr=ctx.createGain();
      r.type='sine';r.frequency.value=v.anneau[0]*k;
      gr.gain.setValueAtTime(0.0001,t0);gr.gain.linearRampToValueAtTime(v.anneau[2],t0+0.003);gr.gain.exponentialRampToValueAtTime(0.001,t0+v.anneau[1]);
      r.connect(gr);gr.connect(sat);r.start(t0);r.stop(t0+v.anneau[1]+0.04);
    }
    var c=ctx.createBufferSource();c.buffer=bruit_(ctx,0.05);
    var hp=ctx.createBiquadFilter();hp.type='bandpass';hp.frequency.value=v.crac[1];hp.Q.value=0.9;
    var gc=ctx.createGain();
    gc.gain.setValueAtTime(v.crac[0],t0);gc.gain.exponentialRampToValueAtTime(0.001,t0+0.025);
    c.connect(hp);hp.connect(gc);gc.connect(sat);c.start(t0);c.stop(t0+0.05);
  }
  function monter_(ctx,sortie,t0,k,v){
    var sat=ctx.createWaveShaper();sat.curve=courbe_(v.sat);
    var maitre=ctx.createGain();maitre.gain.value=0.62;
    sat.connect(maitre);maitre.connect(sortie);
    var debut=t0;
    if(v.souffle){
      /* l'élan : un souffle qui monte juste avant que le poing arrive */
      var w=ctx.createBufferSource();w.buffer=bruit_(ctx,v.souffle+0.05);
      var f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;
      f.frequency.setValueAtTime(500,t0);f.frequency.exponentialRampToValueAtTime(3000,t0+v.souffle);
      var gw=ctx.createGain();
      gw.gain.setValueAtTime(0.0001,t0);gw.gain.linearRampToValueAtTime(0.5,t0+v.souffle*0.9);gw.gain.linearRampToValueAtTime(0,t0+v.souffle+0.02);
      w.connect(f);f.connect(gw);gw.connect(sat);w.start(t0);w.stop(t0+v.souffle+0.05);
      debut=t0+v.souffle;
    }
    coup_(ctx,sat,debut,k,v);
    if(v.suite)for(var j=0;j<v.suite.length;j++)coup_(ctx,sat,debut+v.suite[j],k*(1-0.04*(j+1)),v);
  }
  function construire(i){
    var v=VARIANTES[i||0];
    var Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    var ctx=new Off(1,Math.ceil(SR*DUREE),SR);
    monter_(ctx,ctx.destination,0.005,1,v);
    return ctx.startRendering();
  }
  function volume_(){
    try{var a=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;if(a&&a.getInterface){var x=a.getInterface();if(typeof x==='number')return x;}}catch(_e){}
    return 1;
  }
  var dernier=-1;
  function hasard_(){
    var n=VARIANTES.length,i=Math.floor(Math.random()*n);
    if(n>1&&i===dernier)i=(i+1+Math.floor(Math.random()*(n-1)))%n;
    dernier=i;
    return i;
  }
  /* jouer(i) : la variante i ; jouer() : une variante au hasard, jamais la même deux fois de suite. */
  function jouer(i){
    if(typeof i!=='number')i=hasard_();
    var c=contexte_(),v=volume_();
    if(!c||v<=0)return false;
    if(c.state==='suspended'&&c.resume)c.resume();
    var g=c.createGain();g.gain.value=v;g.connect(c.destination);
    monter_(c,g,c.currentTime+0.005,0.92+Math.random()*0.16,VARIANTES[i]);
    return true;
  }
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('#sorealIdleBossStartV100'):null;
    if(!t||t.disabled)return;
    try{jouer();}catch(_e){}
  },true);
  window.__SOREAL_IDLE_FIGHT_COUP_V1__={variantes:VARIANTES.map(function(v){return v.nom;}),jouer:jouer,construire:construire,dernier:function(){return dernier;}};
})();
