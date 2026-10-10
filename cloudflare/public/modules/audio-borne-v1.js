/*
 * Son d'allumage de la borne (Norman, 2026-10-10 : « au premier affichage de Fight Boss, la borne doit s'allumer avec un effet de clignotement et un bruit d'écran qui s'allume »).
 * Synthétisé, aucun fichier : déclic de relais, ronflement du transformateur qui monte, grésillements du néon qui clignote, « boum » de démagnétisation, sifflement du tube cathodique qui chauffe.
 * Il suit la même chronologie que l'animation de la borne (~2,6 s). window.__SOREAL_IDLE_AUDIO_BORNE_V1__ = { allumer(ctx, sortie) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUDIO_BORNE_V1__)return;
  function bruit(ctx){
    if(ctx.__bruitBorneV1)return ctx.__bruitBorneV1;
    var n=ctx.sampleRate*1.2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<n;i+=1)d[i]=Math.random()*2-1;
    ctx.__bruitBorneV1=b;return b;
  }
  function ton(ctx,s,t,o){
    var osc=ctx.createOscillator(),g=ctx.createGain(),n=osc;
    osc.type=o.type||'sine';
    osc.frequency.setValueAtTime(Math.max(20,o.f0),t);
    if(o.f1)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.d);
    if(o.filtre){var f=ctx.createBiquadFilter();f.type=o.filtre[0];f.frequency.value=o.filtre[1];f.Q.value=o.filtre[2]||1;osc.connect(f);n=f;}
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(o.v||.1,t+(o.a||.01));
    if(o.tenu)g.gain.setValueAtTime(o.v||.1,t+o.tenu);
    g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
    n.connect(g);g.connect(s);osc.start(t);osc.stop(t+o.d+.05);
  }
  function souffle(ctx,s,t,o){
    var src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    src.buffer=bruit(ctx);f.type=o.type||'bandpass';f.Q.value=o.q||1;
    f.frequency.setValueAtTime(Math.max(20,o.f0),t);
    if(o.f1)f.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.v||.1,t+(o.a||.005));g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
    src.connect(f);f.connect(g);g.connect(s);src.start(t,Math.random()*.4);src.stop(t+o.d+.05);
  }
  /*
   * Chronologie CALÉE sur l'animation de la borne (soreal-idle-itopod.css, « Borne v2 », mêmes délais) :
   *   0,28 s déclic de relais ; 0,30 s ronflement qui monte ; néon des flancs : pics de lumière à 0,45 / 0,57 / 0,72 / 0,84 / 0,98 / 1,10 s ;
   *   enseigne : pics à 0,64 / 0,95 / 1,26 s ; 1,15 s l'écran s'amorce (« boum » de démagnétisation, sifflement du tube) ; 1,44 s le trait blanc s'élargit ;
   *   1,84 s l'image est pleine (pic de lumière) ; 1,90 / 2,05 / 2,20 s les trois boutons s'allument l'un après l'autre.
   */
  function allumer(ctx,sortie){
    var s=sortie||ctx.destination,t=ctx.currentTime+.02;
    souffle(ctx,s,t+.28,{type:'bandpass',f0:1400,f1:500,d:.07,v:.34,q:2,a:.002});
    ton(ctx,s,t+.28,{type:'sine',f0:140,f1:52,d:.16,v:.34,a:.002});
    ton(ctx,s,t+.3,{type:'sawtooth',f0:50,f1:56,d:2.1,v:.11,a:1.0,tenu:1.35,filtre:['lowpass',260,1.5]});
    ton(ctx,s,t+.3,{type:'sine',f0:100,d:2.1,v:.05,a:1.0,tenu:1.35});
    /* flancs : grésillement à chaque pic de lumière du néon */
    [.45,.57,.72,.84,.98,1.10].forEach(function(d,i){
      ton(ctx,s,t+d,{type:'square',f0:100+(i%2)*40,d:.07,v:.045,a:.003,filtre:['bandpass',1100+i*160,3]});
      souffle(ctx,s,t+d,{type:'highpass',f0:4200,d:.045,v:.07,a:.002});
    });
    /* enseigne : bourdonnement net à chaque éclat */
    [.64,.95,1.26].forEach(function(d,i){
      ton(ctx,s,t+d,{type:'sawtooth',f0:120,d:.16,v:.085,a:.006,filtre:['bandpass',700+i*250,4]});
      souffle(ctx,s,t+d,{type:'highpass',f0:3000,d:.1,v:.1,a:.003});
    });
    /* écran : démagnétisation, chauffe du tube, élargissement du trait, pleine lumière */
    ton(ctx,s,t+1.15,{type:'sine',f0:80,f1:34,d:.45,v:.42,a:.004});
    souffle(ctx,s,t+1.15,{type:'lowpass',f0:1800,f1:120,d:.4,v:.22,a:.004});
    ton(ctx,s,t+1.15,{type:'triangle',f0:1200,f1:7200,d:.6,v:.032,a:.05});
    souffle(ctx,s,t+1.44,{type:'bandpass',f0:700,f1:6500,d:.2,v:.12,q:1.5,a:.01});
    souffle(ctx,s,t+1.84,{type:'bandpass',f0:5200,f1:2200,d:.24,v:.1,q:.8,a:.01});
    ton(ctx,s,t+1.84,{type:'sine',f0:420,f1:210,d:.2,v:.09,a:.004});
    /* boutons : un « tic » lumineux de plus en plus aigu pour chacun */
    [[1.90,700],[2.05,900],[2.20,1150]].forEach(function(b){
      ton(ctx,s,t+b[0],{type:'sine',f0:b[1],f1:b[1]*1.5,d:.14,v:.1,a:.004});
      souffle(ctx,s,t+b[0],{type:'highpass',f0:3800,d:.03,v:.08,a:.001});
    });
  }
  window.__SOREAL_IDLE_AUDIO_BORNE_V1__={allumer:allumer,dureeMs:2600};
})();
