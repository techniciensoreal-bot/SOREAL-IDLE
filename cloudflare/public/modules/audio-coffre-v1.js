/*
 * Sons du Coffre-Bagage (Norman, 2026-10-10) : 10 sons « le coffre avale un objet » et 10 sons « le coffre recrache un objet », tous synthétisés (aucun fichier audio, aucun poids ajouté).
 * window.__SOREAL_IDLE_AUDIO_COFFRE_V1__ = { avaler:[{id,nom,jouer(ctx,sortie,t0)}], recracher:[…], jouer(sens,index,ctx,sortie) }
 * `ctx` est un AudioContext, `sortie` un nœud (gain général), `t0` l'heure de départ. Chaque son dure moins d'une seconde.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUDIO_COFFRE_V1__)return;

  function bruit(ctx){
    if(ctx.__bruitCoffreV1)return ctx.__bruitCoffreV1;
    var n=ctx.sampleRate*1.5,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<n;i+=1)d[i]=Math.random()*2-1;
    ctx.__bruitCoffreV1=b;
    return b;
  }
  /* Oscillateur : fréquence f0 -> f1 (exponentielle), enveloppe attaque/déclin, vibrato facultatif, filtre facultatif. */
  function ton(ctx,sortie,t,o){
    var osc=ctx.createOscillator(),g=ctx.createGain(),noeud=osc;
    osc.type=o.type||'sine';
    osc.frequency.setValueAtTime(Math.max(20,o.f0),t);
    if(o.f1)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.d);
    if(o.vib){
      var l=ctx.createOscillator(),lg=ctx.createGain();
      l.frequency.value=o.vib[0];lg.gain.value=o.vib[1];l.connect(lg);lg.connect(osc.frequency);l.start(t);l.stop(t+o.d+.05);
    }
    if(o.filtre){var f=ctx.createBiquadFilter();f.type=o.filtre[0];f.frequency.value=o.filtre[1];f.Q.value=o.filtre[2]||1;osc.connect(f);noeud=f;}
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(o.v||.2,t+(o.a||.01));
    g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
    noeud.connect(g);g.connect(sortie);
    osc.start(t);osc.stop(t+o.d+.05);
  }
  /* Bruit filtré : filtre de type `type`, fréquence f0 -> f1. */
  function souffle(ctx,sortie,t,o){
    var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=bruit(ctx);
    f.type=o.type||'bandpass';f.Q.value=o.q||1;
    f.frequency.setValueAtTime(Math.max(20,o.f0),t);
    if(o.f1)f.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1),t+o.d);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(o.v||.2,t+(o.a||.008));
    g.gain.exponentialRampToValueAtTime(.0001,t+o.d);
    s.connect(f);f.connect(g);g.connect(sortie);
    s.start(t,Math.random()*.5);s.stop(t+o.d+.05);
  }
  /* Briques réutilisables. */
  function glou(ctx,s,t,v,haut){ton(ctx,s,t,{type:'sine',f0:haut||340,f1:70,d:.2,v:v||.3,a:.012});souffle(ctx,s,t,{type:'lowpass',f0:900,f1:200,d:.16,v:(v||.3)*.5,q:3});}
  function croc(ctx,s,t,v,f){souffle(ctx,s,t,{type:'bandpass',f0:f||1800,f1:(f||1800)*.6,d:.07,v:v||.3,q:2.5,a:.002});ton(ctx,s,t,{type:'square',f0:(f||1800)/8,f1:60,d:.06,v:(v||.3)*.35,a:.002});}
  function claque(ctx,s,t,v){souffle(ctx,s,t,{type:'lowpass',f0:1400,f1:200,d:.12,v:v||.4,a:.002});ton(ctx,s,t,{type:'sine',f0:150,f1:55,d:.16,v:(v||.4)*.8,a:.002});}
  function ping(ctx,s,t,v,f){ton(ctx,s,t,{type:'sine',f0:f||1800,d:.45,v:v||.15,a:.002});ton(ctx,s,t,{type:'sine',f0:(f||1800)*2.7,d:.25,v:(v||.15)*.4,a:.002});}
  function rot(ctx,s,t,d,f,v){ton(ctx,s,t,{type:'sawtooth',f0:f||95,f1:(f||95)*.7,d:d||.5,v:v||.22,a:.05,vib:[28,9],filtre:['lowpass',520,2]});}

  var AVALER=[
    {id:'gloups',nom:'Gloups classique',jouer:function(c,s,t){glou(c,s,t,.35);}},
    {id:'croc-gloups',nom:'Croc… gloups',jouer:function(c,s,t){croc(c,s,t,.3);glou(c,s,t+.1,.3,300);}},
    {id:'double',nom:'Double gorgée',jouer:function(c,s,t){glou(c,s,t,.3,360);glou(c,s,t+.2,.32,300);}},
    {id:'miam',nom:'Miam miam miam',jouer:function(c,s,t){for(var i=0;i<3;i+=1)ton(c,s,t+i*.13,{type:'sawtooth',f0:330+i*40,f1:220,d:.11,v:.16,a:.01,filtre:['bandpass',700+i*150,4]});glou(c,s,t+.42,.28,260);}},
    {id:'slurp',nom:'Aspiration',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:3200,f1:300,d:.4,v:.3,q:4,a:.03});ton(c,s,t+.34,{type:'sine',f0:140,f1:55,d:.16,v:.3,a:.005});}},
    {id:'claque',nom:'Couvercle qui claque',jouer:function(c,s,t){claque(c,s,t,.45);glou(c,s,t+.14,.28,260);}},
    {id:'dents',nom:'Cliquetis de dents',jouer:function(c,s,t){for(var i=0;i<4;i+=1)croc(c,s,t+i*.055,.22,2600);glou(c,s,t+.28,.3,300);}},
    {id:'gros',nom:'Gros avalement',jouer:function(c,s,t){ton(c,s,t,{type:'sine',f0:520,f1:60,d:.55,v:.32,a:.02,vib:[9,18]});souffle(c,s,t,{type:'lowpass',f0:1200,f1:150,d:.5,v:.18,q:2,a:.03});}},
    {id:'mastic',nom:'Mastication',jouer:function(c,s,t){[1500,2100,1700,2300].forEach(function(f,i){croc(c,s,t+i*.1,.26,f);});glou(c,s,t+.46,.3,280);}},
    {id:'boing',nom:'Boing cartoon',jouer:function(c,s,t){ton(c,s,t,{type:'triangle',f0:150,f1:420,d:.14,v:.3,a:.01});ton(c,s,t+.13,{type:'triangle',f0:420,f1:90,d:.22,v:.3,a:.005});}}
  ];
  var RECRACHER=[
    {id:'pop',nom:'Pop !',jouer:function(c,s,t){ton(c,s,t,{type:'sine',f0:220,f1:760,d:.1,v:.32,a:.005});souffle(c,s,t,{type:'highpass',f0:3000,d:.05,v:.2,a:.002});}},
    {id:'rot',nom:'Rot sonore',jouer:function(c,s,t){rot(c,s,t,.55,95,.3);}},
    {id:'ptooey',nom:'Ptooey !',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:2600,f1:900,d:.09,v:.35,q:1.5,a:.002});ton(c,s,t,{type:'sine',f0:600,f1:160,d:.12,v:.22,a:.003});}},
    {id:'toux',nom:'Quinte de toux',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:1100,d:.07,v:.3,q:1.2});souffle(c,s,t+.11,{type:'bandpass',f0:1000,d:.08,v:.32,q:1.2});ton(c,s,t+.2,{type:'sine',f0:140,f1:70,d:.14,v:.28,a:.005});}},
    {id:'ejection',nom:'Éjection',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:300,f1:2800,d:.28,v:.28,q:3,a:.04});ping(c,s,t+.27,.16,1900);}},
    {id:'rot-clink',nom:'Rot + tintement',jouer:function(c,s,t){rot(c,s,t,.4,100,.26);ping(c,s,t+.38,.16,1700);}},
    {id:'slurp-inv',nom:'Aspiration inversée',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:300,f1:3200,d:.34,v:.28,q:4,a:.03});ton(c,s,t+.33,{type:'sine',f0:260,f1:800,d:.08,v:.28,a:.003});}},
    {id:'boing-crache',nom:'Boing crachat',jouer:function(c,s,t){ton(c,s,t,{type:'triangle',f0:90,f1:520,d:.2,v:.3,a:.01,vib:[22,12]});ton(c,s,t+.2,{type:'triangle',f0:520,f1:260,d:.12,v:.22,a:.004});}},
    {id:'langue',nom:'Raclement de langue',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:900,f1:1500,d:.35,v:.22,q:6,a:.05});ton(c,s,t+.3,{type:'sine',f0:200,f1:520,d:.09,v:.28,a:.004});}},
    {id:'splat',nom:'Splat',jouer:function(c,s,t){souffle(c,s,t,{type:'lowpass',f0:2000,f1:300,d:.16,v:.4,a:.002});ton(c,s,t,{type:'sine',f0:420,f1:130,d:.2,v:.3,a:.002});ping(c,s,t+.22,.1,2400);}}
  ];

  function jouer(sens,index,ctx,sortie){
    var liste=sens==='recracher'?RECRACHER:AVALER;
    var son=liste[((index%liste.length)+liste.length)%liste.length];
    var t=ctx.currentTime+.02;
    son.jouer(ctx,sortie||ctx.destination,t);
    return son;
  }
  /* Tirage au hasard parmi les 10 sons du sens demandé, jamais deux fois le même d'affilée (Norman, 2026-10-10 : « garde les sons pour quand il avale ou recrache »). */
  var dernier={avaler:-1,recracher:-1};
  function jouerAleatoire(sens,ctx,sortie){
    var cle=sens==='recracher'?'recracher':'avaler',n=(cle==='recracher'?RECRACHER:AVALER).length,i=Math.floor(Math.random()*n);
    if(i===dernier[cle])i=(i+1+Math.floor(Math.random()*(n-1)))%n;
    dernier[cle]=i;
    return jouer(cle,i,ctx,sortie);
  }
  window.__SOREAL_IDLE_AUDIO_COFFRE_V1__={avaler:AVALER,recracher:RECRACHER,jouer:jouer,jouerAleatoire:jouerAleatoire};
})();
