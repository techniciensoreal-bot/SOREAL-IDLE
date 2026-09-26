/*
 * SOREAL IDLE — Audio Effects V199
 *
 * Un seul AudioContext partagé + un seul ordonnanceur audio.
 * Garantie produit :
 * - jamais deux événements audio de jeu en même temps ;
 * - maximum 2 événements en attente ;
 * - un événement plus récent remplace le même groupe en attente ;
 * - les sons trop vieux sont jetés au lieu de créer une longue file.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_AUDIO_V199__)return;

  var ctx=null;
  var master=null;
  var actif=null;
  var file=[];
  var amorceWebView=false;

  var DEFINITIONS={
    fight:{group:"combat-start",priority:90,maxAgeMs:1600},
    bossAppear:{group:"combat-boss",priority:75,maxAgeMs:2200},
    victory:{group:"combat-end",priority:105,maxAgeMs:2200},
    nuke:{group:"combat-action",priority:110,maxAgeMs:1200},
    defeat:{group:"combat-end",priority:100,maxAgeMs:2800},
    flee:{group:"combat-end",priority:95,maxAgeMs:2400},
    btPlus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    btMinus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    btCap:{group:"bt-adjust",priority:28,maxAgeMs:450},
    menuUnlock:{group:"menu-unlock",priority:85,maxAgeMs:3000},
    purchase:{group:"purchase",priority:30,maxAgeMs:900},
    achievement:{group:"achievement",priority:88,maxAgeMs:3500},
    chestOpen:{group:"chest",priority:35,maxAgeMs:1000},
    chestClose:{group:"chest",priority:35,maxAgeMs:1000},
    mergeArmor:{group:"inventory-merge",priority:45,maxAgeMs:1100},
    mergeAccessory:{group:"inventory-merge",priority:48,maxAgeMs:1100},
    mergeWeapon:{group:"inventory-merge",priority:50,maxAgeMs:1100},
    uiClick:{group:"ui-click",priority:15,maxAgeMs:180},
    boostPower:{group:"inventory-boost",priority:55,maxAgeMs:1100},
    boostToughness:{group:"inventory-boost",priority:55,maxAgeMs:1100},
    boostSpecial:{group:"inventory-boost",priority:60,maxAgeMs:1100}
  };

  function contexte_(){
    if(ctx&&ctx.state!=="closed")return ctx;
    var AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return null;
    try{
      ctx=new AudioCtx();
      master=ctx.createGain();
      master.gain.value=.78;
      master.connect(ctx.destination);
      return ctx;
    }catch(_){
      ctx=null;
      master=null;
      return null;
    }
  }

  function amorcerAudioDepuisGeste_(){
    var c=contexte_();
    if(!c)return Promise.resolve(null);

    /*
     * Android WebView / WKWebView : resume() seul peut rester muet dans
     * une iframe cross-origin. Démarrer un BufferSource silencieux pendant
     * le geste utilisateur force réellement l'activation de la sortie audio.
     */
    if(!amorceWebView){
      try{
        var buffer=c.createBuffer(
          1,
          1,
          Math.max(8000,Number(c.sampleRate)||44100)
        );
        var source=c.createBufferSource();
        var gain=c.createGain();
        source.buffer=buffer;
        gain.gain.setValueAtTime(.000001,c.currentTime||0);
        source.connect(gain);
        gain.connect(master||c.destination);
        source.start(0);
        if(typeof source.stop==="function"){
          source.stop((c.currentTime||0)+.01);
        }
        amorceWebView=true;
      }catch(_){}
    }

    try{
      if(c.state==="suspended"){
        return Promise.resolve(c.resume())
          .then(function(){return c;})
          .catch(function(){return c;});
      }
    }catch(_){}

    return Promise.resolve(c);
  }

  function reveiller_(){
    var c=contexte_();
    if(!c)return Promise.resolve(null);
    try{
      if(c.state==="suspended"){
        return Promise.resolve(c.resume())
          .then(function(){return c;})
          .catch(function(){return c;});
      }
    }catch(_){}
    return Promise.resolve(c);
  }

  function attendre_(ms){
    return new Promise(function(resolve){
      setTimeout(resolve,Math.max(0,Number(ms)||0));
    });
  }

  function gainEnv_(c,start,attack,duration,volume,destination){
    var g=c.createGain();
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(
      Math.max(.0002,Number(volume)||.05),
      start+Math.max(.004,Number(attack)||.01)
    );
    g.gain.exponentialRampToValueAtTime(
      .0001,
      start+Math.max(.03,Number(duration)||.2)
    );
    g.connect(destination||master||c.destination);
    return g;
  }

  function tonal_(c,options){
    options=options||{};
    var start=c.currentTime+Math.max(0,Number(options.delay)||0);
    var duree=Math.max(.03,Number(options.duration)||.2);
    var osc=c.createOscillator();
    var g=gainEnv_(
      c,start,
      Math.min(.025,duree*.15),
      duree,
      Number(options.volume)||.06,
      options.destination
    );
    osc.type=options.type||"sine";
    osc.frequency.setValueAtTime(Math.max(20,Number(options.from)||220),start);
    if(options.to&&Number(options.to)>0){
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20,Number(options.to)),
        start+duree
      );
    }
    if(options.detune){
      osc.detune.setValueAtTime(Number(options.detune)||0,start);
    }
    osc.connect(g);
    osc.start(start);
    osc.stop(start+duree+.04);
  }

  function bruit_(c,options){
    options=options||{};
    var start=c.currentTime+Math.max(0,Number(options.delay)||0);
    var duree=Math.max(.03,Number(options.duration)||.2);
    var frames=Math.max(1,Math.floor(c.sampleRate*duree));
    var buffer=c.createBuffer(1,frames,c.sampleRate);
    var data=buffer.getChannelData(0);
    var decay=Math.max(.2,Number(options.decay)||2.2);

    for(var i=0;i<frames;i+=1){
      var t=i/frames;
      data[i]=(Math.random()*2-1)*Math.pow(1-t,decay);
    }

    var src=c.createBufferSource();
    src.buffer=buffer;

    var filter=c.createBiquadFilter();
    filter.type=options.filterType||"lowpass";
    filter.frequency.setValueAtTime(
      Math.max(40,Number(options.frequency)||700),
      start
    );
    if(options.q!=null)filter.Q.setValueAtTime(Math.max(.01,Number(options.q)||1),start);
    if(options.frequencyEnd){
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(40,Number(options.frequencyEnd)),
        start+duree
      );
    }

    var g=gainEnv_(
      c,start,.008,duree,
      Number(options.volume)||.07,
      options.destination
    );
    src.connect(filter);
    filter.connect(g);
    src.start(start);
  }

  function jouerWebAudio_(durationMs,build){
    return reveiller_().then(function(c){
      if(!c)return attendre_(Math.min(120,Math.max(30,durationMs||80)));
      try{build(c);}catch(_){}
      return attendre_(durationMs);
    });
  }

  function voixFight_(){
    /*
     * V210 — même son sur ordinateur et téléphone. La version desktop
     * ajoutait encore une annonce vocale au petit impact WebAudio,
     * alors que les WebView mobiles ne jouaient que l'impact court.
     * La voix est retirée : un seul cue synthétique, identique partout.
     */
    return jouerWebAudio_(310,function(c){
      tonal_(c,{type:"sawtooth",from:86,to:44,duration:.24,volume:.070});
      tonal_(c,{type:"sine",from:58,to:34,duration:.29,volume:.105,delay:.01});
      bruit_(c,{
        duration:.13,volume:.034,delay:.015,
        filterType:"lowpass",frequency:760,frequencyEnd:130,decay:2.5
      });
    });
  }

  function gongBoss_(){
    return jouerWebAudio_(1750,function(c){
      /*
       * V203 — plus de gong. Court sting d'horreur synthétique :
       * bourdon sub-grave dissonant, battements très proches, note
       * descendante et souffle filtré. Les fréquences volontairement
       * désaccordées créent une tension sans embarquer le moindre MP3.
       */
      tonal_(c,{type:"sine",from:48,to:41,duration:1.68,volume:.105});
      tonal_(c,{type:"sine",from:51,to:44,duration:1.62,volume:.070,delay:.025});
      tonal_(c,{type:"triangle",from:76,to:69,duration:1.38,volume:.052,delay:.08});
      tonal_(c,{type:"sawtooth",from:214,to:82,duration:1.26,volume:.024,delay:.12});
      tonal_(c,{type:"sine",from:311,to:147,duration:.92,volume:.019,delay:.24});
      bruit_(c,{
        duration:1.18,volume:.033,delay:.10,
        filterType:"bandpass",frequency:1850,frequencyEnd:290,q:1.15,decay:1.45
      });
      bruit_(c,{
        duration:.44,volume:.050,delay:.88,
        filterType:"lowpass",frequency:430,frequencyEnd:72,q:.55,decay:2.5
      });
    });
  }

  function victoireBoss_(){
    return jouerWebAudio_(980,function(c){
      /*
       * V206 — fanfare originale très courte : sensation "coffre/victoire"
       * sans reprendre de mélodie existante. Quatre notes ascendantes,
       * accord final et éclat cristallin.
       */
      [
        [392,.18,.052,0],
        [494,.18,.052,.13],
        [587,.20,.055,.26],
        [784,.42,.070,.40]
      ].forEach(function(p){
        tonal_(c,{type:"triangle",from:p[0],to:p[0]*1.008,duration:p[1],volume:p[2],delay:p[3]});
      });
      tonal_(c,{type:"sine",from:988,to:1047,duration:.38,volume:.034,delay:.44});
      tonal_(c,{type:"sine",from:1175,to:1319,duration:.30,volume:.023,delay:.50});
      bruit_(c,{
        duration:.16,volume:.018,delay:.47,
        filterType:"highpass",frequency:5200,frequencyEnd:7600,decay:2.8
      });
    });
  }

  function nuke_(){
    return jouerWebAudio_(920,function(c){
      /*
       * Charge nucléaire : montée électronique très rapide, sifflement,
       * impact sub-grave puis souffle court. Un seul événement scheduler.
       */
      tonal_(c,{type:"sawtooth",from:95,to:920,duration:.38,volume:.040});
      tonal_(c,{type:"square",from:180,to:1400,duration:.31,volume:.018,delay:.06});
      tonal_(c,{type:"sine",from:86,to:38,duration:.48,volume:.150,delay:.35});
      bruit_(c,{
        duration:.40,volume:.105,delay:.34,
        filterType:"lowpass",frequency:2100,frequencyEnd:95,decay:2.5
      });
      bruit_(c,{
        duration:.16,volume:.050,delay:.27,
        filterType:"highpass",frequency:3600,frequencyEnd:7400,decay:1.8
      });
    });
  }

  function defaite_(){
    return jouerWebAudio_(920,function(c){
      tonal_(c,{type:"sawtooth",from:350,to:92,duration:.62,volume:.062});
      tonal_(c,{type:"triangle",from:205,to:60,duration:.78,volume:.082,delay:.055});
      tonal_(c,{type:"sine",from:86,to:43,duration:.54,volume:.105,delay:.19});
      bruit_(c,{
        duration:.42,volume:.066,
        frequency:600,frequencyEnd:85,decay:2.2,delay:.10
      });
    });
  }

  /*
   * Fuite (Norman, 2026-09-26 : « un son de lose qui représente la fuite ») : petit « wah-wah-wah-waaah » qui descend, sur un timbre de cuivre
   * un peu ridicule (triangle + sinus), sans rien de commun avec la défaite grave ni avec la fanfare de victoire.
   */
  function fuite_(){
    return jouerWebAudio_(1150,function(c){
      [
        [392,370,.20,.062,0],
        [349,330,.20,.062,.24],
        [311,294,.20,.062,.48],
        [262,196,.55,.070,.72]
      ].forEach(function(p){
        tonal_(c,{type:"triangle",from:p[0],to:p[1],duration:p[2],volume:p[3],delay:p[4]});
        tonal_(c,{type:"sine",from:p[0]*.5,to:p[1]*.5,duration:p[2],volume:p[3]*.55,delay:p[4]});
      });
      /* le dernier « waaah » glisse vers le bas avec un léger tremblement */
      tonal_(c,{type:"sine",from:196,to:150,duration:.42,volume:.030,delay:.95});
    });
  }

  /*
   * Nouveau menu débloqué (Norman, 2026-09-26 : « un petit bruit de victoire, pas le même que pour les boss ») : un éclat de clochettes aigu qui monte
   * (do-mi-sol-do en haut du clavier), très court, sans la fanfare des boss.
   */
  function menuDebloque_(){
    return jouerWebAudio_(760,function(c){
      [
        [1047,.16,.040,0],
        [1319,.16,.040,.09],
        [1568,.18,.042,.18],
        [2093,.34,.046,.29]
      ].forEach(function(p){
        tonal_(c,{type:"sine",from:p[0],to:p[0]*1.002,duration:p[1],volume:p[2],delay:p[3]});
        tonal_(c,{type:"triangle",from:p[0]*2,to:p[0]*2,duration:p[1]*.6,volume:p[2]*.28,delay:p[3]});
      });
      bruit_(c,{
        duration:.22,volume:.014,delay:.30,
        filterType:"highpass",frequency:6200,frequencyEnd:9000,decay:2.4
      });
    });
  }

  /*
   * Achat (Norman, 2026-09-26) : « un bruit de caisse enregistreuse quand on effectue un achat ». Un « clac » sec de tiroir-caisse, puis le « ding » à deux
   * notes de la clochette (partiels métalliques), et un petit tintement de pièces.
   */
  function caisse_(){
    return jouerWebAudio_(950,function(c){
      bruit_(c,{duration:.06,volume:.052,delay:0,filterType:"bandpass",frequency:1900,frequencyEnd:900,q:1.3,decay:3});
      tonal_(c,{type:"square",from:160,to:78,duration:.07,volume:.030});
      [[1976,.46,.050,.10],[2637,.62,.056,.18]].forEach(function(p){
        tonal_(c,{type:"sine",from:p[0],to:p[0]*1.001,duration:p[1],volume:p[2],delay:p[3]});
        tonal_(c,{type:"sine",from:p[0]*2.76,to:p[0]*2.76,duration:p[1]*.45,volume:p[2]*.30,delay:p[3]});
        tonal_(c,{type:"triangle",from:p[0]*1.5,to:p[0]*1.5,duration:p[1]*.55,volume:p[2]*.16,delay:p[3]});
      });
      bruit_(c,{duration:.12,volume:.022,delay:.36,filterType:"highpass",frequency:6200,frequencyEnd:8800,decay:2.2});
      bruit_(c,{duration:.09,volume:.016,delay:.50,filterType:"highpass",frequency:7000,frequencyEnd:9500,decay:2.4});
    });
  }

  /* Succès débloqué : petite fanfare montante (trois notes en tierces) suivie d'un scintillement. */
  function succes_(){
    return jouerWebAudio_(1300,function(c){
      [[523,.30,.048,0],[659,.30,.048,.14],[784,.32,.050,.28],[1047,.62,.056,.44]].forEach(function(p){
        tonal_(c,{type:"triangle",from:p[0],to:p[0]*1.003,duration:p[1],volume:p[2],delay:p[3]});
        tonal_(c,{type:"sine",from:p[0]*2,to:p[0]*2,duration:p[1]*.6,volume:p[2]*.30,delay:p[3]});
      });
      [[2093,.30,.020,.60],[2637,.30,.018,.68],[3136,.36,.016,.76]].forEach(function(p){
        tonal_(c,{type:"sine",from:p[0],to:p[0],duration:p[1],volume:p[2],delay:p[3]});
      });
      bruit_(c,{duration:.26,volume:.012,delay:.60,filterType:"highpass",frequency:6800,frequencyEnd:9500,decay:2.4});
    });
  }

  /*
   * Basic Training (Norman, 2026-09-26) : trois sons pour +, − et Cap, chacun en rapport avec ce qu'il fait.
   *   +   : on ajoute de l'énergie -> petit « bloup » qui monte, brillant ;
   *   −   : on la retire            -> petit « bloup » qui redescend, plus mat ;
   *   Cap : on remplit jusqu'au plafond -> une charge qui monte en puissance, puis un « ding » de plein.
   */
  function btPlus_(){
    return jouerWebAudio_(220,function(c){
      tonal_(c,{type:"triangle",from:440,to:660,duration:.08,volume:.052});
      tonal_(c,{type:"triangle",from:660,to:990,duration:.10,volume:.048,delay:.06});
      tonal_(c,{type:"sine",from:1320,to:1480,duration:.08,volume:.018,delay:.10});
    });
  }

  function btMoins_(){
    return jouerWebAudio_(220,function(c){
      tonal_(c,{type:"triangle",from:620,to:390,duration:.09,volume:.048});
      tonal_(c,{type:"sine",from:390,to:230,duration:.12,volume:.050,delay:.06});
    });
  }

  function btCap_(){
    return jouerWebAudio_(560,function(c){
      tonal_(c,{type:"sawtooth",from:180,to:900,duration:.26,volume:.034});
      tonal_(c,{type:"square",from:360,to:1400,duration:.22,volume:.012,delay:.04});
      tonal_(c,{type:"sine",from:1568,to:1568,duration:.30,volume:.046,delay:.27});
      tonal_(c,{type:"triangle",from:2093,to:2093,duration:.20,volume:.020,delay:.29});
      bruit_(c,{
        duration:.14,volume:.014,delay:.28,
        filterType:"highpass",frequency:6000,frequencyEnd:9000,decay:2.4
      });
    });
  }

  function coffreOuverture_(){
    return jouerWebAudio_(470,function(c){
      bruit_(c,{
        duration:.38,volume:.105,
        frequency:980,frequencyEnd:250,decay:2.3
      });
      tonal_(c,{type:"triangle",from:142,to:255,duration:.26,volume:.040,delay:.03});
      tonal_(c,{type:"sine",from:325,to:445,duration:.18,volume:.020,delay:.13});
    });
  }

  function coffreFermeture_(){
    return jouerWebAudio_(410,function(c){
      tonal_(c,{type:"triangle",from:255,to:112,duration:.20,volume:.050});
      bruit_(c,{
        duration:.25,volume:.095,
        frequency:590,frequencyEnd:115,decay:3.0,delay:.035
      });
      tonal_(c,{type:"sine",from:108,to:68,duration:.14,volume:.108,delay:.16});
    });
  }

  function fusionArmure_(){
    return jouerWebAudio_(430,function(c){
      // Froissement textile : deux balayages de bruit doux et rapprochés.
      bruit_(c,{
        duration:.20,volume:.065,
        filterType:"bandpass",frequency:1850,frequencyEnd:950,q:.55,decay:1.35
      });
      bruit_(c,{
        duration:.17,volume:.055,delay:.10,
        filterType:"bandpass",frequency:2700,frequencyEnd:1250,q:.65,decay:1.45
      });
      tonal_(c,{type:"sine",from:165,to:135,duration:.13,volume:.018,delay:.16});
    });
  }

  function fusionAccessoire_(){
    return jouerWebAudio_(470,function(c){
      // Accessoire/bijou : petit tintement clair, distinct du métal lourd des armes.
      tonal_(c,{type:"sine",from:880,to:905,duration:.34,volume:.043});
      tonal_(c,{type:"sine",from:1320,to:1360,duration:.28,volume:.030,delay:.025});
      tonal_(c,{type:"triangle",from:1760,to:1810,duration:.19,volume:.018,delay:.055});
      bruit_(c,{
        duration:.07,volume:.018,delay:.01,
        filterType:"highpass",frequency:4200,frequencyEnd:6200,decay:3.2
      });
    });
  }

  function clicInterface_(){
    return jouerWebAudio_(70,function(c){
      /*
       * Même caractère que le clic global de SOREAL APP : bruit blanc
       * filtré très bref, façon petit bouton mécanique.
       */
      bruit_(c,{
        duration:.035,
        volume:.090,
        filterType:"bandpass",
        frequency:1800,
        frequencyEnd:1700,
        q:1.1,
        decay:3.2
      });
    });
  }

  function fusionArme_(){
    return jouerWebAudio_(620,function(c){
      // Marteau + enclume : impact grave puis résonances métalliques.
      bruit_(c,{
        duration:.075,volume:.12,
        filterType:"highpass",frequency:1200,frequencyEnd:650,decay:4
      });
      tonal_(c,{type:"sine",from:88,to:72,duration:.18,volume:.115});
      tonal_(c,{type:"triangle",from:540,to:525,duration:.52,volume:.052,delay:.018});
      tonal_(c,{type:"sine",from:875,to:850,duration:.42,volume:.033,delay:.02});
      tonal_(c,{type:"sine",from:1290,to:1250,duration:.32,volume:.019,delay:.024});
      bruit_(c,{
        duration:.055,volume:.055,delay:.19,
        filterType:"highpass",frequency:1800,frequencyEnd:900,decay:4
      });
    });
  }

  function boostPower_(){
    return jouerWebAudio_(560,function(c){
      // Charge agressive montante, électrique.
      tonal_(c,{type:"sawtooth",from:120,to:640,duration:.42,volume:.045});
      tonal_(c,{type:"square",from:240,to:980,duration:.28,volume:.020,delay:.08});
      bruit_(c,{
        duration:.20,volume:.050,delay:.19,
        filterType:"highpass",frequency:2200,frequencyEnd:5200,decay:1.2
      });
      tonal_(c,{type:"sine",from:760,to:1040,duration:.14,volume:.048,delay:.36});
    });
  }

  function boostToughness_(){
    return jouerWebAudio_(610,function(c){
      // Masse / bouclier : choc très grave puis anneau métallique stable.
      tonal_(c,{type:"sine",from:95,to:54,duration:.34,volume:.135});
      bruit_(c,{
        duration:.11,volume:.090,
        filterType:"lowpass",frequency:480,frequencyEnd:120,decay:3.5
      });
      tonal_(c,{type:"triangle",from:310,to:295,duration:.52,volume:.043,delay:.055});
      tonal_(c,{type:"sine",from:620,to:605,duration:.40,volume:.022,delay:.07});
    });
  }

  function boostSpecial_(){
    return jouerWebAudio_(690,function(c){
      // Effet "étrange" : éclat cristallin ascendant + petite retombée.
      [
        [392,523,.22,.034,0],
        [523,784,.25,.034,.08],
        [659,1047,.28,.032,.16],
        [988,1319,.32,.025,.23]
      ].forEach(function(p){
        tonal_(c,{
          type:"sine",from:p[0],to:p[1],
          duration:p[2],volume:p[3],delay:p[4]
        });
      });
      bruit_(c,{
        duration:.18,volume:.024,delay:.19,
        filterType:"bandpass",frequency:4200,frequencyEnd:6500,q:1.1,decay:1.8
      });
      tonal_(c,{type:"triangle",from:880,to:440,duration:.20,volume:.020,delay:.43});
    });
  }

  var JOUEURS={
    fight:voixFight_,
    bossAppear:gongBoss_,
    victory:victoireBoss_,
    nuke:nuke_,
    defeat:defaite_,
    flee:fuite_,
    btPlus:btPlus_,
    btMinus:btMoins_,
    btCap:btCap_,
    menuUnlock:menuDebloque_,
    purchase:caisse_,
    achievement:succes_,
    chestOpen:coffreOuverture_,
    chestClose:coffreFermeture_,
    mergeArmor:fusionArmure_,
    mergeAccessory:fusionAccessoire_,
    mergeWeapon:fusionArme_,
    uiClick:clicInterface_,
    boostPower:boostPower_,
    boostToughness:boostToughness_,
    boostSpecial:boostSpecial_
  };

  function retirerPerimes_(){
    var now=Date.now();
    file=file.filter(function(cue){
      var def=DEFINITIONS[cue.name];
      return def&&now-cue.createdAt<=def.maxAgeMs;
    });
  }

  function choisirASupprimer_(){
    if(file.length<=2)return -1;
    var index=0;
    for(var i=1;i<file.length;i+=1){
      var a=DEFINITIONS[file[index].name]||{priority:0};
      var b=DEFINITIONS[file[i].name]||{priority:0};
      if(b.priority<a.priority){
        index=i;
      }else if(b.priority===a.priority&&file[i].createdAt<file[index].createdAt){
        index=i;
      }
    }
    return index;
  }

  function limiterFile_(){
    retirerPerimes_();
    while(file.length>2){
      var idx=choisirASupprimer_();
      if(idx<0)idx=0;
      file.splice(idx,1);
    }
  }

  function suivant_(){
    if(actif)return;
    retirerPerimes_();

    var cue=file.shift();
    if(!cue)return;

    var def=DEFINITIONS[cue.name];
    var fn=JOUEURS[cue.name];
    if(!def||typeof fn!=="function"){
      setTimeout(suivant_,0);
      return;
    }

    if(Date.now()-cue.createdAt>def.maxAgeMs){
      setTimeout(suivant_,0);
      return;
    }

    actif=cue;

    Promise.resolve()
      .then(fn)
      .catch(function(){})
      .then(function(){
        if(actif===cue)actif=null;
        suivant_();
      });
  }

  function demander_(name){
    name=String(name||"");
    var def=DEFINITIONS[name];
    if(!def||typeof JOUEURS[name]!=="function")return false;

    var cue={
      name:name,
      group:def.group,
      createdAt:Date.now()
    };

    /*
     * Même famille déjà en attente : garder uniquement la demande la plus
     * récente (ex. coffre ouvert/fermé/ouvert rapidement).
     */
    file=file.filter(function(existing){
      return existing.group!==cue.group;
    });
    file.push(cue);
    limiterFile_();
    suivant_();
    return true;
  }

  function debloquer_(){
    amorcerAudioDepuisGeste_();
  }

  document.addEventListener("pointerdown",debloquer_,{capture:true,passive:true});
  document.addEventListener("touchstart",debloquer_,{capture:true,passive:true});
  document.addEventListener("click",debloquer_,{capture:true,passive:true});

  window.__SOREAL_IDLE_AUDIO_V199__={
    unlock:debloquer_,
    play:demander_,
    fight:function(){return demander_("fight");},
    bossAppear:function(){return demander_("bossAppear");},
    victory:function(){return demander_("victory");},
    nuke:function(){return demander_("nuke");},
    defeat:function(){return demander_("defeat");},
    flee:function(){return demander_("flee");},
    btPlus:function(){return demander_("btPlus");},
    btMinus:function(){return demander_("btMinus");},
    btCap:function(){return demander_("btCap");},
    menuUnlock:function(){return demander_("menuUnlock");},
    purchase:function(){return demander_("purchase");},
    achievement:function(){return demander_("achievement");},
    chestOpen:function(){return demander_("chestOpen");},
    chestClose:function(){return demander_("chestClose");},
    mergeArmor:function(){return demander_("mergeArmor");},
    mergeAccessory:function(){return demander_("mergeAccessory");},
    mergeWeapon:function(){return demander_("mergeWeapon");},
    uiClick:function(){return demander_("uiClick");},
    boostPower:function(){return demander_("boostPower");},
    boostToughness:function(){return demander_("boostToughness");},
    boostSpecial:function(){return demander_("boostSpecial");},
    debugState:function(){
      return {
        active:actif?actif.name:"",
        pending:file.map(function(x){return x.name;})
      };
    }
  };
})();
