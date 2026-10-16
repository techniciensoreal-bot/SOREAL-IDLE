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

  /*
   * Rots et pets du Coffre (Norman, 2026-10-10 : « que le coffre rote et pète aléatoirement avec un son que tu vas créer ») : synthétisés comme le reste, six de chaque, tirés au hasard (jamais deux fois de suite le même).
   * Un rot = une note grave en dents de scie qui descend, avec un vibrato lent et un filtre qui l'étouffe ; un pet = une note plus grave encore dont le vibrato rapide hache le son, doublée d'un souffle.
   */
  function pet(ctx,s,t,d,f0,f1,v,vib){
    ton(ctx,s,t,{type:'sawtooth',f0:f0,f1:f1,d:d,v:v||.26,a:.012,vib:vib||[42,22],filtre:['lowpass',420,3]});
    souffle(ctx,s,t,{type:'bandpass',f0:260,f1:150,d:d*.9,v:(v||.26)*.7,q:2,a:.012});
  }
  var ROTS=[
    {id:'rot-grave',nom:'Rot grave',jouer:function(c,s,t){rot(c,s,t,.75,80,.34);}},
    {id:'rot-aigu',nom:'Rot aigu',jouer:function(c,s,t){ton(c,s,t,{type:'sawtooth',f0:190,f1:110,d:.36,v:.26,a:.03,vib:[34,14],filtre:['lowpass',700,2]});}},
    {id:'rot-double',nom:'Double rot',jouer:function(c,s,t){rot(c,s,t,.3,105,.3);rot(c,s,t+.34,.42,85,.32);}},
    {id:'rot-long',nom:'Rot interminable',jouer:function(c,s,t){ton(c,s,t,{type:'sawtooth',f0:75,f1:48,d:1.1,v:.32,a:.08,vib:[22,12],filtre:['lowpass',480,2]});souffle(c,s,t,{type:'lowpass',f0:500,f1:150,d:.9,v:.14,q:1,a:.1});}},
    {id:'rot-gazeux',nom:'Rot gazeux',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:420,f1:240,d:.45,v:.3,q:3,a:.05});rot(c,s,t+.05,.4,100,.22);}},
    {id:'rot-pardon',nom:'Rot puis petit hoquet',jouer:function(c,s,t){rot(c,s,t,.55,92,.3);ton(c,s,t+.62,{type:'sine',f0:520,f1:260,d:.09,v:.2,a:.004});ton(c,s,t+.73,{type:'sine',f0:620,f1:300,d:.09,v:.16,a:.004});}}
  ];
  var PETS=[
    {id:'pet-court',nom:'Pet sec',jouer:function(c,s,t){pet(c,s,t,.25,125,70,.3);}},
    {id:'pet-long',nom:'Pet prolongé',jouer:function(c,s,t){pet(c,s,t,.95,95,46,.28,[38,20]);}},
    {id:'pet-trompette',nom:'Pet trompette',jouer:function(c,s,t){ton(c,s,t,{type:'square',f0:210,f1:150,d:.5,v:.5,a:.02,vib:[58,10],filtre:['bandpass',520,3]});souffle(c,s,t,{type:'bandpass',f0:300,d:.4,v:.1,q:2,a:.02});}},
    {id:'pet-triple',nom:'Trois petits pets',jouer:function(c,s,t){pet(c,s,t,.14,140,90,.26);pet(c,s,t+.2,.14,125,80,.26);pet(c,s,t+.4,.22,110,60,.28);}},
    {id:'pet-siffle',nom:'Pet sifflant',jouer:function(c,s,t){souffle(c,s,t,{type:'bandpass',f0:2600,f1:900,d:.55,v:.32,q:6,a:.03});ton(c,s,t+.02,{type:'sawtooth',f0:100,f1:70,d:.5,v:.12,a:.02,vib:[50,15],filtre:['lowpass',350,2]});}},
    {id:'pet-mouille',nom:'Pet mouillé',jouer:function(c,s,t){pet(c,s,t,.5,85,50,.26,[52,26]);for(var i=0;i<3;i+=1)glou(c,s,t+.52+i*.07,.14,200-i*30);}}
  ];
  /*
   * Pet « grincement de porte » (Norman, 2026-10-16 : « le bruit que tu as fait pour la porte, mets-le quand le coffre pète de temps en temps, mais pas le ding de fin ») : clac de loquet, vieux bois qui grince
   * en montant et en vibrant, racle sur la pierre, poids qui arrive en butée. AUCUN tintement à la fin. Une fois sur ~5 pets (P_PET_RARE), jamais deux fois de suite.
   */
  function grincementPorte(c,s,t){
    souffle(c,s,t,{type:'bandpass',f0:1800,f1:1200,d:.04,v:.5,q:3,a:.002});
    ton(c,s,t,{type:'square',f0:240,f1:130,d:.07,v:.5,a:.005});
    var o=c.createOscillator();o.type='sawtooth';
    o.frequency.setValueAtTime(70,t+.1);o.frequency.exponentialRampToValueAtTime(150,t+.95);
    var lfo=c.createOscillator();lfo.type='sine';lfo.frequency.setValueAtTime(11,t+.1);
    var lg=c.createGain();lg.gain.setValueAtTime(6,t+.1);lfo.connect(lg);lg.connect(o.frequency);
    var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=5;
    f.frequency.setValueAtTime(520,t+.1);f.frequency.exponentialRampToValueAtTime(1500,t+.95);
    var g=c.createGain();
    g.gain.setValueAtTime(.0001,t+.1);g.gain.exponentialRampToValueAtTime(.5,t+.28);g.gain.exponentialRampToValueAtTime(.3,t+.7);g.gain.exponentialRampToValueAtTime(.0001,t+1.05);
    o.connect(f);f.connect(g);g.connect(s);
    o.start(t+.1);o.stop(t+1.1);lfo.start(t+.1);lfo.stop(t+1.1);
    souffle(c,s,t+.12,{type:'lowpass',f0:380,f1:220,d:.8,v:.5,q:1.2,a:.05});
    ton(c,s,t+.98,{type:'sine',f0:110,f1:48,d:.22,v:.7,a:.005});
  }
  var PET_RARE=[{id:'grincement-porte',nom:'Pet grinçant (le grincement de la porte)',jouer:function(c,s,t){grincementPorte(c,s,t);}}];
  var P_PET_RARE=.2,dernierPetRare=false;
  var dernierDigestion={rot:-1,pet:-1};
  /* type : 'rot' ou 'pet' ; tirage au hasard, jamais le même deux fois de suite. */
  function jouerDigestion(type,ctx,sortie){
    /* Pet grinçant : de temps en temps (jamais deux fois de suite), ou forcé par le banc d'essai de la page Yggdrasil (window.__coffrePetForceIdleV1__, utilisé une seule fois). */
    if(type==='pet'){
      var force=window.__coffrePetForceIdleV1__===true;
      window.__coffrePetForceIdleV1__=false;
      if(force||(!dernierPetRare&&Math.random()<P_PET_RARE)){
        dernierPetRare=true;
        PET_RARE[0].jouer(ctx,sortie||ctx.destination,ctx.currentTime+.02);
        return PET_RARE[0];
      }
      dernierPetRare=false;
    }
    var cle=type==='pet'?'pet':'rot',liste=cle==='pet'?PETS:ROTS,n=liste.length,i=Math.floor(Math.random()*n);
    if(i===dernierDigestion[cle])i=(i+1+Math.floor(Math.random()*(n-1)))%n;
    dernierDigestion[cle]=i;
    liste[i].jouer(ctx,sortie||ctx.destination,ctx.currentTime+.02);
    return liste[i];
  }

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
  /*
   * Sommeil du Coffre (Norman, 2026-10-12) : il s'endort au hasard et RONFLE ; si on le touche pendant qu'il dort, il sursaute en lâchant un pet TRÈS fort.
   * Le pet de réveil est plus fort et plus long que les pets de digestion (une détonation sèche, puis une note grave qui s'effondre en trémolo et un souffle) ; trois variantes à choisir à l'écoute (REVEIL, `reveil`).
   * Le ronflement est une inspiration rauque qui monte, puis une expiration plus grave et vibrante, avec un petit sifflement du nez à la fin.
   */
  function detonation(ctx,s,t,v){
    souffle(ctx,s,t,{type:'lowpass',f0:1800,f1:140,d:.16,v:v,a:.002,q:1.5});
    ton(ctx,s,t,{type:'sine',f0:150,f1:48,d:.22,v:v*.9,a:.002});
  }
  var REVEIL=[
    {id:'reveil-tonnerre',nom:'Tonnerre',jouer:function(c,s,t){
      detonation(c,s,t,.5);
      ton(c,s,t+.02,{type:'sawtooth',f0:150,f1:42,d:1.15,v:.5,a:.012,vib:[46,26],filtre:['lowpass',520,3]});
      souffle(c,s,t+.02,{type:'bandpass',f0:300,f1:120,d:1.0,v:.34,q:1.6,a:.01});
      ton(c,s,t+.2,{type:'square',f0:92,f1:58,d:.9,v:.16,a:.02,vib:[63,14],filtre:['lowpass',300,2]});
    }},
    {id:'reveil-trompette',nom:'Trompette de combat',jouer:function(c,s,t){
      detonation(c,s,t,.46);
      ton(c,s,t+.02,{type:'square',f0:230,f1:120,d:.7,v:.55,a:.015,vib:[55,12],filtre:['bandpass',480,2.5]});
      ton(c,s,t+.02,{type:'sawtooth',f0:115,f1:58,d:.8,v:.4,a:.015,vib:[44,20],filtre:['lowpass',420,3]});
      souffle(c,s,t+.05,{type:'bandpass',f0:2400,f1:700,d:.5,v:.18,q:5,a:.02});
      ton(c,s,t+.74,{type:'sawtooth',f0:140,f1:60,d:.22,v:.34,a:.01,vib:[48,18],filtre:['lowpass',400,3]});
    }},
    {id:'reveil-rafale',nom:'Rafale',jouer:function(c,s,t){
      detonation(c,s,t,.5);
      pet(c,s,t+.04,.5,120,50,.5,[40,24]);
      pet(c,s,t+.6,.16,135,75,.42);
      pet(c,s,t+.82,.16,125,70,.42);
      pet(c,s,t+1.04,.4,110,44,.46,[52,28]);
    }}
  ];
  var RONFLEMENTS=[
    {id:'ronfle-classique',nom:'Ronflement classique',jouer:function(c,s,t){
      /* inspiration : souffle rauque qui monte, raclement grave par-dessus */
      souffle(c,s,t,{type:'bandpass',f0:220,f1:620,d:1.0,v:.2,q:2.2,a:.45});
      ton(c,s,t+.05,{type:'sawtooth',f0:62,f1:96,d:.95,v:.2,a:.4,vib:[27,16],filtre:['lowpass',380,3]});
      /* expiration : plus grave, vibrante, qui s'éteint */
      souffle(c,s,t+1.05,{type:'bandpass',f0:420,f1:150,d:1.25,v:.17,q:1.8,a:.3});
      ton(c,s,t+1.1,{type:'sawtooth',f0:88,f1:52,d:1.3,v:.22,a:.25,vib:[31,19],filtre:['lowpass',330,3]});
      /* petit sifflement du nez en fin de souffle */
      souffle(c,s,t+2.0,{type:'bandpass',f0:1900,f1:1300,d:.4,v:.045,q:9,a:.12});
    }},
    {id:'ronfle-scie',nom:'Ronflement de scie',jouer:function(c,s,t){
      ton(c,s,t,{type:'sawtooth',f0:55,f1:120,d:1.05,v:.24,a:.5,vib:[17,34],filtre:['lowpass',460,2.5]});
      souffle(c,s,t,{type:'lowpass',f0:500,f1:900,d:1.0,v:.16,q:1,a:.5});
      ton(c,s,t+1.1,{type:'sawtooth',f0:100,f1:44,d:1.4,v:.26,a:.2,vib:[23,26],filtre:['lowpass',360,3]});
      souffle(c,s,t+1.1,{type:'lowpass',f0:600,f1:160,d:1.2,v:.15,q:1,a:.25});
      ton(c,s,t+2.1,{type:'sine',f0:420,f1:300,d:.28,v:.04,a:.1,vib:[8,10]});
    }}
  ];
  /*
   * L'accident (Norman, 2026-10-15 : « un truc liquide avec des pets ») : un pet mouillé qui gargouille, des bulles qui éclatent, deux pets humides de plus, un clapotis et un « splotch » final. Environ 2,4 secondes.
   */
  function bulle(c,s,t,f,v){ton(c,s,t,{type:'sine',f0:f,f1:f*1.9,d:.07,v:v||.16,a:.004});}
  function petMouille(c,s,t,d,f0,f1,v){
    ton(c,s,t,{type:'sawtooth',f0:f0,f1:f1,d:d,v:v,a:.012,vib:[58,34],filtre:['lowpass',360,4]});
    souffle(c,s,t,{type:'bandpass',f0:340,f1:170,d:d*.95,v:v*.8,q:3,a:.01});
    for(var i=0;i<Math.floor(d/.05);i+=1)bulle(c,s,t+i*.05+Math.random()*.02,260+Math.random()*420,.07);
  }
  function clapotis(c,s,t,n){for(var i=0;i<n;i+=1)ton(c,s,t+i*.07+Math.random()*.03,{type:'sine',f0:520+Math.random()*500,f1:180,d:.09,v:.1,a:.004});}
  var ACCIDENT={id:'accident',nom:'Accident liquide',jouer:function(c,s,t){
    petMouille(c,s,t,.55,118,52,.3);
    clapotis(c,s,t+.5,4);
    petMouille(c,s,t+.85,.3,140,70,.26);
    souffle(c,s,t+1.0,{type:'lowpass',f0:700,f1:200,d:.5,v:.2,q:2,a:.05});
    petMouille(c,s,t+1.3,.38,105,48,.3);
    clapotis(c,s,t+1.65,6);
    ton(c,s,t+1.95,{type:'sine',f0:210,f1:55,d:.28,v:.34,a:.006});
    souffle(c,s,t+1.95,{type:'lowpass',f0:1500,f1:180,d:.3,v:.34,q:2,a:.004});
    bulle(c,s,t+2.3,300,.1);
  }};
  /*
   * Bruits de diarrhée à choisir (Norman, 2026-10-15 : « propose-moi des bruits de diarrhée, plusieurs, et je te dirai lesquels mettre ») : huit variantes synthétisées, écoutables dans Réglages (section de développement).
   */
  function rafale(c,s,t,n,pas,f0,v){for(var i=0;i<n;i+=1){var tt=t+i*pas;ton(c,s,tt,{type:'sawtooth',f0:f0*(1-i*.05),f1:f0*(.55-i*.03),d:pas*.9,v:v,a:.008,vib:[64,30],filtre:['lowpass',380,4]});souffle(c,s,tt,{type:'bandpass',f0:380,f1:200,d:pas*.85,v:v*.9,q:3,a:.006});}}
  var DIARRHEES=[
    {id:'jet',nom:'Jet continu',jouer:function(c,s,t){
      souffle(c,s,t,{type:'lowpass',f0:1100,f1:260,d:1.5,v:.34,q:2,a:.04});
      ton(c,s,t,{type:'sawtooth',f0:96,f1:44,d:1.5,v:.26,a:.04,vib:[52,28],filtre:['lowpass',340,4]});
      for(var i=0;i<26;i+=1)bulle(c,s,t+.1+i*.055+Math.random()*.02,240+Math.random()*460,.07);
      clapotis(c,s,t+1.4,5);
    }},
    {id:'rafale',nom:'Rafale de pets humides',jouer:function(c,s,t){
      rafale(c,s,t,7,.17,150,.28);clapotis(c,s,t+1.2,4);ton(c,s,t+1.35,{type:'sine',f0:200,f1:60,d:.2,v:.22,a:.006});
    }},
    {id:'tuyau',nom:'Tuyau bouché qui cède',jouer:function(c,s,t){
      ton(c,s,t,{type:'sine',f0:210,f1:80,d:.9,v:.18,a:.05,vib:[19,24]});
      souffle(c,s,t,{type:'bandpass',f0:300,f1:700,d:.8,v:.2,q:3,a:.2});
      for(var i=0;i<18;i+=1)bulle(c,s,t+.1+i*.045,180+Math.random()*350,.09);
      souffle(c,s,t+.9,{type:'lowpass',f0:1500,f1:150,d:.9,v:.4,q:1.5,a:.02});
      ton(c,s,t+.9,{type:'sawtooth',f0:80,f1:40,d:.9,v:.28,a:.02,vib:[40,20],filtre:['lowpass',300,3]});
      clapotis(c,s,t+1.7,5);
    }},
    {id:'eclaboussures',nom:'Éclaboussures',jouer:function(c,s,t){
      for(var i=0;i<9;i+=1){var tt=t+i*.14+Math.random()*.05;souffle(c,s,tt,{type:'bandpass',f0:500+Math.random()*1100,f1:300,d:.1,v:.3,q:2,a:.004});ton(c,s,tt,{type:'sine',f0:140+Math.random()*80,f1:55,d:.1,v:.22,a:.004});}
      clapotis(c,s,t+1.1,6);
    }},
    {id:'trompette',nom:'Trompette mouillée',jouer:function(c,s,t){
      ton(c,s,t,{type:'square',f0:165,f1:110,d:.8,v:.4,a:.03,vib:[72,14],filtre:['bandpass',480,3]});
      souffle(c,s,t,{type:'bandpass',f0:320,d:.7,v:.14,q:2,a:.03});
      for(var i=0;i<10;i+=1)bulle(c,s,t+.2+i*.06,260+Math.random()*300,.07);
      petMouille(c,s,t+.95,.3,120,60,.26);clapotis(c,s,t+1.3,4);
    }},
    {id:'cuvette',nom:'Explosion de cuvette',jouer:function(c,s,t){
      souffle(c,s,t,{type:'lowpass',f0:1800,f1:140,d:.5,v:.5,q:2,a:.003});
      ton(c,s,t,{type:'sine',f0:150,f1:42,d:.55,v:.46,a:.004});
      petMouille(c,s,t+.1,.7,110,45,.3);
      clapotis(c,s,t+.9,8);bulle(c,s,t+1.6,280,.12);bulle(c,s,t+1.75,230,.1);
    }},
    {id:'ventre',nom:'Gargouillis puis lâcher',jouer:function(c,s,t){
      ton(c,s,t,{type:'sawtooth',f0:58,f1:74,d:.9,v:.16,a:.2,vib:[7,12],filtre:['lowpass',200,3]});
      for(var i=0;i<6;i+=1)ton(c,s,t+.1+i*.14,{type:'sine',f0:90+Math.random()*60,f1:180+Math.random()*100,d:.13,v:.14,a:.02});
      souffle(c,s,t+.95,{type:'lowpass',f0:1200,f1:200,d:.35,v:.3,q:1,a:.02});
      petMouille(c,s,t+1.0,.7,100,48,.3);clapotis(c,s,t+1.75,5);
    }},
    {id:'moteur',nom:'Bateau à moteur',jouer:function(c,s,t){
      for(var i=0;i<16;i+=1){var tt=t+i*.085;souffle(c,s,tt,{type:'bandpass',f0:420-i*10,f1:260-i*6,d:.07,v:.32,q:3,a:.004});ton(c,s,tt,{type:'sawtooth',f0:120-i*3,f1:70,d:.07,v:.2,a:.004,filtre:['lowpass',320,3]});}
      petMouille(c,s,t+1.4,.35,110,55,.26);clapotis(c,s,t+1.8,5);
    }}
  ];
  function jouerDiarrhee(ctx,sortie,index){
    var d=typeof index==='number'?DIARRHEES[index]:DIARRHEES.filter(function(x){return x.id===index;})[0]||DIARRHEES[0];
    d.jouer(ctx,sortie||ctx.destination,ctx.currentTime+.02);
    return d;
  }
  function jouerAccident(ctx,sortie){ACCIDENT.jouer(ctx,sortie||ctx.destination,ctx.currentTime+.02);return ACCIDENT;}
  var dernierReveil=-1,dernierRonfle=-1;
  function tirer(liste,dernier){var n=liste.length,i=Math.floor(Math.random()*n);if(i===dernier)i=(i+1+Math.floor(Math.random()*(n-1)))%n;return i;}
  /* index facultatif : on peut forcer une variante (page d'écoute, tests). */
  function jouerReveil(ctx,sortie,index){
    var i=typeof index==='number'?index:(dernierReveil=tirer(REVEIL,dernierReveil));
    REVEIL[i].jouer(ctx,sortie||ctx.destination,ctx.currentTime+.02);
    return REVEIL[i];
  }
  function jouerRonflement(ctx,sortie,index){
    var i=typeof index==='number'?index:(dernierRonfle=tirer(RONFLEMENTS,dernierRonfle));
    RONFLEMENTS[i].jouer(ctx,sortie||ctx.destination,ctx.currentTime+.02);
    return RONFLEMENTS[i];
  }
  window.__SOREAL_IDLE_AUDIO_COFFRE_V1__={avaler:AVALER,recracher:RECRACHER,rots:ROTS,pets:PETS,petRare:PET_RARE,reveil:REVEIL,ronflements:RONFLEMENTS,jouer:jouer,jouerAleatoire:jouerAleatoire,jouerDigestion:jouerDigestion,jouerReveil:jouerReveil,jouerAccident:jouerAccident,diarrhees:DIARRHEES,jouerDiarrhee:jouerDiarrhee,accident:ACCIDENT,jouerRonflement:jouerRonflement};
})();
