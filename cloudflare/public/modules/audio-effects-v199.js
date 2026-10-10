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
    bossAppear:{group:"combat-boss",priority:75,maxAgeMs:2400},
    timeMachine:{group:"rebirth",priority:100,maxAgeMs:3500},
    victory:{group:"combat-end",priority:105,maxAgeMs:2200},
    nuke:{group:"combat-action",priority:110,maxAgeMs:1200},
    defeat:{group:"combat-end",priority:100,maxAgeMs:2800},
    flee:{group:"combat-end",priority:95,maxAgeMs:2400},
    btPlus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    btMinus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    btCap:{group:"bt-adjust",priority:28,maxAgeMs:450},
    tmPlus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    tmMinus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    tmCap:{group:"bt-adjust",priority:28,maxAgeMs:450},
    bloodPlus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    bloodMinus:{group:"bt-adjust",priority:25,maxAgeMs:350},
    bloodCap:{group:"bt-adjust",priority:28,maxAgeMs:450},
    menuUnlock:{group:"menu-unlock",priority:85,maxAgeMs:3000},
    purchase:{group:"purchase",priority:30,maxAgeMs:900},
    purchaseGold:{group:"purchase",priority:30,maxAgeMs:1000},
    equip:{group:"inventory-equip",priority:52,maxAgeMs:700},
    purchaseGem:{group:"purchase",priority:30,maxAgeMs:1300},
    menuNav:{group:"ui-nav",priority:20,maxAgeMs:400},
    /* Entrée dans le Shop (Norman, 2026-10-03) : clochettes au-dessus de la porte d'un vieux magasin. Même groupe que menuNav : il le remplace pour ce menu. */
    shopDoor:{group:"ui-nav",priority:24,maxAgeMs:600},
    /* Passage d'un rayon à l'autre dans une boutique (Norman, 2026-10-03) : trois pas. Groupe à part ; l'ordonnanceur ne joue jamais deux sons à la fois, donc deux changements rapides ne se chevauchent pas. */
    shopSteps:{group:"shop-steps",priority:22,maxAgeMs:900},
    achievement:{group:"achievement",priority:88,maxAgeMs:3500},
    /* Un autre joueur vient de se connecter (fil « En direct », Norman 2026-10-02) : petit carillon discret. */
    joueurConnecte:{group:"presence",priority:18,maxAgeMs:2500},
    chestOpen:{group:"chest",priority:35,maxAgeMs:1000},
    chestClose:{group:"chest",priority:35,maxAgeMs:1000},
    mergeArmor:{group:"inventory-merge",priority:45,maxAgeMs:1100},
    mergeAccessory:{group:"inventory-merge",priority:48,maxAgeMs:1100},
    mergeWeapon:{group:"inventory-merge",priority:50,maxAgeMs:1100},
    uiClick:{group:"ui-click",priority:15,maxAgeMs:180},
    boostPower:{group:"inventory-boost",priority:55,maxAgeMs:1100},
    boostToughness:{group:"inventory-boost",priority:55,maxAgeMs:1100},
    boostSpecial:{group:"inventory-boost",priority:60,maxAgeMs:1100},
    /*
     * Absorption de TOUS les boosts possibles d'un coup (2026-09-27, Norman : « Quand un objet
     * absorbe tous les boosts possible, il faut un son spécial pour cette action. ») -- « A + clic »
     * (PC) ou double tap (mobile) sur une pièce équipée, ou sur le Cube de l'infini. Priorité plus
     * haute que boostPower/Toughness/Special (même groupe : peut les interrompre) puisque c'est un
     * événement plus gros, pas une simple absorption individuelle.
     */
    boostAllAbsorption:{group:"inventory-boost",priority:65,maxAgeMs:1500},
    /*
     * Norman (2026-09-27) : « Je veux un bruit qui indique qu'on a pas assez d'argent ou d'ap ou quoi que ce
     * soit pour effectuer un achat dans le jeu. » Groupe/priorité distincts de "purchase" (jamais l'un à la
     * place de l'autre dans la file : un achat soit réussit, soit est refusé, jamais les deux).
     */
    purchaseRefused:{group:"purchase-refused",priority:30,maxAgeMs:900},
    /*
     * Norman (2026-09-27) : « Quand on complete un set, je veux un son de victoire en même temps que la notification fade in
     * fade out apparait. » Groupe/priorité distincts de "menu-unlock" et "achievement" (pas le même déclencheur, jamais l'un à
     * la place de l'autre dans la file).
     */
    setComplete:{group:"set-complete",priority:82,maxAgeMs:3200},
    /*
     * Norman (2026-09-27) : « Quand on balance son argent dans le money pit, il n'y a pas de son. ni quand on
     * tourne la roue. ils doivent avoir leurs propres sons. » Groupes distincts (jamais l'un à la place de
     * l'autre dans la file).
     */
    moneyPit:{group:"money-pit",priority:60,maxAgeMs:2200},
    dailySpin:{group:"daily-spin",priority:60,maxAgeMs:3200}
  };

  /* Barre « Sons de l'interface » des Paramètres (modules/audio-volume-v1.js) : 75 % (le défaut) = l'ancien gain fixe de 0,78 ; 0 quand la case est décochée. */
  function gainMaitre_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    return r&&typeof r.getInterface==="function"?r.getInterface()*(.78/.75):.78;
  }
  if(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__&&typeof window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange==="function"){
    window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange(function(){if(master)master.gain.value=gainMaitre_();});
  }

  function contexte_(){
    if(ctx&&ctx.state!=="closed")return ctx;
    var AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return null;
    try{
      ctx=new AudioCtx();
      master=ctx.createGain();
      master.gain.value=gainMaitre_();
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

  /*
   * Début de combat (Norman, 2026-09-26 : « un truc plus en rapport avec le combat qui commence ») : deux lames qui s'entrechoquent (éclat métallique aigu), trois coups de
   * tambour de guerre qui montent en force, puis un court appel de cuivres. Même son sur ordinateur et téléphone, aucune voix (V210).
   */
  function voixFight_(){
    return jouerWebAudio_(950,function(c){
      /* les lames */
      [[1500,.030],[1500*2.76,.018],[1500*5.4,.010]].forEach(function(p,i){
        tonal_(c,{type:"sine",from:p[0],to:p[0]*.996,duration:.42-i*.08,volume:p[1]});
      });
      tonal_(c,{type:"square",from:2600,to:1900,duration:.09,volume:.014});
      bruit_(c,{duration:.13,volume:.060,filterType:"highpass",frequency:4500,decay:2.4});
      /* les tambours de guerre */
      [[.12,.100],[.36,.095],[.60,.140]].forEach(function(d){
        tonal_(c,{type:"sine",from:98,to:44,duration:.24,volume:d[1],delay:d[0]});
        bruit_(c,{duration:.10,volume:d[1]*.30,delay:d[0],filterType:"lowpass",frequency:420,decay:2.2});
      });
      /* l'appel de cuivres */
      nappe_(c,{type:"sawtooth",from:196,to:294,duration:.42,volume:.028,attack:.05,delay:.52});
      nappe_(c,{type:"sawtooth",from:392,to:588,duration:.42,volume:.014,attack:.06,delay:.52,detune:5});
    });
  }

  /*
   * Sons d'apparition des boss (Norman, 2026-09-26 : « fais-en 9 autres, tous différents, un différent à chaque boss ; quand ils ont tous été joués, on repart au
   * premier »). Dix sons, joués dans l'ordre à chaque nouveau boss ; le rang du prochain est mémorisé sur l'appareil (localStorage) pour que la suite continue
   * d'une visite à l'autre.
   */
  var CLE_GONG_BOSS="soreal_idle_boss_gong_index_v1";

  /* Nappe : comme tonal_, mais avec une attaque lente réglable et un vibrato (pour orgue, chœur, cor, rugissement). */
  function nappe_(c,o){
    var start=c.currentTime+Math.max(0,Number(o.delay)||0);
    var d=Math.max(.05,Number(o.duration)||1);
    var a=Math.min(d*.8,Math.max(.01,Number(o.attack)||.05));
    var osc=c.createOscillator();
    var g=c.createGain();
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,Number(o.volume)||.04),start+a);
    g.gain.exponentialRampToValueAtTime(.0001,start+d);
    osc.type=o.type||"sine";
    osc.frequency.setValueAtTime(Math.max(20,Number(o.from)||220),start);
    if(o.to&&Number(o.to)>0)osc.frequency.exponentialRampToValueAtTime(Math.max(20,Number(o.to)),start+d);
    if(o.detune)osc.detune.setValueAtTime(Number(o.detune)||0,start);
    if(o.vibRate){
      var lfo=c.createOscillator();
      var lg=c.createGain();
      lfo.frequency.setValueAtTime(Number(o.vibRate)||5,start);
      lg.gain.setValueAtTime(Number(o.vibDepth)||4,start);
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(start);
      lfo.stop(start+d+.05);
    }
    osc.connect(g);
    g.connect(master||c.destination);
    osc.start(start);
    osc.stop(start+d+.05);
  }

  /* Souffle qui MONTE (enveloppe inversée de bruit_) : montée de tension, aspiration. */
  function bruitMonte_(c,o){
    var start=c.currentTime+Math.max(0,Number(o.delay)||0);
    var d=Math.max(.05,Number(o.duration)||1);
    var frames=Math.max(1,Math.floor(c.sampleRate*d));
    var buffer=c.createBuffer(1,frames,c.sampleRate);
    var data=buffer.getChannelData(0);
    var pw=Math.max(.3,Number(o.pow)||2);
    for(var i=0;i<frames;i+=1){
      data[i]=(Math.random()*2-1)*Math.pow(i/frames,pw);
    }
    var src=c.createBufferSource();
    src.buffer=buffer;
    var filter=c.createBiquadFilter();
    filter.type=o.filterType||"bandpass";
    filter.frequency.setValueAtTime(Math.max(40,Number(o.frequency)||500),start);
    if(o.q!=null)filter.Q.setValueAtTime(Math.max(.01,Number(o.q)||1),start);
    if(o.frequencyEnd)filter.frequency.exponentialRampToValueAtTime(Math.max(40,Number(o.frequencyEnd)),start+d);
    var g=c.createGain();
    g.gain.setValueAtTime(Math.max(.0002,Number(o.volume)||.05),start);
    g.connect(master||c.destination);
    src.connect(filter);
    filter.connect(g);
    src.start(start);
  }

  function bossPsycho_(c){
    /*
     * 1. Psycho (Norman, 2026-09-26 : « un truc genre film d'horreur, à la Psycho » ; puis : « refais le 1 avec juste le son du début, pas les bruits derrière ») :
     * uniquement les quatre coups d'archet aigus et grinçants du début (violons désaccordés l'un contre l'autre), en rafale, le dernier tenu un instant. Le bourdon et la
     * comptine qui les accompagnaient forment le son 10 (boîte à musique).
     */
    [[1568,1760],[1661,1865],[1760,1976],[2093,2349]].forEach(function(p,i){
      var d=i*.115;
      var dernier=i===3;
      var duree=dernier?.42:.17;
      tonal_(c,{type:"sawtooth",from:p[0],to:p[1],duration:duree,volume:dernier?.058:.062,delay:d});
      tonal_(c,{type:"sawtooth",from:p[0]*1.012,to:p[1]*1.012,duration:duree,volume:dernier?.052:.056,delay:d});
      bruit_(c,{duration:.16,volume:.050,delay:d,filterType:"bandpass",frequency:3400,frequencyEnd:2300,q:2.2,decay:1.6});
    });
  }

  /* 2. Glas : trois coups de cloche funèbre, de plus en plus graves, sur un bourdon. */
  function bossGlas_(c){
    tonal_(c,{type:"sine",from:55,to:50,duration:2.2,volume:.040});
    [[196,0],[185,.65],[174,1.3]].forEach(function(b,i){
      var v=.050-i*.008;
      [[1,1,.9],[2.0,.5,.7],[2.76,.35,.5],[5.4,.2,.3],[8.93,.1,.2]].forEach(function(p){
        tonal_(c,{type:"sine",from:b[0]*p[0],to:b[0]*p[0]*.997,duration:.4+p[2]*.7,volume:v*p[1],delay:b[1]});
      });
      bruit_(c,{duration:.05,volume:.02,delay:b[1],filterType:"highpass",frequency:3000,decay:2.5});
    });
  }

  /* 3. Rugissement : grognement rauque (dents de scie modulées) et souffle grave. */
  function bossRugissement_(c){
    nappe_(c,{type:"sawtooth",from:78,to:52,duration:1.7,volume:.050,attack:.12,vibRate:26,vibDepth:16});
    nappe_(c,{type:"sawtooth",from:117,to:70,duration:1.6,volume:.030,attack:.15,delay:.05,vibRate:31,vibDepth:20});
    tonal_(c,{type:"sine",from:48,to:34,duration:1.9,volume:.060});
    bruit_(c,{duration:1.5,volume:.050,filterType:"bandpass",frequency:380,frequencyEnd:900,q:1.4,decay:.9});
    bruit_(c,{duration:.6,volume:.035,delay:1.2,filterType:"lowpass",frequency:500,frequencyEnd:120,decay:1.2});
  }

  /* 4. Cor de guerre : deux appels de cuivres, le second à la quinte. */
  function bossCor_(c){
    nappe_(c,{type:"sawtooth",from:110,to:112,duration:1.0,volume:0.053,attack:.18});
    nappe_(c,{type:"sawtooth",from:220,to:224,duration:1.0,volume:0.030,attack:.2,detune:6});
    nappe_(c,{type:"sawtooth",from:146,to:165,duration:1.2,volume:0.060,attack:.2,delay:1.0});
    nappe_(c,{type:"sawtooth",from:330,to:332,duration:1.2,volume:0.027,attack:.22,delay:1.0,detune:-6});
    nappe_(c,{type:"sine",from:82.5,to:82.5,duration:1.2,volume:0.045,attack:.2,delay:1.0});
    bruit_(c,{duration:2.0,volume:0.018,filterType:"bandpass",frequency:900,q:.8,decay:.5});
  }

  /* 5. Battements de cœur qui s'accélèrent, sur une montée de tension. */
  function bossCoeur_(c){
    [0,.16,.70,.86,1.30,1.44,1.80,1.92].forEach(function(t,i){
      var fort=i%2===0;
      tonal_(c,{type:"sine",from:70,to:38,duration:.18,volume:fort?.11:.08,delay:t});
      bruit_(c,{duration:.06,volume:fort?.04:.03,delay:t,filterType:"lowpass",frequency:300,decay:2});
    });
    nappe_(c,{type:"sine",from:180,to:1100,duration:2.0,volume:.012,attack:1.2,vibRate:6,vibDepth:8});
    nappe_(c,{type:"sawtooth",from:60,to:240,duration:2.0,volume:.010,attack:1.2});
  }

  /* 6. Orgue : accord mineur avec un triton, qui enfle puis s'éteint. */
  function bossOrgue_(c){
    [[110,.019],[130.8,.016],[155.6,.016],[220,.013]].forEach(function(n){
      nappe_(c,{type:"sawtooth",from:n[0],to:n[0],duration:2.2,volume:n[1],attack:.5,vibRate:5,vibDepth:1.2});
      nappe_(c,{type:"triangle",from:n[0]*2,to:n[0]*2,duration:2.2,volume:n[1]*.7,attack:.55,vibRate:5.3,vibDepth:1.5});
    });
    nappe_(c,{type:"sine",from:55,to:55,duration:2.2,volume:.065,attack:.4});
    nappe_(c,{type:"sine",from:311,to:311,duration:1.3,volume:.010,attack:.5,delay:.9,vibRate:6,vibDepth:2});
  }

  /* 7. Tonnerre : craquement sec puis grondement qui roule. */
  function bossTonnerre_(c){
    bruit_(c,{duration:.10,volume:.09,filterType:"highpass",frequency:2500,decay:2.5});
    bruit_(c,{duration:2.1,volume:.10,delay:.05,filterType:"lowpass",frequency:700,frequencyEnd:70,decay:1.1});
    bruit_(c,{duration:1.4,volume:.07,delay:.55,filterType:"lowpass",frequency:500,frequencyEnd:60,decay:1.3});
    tonal_(c,{type:"sine",from:42,to:30,duration:2.0,volume:.090,delay:.08});
  }

  /* 8. Sirène : quatre montées et descentes d'alarme, sur un grave. */
  function bossSirene_(c){
    [0,.55,1.1,1.65].forEach(function(t,i){
      var monte=i%2===0;
      tonal_(c,{type:"sawtooth",from:monte?380:900,to:monte?900:380,duration:.55,volume:.030,delay:t});
      tonal_(c,{type:"square",from:monte?190:450,to:monte?450:190,duration:.55,volume:.012,delay:t});
    });
    tonal_(c,{type:"sine",from:60,to:40,duration:2.1,volume:.05});
  }

  /* 9. Chœur fantôme : voix aiguës qui enflent en la mineur, avec un souffle. */
  function bossChoeur_(c){
    [[220,.030],[261.6,.026],[329.6,.024],[440,.012]].forEach(function(n,i){
      nappe_(c,{type:"sine",from:n[0],to:n[0],duration:2.2,volume:n[1],attack:.7,vibRate:5+i*.2,vibDepth:3});
      nappe_(c,{type:"sine",from:n[0],to:n[0],duration:2.2,volume:n[1]*.6,attack:.75,detune:7,vibRate:5.4+i*.2,vibDepth:3});
    });
    bruit_(c,{duration:2.1,volume:.012,filterType:"bandpass",frequency:1300,q:2.5,decay:.5});
    nappe_(c,{type:"sine",from:1760,to:1790,duration:1.3,volume:.006,attack:.5,delay:.8});
  }

  /*
   * 10. Boîte à musique (Norman, 2026-09-26 : le « Portail » donnait l'impression d'un secret débloqué ; les bruits qui accompagnaient le Psycho « peuvent servir pour
   * un boss à elles seules ») : un bourdon sub-grave qui gronde, et une petite comptine de boîte à musique en mi mineur, avec un si bémol qui grince, qui redescend et s'éteint.
   */
  function bossBoiteAMusique_(c){
    tonal_(c,{type:"sine",from:55,to:46,duration:2.10,volume:.070});
    tonal_(c,{type:"triangle",from:82,to:73,duration:1.70,volume:.030,delay:.06});
    [[659,.10],[784,.32],[988,.54],[932,.76],[880,.98],[740,1.20],[659,1.42]].forEach(function(n,i){
      var dur=i===6?.62:.42;
      tonal_(c,{type:"sine",from:n[0],to:n[0],duration:dur,volume:.030,delay:n[1]});
      tonal_(c,{type:"sine",from:n[0]*1.005,to:n[0]*1.005,duration:dur,volume:.018,delay:n[1]});
      tonal_(c,{type:"sine",from:n[0]*2.76,to:n[0]*2.76,duration:dur*.4,volume:.008,delay:n[1]});
    });
  }

  var SONS_BOSS=[
    {nom:"psycho",duree:900,construire:bossPsycho_},
    {nom:"glas",duree:2300,construire:bossGlas_},
    {nom:"rugissement",duree:2100,construire:bossRugissement_},
    {nom:"cor",duree:2300,construire:bossCor_},
    {nom:"coeur",duree:2200,construire:bossCoeur_},
    {nom:"orgue",duree:2300,construire:bossOrgue_},
    {nom:"tonnerre",duree:2300,construire:bossTonnerre_},
    {nom:"sirene",duree:2300,construire:bossSirene_},
    {nom:"choeur",duree:2300,construire:bossChoeur_},
    {nom:"boite-a-musique",duree:2300,construire:bossBoiteAMusique_}
  ];

  function rangGongBoss_(){
    try{
      var n=parseInt(localStorage.getItem(CLE_GONG_BOSS),10);
      if(isFinite(n)&&n>=0)return n%SONS_BOSS.length;
    }catch(_){}
    return 0;
  }

  function memoriserGongBoss_(rang){
    try{localStorage.setItem(CLE_GONG_BOSS,String((rang+1)%SONS_BOSS.length));}catch(_){}
  }

  var dernierSonBoss="";

  function gongBoss_(){
    var rang=rangGongBoss_();
    var son=SONS_BOSS[rang];
    dernierSonBoss=son.nom;
    memoriserGongBoss_(rang);
    return jouerWebAudio_(son.duree,son.construire);
  }

  /*
   * Rebirth (Norman, 2026-09-26) : « un bruit comme une machine à voyage dans le temps ». Un mécanisme qui s'emballe (ronronnement qui monte, engrenages qui
   * accélèrent, aspiration), puis le saut : déchirure, impact grave, et l'arrivée en douceur (carillon et petit clac).
   */
  function voyageTempsConstruire_(c){
    {
      nappe_(c,{type:"sawtooth",from:70,to:1500,duration:1.5,volume:.028,attack:.5,vibRate:12,vibDepth:40});
      nappe_(c,{type:"square",from:55,to:900,duration:1.5,volume:.012,attack:.5,delay:.1,vibRate:18,vibDepth:30});
      nappe_(c,{type:"sine",from:200,to:3000,duration:1.5,volume:.015,attack:.6,vibRate:22,vibDepth:120});
      var t=0;
      var dt=.17;
      while(t<1.4){
        bruit_(c,{duration:.035,volume:.03,delay:t,filterType:"highpass",frequency:2500,decay:3});
        tonal_(c,{type:"square",from:900,to:700,duration:.03,volume:.008,delay:t});
        t+=dt;
        dt=Math.max(.03,dt*.87);
      }
      bruitMonte_(c,{duration:1.4,volume:.07,delay:.1,filterType:"bandpass",frequency:400,frequencyEnd:7000,q:.8,pow:2.2});
      [1.15,1.25,1.33,1.40].forEach(function(d){
        bruit_(c,{duration:.03,volume:.03,delay:d,filterType:"highpass",frequency:5000,decay:2});
      });
      tonal_(c,{type:"sine",from:2600,to:50,duration:.55,volume:.05,delay:1.5});
      tonal_(c,{type:"sawtooth",from:1200,to:40,duration:.5,volume:.03,delay:1.5});
      bruit_(c,{duration:.6,volume:.08,delay:1.5,filterType:"lowpass",frequency:1500,frequencyEnd:120,decay:1.5});
      tonal_(c,{type:"sine",from:60,to:28,duration:1.0,volume:.12,delay:1.5});
      bruit_(c,{duration:.1,volume:.03,delay:2.05,filterType:"lowpass",frequency:400,decay:2});
      [[1047,.6],[1568,.5],[2093,.5]].forEach(function(n,i){
        tonal_(c,{type:"sine",from:n[0],to:n[0],duration:n[1],volume:.02,delay:2.1+i*.08});
      });
    }
  }

  function voyageTemps_(){
    return jouerWebAudio_(3000,voyageTempsConstruire_);
  }

  /* Changement de menu : une petite note de clochette douce, agréable à l'oreille (deux notes qui montent, très légères). */
  function menuNav_(){
    return jouerWebAudio_(260,function(c){
      tonal_(c,{type:"sine",from:587,to:589,duration:.16,volume:.030});
      tonal_(c,{type:"triangle",from:1174,to:1176,duration:.10,volume:.008});
      tonal_(c,{type:"sine",from:880,to:882,duration:.22,volume:.030,delay:.07});
      tonal_(c,{type:"triangle",from:1760,to:1764,duration:.12,volume:.008,delay:.07});
    });
  }

  /*
   * Porte de vieux magasin (Norman, 2026-10-03) : « un bruit comme quand on entrait dans les vieux magasins, avec des cloches accrochées au-dessus de la porte qui tintaient quand la porte cognait
   * contre ». Un petit coup mat du battant contre le bois, puis une grappe de clochettes de laiton : chacune est un son métallique (notes aiguës et partiels inharmoniques) qui s'éteint vite, les
   * frappes irrégulières et de moins en moins fortes, comme un tintement qui se calme.
   */
  function porteMagasinConstruire_(c){
    tonal_(c,{type:"sine",from:150,to:80,duration:.10,volume:.075});
    bruit_(c,{duration:.07,volume:.05,filterType:"lowpass",frequency:520,decay:2.4});
    var frappes=[[.04,2637,.034],[.11,3520,.030],[.17,3136,.028],[.26,2349,.026],[.34,3951,.024],[.47,3136,.020],[.60,2637,.016],[.78,3520,.012],[1.00,3136,.008]];
    frappes.forEach(function(f){
      var d=f[0],hz=f[1],v=f[2];
      tonal_(c,{type:"sine",from:hz,to:hz*.998,duration:.55,volume:v,delay:d});
      tonal_(c,{type:"sine",from:hz*2.76,to:hz*2.75,duration:.28,volume:v*.45,delay:d});
      if(hz*5.4<16000)tonal_(c,{type:"triangle",from:hz*5.4,to:hz*5.38,duration:.14,volume:v*.18,delay:d});
      bruit_(c,{duration:.025,volume:v*.35,delay:d,filterType:"highpass",frequency:5200,decay:3});
    });
  }
  function porteMagasin_(){
    return jouerWebAudio_(1700,porteMagasinConstruire_);
  }

  /*
   * Trois pas (Norman, 2026-10-03) : « quand on passe d'un rayon à l'autre dans la boutique, un bruit de pas, quelqu'un qui marche, 3 pas seulement ». Chaque pas = un talon qui frappe un plancher
   * (coup sourd qui chute), le frottement de la semelle et un léger claquement ; rythme de marche tranquille, pas alternés (un peu plus aigu, un peu plus grave).
   */
  function pasConstruire_(c,delay,force,hz){
    tonal_(c,{type:"sine",from:hz*1.9,to:hz*.55,duration:.12,volume:.105*force,delay:delay});
    bruit_(c,{duration:.075,volume:.06*force,delay:delay,filterType:"lowpass",frequency:760,decay:2.2});
    bruit_(c,{duration:.04,volume:.032*force,delay:delay+.012,filterType:"bandpass",frequency:2300,q:.9,decay:3});
  }
  function pasBoutiqueConstruire_(c){
    pasConstruire_(c,0,1,118);
    pasConstruire_(c,.31,.92,104);
    pasConstruire_(c,.62,1,116);
  }
  /*
   * Variantes de pas (Norman, 2026-10-04 : « plusieurs variantes des bruits de pas ; parfois 3, parfois 4 ; ils doivent avoir l'air différents, sinon le son a l'air vraiment répétitif »). Six façons de marcher, chacune
   * avec sa matière : talon de cuir sur parquet (le pas d'origine), baskets qui couinent, grosses bottes qui écrasent du gravier, tongs qui claquent, talons qui tiquent, vieux plancher qui craque. À chaque passage
   * d'un rayon à l'autre : une variante au hasard (jamais deux fois la même d'affilée), 3 ou 4 pas, un tempo différent (marche pressée ou traînante), chaque pas légèrement décalé dans le temps, la force et la hauteur.
   */
  var VARIANTES_PAS_V1=[
    {nom:"parquet",hz:118,tempo:[.29,.34],pas:pasConstruire_},
    {nom:"baskets",hz:150,tempo:[.24,.29],pas:function(c,d,f,hz){
      tonal_(c,{type:"sine",from:hz*1.25,to:hz*.7,duration:.07,volume:.075*f,delay:d});
      bruit_(c,{duration:.055,volume:.05*f,delay:d,filterType:"lowpass",frequency:520,decay:2.4});
      tonal_(c,{type:"triangle",from:1800+hz*2,to:2700+hz*2,duration:.055,volume:.02*f,delay:d+.03});
      bruit_(c,{duration:.03,volume:.02*f,delay:d+.02,filterType:"bandpass",frequency:3600,q:3,decay:3});
    }},
    {nom:"bottes",hz:78,tempo:[.36,.42],pas:function(c,d,f,hz){
      tonal_(c,{type:"sine",from:hz*1.6,to:hz*.45,duration:.2,volume:.15*f,delay:d});
      bruit_(c,{duration:.13,volume:.085*f,delay:d,filterType:"lowpass",frequency:430,decay:1.8});
      [0,.025,.05,.08].forEach(function(x,i){bruit_(c,{duration:.05,volume:(.035-i*.006)*f,delay:d+.02+x,filterType:"highpass",frequency:3200+i*500,decay:2.4});});
      tonal_(c,{type:"square",from:hz*3,to:hz*2.2,duration:.04,volume:.02*f,delay:d+.015});
    }},
    {nom:"tongs",hz:230,tempo:[.3,.38],pas:function(c,d,f,hz){
      bruit_(c,{duration:.045,volume:.11*f,delay:d,filterType:"bandpass",frequency:1700,q:.7,decay:3.4});
      tonal_(c,{type:"sine",from:hz*1.5,to:hz*.6,duration:.05,volume:.05*f,delay:d});
      bruit_(c,{duration:.07,volume:.05*f,delay:d+.07,filterType:"bandpass",frequency:900,q:1.1,decay:2.6});
    }},
    {nom:"talons",hz:320,tempo:[.27,.33],pas:function(c,d,f,hz){
      tonal_(c,{type:"triangle",from:hz*3.6,to:hz*2.9,duration:.04,volume:.07*f,delay:d});
      bruit_(c,{duration:.02,volume:.07*f,delay:d,filterType:"bandpass",frequency:3400,q:2,decay:3.2});
      tonal_(c,{type:"sine",from:hz*1.2,to:hz*.9,duration:.08,volume:.04*f,delay:d+.012});
      bruit_(c,{duration:.03,volume:.03*f,delay:d+.045,filterType:"bandpass",frequency:2100,q:1.6,decay:3});
    }},
    {nom:"plancher",hz:100,tempo:[.38,.46],pas:function(c,d,f,hz){
      tonal_(c,{type:"sine",from:hz*1.7,to:hz*.5,duration:.14,volume:.11*f,delay:d});
      bruit_(c,{duration:.08,volume:.055*f,delay:d,filterType:"lowpass",frequency:640,decay:2.1});
      tonal_(c,{type:"sawtooth",from:hz*1.9,to:hz*1.4,duration:.2,volume:.018*f,delay:d+.04});
      tonal_(c,{type:"sawtooth",from:hz*2.05,to:hz*1.5,duration:.2,volume:.012*f,delay:d+.045});
    }}
  ];
  var dernierePasVarianteV1=-1;

  /* Construit les pas d'une variante : nb pas (3 ou 4), tempo en secondes, aléa injectable pour les vérifications hors ligne. */
  function pasVarianteConstruire_(c,variante,nb,tempo,alea){
    var hasard=typeof alea==="function"?alea:Math.random;
    for(var i=0;i<nb;i+=1){
      var decalage=(hasard()-.5)*.03;
      var force=(i%2?.9:1)*(.94+hasard()*.12)*(i===nb-1?.92:1);
      var hz=variante.hz*(i%2?.9:1)*(.93+hasard()*.14);
      variante.pas(c,Math.max(0,i*tempo+decalage),force,hz);
    }
  }
  function pasBoutique_(){
    var n=VARIANTES_PAS_V1.length;
    var v=dernierePasVarianteV1<0?Math.floor(Math.random()*n):(dernierePasVarianteV1+1+Math.floor(Math.random()*(n-1)))%n;
    dernierePasVarianteV1=v;
    var variante=VARIANTES_PAS_V1[v];
    var nb=Math.random()<.5?3:4;
    var tempo=variante.tempo[0]+Math.random()*(variante.tempo[1]-variante.tempo[0]);
    return jouerWebAudio_(Math.ceil((nb-1)*tempo*1000+320),function(c){pasVarianteConstruire_(c,variante,nb,tempo);});
  }

  /*
   * Un son par menu (Norman, 2026-10-03 : « crée un son par menu en rapport avec le type de menu »). Tous courts (moins d'une demi-seconde) pour que la navigation reste vive, dans le même groupe que
   * l'ancienne note unique : jamais deux à la fois, le plus récent remplace celui qui attend. Le Shop garde sa porte de vieux magasin.
   */
  /*
   * Rituels de sang (Norman, 2026-10-04 : « crée des sons de rituel de plus en plus bad ass pour quand on lance un rituel avec notre blood »). Un son par sort de Blood Magic, du plus modeste au plus terrifiant :
   * numberBoost (le premier sort) < ironPill < bloodSpaghetti < counterfeitGold < leeches (le dernier). Chaque son ajoute une couche au précédent : battement de cœur, cloche funèbre, râle, chœur dissonant,
   * grondement de sub, éclat de métal, cri qui s'effondre. Durées : 1,1 s à 4,4 s. Aucune voix enregistrée : tout est synthétisé.
   */
  function coeur_(c,d,v){
    tonal_(c,{type:"sine",from:80,to:42,duration:.17,volume:v,delay:d});
    tonal_(c,{type:"sine",from:72,to:38,duration:.18,volume:v*.75,delay:d+.2});
  }
  function accordSombre_(c,notes,d,duree,vol,type){
    notes.forEach(function(hz,i){
      nappe_(c,{type:type||"sawtooth",from:hz,to:hz*.985,duration:duree,volume:vol,attack:duree*.45,delay:d,detune:i%2?9:-9});
    });
  }
  function cloche_(c,hz,d,v,duree){
    [[1,1],[2.76,.5],[5.4,.22],[8.9,.1]].forEach(function(p){tonal_(c,{type:"sine",from:hz*p[0],to:hz*p[0]*.998,duration:(duree||1.2)/(p[0]>3?2:1),volume:v*p[1],delay:d});});
  }
  var SONS_SORT_BLOOD_V1={
    /* Une goutte, un cœur qui s'emballe, un souffle qui monte. */
    numberBoost:{duree:1400,construire:function(c){
      coeur_(c,0,.12);coeur_(c,.5,.15);
      tonal_(c,{type:"sine",from:120,to:420,duration:.9,volume:.04,delay:.15});
      bruit_(c,{duration:.7,volume:.03,delay:.2,filterType:"bandpass",frequency:900,q:.8,decay:1.2});
      tonal_(c,{type:"triangle",from:660,to:660,duration:.5,volume:.025,delay:.85});}},
    /* Un coup de fer sur une enclume, un glas, un cœur lourd. */
    ironPill:{duree:1900,construire:function(c){
      coeur_(c,0,.14);coeur_(c,.42,.16);coeur_(c,.84,.18);
      tonal_(c,{type:"square",from:210,to:190,duration:.1,volume:.05,delay:.05});
      bruit_(c,{duration:.3,volume:.1,delay:.05,filterType:"bandpass",frequency:2200,q:2,decay:2});
      cloche_(c,196,.1,.06,1.5);
      accordSombre_(c,[65.4,98],.2,1.4,.035);
      tonal_(c,{type:"sine",from:90,to:40,duration:.6,volume:.16,delay:1.2});}},
    /* Un râle humide qui se déchire, un accord mineur, une chute dans les graves. */
    bloodSpaghetti:{duree:2750,construire:function(c){
      coeur_(c,0,.16);coeur_(c,.4,.18);coeur_(c,.8,.2);coeur_(c,1.15,.22);
      [0,.12,.26,.44].forEach(function(d,i){bruit_(c,{duration:.34,volume:.06+i*.012,delay:.1+d,filterType:"bandpass",frequency:380+i*210,q:5,decay:1.6});});
      accordSombre_(c,[55,65.4,82.4,98],.15,2.2,.04);
      cloche_(c,174.6,.35,.07,1.8);cloche_(c,155.6,1.1,.07,1.6);
      tonal_(c,{type:"sawtooth",from:700,to:90,duration:.9,volume:.045,delay:1.4});
      tonal_(c,{type:"sine",from:100,to:32,duration:.9,volume:.2,delay:1.7});
      bruit_(c,{duration:.6,volume:.09,delay:1.7,filterType:"lowpass",frequency:200,decay:1.4});}},
    /* Une cascade de pièces maudites, un chœur dissonant, un grondement qui fait trembler le sol. */
    counterfeitGold:{duree:3650,construire:function(c){
      for(var i=0;i<14;i+=1){tonal_(c,{type:"triangle",from:2400-i*70,to:(2400-i*70)*.99,duration:.12,volume:.026,delay:.05+i*.085});tonal_(c,{type:"sine",from:(2400-i*70)*2.7,to:(2400-i*70)*2.7,duration:.07,volume:.01,delay:.05+i*.085});}
      coeur_(c,0,.18);coeur_(c,.38,.2);coeur_(c,.76,.22);coeur_(c,1.1,.24);coeur_(c,1.4,.26);
      accordSombre_(c,[55,82.4,110,116.5,164.8],.3,2.8,.042);
      accordSombre_(c,[220,233.1,329.6],1.1,2,.022,"square");
      cloche_(c,130.8,.5,.09,2.4);cloche_(c,138.6,1.4,.09,2.2);
      tonal_(c,{type:"sawtooth",from:1200,to:60,duration:1.1,volume:.05,delay:1.6});
      bruit_(c,{duration:.9,volume:.14,delay:2,filterType:"lowpass",frequency:260,decay:1.2});
      tonal_(c,{type:"sine",from:84,to:26,duration:1.3,volume:.24,delay:2});}},
    /* Le rituel complet : le glas, un chœur de damnés, la terre qui s'ouvre, un cri qui s'effondre, un dernier coup de cathédrale. */
    leeches:{duree:4750,construire:function(c){
      coeur_(c,0,.2);coeur_(c,.36,.22);coeur_(c,.7,.25);coeur_(c,1,.28);coeur_(c,1.26,.3);coeur_(c,1.5,.32);
      accordSombre_(c,[41.2,55,82.4,116.5,164.8,233.1],.1,3.6,.05);
      accordSombre_(c,[329.6,349.2,493.9,523.3],1,2.8,.026,"square");
      for(var i=0;i<4;i+=1){cloche_(c,110+i*6.9,.25+i*.55,.1,2.8);}
      [0,.25,.5,.75,1,1.25].forEach(function(d,i){bruit_(c,{duration:.4,volume:.05+i*.012,delay:.15+d,filterType:"bandpass",frequency:300+i*260,q:6,decay:1.5});});
      tonal_(c,{type:"sawtooth",from:180,to:1900,duration:1.8,volume:.04,delay:.8});
      tonal_(c,{type:"square",from:240,to:2300,duration:1.8,volume:.022,delay:.8});
      bruit_(c,{duration:1.8,volume:.07,delay:.8,filterType:"highpass",frequency:2200,decay:.8});
      tonal_(c,{type:"sawtooth",from:2100,to:70,duration:1.5,volume:.065,delay:2.6});
      tonal_(c,{type:"sawtooth",from:2300,to:78,duration:1.5,volume:.04,delay:2.65});
      bruit_(c,{duration:.5,volume:.2,delay:2.6,filterType:"lowpass",frequency:900,decay:1.1});
      tonal_(c,{type:"sine",from:78,to:22,duration:1.8,volume:.3,delay:2.6});
      cloche_(c,98,3,.14,1.5);cloche_(c,73.4,3.05,.12,1.5);
      bruit_(c,{duration:.7,volume:.24,delay:3,filterType:"lowpass",frequency:320,decay:1.3});}}
  };

  function claquesDe_(c,hz,delais,volume,duree){
    delais.forEach(function(d){bruit_(c,{duration:duree||.03,volume:volume,delay:d,filterType:"bandpass",frequency:hz,q:1.2,decay:3});});
  }
  var SONS_MENU_V1={
    /* Sac de frappe : deux coups sourds. */
    entrainement:{duree:420,construire:function(c){
      [0,.17].forEach(function(d){tonal_(c,{type:"sine",from:150,to:55,duration:.12,volume:.11,delay:d});bruit_(c,{duration:.08,volume:.07,delay:d,filterType:"lowpass",frequency:600,decay:2});});
      bruit_(c,{duration:.05,volume:.03,delay:.17,filterType:"highpass",frequency:3500,decay:3});}},
    /* Servomoteur qui monte en régime puis deux déclics de verrouillage. */
    augmentations:{duree:430,construire:function(c){
      tonal_(c,{type:"sawtooth",from:160,to:640,duration:.26,volume:.022});
      tonal_(c,{type:"square",from:2400,to:2400,duration:.03,volume:.02,delay:.27});
      tonal_(c,{type:"square",from:3200,to:3200,duration:.03,volume:.016,delay:.32});}},
    /* Deux lames qui s'entrechoquent. */
    combat:{duree:450,construire:function(c){
      [[1700,.030],[1700*2.76,.016],[1700*5.4,.008]].forEach(function(p,i){tonal_(c,{type:"sine",from:p[0],to:p[0]*.996,duration:.34-i*.08,volume:p[1]});});
      bruit_(c,{duration:.09,volume:.05,filterType:"highpass",frequency:4500,decay:2.4});}},
    /* Appel de cor : on part à l'aventure. */
    aventure:{duree:480,construire:function(c){
      nappe_(c,{type:"sawtooth",from:262,to:264,duration:.2,volume:.026,attack:.03});
      nappe_(c,{type:"sawtooth",from:392,to:396,duration:.3,volume:.028,attack:.03,delay:.17});}},
    /* Pièces qui tombent dans le trou, puis un écho creux. */
    moneyPit:{duree:480,construire:function(c){
      [[0,2600],[.07,2200],[.14,1900]].forEach(function(p){tonal_(c,{type:"triangle",from:p[1],to:p[1]*.995,duration:.11,volume:.03,delay:p[0]});tonal_(c,{type:"sine",from:p[1]*2.7,to:p[1]*2.7,duration:.05,volume:.01,delay:p[0]});});
      tonal_(c,{type:"sine",from:95,to:60,duration:.2,volume:.08,delay:.26});}},
    /* Renaissance : souffle qui monte et carillon. */
    renaissance:{duree:480,construire:function(c){
      tonal_(c,{type:"sine",from:300,to:1200,duration:.34,volume:.03});
      tonal_(c,{type:"triangle",from:600,to:2400,duration:.34,volume:.012});
      tonal_(c,{type:"sine",from:1568,to:1572,duration:.22,volume:.03,delay:.28});}},
    /* Haltère : un disque de fonte qui claque. */
    avance:{duree:420,construire:function(c){
      tonal_(c,{type:"square",from:230,to:205,duration:.08,volume:.03});
      bruit_(c,{duration:.16,volume:.07,filterType:"bandpass",frequency:1400,q:3,decay:2});
      tonal_(c,{type:"sine",from:112,to:80,duration:.2,volume:.09,delay:.02});}},
    /* Horloge : tic, tic, toc. */
    machine:{duree:430,construire:function(c){
      [[0,1900],[.12,1900],[.25,1250]].forEach(function(p){tonal_(c,{type:"triangle",from:p[1],to:p[1]*.97,duration:.04,volume:.04,delay:p[0]});bruit_(c,{duration:.02,volume:.03,delay:p[0],filterType:"highpass",frequency:4500,decay:3});});}},
    /* Battements de cœur, grave. */
    sang:{duree:480,construire:function(c){
      tonal_(c,{type:"sine",from:78,to:44,duration:.16,volume:.12});
      tonal_(c,{type:"sine",from:70,to:42,duration:.16,volume:.085,delay:.17});
      bruit_(c,{duration:.3,volume:.02,filterType:"lowpass",frequency:260,decay:1.6});}},
    /* Ordinateur qui démarre : trois bips rétro. */
    wandoos:{duree:380,construire:function(c){
      [[0,660],[.07,880],[.14,1320]].forEach(function(p){tonal_(c,{type:"square",from:p[1],to:p[1],duration:.06,volume:.02,delay:p[0]});});
      tonal_(c,{type:"square",from:1760,to:1760,duration:.1,volume:.012,delay:.24});}},
    /* Trois notes cristallines qui montent, comme une boucle sans fin. */
    ngu:{duree:430,construire:function(c){
      [[0,784],[.08,1047],[.16,1568]].forEach(function(p){tonal_(c,{type:"sine",from:p[1],to:p[1],duration:.2,volume:.03,delay:p[0]});tonal_(c,{type:"triangle",from:p[1]*2,to:p[1]*2,duration:.1,volume:.008,delay:p[0]});});}},
    /* Frottement de feuilles et note de bois. */
    yggdrasil:{duree:430,construire:function(c){
      bruit_(c,{duration:.3,volume:.045,filterType:"bandpass",frequency:3000,q:.6,decay:1.2});
      tonal_(c,{type:"triangle",from:330,to:326,duration:.2,volume:.03,delay:.1});}},
    /* Pioche sur la roche. */
    diggers:{duree:430,construire:function(c){
      [[0,2200,1],[.17,1900,.8]].forEach(function(p){
        tonal_(c,{type:"sine",from:p[1],to:p[1]*.95,duration:.1,volume:.035*p[2],delay:p[0]});
        tonal_(c,{type:"triangle",from:p[1]*1.5,to:p[1]*1.5,duration:.05,volume:.012*p[2],delay:p[0]});
        bruit_(c,{duration:.1,volume:.05*p[2],delay:p[0]+.015,filterType:"lowpass",frequency:900,decay:2.2});});}},
    /* Brosse sur une barbe : frottement doux et petit « mmh ». */
    beards:{duree:430,construire:function(c){
      bruit_(c,{duration:.28,volume:.05,filterType:"lowpass",frequency:900,frequencyEnd:400,decay:1.4});
      tonal_(c,{type:"sine",from:190,to:140,duration:.22,volume:.03,delay:.04});}},
    /* Grand gong de la Tour. */
    tower:{duree:480,construire:function(c){
      [[220,.05],[220*2.4,.025],[220*3.9,.014]].forEach(function(p,i){tonal_(c,{type:"sine",from:p[0],to:p[0]*.99,duration:.46-i*.08,volume:p[1]});});
      bruit_(c,{duration:.06,volume:.03,filterType:"lowpass",frequency:900,decay:2});}},
    /* Étoile qui scintille : gamme pentatonique vers le haut. */
    perks:{duree:420,construire:function(c){
      [1047,1319,1568,2093].forEach(function(hz,i){tonal_(c,{type:"sine",from:hz,to:hz,duration:.15,volume:.026,delay:i*.06});});}},
    /* Départ de course : deux bips graves puis un aigu. */
    challenges:{duree:440,construire:function(c){
      tonal_(c,{type:"square",from:440,to:440,duration:.07,volume:.02});
      tonal_(c,{type:"square",from:440,to:440,duration:.07,volume:.02,delay:.11});
      tonal_(c,{type:"square",from:880,to:880,duration:.16,volume:.024,delay:.22});}},
    /* Piétinement d'un géant et grondement. */
    titans:{duree:480,construire:function(c){
      tonal_(c,{type:"sine",from:62,to:34,duration:.36,volume:.15});
      bruit_(c,{duration:.34,volume:.06,filterType:"lowpass",frequency:200,decay:1.6});
      tonal_(c,{type:"sawtooth",from:70,to:50,duration:.3,volume:.015,delay:.05});}},
    /* Suspense : deux notes qui descendent. */
    macguffins:{duree:460,construire:function(c){
      tonal_(c,{type:"triangle",from:392,to:370,duration:.2,volume:.034});
      tonal_(c,{type:"triangle",from:311,to:294,duration:.26,volume:.034,delay:.16});}},
    /* Atelier : cliquet de clé à molette et coup de marteau. */
    daycare:{duree:430,construire:function(c){
      [0,.05,.10,.15].forEach(function(d){tonal_(c,{type:"triangle",from:1500,to:1400,duration:.03,volume:.025,delay:d});});
      tonal_(c,{type:"sine",from:190,to:110,duration:.14,volume:.07,delay:.25});
      bruit_(c,{duration:.05,volume:.03,delay:.25,filterType:"bandpass",frequency:1800,q:2,decay:3});}},
    /* Parchemin qu'on déroule, puis deux notes de plume. */
    questing:{duree:460,construire:function(c){
      bruit_(c,{duration:.22,volume:.035,filterType:"highpass",frequency:2500,frequencyEnd:5000,decay:1.5});
      tonal_(c,{type:"triangle",from:523,to:526,duration:.14,volume:.026,delay:.18});
      tonal_(c,{type:"triangle",from:784,to:788,duration:.2,volume:.026,delay:.25});}},
    /* Boing : un ressort de manie. */
    quirks:{duree:430,construire:function(c){
      tonal_(c,{type:"sine",from:300,to:900,duration:.14,volume:.04});
      tonal_(c,{type:"sine",from:900,to:420,duration:.18,volume:.034,delay:.13});}},
    /* Glitch numérique : rafales carrées désordonnées. */
    hacks:{duree:380,construire:function(c){
      [[0,880],[.04,1760],[.08,440],[.12,2200],[.18,660],[.21,1320]].forEach(function(p){tonal_(c,{type:"square",from:p[1],to:p[1],duration:.03,volume:.018,delay:p[0]});});
      bruit_(c,{duration:.2,volume:.02,filterType:"highpass",frequency:6000,decay:1.2});}},
    /* Harpe magique : glissando vers le haut. */
    wishes:{duree:480,construire:function(c){
      [523,659,784,1047,1319].forEach(function(hz,i){tonal_(c,{type:"sine",from:hz,to:hz,duration:.2,volume:.024,delay:i*.06});tonal_(c,{type:"triangle",from:hz*2,to:hz*2,duration:.1,volume:.006,delay:i*.06});});}},
    /* Cartes qu'on bat : petits claquements rapides. */
    cards:{duree:380,construire:function(c){
      claquesDe_(c,4000,[0,.06,.12,.18],.05,.04);
      tonal_(c,{type:"sine",from:220,to:150,duration:.08,volume:.04,delay:.24});}},
    /* Poêle : grésillement et choc de casserole. */
    cooking:{duree:460,construire:function(c){
      bruit_(c,{duration:.36,volume:.05,filterType:"highpass",frequency:5000,decay:.8});
      tonal_(c,{type:"triangle",from:1760,to:1740,duration:.1,volume:.03,delay:.02});}},
    /* Chroniques (Collection, Classement et Succès réunis) : une page qu'on tourne, puis un ding doré. */
    chroniques:{duree:480,construire:function(c){
      bruit_(c,{duration:.18,volume:.04,filterType:"highpass",frequency:2500,frequencyEnd:5200,decay:1.6});
      tonal_(c,{type:"triangle",from:1318,to:1320,duration:.28,volume:.034,delay:.14});
      tonal_(c,{type:"sine",from:1976,to:1978,duration:.28,volume:.028,delay:.2});}},
    /* Bulle de message : deux petits « pop ». */
    chat:{duree:340,construire:function(c){
      tonal_(c,{type:"sine",from:700,to:1100,duration:.06,volume:.04});
      tonal_(c,{type:"sine",from:900,to:1400,duration:.07,volume:.036,delay:.09});}},
    /* Molette de réglage : cliquets. */
    parametres:{duree:340,construire:function(c){
      [0,.06,.12].forEach(function(d){tonal_(c,{type:"triangle",from:1100,to:1050,duration:.02,volume:.03,delay:d});bruit_(c,{duration:.015,volume:.025,delay:d,filterType:"highpass",frequency:4000,decay:3});});}},
    /* Clavier d'administration : frappes de touches. */
    admin:{duree:340,construire:function(c){
      claquesDe_(c,2500,[0,.07,.11],.055,.02);
      tonal_(c,{type:"sine",from:160,to:110,duration:.05,volume:.03,delay:.15});}}
  };

  /*
   * 1. Fanfare de cristal (V206) — fanfare originale très courte : sensation "coffre/victoire" sans reprendre de
   * mélodie existante. Quatre notes ascendantes, accord final et éclat cristallin.
   */
  function victoireFanfareConstruire_(c){
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
  }

  /*
   * 9 autres sons de victoire (2026-09-27, Norman : « crée 9 Autres sons de victoires. Quand on bat un boss de
   * Fight Boss. ils doivent tous être en rapport avec la victoire mais sans être ressemblants. Ils devront tous
   * être joué dans l'ordre avant de recommencer au premier »). Même mécanique de rotation que les 10 sons
   * d'apparition de boss (SONS_BOSS/gongBoss_) : chacun garde un thème "victoire" (fanfare, cloche, cuivres,
   * acclamation...) mais avec un timbre, un rythme ou une structure clairement différents des autres.
   */

  /* 2. Cuivres triomphants : accord majeur qui gonfle (cor + trompette), impact grave. */
  function victoireCuivresConstruire_(c){
    nappe_(c,{type:"sawtooth",from:130.8,to:132,duration:.85,volume:.050,attack:.04});
    nappe_(c,{type:"sawtooth",from:164.8,to:166,duration:.85,volume:.044,attack:.05});
    nappe_(c,{type:"sawtooth",from:196,to:198,duration:.85,volume:.050,attack:.04});
    nappe_(c,{type:"triangle",from:261.6,to:264,duration:.85,volume:.028,attack:.06});
    tonal_(c,{type:"sine",from:65,to:65,duration:.5,volume:.09});
    bruit_(c,{duration:.12,volume:.05,filterType:"lowpass",frequency:600,decay:2});
  }

  /* 3. Carillon de cloches : trois notes de cloche qui descendent, riches en harmoniques, résonance longue. */
  function victoireCarillonConstruire_(c){
    [[1568,0],[1244,.22],[988,.44]].forEach(function(p){
      [[1,1,.9],[2.0,.4,.7],[2.76,.2,.5],[5.4,.1,.35]].forEach(function(h){
        tonal_(c,{type:"sine",from:p[0]*h[0],to:p[0]*h[0]*.998,duration:.5+h[2]*.5,volume:.052*h[1],delay:p[1]});
      });
    });
  }

  /* 4. Acclamation : un souffle qui monte comme une foule qui exulte, puis un accord bref qui l'accompagne. */
  function victoireFouleConstruire_(c){
    bruitMonte_(c,{duration:.48,volume:.065,filterType:"bandpass",frequency:400,frequencyEnd:3200,q:.7,pow:1.6});
    [523,659,784].forEach(function(f){
      tonal_(c,{type:"triangle",from:f,to:f*1.01,duration:.40,volume:.048,delay:.45});
    });
    bruit_(c,{duration:.3,volume:.026,delay:.5,filterType:"highpass",frequency:5000,decay:2});
  }

  /* 5. Arpège éclair façon "niveau terminé" : cinq notes rapides qui montent puis un accord tenu. */
  function victoireArpegeConstruire_(c){
    [523,659,784,1047,1319].forEach(function(f,i){
      tonal_(c,{type:"square",from:f,to:f,duration:.09,volume:.032,delay:i*.06});
    });
    [659,784,988].forEach(function(f){
      tonal_(c,{type:"triangle",from:f,to:f,duration:.5,volume:.038,delay:.35});
    });
  }

  /* 6. Fanfare royale : trois appels de trompette identiques puis un quatrième plus long, comme une annonce. */
  function victoireTrompettesConstruire_(c){
    [[0,.14,false],[.18,.14,false],[.36,.14,false],[.60,.42,true]].forEach(function(p){
      tonal_(c,{type:"sawtooth",from:392,to:392,duration:p[1],volume:p[2]?.070:.048,delay:p[0]});
      tonal_(c,{type:"sawtooth",from:587,to:587,duration:p[1],volume:p[2]?.048:.028,delay:p[0]});
    });
    bruit_(c,{duration:.16,volume:.015,delay:.6,filterType:"highpass",frequency:6000,decay:2.2});
  }

  /* 7. Jingle chiptune : petite mélodie carrée façon jeu 8 bits, vive et bondissante. */
  function victoireChiptuneConstruire_(c){
    [[659,0,.11],[784,.11,.11],[988,.22,.11],[1319,.33,.26]].forEach(function(p){
      tonal_(c,{type:"square",from:p[0],to:p[0],duration:p[2],volume:.032,delay:p[1]});
    });
    tonal_(c,{type:"square",from:1568,to:1568,duration:.2,volume:.020,delay:.60});
  }

  /* 8. Impact orchestral + chœur : un coup grave sourd suivi d'un chœur qui enfle doucement. */
  function victoireChoeurConstruire_(c){
    tonal_(c,{type:"sine",from:80,to:60,duration:.30,volume:.10});
    bruit_(c,{duration:.15,volume:.06,filterType:"lowpass",frequency:900,decay:2.4});
    [392,494,587].forEach(function(f){
      nappe_(c,{type:"sine",from:f,to:f*1.004,duration:1.1,volume:.030,attack:.5,vibRate:5,vibDepth:3,delay:.1});
    });
  }

  /* 9. Boîte à musique scintillante : cinq notes de clochette légères, aiguës, qui rebondissent. */
  function victoireBoiteConstruire_(c){
    [[1319,0],[1568,.12],[2093,.24],[1568,.36],[2637,.48]].forEach(function(p){
      tonal_(c,{type:"sine",from:p[0],to:p[0]*1.002,duration:.22,volume:.030,delay:p[1]});
      tonal_(c,{type:"triangle",from:p[0]*2,to:p[0]*2,duration:.12,volume:.010,delay:p[1]});
    });
  }

  /* 10. Roulement de caisse claire + cymbale : la tension monte puis explose en un éclat de cuivre. */
  function victoireRouleauConstruire_(c){
    bruit_(c,{duration:.5,volume:.048,filterType:"bandpass",frequency:500,q:1.2,decay:.4});
    bruit_(c,{duration:.35,volume:.070,delay:.5,filterType:"highpass",frequency:4000,frequencyEnd:6000,decay:1.4});
    tonal_(c,{type:"sawtooth",from:261.6,to:264,duration:.6,volume:.058,delay:.5});
    tonal_(c,{type:"sine",from:65,to:65,duration:.5,volume:.09,delay:.5});
  }

  var CLE_VICTOIRE_BOSS="soreal_idle_victoire_boss_index_v1";
  var SONS_VICTOIRE=[
    {nom:"fanfare-cristal",duree:980,construire:victoireFanfareConstruire_},
    {nom:"cuivres",duree:950,construire:victoireCuivresConstruire_},
    {nom:"carillon",duree:1300,construire:victoireCarillonConstruire_},
    {nom:"foule",duree:950,construire:victoireFouleConstruire_},
    {nom:"arpege",duree:950,construire:victoireArpegeConstruire_},
    {nom:"trompettes",duree:1100,construire:victoireTrompettesConstruire_},
    {nom:"chiptune",duree:850,construire:victoireChiptuneConstruire_},
    {nom:"choeur",duree:1300,construire:victoireChoeurConstruire_},
    {nom:"boite-a-musique",duree:800,construire:victoireBoiteConstruire_},
    {nom:"rouleau-cymbale",duree:1150,construire:victoireRouleauConstruire_}
  ];

  function rangVictoireBoss_(){
    try{
      var n=parseInt(localStorage.getItem(CLE_VICTOIRE_BOSS),10);
      if(isFinite(n)&&n>=0)return n%SONS_VICTOIRE.length;
    }catch(_){}
    return 0;
  }

  function memoriserVictoireBoss_(rang){
    try{localStorage.setItem(CLE_VICTOIRE_BOSS,String((rang+1)%SONS_VICTOIRE.length));}catch(_){}
  }

  var dernierSonVictoire="";

  function victoireBoss_(){
    var rang=rangVictoireBoss_();
    var son=SONS_VICTOIRE[rang];
    dernierSonVictoire=son.nom;
    memoriserVictoireBoss_(rang);
    return jouerWebAudio_(son.duree,son.construire);
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

  /*
   * Défaite (Norman, 2026-09-26 : « le son quand on perd un combat doit être plus adapté à une perte de combat ») : un K.O. suivi d'une petite élégie. Un coup sourd qui
   * fait craquer, puis quatre notes tristes en mineur qui redescendent (la, fa, ré, la grave qui s'affaisse) sur un bourdon qui s'éteint. Rien de commun avec la fuite
   * (les « wah-wah » comiques) ni avec la victoire (fanfare).
   */
  function defaiteConstruire_(c){
    {
      /* le coup */
      tonal_(c,{type:"sine",from:120,to:38,duration:.55,volume:.125});
      tonal_(c,{type:"triangle",from:220,to:70,duration:.4,volume:.06,delay:.02});
      bruit_(c,{duration:.30,volume:.075,frequency:1100,frequencyEnd:120,decay:2.2});
      bruit_(c,{duration:.10,volume:.030,delay:.05,filterType:"highpass",frequency:3500,decay:2.5});
      /* l'élégie */
      [[440,.42,.30],[349,.72,.30],[294,1.02,.30],[220,1.32,.62]].forEach(function(n,i){
        var dernier=i===3;
        nappe_(c,{type:"triangle",from:n[0],to:dernier?n[0]*.9:n[0],duration:n[2]+.12,volume:.050,attack:.04,delay:n[1],vibRate:5.5,vibDepth:dernier?4:2});
        nappe_(c,{type:"sine",from:n[0]/2,to:dernier?n[0]*.45:n[0]/2,duration:n[2]+.12,volume:.030,attack:.05,delay:n[1]});
      });
      /* le bourdon qui s'éteint */
      nappe_(c,{type:"sine",from:55,to:44,duration:1.8,volume:.045,attack:.15,delay:.1});
    }
  }

  function defaite_(){
    return jouerWebAudio_(1900,defaiteConstruire_);
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
   * Set complété (Norman, 2026-09-27 : « Quand on complete un set, je veux un son de victoire en même temps que la notification fade in fade out
   * apparait. Crée en 1 pour l'occasion. ») : un petit « clic » sec (la dernière pièce du set qui s'emboîte), puis un arpège ascendant à cinq notes
   * en accord majeur complet, plus riche et plus long que la clochette de menu débloqué (menuDebloque_, 4 notes) et sans reprendre la fanfare des
   * boss (victoireBoss_, timbre triangle) : ici en sinusoïdale pure avec un harmonique triangle discret, et un scintillement final plus large.
   */
  function setCompletConstruire_(c){
    tonal_(c,{type:"square",from:1200,to:880,duration:.05,volume:.048});
    bruit_(c,{duration:.05,volume:.030,filterType:"highpass",frequency:3000,decay:3});
    [[523,.16,.09],[659,.17,.16],[784,.18,.23],[1047,.20,.30],[1319,.40,.39]].forEach(function(p,i){
      tonal_(c,{type:"sine",from:p[0],to:p[0]*1.002,duration:p[1],volume:.046-i*.004,delay:p[2]});
      tonal_(c,{type:"triangle",from:p[0]*2,to:p[0]*2,duration:p[1]*.5,volume:.014,delay:p[2]});
    });
    bruit_(c,{
      duration:.32,volume:.017,delay:.42,
      filterType:"highpass",frequency:7000,frequencyEnd:10500,decay:2.1
    });
  }
  function setComplet_(){
    return jouerWebAudio_(1080,setCompletConstruire_);
  }

  /*
   * Money Pit (2026-09-27, Norman : « Quand on balance son argent dans le money pit... il n'y a pas de son. » ) : une poignée de pièces
   * qui tombent et roulent, de plus en plus étouffées, puis un écho grave qui s'enfonce -- le trou qui avale l'argent. Distinct du bruit
   * de caisse enregistreuse (achat) et du tintement d'or de l'EXP Shop (orConstruire_) : ici tout descend et se perd dans le vide, rien ne
   * remonte.
   */
  function moneyPitConstruire_(c){
    [[0,1900,.048],[.09,1500,.044],[.17,1150,.040],[.25,880,.036],[.34,650,.032]].forEach(function(p){
      tonal_(c,{type:"sine",from:p[1],to:p[1]*.9,duration:.14,volume:p[2]});
      bruit_(c,{duration:.05,volume:p[2]*.6,delay:p[0],filterType:"highpass",frequency:2800,decay:2.8});
    });
    tonal_(c,{type:"sine",from:210,to:55,duration:1.0,volume:.095,delay:.48});
    bruit_(c,{duration:.9,volume:.055,delay:.48,filterType:"lowpass",frequency:650,frequencyEnd:90,decay:1.5});
  }
  function moneyPit_(){
    return jouerWebAudio_(1500,moneyPitConstruire_);
  }

  /*
   * Daily Spin (2026-09-27, Norman : « ni quand on tourne la roue. ») : le cliquet de la roue qui tourne vite puis ralentit (petits « tics »
   * de plus en plus espacés), et le « ding » final qui marque l'arrêt sur un lot.
   */
  function dailySpinConstruire_(c){
    var t=0;
    var dt=.045;
    while(t<1.55){
      tonal_(c,{type:"square",from:1450,to:1250,duration:.025,volume:.032,delay:t});
      bruit_(c,{duration:.02,volume:.020,filterType:"highpass",frequency:3600,decay:3.2,delay:t});
      dt=Math.min(.30,dt*1.17);
      t+=dt;
    }
    tonal_(c,{type:"sine",from:1568,to:1568,duration:.48,volume:.052,delay:t+.05});
    tonal_(c,{type:"sine",from:1568*2,to:1568*2,duration:.30,volume:.018,delay:t+.05});
    tonal_(c,{type:"triangle",from:2093,to:2093,duration:.34,volume:.026,delay:t+.09});
  }
  function dailySpin_(){
    return jouerWebAudio_(2200,dailySpinConstruire_);
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

  /*
   * Équiper un objet (Norman, 2026-09-26 : « quand on équipe quelque chose, il faut un son aussi ») : froissement de cuir/sangle, cliquetis métallique de la boucle qui se ferme, puis un petit
   * « toc » sourd quand la pièce se met en place.
   */
  function equipConstruire_(c){
    bruit_(c,{duration:.11,volume:.030,filterType:"bandpass",frequency:1400,frequencyEnd:2600,q:.9,decay:1.6});
    [[.10,1850,.036],[.16,2470,.030]].forEach(function(p){
      tonal_(c,{type:"sine",from:p[1],to:p[1]*.99,duration:.10,volume:p[2],delay:p[0]});
      tonal_(c,{type:"sine",from:p[1]*2.76,to:p[1]*2.76,duration:.04,volume:p[2]*.4,delay:p[0]});
      bruit_(c,{duration:.03,volume:p[2]*.8,delay:p[0],filterType:"highpass",frequency:5200,decay:3});
    });
    tonal_(c,{type:"sine",from:150,to:70,duration:.16,volume:.070,delay:.24});
    bruit_(c,{duration:.06,volume:.024,delay:.24,filterType:"lowpass",frequency:520,decay:2.4});
  }
  function equipJouer_(){
    return jouerWebAudio_(520,equipConstruire_);
  }

  /*
   * Achat dans l'EXP Shop (Norman, 2026-09-26 : « un bruit de Gold ») : une poignée de pièces d'or qui tintent en tas (sept tintements métalliques brefs, de plus en plus serrés),
   * puis le « ding » plein d'une grosse pièce. Distinct de la caisse enregistreuse des autres achats.
   */
  function orConstruire_(c){
    [[0,2350,.050],[.075,3100,.045],[.13,2650,.050],[.19,3500,.040],[.235,2900,.050],[.30,2450,.050],[.36,3300,.038]].forEach(function(p){
      tonal_(c,{type:"sine",from:p[1],to:p[1]*.985,duration:.16,volume:p[2],delay:p[0]});
      tonal_(c,{type:"sine",from:p[1]*2.76,to:p[1]*2.76,duration:.07,volume:p[2]*.45,delay:p[0]});
      bruit_(c,{duration:.035,volume:p[2]*.7,delay:p[0],filterType:"highpass",frequency:5000,decay:3});
    });
    tonal_(c,{type:"sine",from:1568,to:1568*1.001,duration:.55,volume:.055,delay:.42});
    tonal_(c,{type:"sine",from:1568*2.76,to:1568*2.76,duration:.20,volume:.020,delay:.42});
    tonal_(c,{type:"triangle",from:1568*1.5,to:1568*1.5,duration:.30,volume:.010,delay:.42});
    bruit_(c,{duration:.16,volume:.016,delay:.44,filterType:"highpass",frequency:6800,frequencyEnd:9000,decay:2.2});
  }
  function orJouer_(){
    return jouerWebAudio_(1000,orConstruire_);
  }

  /*
   * Achat dans la Boutique AP (Norman, 2026-09-26 : « un bruit de pierre précieuse ») : carillon de cristal, trois notes qui montent, chacune avec les partiels inharmoniques du verre
   * (2,32 ; 4,25 ; 6,63) et une longue résonance, puis un scintillement aigu. Aucun son de métal : c'est une gemme qu'on fait tinter.
   */
  function gemmeConstruire_(c){
    [[0,1319,.050],[.11,1760,.046],[.22,2349,.050]].forEach(function(p){
      [[1,1,.95],[2.32,.35,.55],[4.25,.16,.32],[6.63,.08,.20]].forEach(function(h){
        tonal_(c,{type:"sine",from:p[1]*h[0],to:p[1]*h[0]*1.0004,duration:h[2],volume:p[2]*h[1],delay:p[0]});
      });
    });
    tonal_(c,{type:"sine",from:3520,to:3520,duration:.85,volume:.012,delay:.30});
    tonal_(c,{type:"sine",from:3529,to:3529,duration:.85,volume:.012,delay:.30});
    tonal_(c,{type:"sine",from:4699,to:4699,duration:.55,volume:.010,delay:.42});
    bruit_(c,{duration:.30,volume:.012,delay:.26,filterType:"highpass",frequency:8000,frequencyEnd:11000,decay:2.4});
  }
  function gemmeJouer_(){
    return jouerWebAudio_(1300,gemmeConstruire_);
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
  /*
   * Norman (2026-10-06) : « le bruit quand on met de l'énergie n'est pas bon du tout, il faut que ce soit un bruit de clic de clavier ».
   * Un clic de clavier mécanique, en deux temps : la touche s'ENFONCE (claquement sec du dessus, craquement du plastique, « thock » de fin de course, petit tintement du boîtier),
   * puis se RELÂCHE (un tic plus léger, un peu plus tard). Chaque appel varie très légèrement de hauteur pour ne pas sonner comme une mitraillette. + = touche aiguë et vive ;
   * − = touche plus grave et plus mate (même famille). Tout reste dans le médium : audible sur de petits haut-parleurs, sans aigus perçants.
   */
  function clavierClic_(c,grave){
    var k=(grave?0.72:1)*(0.94+Math.random()*0.12);
    var relache=.062+Math.random()*.012;
    bruit_(c,{duration:.016,volume:grave?.085:.105,filterType:"bandpass",frequency:3300*k,decay:2.2,q:1.1});
    bruit_(c,{duration:.024,volume:grave?.075:.065,delay:.002,filterType:"bandpass",frequency:1600*k,decay:2,q:.9});
    tonal_(c,{type:"sine",from:210*k,to:92*k,duration:.05,volume:grave?.09:.075});
    tonal_(c,{type:"triangle",from:560*k,to:330*k,duration:.03,volume:.032,delay:.002});
    bruit_(c,{duration:.011,volume:grave?.035:.05,delay:relache,filterType:"bandpass",frequency:2800*k,decay:2,q:1});
    tonal_(c,{type:"sine",from:170*k,to:120*k,duration:.022,volume:.02,delay:relache});
  }
  function btPlus_(){
    return jouerWebAudio_(150,function(c){clavierClic_(c,false);});
  }

  function btMoins_(){
    return jouerWebAudio_(150,function(c){clavierClic_(c,true);});
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

  /*
   * Norman (2026-09-29) : « Je veux des sons différents pour le + et - de Time machine et pareil
   * pour Blood magic. Ca doit être en rapport avec le theme du menu. » Réutilisent le même moteur
   * (tonal_/bruit_) que Basic Training, mais avec un timbre propre à chaque thème plutôt que le
   * même son partout.
   *
   * Time Machine : un « tic » mécanique d'horloge (clic filtré en bande étroite, comme un rouage),
   * qui avance ou recule ; Cap = deux tics rapprochés (rattrapage) puis un carillon de cloche.
   */
  function tmPlus_(){
    return jouerWebAudio_(180,function(c){
      bruit_(c,{duration:.03,volume:.052,filterType:"bandpass",frequency:2600,frequencyEnd:2200,decay:1.6,q:6});
      tonal_(c,{type:"square",from:880,to:880,duration:.03,volume:.016,delay:.002});
    });
  }
  function tmMoins_(){
    return jouerWebAudio_(180,function(c){
      bruit_(c,{duration:.03,volume:.052,filterType:"bandpass",frequency:1900,frequencyEnd:1500,decay:1.6,q:6});
      tonal_(c,{type:"square",from:520,to:520,duration:.03,volume:.016,delay:.002});
    });
  }
  function tmCap_(){
    return jouerWebAudio_(520,function(c){
      bruit_(c,{duration:.025,volume:.046,filterType:"bandpass",frequency:2200,frequencyEnd:2200,decay:1.8,q:6});
      bruit_(c,{duration:.025,volume:.046,filterType:"bandpass",frequency:2200,frequencyEnd:2200,decay:1.8,q:6,delay:.09});
      tonal_(c,{type:"sine",from:1568,to:1568,duration:.42,volume:.040,delay:.16});
      tonal_(c,{type:"sine",from:3136,to:3136,duration:.30,volume:.015,delay:.18});
    });
  }

  /*
   * Blood Magic : un « pouls » grave et sourd (sinusoïde basse + bruit passe-bas étouffé), jamais
   * brillant comme Basic Training -- + monte légèrement, − redescend ; Cap = une montée plus large
   * façon rituel qui s'accomplit, toujours grave, jamais un simple « ding » clair.
   */
  function bloodPlus_(){
    return jouerWebAudio_(220,function(c){
      tonal_(c,{type:"sine",from:110,to:150,duration:.14,volume:.052});
      bruit_(c,{duration:.10,volume:.020,delay:.02,filterType:"lowpass",frequency:500,frequencyEnd:250,decay:2.6});
    });
  }
  function bloodMoins_(){
    return jouerWebAudio_(220,function(c){
      tonal_(c,{type:"sine",from:150,to:95,duration:.16,volume:.050});
      bruit_(c,{duration:.10,volume:.018,delay:.03,filterType:"lowpass",frequency:400,frequencyEnd:180,decay:2.8});
    });
  }
  function bloodCap_(){
    return jouerWebAudio_(560,function(c){
      tonal_(c,{type:"sawtooth",from:70,to:130,duration:.30,volume:.036});
      tonal_(c,{type:"sine",from:130,to:130,duration:.34,volume:.028,delay:.22});
      bruit_(c,{duration:.30,volume:.030,delay:0,filterType:"lowpass",frequency:700,frequencyEnd:200,decay:2.2});
      bruit_(c,{duration:.12,volume:.015,delay:.26,filterType:"lowpass",frequency:300,frequencyEnd:120,decay:2.6});
    });
  }

  /* Achat refusé (ressources insuffisantes) : deux petits « buzz » graves qui redescendent, nettement négatif. */
  function achatRefuse_(){
    return jouerWebAudio_(260,function(c){
      tonal_(c,{type:"square",from:180,to:120,duration:.10,volume:.045});
      tonal_(c,{type:"square",from:150,to:90,duration:.12,volume:.040,delay:.09});
      bruit_(c,{duration:.08,volume:.020,delay:0,filterType:"lowpass",frequency:900,frequencyEnd:400,decay:3});
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

  /* Carillon de connexion : deux notes douces qui montent (do-sol aigus), volume bas -- présent mais jamais gênant. */
  function joueurConnecte_(){
    return jouerWebAudio_(520,function(c){
      tonal_(c,{type:"sine",from:659,to:659,duration:.18,volume:.030});
      tonal_(c,{type:"sine",from:988,to:988,duration:.24,volume:.026,delay:.11});
      tonal_(c,{type:"triangle",from:1976,to:1976,duration:.12,volume:.008,delay:.13});
    });
  }

  /*
   * Absorption de TOUS les boosts possibles (2026-09-27, Norman) : plus gros événement qu'un
   * boostPower_/boostToughness_/boostSpecial_ isolé -- une charge qui monte, en écho des trois
   * flaveurs (grave/électrique/cristallin), puis un accord final éclatant qui marque le "plein".
   */
  function boostAllAbsorption_(){
    return jouerWebAudio_(820,function(c){
      tonal_(c,{type:"sine",from:90,to:64,duration:.22,volume:.075});
      tonal_(c,{type:"sawtooth",from:150,to:560,duration:.24,volume:.036,delay:.06});
      bruit_(c,{
        duration:.16,volume:.028,delay:.20,
        filterType:"highpass",frequency:2400,frequencyEnd:5200,decay:1.4
      });
      [523,659,784,1047].forEach(function(f,i){
        tonal_(c,{type:"triangle",from:f,to:f,duration:.26,volume:.042-i*.005,delay:.32+i*.05});
      });
      bruit_(c,{
        duration:.22,volume:.026,delay:.34,
        filterType:"bandpass",frequency:3400,frequencyEnd:6800,q:1.0,decay:1.6
      });
    });
  }

  /*
   * Compétences du mode Aventure, Idle Mode OFF (Norman, 2026-09-26 : « pour chacune des attaques, blocage etc., un son qui colle à ce que fait le bouton »). Un son court et distinct par bouton,
   * joué quand la compétence part réellement (pas quand elle est en recharge ou verrouillée). Identifiants = ceux des boutons (IDLE_ADVENTURE_MANUAL_* / ADVANCED_SKILLS du jeu).
   */
  var SONS_COMPETENCE=[
    /* Attaque : un coup d'épée vif */
    {id:"regular",duree:350,construire:function(c){
      bruit_(c,{duration:.12,volume:.10,filterType:"bandpass",frequency:2200,frequencyEnd:6000,q:.9,decay:2});
      tonal_(c,{type:"square",from:340,to:120,duration:.09,volume:.055,delay:.05});
      bruit_(c,{duration:.05,volume:.075,delay:.06,filterType:"lowpass",frequency:700,decay:2.6});
    }},
    /* Forte : un coup lourd qui claque */
    {id:"strong",duree:550,construire:function(c){
      bruit_(c,{duration:.10,volume:.06,filterType:"highpass",frequency:3500,decay:2.4});
      tonal_(c,{type:"sine",from:130,to:48,duration:.30,volume:.13,delay:.03});
      bruit_(c,{duration:.16,volume:.070,delay:.03,filterType:"lowpass",frequency:900,decay:2.2});
    }},
    /* Parade : le choc métallique d'une lame qui dévie un coup (clang), puis un éclat */
    {id:"parry",duree:800,construire:function(c){
      [[1250,.05],[1250*2.76,.030],[1250*5.4,.016]].forEach(function(p,i){
        tonal_(c,{type:"sine",from:p[0],to:p[0]*.996,duration:.55-i*.12,volume:p[1]});
      });
      bruit_(c,{duration:.06,volume:.055,filterType:"highpass",frequency:4200,decay:2.8});
      tonal_(c,{type:"triangle",from:2600,to:2000,duration:.20,volume:.020,delay:.05});
    }},
    /* Perçante : un sifflement fin qui monte, une pointe qui transperce */
    {id:"piercing",duree:450,construire:function(c){
      nappe_(c,{type:"sine",from:900,to:3400,duration:.22,volume:.045,attack:.02});
      nappe_(c,{type:"triangle",from:1800,to:5200,duration:.20,volume:.020,attack:.02});
      bruit_(c,{duration:.06,volume:.05,delay:.19,filterType:"highpass",frequency:5500,decay:2.8});
      tonal_(c,{type:"sine",from:220,to:90,duration:.14,volume:.05,delay:.20});
    }},
    /* Ultime : la charge monte, puis une explosion */
    {id:"ultimate",duree:1100,construire:function(c){
      nappe_(c,{type:"sawtooth",from:140,to:900,duration:.42,volume:.035,attack:.30});
      bruitMonte_(c,{duration:.42,volume:.05,filterType:"bandpass",frequency:600,frequencyEnd:4200,q:.8,pow:2});
      tonal_(c,{type:"sine",from:95,to:32,duration:.55,volume:.16,delay:.42});
      bruit_(c,{duration:.45,volume:.09,delay:.42,filterType:"lowpass",frequency:1400,frequencyEnd:300,decay:1.8});
      bruit_(c,{duration:.20,volume:.04,delay:.44,filterType:"highpass",frequency:5000,decay:2.4});
    }},
    /* Blocage : le bouclier encaisse, un « toc » sourd et un petit tintement de métal */
    {id:"block",duree:450,construire:function(c){
      tonal_(c,{type:"sine",from:190,to:85,duration:.16,volume:.12});
      bruit_(c,{duration:.07,volume:.05,filterType:"lowpass",frequency:800,decay:2.4});
      tonal_(c,{type:"sine",from:760,to:740,duration:.22,volume:.030,delay:.03});
      tonal_(c,{type:"sine",from:760*2.76,to:760*2.76,duration:.08,volume:.012,delay:.03});
    }},
    /* Défense : une aura bleue qui se referme, souffle doux qui monte puis scintille */
    {id:"defensiveBuff",duree:800,construire:function(c){
      nappe_(c,{type:"sine",from:330,to:660,duration:.55,volume:.045,attack:.30});
      nappe_(c,{type:"triangle",from:495,to:990,duration:.55,volume:.020,attack:.30});
      tonal_(c,{type:"sine",from:1320,to:1320,duration:.30,volume:.020,delay:.42});
      bruit_(c,{duration:.18,volume:.012,delay:.45,filterType:"highpass",frequency:7000,decay:2.4});
    }},
    /* Soin : trois notes douces qui montent, chaudes */
    {id:"heal",duree:950,construire:function(c){
      [[523,0],[659,.16],[784,.32]].forEach(function(p){
        nappe_(c,{type:"sine",from:p[0],to:p[0]*1.004,duration:.50,volume:.040,attack:.05,delay:p[1],vibRate:5,vibDepth:3});
        nappe_(c,{type:"sine",from:p[0]*2,to:p[0]*2,duration:.30,volume:.012,attack:.04,delay:p[1]});
      });
      bruit_(c,{duration:.30,volume:.008,delay:.45,filterType:"highpass",frequency:7500,decay:2.4});
    }},
    /* Puissance : une flamme orange qui gronde et monte */
    {id:"offensiveBuff",duree:800,construire:function(c){
      nappe_(c,{type:"sawtooth",from:180,to:520,duration:.45,volume:.030,attack:.25});
      bruitMonte_(c,{duration:.40,volume:.05,filterType:"lowpass",frequency:500,frequencyEnd:2500,pow:1.6});
      tonal_(c,{type:"sine",from:220,to:110,duration:.22,volume:.09,delay:.40});
      bruit_(c,{duration:.16,volume:.04,delay:.40,filterType:"bandpass",frequency:1800,decay:2.2});
    }},
    /* Charge : une accumulation d'énergie qui vrille, puis un déclic quand elle est prête */
    {id:"charge",duree:1000,construire:function(c){
      nappe_(c,{type:"sawtooth",from:70,to:300,duration:.70,volume:.050,attack:.55,vibRate:14,vibDepth:8});
      bruitMonte_(c,{duration:.70,volume:.065,filterType:"bandpass",frequency:300,frequencyEnd:3000,q:1.4,pow:2.4});
      tonal_(c,{type:"square",from:1400,to:1400,duration:.05,volume:.030,delay:.74});
      tonal_(c,{type:"sine",from:2100,to:2100,duration:.16,volume:.030,delay:.76});
    }},
    /* Bonus ultime : une pluie d'étincelles magiques en arpège rapide */
    {id:"ultimateBuff",duree:900,construire:function(c){
      [1047,1319,1568,2093,2637].forEach(function(f,i){
        tonal_(c,{type:"sine",from:f,to:f*1.002,duration:.32,volume:.030,delay:i*.075});
        tonal_(c,{type:"sine",from:f*2.01,to:f*2.01,duration:.16,volume:.010,delay:i*.075});
      });
      bruit_(c,{duration:.30,volume:.014,delay:.30,filterType:"highpass",frequency:8000,frequencyEnd:11000,decay:2.2});
    }},
    /* Paralysie : un arc électrique qui crépite puis se fige */
    {id:"paralyze",duree:750,construire:function(c){
      [0,.05,.11,.15,.22,.27].forEach(function(t,i){
        bruit_(c,{duration:.035,volume:.05,delay:t,filterType:"highpass",frequency:3000+i*400,decay:2.6});
        tonal_(c,{type:"square",from:120+i*45,to:80,duration:.05,volume:.02,delay:t});
      });
      tonal_(c,{type:"sine",from:1500,to:400,duration:.28,volume:.03,delay:.30});
      tonal_(c,{type:"triangle",from:3200,to:3200,duration:.05,volume:.02,delay:.58});
    }},
    /* Hyper Regen : trois pulsations vertes qui montent, comme un cœur qui se régénère */
    {id:"hyperRegen",duree:900,construire:function(c){
      [[392,0],[494,.20],[587,.40]].forEach(function(p){
        tonal_(c,{type:"sine",from:p[0]*.8,to:p[0],duration:.16,volume:.07,delay:p[1]});
        tonal_(c,{type:"sine",from:p[0]*1.6,to:p[0]*2,duration:.12,volume:.02,delay:p[1]});
      });
      nappe_(c,{type:"sine",from:196,to:294,duration:.75,volume:.028,attack:.35});
    }},
    /* Beast Mode : un grondement de bête, rauque, avec un rugissement qui monte */
    {id:"beastMode",duree:1100,construire:function(c){
      nappe_(c,{type:"sawtooth",from:75,to:52,duration:.85,volume:.06,attack:.12,vibRate:26,vibDepth:9});
      nappe_(c,{type:"square",from:150,to:98,duration:.75,volume:.020,attack:.10,vibRate:22,vibDepth:12});
      bruit_(c,{duration:.7,volume:.05,filterType:"bandpass",frequency:600,frequencyEnd:250,q:.8,decay:1.2});
      bruit_(c,{duration:.10,volume:.05,filterType:"lowpass",frequency:700,decay:2.2});
    }},
    /* Mega Buff : un accord puissant qui gonfle, avec un éclat lumineux */
    {id:"megaBuff",duree:1300,construire:function(c){
      [262,330,392,523].forEach(function(f,i){
        nappe_(c,{type:"triangle",from:f,to:f*1.003,duration:.9,volume:.040,attack:.35,delay:i*.03});
        nappe_(c,{type:"sine",from:f*2,to:f*2,duration:.7,volume:.012,attack:.30,delay:i*.03});
      });
      tonal_(c,{type:"sine",from:2093,to:2093,duration:.5,volume:.025,delay:.40});
      tonal_(c,{type:"sine",from:2637,to:2637,duration:.5,volume:.020,delay:.48});
      bruit_(c,{duration:.3,volume:.015,delay:.42,filterType:"highpass",frequency:7000,decay:2.2});
    }},
    /* Oh Shit : une alarme affolée, deux tons qui s'alternent vite */
    {id:"ohShit",duree:750,construire:function(c){
      [0,.13,.26,.39,.52].forEach(function(t,i){
        tonal_(c,{type:"square",from:i%2?660:990,to:i%2?640:960,duration:.11,volume:.035,delay:t});
      });
      tonal_(c,{type:"sine",from:90,to:60,duration:.5,volume:.06,delay:.05});
    }},
    /* Move 69 : un sifflet à coulisse malicieux qui monte puis retombe, avec un « boing » */
    {id:"move69",duree:900,construire:function(c){
      nappe_(c,{type:"sine",from:300,to:1300,duration:.32,volume:.05,attack:.04,vibRate:7,vibDepth:20});
      nappe_(c,{type:"sine",from:1300,to:420,duration:.32,volume:.05,attack:.02,delay:.32,vibRate:7,vibDepth:20});
      tonal_(c,{type:"triangle",from:180,to:520,duration:.12,volume:.06,delay:.66});
      tonal_(c,{type:"triangle",from:520,to:150,duration:.20,volume:.05,delay:.76});
    }}
  ];
  function jouerCompetence_(son){
    return function(){return jouerWebAudio_(son.duree,son.construire);};
  }

  var JOUEURS={
    fight:voixFight_,
    bossAppear:gongBoss_,
    timeMachine:voyageTemps_,
    victory:victoireBoss_,
    nuke:nuke_,
    defeat:defaite_,
    flee:fuite_,
    btPlus:btPlus_,
    btMinus:btMoins_,
    btCap:btCap_,
    tmPlus:tmPlus_,
    tmMinus:tmMoins_,
    tmCap:tmCap_,
    bloodPlus:bloodPlus_,
    bloodMinus:bloodMoins_,
    bloodCap:bloodCap_,
    menuUnlock:menuDebloque_,
    purchase:caisse_,
    purchaseGold:orJouer_,
    equip:equipJouer_,
    purchaseGem:gemmeJouer_,
    menuNav:menuNav_,
    shopDoor:porteMagasin_,
    achievement:succes_,
    joueurConnecte:joueurConnecte_,
    chestOpen:coffreOuverture_,
    chestClose:coffreFermeture_,
    mergeArmor:fusionArmure_,
    mergeAccessory:fusionAccessoire_,
    mergeWeapon:fusionArme_,
    uiClick:clicInterface_,
    boostPower:boostPower_,
    boostToughness:boostToughness_,
    boostSpecial:boostSpecial_,
    boostAllAbsorption:boostAllAbsorption_,
    purchaseRefused:achatRefuse_,
    setComplete:setComplet_,
    moneyPit:moneyPit_,
    dailySpin:dailySpin_
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

  SONS_COMPETENCE.forEach(function(son){
    DEFINITIONS["skill_"+son.id]={group:"adventure-skill",priority:58,maxAgeMs:700};
    JOUEURS["skill_"+son.id]=jouerCompetence_(son);
  });

  Object.keys(SONS_MENU_V1).forEach(function(id){
    DEFINITIONS["menu_"+id]={group:"ui-nav",priority:20,maxAgeMs:500};
    JOUEURS["menu_"+id]=function(){return jouerWebAudio_(SONS_MENU_V1[id].duree,SONS_MENU_V1[id].construire);};
  });
  JOUEURS.shopSteps=pasBoutique_;
  /* Un rituel par sort de Blood : même groupe, le plus récent remplace celui qui attend ; maxAge long (un rituel ne se perd pas). */
  Object.keys(SONS_SORT_BLOOD_V1).forEach(function(id){
    DEFINITIONS["sortBlood_"+id]={group:"blood-spell",priority:62,maxAgeMs:900};
    JOUEURS["sortBlood_"+id]=function(){return jouerWebAudio_(SONS_SORT_BLOOD_V1[id].duree,SONS_SORT_BLOOD_V1[id].construire);};
  });

  /*
   * Sons de foule (Norman, 2026-10-04 : « un son de gens qui applaudissent quand on bat un boss pour la première fois, environ 3 secondes ; un bruit de gens qui rigolent quand on fuit, en plus du son de base »).
   * Aucun fichier : tout est synthétisé. Ils se jouent EN PLUS du son de victoire ou de fuite, donc hors file d'attente (jamais l'un à la place de l'autre).
   * - Rires : huit voix qui lancent des « ha » en rafale (dents de scie passées dans trois formants de la voyelle A), hauteurs et départs différents, qui ralentissent et s'éteignent ; durée 2,5 s.
   */
  function rireVoix_(c,f0,debut,amp,nSyl){
    var t0=c.currentTime+debut;
    var osc=c.createOscillator();
    osc.type="sawtooth";
    var g=c.createGain();
    g.gain.setValueAtTime(.0001,t0);
    [[800,1,9],[1250,.55,11],[2700,.22,13]].forEach(function(F){
      var bp=c.createBiquadFilter();
      bp.type="bandpass";
      bp.frequency.setValueAtTime(F[0]*(.94+Math.random()*.12),t0);
      bp.Q.setValueAtTime(F[2],t0);
      var fg=c.createGain();
      fg.gain.setValueAtTime(F[1],t0);
      osc.connect(bp);
      bp.connect(fg);
      fg.connect(g);
    });
    g.connect(master||c.destination);
    var t=t0;
    var pas=.17+Math.random()*.035;
    var hauteur=f0*1.3;
    for(var i=0;i<nSyl;i+=1){
      var a=amp*Math.pow(.88,i);
      g.gain.setValueAtTime(.0001,t);
      g.gain.linearRampToValueAtTime(a,t+.02);
      g.gain.exponentialRampToValueAtTime(.0001,t+.12);
      osc.frequency.setValueAtTime(hauteur*(.97+Math.random()*.06),t);
      osc.frequency.exponentialRampToValueAtTime(hauteur*.8,t+.12);
      hauteur*=.965;
      t+=pas*(1+.05*i);
    }
    osc.start(t0);
    osc.stop(t+.2);
  }
  function rireConstruire_(c){
    [[105,0,.5],[122,.05,.55],[140,.1,.5],[165,.02,.45],[190,.08,.5],[215,.16,.45],[245,.12,.4],[270,.21,.38]].forEach(function(v){
      rireVoix_(c,v[0]*(.97+Math.random()*.06),v[1]+Math.random()*.04,v[2],6+Math.floor(Math.random()*3));
    });
    bruit_(c,{duration:2.2,volume:.012,delay:.05,filterType:"bandpass",frequency:1800,q:.6,decay:.9});
  }
  var SONS_FOULE_V1={
    laugh:{duree:2500,construire:rireConstruire_}
  };
  function jouerFoule_(id){
    var son=SONS_FOULE_V1[id];
    if(!son)return false;
    jouerWebAudio_(son.duree,son.construire);
    return true;
  }

  /*
   * Petit son quand la génération des voix est terminée (Norman, 2026-10-04) : deux notes claires qui montent (do-sol aigus), 0,55 s. Joué par le menu Admin des voix, même réduit en petit menu flottant.
   */
  function voixPreteConstruire_(c){
    tonal_(c,{type:"sine",from:1046.5,to:1046.5,duration:.28,volume:.07});
    tonal_(c,{type:"triangle",from:2093,to:2093,duration:.2,volume:.018});
    tonal_(c,{type:"sine",from:1568,to:1568,duration:.36,volume:.07,delay:.16});
    tonal_(c,{type:"triangle",from:3136,to:3136,duration:.24,volume:.018,delay:.16});
  }
  DEFINITIONS.voiceDone={group:"admin-voice",priority:40,maxAgeMs:1500};
  JOUEURS.voiceDone=function(){return jouerWebAudio_(560,voixPreteConstruire_);};

  function demander_(name){
    name=String(name||"");
    if(SONS_FOULE_V1[name])return jouerFoule_(name);
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

  /* Navigation : un clic sur un bouton de menu qui change de menu joue une petite note (jamais pour le menu déjà ouvert). */
  document.addEventListener("click",function(ev){
    var b=ev.target&&ev.target.closest?ev.target.closest(".soreal-idle-nav-button-v28"):null;
    if(!b||b.classList.contains("active")||b.closest(".edition"))return;
    /* Le Shop a son propre son : la porte d'un vieux magasin et ses clochettes. */
    var idMenu=b.getAttribute("data-menu-id-v1");
    demander_(idMenu==="shop"?"shopDoor":(DEFINITIONS["menu_"+idMenu]?"menu_"+idMenu:"menuNav"));
  },{capture:true,passive:true});

  /* Rayons des boutiques (onglets EXP et AP, bascule EXP / AP) : trois pas, jamais pour l'onglet déjà ouvert. */
  document.addEventListener("click",function(ev){
    var t=ev.target&&ev.target.closest?ev.target.closest(".soreal-idle-exp-tab-v212,.soreal-idle-shop-onglet-v1"):null;
    if(!t||t.classList.contains("actif")||t.classList.contains("active"))return;
    demander_("shopSteps");
  },{capture:true,passive:true});

  document.addEventListener("pointerdown",debloquer_,{capture:true,passive:true});
  document.addEventListener("touchstart",debloquer_,{capture:true,passive:true});
  document.addEventListener("click",debloquer_,{capture:true,passive:true});

  window.__SOREAL_IDLE_AUDIO_V199__={
    unlock:debloquer_,
    play:demander_,
    /* Constructeurs bruts (vérifications hors ligne : rendu dans un OfflineAudioContext). */
    builders:{
      bossSounds:SONS_BOSS.map(function(x){return{nom:x.nom,duree:x.duree,construire:x.construire};}),
      victorySounds:SONS_VICTOIRE.map(function(x){return{nom:x.nom,duree:x.duree,construire:x.construire};}),
      timeMachine:{duree:3000,construire:voyageTempsConstruire_},
      defeat:{duree:1900,construire:defaiteConstruire_},
      purchaseGold:{duree:1000,construire:orConstruire_},
      equip:{duree:520,construire:equipConstruire_},
      skills:SONS_COMPETENCE.map(function(x){return{nom:x.id,duree:x.duree,construire:x.construire};}),
      purchaseGem:{duree:1300,construire:gemmeConstruire_},
      setComplete:{duree:1080,construire:setCompletConstruire_},
      shopDoor:{duree:1700,construire:porteMagasinConstruire_},
      shopSteps:{duree:900,construire:pasBoutiqueConstruire_},
      shopStepsVariantes:VARIANTES_PAS_V1.map(function(v){return{nom:v.nom,tempo:v.tempo,construire:function(c,nb,tempo,alea){pasVarianteConstruire_(c,v,nb,tempo,alea);}};}),
      sortsBlood:Object.keys(SONS_SORT_BLOOD_V1).map(function(id){return{nom:id,duree:SONS_SORT_BLOOD_V1[id].duree,construire:SONS_SORT_BLOOD_V1[id].construire};}),
      menus:Object.keys(SONS_MENU_V1).map(function(id){return{nom:id,duree:SONS_MENU_V1[id].duree,construire:SONS_MENU_V1[id].construire};}),
      voiceDone:{duree:560,construire:voixPreteConstruire_},
      foule:Object.keys(SONS_FOULE_V1).map(function(id){return{nom:id,duree:SONS_FOULE_V1[id].duree,construire:SONS_FOULE_V1[id].construire};}),
      moneyPit:{duree:1500,construire:moneyPitConstruire_},
      dailySpin:{duree:2200,construire:dailySpinConstruire_},
      clavierClic:{duree:200,construire:function(c){clavierClic_(c,false);}},
      clavierClicGrave:{duree:200,construire:function(c){clavierClic_(c,true);}}
    },
    fight:function(){return demander_("fight");},
    bossAppear:function(){return demander_("bossAppear");},
    timeMachine:function(){return demander_("timeMachine");},
    dernierSonBoss:function(){return dernierSonBoss;},
    dernierSonVictoire:function(){return dernierSonVictoire;},
    victory:function(){return demander_("victory");},
    nuke:function(){return demander_("nuke");},
    defeat:function(){return demander_("defeat");},
    flee:function(){return demander_("flee");},
    voiceDone:function(){return demander_("voiceDone");},
    laugh:function(){return demander_("laugh");},
    btPlus:function(){return demander_("btPlus");},
    btMinus:function(){return demander_("btMinus");},
    btCap:function(){return demander_("btCap");},
    tmPlus:function(){return demander_("tmPlus");},
    tmMinus:function(){return demander_("tmMinus");},
    tmCap:function(){return demander_("tmCap");},
    bloodPlus:function(){return demander_("bloodPlus");},
    bloodMinus:function(){return demander_("bloodMinus");},
    bloodCap:function(){return demander_("bloodCap");},
    menuUnlock:function(){return demander_("menuUnlock");},
    purchase:function(){return demander_("purchase");},
    purchaseGold:function(){return demander_("purchaseGold");},
    equip:function(){return demander_("equip");},
    purchaseGem:function(){return demander_("purchaseGem");},
    menuNav:function(){return demander_("menuNav");},
    shopDoor:function(){return demander_("shopDoor");},
    shopSteps:function(){return demander_("shopSteps");},
    menu:function(id){return demander_("menu_"+id);},
    sortBlood:function(id){return demander_("sortBlood_"+id);},
    achievement:function(){return demander_("achievement");},
    joueurConnecte:function(){return demander_("joueurConnecte");},
    chestOpen:function(){return demander_("chestOpen");},
    chestClose:function(){return demander_("chestClose");},
    mergeArmor:function(){return demander_("mergeArmor");},
    mergeAccessory:function(){return demander_("mergeAccessory");},
    mergeWeapon:function(){return demander_("mergeWeapon");},
    uiClick:function(){return demander_("uiClick");},
    boostPower:function(){return demander_("boostPower");},
    boostToughness:function(){return demander_("boostToughness");},
    boostSpecial:function(){return demander_("boostSpecial");},
    boostAllAbsorption:function(){return demander_("boostAllAbsorption");},
    setComplete:function(){return demander_("setComplete");},
    moneyPit:function(){return demander_("moneyPit");},
    dailySpin:function(){return demander_("dailySpin");},
    debugState:function(){
      return {
        active:actif?actif.name:"",
        pending:file.map(function(x){return x.name;})
      };
    }
  };
})();
