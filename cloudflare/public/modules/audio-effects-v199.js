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
    bossAppear:{group:"combat-boss",priority:75,maxAgeMs:1400},
    defeat:{group:"combat-end",priority:100,maxAgeMs:2800},
    chestOpen:{group:"chest",priority:35,maxAgeMs:1000},
    chestClose:{group:"chest",priority:35,maxAgeMs:1000},
    mergeArmor:{group:"inventory-merge",priority:45,maxAgeMs:1100},
    mergeWeapon:{group:"inventory-merge",priority:50,maxAgeMs:1100},
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
    return reveiller_().then(function(c){
      if(c){
        /*
         * V202 — annonceur plus sombre : grondement grave + attaque sale,
         * puis la voix système très abaissée. Aucun sample audio embarqué.
         */
        tonal_(c,{type:"sawtooth",from:96,to:46,duration:.58,volume:.078});
        tonal_(c,{type:"square",from:64,to:41,duration:.46,volume:.048,delay:.025});
        tonal_(c,{type:"sine",from:49,to:33,duration:.72,volume:.105,delay:.055});
        bruit_(c,{
          duration:.20,volume:.040,
          filterType:"lowpass",frequency:680,frequencyEnd:115,decay:2.7
        });
      }

      if(
        !window.speechSynthesis||
        typeof window.SpeechSynthesisUtterance!=="function"
      ){
        return attendre_(520);
      }

      return new Promise(function(resolve){
        var fini=false;
        var terminer=function(){
          if(fini)return;
          fini=true;
          resolve();
        };

        try{
          var synth=window.speechSynthesis;
          var utterance=new SpeechSynthesisUtterance("FIGHT!");
          utterance.lang="en-US";
          utterance.rate=.72;
          utterance.pitch=.10;
          utterance.volume=1;

          var voices=typeof synth.getVoices==="function"?synth.getVoices():[];
          if(Array.isArray(voices)&&voices.length){
            var english=voices.filter(function(v){
              return /^en(?:-|_)/i.test(String(v&&v.lang||""));
            });
            var preferred=english.find(function(v){
              return /male|daniel|fred|alex|david|mark|george|guy|english united states/i
                .test(String(v&&v.name||""));
            })||english[0];
            if(preferred)utterance.voice=preferred;
          }

          utterance.onend=terminer;
          utterance.onerror=terminer;

          /*
           * La file native du navigateur ne doit jamais devenir une
           * deuxième file audio parallèle à la nôtre.
           */
          try{synth.cancel();}catch(_){}
          synth.speak(utterance);

          // Filet WebView : certains moteurs oublient parfois onend.
          setTimeout(terminer,1550);
        }catch(_){
          terminer();
        }
      });
    });
  }

  function gongBoss_(){
    return jouerWebAudio_(1320,function(c){
      [
        [112,1.28,.105],
        [181,1.18,.068],
        [274,1.00,.043],
        [386,.86,.030],
        [517,.68,.019]
      ].forEach(function(p,index){
        tonal_(c,{
          type:index<2?"sine":"triangle",
          from:p[0],to:p[0]*.986,
          duration:p[1],volume:p[2],delay:index*.007
        });
      });
      bruit_(c,{
        duration:.11,volume:.022,
        frequency:1500,frequencyEnd:280,decay:3.4
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
    defeat:defaite_,
    chestOpen:coffreOuverture_,
    chestClose:coffreFermeture_,
    mergeArmor:fusionArmure_,
    mergeWeapon:fusionArme_,
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
    defeat:function(){return demander_("defeat");},
    chestOpen:function(){return demander_("chestOpen");},
    chestClose:function(){return demander_("chestClose");},
    mergeArmor:function(){return demander_("mergeArmor");},
    mergeWeapon:function(){return demander_("mergeWeapon");},
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
